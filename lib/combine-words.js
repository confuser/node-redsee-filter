var async = require('async')

module.exports = function (letters, iterator, callback) {
  var n = letters.length
    , combinations = []

  if (!callback) {
    callback = iterator
    iterator = function (newWord, cb) { cb(null, newWord) }
  }

  async.times(n, function (i, timesNCb) {
    // equivalent of j <= i
    async.times(i + 1, function (j, timesCb) {
      var newWord = letters.slice(j, n - i + j).join('')

      if (newWord.length < 3) return timesCb()

      // Performance improvement by eliminating duplicates
      if (combinations.indexOf(newWord) === -1) {
        combinations.push(newWord)
        return iterator(newWord, timesCb)
      }

      timesCb()

    }, function (error) {
      timesNCb(error)
    })
  }, function (error) {
    callback(error, combinations)
  })
}
