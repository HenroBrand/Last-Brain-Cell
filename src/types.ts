/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GamePhase =
  | 'LOBBY'
  | 'CHALLENGE_REVEAL'
  | 'SUBMISSION'
  | 'REVEAL'
  | 'VOTING'
  | 'SCOREBOARD'
  | 'END_GAME';

export interface Player {
  id: string;
  name: string;
  score: number;
  scoreChange: number;
  isHost: boolean;
  hasSubmitted: boolean;
  votedFor: string | null; // ID of player whose answer they voted for
  lastActive: number;
  emojiReaction?: string;
  emojiTime?: number;
  avatar?: string;
  isSpectator?: boolean;
}

export interface Challenge {
  scenario: string;
  category: string;
}

export interface RoundAnswer {
  playerId: string;
  playerName: string;
  text: string;
  votes: string[]; // List of playerIds who voted for this answer
  bonusAwards: string[]; // e.g. ["Creative", "Unhinged", "Unexpected"]
}

export interface PlayerStats {
  unhingedCount: number;
  creativeCount: number;
  unexpectedCount: number;
  totalVotesReceived: number;
  mostVotesSingleRound: number;
  award: string;
}

export interface RoomState {
  code: string;
  players: Player[];
  phase: GamePhase;
  round: number;
  maxRounds: number;
  challenge: Challenge | null;
  answers: RoundAnswer[];
  revealedAnswerIndex: number; // For step-by-step reveal
  timerDuration: number;
  timerRemaining: number;
  commentary: string;
  statistics: { [playerId: string]: PlayerStats } | null;
  winnerId: string | null;
  language: 'EN' | 'AF';
}

export interface EmojiBroadcast {
  playerId: string;
  playerName: string;
  emoji: string;
  timestamp: number;
}
