"use client";

import React, { useState } from "react";
import Chip from "@/components/ui/Chip";
import ScrollList from "@/components/ui/ScrollList";
import RippleBtn from "@/components/ui/RippleBtn";
import { G, GRAD, GL, CARD, SOFT, SH, SHG, BD, T1, T3, BG } from "@/lib/constants";
import { QUESTIONS, PREFECTURES, CITIES, INDUSTRY_DETAIL } from "@/lib/data";
import type { Company } from "@/types";

interface ChoiceGridProps {
  opts: string[];
  val: string | undefined;
  onSel: (v: string) => void;
}

function ChoiceGrid({ opts, val, onSel }: ChoiceGridProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
      {opts.map((o) => (
        <Chip key={o} label={o} selected={val === o} onSelect={onSel} />
      ))}
    </div>
  );
}

interface IntakeProps {
  onDone: (answers: Company) => void;
}

export default function Intake({ onDone }: IntakeProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const q = QUESTIONS[step];
  const pct = Math.round(((step + 1) / QUESTIONS.length) * 100);
  const cur = answers[q.id] as string | string[] | undefined;
  const dynamicOpts = INDUSTRY_DETAIL[answers["industry"] as string] || INDUSTRY_DETAIL["その他"];
  const cityOpts = CITIES[answers["prefecture"] as string] || [];

  const setAns = (val: string | string[]) => setAnswers((a) => ({ ...a, [q.id]: val }));
  const toggleChip = (c: string) => {
    const chips = Array.isArray(cur) ? cur : [];
    setAns(chips.includes(c) ? chips.filter((x) => x !== c) : [...chips, c]);
  };
  const next = () =>
    step < QUESTIONS.length - 1 ? setStep((s) => s + 1) : onDone(answers as unknown as Company);

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        justifyContent: "center",
        padding: "28px 40px",
        background: BG,
      }}
    >
      <div
        style={{
          background: CARD,
          borderRadius: 24,
          padding: "36px 44px",
          boxShadow: SH,
          width: "100%",
          maxWidth: 680,
          alignSelf: "flex-start",
        }}
      >
        <div style={{ height: 4, background: GL, borderRadius: 4, marginBottom: 28 }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: GRAD,
              borderRadius: 4,
              transition: "width .4s ease",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: G,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            fontFamily: "Inter,sans-serif",
            marginBottom: 8,
          }}
        >
          Question {step + 1} / {QUESTIONS.length}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: "-.04em",
            color: T1,
            lineHeight: 1.15,
            fontFamily: "Noto Sans JP,sans-serif",
            marginBottom: 5,
          }}
        >
          {q.label}
        </div>
        <div style={{ fontSize: 13, color: T3, marginBottom: 22 }}>{q.sub}</div>

        {(q.type === "choice" || q.type === "choice_dynamic") && (
          <ChoiceGrid
            opts={q.type === "choice" ? q.opts! : dynamicOpts}
            val={cur as string}
            onSel={setAns}
          />
        )}
        {q.type === "scroll_list" && (
          <ScrollList
            items={PREFECTURES}
            value={cur as string}
            onSelect={(v) => {
              setAns(v);
              setAnswers((a) => ({ ...a, prefecture: v, city: undefined as unknown as string }));
            }}
          />
        )}
        {q.type === "scroll_city" &&
          (answers.prefecture ? (
            <ScrollList items={cityOpts} value={cur as string} onSelect={setAns} />
          ) : (
            <div
              style={{
                fontSize: 13,
                color: T3,
                marginBottom: 22,
                padding: "16px",
                background: SOFT,
                borderRadius: 12,
              }}
            >
              先に都道府県を選択してください
            </div>
          ))}
        {q.type === "chips" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
            {(q.opts || []).map((c) => (
              <Chip
                key={c}
                label={c}
                selected={Array.isArray(cur) && cur.includes(c)}
                onSelect={() => toggleChip(c)}
              />
            ))}
          </div>
        )}
        {q.type === "textarea" && (
          <textarea
            value={(cur as string) || ""}
            onChange={(e) => setAns(e.target.value)}
            rows={4}
            placeholder="例：老朽化した製造ラインの更新を検討中。省人化と品質向上を目指したい。"
            style={{
              width: "100%",
              background: SOFT,
              border: `2px solid ${BD}`,
              borderRadius: 13,
              padding: "13px 16px",
              fontSize: 14,
              color: T1,
              outline: "none",
              fontFamily: "inherit",
              resize: "none",
              marginBottom: 22,
            }}
          />
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => (step > 0 ? setStep((s) => s - 1) : null)}
            style={{
              background: "none",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              color: T3,
              cursor: step > 0 ? "pointer" : "default",
              fontFamily: "inherit",
              padding: 8,
              opacity: step > 0 ? 1 : 0.3,
            }}
          >
            ← 戻る
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={next}
              style={{
                background: "none",
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                color: T3,
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "underline",
              }}
            >
              スキップ
            </button>
            <RippleBtn
              onClick={next}
              style={{
                background: GRAD,
                color: "#fff",
                borderRadius: 13,
                height: 50,
                padding: "0 34px",
                fontSize: 15,
                fontWeight: 900,
                boxShadow: SHG,
                display: "inline-flex",
                alignItems: "center",
                transition: "transform .12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "";
              }}
            >
              {step === QUESTIONS.length - 1 ? "診断を始める →" : "次へ →"}
            </RippleBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
