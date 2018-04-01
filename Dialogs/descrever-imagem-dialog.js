const builder = require('botbuilder')
const validUrl = require('valid-url')

const AzureComputerVision = require('../Services/azure-computer-vision')
const utils = require('../utils')

module.exports = [
    (session, args, next) => {
        const options = {
            listStyle: builder.ListStyle.button,
            retryPrompt: 'Deseja alguma destas opções?'
        }
        builder.Prompts.choice(
            session,
            'OK... Como deseja enviar a imagem?',
            ['URL', 'Anexar'],
            options
        )
    },
    (session, results) => {
        switch(results.response.index){
            case 1:
                builder.Prompts.attachment(session, 'Ok, envie a imagem em anexo.')
                break
            default:
                builder.Prompts.text(session, 'OK, envie a URL da imagem.')
                break
        }
    },
    (session, results) => {
        const computerVisionService = new AzureComputerVision()
        if(utils.hasImageAttachment(session)){
            const stream = utils.getImageStreamFromMessage(session.message)
            computerVisionService.findFromStrem(stream)
                .then(descreverSucces(session))
                .catch(descreverError(session))
        }
        else {
            const imageUrl = utils.parseAnchorTag(session.message.text) || (validUrl.isUri(session.message.text) ? session.message.text : null)
            if(imageUrl){
                computerVisionService.findFromUrl(imageUrl)
                    .then(descreverSucces(session))
                    .catch(descreverError(session))
            }
            else {
                session.send('Esta link está com alguma problema... Por favor, tente novamente.')
            }
        }
    }
]

const descreverSucces = (session) => {
    return (result) => {
        if(!result)
            return session.send('Não consegui entender esta imagem.')

        const message = `Descrição: **${result.description.captions[0].text}**\n\n`
        session.send(message)
    }
}

const descreverError = (session) => {
    return (error) => {
        let errorMessage = 'Opa, algo deu errado. Tente novamente depois.'
        if(error.message && error.message.indexOf('Access denied') > -1)
            errorMessage += '\n' + error.message
        session.send(errorMessage)
    }
}