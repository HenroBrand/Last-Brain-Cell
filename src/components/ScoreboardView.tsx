/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Trophy, ArrowUp, RefreshCw, Sparkles, MessageSquare } from "lucide-react";
import { RoundAnswer, Player } from "../types.js";
import { soundSynthesizer } from "../utils/audio.js";

interface ScoreboardViewProps {
  answers: RoundAnswer[];
  players: Player[];
  player: { id: string; name: string; isHost: boolean };
  onNextRound: () => void;
  commentary: string;
  round: number;
  maxRounds: number;
  language?: 'EN' | 'AF';
}

export default function ScoreboardView({
  answers,
  players,
  player,
  onNextRound,
  commentary,
  round,
  maxRounds,
  language = 'EN'
}: ScoreboardViewProps) {
  const [activeTab, setActiveTab] = useState<"answers" | "standings">("answers");

  const isAf = language === 'AF';

  // Play triumph fanfare on scoreboard load
  useEffect(() => {
    soundSynthesizer.playFanfare();
  }, []);

  // Sort overall leaderboard players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-lg mx-auto p-4 flex flex-col items-center">
      
      {/* Round indicator top bar */}
      <div className="w-full flex items-center justify-between mb-5 select-none text-black">
        <span className="text-xs font-black bg-white border-3 border-black rounded-lg px-3 py-1 shadow-[2px_2px_0_#000] uppercase font-sans shrink-0">
          {isAf ? `RONDTE ${round} / ${maxRounds} VOLTOOI` : `ROUND ${round} / ${maxRounds} COMPLETE`}
        </span>
 
        {/* Tab switcher */}
        <div className="bg-black p-1 border-3 border-black rounded-xl flex gap-1 select-none font-mono">
          <button
            onClick={() => setActiveTab("answers")}
            type="button"
            className={`text-xs uppercase font-black px-4 py-1.5 rounded-lg cursor-pointer border-2 transition ${
              activeTab === "answers" ? "bg-[#FDE047] text-black border-black" : "bg-black text-white border-transparent"
            }`}
          >
            {isAf ? "ANTWOORDE" : "ANSWERS"}
          </button>
          <button
            onClick={() => setActiveTab("standings")}
            type="button"
            className={`text-xs uppercase font-black px-4 py-1.5 rounded-lg cursor-pointer border-2 transition ${
              activeTab === "standings" ? "bg-[#FDE047] text-black border-black" : "bg-black text-white border-transparent"
            }`}
          >
            {isAf ? "PUNTE" : "STANDINGS"}
          </button>
        </div>
      </div>
  
      {/* Chaotic Host Commentary Bubble */}
      <div className="w-full bg-white text-black rounded-xl border-4 border-black p-4 mb-6 relative shadow-[6px_6px_0px_rgba(0,0,0,1)] select-none">
        {/* Cartoon Host Avatar */}
        <div className="absolute -top-7 -left-3 text-4xl transform -rotate-12">
          🤖🎙️
        </div>
        
        <div className="ml-8 text-left">
          <span className="text-[10px] font-black uppercase text-[#6D28D9] tracking-wider flex items-center gap-1 font-sans">
            <MessageSquare className="w-3 h-3 text-[#6D28D9]" /> {isAf ? "KI-GASHEER KOMMENTAAR" : "HOST AI COMMENTARY"}
          </span>
          <p className="text-black text-sm font-extrabold italic mt-1 leading-relaxed">
            {commentary || "Synthesizing sarcastic responses..."}
          </p>
        </div>
      </div>
  
      {activeTab === "answers" ? (
        /* Round Submissions and Votes Tally Cards */
        <div className="w-full flex flex-col gap-4">
          <h3 className="text-xs font-black bg-[#F472B6] text-white border-3 border-black px-3 py-1.5 rounded-lg shadow-[3px_3px_0_#000] uppercase tracking-wider text-left self-start font-sans">
            {isAf ? "STEMME & BREINSEL PUNTE" : "VOTES & NEURONS AWARDED"}
          </h3>
  
          {answers.map((ans, idx) => {
            const truePlayer = players.find(p => p.id === ans.playerId);
            const votesCount = ans.votes.length;
 
            return (
              <motion.div
                key={ans.playerId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }}
                className="bg-white text-black border-4 border-black p-5 rounded-xl flex flex-col gap-2 relative shadow-[6px_6px_0px_rgba(0,0,0,1)] text-left"
              >
                {/* Header Author name */}
                <div className="flex justify-between items-center border-b-2 border-black pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl w-8 h-8 rounded-full border-2 border-black flex items-center justify-center bg-stone-100 shadow-[1px_1px_rgba(0,0,0,1)]">
                      {truePlayer?.avatar || "🦊"}
                    </span>
                    <span className="text-lg font-black text-[#6D28D9] tracking-wide font-sans">
                      {truePlayer?.name || "Anonymous Neurons"}
                    </span>
                  </div>
                  
                  {/* Total Round Votes count */}
                  <span className="bg-[#60A5FA] border-2 border-black text-black text-xs px-3 py-0.5 rounded-md font-black">
                    {votesCount} {isAf ? (votesCount === 1 ? "Stem" : "Stemme") : (votesCount === 1 ? "Vote" : "Votes")}
                  </span>
                </div>
  
                <p className="text-black text-md font-extrabold leading-relaxed italic my-1 font-sans">
                  "{ans.text}"
                </p>
  
                {/* Voter credits */}
                {votesCount > 0 && (
                  <div className="text-[11px] text-black font-extrabold bg-stone-100 border-2 border-black p-2.5 rounded-lg mt-1 select-none leading-normal">
                    <span className="text-[#6D28D9] font-black uppercase font-sans">{isAf ? "Gesteem deur:" : "Voted by:"}</span>{" "}
                    {ans.votes
                      .map((vid) => players.find((p) => p.id === vid)?.name || "Disconnected Member")
                      .join(", ")}
                  </div>
                )}
  
                {/* Auto Award Badges */}
                {idx === 0 && votesCount > 0 && (
                  <div className="flex gap-2.5 flex-wrap mt-1">
                    <span className="text-[10px] font-black uppercase bg-[#FDE047] text-black px-2.5 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 select-none font-sans">
                      <Trophy className="w-3.5 h-3.5 text-black" /> {isAf ? "Gewilde Mening Toekenning (+100)" : "Popular Opinion Badge (+100)"}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Overall Game Score Standing Ladder */
        <div className="w-full bg-white text-black rounded-xl p-5 border-6 border-black shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
          <h3 className="text-xs font-black bg-[#C084FC] text-black border-3 border-black px-3 py-1.5 rounded-lg shadow-[3px_3px_0_#000] uppercase tracking-wider text-left self-start select-none font-sans">
            {isAf ? "ALGEHELE SPELSTAND-TALLY" : "OVERALL LEADERBOARD STANDINGS"}
          </h3>
  
          <div className="flex flex-col gap-3.5 mt-1">
            {sortedPlayers.map((p, idx) => {
              const isWinner = idx === 0;
 
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-4 border-black text-black text-left shadow-[4px_4px_0_#000] ${
                    isWinner ? "bg-[#FDE047]" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center select-none font-black text-black leading-none uppercase font-mono">
                      {isWinner ? "🏆" : `${idx + 1}`}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center text-xl shadow-[1px_1px_rgba(0,0,0,1)] shrink-0">
                      {p.avatar || "👽"}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-black text-md leading-tight uppercase font-sans tracking-wide">{p.name}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-stone-600 block mt-0.5 font-sans">
                        {isAf ? "Totale Breinselle Geaktiveer" : "Total Neurons Activated"}
                      </span>
                    </div>
                  </div>
  
                  {/* Core score with increments */}
                  <div className="flex items-center gap-2">
                    {p.scoreChange > 0 && (
                      <span className="text-[9px] bg-[#A3E635] text-black border-2 border-black px-1.5 py-0.5 rounded-md font-black uppercase flex items-center gap-0.5 select-none animate-bounce font-sans">
                        <ArrowUp className="w-2.5 h-2.5 shrink-0" /> +{p.scoreChange}
                      </span>
                    )}
                    <span className="text-lg font-black text-black font-mono select-none">
                      {p.score}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
  
      {/* Host Progression controls */}
      {player.isHost && (
        <div className="w-full max-w-sm mt-8 pb-3">
          <button
            onClick={onNextRound}
            id="scoreboard-next-round-btn"
            className="w-full bg-[#A3E635] text-black border-4 border-black py-4 rounded-xl font-black text-lg hover:bg-[#8cdc21] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition flex items-center justify-center gap-2 cursor-pointer pointer-events-auto text-center"
          >
            <RefreshCw className="w-5 h-5 animate-spin-reverse" />
            <span>
              {round >= maxRounds 
                ? (isAf ? "BEPAAL KROONWENNER NOW" : "DETERMINE CROWNING WINNER") 
                : (isAf ? "GAAN NA VOLGENDE RONDTE" : "PROCEED TO NEXT ROUND")
              }
            </span>
          </button>
        </div>
      )}
  
      {/* Guest Status banner info */}
      {!player.isHost && (
        <div className="mt-8 p-4 rounded-xl bg-black border-4 border-black text-center text-[#FBBF24] text-xs font-black max-w-sm flex flex-col gap-1 select-none shadow-retro-sm pb-4">
          <span className="animate-pulse text-white font-black uppercase tracking-wider">{isAf ? "WAG VIR GASHEER SE TRANSISIE" : "WAITING ON HOST CONCURRENCE"}</span>
          <span className="text-stone-300">
            {isAf 
              ? `${players.find(p => p.isHost)?.name || "Die Gasheer"} ondersoek tellings voordat hy die volgende onmoontlike scenario bekendstel!`
              : `${players.find(p => p.isHost)?.name || "The Host"} is inspecting scores before launching the next impossible scenario.`
            }
          </span>
        </div>
      )}

    </div>
  );
}
