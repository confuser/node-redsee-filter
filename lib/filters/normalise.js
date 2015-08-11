var removeDiacritics = require('diacritics').remove

module.exports = function (client, res, msg, cb) {
  // Remove case sensitivity
  var normalisedMsg = msg.toLowerCase()

  // Convert international characters
  normalisedMsg = removeDiacritics(normalisedMsg)

  // Remove repeated characters
  normalisedMsg = normalisedMsg.replace(/([a-z])\1{2,}/, '$1')

  cb(null, normalisedMsg)
}
