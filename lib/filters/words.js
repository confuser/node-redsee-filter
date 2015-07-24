var through = require('through2')
  , async = require('async')
  , powersetStream = require('powerset-stream')
  , _ = require('lodash')
  , natural = require('natural')
  , dm = natural.DoubleMetaphone

module.exports = function (client, res, msg, cb) {
  var blacklisted = []
    , phoneticCache = []
    , joinStream = through.obj(function (chunk, encoding, callback) {
        this.push(chunk.join(''))

        callback()
      })
    , wordWhitelist = function (word, encoding, callback) {
        var that = this

        client.sismember('redsee-whitelist:words', word, function (error, exists) {
          if (error) return callback(error)

          if (!exists) that.push(word)

          callback()
        })
      }
    , wordBlacklist = function (word, encoding, callback) {
        var that = this
        client.sismember('redsee-blacklist:words', word, function (error, exists) {
          if (error) return callback(error)
          if (exists) {
            // Check if bypass
            client.hget('redsee-blacklist:bypass', word, function (error, assoc) {
              if (error) return callback(error)
              if (assoc) {
                blacklisted.push(assoc)
              } else {
                blacklisted.push(word);
              }

              callback()
            })
          } else {
            that.push(word)
            callback()
          }
        })
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
    , phoneticCheck = function (isEnd) {
        return function (word, encoding, callback) {
          var that = this
            , phonetics = dm.process(word)

          if (!phonetics[0] || !phonetics[1]) return callback()

          if (phonetics[0] === phonetics[1] && phoneticCache.indexOf(phonetics[0]) !== -1) return callback()
          if (phoneticCache.indexOf(phonetics[0]) !== -1) return callback()
          if (phoneticCache.indexOf(phonetics[1]) !== -1) return callback()

          if (phonetics[0] === phonetics[1]) {
            phoneticCache.push(phonetics[0])
            phonetics = [ phonetics[0] ]
          } else {
            phoneticCache.push(phonetics[0], phonetics[1])
          }

          client.hmget('redsee-blacklist:phonetic-words', phonetics, function (error, data) {
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

            if (!found && !isEnd) that.push(word)

            callback()
          })
        }
      }
    , words = msg.match(/\S+/g)
    , phoneticStream = through.obj(phoneticCheck(true))

  phoneticStream.on('finish', function () {
    res.words = _.unique(blacklisted)
    cb(null, msg)
  })

  async.waterfall(
    [ function (callback) {
        async.reject(words, function (word, rejectCb) {
          // Ignore single letter words
          if (word.length === 1) return rejectCb(false)

          client.sismember('redsee-whitelist:words', word, function (error, exists) {
            if (error) return rejectCb(false)

            rejectCb(exists)
          })
        }, function (words) {
          callback(null, words)
        })
      }
    , function (words, callback) {
        async.reject(words, function (word, rejectCb) {
          client.sismember('redsee-blacklist:words', word, function (error, exists) {
            if (error) return rejectCb(false)

            if (exists) {
              client.hget('redsee-blacklist:bypass', word, function (error, assoc) {
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

      powersetStream(words)
        .pipe(joinStream)
        .pipe(through.obj(wordWhitelist))
        .pipe(through.obj(wordBlacklist))
        .pipe(through.obj(phoneticCheck(false)))
        .pipe(wordCombinationStream)
        .pipe(through.obj(wordWhitelist))
        .pipe(through.obj(wordBlacklist))
        .pipe(phoneticStream)
    }
  )

}
