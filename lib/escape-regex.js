// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
module.exports = function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
