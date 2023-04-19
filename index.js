const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')

const LISTEN_PORT = 3001
const LISTEN_HOST = '127.0.0.1'

const MAX_PAYLOAD_SIZE = 128 * 1024
const MAX_NUM_ITEMS = 1024

const app = express();
app.use(bodyParser.text({
    type: ['text/plain', 'application/felfele-feeds+json'],
}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const hashes = []
const items = {}

app.post(['/api/v1/item', '/bzz:/'], (req, res) => {
  try {
    const body = req.body
    const hash = addItem(body)
    console.log(hash)
    res.status(200).send(hash)
  } catch (e) {
    console.error(e)
    res.status(500).send(e);
  }
});

app.get(['/api/v1/item/:hash', '/bzz:/:hash'], (req, res) => {
  const item = items[req.params.hash]
  if (item) {
    res.status(200).send(item)
  } else {
    res.status(404).send('Not Found')
  }
})

app.listen(LISTEN_PORT, LISTEN_HOST, () => console.log('listening on port ' + LISTEN_PORT));

function addItem(item) {
  if (item.length >= MAX_PAYLOAD_SIZE) {
    throw new Error('payload exceeds maximum size')
  }

  const sha256 = crypto.createHash('sha256')
  const hash = sha256.update(item).digest('hex')

  if (items[hash]) {
    items[hash] = item
    return hash
  }

  if (hashes.length >= MAX_NUM_ITEMS) {
    delete items[hashes[0]]
    hashes.shift()
  }

  hashes.push(hash)
  items[hash] = item

  return hash
}