var async = require('async')
  , escapeRegExp = require('../escape-regex')

module.exports = function (client, res, msg, cb) {
  var words = msg.match(/\S+/g)
    , filteredMsg = msg

  async.filter(words, function (word, filterCb) {
    client.sismember(client.prefix + 'redsee-blacklist:ascii', word, function (error, exists) {
      if (error) return filterCb(false)

      if (exists) {
        filteredMsg = filteredMsg.replace(new RegExp(escapeRegExp(word), 'g'), '')
      }

      filterCb(exists)
    })
  }, function (blacklisted) {
    res.ascii = blacklisted

    cb(null, filteredMsg)
  })

}
