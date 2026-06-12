/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";
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
  top: number;
}

export default function FloatingEmojis({ emojis }: FloatingEmojisProps) {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const mountTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (emojis.length === 0) return;

    const newItems: FloatingItem[] = [];

    emojis.forEach((e) => {
      const uniqueId = e.id || `${e.playerId}_${e.timestamp}`;
      // Ignore reactions that were sent long before this player mounted the screen
      const isPostMount = e.timestamp > mountTimeRef.current - 1200;

      if (!seenIdsRef.current.has(uniqueId) && isPostMount) {
        seenIdsRef.current.add(uniqueId);
        
        // Generate stable visual offset if remote coordinates of sender are missing
        const hash = uniqueId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const stableLeft = typeof e.x === "number" ? e.x : (10 + (hash % 80));
        const stableTop = typeof e.y === "number" ? e.y : (30 + (hash % 50));

        newItems.push({
          id: uniqueId,
          emoji: e.emoji,
          sender: e.playerName,
          left: stableLeft,
          top: stableTop
        });

        // Auto-remove this specific item after 3.2 seconds when its visual animation is complete
        setTimeout(() => {
          setItems((prev) => prev.filter((item) => item.id !== uniqueId));
        }, 3200);
      }
    });

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  }, [emojis]);

  // Clean elements list
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden w-screen h-screen">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ y: 20, opacity: 0, scale: 0.6 }}
            animate={{
              y: -50,
              opacity: [0, 1, 1, 0.7, 0],
              scale: [0.8, 1.25, 1, 0.9],
              x: [0, Math.sin(item.left) * 15, -Math.sin(item.left) * 15]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.0, ease: "easeOut" }}
            style={{ left: `${item.left}%`, top: `${item.top}%` }}
            className="absolute flex flex-col items-center pointer-events-none"
          >
            <div className="flex flex-col items-center gap-0.5 pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]">
              <span className="text-3xl select-none leading-none">{item.emoji}</span>
              <span className="text-[8px] text-white px-1 py-0.2 rounded bg-black/75 font-black tracking-wide uppercase select-none leading-none">
                {item.sender}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
