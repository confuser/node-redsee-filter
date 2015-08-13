var assert = require('assert-diff')
  , redis = require('redis')
  , natural = require('natural')
  , dm = natural.DoubleMetaphone
  , filter = require('../lib/filter')
  , whitelistFixture = require('./fixtures/whitelist-words')()
  , blacklistFixture = require('./fixtures/blacklist-words')()
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

    Object.keys(whitelistFixture.buckets).forEach(function (bucket) {
      client.sadd('testredsee-whitelist:words:' + bucket, whitelistFixture.buckets[bucket])
    })

    Object.keys(blacklistFixture.buckets).forEach(function (bucket) {
      client.sadd('testredsee-blacklist:words:' + bucket, blacklistFixture.buckets[bucket])
    })

    blacklistFixture.words.forEach(function (word) {
      var phonetics = dm.process(word)

      if (!phonetics || !phonetics[0]) return

      client.hmset('testredsee-blacklist:phonetic-words',  phonetics[0], word)

      if (phonetics[0] !== phonetics[1]) {
        client.hmset('testredsee-blacklist:phonetic-words',  phonetics[1], word)
      }

    })

    client.sadd([ 'testredsee-blacklist:ascii' ].concat(blacklistFixtureAscii))

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
