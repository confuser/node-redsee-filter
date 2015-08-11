var assert = require('assert')
  , redis = require('redis')
  , filter = require('../lib/filters/phrases')
  , whitelistFixture = require('./fixtures/whitelist-phrases')()
  , blacklistFixture = require('./fixtures/blacklist-phrases')()
  , client

require('redis-scanstreams')(redis)

describe('Phrases Filter', function () {
  before(function (done) {
    client = redis.createClient()
    client.prefix = 'test'

    client.sadd([ 'testredsee-whitelist:phrases' ].concat(whitelistFixture))
    client.sadd([ 'testredsee-blacklist:phrases' ].concat(blacklistFixture))

    client.on('ready', done)
  })

  after(function () {
    client.del('testredsee-whitelist:phrases')
    client.del('testredsee-blacklist:phrases')
  })

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

  it('should handle redis errors', function (done) {
    var normalisedMsg = 'test'
      , res = {}
      , errorClient = { sismember: function (key, value, cb) { cb(new Error('testing error')) } }

    filter(errorClient, res, normalisedMsg, function () {
      assert.deepEqual(res, { phrases: [] })

      done()
    })
  })

})
