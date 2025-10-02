import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const endGame = async (
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
        'Only the host can end the game'
      );
    }

    if (roomData.status === 'ENDED') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Game has already ended'
      );
    }

    // Update room status
    await roomRef.update({
      status: 'ENDED',
      endedAt: admin.firestore.Timestamp.now(),
    });

    // Update room state
    const stateRef = roomRef.collection('state').doc('ticks');
    await stateRef.update({
      serverNow: admin.firestore.Timestamp.now(),
      currentPhase: 'FINAL',
      version: admin.firestore.FieldValue.increment(1),
    });

    // Get final leaderboard
    const playersSnapshot = await roomRef
      .collection('players')
      .orderBy('score', 'desc')
      .get();

    const finalResults = playersSnapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        playerId: doc.id,
        displayName: data.displayName,
        score: data.score,
        streak: data.streak,
      };
    });

    // Calculate game statistics
    const answersSnapshot = await roomRef.collection('answers').get();
    const questionsSnapshot = await roomRef.collection('questions').get();

    const gameStats = {
      totalPlayers: playersSnapshot.size,
      totalQuestions: questionsSnapshot.size,
      totalAnswers: answersSnapshot.size,
      averageScore: 0,
      topScore: finalResults[0]?.score || 0,
      duration: 0,
    };

    if (gameStats.totalPlayers > 0) {
      const totalScore = finalResults.reduce((sum, player) => sum + player.score, 0);
      gameStats.averageScore = Math.round(totalScore / gameStats.totalPlayers);
    }

    if (roomData.startedAt) {
      gameStats.duration = Date.now() - roomData.startedAt.toDate().getTime();
    }

    return {
      success: true,
      finalResults,
      gameStats,
    };
  } catch (error: any) {
    console.error('Error ending game:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      'Failed to end game: ' + error.message
    );
  }
};
