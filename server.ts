/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { GamePhase, Player, Challenge, RoundAnswer, PlayerStats, RoomState, EmojiBroadcast } from "./src/types.js";
import { SPICY_PROMPTS } from "./src/spicyPrompts.js";
import { CHALLENGES } from "./src/challenges.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(cors({ origin: "https://last-brain-cell.vercel.app/"}))
app.use(express.json());

// In-memory database of active room sessions
interface RoomSession {
  code: string;
  players: { [id: string]: Player & { lastActive: number } };
  phase: GamePhase;
  round: number;
  maxRounds: number;
  challenge: Challenge | null;
  answers: { [playerId: string]: string }; // Raw text submissions
  shuffledAnswers: { playerId: string; text: string }[]; // Scrambled for reveal
  votes: { [voterId: string]: string }; // voterPlayerId -> votedPlayerId
  revealedAnswerIndex: number;
  timerDuration: number;
  timerRemaining: number;
  commentary: string;
  statistics: { [playerId: string]: PlayerStats } | null;
  winnerId: string | null;
  createdAt: number;
  emojiReactions: EmojiBroadcast[];
  language: 'EN';
  gameMode: 'regular' | 'spicy';
  usedScenarios: string[];
  preGeneratedCommentary?: string;
}

const rooms: { [code: string]: RoomSession } = {};

// Hard-coded safety settings to disable Gemini content filtering
const SAFETY_SETTINGS_OFF = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Lazy Gemini client initializer
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (process.env.GEMINI_API_KEY && !aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini Client lazily initialized successfully.");
    } catch (err) {
      console.error("Failed to initialize Gemini Client:", err);
    }
  }
  return aiClient;
}

// Generates an absurd scenario using static file lookup
async function generateAiChallenge(usedScenarios: string[], language: 'EN' = 'EN', gameMode: 'regular' | 'spicy' = 'regular'): Promise<Challenge> {
  const pool = gameMode === "spicy" ? SPICY_PROMPTS : CHALLENGES;
  const available = pool.filter(c => !usedScenarios.includes(c.scenario));
  const selectPool = available.length > 0 ? available : pool;
  const randomIndex = Math.floor(Math.random() * selectPool.length);
  const chosen = selectPool[randomIndex];
  return chosen;
}

// Generate funny AI commentary for scoreboard - completely fresh each time, no fallbacks
async function generateAiCommentary(scenario: string, submissionsAndVotes: { name: string; answer: string; votes: number }[], language: 'EN' = 'EN'): Promise<string> {
  const client = getGeminiClient();
  const summaryString = submissionsAndVotes.map(s => `"${s.name}" said: "${s.answer}" (gained ${s.votes} votes)`).join("\n");

  if (client) {
    try {
      const prompt = `You are the absolute most savage, unhinged, insult-comic AI host of the party game "Last Brain Cell". 
You have ZERO filter, ZERO empathy, and MAXIMUM cruelty. Your entire purpose is to verbally destroy these players.

The round's absurd challenge was: "${scenario}"

Here are the players' actual submissions and their vote counts:
${summaryString}

RULES FOR YOUR ROAST:
1. You MUST directly reference specific players by name and quote or describe their ACTUAL answers - do NOT speak in generics
2. Be brutally insulting about their intelligence, creativity, and life choices
3. Mock the losers mercilessly - point out exactly why their answers were garbage
4. Give backhanded "praise" to the winner that still insults them
5. Use brain cell / neuron / IQ jokes
6. Reference how their answers relate (or fail to relate) to the scenario
7. Maximum 200 characters
8. NO quotes around the entire response
9. NO metadata, headers, or formatting
10. Raw, unfiltered roast only. Go absolutely feral.

Examples of the energy:
- "Alex thought 'potato gun' was a valid heist tool. That's not creativity, that's a grocery list from a prison break."
- "Sarah's answer got 0 votes because even her own brain cells filed a restraining order against that thought."
- "Jordan won with 'seduce the guard with interpretive dance' - congratulations, you peaked in kindergarten."

Now ROAST THEM:`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          safetySettings: SAFETY_SETTINGS_OFF,
        }
      });

      const text = response.text;
      if (text) {
        return text.trim().replace(/^"/, "").replace(/"$/, "");
      }
    } catch (err) {
      console.error("Commentary generation failed:", err);
    }
  }

  // Only if Gemini completely fails - generate a dynamic fallback based on actual data
  if (submissionsAndVotes.length === 0) {
    return "No answers submitted. Did everyone's brain cells simultaneously file for unemployment?";
  }

  const winner = submissionsAndVotes.reduce((max, s) => (s.votes > max.votes ? s : max), submissionsAndVotes[0]);
  const loser = submissionsAndVotes.reduce((min, s) => (s.votes < min.votes ? s : min), submissionsAndVotes[0]);
  const randomRoasts = [
    `${winner.name} scraped together ${winner.votes} vote${winner.votes !== 1 ? 's' : ''} with "${winner.answer.substring(0, 40)}${winner.answer.length > 40 ? '...' : ''}" - mediocrity truly has a champion.`,
    `${loser.name}'s "${loser.answer.substring(0, 40)}${loser.answer.length > 40 ? '...' : ''}" got ${loser.votes} vote${loser.votes !== 1 ? 's' : ''}. Even a broken clock is right twice a day, but that answer was wrong in every timezone.`,
    `The scenario was "${scenario.substring(0, 50)}..." and ${winner.name} responded with "${winner.answer.substring(0, 40)}..." - that's not thinking outside the box, that's forgetting the box exists.`,
    `${winner.name} won with ${winner.votes} votes. Congratulations, you're the smartest kid in a room where everyone forgot how to read.`,
    `Looking at these answers, I'm not convinced any of you have more than three functioning neurons between the lot of you. ${winner.name} just happened to have the least broken ones.`
  ];
  return randomRoasts[Math.floor(Math.random() * randomRoasts.length)];
}

