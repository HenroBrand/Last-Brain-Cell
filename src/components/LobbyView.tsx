/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Users, AlertCircle, Play, Sparkles, Crown, Languages } from "lucide-react";
import { Player } from "../types.js";

interface LobbyViewProps {
  roomCode: string;
  players: Player[];
  player: { id: string; name: string; isHost: boolean };
  onStartGame: () => void;
  onTransferHost: (targetPlayerId: string) => void;
  errorMsg: string | null;
}

const FUNNY_TIPS = [
  "If you cannot think of a funny answer, write something about a hostile badger. People love badgers.",
  "Self-voting is physically impossible. Save your last remaining neuron the embarrassment of trying.",
  "Bonus categories are computed by our sarcastic AI. Flattery inside your answer does not guarantee extra points (but could be funny).",
  "Science confirms that wearing a colander on your head increases comical performance by 12.4%.",
  "If your jokes are failing, claim your keyboard translation was delayed. Or blame the raccoon who wrote the database.",
  "Warning: Extreme laughter might trigger spontaneous brain cell splitting. Proceed at your own comedy risk.",
  "If your score is low, try whispering sweet coding secrets to the hosting robot.",
  "Science shows that spelling mistakes make your answer 28% more raserig and chaotic.",
  "Pressing reaction buttons multiple times increases your CPU's heart-rate. It is completely useless but highly satisfying.",
  "Spectators are legally permitted to judge others. In fact, it is encouraged by the Intergalactic Committee of Sitcombators.",
  "In case of low brain activity, please restart your central nervous system or consume a delicious savoury tart.",
  "Stuck in writer's block? Close your eyes, think of a massive baked bean, and write the first word that comes to mind.",
  "The server is powered by a hamster on a treadmill. Please try to make shorter jokes to avoid overheating his little paws.",
  "According to local guidelines, using more than three punctuation marks in a joke is considered shouting at the algorithm.",
  "If someone is beating you in points, check under their chair for smuggled dictionaries or miniature joke books.",
  "Spectatorship is an art form. Make sure to breathe heavily into your virtual microphone to assert dominance."
];

