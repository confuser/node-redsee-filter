var assert = require('assert-diff')
  , redis = require('redis')
  , XXHash = require('xxhash')
  , seed = 0xCAFEBABE // This may need to change, based on xxhash docs
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
  , blacklistFixtureAscii = require('./fixtures/blacklist-ascii')()
  , client

describe('Filter', function () {
  before(function (done) {
    client = redis.createClient()
    client.prefix = 'test'

    client.sadd([ 'testredsee-whitelist:phrases' ].concat(whitelistFixturePhrases))
    client.sadd([ 'testredsee-blacklist:phrases' ].concat(blacklistFixturePhrases))

    client.sadd([ 'testredsee-whitelist:urls' ].concat(whitelistFixtureUrls))

    client.sadd([ 'testredsee-whitelist:emails' ].concat(whitelistFixtureEmails))

    whitelistFixtureWords = whitelistFixtureWords.map(function (word) {
      return XXHash.hash(new Buffer(word), seed)
    });

    client.sadd([ 'testredsee-whitelist:words' ].concat(whitelistFixtureWords))
    client.sadd([ 'testredsee-blacklist:words' ].concat(blacklistFixtureWords))

    client.sadd([ 'testredsee-blacklist:ascii' ].concat(blacklistFixtureAscii))

    blacklistFixtureWords.forEach(function (word) {
      var phonetics = dm.process(word)

      if (!phonetics || !phonetics[0]) return

      client.hmset('testredsee-blacklist:phonetic-words',  phonetics[0], word)

      if (phonetics[0] !== phonetics[1]) {
        client.hmset('testredsee-blacklist:phonetic-words',  phonetics[1], word)
      }

    })

    client.on('ready', done)

  })

  after(function () {
    client.del('testredsee-whitelist:phrases')
    client.del('testredsee-blacklist:phrases')
    client.del('testredsee-whitelist:urls')
    client.del('testredsee-whitelist:emails')
    client.del('testredsee-whitelist:words')
    client.del('testredsee-blacklist:phrases')
    client.del('testredsee-blacklist:phonetic-words')
    client.del('testredsee-blacklist:ascii')
  })

  it('should match all', function (done) {
    var msg = 'This contains fucking swearing, using 8=== p3n15 leet you ass as well as a plethora of emails'
    + ' like example@example.net example@example.com, domains such as www.frostcast.net notreal.xxx http://spam.net'
    + ' and this is a good example of how fast it takes to analyse text of this length'

    filter(client, msg, function (error, res) {
      if (error) return done(error)

      var expected =
      { emails: [ 'example@example.net' ]
      , urls: [ 'notreal.xxx', 'http://spam.net' ]
      , phrases: [ 'you ass' ]
      , words: [ 'penis', 'fuck' ]
      , ascii: [ '8===' ]
      }

      assert.deepEqual(res, expected)

      done()
    })
  })

})
