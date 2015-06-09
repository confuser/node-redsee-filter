var assert = require('assert-diff')
  , redis = require('redis')
  , natural = require('natural')
  , dm = natural.DoubleMetaphone
  , filter = require('../lib/filter')
  , whitelistWords =
    [ 'as'
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
    , ','
    , '!'
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
  , whitelistFixtureWords = require('./fixtures/whitelist-words')()
    .concat(whitelistWords)
  , blacklistFixtureWords = require('./fixtures/blacklist-words')()
  , whitelistFixturePhrases = require('./fixtures/whitelist-phrases')()
  , blacklistFixturePhrases = require('./fixtures/blacklist-phrases')()
  , whitelistFixtureUrls = require('./fixtures/whitelist-urls')()
  , whitelistFixtureEmails = require('./fixtures/whitelist-emails')()
  , client

describe('Filter', function () {
  before(function (done) {
    client = redis.createClient()

    client.sadd([ 'redsee-whitelist:phrases' ].concat(whitelistFixturePhrases))
    client.sadd([ 'redsee-blacklist:phrases' ].concat(blacklistFixturePhrases))

    client.sadd([ 'redsee-whitelist:urls' ].concat(whitelistFixtureUrls))

    client.sadd([ 'redsee-whitelist:emails' ].concat(whitelistFixtureEmails))

    client.sadd([ 'redsee-whitelist:words' ].concat(whitelistFixtureWords))
    client.sadd([ 'redsee-blacklist:words' ].concat(blacklistFixtureWords))

    blacklistFixtureWords.forEach(function (word) {
      var phonetics = dm.process(word)

      if (!phonetics || !phonetics[0]) return

      client.hmset('redsee-blacklist:phonetic-words',  phonetics[0], word)

      if (phonetics[0] !== phonetics[1]) {
        client.hmset('redsee-blacklist:phonetic-words',  phonetics[1], word)
      }

    })

    client.on('ready', done)

  })

  after(function () {
    client.del('redsee-whitelist:phrases')
    client.del('redsee-blacklist:phrases')
    client.del('redsee-whitelist:urls')
    client.del('redsee-whitelist:emails')
    client.del('redsee-whitelist:words')
    client.del('redsee-blacklist:phrases')
    client.del('redsee-blacklist:phonetic-words')
  })

  it('should match all', function (done) {
    var msg = 'This contains fucking swearing, using p3n15 pu$$y leet you ass as well as a plethora of emails'
    + ' like example@example.net example@example.com, domains such as www.frostcast.net notreal.xxx http://spam.net'
    + ' and this is a good example of how fast it takes to analyse text of this length'

    filter(client, msg, function (error, res) {
      if (error) return done(error)

      var expected =
      { emails: [ 'example@example.net' ]
      , urls: [ 'notreal.xxx', 'http://spam.net' ]
      , phrases: [ 'you ass' ]
      , words: [ 'pussy', 'penis' ]
      }

      assert.deepEqual(res, expected)

      done()
    })
  })

})
