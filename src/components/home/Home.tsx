"use client";

import React from "react";
import RippleBtn from "@/components/ui/RippleBtn";
import { G, GD, GRAD, CARD, GL2, T1, T2 } from "@/lib/constants";

interface HomeProps {
  setPage: (page: string) => void;
  loadDemo: () => void;
}

export default function Home({ setPage, loadDemo }: HomeProps) {
  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        padding: "0 56px",
        background: "#F5F9F5",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -10,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 200,
          fontWeight: 900,
          letterSpacing: "-.07em",
          color: "rgba(16,185,129,.05)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
          fontFamily: "Noto Sans JP,sans-serif",
          lineHeight: 1,
        }}
      >
        SUBSIDY
      </div>

      {/* グネグネ線 大（右上） */}
      <svg
        style={{
          position: "absolute",
          right: -80,
          top: -60,
          width: 560,
          height: 560,
          pointerEvents: "none",
          overflow: "visible",
        }}
        viewBox="0 0 560 560"
        fill="none"
      >
        <path
          d="M520 45 C490 -10,395 2,358 68 C321 134,415 196,368 270 C321 344,192 312,162 390 C132 468,228 528,180 570"
          stroke="#10B981"
          strokeWidth="52"
          strokeLinecap="round"
          opacity=".12"
        >
          <animate
            attributeName="d"
            dur="6s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            values="M520 45 C490 -10,395 2,358 68 C321 134,415 196,368 270 C321 344,192 312,162 390 C132 468,228 528,180 570;M520 65 C480 5,410 18,368 88 C326 158,408 210,355 288 C302 366,182 326,148 406 C114 486,224 542,172 580;M520 45 C490 -10,395 2,358 68 C321 134,415 196,368 270 C321 344,192 312,162 390 C132 468,228 528,180 570"
          />
        </path>
        <path
          d="M520 45 C490 -10,395 2,358 68 C321 134,415 196,368 270 C321 344,192 312,162 390 C132 468,228 528,180 570"
          stroke="#22C55E"
          strokeWidth="25"
          strokeLinecap="round"
          opacity=".72"
        >
          <animate
            attributeName="d"
            dur="6s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            values="M520 45 C490 -10,395 2,358 68 C321 134,415 196,368 270 C321 344,192 312,162 390 C132 468,228 528,180 570;M520 65 C480 5,410 18,368 88 C326 158,408 210,355 288 C302 366,182 326,148 406 C114 486,224 542,172 580;M520 45 C490 -10,395 2,358 68 C321 134,415 196,368 270 C321 344,192 312,162 390 C132 468,228 528,180 570"
          />
        </path>
      </svg>

      {/* グネグネ線 小（左下） */}
      <svg
        style={{
          position: "absolute",
          left: -45,
          bottom: -25,
          width: 260,
          height: 260,
          pointerEvents: "none",
          overflow: "visible",
        }}
        viewBox="0 0 260 260"
        fill="none"
      >
        <path
          d="M18 238 C54 202,35 140,88 112 C141 84,164 160,214 124 C264 88,248 22,274 4"
          stroke="#10B981"
          strokeWidth="26"
          strokeLinecap="round"
          opacity=".11"
        >
          <animate
            attributeName="d"
            dur="5s"
            begin="-2.5s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            values="M18 238 C54 202,35 140,88 112 C141 84,164 160,214 124 C264 88,248 22,274 4;M10 248 C50 208,28 148,82 118 C136 88,168 168,220 130 C272 92,252 28,280 8;M18 238 C54 202,35 140,88 112 C141 84,164 160,214 124 C264 88,248 22,274 4"
          />
        </path>
        <path
          d="M18 238 C54 202,35 140,88 112 C141 84,164 160,214 124 C264 88,248 22,274 4"
          stroke="#34D399"
          strokeWidth="13"
          strokeLinecap="round"
          opacity=".55"
        >
          <animate
            attributeName="d"
            dur="5s"
            begin="-2.5s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            values="M18 238 C54 202,35 140,88 112 C141 84,164 160,214 124 C264 88,248 22,274 4;M10 248 C50 208,28 148,82 118 C136 88,168 168,220 130 C272 92,252 28,280 8;M18 238 C54 202,35 140,88 112 C141 84,164 160,214 124 C264 88,248 22,274 4"
          />
        </path>
      </svg>

      <div
        style={{
          position: "absolute",
          right: 200,
          top: "22%",
          width: 78,
          height: 78,
          borderRadius: "50%",
          background: GRAD,
          opacity: 0.82,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 112,
          bottom: "20%",
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#34D399",
          opacity: 0.46,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 375,
          top: "13%",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#6EE7B7",
          opacity: 0.38,
        }}
      />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 620 }}>
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgb(18,130,55)",
              letterSpacing: ".2em",
              fontFamily: "Arial,sans-serif",
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            補助金AI
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
            <div
              style={{
                fontSize: 80,
                fontWeight: 900,
                color: "rgb(34,177,76)",
                fontFamily: "'M PLUS 1p', sans-serif",
                letterSpacing: "-.06em",
                lineHeight: 1,
              }}
            >
              トルモ
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 900,
                color: T1,
                lineHeight: 1.1,
                letterSpacing: "-.04em",
                fontFamily: "Noto Sans JP,sans-serif",
              }}
            >
              補助金を、<span style={{ color: G }}>かんたんに。</span>
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 14,
            color: T2,
            lineHeight: 1.85,
            maxWidth: 420,
            marginBottom: 28,
            fontWeight: 400,
          }}
        >
          業種と規模を入力するだけで、国・都道府県・市区町村・商工会議所の補助金を横断検索。申請書の下書きまで、AIがまるごとサポートします。
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <RippleBtn
            onClick={() => setPage("intake")}
            style={{
              background: GRAD,
              color: "#fff",
              borderRadius: 16,
              height: 62,
              padding: "0 50px",
              fontSize: 17,
              fontWeight: 900,
              letterSpacing: "-.02em",
              boxShadow: "0 12px 32px rgba(16,185,129,.35)",
              display: "inline-flex",
              alignItems: "center",
              transition: "transform .12s,box-shadow .12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 16px 36px rgba(16,185,129,.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 12px 32px rgba(16,185,129,.35)";
            }}
          >
            診断を始める →
          </RippleBtn>
          <RippleBtn
            onClick={loadDemo}
            style={{
              background: CARD,
              color: GD,
              border: `1.5px solid ${G}`,
              borderRadius: 16,
              height: 62,
              padding: "0 32px",
              fontSize: 15,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "transform .12s,background .12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLDivElement).style.background = GL2;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "";
              (e.currentTarget as HTMLDivElement).style.background = CARD;
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              fill="none"
              stroke={GD}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            デモを見る
          </RippleBtn>
        </div>
      </div>
    </div>
  );
}
