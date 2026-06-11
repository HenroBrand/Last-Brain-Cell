/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EmojiBroadcast } from "../types.js";
import { soundSynthesizer } from "../utils/audio.js";

interface FloatingEmojisProps {
  emojis: EmojiBroadcast[];
}

interface FloatingItem {
  id: string;
  emoji: string;
  sender: string;
  left: number;
}

export default function FloatingEmojis({ emojis }: FloatingEmojisProps) {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef<boolean>(true);

  useEffect(() => {
    if (emojis.length === 0) return;

    // Check if it's the very first time we receive the emojis.
    // If so, populate seenIds with current records but don't float or play them,
    // thereby avoiding sudden visual and audio spam of historic reactions on mount.
    if (isFirstLoadRef.current) {
      emojis.forEach((e) => {
        const uniqueId = e.id || `${e.playerId}_${e.timestamp}`;
        seenIdsRef.current.add(uniqueId);
      });
      isFirstLoadRef.current = false;
      return;
    }

    const newItems: FloatingItem[] = [];

    emojis.forEach((e) => {
      const uniqueId = e.id || `${e.playerId}_${e.timestamp}`;
      if (!seenIdsRef.current.has(uniqueId)) {
        seenIdsRef.current.add(uniqueId);
        
        // Generate a stable visual offset based on the uniqueId string
        const hash = uniqueId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const stableLeft = 10 + (hash % 80);

        newItems.push({
          id: uniqueId,
          emoji: e.emoji,
          sender: e.playerName,
          left: stableLeft
        });

        // Play the silly reaction synthesizer sound for this received emoji
        soundSynthesizer.playReactionSfx(e.emoji);
      }
    });

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems].slice(-15));
    }
  }, [emojis]);

  // Clean items after animation expires
  useEffect(() => {
    const timer = setInterval(() => {
      setItems((prev) => {
        if (prev.length === 0) return prev;
        return prev.slice(1);
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 top-1/3 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ y: "100vh", opacity: 0, scale: 0.5 }}
            animate={{
              y: "-10vh",
              opacity: [0, 1, 1, 0],
              scale: [0.6, 1.2, 1, 0.8],
              x: [0, Math.sin(parseFloat(item.id)) * 40, -Math.sin(parseFloat(item.id)) * 40, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.5, ease: "easeOut" }}
            style={{ left: `${item.left}%` }}
            className="absolute flex flex-col items-center pointer-events-none"
          >
            <span className="text-5xl drop-shadow-lg select-none">{item.emoji}</span>
            <span className="text-[10px] text-white px-1.5 py-0.5 rounded-full bg-slate-900/60 font-medium select-none transform -translate-y-1">
              {item.sender}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
