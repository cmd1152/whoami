const http2 = require('http2');

function set(path,text) {
  return new Promise((resolve, reject) => {
    let client = http2.connect('https://note.re/');
    let body = `&t=${encodeURIComponent(text)}`;
    req = client.request({
      ':method': 'POST',
      ':path': '/' + path,
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Content-Length': body.length.toString(),
      'Origin': 'https://note.re',
      'Referer': 'https://note.re/' + path,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest'
    });
    req.setEncoding('utf8');
    req.on('response', (headers) => {
      if (headers[':status'] !== 200) {
        client.close();
        reject(headers[':status']);
      } else resolve();
    })
    client.on('error', (err) => {
      client.close();
      reject(err.message);
    })
    req.end(body);
  })
}

module.exports = { set };