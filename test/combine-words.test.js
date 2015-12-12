var assert = require('assert-diff')
  , combineWords = require('../lib/combine-words')

describe('Combine Words', function () {

  it('should combine words correctly', function (done) {
    combineWords([ 'You', 'are', 'an', 'ass', 'hole', 'f', 'u', 'ck', 'you' ], function (error, words) {
      if (error) return done(error)

      assert.deepEqual(words,
        [ 'Youareanassholefuckyou'
        , 'Youareanassholefuck'
        , 'areanassholefuckyou'
        , 'Youareanassholefu'
        , 'areanassholefuck'
        , 'anassholefuckyou'
        , 'Youareanassholef'
        , 'areanassholefu'
        , 'anassholefuck'
        , 'assholefuckyou'
        , 'Youareanasshole'
        , 'areanassholef'
        , 'anassholefu'
        , 'assholefuck'
        , 'holefuckyou'
        , 'Youareanass'
        , 'areanasshole'
        , 'anassholef'
        , 'assholefu'
        , 'holefuck'
        , 'fuckyou'
        , 'Youarean'
        , 'areanass'
        , 'anasshole'
        , 'assholef'
        , 'holefu'
        , 'fuck'
        , 'uckyou'
        , 'Youare'
        , 'arean'
        , 'anass'
        , 'asshole'
        , 'holef'
        , 'uck'
        , 'ckyou'
        , 'You'
        , 'are'
        , 'ass'
        , 'hole'
        , 'you'
        ]
      )

      done()
    })
  })

})
