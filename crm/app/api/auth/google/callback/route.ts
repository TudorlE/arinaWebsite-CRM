import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateGoogleUser } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get('oauth_state')?.value;

  // CSRF protection
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=no_code`);
  }

  const clearState = (res: NextResponse) => {
    res.cookies.delete('oauth_state');
    return res;
  };

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    // Exchange authorization code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      return clearState(NextResponse.redirect(`${baseUrl}/login?error=token_exchange`));
    }

    const tokens = await tokenRes.json() as { access_token: string };

    // Get user profile from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      return clearState(NextResponse.redirect(`${baseUrl}/login?error=userinfo`));
    }

    const profile = await userRes.json() as { sub: string; email: string; name: string };

    if (!profile.email || !profile.sub) {
      return clearState(NextResponse.redirect(`${baseUrl}/login?error=missing_profile`));
    }

    // Find or create user in our DB (pending approval if new)
    const user = findOrCreateGoogleUser(profile.sub, profile.name ?? profile.email, profile.email);

    if (user.status === 'pending') {
      return clearState(NextResponse.redirect(`${baseUrl}/login?google=pending`));
    }
    if (user.status === 'rejected') {
      return clearState(NextResponse.redirect(`${baseUrl}/login?google=rejected`));
    }

    const jwtToken = await signToken({ userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.redirect(`${baseUrl}/`);
    response.cookies.set('auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return clearState(response);
  } catch (e) {
    console.error('[google/callback]', e);
    return clearState(NextResponse.redirect(`${baseUrl}/login?error=server`));
  }
}
