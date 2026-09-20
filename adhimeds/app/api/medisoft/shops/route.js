// app/api/medisoft/shops/route.js
import { NextResponse } from 'next/server';
import https from 'https';

export async function GET() {
  const username = process.env.MEDISOFT_API_USERNAME;
  const passwordBase64 = process.env.MEDISOFT_API_PASSWORD_BASE64;

  if (!username || !passwordBase64) {
    console.error('Missing credentials');
    return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
  }

  const password = Buffer.from(passwordBase64, 'base64').toString('utf-8');
  const body = JSON.stringify({ username, password });

  const options = {
    hostname: 'api.medisoft.in',
    port: 443,
    path: '/adhapi/shops/getshopslist',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch { json = { raw: data }; }
        resolve(NextResponse.json(json, { status: res.statusCode }));
      });
    });
    req.on('error', (err) => {
      console.error('API error:', err);
      resolve(NextResponse.json({ error: err.message }, { status: 500 }));
    });
    req.write(body);
    req.end();
  });
}

export async function POST() {
  return GET();
}