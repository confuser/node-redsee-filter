var XXHash = require('xxhash')
  , seed = 0xCAFEBABE // This may need to change, based on xxhash docs
  , words =
    [ 'fuck'
    , 'shit'
    , 'cum'
    , 'penis'
    , 'sex'
    , 'cunt'
    , 'pussy'
    , 'masturbation'
    , 'asshole'
    ]

module.exports = function () {
  var buckets = {}

  words.forEach(function (word) {
    var hash = XXHash.hash(new Buffer(word), seed)
      , bucket = hash % 500000

    if (buckets[bucket]) {
      buckets[bucket].push(hash)
    } else {
      buckets[bucket] = [ hash ]
    }
  });

  return { buckets: buckets, words: words }
}
