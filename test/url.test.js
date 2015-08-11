var assert = require('assert')
  , fakeRedis = require('fakeredis')
  , filter = require('../lib/filters/url')
  , whitelistFixture = require('./fixtures/whitelist-urls')()
  , client

require('redis-scanstreams')(fakeRedis)

describe('URL Filter', function () {
  before(function () {
    client = fakeRedis.createClient(null, null, { fast: true })
    client.prefix = 'test'

    client.sadd([ 'testredsee-whitelist:urls' ].concat(whitelistFixture))
  })

  it('should not allow urls', function (done) {
    var msg = 'http://test.co example.co'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { urls: [ 'http://test.co', 'example.co' ] })

      done()
    })
  })

  it('should ignore whitelisted domains', function (done) {
    var msg = 'google.com'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { urls: [] })

      done()
    })
  })

  it('should ignore whitelisted wildcard domains', function (done) {
    var msg = 'testing.frostcast.net'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { urls: [] })

      done()
    })
  })

  it('should remove urls from the message', function (done) {
    var msg = 'hello testing.frostcast.net'
      , res = {}

    filter(client, res, msg, function (error, msg) {
      if (error) return done(error)

      assert.equal(msg, 'hello ')

      done()
    })
  })

  it('should exit early if no urls', function (done) {
    var msg = 'I am foo bar'
      , res = {}

    filter(client, res, msg, function (error, msg) {
      if (error) return done(error)

      assert.equal(msg, 'I am foo bar')

      done()
    })
  })

})