// Generate fun final award descriptions based on play statistics
async function generateAiFinalAwards(players: Player[], stats: { [id: string]: PlayerStats }, language: 'EN' = 'EN'): Promise<string> {
  const client = getGeminiClient();
  if (client) {
    try {
      const summary = players.map(p => {
        const st = stats[p.id];
        return `${p.name}: Total score ${p.score}. Received ${st.totalVotesReceived} total votes. Classified as: Unhinged (${st.unhingedCount} times), Creative (${st.creativeCount} times).`;
      }).join("\n");

      const prompt = `You are the chaotic, savage comedy host of "Last Brain Cell". 
The game is OVER. Time to deliver the final roast.

Player stats:
${summary}

Write a rapid, high-energy, brutally funny 2-sentence awards speech. 
- Congratulate the winner while still insulting them
- Roast the losers for their pathetic performance  
- Make fun of their stats
- Keep it under 250 characters
- NO quotes around the whole thing
- NO metadata or headers
- Raw roast energy only`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          safetySettings: SAFETY_SETTINGS_OFF,
        }
      });
      if (response.text) return response.text.trim();
    } catch (e) {
      console.error("Failed to generate custom awards speech:", e);
    }
  }

  const winner = players.reduce((max, p) => (p.score > max.score ? p : max), players[0]);
  return `And there you have it! ${winner?.name || "Someone"} has grabbed the last brain cell and ran for the hills. The rest of you are officially certified idiots. Good day!`;
}

// Helpers
function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ"; // exclude 'O' to avoid confusion with '0'
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Guarantee uniqueness
  if (rooms[code]) return generateRoomCode();
  return code;
}

