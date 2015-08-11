var assert = require('assert')
  , redis = require('redis')
  , filter = require('../lib/filters/ascii')
  , blacklistFixture = require('./fixtures/blacklist-ascii')()
  , client

require('redis-scanstreams')(redis)

describe('Phrases Filter', function () {
  before(function (done) {
    client = redis.createClient()
    client.prefix = 'test'

    client.sadd([ 'testredsee-blacklist:ascii' ].concat(blacklistFixture))

    client.on('ready', done)
  })

  after(function () {
    client.del('testredsee-blacklist:ascii')
  })

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
      , errorClient = { sismember: function (key, value, cb) { cb(new Error('testing error')) } }

    filter(errorClient, res, normalisedMsg, function () {
      assert.deepEqual(res, { ascii: [] })

      done()
    })
  })

})
