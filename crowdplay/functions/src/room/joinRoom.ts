import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Player } from '../types';
import { generatePlayerId, createDeviceHash, sanitizeDisplayName } from '../utils';

export const joinRoom = async (
  data: {
    code: string;
    displayName: string;
    email?: string;
  },
  context: functions.https.CallableContext
) => {
  const { code, displayName, email } = data;

  // Validate input
  if (!code || !displayName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Room code and display name are required'
    );
  }

  const sanitizedName = sanitizeDisplayName(displayName);
  if (sanitizedName.length < 1) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid display name'
    );
  }

  const db = admin.firestore();

  try {
    // Find room by code
    const roomsSnapshot = await db
      .collection('rooms')
      .where('code', '==', code.toUpperCase())
      .where('status', 'in', ['WAITING', 'ACTIVE'])
      .limit(1)
      .get();

    if (roomsSnapshot.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'Room not found or has ended'
      );
    }

    const roomDoc = roomsSnapshot.docs[0];
    const roomData = roomDoc.data();
    const roomId = roomDoc.id;

    // Check if room is locked
    if (roomData.status === 'ACTIVE' && roomData.settings?.lockOnStart) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Room is locked. No new players can join.'
      );
    }

    // Check player count
    const playersSnapshot = await db
      .collection('rooms')
      .doc(roomId)
      .collection('players')
      .where('isKicked', '==', false)
      .get();

    if (playersSnapshot.size >= roomData.maxPlayers) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Room is full'
      );
    }

    // Generate player ID and device hash
    const playerId = generatePlayerId();
    const rawRequest = context.rawRequest;
    const userAgent = rawRequest.headers['user-agent'] || 'unknown';
    const ip = rawRequest.ip || 'unknown';
    const deviceHash = createDeviceHash(userAgent, ip);

    // Create player document
    const playerData: Player = {
      playerId,
      displayName: sanitizedName,
      roomId,
      score: 0,
      streak: 0,
      joinedAt: admin.firestore.Timestamp.now(),
      lastSeenAt: admin.firestore.Timestamp.now(),
      deviceHash,
      isKicked: false,
    };

    // Add email if capture is enabled and email provided
    if (roomData.settings?.captureEmail && email) {
      playerData.email = email;
    }

    await db
      .collection('rooms')
      .doc(roomId)
      .collection('players')
      .doc(playerId)
      .set(playerData);

    // Create custom token for player authentication
    const customToken = await admin.auth().createCustomToken(playerId, {
      roomId,
      playerId,
      deviceHash,
      isPlayer: true,
    });

    return {
      success: true,
      roomId,
      playerId,
      token: customToken,
      roomTitle: roomData.title,
      hostName: roomData.hostName || 'Host',
    };
  } catch (error: any) {
    console.error('Error joining room:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      'Failed to join room: ' + error.message
    );
  }
};
