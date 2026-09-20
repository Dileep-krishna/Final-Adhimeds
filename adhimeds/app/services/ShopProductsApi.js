import { NextResponse } from 'next/server';

export async function POST(req) {
  // 1. Authenticate using Bearer token
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse and validate body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { shopId } = body;
  if (!shopId || typeof shopId !== 'string') {
    return NextResponse.json({ error: 'shopId is required and must be a string' }, { status: 400 });
  }

  // 3. Check credentials from env
  const username = process.env.MEDISOFT_API_USERNAME;
  const password = process.env.MEDISOFT_API_PASSWORD;
  if (!username || !password) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // 4. Optional authorization check (commented out)

  // 5. External API call with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch('https://api.medisoft.in/adhapi/stock/getstockdetails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, id: shopId }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await res.json();

    // 6. Sanitize response
    const sanitizedData = {
      success: res.ok,
      products: data.products || [],
      total: data.total || 0,
    };

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: res.status });
    }

    return NextResponse.json(sanitizedData);
  } catch (error) {
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'External API timeout' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}