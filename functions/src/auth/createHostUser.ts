import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { User } from '../types';

export const createHostUser = async (
  data: {
    email: string;
    password: string;
    displayName: string;
  },
  context: functions.https.CallableContext
) => {
  // Only allow admins to create host users (or allow first user)
  const usersSnapshot = await admin.firestore().collection('users').limit(1).get();
  const isFirstUser = usersSnapshot.empty;
  
  if (!isFirstUser && (!context.auth || !context.auth.token.admin)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can create host users'
    );
  }

  const { email, password, displayName } = data;

  if (!email || !password || !displayName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email, password, and display name are required'
    );
  }

  try {
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // Create Firestore user document
    const userData: User = {
      uid: userRecord.uid,
      email,
      displayName,
      roles: {
        HOST: true,
        ADMIN: isFirstUser, // First user gets admin role
      },
      createdAt: admin.firestore.Timestamp.now(),
      status: 'ACTIVE',
    };

    await admin.firestore().collection('users').doc(userRecord.uid).set(userData);

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      roles: userData.roles,
    });

    return {
      success: true,
      uid: userRecord.uid,
      isAdmin: isFirstUser,
    };
  } catch (error: any) {
    console.error('Error creating host user:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create user: ' + error.message
    );
  }
};
