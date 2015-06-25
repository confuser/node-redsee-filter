var async = require('async')
  , filters =
    [ require('./filters/email')
    , require('./filters/url')
    , require('./filters/ascii')
    // , require('./filters/currency') Broken :(, thinks p3ni5 is a currency value
    // , require('./filter/phone-number') Much complicated :(
    , require('./filters/normalise')
    , require('./filters/phrases')
    , require('./filters/words')
    ]

module.exports = function (client, msg, cb) {

  var res = { }
  , filterFns = []

  filters.forEach(function (filter, i) {
    if (i === 0) {
      filterFns.push(filter.bind(null, client, res, msg))
    } else {
      filterFns.push(filter.bind(null, client, res))
    }
  })

  async.waterfall(filterFns, function (error) {
    cb(error, res)
  })

}
