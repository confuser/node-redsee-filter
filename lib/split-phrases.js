// var _ = require('lodash')

module.exports = function (phrase) {
  if (!phrase) return []
  // Ignores lots of white space, e.g. 'hello     world'
  var words = phrase.match(/\S+/g)

  if (!words) return []

  var wordLength = words.length

  if (wordLength === 1) return words

  var total = wordLength * wordLength
    , phrases = [ ]

  for (var i = 0; i < total; i++) {
    var phraseStr = ''

    for (var j = 0; j < total; j++) {
      if (1 << j & i && words[j]) {
        phraseStr += words[j] + ' '
      }

    }

    if (phraseStr) phrases.push(phraseStr.trim())
  }

  return phrases
}
