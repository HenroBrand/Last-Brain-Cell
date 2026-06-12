/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Volume2, VolumeX, RefreshCw, Layers, ArrowLeft, Info } from "lucide-react";

import { RoomState, Player, EmojiBroadcast } from "./types.js";
import { soundSynthesizer } from "./utils/audio.js";

import HomeScreen from "./components/HomeScreen.js";
import LobbyView from "./components/LobbyView.js";
import SubmissionView from "./components/SubmissionView.js";
import RevealView from "./components/RevealView.js";
import VotingView from "./components/VotingView.js";
import ScoreboardView from "./components/ScoreboardView.js";
import EndGameView from "./components/EndGameView.js";
import FloatingEmojis from "./components/FloatingEmojis.js";

const API = (import.meta as any).env?.VITE_BACKEND_URL || (import.meta as any).env?.VITE_API_URL || "";

export default function App() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [player, setPlayer] = useState<{ id: string; name: string; isHost: boolean } | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<EmojiBroadcast[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(soundSynthesizer.getMuted());
  const [isPolling, setIsPolling] = useState(false);

  // Poll intervals reference to safely clear
  const pollingRef = useRef<any>(null);

  // Auto-reconnect on load using localStorage cached players information
  useEffect(() => {
    const savedCode = localStorage.getItem("lbc_roomCode");
    const savedId = localStorage.getItem("lbc_playerId");
    const savedName = localStorage.getItem("lbc_playerName");
    const savedIsHost = localStorage.getItem("lbc_isHost") === "true";

    if (savedCode && savedId && savedName) {
      console.log(`Checking cached session: Code ${savedCode}, Id ${savedId}`);
      
      // Perform initial check fetch
      fetch(`${API}/api/room/${savedCode.toUpperCase()}?playerId=${savedId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Stale session");
          return res.json();
        })
        .then((data) => {
          // Success! Resume active play context
          setRoomCode(savedCode.toUpperCase());
          setPlayer({ id: savedId, name: savedName, isHost: savedIsHost });
          setRoomState(data.room);
          if (data.recentEmojis) {
            setFloatingEmojis(data.recentEmojis);
          }
          console.log("Cached session successfully restored.");
          setErrorMsg(null);
        })
        .catch((err) => {
          console.warn("Cached session was stale or server restarted. Clearing local profile.", err);
          clearCachedSession();
        });
    }
  }, []);

  // Sync state polling hook whenever an active roomCode is set
  useEffect(() => {
    if (!roomCode || !player) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const fetchState = () => {
      fetch(`${API}/api/room/${roomCode}?playerId=${player.id}`)
        .then((res) => {
          if (res.status === 404) {
            console.log(`Room ${roomCode} is no longer active (404). Gracefully exiting room.`);
            clearCachedSession();
            setErrorMsg("The room was disbanded or the server restarted.");
            return null;
          }
          if (!res.ok) throw new Error("Server communication issue");
          return res.json();
        })
        .then((data) => {
          if (!data) return;
          setRoomState(data.room);
          
          // Merge floating emojis reactions
          if (data.recentEmojis) {
            setFloatingEmojis(data.recentEmojis);
          }
          
          // Lock host state according to remote server
          const currentRemoteRecord = data.room.players.find((p: Player) => p.id === player.id);
          if (currentRemoteRecord) {
            setPlayer((prev) => prev ? { ...prev, isHost: currentRemoteRecord.isHost } : null);
          }
          setErrorMsg(null);
        })
        .catch((err) => {
          console.warn("Polling state refresh failed or server wake-up/connection delayed:", err.message);
          setErrorMsg("Server sync failed. Confirming internet connection...");
        });
    };

    // First fetch immediate, then interval every 1200ms
    fetchState();
    pollingRef.current = setInterval(fetchState, 1200);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setIsPolling(false);
    };
  }, [roomCode, player?.id]);

  const cacheSession = (code: string, id: string, name: string, isHost: boolean) => {
    localStorage.setItem("lbc_roomCode", code);
    localStorage.setItem("lbc_playerId", id);
    localStorage.setItem("lbc_playerName", name);
    localStorage.setItem("lbc_isHost", isHost ? "true" : "false");
  };

  const clearCachedSession = () => {
    localStorage.removeItem("lbc_roomCode");
    localStorage.removeItem("lbc_playerId");
    localStorage.removeItem("lbc_playerName");
    localStorage.removeItem("lbc_isHost");
    setRoomCode(null);
    setPlayer(null);
    setRoomState(null);
    setFloatingEmojis([]);
    soundSynthesizer.stopLobbyMusic();
  };

  // Actions posting helper
  const triggerAction = async (action: string, payload: any = {}) => {
    if (!roomCode || !player) return;
    try {
      const res = await fetch(`${API}/api/room/${roomCode}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id, action, payload })
      });

      if (res.status === 404) {
        console.log(`Room ${roomCode} is no longer active (404). Action rejected.`);
        clearCachedSession();
        setErrorMsg("The room was disbanded or the server restarted.");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Action rejected by room server");
        return;
      }

      setRoomState(data.room);
      if (data.recentEmojis) {
        setFloatingEmojis(data.recentEmojis);
      }
      setErrorMsg(null);
    } catch (e: any) {
      console.warn("Failed to push room action:", e.message);
      setErrorMsg("Network timeout while writing action to server.");
    }
  };

  // Create game lobby
  const handleCreateRoom = async (playerName: string, avatar: string, isSpectator: boolean, maxRounds: number, gameMode: "regular" | "spicy") => {
    try {
      const res = await fetch(`${API}/api/room/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName, avatar, isSpectator, language: 'EN', maxRounds, gameMode })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to provision new lobby.");
        return;
      }

      setRoomCode(data.roomCode);
      setPlayer({ id: data.player.id, name: data.player.name, isHost: true });
      cacheSession(data.roomCode, data.player.id, data.player.name, true);
      setErrorMsg(null);
    } catch (err) {
      console.error("Failed to create room:", err);
      setErrorMsg("Internet error. Unable to connect to backend server.");
    }
  };

  // Join existing lobby
  const handleJoinRoom = async (playerName: string, enteredRoomCode: string, avatar: string, isSpectator: boolean) => {
    try {
      const res = await fetch(`${API}/api/room/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName, roomCode: enteredRoomCode, avatar, isSpectator })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to join room.");
        return;
      }

      setRoomCode(enteredRoomCode.toUpperCase());
      setPlayer({ id: data.player.id, name: data.player.name, isHost: false });
      setRoomState(data.room);
      cacheSession(enteredRoomCode.toUpperCase(), data.player.id, data.player.name, false);
      setErrorMsg(null);
    } catch (err) {
      console.error("Failed to join room:", err);
      setErrorMsg("Internet error. Check server status or try again.");
    }
  };

  // Host triggers
  const handleStartGame = () => triggerAction("START_GAME");
  const handleNextReveal = () => triggerAction("NEXT_REVEAL");
  const handleNextRound = () => triggerAction("NEXT_ROUND");
  const handleRematch = () => triggerAction("REMATCH");
  const handleTransferHost = (targetPlayerId: string) => {
    triggerAction("TRANSFER_HOST", { targetPlayerId });
  };

  // Player triggers
  const handleSubmitAnswer = (answer: string) => {
    triggerAction("SUBMIT_ANSWER", { answer });
  };
  const handlePostVote = (votedPlayerId: string) => {
    triggerAction("SUBMIT_VOTE", { votedPlayerId });
  };
  const handleSendEmoji = (emoji: string) => {
    triggerAction("REACTION", { emoji });
  };

  const handleLeaveLobby = () => {
    if (confirm("Are you sure you want to abandon this brain cell reserve?")) {
      if (roomCode && player) {
        fetch(`${API}/api/room/${roomCode}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: player.id, action: "LEAVE_ROOM" })
        }).catch((err) => console.warn("Failed to notify leave:", err));
      }
      clearCachedSession();
    }
  };

  const toggleSound = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundSynthesizer.setMute(nextMute);
    if (!nextMute && roomState?.phase === 'LOBBY') {
      soundSynthesizer.playLobbyMusic();
    }
  };

  // Resolve currently active screen
  const renderPhaseScreen = () => {
    if (!roomState || !player) return null;

    switch (roomState.phase) {
      case 'LOBBY':
        return (
          <LobbyView
            roomCode={roomState.code}
            players={roomState.players}
            player={player}
            onStartGame={handleStartGame}
            onTransferHost={handleTransferHost}
            errorMsg={errorMsg}
          />
        );

      case 'CHALLENGE_REVEAL':
        return (
          <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh] text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-yellow-400 border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0px_rgba(0,0,0,1)] text-black select-none"
            >
              <span className="text-xs font-black tracking-widest bg-purple-900 text-purple-200 border-2 border-black rounded-full px-3 py-1 uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                ROUND {roomState.round} STARTING
              </span>
              <h3 className="text-4xl font-extrabold tracking-tight mt-4 uppercase">GET READY</h3>
              <p className="text-xs font-bold text-slate-800 mt-2">
                Unfolding unhinged scenarios. Synapses firing in {roomState.timerRemaining}s...
              </p>
            </motion.div>
            
            {player.isHost && roomState.timerRemaining === 0 && (
              <button
                onClick={() => triggerAction("ADVANCE_SUBMISSION")}
                type="button"
                id="advance-submission-btn"
                className="mt-6 bg-cyan-400 text-black border-3 border-black px-6 py-2 rounded-2xl font-black text-sm hover:bg-cyan-300 shadow-[3px_3px_0px_rgba(0,0,0,1)] scroll-smooth active:translate-y-0.5 cursor-pointer pointer-events-auto"
              >
                PROCEED TO WRITING
              </button>
            )}

            <ClientTimerAutoAdvancer
              timerRemaining={roomState.timerRemaining}
              isHost={player.isHost}
              onExpire={() => player.isHost && triggerAction("ADVANCE_SUBMISSION")}
            />
          </div>
        );

      case 'SUBMISSION': {
        const myRecord = roomState.players.find(p => p.id === player.id);
        return (
          <SubmissionView
            challenge={roomState.challenge || { scenario: "Rob a bank with a potato", category: "Abstract" }}
            timerRemaining={roomState.timerRemaining}
            timerDuration={roomState.timerDuration}
            onSubmit={handleSubmitAnswer}
            hasSubmitted={myRecord ? myRecord.hasSubmitted : false}
            isSpectator={myRecord ? myRecord.isSpectator : false}
          />
        );
      }

      case 'REVEAL':
        return (
          <RevealView
            answers={roomState.answers}
            revealedAnswerIndex={roomState.revealedAnswerIndex}
            player={player}
            onNextReveal={handleNextReveal}
            players={roomState.players}
          />
        );

      case 'VOTING': {
        const myRecordForVote = roomState.players.find(p => p.id === player.id);
        const myAnswerObj = roomState.answers.find(a => a.playerId === player.id);
        return (
          <VotingView
            answers={roomState.answers}
            myAnswerText={myAnswerObj ? myAnswerObj.text : ""}
            timerRemaining={roomState.timerRemaining}
            timerDuration={roomState.timerDuration}
            onPostVote={handlePostVote}
            hasVoted={myRecordForVote ? myRecordForVote.votedFor !== null : false}
            onSendEmoji={handleSendEmoji}
            isSpectator={myRecordForVote ? myRecordForVote.isSpectator : false}
          />
        );
      }

      case 'SCOREBOARD':
        return (
          <ScoreboardView
            answers={roomState.answers}
            players={roomState.players}
            player={player}
            onNextRound={handleNextRound}
            commentary={roomState.commentary}
            round={roomState.round}
            maxRounds={roomState.maxRounds}
          />
        );

      case 'END_GAME':
        return (
          <EndGameView
            players={roomState.players}
            player={player}
            statistics={roomState.statistics}
            commentary={roomState.commentary}
            winnerId={roomState.winnerId}
            onRematch={handleRematch}
            onBackToLobby={handleLeaveLobby}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#7C3AED] bg-[radial-gradient(circle_at_50%_50%,_#8B5CF6_0%,_#6D28D9_100%)] text-white font-sans flex flex-col justify-between overflow-x-hidden relative select-none">
      
      {/* Dynamic Animated background canvas wiggle for premium party effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,0.05)_1.5px,transparent_1.5px)] bg-[size:40px_40px] pointer-events-none z-0" />

      {/* Floating Vibrant Palette decorative cells */}
      <div className="absolute top-[15%] left-[10%] text-6xl opacity-15 pointer-events-none select-none z-0 animate-float-cell font-mono">🧠</div>
      <div className="absolute top-[70%] right-[10%] text-5xl opacity-15 pointer-events-none select-none z-0 animate-float-cell font-mono [animation-delay:1.5s]">✨</div>
      <div className="absolute top-[40%] right-[15%] text-5xl opacity-15 pointer-events-none select-none z-0 animate-float-cell font-mono [animation-delay:3s]">⚡</div>
      <div className="absolute top-[10%] right-[25%] text-5xl opacity-15 pointer-events-none select-none z-0 animate-float-cell font-mono [animation-delay:4.5s]">🚀</div>

      {/* Floating Sparkle/Cloud particle backgrounds */}
      <div className="absolute top-1/4 left-1/10 w-48 h-48 rounded-full bg-amber-400/10 filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/10 w-72 h-72 rounded-full bg-lime-400/10 filter blur-3xl pointer-events-none" />

      {/* Persistent global header with mute action and leaving keys */}
      <header className="w-full max-w-3xl mx-auto px-4 py-4 flex items-center justify-between border-b-4 border-black relative z-30">
        
        {/* Left Back to Main key */}
        {roomCode && player ? (
          <button
            onClick={handleLeaveLobby}
            type="button"
            id="leave-lobby-btn"
            className="flex items-center gap-1.5 text-xs bg-black text-rose-300 border-3 border-black rounded-xl px-3 py-1.5 font-black uppercase tracking-wider hover:text-rose-450 active:scale-95 transition pointer-events-auto cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            <ArrowLeft className="w-4 h-4" /> LEAVE ROOM
          </button>
        ) : (
          <div className="flex items-center gap-2 select-none">
            <span className="text-3xl rotate-[-2deg] bg-yellow-300 text-black border-3 border-black px-2.5 py-1 font-black text-sm tracking-widest font-mono uppercase shadow-retro-sm">LBC ARENA 🧠</span>
          </div>
        )}

        {/* Sync indicators */}
        <div className="flex items-center gap-3">
          {isPolling && (
            <span className="flex items-center gap-1.5 bg-black border-3 border-black text-[10px] font-black text-[#A3E635] px-3 py-1.5 rounded-xl select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="w-2.5 h-2.5 bg-[#A3E635] rounded-full animate-pulse border-2 border-black" /> LIVE
            </span>
          )}

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            type="button"
            id="global-volume-toggle"
            className="p-1 px-3 bg-black text-white hover:bg-zinc-950 border-3 border-black rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer pointer-events-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {isMuted ? "UNMUTE" : "MUTE AUDIO"}
          </button>
        </div>
      </header>

      {/* Round progress bar inside active match */}
      {roomState && roomState.phase !== 'LOBBY' && roomState.phase !== 'END_GAME' && (
        <div className="w-full max-w-xl mx-auto px-4 mt-4 select-none relative z-30">
          <div className="flex justify-between items-center text-xs font-black uppercase text-yellow-300 mb-1">
            <span>Round {roomState.round} of {roomState.maxRounds}</span>
            <span>{Math.round((roomState.round / roomState.maxRounds) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-black h-4 rounded-full border-3 border-black p-0.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(roomState.round / roomState.maxRounds) * 100}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              className="h-full bg-gradient-to-r from-yellow-300 to-amber-500 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Main app body */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 flex flex-col justify-center relative z-20">
        <AnimatePresence mode="wait">
          {!roomCode || !player ? (
            <motion.div
              key="intro-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <HomeScreen
                onJoinRoom={handleJoinRoom}
                onCreateRoom={handleCreateRoom}
                errorMsg={errorMsg}
              />
            </motion.div>
          ) : (
            <motion.div
              key="gameplay-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderPhaseScreen()}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Global Floating Reaction Valve for real-time multiplayer spamming */}
        {roomCode && player && roomState && (
          <div className="w-full max-w-sm mx-auto mt-6 bg-purple-950/90 text-white rounded-xl border-3 border-black p-2.5 text-center flex flex-col gap-1.5 relative z-30 shadow-[4px_4px_0px_rgba(0,0,0,1)] select-none">
            <div className="text-[9px] uppercase font-black text-purple-300 tracking-wider flex items-center justify-center gap-1">
              💬 SPAM REACTION VALVE (ANIMATES FOR ALL PLAYERS!)
            </div>
            
            <div className="flex items-center justify-around">
              {["🧠", "💥", "😂", "💀", "💩", "🤡", "🎉", "🔥"].map((e) => (
                <button
                  onClick={() => {
                    handleSendEmoji(e);
                  }}
                  key={e}
                  type="button"
                  className="text-2xl hover:scale-135 active:scale-95 transition p-1.5 hover:rotate-12 cursor-pointer focus:outline-none pointer-events-auto"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Global Floating Emojis Reaction stream overlay */}
        <FloatingEmojis emojis={floatingEmojis} />
      </main>

      {/* Footer warning hints for testing multiplayer locally */}
      <footer className="w-full max-w-2xl mx-auto px-4 py-4 text-center select-none relative z-30 flex flex-col items-center gap-1.5 border-t border-purple-900/10">
        
        {/* Testing warning hint banner */}
        <div className="bg-cyan-950/40 border border-cyan-900/50 rounded-2xl p-2 px-3 text-cyan-300 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 max-w-md">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Multiplayer Tip: Open an incognito tab to easily test with 3 players!</span>
        </div>

        <span className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
          Last Brain Cell © 2026 | Created by Henro Brand
        </span>
      </footer>

    </div>
  );
}

// Private helper to guarantee slide transitions auto advance even if timer polling is delayed
function ClientTimerAutoAdvancer({
  timerRemaining,
  isHost,
  onExpire
}: {
  timerRemaining: number;
  isHost: boolean;
  onExpire: () => void;
}) {
  useEffect(() => {
    if (timerRemaining === 0 && isHost) {
      const advancer = setTimeout(onExpire, 1000);
      return () => clearTimeout(advancer);
    }
  }, [timerRemaining, isHost, onExpire]);

  return null;
}
