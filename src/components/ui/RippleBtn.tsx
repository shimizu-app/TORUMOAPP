"use client";

import React, { useState, useRef } from "react";

interface RippleBtnProps {
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export default function RippleBtn({ onClick, children, style: s = {}, onMouseEnter, onMouseLeave }: RippleBtnProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const handle = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2.2;
    const id = Date.now();
    setRipples((r) => [...r, { id, x, y, size }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 550);
    onClick && onClick(e);
  };

  return (
    <div
      ref={ref}
      onClick={handle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ position: "relative", overflow: "hidden", cursor: "pointer", ...s }}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{
            position: "absolute",
            borderRadius: "50%",
            background: "rgba(16,185,129,0.22)",
            width: r.size,
            height: r.size,
            left: r.x - r.size / 2,
            top: r.y - r.size / 2,
            animation: "rw 0.55s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      ))}
      {children}
    </div>
  );
}