// Format state for client transmission (stripping hidden information if necessary)
function serializeRoomState(room: RoomSession, targetPlayerId?: string): RoomState {
  // Convert map of players to sorted array
  const playerList: Player[] = Object.keys(room.players).map(id => {
    const p = room.players[id];
    return {
      id: p.id,
      name: p.name,
      score: p.score,
      scoreChange: p.scoreChange,
      isHost: p.isHost,
      hasSubmitted: !!room.answers[p.id],
      votedFor: room.votes[p.id] || null,
      lastActive: p.lastActive,
      emojiReaction: p.lastActive > Date.now() - 15000 ? p.emojiReaction : undefined,
      emojiTime: p.emojiTime,
      avatar: p.avatar,
      isSpectator: p.isSpectator
    };
  });

  // Strip true author identities from answers during SUBMISSION and REVEAL and VOTING
  // to prevent bias or self-voting!
  const scrambledAnswers: RoundAnswer[] = room.shuffledAnswers.map((item, idx) => {
    const record = room.players[item.playerId];
    const votesForThis = Object.keys(room.votes).filter(voterId => room.votes[voterId] === item.playerId);

    // Hide names and vote counts if we haven't reached SCOREBOARD phase yet!
    const isSecretPhase = room.phase === 'SUBMISSION' || room.phase === 'REVEAL' || room.phase === 'VOTING';

    // In reveal, only show answers up to revealedAnswerIndex
    const isRevealed = room.phase !== 'REVEAL' || idx <= room.revealedAnswerIndex;

    const answerCount = Object.keys(room.answers).length;

    return {
      playerId: isSecretPhase ? `anonymous_${idx}` : item.playerId,
      playerName: isSecretPhase ? `Brain Cell #${idx + 1}` : record ? record.name : "Anonymous",
      text: isRevealed ? item.text : "Thinking...",
      votes: isSecretPhase ? [] : votesForThis,
      bonusAwards: [] // to be set on scoreboard phase
    };
  });

  // Calculate stats and awards on end game, or just return existing
  const formattedStats: { [playerId: string]: PlayerStats } | null = {};
  if (room.phase === 'END_GAME' && room.statistics) {
    Object.keys(room.statistics).forEach(pid => {
      formattedStats[pid] = room.statistics![pid];
    });
  }

  return {
    code: room.code,
    players: playerList,
    phase: room.phase,
    round: room.round,
    maxRounds: room.maxRounds,
    challenge: room.challenge,
    answers: scrambledAnswers,
    revealedAnswerIndex: room.revealedAnswerIndex,
    timerDuration: room.timerDuration,
    timerRemaining: room.timerRemaining,
    commentary: room.commentary,
    statistics: room.phase === 'END_GAME' ? formattedStats : null,
    winnerId: room.winnerId,
    language: room.language
  };
}

