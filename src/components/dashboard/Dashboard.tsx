"use client";

import React, { useState, useEffect, useRef } from "react";
import Icon, { IC } from "@/components/ui/Icon";
import RippleBtn from "@/components/ui/RippleBtn";
import LeftPanel from "@/components/dashboard/LeftPanel";
import { G, GD, GL, GL2, GRAD, CARD, SOFT, SH, SHG, BD, T1, T2, T3, ORG, ORGL, ORGD } from "@/lib/constants";
import { DEFAULT_SECTIONS } from "@/lib/data";
import type { Subsidy, Company, ChatMessage, Section } from "@/types";

interface DashboardProps {
  selected: Subsidy | null;
  company: Company;
}

async function callClaudeClient(system: string, user: string): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, userMessage: user }),
    });
    const data = await res.json();
    return data.text || "";
  } catch (e) {
    console.error(e);
    return "";
  }
}

function renderText(text: string, role: string) {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    if (line.startsWith("## ")) {
      return <div key={li} style={{ fontSize: 13, fontWeight: 700, color: role === "user" ? "#fff" : "#0F172A", marginTop: li > 0 ? 10 : 0, marginBottom: 3 }}>{line.replace(/^## /, "")}</div>;
    }
    if (line.startsWith("# ")) {
      return <div key={li} style={{ fontSize: 14, fontWeight: 800, color: role === "user" ? "#fff" : "#0F172A", marginTop: li > 0 ? 10 : 0, marginBottom: 3 }}>{line.replace(/^# /, "")}</div>;
    }
    if (line.match(/^[-・]\s/)) {
      const content = line.replace(/^[-・]\s/, "");
      return (
        <div key={li} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginTop: 3 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: role === "user" ? "rgba(255,255,255,.7)" : G, flexShrink: 0, marginTop: 6 }} />
          <span style={{ flex: 1 }}>{renderInline(content, role)}</span>
        </div>
      );
    }
    if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\./)![1];
      const content = line.replace(/^\d+\.\s/, "");
      return (
        <div key={li} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginTop: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: role === "user" ? "rgba(255,255,255,.8)" : GD, flexShrink: 0, minWidth: 14, marginTop: 1 }}>{num}.</span>
          <span style={{ flex: 1 }}>{renderInline(content, role)}</span>
        </div>
      );
    }
    if (line.trim() === "") return <div key={li} style={{ height: 6 }} />;
    return <div key={li} style={{ marginTop: li > 0 && lines[li - 1]?.trim() !== "" ? 1 : 0 }}>{renderInline(line, role)}</div>;
  });
}

function renderInline(text: string, role: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, pi) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={pi} style={{ fontWeight: 700, color: role === "user" ? "#fff" : "#0F172A" }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={pi}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={pi}>{part}</React.Fragment>;
  });
}

