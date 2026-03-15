"use client";

import React, { useState } from "react";
import Link from "next/link";

/* ─── カラー（constants準拠） ─── */
const G = "#10B981";
const GD = "#059669";
const GL2 = "#ECFDF5";
const GRAD = "linear-gradient(135deg,#10B981,#22C55E)";
const T1 = "#0A0F0A";
const T2 = "#475569";
const T3 = "#94A3B8";
const BD = "#E2E8F0";
const SH = "0 4px 20px rgba(15,23,42,0.06)";

/* ─── FAQ データ ─── */
const FAQ = [
  { q: "利用料金はかかりますか？", a: "基本診断は無料です。申請書AIドラフト生成や専門家チャットなどのプレミアム機能は有料プランでご利用いただけます。" },
  { q: "対応している補助金の種類は？", a: "国（経産省・中小企業庁等）、都道府県、市区町村、商工会議所、その他公的機関の補助金を5層横断で検索します。データベースは随時更新されています。" },
  { q: "AIが作成した申請書はそのまま提出できますか？", a: "AIドラフトは高品質な下書きとしてご活用ください。最終的には内容を確認・調整のうえ提出されることをお勧めします。" },
  { q: "個人情報の取り扱いは？", a: "入力いただいた企業情報は補助金マッチングのみに使用し、第三者に提供することはありません。データは暗号化して安全に管理しています。" },
];

