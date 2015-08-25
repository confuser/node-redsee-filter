var removeDiacritics = require('diacritics').remove

module.exports = function (client, res, msg, cb) {
  // Convert international characters
  var normalisedMsg = removeDiacritics(msg)

  // Remove repeated characters
  normalisedMsg = normalisedMsg.replace(/([a-z])\1{2,}/, '$1')

  cb(null, normalisedMsg)
}
