var multimatch = require('multimatch')
  , emailMatcher = /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/ig

module.exports = function (client, res, msg, cb) {
  var matches = msg.match(emailMatcher)
    , whitelisted = {}

  if (!matches || matches.length === 0) return cb(null, msg)

  // TODO Change to for loop for performance boost?
  matches.forEach(function (match) {
    whitelisted[match] = 0
  })

  // TODO implement cache to avoid constant multimatch
  client.sscan(client.prefix + 'redsee-whitelist:emails', { count: 100 })
    .on('data', function (email) {
      var found = multimatch(matches, email)

      if (found && found.length > 0) {
        found.forEach(function (match) {
          whitelisted[match]++
        })
      }
    })
    .on('error', cb)
    .on('end', function () {
      var blacklisted = []

      Object.keys(whitelisted).forEach(function (email) {
        if (whitelisted[email] === 0) blacklisted.push(email)
      })

      res.emails = blacklisted
      msg = msg.replace(emailMatcher, '')

      cb(null, msg)
    })

}
