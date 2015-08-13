var XXHash = require('xxhash')
  , seed = 0xCAFEBABE // This may need to change, based on xxhash docs
  , words =
    [ 'sexy'
    , 'minigame'
    , 'f'
    , 'u'
    , 'c'
    , 'k'
    , 'scunthorpe'
    , 'as'
    , 'well'
    , 'using'
    , 'this'
    , 'of'
    , 'a'
    , 'and'
    , 'email'
    , 'emails'
    , 'like'
    , 'such'
    , 'how'
    , 'fast'
    , 'text'
    , 'length'
    , 'takes'
    , 'good'
    , 'contains'
    , 'is'
    , 'it'
    , 'to'
    , 'swearing'
    , 'example'
    , 'domains'
    , 'analyse'
    , 'plethora'
    , 'leet'
    ]

module.exports = function () {
  var buckets = {}

  words.forEach(function (word) {
    var hash = XXHash.hash(new Buffer(word), seed)
      , bucket = hash % 100000

    if (buckets[bucket]) {
      buckets[bucket].push(hash)
    } else {
      buckets[bucket] = [ hash ]
    }
  });

  return { buckets: buckets, words: words }
}
