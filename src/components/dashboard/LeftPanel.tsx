"use client";

import { useState } from "react";
import Icon, { IC } from "@/components/ui/Icon";
import RippleBtn from "@/components/ui/RippleBtn";
import { G, GD, GL, GL2, GRAD, CARD, SOFT, SH, SHG, BD, T1, T2, T3, ORG, ORGL, ORGD } from "@/lib/constants";
import type { Subsidy, Company, Section } from "@/types";

interface Props {
  selected: Subsidy;
  company: Company;
  wizAnswers: Record<string, string>;
  setWizAnswers: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  selectedNI: number;
  setSelectedNI: (i: number) => void;
  drafts: Record<string, string>;
  sections: Section[];
  onGenerate: (sec: Section) => void;
  onGenerateAll: () => void;
  onHint: (secId: string, label: string, sub: string) => void;
  wizLoading: boolean;
  formFileRef: React.RefObject<HTMLInputElement>;
  onFormFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  extracting: boolean;
  extractedSections: any[] | null;
  setExtractedSections: (v: any[] | null) => void;
}

export default function LeftPanel({
  selected, company, wizAnswers, setWizAnswers, selectedNI, setSelectedNI,
  drafts, sections, onGenerate, onGenerateAll, onHint, wizLoading,
  formFileRef, onFormFileChange, extracting, extractedSections, setExtractedSections,
}: Props) {
  const [leftTab, setLeftTab] = useState<"info" | "detail" | "wizard">("info");

  const tabSty = (id: string) => ({
    padding: "7px 14px", borderRadius: 999, border: "none",
    background: leftTab === id ? G : "transparent",
    color: leftTab === id ? "#fff" : T2,
    fontSize: 12, fontWeight: leftTab === id ? 700 : 500,
    cursor: "pointer" as const, fontFamily: "inherit", transition: "all .12s", whiteSpace: "nowrap" as const,
  });

  const wizSections = extractedSections || sections;

  return (
    <div>
      {/* ヒーロー */}
      <div style={{ background: GRAD, borderRadius: 18, padding: "22px 26px", marginBottom: 12, boxShadow: SHG, position: "relative", overflow: "hidden" }}>
        <svg style={{ position: "absolute", right: -25, top: -25, opacity: .14, pointerEvents: "none" }} width={160} height={160} viewBox="0 0 160 160" fill="none">
          <path d="M145 11 C133 -7,100 2,84 31 C68 60,104 84,87 112 C70 140,37 134,24 150" stroke="white" strokeWidth="22" strokeLinecap="round"/>
        </svg>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.6)", letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 5 }}>
          Matching — {selected.name}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginBottom: 3 }}>獲得見込み額</div>
        <div style={{ fontSize: 38, fontWeight: 900, color: "#fff", letterSpacing: "-.05em", lineHeight: 1, fontFamily: "Inter,sans-serif" }}>{selected.maxAmount}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginTop: 3 }}>補助率 {selected.rate}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          <span style={{ background: "rgba(255,255,255,.18)", color: "#fff", borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 600 }}>補助率 {selected.rate}</span>
          <span style={{ background: selected.deadline <= 45 ? ORG : "rgba(255,255,255,.18)", color: "#fff", borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>残り {selected.deadline}日</span>
        </div>
      </div>

      {/* タブ */}
      <div style={{ display: "flex", gap: 2, marginBottom: 12, background: SOFT, borderRadius: 999, padding: 4 }}>
        <button style={tabSty("info")} onClick={() => setLeftTab("info")}>概要・戦略</button>
        <button style={tabSty("detail")} onClick={() => setLeftTab("detail")}>詳細・審査ポイント</button>
        <button style={tabSty("wizard")} onClick={() => setLeftTab("wizard")}>
          申請ウィザード
          {Object.keys(wizAnswers).length > 0 && (
            <span style={{ marginLeft: 5, background: "rgba(255,255,255,.35)", borderRadius: 999, padding: "1px 6px", fontSize: 10 }}>
              {Object.keys(wizAnswers).length}
            </span>
          )}
        </button>
      </div>

      {/* ─── タブ1: 概要・戦略 ─── */}
      {leftTab === "info" && (
        <>
          {/* 政策背景 */}
          {selected.policyBackground && (
            <div style={{ background: CARD, borderRadius: 16, padding: 18, boxShadow: SH, marginBottom: 11 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#7C3AED", letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>Policy Background</div>
              <div style={{ fontSize: 12, color: "#4C1D95", lineHeight: 1.75, padding: "10px 12px", background: "#F5F3FF", borderRadius: 10, borderLeft: "3px solid #7C3AED" }}>
                {selected.policyBackground}
              </div>
            </div>
          )}

          {selected.summary && (
            <div style={{ background: CARD, borderRadius: 16, padding: 18, boxShadow: SH, marginBottom: 11 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: G, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 7 }}>Overview</div>
              <div style={{ fontSize: 13, color: T2, lineHeight: 1.75 }}>{selected.summary}</div>
            </div>
          )}

          {/* AI戦略 + 申請名目 */}
          <div style={{ background: CARD, borderRadius: 16, padding: 18, boxShadow: SH, marginBottom: 11 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: G, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 7 }}>AI Strategy</div>
            <div style={{ fontSize: 13, color: T2, lineHeight: 1.75, marginBottom: 14 }}>{selected.strategy}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#7C3AED", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 8 }}>申請名目の候補 — クリックして選択</div>
            {(selected.nameIdeas || []).map((ni, idx) => (
              <div key={idx} onClick={() => setSelectedNI(idx)} style={{ marginBottom: 8, padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${selectedNI === idx ? "#7C3AED" : BD}`, background: selectedNI === idx ? "#F5F3FF" : SOFT, cursor: "pointer", transition: "all .12s" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: ni.detail ? 8 : 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: idx === 0 ? "#7C3AED" : idx === 1 ? G : ORG, color: "#fff", flexShrink: 0, marginTop: 2 }}>{ni.label}</span>
                  <div style={{ flex: 1, fontSize: 12, color: selectedNI === idx ? "#4C1D95" : T1, lineHeight: 1.5, fontWeight: selectedNI === idx ? 700 : 500 }}>{ni.text}</div>
                  {selectedNI === idx && (
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon d={IC.check} size={9} color="#fff" style={{ strokeWidth: 3 }} />
                    </div>
                  )}
                </div>
                {ni.detail && (
                  <div style={{ fontSize: 11, color: selectedNI === idx ? "#5B21B6" : T2, lineHeight: 1.65, padding: "8px 10px", background: selectedNI === idx ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.5)", borderRadius: 8, borderLeft: `2px solid ${selectedNI === idx ? "#7C3AED" : BD}` }}>
                    {ni.detail}
                  </div>
                )}
              </div>
            ))}

            {/* 採択率アップの裏ポイント */}
            {(selected.hiddenPoints || []).length > 0 && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#FFFBEB", borderRadius: 10, border: "1px solid #FCD34D" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#92400E", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>採択率アップの裏ポイント</div>
                {(selected.hiddenPoints || []).map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: i < (selected.hiddenPoints || []).length - 1 ? 5 : 0 }}>
                    <span style={{ fontSize: 11, color: "#D97706", flexShrink: 0, marginTop: 1 }}>★</span>
                    <span style={{ fontSize: 11, color: "#78350F", lineHeight: 1.6 }}>{p}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 12 }}>
              {(selected.tags || []).map(t => (
                <span key={t} style={{ background: GL2, color: GD, border: "1px solid #A7F3D0", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div style={{ background: CARD, borderRadius: 16, padding: 18, boxShadow: SH }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: G, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 7 }}>Basic Info</div>
            {([
              ["対象経費", selected.expense || "機械装置・システム構築費"],
              ["申請要件", selected.eligible || "中小企業・小規模事業者"],
              ["公募機関", selected.org],
              ["申請難易度", selected.difficulty || "中"],
              ["採択見込み", `${selected.score}%`],
            ] as [string, string][]).map(([k, v], i, arr) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BD}` : "none", fontSize: 13 }}>
                <span style={{ fontSize: 11, color: T3 }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            {selected.url && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${BD}` }}>
                <a href={selected.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: G, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon d={IC.link} size={12} color={G} />公式サイトを開く
                </a>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── タブ2: 詳細・審査ポイント ─── */}
      {leftTab === "detail" && (
        <>
          {/* 審査ポイント */}
          <div style={{ background: CARD, borderRadius: 16, padding: 18, boxShadow: SH, marginBottom: 11 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: G, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 10 }}>審査で重視されるポイント</div>
            {(selected.reviewPoints || [
              { num: "01", label: "革新性・新規性", desc: "既存技術との差異を数値で示す。「業界初」「従来比◯倍」などの定量表現が必須。", weight: "高" as const },
              { num: "02", label: "実現可能性", desc: "実施体制・スケジュール・資金計画の三つが整合していること。", weight: "高" as const },
              { num: "03", label: "収益計画・投資対効果", desc: "補助金額に対して何倍の経済効果か。投資回収期間を具体的に記載。", weight: "高" as const },
              { num: "04", label: "政策との整合性", desc: "DX・GX・賃上げなど国の重点テーマとの接続を冒頭で宣言する。", weight: "中" as const },
              { num: "05", label: "財務健全性", desc: "補助金なしでも一部自己負担できる資金体力を示す。", weight: "中" as const },
            ]).map((p, i, arr) => (
              <div key={p.num} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BD}` : "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: GL2, color: GD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{p.num}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T1 }}>{p.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: p.weight === "高" ? GL2 : ORGL, color: p.weight === "高" ? GD : ORGD }}>{p.weight}配点</span>
                  </div>
                  <div style={{ fontSize: 12, color: T2, lineHeight: 1.65 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 不採択理由 */}
          <div style={{ background: CARD, borderRadius: 16, padding: 18, boxShadow: SH, marginBottom: 11 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: ORGD, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 10 }}>よくある不採択理由</div>
            {(selected.rejectionReasons || [
              { reason: "革新性の説明が抽象的", detail: "「新しい」だけでなく既存技術と何が違うのかを数値で示すこと。" },
              { reason: "資金計画と事業計画の数字が合っていない", detail: "補助金+自己資金の合計が設備費と一致しているか確認すること。" },
              { reason: "政策テーマとの関連付けが弱い", detail: "事業の核心にDX・GXが位置づけられているストーリーが必要。" },
            ]).map((r, i, arr) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BD}` : "none" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: r.detail ? 4 : 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: ORGL, color: ORGD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>!</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T1 }}>{r.reason}</div>
                </div>
                {r.detail && <div style={{ fontSize: 11, color: T2, lineHeight: 1.6, paddingLeft: 27 }}>{r.detail}</div>}
              </div>
            ))}
          </div>

          {/* 採択パターン */}
          <div style={{ background: CARD, borderRadius: 16, padding: 18, boxShadow: SH }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: G, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 10 }}>採択されやすいパターン（事例）</div>
            {(selected.adoptionPatterns || [
              { tag: "DX×製造", example: "IoT・AI活用による生産ラインの自動化で採択率が高いパターン。", applicability: "" },
            ]).map((p, i, arr) => (
              <div key={p.tag} style={{ padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BD}` : "none" }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: GL2, color: GD, marginBottom: 6, display: "inline-block" }}>{p.tag}</span>
                <div style={{ fontSize: 12, color: T2, lineHeight: 1.65, marginBottom: p.applicability ? 6 : 0 }}>{p.example}</div>
                {p.applicability && (
                  <div style={{ fontSize: 11, color: GD, fontWeight: 600, padding: "5px 10px", background: GL2, borderRadius: 8 }}>あなたへの適用度: {p.applicability}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── タブ3: 申請ウィザード ─── */}
      {leftTab === "wizard" && (
        <div style={{ background: CARD, borderRadius: 16, padding: 18, boxShadow: SH }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#7C3AED", letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 4 }}>Application Wizard</div>
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-.04em", marginBottom: 4, fontFamily: "Noto Sans JP,sans-serif" }}>申請書を<span style={{ color: "#7C3AED" }}>Q&A形式</span>で補強</div>
          <div style={{ fontSize: 11, color: T2, lineHeight: 1.65, marginBottom: 14 }}>入力内容が申請書の生成に直接反映されます。数字・具体的な事実を入力すると生成精度が上がります。</div>

          {/* ファイルアップロード */}
          <div style={{ background: "#F5F3FF", borderRadius: 12, padding: "12px 14px", marginBottom: 14, border: "1.5px dashed #C4B5FD" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", marginBottom: 4 }}>公式申請書をアップロードして項目を自動抽出</div>
            <div style={{ fontSize: 11, color: T2, marginBottom: 8, lineHeight: 1.55 }}>公式サイトからWord/PDFをDLしてアップロードすると、審査項目を自動で読み取ります。</div>
            {selected.url && (
              <a href={selected.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#7C3AED", fontWeight: 600, textDecoration: "none", marginBottom: 8, padding: "5px 10px", background: "rgba(124,58,237,.08)", borderRadius: 8 }}>
                <Icon d={IC.link} size={12} color="#7C3AED" />
                公式サイトで申請書様式をDLする
              </a>
            )}
            <div>
              <input ref={formFileRef} type="file" accept=".txt,.csv,.docx,.pdf" onChange={onFormFileChange} style={{ display: "none" }}/>
              <RippleBtn onClick={() => formFileRef.current?.click()} style={{ background: "#7C3AED", color: "#fff", borderRadius: 10, height: 36, padding: "0 16px", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {extracting ? "抽出中..." : "ファイルをアップロード"}
              </RippleBtn>
            </div>
          </div>

          {/* 抽出済みの場合のリセットリンク */}
          {extractedSections && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: GD, fontWeight: 600 }}>
                {extractedSections.length}項目を抽出しました
              </div>
              <button onClick={() => setExtractedSections(null)} style={{ background: "none", border: "none", fontSize: 11, color: T3, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
                別のファイルを使う
              </button>
            </div>
          )}

          {/* ウィザード連携状態 */}
          {Object.keys(wizAnswers).length > 0 && (
            <div style={{ marginBottom: 12, padding: "7px 11px", background: GL2, borderRadius: 9, border: `1px solid ${G}`, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 11, color: GD, fontWeight: 700 }}>✓</span>
              <span style={{ fontSize: 11, color: GD }}>回答 {Object.keys(wizAnswers).length}件が申請書生成に反映されます</span>
            </div>
          )}

          {/* プログレス */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: T3, flexShrink: 0 }}>{Object.keys(wizAnswers).length} / {wizSections.length} 入力済み</span>
            <div style={{ flex: 1, height: 4, background: GL, borderRadius: 4 }}>
              <div style={{ height: "100%", width: `${(Object.keys(wizAnswers).length / wizSections.length) * 100}%`, background: GRAD, borderRadius: 4, transition: "width .4s" }}/>
            </div>
          </div>

          {/* Q&Aフォーム */}
          {wizSections.map((sec: any, idx: number) => (
            <div key={sec.id} style={{ marginBottom: 10, padding: "12px 14px", borderRadius: 13, border: `1.5px solid ${wizAnswers[sec.id] ? G : BD}`, background: wizAnswers[sec.id] ? GL2 : SOFT, transition: "all .12s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: wizAnswers[sec.id] ? G : GL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s" }}>
                  {wizAnswers[sec.id]
                    ? <Icon d={IC.check} size={11} color="#fff" style={{ strokeWidth: 3 }} />
                    : <span style={{ fontSize: 10, fontWeight: 700, color: GD }}>{idx + 1}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: wizAnswers[sec.id] ? GD : T1 }}>{sec.label}</div>
                  <div style={{ fontSize: 10, color: T3 }}>{sec.sub}</div>
                </div>
                {drafts[sec.id] && <span style={{ fontSize: 9, background: GL, color: GD, borderRadius: 999, padding: "2px 8px", fontWeight: 700, flexShrink: 0 }}>生成済み</span>}
              </div>

              {/* ヒント表示 */}
              {sec.hint && (
                <div style={{ fontSize: 11, color: "#7C3AED", marginBottom: 7, padding: "5px 9px", background: "#F5F3FF", borderRadius: 7 }}>
                  {sec.hint}
                </div>
              )}

              <textarea
                value={wizAnswers[sec.id] || ""}
                onChange={e => setWizAnswers(a => ({ ...a, [sec.id]: e.target.value }))}
                placeholder={`${sec.label}について具体的な数字・事実を入力してください。（例：現在の不良率3.2%・週40時間の管理工数など）`}
                rows={3}
                style={{ width: "100%", background: wizAnswers[sec.id] ? "rgba(255,255,255,.7)" : CARD, border: `1.5px solid ${wizAnswers[sec.id] ? G : BD}`, borderRadius: 10, padding: "9px 12px", fontSize: 12, color: T1, outline: "none", fontFamily: "inherit", resize: "none", transition: "border-color .12s", lineHeight: 1.65 }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                <button onClick={() => onHint(sec.id, sec.label, sec.sub)}
                  style={{ background: "none", border: `1px solid ${G}`, borderRadius: 8, padding: "4px 12px", fontSize: 11, color: GD, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                  {wizLoading ? "生成中..." : "AIにヒントをもらう →"}
                </button>
                {wizAnswers[sec.id] && (
                  <button onClick={() => onGenerate(sec)}
                    style={{ background: G, border: "none", borderRadius: 8, padding: "4px 12px", fontSize: 11, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                    この項目を今すぐ生成 →
                  </button>
                )}
              </div>
            </div>
          ))}

          <RippleBtn onClick={onGenerateAll}
            style={{ background: GRAD, color: "#fff", borderRadius: 13, height: 46, padding: "0 24px", fontSize: 14, fontWeight: 900, boxShadow: SHG, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, width: "100%" }}>
            <Icon d={IC.zap} size={15} color="#fff" />
            入力内容をもとに全セクション一括生成
          </RippleBtn>
        </div>
      )}
    </div>
  );
}
