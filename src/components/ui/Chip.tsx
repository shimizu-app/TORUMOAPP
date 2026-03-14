"use client";

import React, { useState, useRef } from "react";
import Icon, { IC } from "./Icon";
import { G, GD, GL2, CARD, BD } from "@/lib/constants";

interface ChipProps {
  label: string;
  selected: boolean;
  onSelect: (label: string) => void;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export default function Chip({ label, selected, onSelect }: ChipProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const handle = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;
    const id = Date.now();
    setRipples((r) => [...r, { id, x, y, size }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 500);
    onSelect(label);
  };

  return (
    <div
      ref={ref}
      onClick={handle}
      style={{
        position: "relative",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        padding: "10px 18px",
        borderRadius: 13,
        border: `2px solid ${selected ? G : BD}`,
        background: selected ? GL2 : CARD,
        fontSize: 13,
        fontWeight: 700,
        color: selected ? GD : "#475569",
        cursor: "pointer",
        boxShadow: selected ? `0 0 0 4px rgba(16,185,129,0.15)` : "",
        transition: "all 0.15s",
        userSelect: "none",
      }}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{
            position: "absolute",
            borderRadius: "50%",
            background: "rgba(16,185,129,0.2)",
            width: r.size,
            height: r.size,
            left: r.x - r.size / 2,
            top: r.y - r.size / 2,
            animation: "rw 0.5s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      ))}
      {selected && (
        <span
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            width: 15,
            height: 15,
            borderRadius: "50%",
            background: G,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "popIn 0.2s ease",
          }}
        >
          <Icon d={IC.check} size={9} color="#fff" style={{ strokeWidth: 3 }} />
        </span>
      )}
      {label}
    </div>
  );
}
