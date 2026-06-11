/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Volume2, VolumeX, Sparkles, AlertCircle } from "lucide-react";
import { soundSynthesizer } from "../utils/audio.js";

interface HomeScreenProps {
  onJoinRoom: (playerName: string, roomCode: string, avatar: string, isSpectator: boolean) => void;
  onCreateRoom: (playerName: string, avatar: string, isSpectator: boolean, maxRounds: number, gameMode: "regular" | "spicy") => void;
  errorMsg: string | null;
}

const AVATARS = ["🦊", "🦁", "🐯", "🐼", "🐨", "🦄", "🦖", "🐙", "🦀", "🍍", "🥑", "🌶️"];

const ADJECTIVES_EN = ["Soggy", "Salty", "Greasy", "Turbulent", "Confused", "Dancing", "Squeaky", "Flaming", "Spicy", "Sassy", "Explosive", "Sleepy", "Rabid", "Absurd", "Clueless", "Wobbly", "Crusty", "Shaky", "Bumbling", "Gassy", "Pickled", "Dumbfounded", "Brain-dead"];
const NOUNS_EN = ["Potato", "Waffle", "Sausage", "Bacon", "Donut", "Raccoon", "Mime", "Goose", "Pigeon", "Microwave", "Koala", "Snail", "Ostrich", "Braincell", "Noodle", "Muffin", "Toenail", "Mustard", "Nugget", "Sock", "Footbox", "Eggplant", "Salami", "Dustbunny"];

