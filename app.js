require('dotenv-extended').load()

const builder = require('botbuilder')
const restify = require('restify')
const request = require('request')

const utils = require('./utils')
const descreverImagemDialog = require('./Dialogs/descrever-imagem-dialog')
const traduzirTextoDialog   = require('./Dialogs/traduzir-texto-dialog')

const port = process.env.port || process.env.PORT || 3978
const server = restify.createServer()
server.listen(port, () => {
    console.log(`${server.name} listening to ${server.url}`)
})

const connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
})

const bot = new builder.UniversalBot(connector)
bot.set('storage', new builder.MemoryBotStorage())
server.post('/api/messages', connector.listen())

const recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL)
const intents = new builder.IntentDialog({
    recognizers: [recognizer]
})

intents.onDefault((session, args) => {
    session.send(`Não entendi **${session.message.text}**, Tente novamente, sou um Bot e nao conheço muita coisa.`)
})

bot.on('conversationUpdate', (update) => {
    if (update.membersAdded) {
        update.membersAdded.forEach( (identity) => {
            if (identity.id === update.address.bot.id) {
                bot.loadSession(update.address, (err, session) => {
                    if(err)
                        return err
                    const message = 'Olá, sou um Bot que pode ajudar descrevendo imagens, traduzindo frases e até informando a cotação de algumas moedas, o que deseja?'
                    session.send(message)
                })
            }
        })
    }
})

intents.matches('sobre', (session, args)=>{
    session.send('Sou um Bot que pode ajudar descrevendo imagens, traduzindo frases e até informando a cotação de algumas moedas!')
})

intents.matches('foto', descreverImagemDialog)

intents.matches('tradutor', traduzirTextoDialog)

intents.matches('cotacao', (session, args, next) => {
    const moedas = builder.EntityRecognizer.findAllEntities(args.entities, 'moeda').map(m => m.entity).join(', ')
    const endpoint = `${process.env.COTACAO_ENDPOINT}${moedas}`
    session.send('Aguarde por favor, estou verificando...')
    request(endpoint, (error, response, body) => {
        if(error || !body)
            return session.send('Opa, algo deu errado. Tente novamente depois.')
        const cotacoes = JSON.parse(body);
        session.send(cotacoes.map(m => `${m.nome}: ${m.valor}` ).join(', '))
    })
})

bot.dialog('/', intents)