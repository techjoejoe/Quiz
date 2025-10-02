import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const nextQuestion = async (
  data: {
    roomId: string;
  },
  context: functions.https.CallableContext
) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
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
        'Only the host can advance questions'
      );
    }

    if (roomData.status !== 'ACTIVE') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Game is not active'
      );
    }

    const nextIndex = roomData.currentQuestionIndex + 1;

    if (nextIndex >= roomData.totalQuestions) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No more questions available'
      );
    }

    // Update room with new question index
    await roomRef.update({
      currentQuestionIndex: nextIndex,
    });

    // Get the next question
    const nextQuestionSnapshot = await roomRef
      .collection('questions')
      .where('index', '==', nextIndex)
      .limit(1)
      .get();

    if (nextQuestionSnapshot.empty) {
      throw new functions.https.HttpsError(
        'internal',
        'Question not found'
      );
    }

    const questionData = nextQuestionSnapshot.docs[0].data();
    const deadline = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + questionData.timeLimitSec * 1000)
    );

    // Update room state
    const stateRef = roomRef.collection('state').doc('ticks');
    await stateRef.update({
      serverNow: admin.firestore.Timestamp.now(),
      questionDeadline: deadline,
      currentPhase: 'QUESTION',
      version: admin.firestore.FieldValue.increment(1),
    });

    return {
      success: true,
      questionIndex: nextIndex,
      totalQuestions: roomData.totalQuestions,
    };
  } catch (error: any) {
    console.error('Error advancing to next question:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      'Failed to advance question: ' + error.message
    );
  }
};