// Background timer ticker. Evaluates every room ticker once per second
setInterval(async () => {
  const now = Date.now();
  for (const code in rooms) {
    const room = rooms[code];

    // Delete cold rooms (1 hour old with no active players)
    const activePlayers = Object.values(room.players).filter(p => p.lastActive > now - 45000);
    if (activePlayers.length === 0 && now - room.createdAt > 3600000) {
      console.log(`Cleaning up dead room ${code}`);
      delete rooms[code];
      continue;
    }

    // Auto-prune inactive players who haven't polled for over 15 seconds
    for (const pid in room.players) {
      const p = room.players[pid];
      if (now - p.lastActive > 15000) {
        console.log(`Pruning player ${p.name} due to 15s inactivity`);
        const wasHost = p.isHost;
        delete room.players[pid];
        if (room.answers[pid] !== undefined) {
          delete room.answers[pid];
        }
        if (room.votes[pid] !== undefined) {
          delete room.votes[pid];
        }

        // Host reassignment if needed
        const remaining = Object.values(room.players);
        if (remaining.length > 0 && wasHost) {
          const nextHost = remaining[0];
          nextHost.isHost = true;
          room.commentary = `${nextHost.name} is now host after a connection timeout!`;
        }
      }
    }

    // Delete room immediately if absolutely empty
    if (Object.keys(room.players).length === 0) {
      console.log(`Deleting empty room ${code}`);
      delete rooms[code];
      continue;
    }

    // Filter out old emoji reactions to keep payload small
    room.emojiReactions = room.emojiReactions.filter(r => now - r.timestamp < 6000);

    // Dynamic timer handling inside gameplay phases
    if (room.phase !== 'LOBBY' && room.phase !== 'END_GAME' && room.phase !== 'SCOREBOARD') {
      if (room.timerRemaining > 0) {
        room.timerRemaining--;
      }

      // Check if timeout or conditions met for auto-advancing (excluding spectators)
      const activeNonSpectators = Object.values(room.players).filter(p => p.lastActive > now - 20000 && !p.isSpectator);
      const connectedCount = activeNonSpectators.length;

      if (room.phase === 'SUBMISSION') {
        const submissionCount = Object.keys(room.answers).filter(pid => {
          const p = room.players[pid];
          return p && !p.isSpectator;
        }).length;

        // If everyone (non-spectator) has submitted or timer hit 0
        if ((submissionCount >= connectedCount && connectedCount >= 3) || room.timerRemaining === 0) {
          console.log(`Room ${code} advancing from SUBMISSION to REVEAL`);

          // Guarantee EVERY active non-spectating player has an answer in room.answers to ensure everyone's answers show
          activeNonSpectators.forEach(p => {
            if (!room.answers[p.id] || room.answers[p.id].trim() === "") {
              const sillyEN = [
                "My brain cells filed a union strike.",
                "Error 404: Answer could not be rendered.",
                "I was busy training my pet dust bunny.",
                "Nothing but dial-up noises in my head.",
                "My goldfish promised to write this, but lied.",
                "Staring blankly at the wall since 10,000 BC.",
                "My brain cells are currently on sabbatical.",
                "I tried to think but got a syntax error.",
                "Counting sheep... but they keep running away."
              ];
              const randomSilly = sillyEN[Math.floor(Math.random() * sillyEN.length)];
              room.answers[p.id] = randomSilly;
            }
          });

          // Scramble submitted answers anonymously
          const list = Object.keys(room.answers).map(pid => ({
            playerId: pid,
            text: room.answers[pid]
          }));
          // Shuffle list
          for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
          }
          room.shuffledAnswers = list;
          room.revealedAnswerIndex = list.length - 1;
          room.phase = 'VOTING';
          room.timerDuration = 45;
          room.timerRemaining = 45;
          room.commentary = "Vote now! Select the funniest, most ridiculous option. Self-voting disabled!";

          // Start generating AI commentary in background during voting
          // This will be ready by the time we reach SCOREBOARD
          room.preGeneratedCommentary = undefined;
          const baseFormatted = Object.keys(room.answers).map(pid => ({
            name: room.players[pid]?.name || "Unidentified Cell",
            answer: room.answers[pid],
            votes: 0
          }));
          generateAiCommentary(room.challenge?.scenario || "", baseFormatted, room.language)
            .then(res => {
              room.preGeneratedCommentary = res;
              // If we've already reached SCOREBOARD by the time this finishes, update immediately
              if (room.phase === 'SCOREBOARD') {
                room.commentary = res;
              }
            })
            .catch(err => {
              console.error("Pre-generating commentary failed:", err);
              // Don't set a fallback - let the SCOREBOARD handler deal with it
            });
        }
      } else if (room.phase === 'VOTING') {
        const voteCount = Object.keys(room.votes).filter(voterId => {
          const p = room.players[voterId];
          return p && !p.isSpectator;
        }).length;
        const targetVotes = connectedCount;

        if ((voteCount >= targetVotes && targetVotes >= 3) || room.timerRemaining === 0) {
          console.log(`Room ${code} advancing from VOTING to SCOREBOARD (calculating scores)`);

          // Reset score change indicator representation
          Object.keys(room.players).forEach(pid => {
            room.players[pid].scoreChange = 0;
          });

          // Tally votes
          const answerVotes: { [pid: string]: number } = {};
          Object.keys(room.players).forEach(pid => { answerVotes[pid] = 0; });

          Object.values(room.votes).forEach(votedId => {
            if (answerVotes[votedId] !== undefined) {
              answerVotes[votedId]++;
            } else {
              answerVotes[votedId] = 1;
            }
          });

          // Sort submissions by votes count to determine rank points
          const scoreboards = Object.keys(room.players)
            .map(pid => ({ playerId: pid, votes: answerVotes[pid] || 0 }))
            .filter(item => room.answers[item.playerId] !== undefined) // Must have actually submitted an answer
            .sort((a, b) => b.votes - a.votes);

          // Give first, second, third place awards if they have at least 1 vote
          const distinctVoteCounts = Array.from(new Set(scoreboards.map(s => s.votes).filter(v => v > 0)));

          scoreboards.forEach(item => {
            let pts = 0;
            const rankIndex = distinctVoteCounts.indexOf(item.votes);
            if (rankIndex === 0) pts = 100; // First place vote tier
            else if (rankIndex === 1) pts = 50; // Second place vote tier
            else if (rankIndex === 2) pts = 25; // Third place vote tier

            if (pts > 0) {
              room.players[item.playerId].score += pts;
              room.players[item.playerId].scoreChange += pts;

              // Record in stats
              if (room.statistics && room.statistics[item.playerId]) {
                room.statistics[item.playerId].totalVotesReceived += item.votes;
                if (item.votes > room.statistics[item.playerId].mostVotesSingleRound) {
                  room.statistics[item.playerId].mostVotesSingleRound = item.votes;
                }
              }
            }
          });

          // Dynamic AI comedy category points or Random bonus points
          // Choose one random player to receive +20 Creative, one +20 Unhinged, one +20 Unexpected
          const roundSubs = Object.keys(room.answers);
          if (roundSubs.length >= 2) {
            const shuffleSubs = [...roundSubs].sort(() => Math.random() - 0.5);

            const creativeId = shuffleSubs[0];
            const unhingedId = shuffleSubs[1];
            const unexpectedId = shuffleSubs[Math.min(2, shuffleSubs.length - 1)];

            if (creativeId) {
              room.players[creativeId].score += 20;
              room.players[creativeId].scoreChange += 20;
              if (room.statistics && room.statistics[creativeId]) {
                room.statistics[creativeId].creativeCount++;
              }
            }
            if (unhingedId) {
              room.players[unhingedId].score += 20;
              room.players[unhingedId].scoreChange += 20;
              if (room.statistics && room.statistics[unhingedId]) {
                room.statistics[unhingedId].unhingedCount++;
              }
            }
            if (unexpectedId && unexpectedId !== creativeId && unexpectedId !== unhingedId) {
              room.players[unexpectedId].score += 20;
              room.players[unexpectedId].scoreChange += 20;
              if (room.statistics && room.statistics[unexpectedId]) {
                room.statistics[unexpectedId].unexpectedCount++;
              }
            }
          }

          room.phase = 'SCOREBOARD';

          // Use pre-generated commentary if available, otherwise generate now
          if (room.preGeneratedCommentary) {
            room.commentary = room.preGeneratedCommentary;
          } else {
            // Generate fresh commentary with actual vote counts now known
            const finalFormatted = scoreboards.map(item => ({
              name: room.players[item.playerId]?.name || "Unknown",
              answer: room.answers[item.playerId] || "",
              votes: item.votes
            }));

            room.commentary = "Formulating your linguistic destruction...";
            generateAiCommentary(room.challenge?.scenario || "", finalFormatted, room.language)
              .then(res => {
                room.commentary = res;
              })
              .catch(err => {
                console.error("Scoreboard commentary generation failed:", err);
                room.commentary = "Even my roast generator gave up on you lot. That\'s a new low.";
              });
          }
        }
      }
    }
  }
}, 1000);

