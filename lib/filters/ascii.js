var async = require('async')
  , splitPhrases = require('../split-phrases')
  , escapeRegExp = require('../escape-regex')

module.exports = function (client, res, msg, cb) {
  var phrases = splitPhrases(msg)
    , filteredMsg = msg

  async.filter(phrases, function (phrase, filterCb) {
    client.sismember('redsee-blacklist:ascii', phrase, function (error, exists) {
      if (error) return filterCb(false)

      if (exists) {
        filteredMsg = filteredMsg.replace(new RegExp(escapeRegExp(phrase), 'g'), '')
      }

      filterCb(exists)
    })
  }, function (blacklisted) {
    res.ascii = blacklisted

    cb(null, filteredMsg)
  })

}
