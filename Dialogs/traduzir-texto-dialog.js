const builder = require('botbuilder')
const validUrl = require('valid-url')

const AzureTranslate = require('../Services/azure-translate')
const utils = require('../utils')

module.exports = [
    (session, args, next) => {
        builder.Prompts.text(session, 'Digite o texto por favor.')
    },
    (session, result) => {
        new AzureTranslate().translateText(result.response)
            .then(traducaoSucces(session))
            .catch(traducaoError(session))
    }
]

const traducaoSucces = (session) => {
    return (result) => {
        session.send(`Foi digitado: **${result.text}**\n\n\nFoi traduzido para: **${result.translated}**`)
    }
}

const traducaoError = (session) => {
    return (error) => {
        let errorMessage = 'Opa, algo deu errado. Tente novamente depois.'
        if(error.message && error.message.indexOf('Access denied') > -1)
            errorMessage += '\n' + error.message
        session.send(errorMessage)
    }
}