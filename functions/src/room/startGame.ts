import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const startGame = async (
  data: {
    roomId: string;
  },
  context: functions.https.CallableContext
) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to start a game'
    );
  }

  const { roomId } = data;

  if (!roomId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Room ID is required'
    );
  }

  const db = admin.firestore();

  try {
    // Get room and verify host
    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Room not found'
      );
    }

    const roomData = roomDoc.data()!;

    if (roomData.hostId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only the host can start the game'
      );
    }

    if (roomData.status !== 'WAITING') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Game has already started or ended'
      );
    }

    // Check if there are players
    const playersSnapshot = await roomRef
      .collection('players')
      .where('isKicked', '==', false)
      .limit(1)
      .get();

    if (playersSnapshot.empty) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Cannot start game without players'
      );
    }

    // Update room status
    await roomRef.update({
      status: 'ACTIVE',
      startedAt: admin.firestore.Timestamp.now(),
      currentQuestionIndex: 0,
    });

    // Update room state to show first question
    const stateRef = roomRef.collection('state').doc('ticks');
    const firstQuestion = await roomRef
      .collection('questions')
      .where('index', '==', 0)
      .limit(1)
      .get();

    if (!firstQuestion.empty) {
      const questionData = firstQuestion.docs[0].data();
      const deadline = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + questionData.timeLimitSec * 1000)
      );

      await stateRef.update({
        serverNow: admin.firestore.Timestamp.now(),
        questionDeadline: deadline,
        currentPhase: 'QUESTION',
        version: admin.firestore.FieldValue.increment(1),
      });
    }

    return {
      success: true,
      message: 'Game started successfully',
    };
  } catch (error: any) {
    console.error('Error starting game:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      'Failed to start game: ' + error.message
    );
  }
};
