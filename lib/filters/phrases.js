var async = require('async')
  , splitPhrases = require('../split-phrases')
  , escapeRegExp = require('../escape-regex')

module.exports = function (client, res, msg, cb) {
  var phrases = splitPhrases(msg.toLowerCase())
    , filteredMsg = msg

  async.reject(phrases, function (phrase, rejectCb) {
    client.sismember(client.prefix + 'redsee-whitelist:phrases', phrase, function (error, exists) {
      if (error) return rejectCb(false)

      if (exists) {
        filteredMsg = filteredMsg.replace(new RegExp('\\b' + escapeRegExp(phrase) + '\\b', 'g'), '')
      }

      rejectCb(exists)
    })
  }
  , function (filteredPhrases) {
    async.filter(filteredPhrases, function (phrase, filterCb) {
      client.sismember(client.prefix + 'redsee-blacklist:phrases', phrase, function (error, exists) {
        if (error) return filterCb(false)

        if (exists) {
          filteredMsg = filteredMsg.replace(new RegExp('\\b' + escapeRegExp(phrase) + '\\b', 'g'), '')
        }

        filterCb(exists)
      })
    }, function (blacklisted) {
      res.phrases = blacklisted

      cb(null, filteredMsg)
    })
  })

}
