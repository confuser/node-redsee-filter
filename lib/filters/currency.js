var currencyMatcher = require('validity-currency/lib/currency-validator')

module.exports = function (client, res, msg, cb) {
  var matches = currencyMatcher.match(msg)

  if (!matches || matches.length === 0) return cb(null, msg)

  res.currencies = matches
  msg = currencyMatcher.replace(msg, '')

  cb(null, msg)
}
