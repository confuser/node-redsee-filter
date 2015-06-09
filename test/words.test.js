var assert = require('assert')
  , redis = require('redis')
  , natural = require('natural')
  , dm = natural.DoubleMetaphone
  , filter = require('../lib/filters/words')
  , whitelistFixture = require('./fixtures/whitelist-words')()
  , blacklistFixture = require('./fixtures/blacklist-words')()
  , client

require('redis-scanstreams')(redis)

describe('Words Filter', function () {
  before(function (done) {
    client = redis.createClient()

    client.sadd([ 'redsee-whitelist:words' ].concat(whitelistFixture))
    client.sadd([ 'redsee-blacklist:words' ].concat(blacklistFixture))

    blacklistFixture.forEach(function (word) {
      var phonetics = dm.process(word)

      if (!phonetics || !phonetics[0]) return

      client.hmset('redsee-blacklist:phonetic-words',  phonetics[0], word)

      if (phonetics[0] !== phonetics[1]) {
        client.hmset('redsee-blacklist:phonetic-words',  phonetics[1], word)
      }

    })

    client.on('ready', done)

  })

  after(function () {
    client.del('redsee-whitelist:words')
    client.del('redsee-blacklist:words')
    client.del('redsee-blacklist:phonetic-words')
  })

  it('should match blacklisted word', function (done) {
    var normalisedMsg = 'fuck'
      , res = {}

    filter(client, res, normalisedMsg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [ 'fuck' ] })

      done()
    })
  })

  it('should find blacklisted words', function (done) {
    var normalisedMsg = 'f u ck u'
      , res = {}

    filter(client, res, normalisedMsg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [ 'fuck' ] })

      done()
    })
  })

  it('should ignore whitelisted words', function (done) {
    var normalisedMsg = 'try out this sexy minigame'
      , res = {}

    filter(client, res, normalisedMsg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [] })

      done()
    })
  })

  it('should handle the scunthorpe problem', function (done) {
    var msg = 'hello scunthorpe'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [ ] })

      done()
    })
  })

    it('should handle similar words via phonetics', function (done) {
    var msg = 'fek this shit'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [ 'shit', 'fuck' ] })

      done()
    })
  })

  it('should handle words with repeated characters', function (done) {
    var msg = 'peeeeeniiiiiis'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [ 'penis' ] })

      done()
    })
  })

  it('should handle words with some numbers instead of letters', function (done) {
    var msg = 'p3nis'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [ 'penis' ] })

      done()
    })
  })

  it('should handle words with all numbers instead of letters', function (done) {
    var msg = 'p3n15'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [ 'penis' ] })

      done()
    })
  })

  it('should handle similar looking letters attempting to bypass', function (done) {
    var msg = 'fvck cvm cvnt pen1s'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [ 'fuck', 'cum', 'cunt', 'penis' ] })

      done()
    })
  })

  it('should handle spaces', function (done) {
    var msg = 'F u c k'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [ 'fuck' ] })

      done()
    })
  })

})
