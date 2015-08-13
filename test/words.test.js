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
    client.prefix = 'test'

    Object.keys(whitelistFixture.buckets).forEach(function (bucket) {
      client.sadd('testredsee-whitelist:words:' + bucket, whitelistFixture.buckets[bucket])
    })

    Object.keys(blacklistFixture.buckets).forEach(function (bucket) {
      client.sadd('testredsee-blacklist:words:' + bucket, blacklistFixture.buckets[bucket])
    })

    blacklistFixture.words.forEach(function (word) {
      var phonetics = dm.process(word)

      if (!phonetics || !phonetics[0]) return

      client.hmset('testredsee-blacklist:phonetic-words',  phonetics[0], word)

      if (phonetics[0] !== phonetics[1]) {
        client.hmset('testredsee-blacklist:phonetic-words',  phonetics[1], word)
      }

    })

    client.on('ready', done)

  })

  after(function () {
    client.del('testredsee-whitelist:words')
    client.del('testredsee-blacklist:words')
    client.del('testredsee-blacklist:phonetic-words')
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

  it('should handle the scunthorpe problem via whitelisting', function (done) {
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

  it('should handle spaces', function (done) {
    var msg = 'F u c k'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [ 'fuck' ] })

      done()
    })
  })

  it('should handle nested words', function (done) {
    var msg = 'fuckshitcunt'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [ 'fuck', 'shit', 'cunt' ] })

      done()
    })
  })

})
