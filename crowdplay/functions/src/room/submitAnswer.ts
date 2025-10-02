import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Answer } from '../types';
import { calculatePoints, checkNumericAnswer } from '../utils';

export const submitAnswer = async (
  data: {
    roomId: string;
    playerId: string;
    questionIndex: number;
    answer: {
      optionId?: string;
      numericValue?: number;
      booleanValue?: boolean;
    };
  },
  context: functions.https.CallableContext
) => {
  // Verify player token
  if (!context.auth || !context.auth.token.isPlayer) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated as a player'
    );
  }

  const { roomId, playerId, questionIndex, answer } = data;

  // Validate that player ID matches token
  if (context.auth.token.playerId !== playerId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Player ID mismatch'
    );
  }

  // Validate that room ID matches token
  if (context.auth.token.roomId !== roomId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Room ID mismatch'
    );
  }

  const db = admin.firestore();
  const startTime = Date.now();

  try {
    // Get room and verify it's active
    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Room not found'
      );
    }

    const roomData = roomDoc.data()!;

    if (roomData.status !== 'ACTIVE') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Game is not active'
      );
    }

    if (roomData.currentQuestionIndex !== questionIndex) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Question index mismatch'
      );
    }

    // Check if player exists and is not kicked
    const playerDoc = await roomRef.collection('players').doc(playerId).get();
    
    if (!playerDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Player not found'
      );
    }

    const playerData = playerDoc.data()!;
    
    if (playerData.isKicked) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Player has been removed from the game'
      );
    }

    // Get current question
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
    const questionData = questionDoc.data();

    // Check if answer already exists
    const existingAnswer = await roomRef
      .collection('answers')
      .where('playerId', '==', playerId)
      .where('questionId', '==', questionDoc.id)
      .limit(1)
      .get();

    if (!existingAnswer.empty) {
      throw new functions.https.HttpsError(
        'already-exists',
        'Answer already submitted'
      );
    }

    // Get room state to check deadline
    const stateDoc = await roomRef.collection('state').doc('ticks').get();
    const stateData = stateDoc.data()!;

    if (stateData.questionDeadline) {
      const deadline = stateData.questionDeadline.toDate();
      if (Date.now() > deadline.getTime()) {
        throw new functions.https.HttpsError(
          'deadline-exceeded',
          'Answer submission deadline has passed'
        );
      }
    }

    // Calculate if answer is correct
    let isCorrect = false;
    const latencyMs = Date.now() - startTime;

    switch (questionData.type) {
      case 'MC':
      case 'IMG':
        isCorrect = answer.optionId === questionData.correctOptionId;
        break;
      case 'TF':
        isCorrect = answer.booleanValue === (questionData.correctOptionId === 'true');
        break;
      case 'NUM':
        if (answer.numericValue !== undefined && questionData.numRule) {
          isCorrect = checkNumericAnswer(
            answer.numericValue,
            questionData.numRule.exactValue,
            questionData.numRule.tolerance || 0
          );
        }
        break;
      case 'POLL':
        // Polls have no correct answer
        isCorrect = false;
        break;
    }

    // Calculate points
    const pointsEarned = calculatePoints(
      isCorrect,
      questionData.pointsBase,
      questionData.pointsSpeedFactor || 0,
      latencyMs,
      questionData.timeLimitSec * 1000
    );

    // Create answer document
    const answerData: Answer = {
      answerId: db.collection('answers').doc().id,
      playerId,
      questionId: questionDoc.id,
      roomId,
      payload: answer,
      isCorrect,
      pointsEarned,
      latencyMs,
      createdAt: admin.firestore.Timestamp.now(),
    };

    // Use transaction to update player score and save answer
    await db.runTransaction(async (transaction) => {
      const playerRef = roomRef.collection('players').doc(playerId);
      const playerDoc = await transaction.get(playerRef);
      
      if (!playerDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Player not found in transaction'
        );
      }

      const currentPlayerData = playerDoc.data()!;
      const newStreak = isCorrect ? currentPlayerData.streak + 1 : 0;
      const newScore = currentPlayerData.score + pointsEarned;

      transaction.update(playerRef, {
        score: newScore,
        streak: newStreak,
        lastSeenAt: admin.firestore.Timestamp.now(),
      });

      const answerRef = roomRef.collection('answers').doc();
      transaction.set(answerRef, answerData);
    });

    return {
      success: true,
      isCorrect,
      pointsEarned,
      newScore: playerData.score + pointsEarned,
    };
  } catch (error: any) {
    console.error('Error submitting answer:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      'Failed to submit answer: ' + error.message
    );
  }
};
