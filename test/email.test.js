var assert = require('assert')
  , filter = require('../lib/filters/email')
  , client = require('./client')()

describe('Email Filter', function () {

  it('should not allow emails', function (done) {
    var msg = 'Send me an email this+is+an+email@address.co'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { emails: [ 'this+is+an+email@address.co' ] })

      done()
    })
  })

  it('should ignore whitelisted emails', function (done) {
    var msg = 'hai this+is+an+email@example.net'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { emails: [] })

      done()
    })
  })

  it('should ignore whitelisted wildcard domains', function (done) {
    var msg = 'wildcard-yo@example.com'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { emails: [] })

      done()
    })
  })

  it('should remove emails from the message', function (done) {
    var msg = 'hello yep@example.com'
      , res = {}

    filter(client, res, msg, function (error, msg) {
      if (error) return done(error)

      assert.equal(msg, 'hello ')

      done()
    })
  })

  it('should exit early if no emails', function (done) {
    var msg = 'hello world'
      , res = {}

    filter(client, res, msg, function (error, msg) {
      if (error) return done(error)

      assert.equal(msg, 'hello world')

      done()
    })
  })

})