export default function HomeScreen({ onJoinRoom, onCreateRoom, errorMsg }: HomeScreenProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isMuted, setIsMuted] = useState(soundSynthesizer.getMuted());
  const [avatar, setAvatar] = useState("🦊");
  const [isSpectator, setIsSpectator] = useState(false);
  const [maxRounds, setMaxRounds] = useState(10);
  const [gameMode, setGameMode] = useState<"regular" | "spicy">("regular");

  const toggleSound = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundSynthesizer.setMute(nextMute);
    if (!nextMute) {
      soundSynthesizer.playLobbyMusic();
    }
  };

  const handleRandomizeName = () => {
    const adj = ADJECTIVES_EN[Math.floor(Math.random() * ADJECTIVES_EN.length)];
    const noun = NOUNS_EN[Math.floor(Math.random() * NOUNS_EN.length)];
    setName(`${adj} ${noun}`);
    // Randomize avatar too for fun
    setAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  };

  const initAudioAndSubmit = (callback: () => void) => {
    if (!name.trim()) return;
    // Trigger Synth once upon human gesture to unlock browser AudioContext policies
    soundSynthesizer.setMute(isMuted);
    if (!isMuted) {
      soundSynthesizer.playLobbyMusic();
    }
    callback();
  };

  return (
    <div className="w-full max-w-md mx-auto p-3 flex flex-col items-center justify-start min-h-screen md:min-h-0 py-3">
      
      {/* Cartoon Title / Logo */}
      <div className="relative mb-4 text-center mt-1">
        <motion.div
          animate={{ rotate: [-1.5, 1.5, -1.5], scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="relative inline-block"
        >
          <div className="bg-[#FDE047] border-3 md:border-4 border-black px-4 py-2 rounded-xl shadow-retro">
            <h1 className="text-3xl md:text-5.5xl font-black tracking-tighter text-black select-none uppercase leading-none">
              LAST BRAIN CELL
            </h1>
            <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-black mt-0.5 select-none flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" /> Comedy Party Game <Sparkles className="w-3 h-3" />
            </p>
          </div>
          
          {/* Laughing brain helper avatar */}
          <div className="absolute -top-7 -right-4 text-3xl transform rotate-12 drop-shadow-md select-none">
            🧠⚡
          </div>
        </motion.div>
      </div>

      {/* Main card panel - Designed around Vibrant Palette block layouts */}
      <div className="w-full bg-white text-black rounded-2xl p-4 sm:p-5 border-4 sm:border-5 border-black shadow-[8px_8px_0px_0px_#000000] flex flex-col gap-3 relative">
        
        {/* Row for Controls (Sound toggle) */}
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="relative inline-block">
            <span className="text-xs font-black tracking-wider bg-[#F472B6] text-white border-3 border-black rounded-lg px-2.5 py-1 uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              ENTER THE ARENA
            </span>
          </div>

          <div className="flex gap-2">
            {/* Sound toggle button */}
            <button
              onClick={toggleSound}
              type="button"
              className="p-1.5 bg-[#FDE047] text-black rounded-xl border-3 border-black hover:scale-110 active:scale-95 transition shadow-[2px_2px_0px_rgba(0,0,0,1)] text-xs cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Name input and Randomizer button */}
        <div className="flex flex-col gap-1.5 text-left mt-2 relative">
          <label htmlFor="player-name" className="text-xs font-black text-black tracking-wide uppercase flex justify-between items-center">
            <span>YOUR FUNNY NAME</span>
            <span className="text-slate-500 font-bold text-[10px] lowercase">created by Henro Brand &amp; 1 tired squirrel</span>
          </label>
          <div className="flex gap-2">
            <input
              id="player-name"
              type="text"
              placeholder="e.g., Steve McBrainless..."
              value={name}
              maxLength={15}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-white border-4 border-black rounded-xl p-3 text-black font-black tracking-wide focus:outline-none focus:bg-[#FDE047]/10 placeholder:text-neutral-400 text-md shadow-[4px_4px_0_rgba(0,0,0,0.15)]"
            />
            
            <button
              onClick={handleRandomizeName}
              type="button"
              title="Generate funny name"
              className="bg-[#38BDF8] border-4 border-black p-3 rounded-xl hover:bg-[#0ea5e9] hover:scale-105 active:scale-95 transition shadow-[4px_4px_0_rgba(0,0,0,1)] cursor-pointer text-xl"
            >
              🎲
            </button>
          </div>
        </div>

        {/* Custom Avatar Selector panel */}
        <div className="flex flex-col gap-1 text-left">
          <div className="flex justify-between items-center sm:pr-1">
            <span className="text-xs font-black uppercase text-black">
              CHOOSE YOUR AVATAR
            </span>
            <span className="text-[10px] font-black text-purple-600 bg-purple-50 border border-black/20 rounded px-1.5 py-0.5 select-none animate-pulse">
              LIVE: {avatar}
            </span>
          </div>
          
          <div className="flex gap-2 items-stretch mt-0.5">
            {/* Grid of presets */}
            <div className="grid grid-cols-6 gap-1.5 max-h-[90px] overflow-y-auto p-1 border-3 border-black rounded-xl bg-slate-50 flex-1">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  onClick={() => setAvatar(av)}
                  type="button"
                  className={`text-xl p-1 rounded-lg border-2 text-center transition hover:scale-110 cursor-pointer ${
                    avatar === av ? 'border-purple-600 bg-purple-100 shadow-[1px_1px_0_rgba(0,0,0,1)]' : 'border-transparent hover:bg-slate-200'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="flex flex-col justify-center items-center bg-purple-100 border-3 border-black p-1.5 rounded-xl text-center w-24 shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[8px] font-black uppercase text-black leading-none mb-1">TYPE COZY</span>
              <input
                type="text"
                maxLength={3}
                value={avatar}
                onChange={(e) => {
                  const val = e.target.value;
                  setAvatar(val);
                }}
                onBlur={() => {
                  if (!avatar.trim()) setAvatar("🦊");
                }}
                placeholder="🦊"
                className="w-full text-center text-lg bg-white border-2 border-black rounded-md py-0.5 font-bold font-sans tracking-tight focus:outline-none focus:ring-1 focus:ring-purple-600"
                title="Type any custom emoji or up to 3 characters!"
              />
            </div>
          </div>
        </div>

        {/* Joined Role Mode: Spectator checkbox */}
        <div className="flex items-center gap-3 bg-neutral-100 p-2.5 rounded-xl border-3 border-neutral-300">
          <input
            id="spectator-toggle"
            type="checkbox"
            checked={isSpectator}
            onChange={(e) => setIsSpectator(e.target.checked)}
            className="w-5 h-5 accent-purple-600 rounded border-2 border-black cursor-pointer"
          />
          <div className="flex flex-col text-left">
            <label htmlFor="spectator-toggle" className="text-xs font-black text-black select-none cursor-pointer uppercase">
              JOIN AS SPECTATOR
            </label>
            <span className="text-[10px] font-bold text-neutral-500 leading-tight">
              Watch and observe the ridiculousness without submitting.
            </span>
          </div>
        </div>

        {/* Join lobby section / Room code */}
        <div className="flex flex-col gap-2 text-left pt-3 border-t-4 border-black">
          <label htmlFor="room-code" className="text-xs font-black text-black tracking-wide uppercase">
            JOIN WITH ROOM CODE
          </label>
          <div className="flex gap-3">
            <input
              id="room-code"
              type="text"
              placeholder="BCEL"
              value={code}
              maxLength={4}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-1/2 bg-[#FFF] border-4 border-black rounded-xl p-3 text-[#6D28D9] font-black tracking-widest text-center text-lg placeholder:text-neutral-400 uppercase focus:outline-none focus:bg-[#FDE047]/10"
            />
            
            <button
              onClick={() => initAudioAndSubmit(() => onJoinRoom(name, code, avatar, isSpectator))}
              disabled={!name.trim() || code.length !== 4}
              id="join-room-btn"
              className="w-1/2 bg-[#A3E635] text-black border-4 border-black rounded-xl font-black text-xs hover:bg-[#8ade2a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1 cursor-pointer pointer-events-auto"
            >
              JOIN ROOM
            </button>
          </div>
        </div>

        {/* Host Creation Controls */}
        <div className="bg-purple-100/40 p-3 rounded-xl border-3 border-black flex flex-col gap-2 mt-1">
          <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider flex items-center gap-1 select-none">
            ⚙️ HOST LOBBY GAME CONFIGS
          </span>

          {/* Theme Selector (Regular vs Spicy) */}
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[9px] font-black text-neutral-600 uppercase">GAME MODE</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGameMode("regular")}
                className={`py-1.5 px-3 rounded-lg border-2 font-black text-2xs uppercase cursor-pointer transition ${
                  gameMode === "regular"
                    ? "bg-[#60A5FA] text-black border-black shadow-[2px_2px_0_rgba(0,0,0,1)]"
                    : "bg-white text-stone-600 border-neutral-300 hover:bg-stone-100"
                }`}
              >
                🍎 REGULAR
              </button>
              <button
                type="button"
                onClick={() => setGameMode("spicy")}
                className={`py-1.5 px-3 rounded-lg border-2 font-black text-2xs uppercase cursor-pointer transition ${
                  gameMode === "spicy"
                    ? "bg-[#EF4444] text-white border-black shadow-[2px_2px_0_rgba(0,0,0,1)] animate-pulse"
                    : "bg-white text-stone-600 border-[#000]/10 hover:bg-stone-100"
                }`}
              >
                🔥 SPICY
              </button>
            </div>
          </div>

          {/* Rounds limit selection */}
          <div className="flex flex-col gap-1 text-left mt-0.5">
            <div className="flex justify-between items-center text-[9px] font-black text-neutral-600 uppercase">
              <span>NUMBER OF ROUNDS</span>
              <span className="bg-[#A3E635] text-black border-2 border-black rounded-md px-1.5 py-0.5 text-xs font-mono font-black">{maxRounds}</span>
            </div>
            <input
              type="range"
              min="5"
              max="15"
              step="1"
              value={maxRounds}
              onChange={(e) => setMaxRounds(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-purple-600 border border-black"
            />
            <div className="flex justify-between items-center text-[8px] text-neutral-500 font-bold px-0.5 select-none">
              <span>5 MIN</span>
              <span>10 (DEFAULT)</span>
              <span>15 MAX</span>
            </div>
          </div>
        </div>

        {/* Create room button */}
        <button
          onClick={() => initAudioAndSubmit(() => onCreateRoom(name, avatar, isSpectator, maxRounds, gameMode))}
          disabled={!name.trim()}
          id="create-room-btn"
          className="w-full bg-[#FDE047] text-black border-4 border-black py-2.5 rounded-xl font-black text-md hover:bg-[#ebd036] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer pointer-events-auto"
        >
          CREATE LOBBY ⚡
        </button>

        {/* Error indicators */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 bg-[#EF4444] text-white border-3 border-black text-xs font-black rounded-xl p-3 flex items-start gap-2 text-left shadow-[3px_3px_0_rgba(0,0,0,1)]"
          >
            <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

      </div>

      <div className="mt-4 text-black bg-white/25 border-2 border-black/40 rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest text-center max-w-xs select-none relative">
        <span>🏆 Ideal for 3 - 6 players. Grab your friends and see who has the funniest solutions left.</span>
        <div className="text-[8px] font-bold text-black/50 lowercase mt-1 tracking-normal font-sans">
          Created by Henro Brand
        </div>
      </div>
    </div>
  );
}
