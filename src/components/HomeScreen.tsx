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
  onCreateRoom: (playerName: string, avatar: string, isSpectator: boolean, language: 'EN' | 'AF') => void;
  errorMsg: string | null;
}

const AVATARS = ["🦊", "🦁", "🐯", "🐼", "🐨", "🦄", "🦖", "🐙", "🦀", "🍍", "🥑", "🌶️"];

const ADJECTIVES_EN = ["Soggy", "Salty", "Greasy", "Turbulent", "Confused", "Dancing", "Squeaky", "Flaming", "Spicy", "Sassy", "Explosive", "Sleepy", "Rabid", "Absurd", "Clueless", "Wobbly"];
const NOUNS_EN = ["Potato", "Waffle", "Sausage", "Bacon", "Donut", "Raccoon", "Mime", "Goose", "Pigeon", "Microwave", "Koala", "Snail", "Ostrich", "Braincell", "Noodle", "Muffin"];

const ADJECTIVES_AF = ["Vrot", "Snotterige", "Kwaai", "Dronk", "Snaakse", "Brak", "Skurwe", "Vet", "Taai", "Laat", "Warm", "Ryp", "Bles", "Mal", "Koue", "Woeste"];
const NOUNS_AF = ["Koeksister", "Melktert", "Bakkie", "Makarou", "Tokkelossie", "Boerewors", "Pap", "Makou", "Volstruis", "Braaier", "Blatjang", "Karoo", "Blesbok", "Tannie", "Pampoen"];

