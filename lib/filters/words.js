var through = require('through2')
  , async = require('async')
  , powersetStream = require('powerset-stream')
  , _ = require('lodash')
  , natural = require('natural')
  , dm = natural.DoubleMetaphone
  , XXHash = require('xxhash')
  , seed = 0xCAFEBABE // This may need to change, based on xxhash docs

module.exports = function (client, res, msg, cb) {
  var blacklisted = []
    , phoneticCache = []
    , joinStream = through.obj(function (chunk, encoding, callback) {
        this.push(chunk.join(''))

        callback()
      })
    , wordWhitelist = function (word, encoding, callback) {
        var self = this
          , hash = XXHash.hash(new Buffer(word), seed)
          , bucket = hash % 100000
          , key = client.prefix + 'redsee-whitelist:words:' + bucket

        client.sismember(key, hash, function (error, exists) {
          if (error) return callback(error)

          if (!exists) self.push(word)

          callback()
        })
      }
    , wordBlacklist = function (isEnd) {
        return function (word, encoding, callback) {
          var self = this
            , hash = XXHash.hash(new Buffer(word), seed)
            , bucket = hash % 100000
            , key = client.prefix + 'redsee-blacklist:words:' + bucket

          client.sismember(key, hash, function (error, exists) {
            if (error) return callback(error)
            if (exists) {
              // Check if bypass
              client.hget(client.prefix + 'redsee-blacklist:bypass', word, function (error, assoc) {
                if (error) return callback(error)
                if (assoc) {
                  blacklisted.push(assoc)
                } else {
                  blacklisted.push(word);
                }

                callback()
              })
            } else {
              if (!isEnd) self.push(word)
              callback()
            }
          })
        }
      }
    , wordCombinationStream = through.obj(function (word, encoding, callback) {
        if (word.length < 3) return callback()

        var self = this
          , letters = word.split('')
          , n = letters.length
          , combinations = []

        async.times(n, function (i, timesNCb) {
          // equivalent of j <= i
          async.times(i + 1, function (j, timesCb) {
            var newWord = letters.slice(j, n - i + j).join('')
            if (newWord.length < 3) return timesCb()

            // Performance improvement by eliminating duplicates
            if (combinations.indexOf(newWord) === -1) {
              combinations.push(newWord)
              self.push(newWord)
            }

            timesCb()
          }, function (error) {
            timesNCb(error)
          })
        }, function (error) {
          callback(error)
        })

      })
    , phoneticCheck = function (word, encoding, callback) {
        var self = this
          , phonetics = dm.process(word)

        if (!phonetics[0] || !phonetics[1]) return callback()

        if (phonetics[0] === phonetics[1] && phoneticCache.indexOf(phonetics[0]) !== -1) return callback()
        if (phoneticCache.indexOf(phonetics[0]) !== -1) return callback()
        if (phoneticCache.indexOf(phonetics[1]) !== -1) return callback()

        // Remove duplicate phonetic letters to avoid misses, this might introduce false positives, to test
        phonetics = phonetics.map(function (phonetic) {
          return phonetic.replace(/([A-Z])\1{2,}/, '$1')
        })

        if (phonetics[0] === phonetics[1]) {
          phoneticCache.push(phonetics[0])
          phonetics = [ phonetics[0] ]
        } else {
          phoneticCache.push(phonetics[0], phonetics[1])
        }

        client.hmget(client.prefix + 'redsee-blacklist:phonetic-words', phonetics, function (error, data) {
          if (error) callback(error)

          var found = false

          if (data && data.length !== 0) {
            if (data[0] && blacklisted.indexOf(data[0]) === -1) {
              blacklisted.push(data[0])
              found = true
            }

            if (data[1] && blacklisted.indexOf(data[1]) === -1) {
             blacklisted.push(data[1])
             found = true
           }
          }

          if (!found) self.push(word)

          callback()
        })
      }
    , words = msg.match(/\S+/g).filter(function (item, i, allItems) {
          return i === allItems.indexOf(item);
        })
    , wordBlacklistStream = through.obj(wordBlacklist(true))

  wordBlacklistStream.on('finish', finish)

  function finish() {
    res.words = _.unique(blacklisted)
    cb(null, msg)
  }

  async.waterfall(
    [ function (callback) {
        async.reject(words, function (word, rejectCb) {
          // Ignore single letter words
          if (word.length === 1) return rejectCb(false)

          var hash = XXHash.hash(new Buffer(word), seed)
            , bucket = hash % 100000
            , key = client.prefix + 'redsee-whitelist:words:' + bucket

          client.sismember(key, hash, function (error, exists) {
            if (error) return rejectCb(false)

            rejectCb(exists)
          })
        }, function (words) {
          callback(null, words)
        })
      }
    , function (words, callback) {
        async.reject(words, function (word, rejectCb) {
          var hash = XXHash.hash(new Buffer(word), seed)
            , bucket = hash % 100000
            , key = client.prefix + 'redsee-blacklist:words:' + bucket

          client.sismember(key, hash, function (error, exists) {
            if (error) return rejectCb(false)

            if (exists) {
              client.hget(client.prefix + 'redsee-blacklist:bypass', word, function (error, assoc) {
                if (error) return callback(error)
                if (assoc) {
                  blacklisted.push(assoc)
                } else {
                  blacklisted.push(word);
                }

                rejectCb(exists)
              })
            } else {
              rejectCb(exists)
            }
          })
        }, function (words) {
          callback(null, words)
        })
      }
  ], function (error, words) {
      if (error) return cb(error)

      if (words.length === 0) {
        res.words = _.unique(blacklisted)
        return cb(null, msg)
      }

      // Handle non-alpha
      words = words.map(function (word) { return word.replace(/[\W_]+/g, ' ') });

      powersetStream(words)
        .pipe(joinStream)
        .pipe(through.obj(wordWhitelist))
        .pipe(through.obj(wordBlacklist(false)))
        .pipe(through.obj(phoneticCheck))
        .pipe(wordCombinationStream)
        .pipe(through.obj(wordWhitelist))
        .pipe(wordBlacklistStream)
    }
  )

}