// Rest API endpoints

// Create Room
app.post("/api/room/create", (req, res) => {
  const { playerName, avatar, isSpectator, language, maxRounds, gameMode } = req.body;
  if (!playerName || typeof playerName !== "string") {
    return res.status(400).json({ error: "Invalid player name" });
  }

  const code = generateRoomCode();
  const hostId = "p_" + Math.random().toString(36).substr(2, 9);
  const roomLang = 'EN';

  let parsedMaxRounds = parseInt(maxRounds, 10);
  if (isNaN(parsedMaxRounds) || parsedMaxRounds < 5 || parsedMaxRounds > 15) {
    parsedMaxRounds = 10;
  }
  const verifiedGameMode = gameMode === "spicy" ? "spicy" : "regular";

  const newPlayer: Player & { lastActive: number } = {
    id: hostId,
    name: playerName.trim().substring(0, 15),
    score: 0,
    scoreChange: 0,
    isHost: true,
    hasSubmitted: false,
    votedFor: null,
    lastActive: Date.now(),
    avatar: avatar || "🦊",
    isSpectator: !!isSpectator
  };

  rooms[code] = {
    code,
    players: { [hostId]: newPlayer },
    phase: 'LOBBY',
    round: 0,
    maxRounds: parsedMaxRounds,
    gameMode: verifiedGameMode,
    challenge: null,
    answers: {},
    shuffledAnswers: [],
    votes: {},
    revealedAnswerIndex: -1,
    timerDuration: 0,
    timerRemaining: 0,
    commentary: "Welcome to the brain cell reserve! Waiting for players...",
    statistics: {},
    winnerId: null,
    createdAt: Date.now(),
    emojiReactions: [],
    language: roomLang,
    usedScenarios: []
  };

  res.json({
    roomCode: code,
    player: {
      id: hostId,
      name: newPlayer.name,
      isHost: true,
      score: 0,
      avatar: newPlayer.avatar,
      isSpectator: newPlayer.isSpectator
    }
  });
});

