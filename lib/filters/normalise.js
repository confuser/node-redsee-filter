var removeDiacritics = require('diacritics').remove

module.exports = function (client, res, msg, cb) {
  // Remove case sensitivity
  var normalisedMsg = msg.toLowerCase()

  // Convert international characters
  normalisedMsg = removeDiacritics(normalisedMsg)

  // Convert symbols
  normalisedMsg = normalisedMsg
    .replace(/\$/g, '\s')
    .replace(/\£/g, '\e')
    .replace(/[\W_]+/g, ' ') // Convert any other non-alphanumeric

  cb(null, normalisedMsg)
}
