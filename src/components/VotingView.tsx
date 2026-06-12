/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Clock, ThumbsUp, AlertTriangle, MessageCircle } from "lucide-react";
import { RoundAnswer, Player, Challenge } from "../types.js";
import { soundSynthesizer } from "../utils/audio.js";

interface VotingViewProps {
  answers: RoundAnswer[];
  myAnswerText: string;
  timerRemaining: number;
  timerDuration: number;
  onPostVote: (votedPlayerId: string) => void;
  hasVoted: boolean;
  onSendEmoji: (emoji: string, event?: React.MouseEvent) => void;
  isSpectator?: boolean;
  challenge: Challenge | null;
}

const COLORS = [
  "bg-[#F472B6]", // Pink
  "bg-[#60A5FA]", // Cyan
  "bg-[#A3E635]", // Lime
  "bg-[#FBBF24]", // Amber
  "bg-[#C084FC]"  // Violet
];

const EMOJIS = ["🧠", "💥", "😂", "💀", "💩", "🎈"];

export default function VotingView({
  answers,
  myAnswerText,
  timerRemaining,
  timerDuration,
  onPostVote,
  hasVoted,
  onSendEmoji,
  isSpectator = false,
  challenge
}: VotingViewProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // sound alarms near countdown ending
  useEffect(() => {
    if (hasVoted || isSpectator) return;

    if (timerRemaining <= 5 && timerRemaining > 0) {
      soundSynthesizer.playTickingDown();
    } else if (timerRemaining > 5 && timerRemaining <= timerDuration - 1) {
      soundSynthesizer.playTick();
    }
  }, [timerRemaining, hasVoted, timerDuration, isSpectator]);

  const handleChoose = (idx: number, id: string) => {
    if (hasVoted || isSpectator) return;
    setSelectedIdx(idx);
    soundSynthesizer.playVoteSfx();
    onPostVote(id);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 flex flex-col items-center">
      
      {/* Timer Bar Header */}
      <div className="bg-white rounded-xl p-4.5 border-4 border-black w-full flex items-center justify-between mb-6 shadow-retro text-black select-none">
        <span className="text-xs md:text-sm font-black text-black uppercase tracking-widest flex items-center gap-1.5 font-sans">
          <Clock className={`w-4 h-4 ${timerRemaining <= 5 ? "text-red-500 animate-bounce" : "text-black"}`} /> 
          CAST YOUR NEURAL VOTE
        </span>
        <span className={`text-xl font-black w-12 h-12 rounded-full border-4 border-black flex items-center justify-center text-white shrink-0 animate-pulse bg-[#EF4444] shadow-[2px_2px_0px_#000]`}>
          {timerRemaining}
        </span>
      </div>

      {isSpectator && (
        <div className="bg-[#FFF] border-4 border-black p-5 rounded-2xl w-full text-center shadow-retro mb-6 text-black select-none relative">
          <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-xs font-black bg-purple-600 text-white border-2 border-black px-4 py-1 rounded-lg uppercase shadow-[2px_2px_0px_#000] whitespace-nowrap">
            SPECTATOR ROLE
          </span>
          <h4 className="text-lg font-black uppercase mt-2">
            👁️ SPECTATOR CAST STATION
          </h4>
          <p className="text-xs font-bold text-gray-700 leading-normal mt-1.5">
            You are currently a spectator! You can't cast candidate votes, but you can spam REACTION EMOJIS below to intimidate players!
          </p>
        </div>
      )}

      {challenge && (
        <div className="bg-amber-100 border-4 border-black p-5 rounded-2xl w-full text-center shadow-retro mb-6 text-black select-none relative">
          <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-[10px] font-black bg-amber-500 text-black border-2 border-black px-4 py-1 rounded-lg uppercase shadow-[2px_2px_0px_#000] whitespace-nowrap">
            THE ABSURD CHALLENGE PROMPT
          </span>
          <p className="text-xs font-black text-amber-700 tracking-wider uppercase mb-1">
            Category: {challenge.category}
          </p>
          <blockquote className="text-md font-black leading-relaxed mt-2 font-sans italic">
            "{challenge.scenario}"
          </blockquote>
        </div>
      )}

      {/* Answers Stack */}
      <div className="w-full flex flex-col gap-4">
        {answers.map((item, idx) => {
          // Identify if this card was written by current user
          const isSelf = myAnswerText && item.text.trim().toLowerCase() === myAnswerText.trim().toLowerCase();
          const isSelected = selectedIdx === idx;
          const bgCol = COLORS[idx % COLORS.length];

          const canInteract = !hasVoted && !isSelf && !isSpectator;

          return (
            <motion.div
              key={idx}
              whileHover={canInteract ? { scale: 1.02, rotate: 0.5 } : {}}
              whileTap={canInteract ? { scale: 0.98 } : {}}
              className={`p-5 rounded-xl border-4 border-black text-left relative flex flex-col gap-2 transition overflow-hidden text-black ${bgCol} ${
                isSelf 
                  ? "opacity-50 saturate-50 cursor-not-allowed" 
                  : isSpectator
                    ? "opacity-85 cursor-default shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    : hasVoted 
                      ? isSelected 
                        ? "ring-4 ring-black scale-[1.01]" 
                        : "opacity-40 border-black scale-95"
                      : "cursor-pointer shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)]"
              }`}
              onClick={() => canInteract && handleChoose(idx, item.playerId)}
            >
              {/* Overlay card tag */}
              <div className="flex items-center justify-between">
                <span className="font-black tracking-widest text-[10px] bg-black text-white px-3 py-1 rounded-md border-2 border-black uppercase shadow-[1px_1px_0_rgba(0,0,0,0.15)] font-sans">
                  Brain Specimen #{idx + 1}
                </span>

                {isSelf && (
                  <span className="text-[9px] font-black tracking-wider bg-white text-rose-600 border-2 border-black px-2.5 py-1 rounded-md uppercase flex items-center gap-1 select-none">
                    <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" /> YOUR OWN BRAIN WAVE
                  </span>
                )}

                {hasVoted && isSelected && (
                  <span className="text-[9px] font-black tracking-wider bg-black text-[#A3E635] border-2 border-black px-2.5 py-1 rounded-md uppercase flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-[#A3E635] shrink-0" /> TAP SELECTED
                  </span>
                )}
              </div>

              {/* Submitted text payload */}
              <blockquote className="text-md font-black leading-relaxed pt-2.5 select-none font-sans">
                "{item.text}"
              </blockquote>
            </motion.div>
          );
        })}
      </div>

      {/* Chaotic Live Emoji Reaction Pane */}
      <div className="w-full mt-8 bg-white text-black rounded-xl border-4 border-black p-4 text-center flex flex-col gap-2 relative shadow-[10px_10px_0px_rgba(0,0,0,1)]">
        <div className="text-[10px] uppercase font-black text-stone-600 tracking-wider flex items-center justify-center gap-1 select-none font-sans">
          <MessageCircle className="w-3.5 h-3.5 text-stone-500" /> SPAM LIVE MULTIPLAYER REACTION VALVE:
        </div>
        
        <div className="flex items-center justify-around mt-1">
          {EMOJIS.map((e) => (
            <button
              onClick={(event) => {
                onSendEmoji(e, event);
              }}
              key={e}
              type="button"
              className="text-3xl hover:scale-135 active:scale-90 transition p-1 hover:rotate-12 cursor-pointer focus:outline-none pointer-events-auto"
            >
              {e}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
