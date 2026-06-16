const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
    if (chunk.includes('nodejs')) {
        process.exit(0);
    } else {
        process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
  process.exit(1);
});

req.end();
