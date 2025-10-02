import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createRoom } from './room/createRoom';
import { joinRoom } from './room/joinRoom';
import { startGame } from './room/startGame';
import { nextQuestion } from './room/nextQuestion';
import { submitAnswer } from './room/submitAnswer';
import { revealResults } from './room/revealResults';
import { endGame } from './room/endGame';
import { createHostUser } from './auth/createHostUser';

// Initialize Firebase Admin
admin.initializeApp();

// Auth Functions
export const createHost = functions
  .region('us-central1')
  .https.onCall(createHostUser);

// Room Management Functions
export const create = functions
  .region('us-central1')
  .https.onCall(createRoom);

export const join = functions
  .region('us-central1')
  .https.onCall(joinRoom);

export const start = functions
  .region('us-central1')
  .https.onCall(startGame);

export const next = functions
  .region('us-central1')
  .https.onCall(nextQuestion);

export const answer = functions
  .region('us-central1')
  .https.onCall(submitAnswer);

export const reveal = functions
  .region('us-central1')
  .https.onCall(revealResults);

export const end = functions
  .region('us-central1')
  .https.onCall(endGame);
