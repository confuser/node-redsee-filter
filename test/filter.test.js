var assert = require('assert-diff')
  , filter = require('../lib/filter')
  , client = require('./client')()

describe('Filter', function () {

  it('should match all', function (done) {
    var msg = 'This contains fucking swearing, using 8=== p3n15 leet you ass as well as a plethora of emails' +
      ' like example@example.net example@example.com, domains such as www.frostcast.net notreal.xxx http://spam.net' +
      ' and this is a good example of how fast it takes to analyse text of this length'

    filter(client, msg, function (error, res) {
      if (error) return done(error)

      var expected =
      { emails: [ 'example@example.net' ]
      , urls: [ 'notreal.xxx', 'http://spam.net' ]
      , phrases: [ 'you ass' ]
      , words: [ 'penis', 'fuck' ]
      , ascii: [ '8===' ]
      }

      assert.deepEqual(res, expected)

      done()
    })
  })

})
