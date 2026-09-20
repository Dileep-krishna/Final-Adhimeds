// app/api/medisoft/products/route.js
import { NextResponse } from 'next/server';
import https from 'https';

export async function POST(req) {
  try {
    const { shopId } = await req.json();
    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    const username = process.env.MEDISOFT_API_USERNAME;
    const passwordBase64 = process.env.MEDISOFT_API_PASSWORD_BASE64;
    if (!username || !passwordBase64) {
      console.error('Missing credentials for products API');
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
    }
    const password = Buffer.from(passwordBase64, 'base64').toString('utf-8');

    const body = JSON.stringify({ username, password, id: shopId });

    const options = {
      hostname: 'api.medisoft.in',
      port: 443,
      path: '/adhapi/stock/getstockdetails',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    return new Promise((resolve) => {
      const request = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let json;
          try { json = JSON.parse(data); } catch { json = { raw: data }; }
          resolve(NextResponse.json(json, { status: res.statusCode }));
        });
      });
      request.on('error', (err) => {
        console.error('Products API error:', err);
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      });
      request.write(body);
      request.end();
    });
  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Use POST with { shopId }' }, { status: 405 });
}