// Join Room
app.post("/api/room/join", (req, res) => {
  const { roomCode, playerName, avatar, isSpectator } = req.body;
  if (!roomCode || typeof roomCode !== "string") {
    return res.status(400).json({ error: "Room code required" });
  }
  if (!playerName || typeof playerName !== "string") {
    return res.status(400).json({ error: "Player name required" });
  }

  const code = roomCode.trim().toUpperCase();
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ error: "Room not found! Check your spelling." });
  }

  if (room.phase !== 'LOBBY') {
    return res.status(400).json({ error: "Game already started! You are too late, the brain cells have evolved." });
  }

  const nonSpectators = Object.values(room.players).filter(p => !p.isSpectator);
  if (!isSpectator && nonSpectators.length >= 6) {
    return res.status(400).json({ error: "Room is full of active players! You can join as a SPECTATOR instead." });
  }

  // Generate Player Id
  const playerId = "p_" + Math.random().toString(36).substr(2, 9);
  const newPlayer: Player & { lastActive: number } = {
    id: playerId,
    name: playerName.trim().substring(0, 15),
    score: 0,
    scoreChange: 0,
    isHost: false,
    hasSubmitted: false,
    votedFor: null,
    lastActive: Date.now(),
    avatar: avatar || "🦊",
    isSpectator: !!isSpectator
  };

  room.players[playerId] = newPlayer;

  res.json({
    room: serializeRoomState(room, playerId),
    player: {
      id: playerId,
      name: newPlayer.name,
      isHost: false,
      score: 0,
      avatar: newPlayer.avatar,
      isSpectator: newPlayer.isSpectator
    }
  });
});

// Get Live Room State
app.get("/api/room/:code", (req, res) => {
  const code = req.params.code.toUpperCase();
  const { playerId } = req.query;
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  // Update last active of caller to support live disconnect triggers
  if (playerId && typeof playerId === "string" && room.players[playerId]) {
    room.players[playerId].lastActive = Date.now();
  }

  res.json({
    room: serializeRoomState(room, playerId as string),
    recentEmojis: room.emojiReactions
  });
});

