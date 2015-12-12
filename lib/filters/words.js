var through = require('through2')
  , async = require('async')
  , powersetStream = require('powerset-stream')
  , _ = require('lodash')
  , natural = require('natural')
  , dm = natural.DoubleMetaphone
  , combineWords = require('../combine-words')

module.exports = function (client, res, msg, cb) {
  var blacklisted = []
    , phoneticCache = []
    , joinStream = through.obj(function (chunk, encoding, callback) {
        this.push(chunk.join(''))

        callback()
      })
    , wordWhitelist = function (word, encoding, callback) {
        var self = this

        client.whitelist.words.contains(word, function (error, exists) {
          if (error) return callback(error)
          if (!exists) self.push(word)

          callback()
        })
      }
    , wordBlacklist = function (isEnd) {
        return function (word, encoding, callback) {
          var self = this

          client.blacklist.words.contains(word, function (error, exists) {
            if (error) return callback(error)
            if (!exists) {
              if (!isEnd) self.push(word)

              return callback()
            }

            // Check if bypass
            client.blacklist.wordsBypass.get(word, function (error, assoc) {
              if (error) return callback(error)

              if (assoc) {
                blacklisted.push(assoc)
              } else {
                blacklisted.push(word)
              }

              callback()
            })

          })
        }
      }
    , wordCombinationStream = through.obj(function (word, encoding, callback) {
        if (word.length < 3) return callback()

        var self = this
          , letters = word.split('')

        combineWords(letters, function (newWord, cb) {
          self.push(newWord)

          cb()
        }, callback)

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

        var found = false

        client.blacklist.phonetics.get(phonetics, function (error, data) {
          if (error) return callback(error)

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
          return i === allItems.indexOf(item)
        }).map(function (word) {
          return word.toLowerCase()
        })
    , wordBlacklistStream = through.obj(wordBlacklist(true))
    , uppercaseBypass = msg.match(/([A-Z]+)/g)

  wordBlacklistStream.on('finish', function () {
    res.words = _.unique(blacklisted)
    cb(null, msg)
  })

  if (uppercaseBypass && uppercaseBypass.length !== 0) {
    words.push(uppercaseBypass.join('').toLowerCase())
  }

  async.waterfall(
    [ function (callback) {
        // First find blacklist combinations
        combineWords(words, function (newWord, cb) {
          client.blacklist.words.contains(newWord, function (error, exists) {
            if (error) return cb(error)
            // TODO Remove the combinations from 'words'
            if (exists) blacklisted.push(newWord)

            cb()
          })
        }, function (error) {
          if (error) return callback(error)

          callback(null, words)
        })
      }
    , function (words, callback) {
        async.reject(words, function (word, rejectCb) {
          // Ignore single letter words
          if (word.length === 1) return rejectCb(false)

          client.whitelist.words.contains(word, function (error, exists) {
            if (error) rejectCb(false)

            rejectCb(exists)
          })
        }, function (words) {
          callback(null, words)
        })
      }
    , function (words, callback) {
        async.reject(words, function (word, rejectCb) {
          client.blacklist.words.contains(word, function (error, exists) {
            if (error) rejectCb(false)
            if (!exists) return rejectCb(exists)

            client.blacklist.wordsBypass.get(word, function (error, assoc) {
              if (error) return callback(error)

              if (assoc) {
                blacklisted.push(assoc)
              } else {
                blacklisted.push(word)
              }

              rejectCb(exists)
            })
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
        words = words.map(function (word) { return word.replace(/[\W_]+/g, ' ') })

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
