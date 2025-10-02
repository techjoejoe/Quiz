import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Room, Question } from '../types';
import { generateRoomCode } from '../utils';

export const createRoom = async (
  data: {
    title: string;
    mode: 'LIVE' | 'ASYNC';
    maxPlayers: number;
    questions: Array<Omit<Question, 'questionId' | 'revealed'>>;
    settings?: {
      lockOnStart?: boolean;
      showLeaderboard?: boolean;
      captureEmail?: boolean;
      shuffleOptions?: boolean;
    };
  },
  context: functions.https.CallableContext
) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to create a room'
    );
  }

  // Verify host role
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get();
  
  if (!userDoc.exists || !userDoc.data()?.roles?.HOST) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Must be a host to create rooms'
    );
  }

  const { title, mode, maxPlayers, questions, settings = {} } = data;

  // Validate input
  if (!title || !mode || !maxPlayers || !questions || questions.length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Title, mode, max players, and at least one question are required'
    );
  }

  if (maxPlayers < 1 || maxPlayers > 200) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Max players must be between 1 and 200'
    );
  }

  const db = admin.firestore();
  
  try {
    // Generate unique room code
    let code = '';
    let codeExists = true;
    let attempts = 0;
    
    while (codeExists && attempts < 10) {
      code = generateRoomCode();
      const existingRoom = await db
        .collection('rooms')
        .where('code', '==', code)
        .where('status', 'in', ['WAITING', 'ACTIVE'])
        .limit(1)
        .get();
      
      codeExists = !existingRoom.empty;
      attempts++;
    }

    if (codeExists) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Could not generate unique room code'
      );
    }

    // Create room document
    const roomRef = db.collection('rooms').doc();
    const roomData: Room = {
      roomId: roomRef.id,
      hostId: context.auth.uid,
      code,
      title,
      mode,
      status: 'WAITING',
      maxPlayers,
      allowAnonymous: true,
      currentQuestionIndex: -1,
      totalQuestions: questions.length,
      createdAt: admin.firestore.Timestamp.now(),
      settings: {
        lockOnStart: settings.lockOnStart || false,
        showLeaderboard: settings.showLeaderboard !== false,
        captureEmail: settings.captureEmail || false,
        shuffleOptions: settings.shuffleOptions !== false,
      },
    };

    await roomRef.set(roomData);

    // Add questions
    const batch = db.batch();
    questions.forEach((question, index) => {
      const questionRef = roomRef.collection('questions').doc();
      batch.set(questionRef, {
        ...question,
        questionId: questionRef.id,
        index,
        revealed: false,
      });
    });

    // Initialize room state
    const stateRef = roomRef.collection('state').doc('ticks');
    batch.set(stateRef, {
      serverNow: admin.firestore.Timestamp.now(),
      version: 1,
      currentPhase: 'LOBBY',
    });

    await batch.commit();

    return {
      roomId: roomRef.id,
      code,
      joinUrl: `https://play.crowdplay.app/join/${code}`,
    };
  } catch (error: any) {
    console.error('Error creating room:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create room: ' + error.message
    );
  }
};
