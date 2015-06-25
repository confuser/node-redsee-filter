var removeDiacritics = require('diacritics').remove

module.exports = function (client, res, msg, cb) {
  // Remove case sensitivity
  var normalisedMsg = msg.toLowerCase()

  // Convert international characters
  normalisedMsg = removeDiacritics(normalisedMsg)

  cb(null, normalisedMsg)
}
