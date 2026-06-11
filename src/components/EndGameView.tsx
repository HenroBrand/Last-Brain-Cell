/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Award, Zap, Smile, BookOpen, Skull, RefreshCw, Trophy, BarChart3 } from "lucide-react";
import { Player, PlayerStats } from "../types.js";
import { soundSynthesizer } from "../utils/audio.js";

interface EndGameViewProps {
  players: Player[];
  player: { id: string; name: string; isHost: boolean };
  statistics: { [playerId: string]: PlayerStats } | null;
  commentary: string;
  winnerId: string | null;
  onRematch: () => void;
}

export default function EndGameView({
  players,
  player,
  statistics,
  commentary,
  winnerId,
  onRematch
}: EndGameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synthesize confetti particle framework directly on HTML5 Canvas
  useEffect(() => {
    soundSynthesizer.playFanfare();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Confetti particles generator
    const colors = ["#f59e0b", "#ec4899", "#06b6d4", "#22c55e", "#6366f1", "#eab308"];
    const particles = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * -height,
      r: Math.random() * 6 + 4,
      d: Math.random() * height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

        // Loop particle back to top if it leaves screen boundary
        if (p.y > height) {
          p.x = Math.random() * width;
          p.y = -20;
          p.tilt = Math.random() * 10 - 5;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r * 2;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const winner = players.find((p) => p.id === winnerId);
  const sortedRanking = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-lg mx-auto p-4 flex flex-col items-center relative">
      
      {/* HTML5 Overlay Confetti floating above visuals */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-40 w-full h-full" />

      {/* Triumphant Logo Heading */}
      <div className="relative mb-6 text-center select-none mt-2 z-10">
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="bg-[#FDE047] border-4 border-black px-6 py-2.5 rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,1)] text-black font-black uppercase text-xs tracking-wider inline-flex items-center gap-1.5"
        >
          <Trophy className="w-4 h-4" /> CROWNING CEREMONY <Trophy className="w-4 h-4" />
        </motion.div>
      </div>

      {/* Crowning the Winner */}
      {winner && (
        <motion.div
          initial={{ scale: 0.8, rotate: -2, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="w-full bg-[#FDE047] border-6 border-black p-6 rounded-xl text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-black mb-6 relative z-10 select-none"
        >
          <div className="absolute -top-11 left-1/2 transform -translate-x-1/2 text-5xl">
            👑
          </div>
          <span className="text-xs font-black tracking-widest uppercase bg-black text-[#F472B6] px-4 py-1.5 rounded-lg border-2 border-black shadow-[3px_3px_0px_#000] font-sans">
            GRAND CHOSEN GENIUS
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4 mb-1 uppercase font-sans">
            {winner.avatar} {winner.name}
          </h2>
          <p className="font-mono text-xs font-black bg-black/15 py-1 px-4 inline-block rounded-md mt-1.5 border border-black/20">
            SCORE: {winner.score} NEURONS ACTIVATED
          </p>
        </motion.div>
      )}

      {/* Sarcastic Ending Speech Bubble */}
      <div className="w-full bg-white border-4 border-black rounded-xl p-4.5 mb-6 text-left relative z-10 shadow-[6px_6px_0px_rgba(0,0,0,1)] text-black">
        <div className="absolute -top-7 -right-3 text-4xl">
          🤖🏆
        </div>
        <span className="text-[10px] uppercase font-black tracking-widest bg-[#F472B6] text-white border-2 border-black px-3 py-0.5 rounded-md shadow-[1.5px_1.5px_0_#000] inline-flex items-center gap-1 font-sans">
          <Award className="w-3.5 h-3.5" /> HOST SCORECARD ESSAY
        </span>
        <p className="text-black text-sm font-extrabold italic mt-1.5 font-sans">
          "{commentary || "Drafting comedic congratulations..."}"
        </p>
      </div>

      {/* Statistics and Award Badges dashboard */}
      <div className="w-full bg-white text-black rounded-xl p-5 border-6 border-black shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col gap-4 relative z-10 mb-8 font-sans">
        
        <h3 className="text-xs font-black bg-[#C084FC] text-black border-3 border-black px-3 py-1.5 rounded-lg shadow-[3px_3px_0_#000] uppercase tracking-wider text-left self-start select-none inline-flex items-center gap-1.5">
          <BarChart3 className="w-5 h-5 text-black" /> PERFORMANCE STATISTICS
        </h3>

        <div className="flex flex-col gap-3.5">
          {sortedRanking.map((p, idx) => {
            const st: PlayerStats = statistics?.[p.id] || {
              unhingedCount: 0,
              creativeCount: 0,
              unexpectedCount: 0,
              totalVotesReceived: 0,
              mostVotesSingleRound: 0,
              award: "Unidentified Thinker"
            };

            // Custom icon mapping based on computed comedy certificates
            const isCertIdiot = st.award === "Certified Idiot";
            const isGenius = st.award === "Biggest Genius";
            const isMenace = st.award === "Biggest Menace";
            const isDanger = st.award === "Most Dangerous Thinker";

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.15 }}
                className="bg-stone-50 border-3 border-black p-4 rounded-xl text-left"
              >
                {/* Header Rank */}
                <div className="flex justify-between items-start border-b-2 border-black pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black font-mono text-[#6D28D9] select-none">
                      #{idx + 1}
                    </span>
                    <span className="text-2xl w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center shadow-[1px_1px_0_#000]">
                      {p.avatar || "🦊"}
                    </span>
                    <span className="font-extrabold text-black text-lg leading-none uppercase tracking-wide">{p.name}</span>
                  </div>

                  {/* Cute custom comedy certificate label */}
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md border-2 border-black shadow-[1.5px_1.5px_0_#000] flex items-center gap-1 ${
                    isCertIdiot 
                    ? "bg-[#F87171] text-black"
                    : isGenius
                      ? "bg-[#FDE047] text-black"
                      : isDanger
                        ? "bg-[#C084FC] text-black"
                        : isMenace
                          ? "bg-[#F472B6] text-white"
                          : "bg-[#60A5FA] text-black"
                  }`}>
                    {isCertIdiot && <Skull className="w-3 h-3 text-black" />}
                    {isGenius && <Zap className="w-3 h-3 text-black" />}
                    {isDanger && <BookOpen className="w-3 h-3 text-black" />}
                    {isMenace && <Smile className="w-3 h-3 text-white" />}
                    {st.award}
                  </span>
                </div>

                {/* Sub-bento-grid of individual performance metrics */}
                <div className="grid grid-cols-2 gap-2 mt-2.5 font-mono text-[9px] md:text-[10px] text-slate-500 font-bold uppercase select-none">
                  <div className="bg-white p-2 rounded-lg border-2 border-black">
                    <span className="text-slate-500 block">Total Votes Gained:</span>
                    <strong className="text-black text-xs font-black">{st.totalVotesReceived}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border-2 border-black">
                    <span className="text-slate-500 block">Max Volleys:</span>
                    <strong className="text-black text-xs font-black">
                      {st.mostVotesSingleRound} votes/rd
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border-2 border-black">
                    <span className="text-pink-500 block">Unhinged Index:</span>
                    <strong className="text-[#6D28D9] text-xs font-black">{st.unhingedCount}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border-2 border-black">
                    <span className="text-slate-500 block">Total Activated:</span>
                    <strong className="text-black text-xs font-black">
                      {p.score} neurons
                    </strong>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Rematch capabilities */}
      {player.isHost && (
        <div className="w-full max-w-sm relative z-10 text-center">
          <button
            onClick={onRematch}
            id="rematch-init-btn"
            className="w-full bg-[#A3E635] text-black border-4 border-black py-4 rounded-xl font-black text-lg hover:bg-[#8cdc21] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition flex items-center justify-center gap-2 cursor-pointer pointer-events-auto text-center"
          >
            <RefreshCw className="w-5 h-5 animate-spin-reverse" /> 
            RE-ENTER ARENA (REMATCH)
          </button>
        </div>
      )}

      {/* Guest rematch warning banner */}
      {!player.isHost && (
        <div className="mt-2 p-4 rounded-xl bg-black border-4 border-black text-center text-[#FBBF24] text-xs font-black max-w-sm flex flex-col gap-1 relative z-10 select-none shadow-retro-sm">
          <span className="animate-pulse text-white font-black uppercase tracking-wider">
            WAITING ON HOST TO DECLARE REMATCH
          </span>
          <span className="text-stone-300 text-[10px] md:text-xs">
            Only {players.find(p => p.isHost)?.name || "The Host"} can restart the round server. Hang tight in the awards room.
          </span>
        </div>
      )}

    </div>
  );
}
