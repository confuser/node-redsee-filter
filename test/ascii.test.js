var assert = require('assert')
  , filter = require('../lib/filters/ascii')
  , client = require('./client')()

describe('ASCII Filter', function () {

  it('should find blacklisted ascii', function (done) {
    var normalisedMsg = '8=== (.)(.)'
      , res = {}

    filter(client, res, normalisedMsg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { ascii: [ '8===', '(.)(.)' ] })

      done()
    })
  })

  it('should remove ascii from the message', function (done) {
    var normalisedMsg = 'you massive 8==='
      , res = {}

    filter(client, res, normalisedMsg, function (error, msg) {
      if (error) return done(error)

      assert.equal(msg, 'you massive ')

      done()
    })
  })

  it('should handle redis errors', function (done) {
    var normalisedMsg = 'test'
      , res = {}
      , errorClient =
        { blacklist:
          { ascii:
            { contains: function (key, cb) { cb(new Error('testing error')) } }
          }
        }

    filter(errorClient, res, normalisedMsg, function () {
      assert.deepEqual(res, { ascii: [] })

      done()
    })
  })

})
