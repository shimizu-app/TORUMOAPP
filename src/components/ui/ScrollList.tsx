"use client";

import React from "react";
import Icon, { IC } from "./Icon";
import { GD, GL2, CARD, SOFT, BD, SH, T1 } from "@/lib/constants";
const G = "#10B981";

interface ScrollListProps {
  items: string[];
  value: string | undefined;
  onSelect: (val: string) => void;
  height?: number;
}

export default function ScrollList({ items, value, onSelect, height = 260 }: ScrollListProps) {
  return (
    <div
      style={{
        border: `2px solid ${BD}`,
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 22,
        background: CARD,
        boxShadow: SH,
      }}
    >
      <div style={{ height, overflowY: "auto" }}>
        {items.map((item) => {
          const sel = value === item;
          return (
            <div
              key={item}
              onClick={() => onSelect(item)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 18px",
                background: sel ? GL2 : "transparent",
                borderBottom: `1px solid ${BD}`,
                cursor: "pointer",
                transition: "background 0.12s",
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                if (!sel) (e.currentTarget as HTMLDivElement).style.background = SOFT;
              }}
              onMouseLeave={(e) => {
                if (!sel) (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }}
            >
              <span style={{ fontSize: 14, fontWeight: sel ? 700 : 500, color: sel ? GD : T1 }}>
                {item}
              </span>
              {sel && (
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: G,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "popIn .2s ease",
                    flexShrink: 0,
                  }}
                >
                  <Icon d={IC.check} size={11} color="#fff" style={{ strokeWidth: 3 }} />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
