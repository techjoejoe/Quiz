import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const revealResults = async (
  data: {
    roomId: string;
    questionIndex: number;
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

  const { roomId, questionIndex } = data;

  if (!roomId || questionIndex === undefined) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Room ID and question index are required'
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
        'Only the host can reveal results'
      );
    }

    // Get the question
    const questionSnapshot = await roomRef
      .collection('questions')
      .where('index', '==', questionIndex)
      .limit(1)
      .get();

    if (questionSnapshot.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'Question not found'
      );
    }

    const questionDoc = questionSnapshot.docs[0];
    const questionId = questionDoc.id;

    // Mark question as revealed
    await questionDoc.ref.update({
      revealed: true,
    });

    // Get answer statistics
    const answersSnapshot = await roomRef
      .collection('answers')
      .where('questionId', '==', questionId)
      .get();

    const stats = {
      totalAnswers: answersSnapshot.size,
      correctAnswers: 0,
      averageTime: 0,
      optionCounts: {} as Record<string, number>,
    };

    let totalTime = 0;
    answersSnapshot.forEach((doc) => {
      const answer = doc.data();
      if (answer.isCorrect) {
        stats.correctAnswers++;
      }
      totalTime += answer.latencyMs;
      
      // Count option selections
      if (answer.payload.optionId) {
        stats.optionCounts[answer.payload.optionId] = 
          (stats.optionCounts[answer.payload.optionId] || 0) + 1;
      }
    });

    if (stats.totalAnswers > 0) {
      stats.averageTime = Math.round(totalTime / stats.totalAnswers);
    }

    // Update room state to show results
    const stateRef = roomRef.collection('state').doc('ticks');
    await stateRef.update({
      serverNow: admin.firestore.Timestamp.now(),
      currentPhase: 'RESULTS',
      version: admin.firestore.FieldValue.increment(1),
    });

    // Get updated leaderboard
    const playersSnapshot = await roomRef
      .collection('players')
      .orderBy('score', 'desc')
      .limit(10)
      .get();

    const leaderboard = playersSnapshot.docs.map((doc, index) => ({
      rank: index + 1,
      playerId: doc.id,
      displayName: doc.data().displayName,
      score: doc.data().score,
    }));

    return {
      success: true,
      stats,
      leaderboard,
    };
  } catch (error: any) {
    console.error('Error revealing results:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      'Failed to reveal results: ' + error.message
    );
  }
};