export default function LobbyView({
  roomCode,
  players,
  player,
  onStartGame,
  onTransferHost,
  errorMsg
}: LobbyViewProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const tipsCount = FUNNY_TIPS.length;
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tipsCount);
    }, 9000);
    return () => clearInterval(tipTimer);
  }, []);

  // Separate active content and spectator status
  const activePlayers = players.filter(p => !p.isSpectator);
  const spectators = players.filter(p => p.isSpectator);

  const totalActivePlayers = activePlayers.length;
  const isStartDisabled = totalActivePlayers < 3 || totalActivePlayers > 6;

  return (
    <div className="w-full max-w-lg mx-auto p-3 flex flex-col items-center">
      
      {/* Header Room Code Billboard */}
      <div className="bg-[#FFF] border-4 border-black p-4 rounded-xl w-full text-center shadow-retro mb-4 relative mt-2 text-black">
        <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-2xs font-black bg-[#F472B6] text-white border-2 border-[#000000] px-3 py-0.5 rounded-lg uppercase shadow-[2.5px_2.5px_0px_#000] whitespace-nowrap">
          ROOM CODE LOBBY
        </span>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-widest mt-1 bg-black text-[#A3E635] py-2 md:py-3.5 px-6 rounded-xl border-3 border-black flex items-center justify-center font-mono leading-none">
          {roomCode}
        </h2>
        <p className="text-[10px] font-black text-black mt-2 uppercase tracking-wider">
          SHARE THIS CODE TO CONNECT SYNAPSES!
        </p>
      </div>

      {/* Main Connected Players List container */}
      <div className="w-full bg-white text-black rounded-xl p-4 sm:p-5 border-4 sm:border-5 border-black shadow-[8px_8px_0px_0px_#000000] flex flex-col gap-3">
        
        <div className="flex items-center justify-between border-b-3 border-black pb-2.5">
          <h3 className="text-sm sm:text-base font-black text-black uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-black shrink-0" /> 
            PLAYERS CONNECTED ({totalActivePlayers}/6)
          </h3>
          
          <span className="text-[9px] bg-[#FDE047] text-black border-2 border-black px-2 py-0.5 rounded-lg font-black uppercase shadow-[1px_1px_rgba(0,0,0,1)]">
            LOBBY
          </span>
        </div>

        {/* List of Players */}
        <div className="grid grid-cols-1 gap-2.5 my-0.5">
          {activePlayers.map((p, idx) => {
            const isMe = p.id === player.id;
            const avatars = ["🦊", "🐙", "🦖", "🦄", "🤖"];
            const colors = ["bg-[#60A5FA]", "bg-[#F87171]", "bg-[#FBBF24]", "bg-[#34D399]", "bg-[#A78BFA]"];
            const defaultAvatarIdx = idx % avatars.length;
            
            // Render actual user chosen avatar or fallback to index matching
            const targetAvatar = p.avatar || avatars[defaultAvatarIdx];
            const targetBg = colors[defaultAvatarIdx];

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center justify-between p-2.5 px-3.5 rounded-xl border-3 sm:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                  isMe ? "bg-[#FDE047]/15 border-black" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {/* Avatar Sphere of the Vibrant Palette style */}
                  <div className={`w-9 h-9 rounded-full border-2 border-black flex items-center justify-center text-xl ${targetBg} shadow-[1.5px_1.5px_0_#000] shrink-0`}>
                    {targetAvatar}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-extrabold text-black tracking-wide text-sm flex items-center gap-1 sm:gap-1.5 leading-none">
                      {p.name} {isMe && <span className="text-[#6D28D9] font-black text-2xs">(YOU)</span>}
                    </span>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wide mt-0.5">
                      Synapse Online
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Transfer Host button - Only shown to hosts who want to give crown to someone else */}
                  {player.isHost && !isMe && (
                    <button
                      onClick={() => onTransferHost(p.id)}
                      type="button"
                      title="Transfer host role"
                      className="flex items-center gap-1 bg-stone-100 hover:bg-yellow-250 hover:border-yellow-400 text-[8px] font-black border-2 border-black p-0.5 px-1.5 rounded-md transition cursor-pointer"
                    >
                      <Crown className="w-2.5 h-2.5 text-amber-500 fill-current" />
                      <span>GIVE HOST</span>
                    </button>
                  )}
                  
                  {p.isHost ? (
                    <span className="text-[9px] uppercase font-black tracking-widest bg-[#F472B6] text-white px-2 py-0.5 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] flex items-center gap-0.5">
                      <Crown className="w-3 h-3 text-yellow-300 fill-current" />
                      HOST
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 bg-black text-white py-0.5 px-1.5 rounded-lg border-2 border-black text-[8px] font-black select-none">
                      <span className="w-2 h-2 rounded-full border border-black bg-[#A3E635] animate-pulse" />
                      READY
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          
          {/* Waiting animation spaces for missing players */}
          {totalActivePlayers < 3 && (
            <div className="p-4 rounded-xl border-4 border-dashed border-black bg-stone-50 text-center text-black/60 text-xs font-black animate-pulse uppercase tracking-wider">
              {`Waiting for ${3 - totalActivePlayers} more player${totalActivePlayers === 1 ? "s" : ""} to activate...`}
            </div>
          )}
        </div>

        {/* Dedicated Spectators subset visual panel */}
        {spectators.length > 0 && (
          <div className="mt-2 pt-3 border-t-4 border-dashed border-gray-300">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>👁️ SPECTATORS WATCHING ({spectators.length})</span>
            </h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {spectators.map((spec) => (
                <div
                  key={spec.id}
                  className="flex items-center gap-2 bg-stone-100 border-2 border-black p-1.5 px-3 rounded-lg text-xs font-black shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                >
                  <span className="text-base select-none">{spec.avatar || "👁️"}</span>
                  <span className="text-black">{spec.name}</span>
                  {spec.id === player.id && <span className="text-purple-600 font-extrabold text-[10px]">(YOU)</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error messaging */}
        {errorMsg && (
          <div className="bg-[#EF4444] border-3 border-black text-white text-xs font-black rounded-lg p-3.5 flex items-start gap-2 text-left shadow-[3px_3px_0_#000]">
            <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Lobby controls based on player status */}
        {player.isHost ? (
          <div className="mt-2 text-center border-t-4 border-black pt-4">
            {totalActivePlayers < 3 ? (
              <p className="text-xs font-black text-rose-600 mb-3 flex items-center justify-center gap-1 uppercase tracking-wide">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> 
                Game requires minimum 3 active players to start!
              </p>
            ) : (
              <p className="text-xs font-black text-[#6D28D9] mb-3 flex items-center justify-center gap-1 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 animate-bounce text-[#6D28D9]" /> 
                PLAYERS LIST COMPLETED. LAUNCH WHEN READY!
              </p>
            )}
            
            <button
              onClick={onStartGame}
              disabled={isStartDisabled}
              id="start-match-btn"
              className="w-full bg-[#A3E635] text-black border-4 border-black py-4 rounded-xl font-black text-xl hover:bg-[#8cdc21] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-45 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer pointer-events-auto"
            >
              <Play className="w-5 h-5 fill-current" /> START MATCH NOW
            </button>
          </div>
        ) : (
          <div className="mt-3 p-4 rounded-xl bg-black border-4 border-black text-center text-[#A3E635] text-xs font-black flex flex-col gap-1 shadow-retro-sm">
            <span className="animate-pulse text-[#FDE047] font-black uppercase tracking-wider text-sm">
              WAITING ON SYNC
            </span>
            <span className="text-stone-300">
              {`Tell Host (${players.find(p => p.isHost)?.name || "unknown"}) to press the golden trigger!`}
            </span>
          </div>
        )}

      </div>

      {/* Funny loading screens tip area */}
      <div className="mt-5 w-full max-w-sm text-center">
        <motion.div
          key={tipIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="bg-white text-black p-4 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <strong className="text-[#6D28D9] block mb-1 font-black uppercase tracking-wider text-[11px] border-b-2 border-black pb-0.5">
            COMEDY INSPIRATION VALVE
          </strong>
          <span className="italic font-bold text-xs">
            "{FUNNY_TIPS[tipIndex]}"
          </span>
        </motion.div>
      </div>

    </div>
  );
}
