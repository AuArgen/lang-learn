import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { signJwtToken } from '@/lib/auth/jwt';
import { cookies, headers } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    // 1. Call EXTERNAL_CHECK_USER_URL
    const checkUserUrl = process.env.EXTERNAL_CHECK_USER_URL;
    const apiKey = process.env.EXTERNAL_API_KEY;

    if (!checkUserUrl || !apiKey) {
      console.warn("External auth config is missing, using mock data for development.");
    }

    let externalUserData;

    // Decode the JWT token to get basic user info
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const tokenPayload = JSON.parse(Buffer.from(base64, 'base64').toString());

    if (checkUserUrl && apiKey && !checkUserUrl.includes("example.com")) {
      // Fetch latest role and subscriptions from external API using google_id
      const response = await fetch(`${checkUserUrl}?google_id=${tokenPayload.google_id}`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to verify user with external service: ${response.status} ${await response.text()}`);
      }
      
      const apiData = await response.json();
      
      let subExpiresAt = null;
      if (apiData.subscriptions && apiData.subscriptions.length > 0) {
         // Try to find an active subscription's expiration date if the array has objects
         subExpiresAt = apiData.subscriptions[0].expires_at || null; 
      }

      externalUserData = {
        id: tokenPayload.google_id,
        name: tokenPayload.name,
        email: tokenPayload.email,
        role: apiData.role,
        subscription_expires_at: subExpiresAt,
      };
    } else {
      // MOCK DATA for development
      console.log('Using MOCK user data');
      externalUserData = {
        id: tokenPayload.google_id || 'mock_google_id_123',
        name: tokenPayload.name || 'Mock User',
        email: tokenPayload.email || 'mock@example.com',
        role: 'TEACHER', // 'USER', 'TEACHER', 'ADMIN'
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    const { id: googleId, name, email, role, subscription_expires_at } = externalUserData;

    // 2. Save/Update user in Database
    try {
      await prisma.user.upsert({
        where: { google_id: googleId },
        update: {
          name,
          email,
          role: role || 'USER',
          subscription_expires_at: subscription_expires_at ? new Date(subscription_expires_at) : null,
        },
        create: {
          id: googleId, // Keep id same as googleId to match legacy logic
          google_id: googleId,
          name,
          email,
          role: role || 'USER',
          subscription_expires_at: subscription_expires_at ? new Date(subscription_expires_at) : null,
        }
      });
      
    } catch (dbError) {
      console.warn('⚠️ Could not save user to Database.', dbError);
    }

    // 3. Generate Custom JWT
    const jwtPayload = {
      userId: googleId,
      role: role || 'USER',
      subscriptionExpiresAt: subscription_expires_at || null,
    };
    
    const customToken = await signJwtToken(jwtPayload);

    // 4. Set HTTP-only Cookie
    const cookieStore = await cookies();
    cookieStore.set('session', customToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const appUrl = process.env.APP_URL || `${protocol}://${host}`;

    // 5. Redirect to Home
    return NextResponse.redirect(`${appUrl}/`);

  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
