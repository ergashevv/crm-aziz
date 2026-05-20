import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  if (username === 'admin' && password === 'admin1234') {
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return response;
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
