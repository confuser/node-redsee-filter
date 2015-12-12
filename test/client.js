var spigot = require('stream-spigot')
  , natural = require('natural')
  , dm = natural.DoubleMetaphone
  , createWhitelistEmails = require('./fixtures/whitelist-emails')
  , createWhitelistPhrases = require('./fixtures/whitelist-phrases')
  , createWhitelistUrls = require('./fixtures/whitelist-urls')
  , createWhitelistWords = require('./fixtures/whitelist-words')
  , createBlacklistAscii = require('./fixtures/blacklist-ascii')
  , createBlacklistPhrases = require('./fixtures/blacklist-phrases')
  , createBlacklistWords = require('./fixtures/blacklist-words')

// Crude client for tests
module.exports = function () {
  var client = {}
    , phonetics = {}
    , whitelistEmails = createWhitelistEmails()
    , whitelistPhrases = createWhitelistPhrases()
    , whitelistUrls = createWhitelistUrls()
    , whitelistWords = createWhitelistWords()
    , blacklistAscii = createBlacklistAscii()
    , blacklistPhrases = createBlacklistPhrases()
    , blacklistWords = createBlacklistWords()

  client.whitelist =
    { words:
      { contains: function (word, callback) {
          return callback(null, whitelistWords.indexOf(word) !== -1)
        }
      }
    , emails:
      { stream: function () {
          return spigot.array({ objectMode: true }, whitelistEmails)
        }
      }
    , phrases:
      { contains: function (word, callback) {
          return callback(null, whitelistPhrases.indexOf(word) !== -1)
        }
      }
    , urls:
      { stream: function () {
          return spigot.array({ objectMode: true }, whitelistUrls)
        }
      }
    }

  client.blacklist =
    { words:
      { contains: function (word, callback) {
          return callback(null, blacklistWords.indexOf(word) !== -1)
        }
      }
    , ascii:
      { contains: function (word, callback) {
          return callback(null, blacklistAscii.indexOf(word) !== -1)
        }
      }
    , phrases:
      { contains: function (word, callback) {
          return callback(null, blacklistPhrases.indexOf(word) !== -1)
        }
      }
    , phonetics:
      { get: function (phonetic, callback) {
          if (!Array.isArray(phonetic)) return callback(null, phonetics[phonetic])

          var found = []

          phonetic.forEach(function (phonetic) {
            if (phonetics[phonetic]) found.push(phonetics[phonetic])
          })

          callback(null, found)
        }

      }
    , wordsBypass:
      { get: function (word, callback) {
          callback()
        }
      }
    }

  blacklistWords.forEach(function (word) {
    var processed = dm.process(word)

    if (!processed || !processed[0]) return

    phonetics[processed[0]] = word

    if (processed[0] !== processed[1]) {
      phonetics[processed[1]] = word
    }

  })

  return client
}
