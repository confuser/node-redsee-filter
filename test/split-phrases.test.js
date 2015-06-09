var assert = require('assert-diff')
  , splitPhrases = require('../lib/split-phrases')

describe('Split Phrases', function () {

  it('should split phrases correctly', function () {
    assert.deepEqual(splitPhrases('hello'), [ 'hello' ])
    assert.deepEqual(splitPhrases('this is world')
      , [ 'this'
        , 'is'
        , 'this is'
        , 'world'
        , 'this world'
        , 'is world'
        , 'this is world'
        ]
      )
    assert.deepEqual(splitPhrases('this     is      world    ')
      , [ 'this'
        , 'is'
        , 'this is'
        , 'world'
        , 'this world'
        , 'is world'
        , 'this is world'
        ]
      )
    assert.deepEqual(splitPhrases('hello to ever y one')
      , [ 'hello'
        , 'to'
        , 'hello to'
        , 'ever'
        , 'hello ever'
        , 'to ever'
        , 'hello to ever'
        , 'y'
        , 'hello y'
        , 'to y'
        , 'hello to y'
        , 'ever y'
        , 'hello ever y'
        , 'to ever y'
        , 'hello to ever y'
        , 'one'
        , 'hello one'
        , 'to one'
        , 'hello to one'
        , 'ever one'
        , 'hello ever one'
        , 'to ever one'
        , 'hello to ever one'
        , 'y one'
        ]
      )
  })

  it('should ignore falsey values', function () {
    assert.deepEqual(splitPhrases(''), [])
    assert.deepEqual(splitPhrases(null), [])
    assert.deepEqual(splitPhrases(), [])
  })

  it('should handle empty values', function () {
    assert.deepEqual(splitPhrases('    '), [])
  })
})
