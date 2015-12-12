var assert = require('assert')
  , filter = require('../lib/filters/phrases')
  , client = require('./client')()

describe('Phrases Filter', function () {

  it('should find blacklisted phrases', function (done) {
    var normalisedMsg = 'you are such an ass'
      , res = {}

    filter(client, res, normalisedMsg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { phrases: [ 'you ass' ] })

      done()
    })
  })

  it('should ignore whitelisted phrases', function (done) {
    var normalisedMsg = 'this is some sexy shit right here'
      , res = {}

    filter(client, res, normalisedMsg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { phrases: [] })

      done()
    })
  })

  it('should remove phrases from the message', function (done) {
    var normalisedMsg = 'you ass this is some sexy shit right here'
      , res = {}

    filter(client, res, normalisedMsg, function (error, msg) {
      if (error) return done(error)

      assert.equal(msg, ' this is some sexy shit right here')

      done()
    })
  })

  it('should handle errors', function (done) {
    var normalisedMsg = 'test'
      , res = {}
      , errorClient =
        { whitelist:
          { phrases:
            { contains: function (key, cb) { cb(new Error('testing error')) } }
          }
        , blacklist:
          { phrases:
            { contains: function (key, cb) { cb(new Error('testing error')) } }
          }
        }

    filter(errorClient, res, normalisedMsg, function () {
      assert.deepEqual(res, { phrases: [] })

      done()
    })
  })

})