export default function HomeScreen({ onJoinRoom, onCreateRoom, errorMsg }: HomeScreenProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isMuted, setIsMuted] = useState(soundSynthesizer.getMuted());
  const [avatar, setAvatar] = useState("🦊");
  const [isSpectator, setIsSpectator] = useState(false);
  const [lang, setLang] = useState<'EN' | 'AF'>('EN');

  const toggleSound = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundSynthesizer.setMute(nextMute);
    if (!nextMute) {
      soundSynthesizer.playLobbyMusic();
    }
  };

  const handleRandomizeName = () => {
    if (lang === 'AF') {
      const adj = ADJECTIVES_AF[Math.floor(Math.random() * ADJECTIVES_AF.length)];
      const noun = NOUNS_AF[Math.floor(Math.random() * NOUNS_AF.length)];
      setName(`${adj} ${noun}`);
    } else {
      const adj = ADJECTIVES_EN[Math.floor(Math.random() * ADJECTIVES_EN.length)];
      const noun = NOUNS_EN[Math.floor(Math.random() * NOUNS_EN.length)];
      setName(`${adj} ${noun}`);
    }
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
    <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[85vh]">
      
      {/* Cartoon Title / Logo */}
      <div className="relative mb-6 text-center mt-2">
        <motion.div
          animate={{ rotate: [-2, 2, -2], scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="relative inline-block"
        >
          <div className="bg-[#FDE047] border-4 border-black px-6 py-4 rounded-xl shadow-retro">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-black select-none uppercase">
              {lang === 'AF' ? "DIE LAASTE BREINSEL" : "LAST BRAIN CELL"}
            </h1>
            <p className="text-xs font-black uppercase tracking-wider text-black mt-1 select-none flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {lang === 'AF' ? "Komiese Partytjiespel" : "Comedy Party Game"} <Sparkles className="w-3.5 h-3.5" />
            </p>
          </div>
          
          {/* Laughing brain helper avatar */}
          <div className="absolute -top-10 -right-6 text-5xl transform rotate-12 drop-shadow-md select-none">
            🧠⚡
          </div>
        </motion.div>
      </div>

      {/* Main card panel - Designed around Vibrant Palette block layouts */}
      <div className="w-full bg-white text-black rounded-2xl p-6 border-6 border-black shadow-[12px_12px_0px_0px_#000000] flex flex-col gap-4 relative">
        
        {/* Row for Controls (Sound + Language toggle) */}
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="relative inline-block">
            <span className="text-xs font-black tracking-wider bg-[#F472B6] text-white border-3 border-black rounded-lg px-2.5 py-1 uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              {lang === 'AF' ? "VEG VIR JOU BREIN" : "ENTER THE ARENA"}
            </span>
          </div>

          <div className="flex gap-2">
            {/* Language switch button */}
            <button
              onClick={() => {
                const nl = lang === 'EN' ? 'AF' : 'EN';
                setLang(nl);
              }}
              type="button"
              className="px-2.5 py-1.5 bg-[#6D28D9] text-white font-black rounded-xl border-3 border-black hover:scale-105 transition shadow-[2px_2px_0px_rgba(0,0,0,1)] text-xs cursor-pointer"
            >
              🌐 {lang === 'EN' ? "ENGLISH" : "AFRIKAANS"}
            </button>

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
            <span>{lang === 'AF' ? "JOU SNAAKSE NAAM" : "YOUR FUNNY NAME"}</span>
            <span className="text-slate-500 font-bold text-[10px] lowercase">{lang === 'AF' ? "laas geskep deur Henro" : "created by Henro Brand"}</span>
          </label>
          <div className="flex gap-2">
            <input
              id="player-name"
              type="text"
              placeholder={lang === 'AF' ? "Bv. Frikkie Koeksister..." : "e.g., Steve McBrainless..."}
              value={name}
              maxLength={15}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-white border-4 border-black rounded-xl p-3 text-black font-black tracking-wide focus:outline-none focus:bg-[#FDE047]/10 placeholder:text-neutral-400 text-md shadow-[4px_4px_0_rgba(0,0,0,0.15)]"
            />
            
            <button
              onClick={handleRandomizeName}
              type="button"
              title={lang === 'AF' ? "Genereer ewekansige naam" : "Generate funny name"}
              className="bg-[#38BDF8] border-4 border-black p-3 rounded-xl hover:bg-[#0ea5e9] hover:scale-105 active:scale-95 transition shadow-[4px_4px_0_rgba(0,0,0,1)] cursor-pointer text-xl"
            >
              🎲
            </button>
          </div>
        </div>

        {/* Custom Avatar Selector panel */}
        <div className="flex flex-col gap-1 text-left">
          <span className="text-xs font-black uppercase text-black">
            {lang === 'AF' ? "KIES JOU AVATAR" : "CHOOSE YOUR AVATAR"}
          </span>
          <div className="grid grid-cols-6 gap-1.5 max-h-[90px] overflow-y-auto p-1 border-3 border-black rounded-xl bg-slate-50">
            {AVATARS.map((av) => (
              <button
                key={av}
                onClick={() => setAvatar(av)}
                type="button"
                className={`text-xl p-1.5 rounded-lg border-2 text-center transition hover:scale-110 cursor-pointer ${
                  avatar === av ? 'border-purple-600 bg-purple-100 shadow-[1px_1px_0_rgba(0,0,0,1)]' : 'border-transparent hover:bg-slate-200'
                }`}
              >
                {av}
              </button>
            ))}
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
              {lang === 'AF' ? "MELD AAN AS TOESKOUER" : "JOIN AS SPECTATOR"}
            </label>
            <span className="text-[10px] font-bold text-neutral-500 leading-tight">
              {lang === 'AF' ? "Kyk na die speletjie sonder om antwoorde in te dien." : "Watch and observe the ridiculousness without submitting."}
            </span>
          </div>
        </div>

        {/* Join lobby section / Room code */}
        <div className="flex flex-col gap-2 text-left pt-3 border-t-4 border-black">
          <label htmlFor="room-code" className="text-xs font-black text-black tracking-wide uppercase">
            {lang === 'AF' ? "SLUIT AAN MET KAMERKODE" : "JOIN WITH ROOM CODE"}
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
              {lang === 'AF' ? "SLUIT AAN" : "JOIN ROOM"}
            </button>
          </div>
        </div>

        {/* Create room button */}
        <button
          onClick={() => initAudioAndSubmit(() => onCreateRoom(name, avatar, isSpectator, lang))}
          disabled={!name.trim()}
          id="create-room-btn"
          className="w-full mt-1 bg-[#FDE047] text-black border-4 border-black py-3.5 rounded-xl font-black text-md hover:bg-[#ebd036] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer pointer-events-auto"
        >
          {lang === 'AF' ? "SKEP KAMER ⚡" : "CREATE LOBBY ⚡"}
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
        <span>🏆 {lang === 'AF' ? "Ideaal vir 3 - 5 spelers. Kyk wie het die snaaksste breinselle oor." : "Ideal for 3 - 5 players. Grab your friends and see who has the funniest solutions left."}</span>
        <div className="text-[8px] font-bold text-black/50 lowercase mt-1 tracking-normal font-sans">
          Geskep deur Henro Brand (Afrikaans Language Mode)
        </div>
      </div>
    </div>
  );
}
