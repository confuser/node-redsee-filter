var through = require('through2')
  , async = require('async')
  , powersetStream = require('powerset-stream')
  , _ = require('lodash')
  , natural = require('natural')
  , dm = natural.DoubleMetaphone
  , bypass =
    [ [ /0/g, 'o' ]
    , [ /1/g, 'i' ]
    , [ /1/g, 'l' ]
    , [ /3/g, 'e' ]
    , [ /5/g, 's' ]
    , [ /l/g, 'i' ]
    , [ /i/g, 'l' ]
    , [ /u/g, 'v' ]
    , [ /v/g, 'u' ]
    , [ /q/g, 'g' ]
    , [ /g/g, 'q' ]
    , [ /\$/g, 's' ]
    , [ /\£/g, 'e' ]
    , [ /\£/g, 's' ]
    , [ /[\W_]+/g, ' ' ]
    ]

module.exports = function (client, res, msg, cb) {
  var blacklisted = []
    , phoneticCache = []
    , joinStream = through.obj(function (chunk, encoding, callback) {
        this.push(chunk.join(''))

        callback()
      })
    , blacklistBypassStream = through.obj(function (word, encoding, callback) {
        var that = this

        bypass.forEach(function (regex) {
          that.push(word.replace(regex[0], regex[1]))
        })

        callback()
      })
    , wordWhitelistStream = through.obj(function (word, encoding, callback) {
        var that = this

        client.sismember('redsee-whitelist:words', word, function (error, exists) {
          if (error) return callback(error)

          if (!exists) that.push(word)

          callback()
        })
      })
    , wordBlacklistStream = through.obj(function (word, encoding, callback) {
        var that = this

        client.sismember('redsee-blacklist:words', word, function (error, exists) {
          if (error) return callback(error)

          if (exists) {
            blacklisted.push(word)
          } else {
            that.push(word)
          }

          callback()
        })
      })
    , phoneticStream = through.obj(function (word, encoding, callback) {
        var phonetics = dm.process(word)

        if (!phonetics[0] || !phonetics[1]) {
         return callback()
       }
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

          if (data && data.length !== 0) {
            if (data[0] && blacklisted.indexOf(data[0]) === -1) {
              blacklisted.push(data[0])
            }

            if (data[1] && blacklisted.indexOf(data[1]) === -1) {
             blacklisted.push(data[1])
           }
          }

          callback()
        })
      })
    , words = msg.match(/\S+/g)

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
              blacklisted.push(word)
            }

            rejectCb(exists)
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
        .pipe(blacklistBypassStream)
        .pipe(wordWhitelistStream)
        .pipe(wordBlacklistStream)
        .pipe(phoneticStream)
    }
  )

}
