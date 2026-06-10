/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EmojiBroadcast } from "../types.js";

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

  useEffect(() => {
    if (emojis.length === 0) return;

    // Map new incoming emojis only
    const now = Date.now();
    const active = emojis
      .filter(e => now - e.timestamp < 3500)
      .map(e => ({
        id: `${e.playerId}_${e.timestamp}_${Math.random()}`,
        emoji: e.emoji,
        sender: e.playerName,
        left: 10 + Math.random() * 80 // Random horizontal percentage
      }));

    // Consolidate list and keep maximum 15 on screen to avoid performance stutter
    setItems((prev) => {
      const merged = [...prev, ...active];
      // Filter out duplicates
      const unique = merged.filter((item, index, self) =>
        self.findIndex(t => t.id === item.id) === index
      );
      return unique.slice(-15);
    });
  }, [emojis]);

  // Clean items after animation expires
  useEffect(() => {
    const timer = setInterval(() => {
      setItems((prev) => prev.slice(1));
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