export default function Dashboard({ selected, company }: DashboardProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [size, setSize] = useState("標準");
  const [selectedNI, setSelectedNI] = useState(0);
  const [wizAnswers, setWizAnswers] = useState<Record<string, string>>({});
  const [wizLoading, setWizLoading] = useState(false);
  const [extractedSections, setExtractedSections] = useState<any[] | null>(null);
  const [extracting, setExtracting] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selected) {
      setDrafts({});
      setSelectedNI(0);
      setWizAnswers({});
      setExtractedSections(null);
      setChat([{ role: "ai", text: `${selected.name}についてお気軽にご質問ください。採択率アップのコツもお伝えします。` }]);
    }
  }, [selected]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  if (!selected)
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T3 }}>
        <div style={{ textAlign: "center" }}>
          <Icon d={IC.doc} size={40} color={BD} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 16, marginBottom: 6 }}>補助金を選択してください</div>
          <div style={{ fontSize: 13 }}>制度一覧からカードをクリックしてください</div>
        </div>
      </div>
    );

  const sections = extractedSections || selected.sections || DEFAULT_SECTIONS;
  const currentNI = selected.nameIdeas?.[selectedNI]?.text || "";

  const generate = async (sec: Section) => {
    if (generating[sec.id]) return;
    setGenerating((g) => ({ ...g, [sec.id]: true }));
    const len = size === "簡潔" ? "200字程度" : size === "標準" ? "400字程度" : "700字程度";
    const cfInfo = company.cashflow ? `\nキャッシュフロー:${company.cashflow}\n借入状況:${company.borrowing || "不明"}` : "";
    const wizInfo = wizAnswers[sec.id] ? `\n【申請者からの補足情報（最優先で反映すること）】\n${wizAnswers[sec.id]}` : "";
    const policyInfo = selected.policyBackground ? `\n政策背景:${selected.policyBackground}` : "";
    const text = await callClaudeClient(
      `あなたは補助金申請書の専門家です。「${sec.label}」を${len}で書いてください。
政策背景: ${selected.policyBackground || ""}
申請名目: ${currentNI}

以下のルールを守ること:
・具体的な数字・固有名詞を必ず入れる
・「革新性」「実現可能性」を意識した表現にする
・申請者の補足情報がある場合は最優先で反映する
・採択されやすい説得力のある文章にする
${sec.id === "finance" ? "・特にキャッシュフローと投資回収期間を具体的に記載すること" : ""}`,
      `補助金:${selected.name}\n企業情報:${JSON.stringify(company, null, 2)}${policyInfo}${cfInfo}${wizInfo}\n\n「${sec.label}」（${sec.sub}）を${len}で作成してください。`
    );
    setDrafts((d) => ({ ...d, [sec.id]: text }));
    setGenerating((g) => ({ ...g, [sec.id]: false }));
  };

  const generateAll = async () => {
    for (const sec of sections) await generate(sec);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      setChat((c) => [...c, { role: "user", text: `【ファイル添付】${file.name}` }]);
      setChatLoading(true);
      const res = await callClaudeClient(
        `あなたは${selected.name}の申請書作成を支援するアドバイザーです。アップロードされたファイルの内容から申請書に使えそうな情報を抽出し、各セクションへの活用方法を提案してください。`,
        `補助金:${selected.name}\n企業情報:${JSON.stringify(company)}\n\nファイル内容(${file.name}):\n${text.slice(0, 1500)}`
      );
      setChat((c) => [...c, { role: "ai", text: res }]);
      setChatLoading(false);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleFormFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("subsidyName", selected.name);

    try {
      const res = await fetch("/api/extract-form", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.sections && data.sections.length > 0) {
        setExtractedSections(data.sections);
      } else {
        setExtractedSections(selected.sections || []);
      }
    } catch (err) {
      console.error("Extract error:", err);
      setExtractedSections(selected.sections || []);
    }
    setExtracting(false);
  };

  const handleHint = async (secId: string, label: string, sub: string) => {
    setWizLoading(true);
    const hint = await callClaudeClient(
      `補助金「${selected.name}」の申請書専門家として、「${label}」に何を書けばよいか、この企業の状況をもとに具体的なヒントを3点で教えてください。`,
      `企業情報:${JSON.stringify(company)}\n申請名目:${currentNI}\n\n「${label}」（${sub}）について、採択されやすい書き方のヒントを3点、箇条書きで簡潔に。`
    );
    setChat((c) => [...c, { role: "ai", text: `【${label}のヒント】\n${hint}` }]);
    setWizLoading(false);
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatInput("");
    const nc: ChatMessage[] = [...chat, { role: "user", text: msg }];
    setChat(nc);
    setChatLoading(true);
    const res = await callClaudeClient(
      `あなたは${selected.name}の申請に詳しい補助金アドバイザーです。企業情報:${JSON.stringify(company)}。具体的にアドバイスしてください。`,
      nc.map((m) => `${m.role === "user" ? "ユーザー" : "AI"}:${m.text}`).join("\n")
    );
    setChat((c) => [...c, { role: "ai", text: res }]);
    setChatLoading(false);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px 28px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gap: 12, alignItems: "start" }}>
        {/* ─── 左: 補助金情報（3タブ）─── */}
        <LeftPanel
          selected={selected}
          company={company}
          wizAnswers={wizAnswers}
          setWizAnswers={setWizAnswers}
          selectedNI={selectedNI}
          setSelectedNI={setSelectedNI}
          drafts={drafts}
          sections={sections}
          onGenerate={generate}
          onGenerateAll={generateAll}
          onHint={handleHint}
          wizLoading={wizLoading}
          formFileRef={formFileRef}
          onFormFileChange={handleFormFileUpload}
          extracting={extracting}
          extractedSections={extractedSections}
          setExtractedSections={setExtractedSections}
        />

        {/* ─── 中: 申請書生成 ─── */}
        <div style={{ background: CARD, borderRadius: 18, padding: 20, boxShadow: SH }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: G, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>Draft Generator</div>
          <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-.04em", marginBottom: 3, fontFamily: "Noto Sans JP,sans-serif" }}>申請書を<span style={{ color: G }}>作成</span>する</div>
          <div style={{ fontSize: 11, color: T3, marginBottom: 12 }}>{selected.name}の審査項目に合わせて生成</div>

          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
            {["簡潔", "標準", "詳細"].map((s) => (
              <RippleBtn key={s} onClick={() => setSize(s)} style={{ padding: "5px 13px", borderRadius: 999, border: `1.5px solid ${size === s ? G : BD}`, background: size === s ? G : CARD, color: size === s ? "#fff" : T3, fontSize: 11, fontWeight: 600, transition: "all .12s" }}>{s}</RippleBtn>
            ))}
            <RippleBtn onClick={generateAll} style={{ marginLeft: "auto", padding: "5px 13px", borderRadius: 999, border: `1.5px solid ${G}`, background: GL2, color: GD, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Icon d={IC.zap} size={12} color={GD} />全生成
            </RippleBtn>
          </div>

          {sections.map((sec) => (
            <div key={sec.id}>
              <RippleBtn onClick={() => !generating[sec.id] && generate(sec)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: drafts[sec.id] ? CARD : SOFT, borderRadius: 11, padding: "11px 14px", marginBottom: 5, border: `1.5px solid ${drafts[sec.id] ? G : "transparent"}`, transition: "all .12s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: GL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                    <Icon d={IC.doc} size={17} color={GD} />
                    {wizAnswers[sec.id] && <div style={{ position: "absolute", top: -3, right: -3, width: 10, height: 10, borderRadius: "50%", background: "#7C3AED", border: "2px solid white" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: drafts[sec.id] ? G : T1 }}>
                      {sec.label}
                      {drafts[sec.id] && <span style={{ background: GL, color: GD, borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 700, marginLeft: 5 }}>生成済み</span>}
                      {!drafts[sec.id] && wizAnswers[sec.id] && <span style={{ background: "#EDE9FE", color: "#7C3AED", borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 700, marginLeft: 5 }}>回答済み</span>}
                    </div>
                    <div style={{ fontSize: 11, color: T3, marginTop: 2 }}>{generating[sec.id] ? "生成中..." : sec.sub}</div>
                  </div>
                </div>
                {generating[sec.id]
                  ? <div style={{ width: 13, height: 13, border: `2px solid ${GL}`, borderTop: `2px solid ${G}`, borderRadius: "50%", animation: "spin .8s linear infinite", flexShrink: 0 }} />
                  : <Icon d={IC.chev} size={13} color={G} />}
              </RippleBtn>
              {drafts[sec.id] && (
                <textarea
                  value={drafts[sec.id]}
                  onChange={(e) => setDrafts((d) => ({ ...d, [sec.id]: e.target.value }))}
                  rows={6}
                  style={{ width: "100%", background: "#FAFCFF", border: "1.5px solid #C7D7F5", borderRadius: 12, padding: "14px 16px", marginBottom: 8, fontSize: 13.5, color: "#0F172A", lineHeight: 2, fontFamily: "'Noto Sans JP',sans-serif", fontWeight: 500, outline: "none", resize: "vertical", letterSpacing: ".02em", boxShadow: "inset 0 1px 4px rgba(15,23,42,0.04)" }}
                />
              )}
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {["PDF 出力", "Word 出力"].map((l) => (
              <RippleBtn key={l} style={{ flex: 1, background: CARD, color: G, border: `1.5px solid ${G}`, borderRadius: 11, height: 40, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transition: "background .12s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = GL2; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = CARD; }}>
                {l}
              </RippleBtn>
            ))}
          </div>
        </div>

        {/* ─── 右: チャット常時 ─── */}
        <div style={{ background: CARD, borderRadius: 18, padding: 18, boxShadow: SH, position: "sticky", top: 16, display: "flex", flexDirection: "column", height: "calc(100vh - 110px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8, flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: GL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon d={IC.chat} size={17} color={GD} />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: G, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif" }}>AI Advisor</div>
              <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "-.03em", fontFamily: "Noto Sans JP,sans-serif" }}>AIに<span style={{ color: G }}>質問</span>する</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: T3, marginBottom: 8, padding: "6px 10px", background: SOFT, borderRadius: 7, flexShrink: 0 }}>{selected.name}専門アドバイザーが回答します</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8, flexShrink: 0 }}>
            {["採択率を上げるには？", "よくある落とし穴は？", "資金計画のコツは？"].map((q) => (
              <button key={q} onClick={() => setChatInput(q)} style={{ fontSize: 10, padding: "4px 9px", borderRadius: 999, border: `1px solid ${G}`, background: GL2, color: GD, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>{q}</button>
            ))}
          </div>
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", marginBottom: 8 }}>
            {chat.map((m, i) => (
              <div key={i} style={{ marginBottom: 12, display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: T3, letterSpacing: ".08em", marginBottom: 3, paddingLeft: m.role === "user" ? 0 : 2, paddingRight: m.role === "user" ? 2 : 0, textTransform: "uppercase" }}>
                  {m.role === "user" ? "あなた" : "トルモ AI"}
                </div>
                <div style={{
                  background: m.role === "user" ? GRAD : CARD,
                  borderRadius: m.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                  padding: "12px 15px", fontSize: 13, color: m.role === "user" ? "#fff" : "#1E293B", maxWidth: "92%", lineHeight: 1.8,
                  fontFamily: "'Noto Sans JP',sans-serif", fontWeight: m.role === "user" ? 500 : 400, letterSpacing: ".01em",
                  boxShadow: m.role === "user" ? "0 2px 12px rgba(16,185,129,0.22)" : "0 1px 6px rgba(15,23,42,0.06)",
                  border: m.role === "user" ? "none" : `1px solid ${BD}`,
                }}>
                  {renderText(m.text, m.role)}
                </div>
              </div>
            ))}
            {(chatLoading || wizLoading) && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: T3, letterSpacing: ".08em", marginBottom: 3, paddingLeft: 2, textTransform: "uppercase" }}>トルモ AI</div>
                <div style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: "4px 16px 16px 16px", padding: "12px 15px", boxShadow: "0 1px 6px rgba(15,23,42,0.06)" }}>
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    {[0, 1, 2].map((i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: G, opacity: 0.5, animation: `bounce .9s ${i * 0.18}s infinite` }} />)}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 5, marginBottom: 7, flexShrink: 0 }}>
            <input ref={fileRef} type="file" accept=".txt,.csv" onChange={handleFile} style={{ display: "none" }} />
            <button onClick={() => fileRef.current?.click()} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 999, border: `1px solid ${BD}`, background: SOFT, color: T2, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
              <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke={T2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              ファイルを添付
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, paddingTop: 9, borderTop: `1px solid ${BD}`, flexShrink: 0 }}>
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="質問を入力..."
              style={{ flex: 1, background: SOFT, border: `1.5px solid ${BD}`, borderRadius: 9, padding: "8px 12px", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
            <RippleBtn onClick={sendChat} style={{ background: GRAD, borderRadius: 9, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform .12s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(16,185,129,.4)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}>
              <Icon d={IC.send} size={14} color="white" />
            </RippleBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
