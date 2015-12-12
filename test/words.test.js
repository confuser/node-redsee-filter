var assert = require('assert')
  , filter = require('../lib/filters/words')
  , client = require('./client')()

describe('Words Filter', function () {

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

  it('should handle valid spaced words', function (done) {
    var msg = 'A ball is hit with a bat' // Ensure filter does not find 's hit'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [ ] })

      done()
    })
  })

  it('should find profanity in valid spaced words', function (done) {
    var msg = 'you s hit ass hole'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [ 'shit', 'asshole' ] })

      done()
    })
  })

  it('should find profanity in patternised words', function (done) {
    var msg = 'u aSlHlIlT FaUbCaK'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { words: [ 'shit', 'fuck' ] })

      done()
    })
  })

})