export default function LPPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ fontFamily: "Noto Sans JP, Inter, sans-serif", color: T1, overflowX: "hidden" }}>
      {/* ─── ヘッダー ─── */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(255,255,255,.88)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BD}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgb(18,130,55)", letterSpacing: ".12em", fontFamily: "Arial,sans-serif", marginBottom: 1 }}>補助金AI</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "rgb(34,177,76)", fontFamily: "'M PLUS 1p', sans-serif", letterSpacing: "-.05em" }}>トルモ</div>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <a href="#features" style={{ fontSize: 13, color: T2, textDecoration: "none", fontWeight: 500 }}>機能</a>
            <a href="#flow" style={{ fontSize: 13, color: T2, textDecoration: "none", fontWeight: 500 }}>使い方</a>
            <a href="#faq" style={{ fontSize: 13, color: T2, textDecoration: "none", fontWeight: 500 }}>FAQ</a>
            <Link href="/auth/login" style={{ fontSize: 13, color: GD, textDecoration: "none", fontWeight: 600 }}>ログイン</Link>
            <Link href="/auth/signup" style={{ background: GRAD, color: "#fff", borderRadius: 10, padding: "9px 22px", fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 16px rgba(16,185,129,.25)" }}>無料で始める</Link>
          </nav>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section style={{ position: "relative", paddingTop: 68, overflow: "hidden", background: "#F5F9F5" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 32px 80px", display: "flex", alignItems: "center", gap: 60, position: "relative", zIndex: 2 }}>
          <div style={{ flex: 1, maxWidth: 580 }}>
            <div style={{ display: "inline-block", background: GL2, border: `1px solid #A7F3D0`, borderRadius: 999, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: GD, marginBottom: 20 }}>
              5層横断AI補助金マッチング
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ fontSize: 72, fontWeight: 900, color: "rgb(34,177,76)", fontFamily: "'M PLUS 1p', sans-serif", letterSpacing: "-.06em", lineHeight: 1 }}>トルモ</div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: T1, lineHeight: 1.3, letterSpacing: "-.04em", fontFamily: "Noto Sans JP,sans-serif", marginBottom: 20 }}>
              補助金を、<span style={{ color: G }}>かんたんに。</span>
            </div>
            <p style={{ fontSize: 16, color: T2, lineHeight: 1.85, marginBottom: 36, maxWidth: 460 }}>
              業種と規模を入力するだけで、国・都道府県・市区町村・商工会議所の補助金を横断検索。申請書の下書きまで、AIがまるごとサポートします。
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/" style={{ background: GRAD, color: "#fff", borderRadius: 14, height: 58, padding: "0 44px", fontSize: 16, fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", boxShadow: "0 12px 32px rgba(16,185,129,.35)", transition: "transform .12s" }}>
                無料で診断を始める →
              </Link>
              <Link href="/" style={{ background: "#fff", color: GD, border: `1.5px solid ${G}`, borderRadius: 14, height: 58, padding: "0 32px", fontSize: 15, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={GD} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                デモを見る
              </Link>
            </div>
            <div style={{ display: "flex", gap: 32, marginTop: 36 }}>
              {[["5層", "横断検索"], ["3分", "AI診断"], ["90%+", "マッチ精度"]].map(([num, label]) => (
                <div key={label}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: G, fontFamily: "Inter,sans-serif", letterSpacing: "-.04em" }}>{num}</div>
                  <div style={{ fontSize: 12, color: T3, fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero右側: スクリーンショット風 */}
          <div style={{ flex: 1, position: "relative", minHeight: 420 }}>
            <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 24px 64px rgba(15,23,42,.12)", padding: 24, transform: "perspective(1000px) rotateY(-5deg) rotateX(2deg)", border: `1px solid ${BD}` }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
              </div>
              <div style={{ background: GRAD, borderRadius: 14, padding: "18px 20px", marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", letterSpacing: ".12em", fontFamily: "Inter,sans-serif", marginBottom: 4 }}>Matching — ものづくり補助金</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", fontFamily: "Inter,sans-serif", letterSpacing: "-.04em" }}>1,250万円</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>補助率 2/3</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[["採択見込み", "82%"], ["残り日数", "38日"], ["申請難易度", "中"], ["審査ポイント", "5項目"]].map(([k, v]) => (
                  <div key={k} style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: T3 }}>{k}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T1, fontFamily: "Inter,sans-serif" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 背景デコ */}
        <svg style={{ position: "absolute", right: -80, top: -60, width: 560, height: 560, pointerEvents: "none", overflow: "visible" }} viewBox="0 0 560 560" fill="none">
          <path d="M520 45 C490 -10,395 2,358 68 C321 134,415 196,368 270 C321 344,192 312,162 390 C132 468,228 528,180 570" stroke="#10B981" strokeWidth="52" strokeLinecap="round" opacity=".06">
            <animate attributeName="d" dur="6s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" values="M520 45 C490 -10,395 2,358 68 C321 134,415 196,368 270 C321 344,192 312,162 390 C132 468,228 528,180 570;M520 65 C480 5,410 18,368 88 C326 158,408 210,355 288 C302 366,182 326,148 406 C114 486,224 542,172 580;M520 45 C490 -10,395 2,358 68 C321 134,415 196,368 270 C321 344,192 312,162 390 C132 468,228 528,180 570" />
          </path>
        </svg>
      </section>

      {/* ─── 信頼バー ─── */}
      <section style={{ background: "#fff", borderBottom: `1px solid ${BD}`, padding: "28px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "center", gap: 48, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: T3, fontWeight: 500 }}>導入実績</span>
          {["製造業", "IT・情報通信", "飲食・小売", "建設業", "医療・福祉", "農林水産"].map((t) => (
            <span key={t} style={{ fontSize: 13, color: T2, fontWeight: 600 }}>{t}</span>
          ))}
        </div>
      </section>

      {/* ─── 課題セクション ─── */}
      <section style={{ background: "#FAFBFC", padding: "80px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: G, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 10 }}>Problem</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-.04em", marginBottom: 12 }}>
            補助金申請、こんな<span style={{ color: "#F97316" }}>お悩み</span>ありませんか？
          </h2>
          <p style={{ fontSize: 14, color: T2, marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>多くの中小企業がこれらの課題を抱えています</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {[
              { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", title: "どの補助金が対象かわからない", desc: "国・県・市・商工会…膨大な制度から自社に合うものを探すのは至難の業。見落としで機会損失も。" },
              { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", title: "申請書の書き方がわからない", desc: "専門用語だらけの申請書。何を書けば採択されるのか、審査のポイントが見えない。" },
              { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", title: "時間も人手も足りない", desc: "通常業務で手一杯。調査・書類作成に何十時間もかけられない。コンサルに頼むと費用が高額に。" },
            ].map((item) => (
              <div key={item.title} style={{ background: "#fff", borderRadius: 18, padding: "32px 24px", boxShadow: SH, textAlign: "left", border: `1px solid ${BD}` }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FFF4ED", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="#F97316" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, letterSpacing: "-.02em" }}>{item.title}</div>
                <div style={{ fontSize: 13, color: T2, lineHeight: 1.75 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 機能セクション ─── */}
      <section id="features" style={{ background: "#fff", padding: "80px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: G, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 10 }}>Features</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-.04em", marginBottom: 12 }}>
              トルモの<span style={{ color: G }}>3つの強み</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {[
              { icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064", label: "5層横断検索", title: "5層横断の\nAIマッチング", desc: "国・都道府県・市区町村・商工会議所・公的機関。5つのレイヤーを同時に検索し、あなたの会社に最適な補助金を漏れなく発見します。", color: G },
              { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "AI申請書生成", title: "申請書ドラフトを\nAIが自動生成", desc: "審査ポイントを押さえた申請書の下書きを、セクションごとにAIが自動生成。ウィザード形式で情報を入力するだけで完成します。", color: "#7C3AED" },
              { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "AIアドバイザー", title: "補助金専門の\nAIチャット相談", desc: "選択した補助金に特化したAIアドバイザーが、採択率アップのコツや申請書の改善ポイントをリアルタイムでアドバイスします。", color: "#F97316" },
            ].map((f) => (
              <div key={f.title} style={{ background: "#fff", borderRadius: 20, padding: "36px 28px", boxShadow: "0 8px 32px rgba(15,23,42,.08)", border: `1.5px solid ${BD}`, transition: "transform .15s,box-shadow .15s" }}>
                <div style={{ width: 52, height: 52, borderRadius: 15, background: f.color === G ? GL2 : f.color === "#7C3AED" ? "#F5F3FF" : "#FFF4ED", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={f.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: f.color, letterSpacing: ".12em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 8 }}>{f.label}</div>
                <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.4, marginBottom: 12, whiteSpace: "pre-line" }}>{f.title}</div>
                <div style={{ fontSize: 13, color: T2, lineHeight: 1.8 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 使い方フロー ─── */}
      <section id="flow" style={{ background: "#F5F9F5", padding: "80px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: G, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 10 }}>How It Works</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-.04em", marginBottom: 12 }}>
              <span style={{ color: G }}>3ステップ</span>で補助金申請
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, position: "relative" }}>
            {/* 接続線 */}
            <div style={{ position: "absolute", top: 48, left: "calc(33.33% - 12px)", right: "calc(33.33% - 12px)", height: 2, background: `linear-gradient(90deg, ${G}, #22C55E)`, opacity: .2, zIndex: 0 }} />
            {[
              { step: "01", title: "企業情報を入力", desc: "業種・所在地・従業員数など、基本的な情報を3分で入力。難しい専門知識は不要です。" },
              { step: "02", title: "AIが最適な補助金を提案", desc: "5層のデータベースからAIがスコアリング。採択可能性・金額・締切などを一覧で確認できます。" },
              { step: "03", title: "申請書をAIで作成", desc: "選んだ補助金に合わせて、AIが審査ポイントを押さえた申請書ドラフトを自動生成します。" },
            ].map((s, i) => (
              <div key={s.step} style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(16,185,129,.25)" }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "Inter,sans-serif" }}>{s.step}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.02em", marginBottom: 10 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: T2, lineHeight: 1.75, maxWidth: 280, margin: "0 auto" }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 比較テーブル ─── */}
      <section style={{ background: "#fff", padding: "80px 0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: G, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 10 }}>Comparison</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-.04em" }}>
              従来の方法と<span style={{ color: G }}>トルモ</span>の違い
            </h2>
          </div>
          <div style={{ borderRadius: 18, overflow: "hidden", border: `1px solid ${BD}`, boxShadow: SH }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: T3, fontSize: 12, borderBottom: `1px solid ${BD}` }}></th>
                  <th style={{ padding: "14px 20px", textAlign: "center", fontWeight: 600, color: T3, fontSize: 12, borderBottom: `1px solid ${BD}` }}>従来</th>
                  <th style={{ padding: "14px 20px", textAlign: "center", fontWeight: 800, color: G, fontSize: 12, borderBottom: `1px solid ${BD}`, background: GL2 }}>トルモ</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["補助金検索", "手動で各サイトを確認", "5層AI自動マッチング"],
                  ["所要時間", "数日〜数週間", "最短3分"],
                  ["申請書作成", "ゼロから手書き", "AIドラフト自動生成"],
                  ["専門知識", "必要", "不要"],
                  ["コスト", "コンサル30〜100万円", "無料〜月額プラン"],
                ].map(([label, old, torumo], i, arr) => (
                  <tr key={label} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${BD}` : "none" }}>
                    <td style={{ padding: "14px 20px", fontWeight: 600, fontSize: 13 }}>{label}</td>
                    <td style={{ padding: "14px 20px", textAlign: "center", color: T3, fontSize: 13 }}>{old}</td>
                    <td style={{ padding: "14px 20px", textAlign: "center", fontWeight: 700, color: GD, fontSize: 13, background: GL2 }}>{torumo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" style={{ background: "#FAFBFC", padding: "80px 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: G, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 10 }}>FAQ</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-.04em" }}>
              よくある<span style={{ color: G }}>ご質問</span>
            </h2>
          </div>
          {FAQ.map((item, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, border: `1px solid ${openFaq === i ? G : BD}`, overflow: "hidden", transition: "border-color .15s" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: "100%", padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: T1 }}>{item.q}</span>
                <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={openFaq === i ? G : T3} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s", flexShrink: 0, marginLeft: 12 }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openFaq === i && (
                <div style={{ padding: "0 22px 18px", fontSize: 14, color: T2, lineHeight: 1.8 }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ background: GRAD, padding: "72px 0", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <svg style={{ position: "absolute", left: -40, top: -30, width: 260, height: 260, pointerEvents: "none", opacity: .12 }} viewBox="0 0 260 260" fill="none">
          <path d="M18 238 C54 202,35 140,88 112 C141 84,164 160,214 124 C264 88,248 22,274 4" stroke="#fff" strokeWidth="26" strokeLinecap="round" />
        </svg>
        <div style={{ position: "relative", zIndex: 2, maxWidth: 600, margin: "0 auto", padding: "0 32px" }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-.04em", marginBottom: 14 }}>
            今すぐ無料で補助金診断
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.8)", lineHeight: 1.75, marginBottom: 32 }}>
            3分の入力で、あなたの会社に最適な補助金がわかります。<br />申請書の作成もAIがサポート。
          </p>
          <Link href="/" style={{ background: "#fff", color: GD, borderRadius: 14, height: 58, padding: "0 48px", fontSize: 17, fontWeight: 900, textDecoration: "none", display: "inline-flex", alignItems: "center", boxShadow: "0 8px 24px rgba(0,0,0,.15)", letterSpacing: "-.02em" }}>
            無料で始める →
          </Link>
        </div>
      </section>

      {/* ─── フッター ─── */}
      <footer style={{ background: "#0F172A", color: "rgba(255,255,255,.6)", padding: "48px 0 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36, flexWrap: "wrap", gap: 32 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.4)", letterSpacing: ".12em", fontFamily: "Arial,sans-serif", marginBottom: 2 }}>補助金AI</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "'M PLUS 1p', sans-serif", letterSpacing: "-.04em", marginBottom: 8 }}>トルモ</div>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>補助金を、かんたんに。</div>
            </div>
            <div style={{ display: "flex", gap: 48 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.4)", letterSpacing: ".1em", marginBottom: 12 }}>サービス</div>
                {["機能", "料金", "使い方", "FAQ"].map((l) => (
                  <div key={l} style={{ fontSize: 13, marginBottom: 8, color: "rgba(255,255,255,.6)" }}>{l}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.4)", letterSpacing: ".1em", marginBottom: 12 }}>会社情報</div>
                {["運営会社", "プライバシーポリシー", "利用規約", "お問い合わせ"].map((l) => (
                  <div key={l} style={{ fontSize: 13, marginBottom: 8, color: "rgba(255,255,255,.6)" }}>{l}</div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 20, fontSize: 12, textAlign: "center" }}>
            &copy; 2026 トルモ All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
