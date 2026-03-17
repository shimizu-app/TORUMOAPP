import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Company, Subsidy } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: { responseMimeType: "application/json" },
});

export async function POST(req: Request) {
  const company: Company = await req.json();
  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  try {
    // ── Step 1: 地域だけで絞る（業種フィルターなし）──
    // layer/prefecture/city カラムでフィルタ
    const orConditions = [
      "layer.eq.national",
      "layer.eq.chamber",
      "layer.eq.other",
    ];
    if (company.prefecture) {
      orConditions.push(`prefecture.eq.${company.prefecture}`);
    }
    if (company.city) {
      orConditions.push(`city.eq.${company.city}`);
    }

    console.log("[matching] orConditions:", orConditions.join(","));
    console.log("[matching] today:", today);

    const { data: candidates, error } = await supabase
      .from("subsidies")
      .select("*")
      .eq("is_active", true)
      .gte("deadline_date", today)
      .or(orConditions.join(","))
      .limit(80);

    console.log("[matching] candidates count:", candidates?.length ?? 0, "error:", error?.message ?? "none");

    if (error || !candidates || candidates.length === 0) {
      // フォールバック: フィルターなしで全件取得してみる
      const { data: allSubs, error: allErr } = await supabase
        .from("subsidies")
        .select("id, name, layer, prefecture, city, is_active, deadline_date")
        .limit(5);
      console.log("[matching] fallback sample:", JSON.stringify(allSubs), "error:", allErr?.message ?? "none");

      return NextResponse.json({
        national: [], prefecture: [], city: [], chamber: [], other: [],
      });
    }

    // ── Step 2: Geminiに全判断を任せる ──
    const prompt = `あなたは補助金申請の専門家です。
以下の企業情報と補助金候補リストをもとに、
この企業が申請できる補助金を選んでJSON配列で返してください。

【重要なルール】
- 業種が直接合わなくても「名目次第でいける」場合は積極的に含める
  例: 飲食業でも「デジタル注文システム導入」名目でIT導入補助金に申請できる
  例: 飲食業でも「厨房設備の省エネ化」名目で省エネ補助金に申請できる
- 「絶対に無関係」なもの（農業専用なのにIT企業など）だけ除外
- それ以外は広めに出して採択可能性で判断する
- 各レイヤー（national/prefecture/city/chamber/other）から最大4件ずつ選ぶ

【企業情報】
業種: ${company.industry}（${company.industryDetail || ""}）
都道府県: ${company.prefecture} / 市区町村: ${company.city}
従業員: ${company.employees} / 売上: ${company.revenue}
決算: ${company.profit} / キャッシュフロー: ${company.cashflow}
経営課題: ${(company.challenges || []).join("・")}
申請経験: ${company.subsidyExp}
雇用予定: ${company.employment}
備考: ${company.memo || "なし"}

【補助金候補リスト】
${JSON.stringify(candidates.map(s => ({
  id: s.id,
  name: s.name,
  org: s.org,
  layer: s.layer,
  prefecture: s.prefecture,
  city: s.city,
  max_amount: s.max_amount,
  rate: s.rate,
  deadline: s.deadline_date,
  eligible: s.eligible,
  summary: s.summary,
  tags: s.tags,
})))}

【返すJSONの形式】
以下のキーを持つオブジェクトの配列を返してください:
[
  {
    "id": "補助金のid（候補リストのidをそのまま）",
    "layer": "national/prefecture/city/chamber/other",
    "score": 採択見込み（50〜95の数値）,
    "status": "高/中/低",
    "strategy": "この企業がこの補助金を取るための戦略（1〜2文）",
    "reason": "なぜこの企業に合うか・どんな名目で申請できるか（1文）",
    "nameIdeas": [
      {"label": "攻め", "text": "高い補助額を狙える申請名目"},
      {"label": "標準", "text": "採択率が高い王道の申請名目"},
      {"label": "確実", "text": "要件を確実に満たせる保守的な申請名目"}
    ],
    "sections": [
      {"id": "s1", "label": "審査項目名", "sub": "何を書くか"},
      {"id": "s2", "label": "審査項目名", "sub": "何を書くか"},
      {"id": "s3", "label": "審査項目名", "sub": "何を書くか"}
    ]
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("[matching] Gemini raw length:", text.length);
    const ranked: any[] = JSON.parse(text);
    console.log("[matching] ranked count:", ranked.length, "layers:", ranked.map(r => r.layer));

    // ── Step 3: GeminiのスコアをDBデータとマージして返す ──
    const mergeLayer = (layer: string) => {
      return ranked
        .filter(r => r.layer === layer)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map(r => {
          const db = candidates.find(c => c.id === r.id);
          if (!db) return null;
          return {
            id: db.id,
            name: db.name,
            org: db.org,
            layer,
            maxAmount: db.max_amount || "",
            rate: db.rate || "",
            deadline: db.deadline_date
              ? Math.ceil((new Date(db.deadline_date).getTime() - Date.now()) / 86400000)
              : 90,
            score: r.score,
            status: r.status || (r.score >= 70 ? "高" : r.score >= 55 ? "中" : "低"),
            summary: db.summary || "",
            strategy: r.strategy || "",
            reason: r.reason || "",
            nameIdeas: r.nameIdeas || [],
            sections: r.sections || [],
            tags: db.tags || [],
            eligible: db.eligible || "",
            expense: db.expense || "",
            difficulty: db.difficulty || "中",
            url: db.url || "",
            prefecture: db.prefecture,
            city: db.city,
            target_area: db.prefecture ? `${db.prefecture}${db.city || ""}` : "全国",
          } as Subsidy;
        })
        .filter(Boolean) as Subsidy[];
    };

    return NextResponse.json({
      national:   mergeLayer("national"),
      prefecture: mergeLayer("prefecture"),
      city:       mergeLayer("city"),
      chamber:    mergeLayer("chamber"),
      other:      mergeLayer("other"),
    });

  } catch (e: any) {
    console.error("[matching] CATCH error:", e?.message || e);
    return NextResponse.json(
      { national: [], prefecture: [], city: [], chamber: [], other: [] },
      { status: 500 }
    );
  }
}
