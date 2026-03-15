import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Company } from "@/types";

const client = new Anthropic();

export async function POST(req: Request) {
  const company: Company = await req.json();
  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  try {
    // Step 1: Supabase からハードフィルタで候補を取得
    const [nationalRes, prefRes, cityRes, chamberRes, otherRes] =
      await Promise.all([
        supabase
          .from("subsidies")
          .select("*")
          .eq("is_active", true)
          .eq("layer", "national")
          .gte("deadline_date", today)
          .limit(20),

        company.prefecture
          ? supabase
              .from("subsidies")
              .select("*")
              .eq("is_active", true)
              .eq("layer", "prefecture")
              .eq("prefecture", company.prefecture)
              .gte("deadline_date", today)
              .limit(20)
          : Promise.resolve({ data: [] }),

        company.city
          ? supabase
              .from("subsidies")
              .select("*")
              .eq("is_active", true)
              .eq("layer", "city")
              .eq("city", company.city)
              .gte("deadline_date", today)
              .limit(20)
          : Promise.resolve({ data: [] }),

        supabase
          .from("subsidies")
          .select("*")
          .eq("is_active", true)
          .eq("layer", "chamber")
          .or(
            `prefecture.eq.${company.prefecture},prefecture.is.null`
          )
          .gte("deadline_date", today)
          .limit(10),

        supabase
          .from("subsidies")
          .select("*")
          .eq("is_active", true)
          .eq("layer", "other")
          .or(
            `prefecture.eq.${company.prefecture},prefecture.is.null`
          )
          .gte("deadline_date", today)
          .limit(10),
      ]);

    const candidates = {
      national: nationalRes.data || [],
      prefecture: prefRes.data || [],
      city: cityRes.data || [],
      chamber: chamberRes.data || [],
      other: otherRes.data || [],
    };

    const total = Object.values(candidates).flat().length;
    if (total === 0) {
      return NextResponse.json({
        national: [],
        prefecture: [],
        city: [],
        chamber: [],
        other: [],
      });
    }

    // Step 2: Claude に候補と企業情報を渡してスコアリング
    const prompt = `企業情報:
業種: ${company.industry} / ${company.industryDetail}
都道府県: ${company.prefecture} / 市区町村: ${company.city}
従業員: ${company.employees} / 売上: ${company.revenue}
決算: ${company.profit} / CF: ${company.cashflow}
課題: ${(company.challenges || []).join("・")}
申請経験: ${company.subsidyExp}
雇用予定: ${company.employment}

以下の補助金候補を評価し、企業に合う順にランキングしてJSON配列で返してください。
説明文・コードブロック不要。JSON配列のみ。

各要素のキー:
- id (string): 候補のid
- layer (string): national/prefecture/city/chamber/other
- score (number): 50-95
- status (string): "高"/"中"/"低"
- strategy (string): この企業向けの戦略1文
- nameIdeas (array): [{label:"攻め",text:""},{label:"標準",text:""},{label:"確実",text:""}]
- sections (array): [{id:"s1",label:"審査項目名",sub:"説明"} 3-5件]
- summary (string): 概要2文（なければ生成）

候補リスト:
${JSON.stringify(
  Object.entries(candidates).flatMap(([layer, items]) =>
    (items as any[]).map((s) => ({
      id: s.id,
      layer,
      name: s.name,
      org: s.org,
      max_amount: s.max_amount,
      rate: s.rate,
      deadline: s.deadline_date,
      tags: s.tags,
      eligible: s.eligible,
      summary: s.summary,
    }))
  ),
  null,
  2
)}`;

    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system:
        "あなたは補助金マッチング専門家です。企業情報に基づいて補助金候補を評価し、JSON配列のみ返してください。",
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      msg.content[0].type === "text" ? msg.content[0].text : "[]";
    const s = text.indexOf("[");
    const e = text.lastIndexOf("]");
    const ranked: any[] =
      s > -1 && e > s ? JSON.parse(text.slice(s, e + 1)) : [];

    // Step 3: Claude の評価を元のDBデータとマージ
    const mergeWithDB = (layer: string) => {
      const dbItems = candidates[
        layer as keyof typeof candidates
      ] as any[];
      return ranked
        .filter((r) => r.layer === layer)
        .slice(0, 4)
        .map((r) => {
          const db = dbItems.find((d) => d.id === r.id) || ({} as any);
          return {
            id: db.id || r.id,
            name: db.name || "",
            org: db.org || "",
            layer,
            maxAmount: db.max_amount || "",
            rate: db.rate || "",
            deadline: db.deadline_date
              ? Math.ceil(
                  (new Date(db.deadline_date).getTime() - Date.now()) /
                    86400000
                )
              : 90,
            score: r.score || 60,
            status: r.status || "中",
            summary: r.summary || db.summary || "",
            strategy: r.strategy || "",
            nameIdeas: r.nameIdeas || [],
            tags: db.tags || [],
            eligible: db.eligible || "",
            expense: db.expense || "",
            difficulty: db.difficulty || "中",
            url: db.url || "",
            sections: r.sections || [],
            prefecture: db.prefecture,
            city: db.city,
          };
        });
    };

    return NextResponse.json({
      national: mergeWithDB("national"),
      prefecture: mergeWithDB("prefecture"),
      city: mergeWithDB("city"),
      chamber: mergeWithDB("chamber"),
      other: mergeWithDB("other"),
    });
  } catch (e) {
    console.error("Matching error:", e);
    return NextResponse.json(
      {
        national: [],
        prefecture: [],
        city: [],
        chamber: [],
        other: [],
      },
      { status: 500 }
    );
  }
}
