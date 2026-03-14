"use client";

import React from "react";
import RippleBtn from "@/components/ui/RippleBtn";
import { BG, CARD, SH, T1, T2 } from "@/lib/constants";

interface NavProps {
  page: string;
  setPage: (page: string) => void;
  showFull: boolean;
}

export default function Nav({ page, setPage, showFull }: NavProps) {
  return (
    <nav
      style={{
        flexShrink: 0,
        height: 68,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 48px",
        background: BG,
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        onClick={() => setPage("home")}
        style={{ cursor: "pointer", display: "flex", flexDirection: "column", lineHeight: 1 }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "rgb(18,130,55)",
            letterSpacing: ".12em",
            fontFamily: "Arial,sans-serif",
            marginBottom: 1,
          }}
        >
          補助金AI
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "rgb(34,177,76)",
            fontFamily: "'M PLUS 1p', sans-serif",
            letterSpacing: "-.05em",
          }}
        >
          トルモ
        </div>
      </div>
      {showFull && (
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {[
            { id: "home", label: "ホーム" },
            { id: "intake", label: "診断" },
            { id: "list", label: "制度一覧" },
            { id: "db", label: "申請ダッシュボード" },
          ].map((p) => (
            <RippleBtn
              key={p.id}
              onClick={() => setPage(p.id)}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: page === p.id ? 700 : 500,
                color: page === p.id ? T1 : T2,
                background: page === p.id ? CARD : "transparent",
                boxShadow: page === p.id ? SH : "none",
                transition: "background .12s",
              }}
            >
              {p.label}
            </RippleBtn>
          ))}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "#D1FAE5",
              color: "#059669",
              fontWeight: 700,
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 8,
            }}
          >
            山田
          </div>
        </div>
      )}
    </nav>
  );
}
