var assert = require('assert')
  , filter = require('../lib/filters/normalise')

describe('Normalise Filter', function () {

  it('should force lower case', function (done) {
    var msg = 'MUCH UPPERCases Woo'
      , res = {}

    filter(null, res, msg, function (error, normalised) {
      if (error) return done(error)

      assert.equal(normalised, 'much uppercases woo')

      done()
    })
  })

  it('should remove diacratics', function (done) {
    var msg = 'This is ａ diacratic, looks normal but nope'
      , res = {}

    filter(null, res, msg, function (error, normalised) {
      if (error) return done(error)

      assert.equal(normalised, 'this is a diacratic looks normal but nope')

      done()
    })
  })

  it('should convert symbols', function (done) {
    var msg = 'Why so $a$$y p£adro nopⓔ'
      , res = {}

    filter(null, res, msg, function (error, normalised) {
      if (error) return done(error)

      assert.equal(normalised, 'why so sassy peadro nope')

      done()
    })
  })

  it('should replace all missed non-alphanumerics with spaces', function (done) {
    var msg = 'h_e_l_o'
      , res = {}

    filter(null, res, msg, function (error, normalised) {
      if (error) return done(error)

      assert.equal(normalised, 'h e l o')

      done()
    })
  })

})
