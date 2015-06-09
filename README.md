# redsee-filter

[![Build Status](https://travis-ci.org/confuser/node-redsee-filter.png?branch=master)](https://travis-ci.org/confuser/node-redsee-filter)
[![Coverage Status](https://coveralls.io/repos/confuser/node-redsee-filter/badge.png?branch=master)](https://coveralls.io/r/confuser/node-redsee-filter?branch=master)

An English profanity, email and url filter backed by redis to use with [redsee-server](https://github.com/confuser/node-redsee-server)

## Installation
```
npm install redsee-filter --save
```

## Usage
```js

var filter = require('redsee-filter')
  , redis = require('redis')
  , client = redis.createClient()

filter(client, msg, function (error, response) {
  console.log(response.words, response.phrases)
})
```
