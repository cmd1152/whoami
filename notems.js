function n() {
  return new Promise((resolve, reject) => {
    reject();
  })
}

module.exports = { get:n,set:n };