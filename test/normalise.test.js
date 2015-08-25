var assert = require('assert')
  , filter = require('../lib/filters/normalise')

describe('Normalise Filter', function () {

  it('should remove diacratics', function (done) {
    var msg = 'This is ａ diacratic, looks normal but nope'
      , res = {}

    filter(null, res, msg, function (error, normalised) {
      if (error) return done(error)

      assert.equal(normalised, 'This is a diacratic, looks normal but nope')

      done()
    })
  })

  it('should remove duplicates', function (done) {
    var msg = 'This is ａ sheep, looooooool'
      , res = {}

    filter(null, res, msg, function (error, normalised) {
      if (error) return done(error)

      assert.equal(normalised, 'This is a sheep, lol')

      done()
    })
  })

})