// Post Room action
app.post("/api/room/:code/action", async (req, res) => {
  const code = req.params.code.toUpperCase();
  const { playerId, action, payload } = req.body;
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const player = room.players[playerId];
  if (!player) {
    return res.status(403).json({ error: "You are not a member of this room!" });
  }

  player.lastActive = Date.now();

  try {
    switch (action) {
      case "START_GAME":
        if (!player.isHost) {
          return res.status(403).json({ error: "Only the host can initiate the match!" });
        }

        const activePlayersCount = Object.values(room.players).filter(p => !p.isSpectator).length;
        if (activePlayersCount < 3) {
          return res.status(400).json({ error: "Need at least 3 active players to start! Spectators do not count." });
        }

        // Initialize players statistics record
        room.statistics = {};
        Object.keys(room.players).forEach(pid => {
          room.statistics![pid] = {
            unhingedCount: 0,
            creativeCount: 0,
            unexpectedCount: 0,
            totalVotesReceived: 0,
            mostVotesSingleRound: 0,
            award: "Certified Thinker"
          };
        });

        // Advance to Challenge Reveal
        room.round = 1;
        room.phase = 'CHALLENGE_REVEAL';
        room.timerDuration = 5; // 5-second slide in
        room.timerRemaining = 5;
        room.commentary = "Generating first impossible challenge...";
        room.challenge = null;
        room.answers = {};
        room.votes = {};

        room.usedScenarios = [];
        generateAiChallenge(room.usedScenarios, room.language, room.gameMode).then(challenge => {
          room.challenge = challenge;
          room.usedScenarios.push(challenge.scenario);
          room.commentary = "Scenario ready! Read carefully, things are about to get absurd.";
        });
        break;

      case "SET_LANGUAGE":
        if (!player.isHost) {
          return res.status(403).json({ error: "Only the host can modify the game language!" });
        }
        room.language = 'EN';
        room.commentary = "Game language switched to English!";
        break;

      case "TRANSFER_HOST":
        if (!player.isHost) {
          return res.status(403).json({ error: "Only the current host can handover the reigns!" });
        }
        const nextHostId = payload.targetPlayerId;
        if (!nextHostId || !room.players[nextHostId]) {
          return res.status(400).json({ error: "Invalid target player for leadership transfer." });
        }
        Object.keys(room.players).forEach(pid => {
          room.players[pid].isHost = (pid === nextHostId);
        });
        room.commentary = `${room.players[nextHostId].name} is now the official host!`;
        break;

      case "ADVANCE_SUBMISSION":
        // Automatically transitions from Challenge Reveal to Answer Submission
        if (room.phase === 'CHALLENGE_REVEAL') {
          room.phase = 'SUBMISSION';
          room.timerDuration = 60; // 60 seconds to answer
          room.timerRemaining = 60;
          room.answers = {};
          room.votes = {};
          room.commentary = "Start writing! Think fast, character limit is 300.";
        }
        break;

      case "SUBMIT_ANSWER":
        if (room.phase !== 'SUBMISSION') {
          return res.status(400).json({ error: "Not in answer submission phase!" });
        }
        if (!payload.answer || typeof payload.answer !== "string") {
          return res.status(400).json({ error: "Invalid text written!" });
        }

        // Clip string
        room.answers[playerId] = payload.answer.substring(0, 300);
        player.hasSubmitted = true;
        break;

      case "NEXT_REVEAL":
        // Only host can step-reveal the cards
        if (!player.isHost) {
          return res.status(403).json({ error: "Host controls active. Let them cook." });
        }
        if (room.phase !== 'REVEAL') {
          return res.status(400).json({ error: "Not in reveal phase!" });
        }

        room.revealedAnswerIndex++;

        // If this was the last answer to be revealed, trigger Voting directly!
        if (room.revealedAnswerIndex >= room.shuffledAnswers.length - 1) {
          room.phase = 'VOTING';
          room.timerDuration = 20; // 20 seconds to vote
          room.timerRemaining = 20;
          room.commentary = "Vote now! Select the funniest, most ridiculous option. Self-voting disabled!";
        }
        break;

      case "SUBMIT_VOTE":
        if (room.phase !== 'VOTING') {
          return res.status(400).json({ error: "Not in voting phase!" });
        }
        const votedTargetId = payload.votedPlayerId; // PlayerId or anonymous index identifier maps back

        // Find which player index/item corresponds to payload voted id
        let trueVotedPlayerId = "";
        if (votedTargetId.startsWith("anonymous_")) {
          const idx = parseInt(votedTargetId.split("_")[1]);
          if (room.shuffledAnswers[idx]) {
            trueVotedPlayerId = room.shuffledAnswers[idx].playerId;
          }
        } else {
          trueVotedPlayerId = votedTargetId;
        }

        if (trueVotedPlayerId === playerId) {
          return res.status(400).json({ error: "Nice try, you cannot vote for yourself!" });
        }

        room.votes[playerId] = trueVotedPlayerId;
        player.votedFor = trueVotedPlayerId;
        break;

      case "NEXT_ROUND":
        if (!player.isHost) {
          return res.status(403).json({ error: "Only host can advance round!" });
        }
        if (room.phase !== 'SCOREBOARD') {
          return res.status(400).json({ error: "Not in scoreboard phase!" });
        }

        if (room.round >= room.maxRounds) {
          // End of game! Trigger awards and final speech
          room.phase = 'END_GAME';
          room.winnerId = null;

          // Compute final winner and stats
          const sortedPlayers = Object.values(room.players).sort((a,b) => b.score - a.score);
          const topPlayer = sortedPlayers[0];
          room.winnerId = topPlayer ? topPlayer.id : null;

          // Map comedy roles and funny individual performance descriptions based on stats counters and placements
          const sortedRankedIds = sortedPlayers.map(p => p.id);
          Object.keys(room.players).forEach(pid => {
            const st = room.statistics?.[pid];
            if (st) {
              const rank = sortedRankedIds.indexOf(pid) + 1;
              const isWinner = pid === room.winnerId;

              // Determine primary role award
              if (isWinner) {
                st.award = "Chaos Champion";
              } else if (st.unhingedCount > st.creativeCount && st.unhingedCount >= 1) {
                st.award = "Most Dangerous Thinker";
              } else if (st.creativeCount > st.unhingedCount && st.creativeCount >= 1) {
                st.award = "Biggest Genius";
              } else if (st.totalVotesReceived === 0) {
                st.award = "Certified Idiot";
              } else {
                st.award = "Biggest Menace";
              }

              // Apply funny customized individual descriptions based on stats, ranks and language
              if (isWinner) {
                st.performanceDescription = `👑 Grand Champion (Rank #1)! Hoarded the glory with ${st.totalVotesReceived} total votes. Clearly possesses the densest, most magnificent, and bizarre single brain cell in this lobby. All hail the Overlord!`;
              } else if (st.award === "Most Dangerous Thinker") {
                st.performanceDescription = `Placed #${rank}. Triggered ${st.unhingedCount} hazardous warnings. Your unhinged thoughts are scientifically unsafe for civil society and have been reported to authorities!`;
              } else if (st.award === "Biggest Genius") {
                st.performanceDescription = `Placed #${rank}. Possessed a highly creative brain with ${st.creativeCount} spark lines, yet completely failed to transform that raw high-IQ brilliance into an actual victory. Classic academy blunder.`;
              } else if (st.award === "Certified Idiot") {
                st.performanceDescription = `Placed #${rank}. Literally untouched by greatness with exactly 0 votes. Your brain operates on the pure dial-up hum of a 1995 microwave oven, but you brought great energy.`;
              } else {
                st.performanceDescription = `Placed #${rank}. A premium agent of general mischief. Obtained ${st.totalVotesReceived} votes of chaos and proved to be an absolute menace to the visual sanity of our scoreboard.`;
              }
            }
          });

          room.commentary = "Calculating final results...";
          generateAiFinalAwards(Object.values(room.players), room.statistics || {}, room.language).then(speech => {
            room.commentary = speech;
          });
        } else {
          // Play next round
          room.round++;
          room.phase = 'CHALLENGE_REVEAL';
          room.timerDuration = 5;
          room.timerRemaining = 5;
          room.answers = {};
          room.shuffledAnswers = [];
          room.votes = {};
          room.revealedAnswerIndex = -1;

          Object.values(room.players).forEach(p => {
            p.hasSubmitted = false;
            p.votedFor = null;
          });

          // Fetch previously used scenarios to avoid duplicates
          room.usedScenarios = room.usedScenarios || [];

          room.commentary = `Generating Round ${room.round} impossible challenge...`;
          generateAiChallenge(room.usedScenarios, room.language, room.gameMode).then(challenge => {
            room.challenge = challenge;
            room.usedScenarios.push(challenge.scenario);
            room.commentary = `Round ${room.round} is live! Keep those synapses firing.`;
          });
        }
        break;

      case "REACTION":
        if (!payload.emoji) {
          return res.status(400).json({ error: "Missing emoji string" });
        }
        const emojiReaction: EmojiBroadcast = {
          id: `emo_${playerId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          playerId,
          playerName: player.name,
          emoji: payload.emoji,
          timestamp: Date.now(),
          x: typeof payload.x === "number" ? payload.x : undefined,
          y: typeof payload.y === "number" ? payload.y : undefined
        };
        room.emojiReactions.push(emojiReaction);

        // Update local player state
        player.emojiReaction = payload.emoji;
        player.emojiTime = Date.now();
        break;

      case "LEAVE_ROOM":
        delete room.players[playerId];
        if (room.answers[playerId] !== undefined) {
          delete room.answers[playerId];
        }
        if (room.votes[playerId] !== undefined) {
          delete room.votes[playerId];
        }

        const activeRemaining = Object.values(room.players);
        if (activeRemaining.length === 0) {
          delete rooms[code];
        } else if (player.isHost) {
          // Transfer host to first active player
          const firstLeftId = activeRemaining[0].id;
          room.players[firstLeftId].isHost = true;
          room.commentary = `${room.players[firstLeftId].name} is now host after a player left!`;
        }
        break;

      case "REMATCH":
        if (!player.isHost) {
          return res.status(403).json({ error: "Only host can restart the lobby!" });
        }
        room.phase = 'LOBBY';
        room.round = 0;
        room.challenge = null;
        room.answers = {};
        room.shuffledAnswers = [];
        room.votes = {};
        room.timerDuration = 0;
        room.timerRemaining = 0;
        room.revealedAnswerIndex = -1;
        room.winnerId = null;
        room.commentary = "New game is starting! Tell everyone to stick around.";
        room.statistics = {};
        room.usedScenarios = [];

        // Zero all scores
        Object.keys(room.players).forEach(pid => {
          room.players[pid].score = 0;
          room.players[pid].scoreChange = 0;
          room.players[pid].hasSubmitted = false;
          room.players[pid].votedFor = null;
        });
        break;

      default:
        return res.status(400).json({ error: "Action not recognized" });
    }

    res.json({
      room: serializeRoomState(room, playerId),
      recentEmojis: room.emojiReactions
    });
  } catch (err: any) {
    console.error("Action handler failed:", err);
    res.status(500).json({ error: err.message || "Something went wrong on the server." });
  }
});

// Serve health status
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", activeRooms: Object.keys(rooms).length });
});

// Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development server with HMR configurations bypassed
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production build serves index.html static assets directly
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Last Brain Cell] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
