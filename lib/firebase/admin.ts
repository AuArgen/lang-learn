import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, '').replace(/\\n/g, '\n')
        }),
      });
    } else {
      console.warn('⚠️ Firebase Admin env vars missing. Initializing dummy project for build step.');
      admin.initializeApp({ projectId: 'dummy-project' });
    }
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed:', error);
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: 'dummy-project' });
    }
  }
}

const adminDb = admin.firestore();

export { admin, adminDb };
