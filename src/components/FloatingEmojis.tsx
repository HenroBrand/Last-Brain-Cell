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
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (emojis.length === 0) return;

    const now = Date.now();
    const newItems: FloatingItem[] = [];
    const nextSeen = new Set(seenIds);

    emojis.forEach((e) => {
      // If we haven't seen this reaction ID and it's reasonably fresh
      const uniqueId = e.id || `${e.playerId}_${e.timestamp}`;
      if (!nextSeen.has(uniqueId) && now - e.timestamp < 3500) {
        nextSeen.add(uniqueId);
        
        // Generate a stable visual offset based on the timestamp or ID string so it doesn't reposition on repaint
        const hash = uniqueId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const stableLeft = 10 + (hash % 80);

        newItems.push({
          id: uniqueId,
          emoji: e.emoji,
          sender: e.playerName,
          left: stableLeft
        });
      }
    });

    if (newItems.length > 0) {
      setSeenIds(nextSeen);
      setItems((prev) => [...prev, ...newItems].slice(-15));
    }
  }, [emojis, seenIds]);

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
