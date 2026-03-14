"use client";

import React, { useState, useEffect } from "react";
import Icon, { IC } from "@/components/ui/Icon";
import { G, GD, GL, GL2, GRAD, BG, CARD, SOFT, SH, BD, T1, T3 } from "@/lib/constants";

export default function AnalyzingScreen() {
  const [active, setActive] = useState(0);
  const [done, setDone] = useState<number[]>([]);

  const steps = [
    { icon: IC.building, label: "企業情報を分析中..." },
    { icon: IC.globe, label: "国の補助金（3,200件）をスキャン中..." },
    { icon: IC.map, label: "都道府県の制度を検索中..." },
    { icon: IC.city, label: "市区町村の制度を検索中..." },
    { icon: IC.shop, label: "商工会議所・公的機関を検索中..." },
    { icon: IC.zap, label: "あなたへの戦略を立案中..." },
  ];

  useEffect(() => {
    let i = 0;
    const t = () => {
      if (i < steps.length) {
        setActive(i);
        setDone((d) => [...d, i - 1].filter((x) => x >= 0));
        i++;
        setTimeout(t, 800);
      }
    };
    t();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: BG,
        padding: 40,
      }}
    >
      {/* レーダーアニメーション */}
      <div style={{ position: "relative", width: 140, height: 140, marginBottom: 40 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `2px solid ${G}`,
              animation: `pulseRing 2s ${i * 0.6}s ease-out infinite`,
              opacity: 0,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            inset: "20%",
            borderRadius: "50%",
            background: GRAD,
            boxShadow: `0 0 40px rgba(16,185,129,0.5)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "30%",
                background:
                  "linear-gradient(to bottom,transparent,rgba(255,255,255,.3),transparent)",
                animation: "scanLine 1.5s linear infinite",
              }}
            />
          </div>
          <Icon d={IC.radar} size={32} color="white" />
        </div>
        {[
          { t: "5%", l: "50%", d: "0s", s: 8 },
          { t: "50%", l: "95%", d: ".4s", s: 6 },
          { t: "90%", l: "60%", d: ".8s", s: 9 },
          { t: "60%", l: "2%", d: "1.2s", s: 5 },
          { t: "15%", l: "15%", d: ".6s", s: 7 },
        ].map((d, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: d.t,
              left: d.l,
              width: d.s,
              height: d.s,
              borderRadius: "50%",
              background: G,
              opacity: 0.7,
              animation: `floatDot 2s ${d.d} ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <div
        style={{
          fontSize: 20,
          fontWeight: 900,
          color: T1,
          letterSpacing: "-.04em",
          fontFamily: "Noto Sans JP,sans-serif",
          marginBottom: 6,
          textAlign: "center",
        }}
      >
        AIが補助金を<span style={{ color: G }}>分析中</span>
      </div>
      <div style={{ fontSize: 12, color: T3, marginBottom: 32, textAlign: "center" }}>
        国・都道府県・市区町村・商工会議所を横断検索しています
      </div>

      <div
        style={{
          background: CARD,
          borderRadius: 18,
          padding: "20px 28px",
          boxShadow: SH,
          width: "100%",
          maxWidth: 420,
        }}
      >
        {steps.map((s, i) => {
          const isDone = done.includes(i);
          const isActive = active === i;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 0",
                borderBottom: i < steps.length - 1 ? `1px solid ${BD}` : "none",
                opacity: i > active ? 0.3 : 1,
                transition: "opacity .4s",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: isDone ? G : isActive ? GL2 : SOFT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background .4s",
                }}
              >
                {isDone ? (
                  <Icon d={IC.check} size={16} color="white" style={{ strokeWidth: 3 }} />
                ) : isActive ? (
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: `2.5px solid ${GL}`,
                      borderTop: `2.5px solid ${G}`,
                      animation: "spin .7s linear infinite",
                    }}
                  />
                ) : (
                  <Icon d={s.icon} size={15} color={T3} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: isDone ? 600 : isActive ? 700 : 500,
                    color: isDone ? GD : isActive ? T1 : T3,
                    transition: "color .4s",
                  }}
                >
                  {s.label}
                </div>
                {isActive && (
                  <div
                    style={{
                      marginTop: 5,
                      height: 3,
                      borderRadius: 3,
                      background: GL,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        backgroundImage: `linear-gradient(90deg,${GL} 25%,${G} 50%,${GL} 75%)`,
                        backgroundSize: "400px 100%",
                        animation: "shimmer 1.2s linear infinite",
                      }}
                    />
                  </div>
                )}
              </div>
              {isDone && (
                <span style={{ fontSize: 10, color: GD, fontWeight: 700, flexShrink: 0 }}>
                  完了
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
