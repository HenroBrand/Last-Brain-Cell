/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Eye, ChevronRight } from "lucide-react";
import { RoundAnswer, Player } from "../types.js";
import { soundSynthesizer } from "../utils/audio.js";

interface RevealViewProps {
  answers: RoundAnswer[];
  revealedAnswerIndex: number;
  player: { id: string; name: string; isHost: boolean };
  onNextReveal: () => void;
  players: Player[];
}

export default function RevealView({
  answers,
  revealedAnswerIndex,
  player,
  onNextReveal,
  players
}: RevealViewProps) {
  const currentAnswer = revealedAnswerIndex >= 0 ? answers[revealedAnswerIndex] : null;
  const isLast = revealedAnswerIndex >= answers.length - 1;

  // Sound cues on new card flip
  useEffect(() => {
    if (revealedAnswerIndex >= 0) {
      soundSynthesizer.playVoteSfx();
    }
  }, [revealedAnswerIndex]);

  return (
    <div className="w-full max-w-lg mx-auto p-4 flex flex-col items-center">
      
      {/* Top Phase Ribbon */}
      <div className="bg-[#A78BFA] border-3 border-black rounded-lg py-1 px-4 text-xs font-black tracking-widest text-black mb-6 uppercase inline-flex items-center gap-1 shadow-[2px_2px_0_#000]">
        <Sparkles className="w-3.5 h-3.5" /> 
        {`REVEALING ANSWERS (${revealedAnswerIndex + 1}/${answers.length})`}
      </div>

      <div className="w-full min-h-[40vh] flex flex-col items-center justify-center relative my-4">
        <AnimatePresence mode="wait">
          {revealedAnswerIndex === -1 ? (
            <motion.div
              key="intro"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="text-center p-8 bg-white text-black rounded-2xl border-6 border-black max-w-sm flex flex-col items-center gap-4 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-6xl animate-bounce">🙈</div>
              <h3 className="text-xl font-black uppercase tracking-wide">
                Ready for the cringe?
              </h3>
              <p className="text-xs text-stone-700 font-extrabold leading-relaxed">
                Players have submitted. The answers have been scrambled, blended, and rendered generic. Self-voting is banned. Prepare to judge!
              </p>
              {player.isHost ? (
                <p className="text-xs text-[#6D28D9] font-black animate-pulse uppercase tracking-wide">
                  Hit 'REVEAL FIRST ANSWER' to kick off the carousel!
                </p>
              ) : (
                <p className="text-xs text-cyan-600 font-black animate-pulse uppercase tracking-wide">
                  Unlocking neural pathways... waiting for the host.
                </p>
              )}
            </motion.div>
          ) : (
            currentAnswer && (
              <motion.div
                key={revealedAnswerIndex}
                initial={{ rotate: -5, scale: 0.7, opacity: 0, y: 30 }}
                animate={{ rotate: 1, scale: 1, opacity: 1, y: 0 }}
                exit={{ rotate: 5, scale: 0.8, opacity: 0, y: -30 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="w-full bg-white text-black rounded-2xl p-7 border-6 border-black shadow-[12px_12px_0px_0px_#000000] flex flex-col justify-between items-center text-center gap-6 min-h-[300px]"
              >
                <div className="bg-[#FDE047] text-black border-3 border-black font-black uppercase text-xs tracking-widest px-4 py-1.5 rounded-lg shadow-[3px_3px_0px_rgba(0,0,0,1)] select-none">
                  BRAIN SPECIMEN #{revealedAnswerIndex + 1}
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xl md:text-2xl font-black text-[#6D28D9] leading-relaxed italic select-none font-sans">
                    "{currentAnswer.text}"
                  </p>
                </div>

                <div className="w-full border-t-4 border-black pt-4 text-xs text-black font-black uppercase tracking-wider">
                  Origin Species: Anonymous 👽
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Host Action Buttons */}
      {player.isHost && (
        <div className="w-full max-w-sm mt-4">
          <button
            onClick={onNextReveal}
            id="reveal-next-deck-btn"
            className="w-full bg-[#A3E635] text-black border-4 border-black py-4 rounded-xl font-black text-lg hover:bg-[#8cdc21] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition flex items-center justify-center gap-2 cursor-pointer pointer-events-auto"
          >
            <Eye className="w-5 h-5" /> 
            {revealedAnswerIndex === -1 
              ? "REVEAL FIRST ANSWER" 
              : isLast 
                ? "PROCEED TO VOTING" 
                : "REVEAL NEXT ANSWER"
            }
            <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      )}

      {/* Guest Status banner */}
      {!player.isHost && (
        <div className="mt-4 p-4 rounded-xl bg-black border-4 border-black text-center text-[#FBBF24] text-xs font-black max-w-sm flex flex-col gap-1 select-none shadow-retro-sm">
          <span className="animate-pulse text-white font-black uppercase tracking-wider">REVIEW IN PROGRESS...</span>
          <span className="text-stone-300">
            {`(${players.find(p => p.isHost)?.name || "The Host"}) holds the cards. Gaze up at their feed or hold tight!`}
          </span>
        </div>
      )}

    </div>
  );
}
