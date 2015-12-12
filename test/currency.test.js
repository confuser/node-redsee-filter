var assert = require('assert')
  , filter = require('../lib/filters/currency')
  , client = require('./client')()

describe('Currency Filter', function () {
  it('should not allow currencies', function (done) {
    var msg = 'This is a currency £100 and this is also one $100'
      , res = {}

    filter(client, res, msg, function (error) {
      if (error) return done(error)

      assert.deepEqual(res, { currencies: [ '£100', '$100' ] })

      done()
    })
  })

  it('should remove currencies from the message', function (done) {
    var msg = 'I am worth £10 and $10'
      , res = {}

    filter(client, res, msg, function (error, msg) {
      if (error) return done(error)

      assert.equal(msg, 'I am worth  and ')

      done()
    })
  })

  it('should exit early if no currencies', function (done) {
    var msg = 'I am foo bar'
      , res = {}

    filter(client, res, msg, function (error, msg) {
      if (error) return done(error)

      assert.equal(msg, 'I am foo bar')

      done()
    })
  })

})
