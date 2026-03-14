"use client";

import React, { useState } from "react";
import RippleBtn from "@/components/ui/RippleBtn";
import Icon, { IC } from "@/components/ui/Icon";
import { G, GD, GL, GL2, GRAD, CARD, SH, BD, T1, T2, T3, ORG, ORGL, ORGD } from "@/lib/constants";
import type { Subsidy, SubsidiesByLayer } from "@/types";

interface ListProps {
  subsidiesByLayer: SubsidiesByLayer;
  setPage: (page: string) => void;
  setSelected: (s: Subsidy) => void;
}

export default function List({ subsidiesByLayer, setPage, setSelected }: ListProps) {
  const [tab, setTab] = useState("national");
  const [sort, setSort] = useState("score");

  const TABS = [
    { id: "national", label: "国", icon: IC.globe },
    { id: "prefecture", label: "都道府県", icon: IC.map },
    { id: "city", label: "市区町村", icon: IC.city },
    { id: "chamber", label: "商工会議所", icon: IC.shop },
    { id: "other", label: "公的機関", icon: IC.lab },
  ];

  const lc: Record<string, string> = { national: "#EFF6FF", prefecture: GL2, city: "#FFF7ED", chamber: "#F5F3FF", other: "#F0FDF4" };
  const lt: Record<string, string> = { national: "#1D4ED8", prefecture: GD, city: ORGD, chamber: "#7C3AED", other: GD };
  const ll: Record<string, string> = { national: "国", prefecture: "県", city: "市", chamber: "商工会", other: "公的機関" };

  const current = (subsidiesByLayer[tab as keyof SubsidiesByLayer] || [])
    .slice()
    .sort((a, b) => (sort === "score" ? b.score - a.score : a.deadline - b.deadline));
  const total = Object.values(subsidiesByLayer).flat().length;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 40px 40px" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: G, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 8 }}>Matched Results</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: T1, letterSpacing: "-.04em", lineHeight: 1.15, marginBottom: 6, fontFamily: "Noto Sans JP,sans-serif" }}>
          あなたへの<span style={{ color: G }}>おすすめ制度</span>
        </div>
        <div style={{ fontSize: 11, color: T3, fontWeight: 500 }}>5層横断検索 合計 {total}件マッチ</div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {TABS.map((t) => {
          const count = (subsidiesByLayer[t.id as keyof SubsidiesByLayer] || []).length;
          const isOn = tab === t.id;
          return (
            <RippleBtn key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 13, border: `2px solid ${isOn ? G : BD}`, background: isOn ? GL2 : CARD, boxShadow: isOn ? `0 0 0 3px rgba(16,185,129,.1),${SH}` : "none", transition: "all .15s" }}>
              <Icon d={t.icon} size={15} color={isOn ? GD : T3} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: isOn ? GD : T2 }}>{t.label}</div>
                <div style={{ fontSize: 10, color: isOn ? G : T3, fontWeight: 500 }}>{count}件</div>
              </div>
            </RippleBtn>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {([["score", "採択率順"], ["deadline", "締切順"]] as const).map(([v, l]) => (
            <RippleBtn key={v} onClick={() => setSort(v)} style={{ padding: "6px 12px", borderRadius: 999, border: `1.5px solid ${sort === v ? G : BD}`, background: sort === v ? G : CARD, color: sort === v ? "#fff" : T2, fontSize: 11, fontWeight: 600, transition: "all .12s" }}>{l}</RippleBtn>
          ))}
        </div>
      </div>

      {current.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: T3 }}>
          <Icon d={IC.building} size={36} color={BD} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, marginBottom: 6 }}>このカテゴリの制度は見つかりませんでした</div>
          <div style={{ fontSize: 12 }}>他のタブを確認するか、診断をやり直してください</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {current.map((s, i) => (
          <RippleBtn
            key={i}
            onClick={() => { setSelected(s); setPage("db"); }}
            style={{ background: CARD, borderRadius: 18, padding: 18, boxShadow: SH, border: "1.5px solid transparent", transition: "border-color .15s,transform .12s,box-shadow .15s" }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = G; el.style.transform = "translateY(-3px)"; el.style.boxShadow = "0 16px 40px rgba(15,23,42,.1)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "transparent"; el.style.transform = ""; el.style.boxShadow = SH; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, background: lc[tab], color: lt[tab], borderRadius: 7, padding: "2px 9px", fontWeight: 700 }}>{ll[tab]}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600, background: s.status === "高" ? GL2 : "#F1F5F9", color: s.status === "高" ? GD : T2 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.status === "高" ? G : "#CBD5E1", display: "inline-block" }} />採択可能性 {s.status}
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T1, letterSpacing: "-.02em", marginBottom: 2 }}>{s.name}</div>
            <div style={{ fontSize: 11, color: T3, marginBottom: 8 }}>{s.org}</div>
            {s.summary && <div style={{ fontSize: 12, color: T2, lineHeight: 1.6, marginBottom: 10, padding: "8px 10px", background: "#F8FAFC", borderRadius: 8, borderLeft: `3px solid ${G}` }}>{s.summary}</div>}
            <div style={{ fontSize: 26, fontWeight: 900, color: G, letterSpacing: "-.05em", lineHeight: 1, fontFamily: "Inter,sans-serif" }}>{s.maxAmount}</div>
            <div style={{ display: "flex", gap: 5, margin: "7px 0 10px", flexWrap: "wrap" }}>
              <span style={{ background: "#F1F5F9", color: T2, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>補助率 {s.rate}</span>
              <span style={{ background: s.deadline <= 45 ? ORGL : "#F1F5F9", color: s.deadline <= 45 ? ORGD : T2, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>残り {s.deadline}日</span>
            </div>
            <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "10px 12px", border: "1px solid #BBF7D0", marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: G, letterSpacing: ".12em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 4 }}>Strategy</div>
              <div style={{ fontSize: 12, color: T2, lineHeight: 1.55 }}>{s.strategy}</div>
            </div>
            {s.nameIdeas && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#7C3AED", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 5 }}>申請名目の候補</div>
                {s.nameIdeas.map((ni, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: idx === 0 ? "#7C3AED" : idx === 1 ? G : ORG, color: "#fff", flexShrink: 0, marginTop: 2 }}>{ni.label}</span>
                    <span style={{ fontSize: 11, color: T2, lineHeight: 1.45 }}>{ni.text}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: T3 }}>採択見込み</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.score >= 70 ? G : T3 }}>{s.score}%</span>
            </div>
            <div style={{ height: 4, background: GL, borderRadius: 4 }}>
              <div style={{ height: "100%", width: `${s.score}%`, background: s.score >= 60 ? GRAD : "linear-gradient(90deg,#CBD5E1,#E2E8F0)", borderRadius: 4 }} />
            </div>
          </RippleBtn>
        ))}
      </div>
    </div>
  );
}
