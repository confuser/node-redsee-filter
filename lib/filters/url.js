var multimatch = require('multimatch')
  , urlMatcher = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/ig

module.exports = function (client, res, msg, cb) {
  var matches = msg.match(urlMatcher)
    , whitelisted = {}

  if (!matches || matches.length === 0) return cb(null, msg)

  // TODO Change to for loop for performance boost?
  matches.forEach(function (match) {
    whitelisted[match] = 0
  })

  // TODO implement cache to avoid constant multimatch
  client.whitelist.urls.stream({ count: 100 })
    .on('data', function (url) {
      var found = multimatch(matches, url)

      if (found && found.length > 0) {
        found.forEach(function (match) {
          whitelisted[match]++
        })
      }
    })
    .on('error', cb)
    .on('end', function () {
      var blacklisted = []

      Object.keys(whitelisted).forEach(function (url) {
        if (whitelisted[url] === 0) blacklisted.push(url)
      })

      res.urls = blacklisted
      msg = msg.replace(urlMatcher, '')

      cb(null, msg)
    })

}
