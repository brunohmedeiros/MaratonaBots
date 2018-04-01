const needle = require('needle')
const moment = require('moment')

const hasImageAttachment = (session) => {
    return session.message.attachments.length > 0 &&
        session.message.attachments[0].contentType.indexOf('image') !== -1
}

const requiresToken = (message) => {
    return ['skype', 'msteams'].indexOf(message.source) !== -1
}

const parseAnchorTag = (input) => {
    const match = input.match('^<a href=\"([^\"]*)\">[^<]*</a>$')
    return match && match[1] ? match[1] : null
}

const getImageStreamFromMessage = (message, connector) => {
    const headers = {}
    const attachment = message.attachments[0]
    if(requiresToken(message)) {
        connector.getAccessToken((error, token) => {
            headers['Authorization'] = `Bearer ${token}`
            headers['Content-Type'] = 'application/octet-stream'
            return needle.get(attachment.contentUrl, { headers: headers })
        })
    }
    headers['Content-Type'] = attachment.contentType
    return needle.get(attachment.contentUrl, { headers: headers })
}

module.exports = {
    hasImageAttachment,
    requiresToken,
    parseAnchorTag,
    getImageStreamFromMessage
}