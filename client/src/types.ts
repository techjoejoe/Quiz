import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  roles: {
    HOST?: boolean;
    ADMIN?: boolean;
    ANALYST?: boolean;
  };
  createdAt: Timestamp;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Room {
  roomId: string;
  hostId: string;
  code: string;
  title: string;
  mode: 'LIVE' | 'ASYNC';
  status: 'WAITING' | 'ACTIVE' | 'ENDED';
  maxPlayers: number;
  allowAnonymous: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  settings: {
    lockOnStart: boolean;
    showLeaderboard: boolean;
    captureEmail: boolean;
    shuffleOptions: boolean;
  };
}

export interface Player {
  playerId: string;
  displayName: string;
  email?: string;
  roomId: string;
  score: number;
  streak: number;
  joinedAt: Timestamp;
  lastSeenAt: Timestamp;
  deviceHash: string;
  isKicked: boolean;
}

export type QuestionType = 'MC' | 'TF' | 'IMG' | 'POLL' | 'NUM';

export interface Question {
  questionId: string;
  index: number;
  type: QuestionType;
  text: string;
  media?: {
    imageUrl?: string;
  };
  options?: Array<{
    id: string;
    text: string;
    imageUrl?: string;
  }>;
  correctOptionId?: string;
  numRule?: {
    exactValue: number;
    tolerance?: number;
  };
  timeLimitSec: number;
  pointsBase: number;
  pointsSpeedFactor: number;
  revealed: boolean;
}

export interface Answer {
  answerId: string;
  playerId: string;
  questionId: string;
  roomId: string;
  payload: {
    optionId?: string;
    numericValue?: number;
    booleanValue?: boolean;
  };
  isCorrect: boolean;
  pointsEarned: number;
  latencyMs: number;
  createdAt: Timestamp;
}

export interface RoomState {
  serverNow: Timestamp;
  questionDeadline?: Timestamp;
  version: number;
  currentPhase: 'LOBBY' | 'QUESTION' | 'RESULTS' | 'LEADERBOARD' | 'FINAL';
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
  streak?: number;
}
