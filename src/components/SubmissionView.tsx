/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Clock, Send, Sparkles, CheckCircle2 } from "lucide-react";
import { Challenge } from "../types.js";
import { soundSynthesizer } from "../utils/audio.js";

interface SubmissionViewProps {
  challenge: Challenge;
  timerRemaining: number;
  timerDuration: number;
  onSubmit: (answer: string) => void;
  hasSubmitted: boolean;
  isSpectator?: boolean;
  language?: 'EN' | 'AF';
}

export default function SubmissionView({
  challenge,
  timerRemaining,
  timerDuration,
  onSubmit,
  hasSubmitted,
  isSpectator = false,
  language = 'EN'
}: SubmissionViewProps) {
  const CharacterLimit = 300;
  const [answer, setAnswer] = useState("");

  const isAf = language === 'AF';

  // Sound ticking effects hook
  useEffect(() => {
    if (hasSubmitted || isSpectator) return;

    if (timerRemaining <= 10 && timerRemaining > 0) {
      soundSynthesizer.playTickingDown();
    } else if (timerRemaining > 10 && timerRemaining <= timerDuration - 1) {
      soundSynthesizer.playTick();
    }
  }, [timerRemaining, hasSubmitted, timerDuration, isSpectator]);

  // Handle auto-submit when timer hits 0
  useEffect(() => {
    if (isSpectator) return;
    if (timerRemaining === 0 && !hasSubmitted) {
      const finalText = answer.trim() || (isAf ? `Dra op eie leë breingolwe oor...` : `Submitting empty brain waves...`);
      onSubmit(finalText);
    }
  }, [timerRemaining, hasSubmitted, answer, onSubmit, isSpectator, isAf]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasSubmitted || isSpectator || !answer.trim()) return;
    onSubmit(answer.trim());
  };

  const remainingChars = CharacterLimit - answer.length;

  return (
    <div className="w-full max-w-lg mx-auto p-4 flex flex-col items-center">
      
      {/* Category Indicator Badge - Rethemed */}
      <div className="bg-[#A78BFA] border-3 border-black rounded-lg py-1 px-4 text-xs font-black tracking-widest text-black mb-6 uppercase inline-flex items-center gap-1.5 select-none shadow-[2px_2px_0_#000]">
        <Sparkles className="w-3.5 h-3.5" /> {isAf ? "KATEGORIE" : "CATEGORY"}: {challenge.category} <Sparkles className="w-3.5 h-3.5" />
      </div>

      {/* Primary Challenge Scenario Card - Match Challenge Card exactly from style draft */}
      <div className="bg-white border-6 border-black p-8 rounded-3xl w-full text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-8 text-black select-none relative">
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-[#F472B6] text-white py-1 px-5 font-black text-xs md:text-sm border-4 border-black uppercase tracking-wider shadow-[3px_3px_0px_rgba(0,0,0,1)] whitespace-nowrap">
          {isAf ? "HUIDIGE UITDAGING" : "CURRENT CHALLENGE"}
        </div>
        <h3 className="text-xl md:text-2xl font-black leading-snug tracking-tight text-black mt-2 font-sans">
          "{challenge.scenario}"
        </h3>
      </div>

      {/* Submission panel container - Vibrant details */}
      <div className="w-full bg-white text-black rounded-2xl p-6 border-6 border-black shadow-[12px_12px_0px_0px_#000000] flex flex-col gap-4 relative">
        
        {/* Floating timer clock of Vibrant style */}
        <div className="flex items-center justify-between border-b-4 border-black pb-3">
          <span className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-1.5 font-sans">
            <Clock className={`w-4 h-4 ${timerRemaining <= 10 ? "text-red-500 animate-bounce" : "text-black"}`} /> 
            {timerRemaining <= 10 
              ? (isAf ? "TYD LOOP UIT!" : "TIME TALLYING!") 
              : (isAf ? "DINK BLITSVINNIG!" : "THINK FAST")
            }
          </span>
          <span className={`text-xl font-black w-12 h-12 rounded-full border-4 border-black flex items-center justify-center text-white shrink-0 animate-pulse bg-[#EF4444] shadow-[2px_2px_0px_#000]`}>
            {timerRemaining}
          </span>
        </div>

        {isSpectator ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <div className="text-5xl mb-4 select-none">👁️✨</div>
            <h4 className="text-xl font-black text-black uppercase tracking-wide">
              {isAf ? "TOESKOUER MODUS" : "SPECTATOR MODE"}
            </h4>
            <p className="text-neutral-700 text-xs mt-1.5 max-w-xs font-bold leading-normal">
              {isAf 
                ? "Jy neem tans waar as 'n toeskouer! Kyk hoe die speler-breinselle probeer om snaakse antwoorde te bedink." 
                : "You are currently observing as a spectator! See how other player brain cells try to cook up funny responses."
              }
            </p>
            <div className="flex gap-1.5 mt-5 items-center justify-center">
              <span className="w-3.5 h-3.5 bg-purple-400 border-2 border-black rounded-full animate-bounce" />
              <span className="w-3.5 h-3.5 bg-purple-500 border-2 border-black rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-3.5 h-3.5 bg-purple-600 border-2 border-black rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          </motion.div>
        ) : !hasSubmitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label htmlFor="answer-input" className="text-xs font-black text-black uppercase tracking-wide text-left">
              {isAf ? "SKRYF JOU SNAAKSE OPLOSSING:" : "WRITE YOUR HILARIOUS SOLUTION:"}
            </label>
            <textarea
              id="answer-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.substring(0, CharacterLimit))}
              placeholder={isAf ? "Skryf jou snaakse antwoord hier..." : "Write your hilarious solution here... Absurd ideas welcome!"}
              rows={4}
              maxLength={CharacterLimit}
              className="w-full bg-white border-4 border-black rounded-xl p-4 text-black font-extrabold text-md focus:outline-none focus:bg-amber-100/10 placeholder:text-neutral-500 shadow-[inset_1px_1px_4px_rgba(0,0,0,0.15)] resize-none"
            />
            
            {/* Character indicator bar */}
            <div className="flex items-center justify-between text-xs font-black select-none">
              <span className={remainingChars <= 30 ? "text-red-600 animate-pulse" : "text-stone-600"}>
                {remainingChars} {isAf ? "karakters oor" : "characters left"}
              </span>
              <span className="text-black uppercase tracking-widest text-[10px] bg-[#FBBF24] border-2 border-black rounded px-1.5 py-0.5">
                {isAf ? "maks 300" : "300 limit"}
              </span>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!answer.trim()}
              id="submit-answer-btn"
              className="w-full mt-2 bg-[#A3E635] text-black border-4 border-black py-4 rounded-xl font-black text-lg hover:bg-[#8cdc21] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 cursor-pointer pointer-events-auto text-center"
            >
              <Send className="w-5 h-5 shrink-0" /> {isAf ? "STUUR ANTWOORD GO!" : "SUBMIT ANSWER GO!"}
            </button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-[#A3E635] mb-3 animate-pulse border-4 border-black rounded-full p-1 bg-black" />
            <h4 className="text-xl font-black text-black uppercase tracking-wide">
              {isAf ? "ANTWOORD GEPLANT!" : "ANSWER PLANTED!"}
            </h4>
            <p className="text-stone-700 text-xs mt-1.5 max-w-xs font-bold leading-normal">
              {isAf 
                ? "Jou briljante sinapse is gestoor. Wag vir ander breinselle om klaar te kook."
                : "Your brilliant synapses have been logged. Waiting for the remaining brain cells to finish cooking."
              }
            </p>
            <div className="flex gap-1.5 mt-5 items-center justify-center">
              <span className="w-3.5 h-3.5 bg-[#FDE047] border-2 border-black rounded-full animate-bounce" />
              <span className="w-3.5 h-3.5 bg-[#F472B6] border-2 border-black rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-3.5 h-3.5 bg-[#60A5FA] border-2 border-black rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
