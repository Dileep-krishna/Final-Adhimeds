const https = require('https');

const options = {
  hostname: 'api.medisoft.in',
  path: '/adhapi/shops/getshopslist',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', (d) => console.log(d.toString()));
});
req.on('error', (e) => console.error('Error:', e));
req.write(JSON.stringify({
  username: process.env.MEDISOFT_API_USERNAME,
  password: process.env.MEDISOFT_API_PASSWORD,
}));
req.end();