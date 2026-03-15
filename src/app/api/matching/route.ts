import { NextResponse } from "next/server";
import { matchSubsidies } from "@/lib/matching";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Company, Subsidy, SubsidiesByLayer } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json", // JSON強制モード
  },
});

async function enrichWithStrategy(
  subsidies: Subsidy[],
  company: Company
): Promise<Subsidy[]> {
  if (subsidies.length === 0) return [];

  const needsEnrich = subsidies.some(
    (s) => !s.strategy || !s.nameIdeas || s.nameIdeas.length === 0
  );
  if (!needsEnrich) return subsidies;

  try {
    const prompt = `補助金申請の専門家として、企業情報と補助金リストをもとに各補助金の戦略提案をJSON配列で返してください。

企業情報:
業種: ${company.industry}（${company.industryDetail || ""}）
都道府県: ${company.prefecture} / 市: ${company.city}
従業員: ${company.employees} / 売上: ${company.revenue}
決算: ${company.profit} / CF: ${company.cashflow}
課題: ${(company.challenges || []).join("・")}
申請経験: ${company.subsidyExp}

各補助金について以下のキーを持つオブジェクトの配列を返してください:
- id: 補助金のid（そのまま返す）
- strategy: この企業向けの採択率アップ戦略（1〜2文）
- nameIdeas: [
    {"label":"攻め","text":"高い補助額を狙える申請名目"},
    {"label":"標準","text":"採択率が高い王道の申請名目"},
    {"label":"確実","text":"要件を確実に満たせる申請名目"}
  ]
- sections: 審査項目 [{"id":"s1","label":"項目名","sub":"説明"} を3〜5件]

補助金リスト:
${JSON.stringify(
  subsidies.map((s) => ({
    id: s.id,
    name: s.name,
    org: s.org,
    maxAmount: s.maxAmount,
    rate: s.rate,
    tags: s.tags,
    eligible: s.eligible,
    summary: s.summary,
  }))
)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // responseMimeType: "application/json" を使っているので
    // コードブロックなしの純粋なJSONが返ってくる
    const enriched: any[] = JSON.parse(text);

    return subsidies.map((sub) => {
      const enrich = enriched.find((e: any) => e.id === sub.id);
      if (!enrich) return sub;
      return {
        ...sub,
        strategy: sub.strategy || enrich.strategy || "",
        nameIdeas:
          sub.nameIdeas && sub.nameIdeas.length > 0
            ? sub.nameIdeas
            : enrich.nameIdeas || [],
        sections:
          sub.sections && sub.sections.length > 0
            ? sub.sections
            : enrich.sections || [],
      };
    });
  } catch (e) {
    console.error("Enrich error:", e);
    return subsidies; // エラー時はDBデータをそのまま返す
  }
}

export async function POST(req: Request) {
  try {
    const company: Company = await req.json();

    // Step 1: DBからスコアリングでマッチング
    const matched: SubsidiesByLayer = await matchSubsidies(company);

    // Step 2: 各レイヤーにGeminiで戦略を付与（並列）
    const [national, prefecture, city, chamber, other] = await Promise.all([
      enrichWithStrategy(matched.national, company),
      enrichWithStrategy(matched.prefecture, company),
      enrichWithStrategy(matched.city, company),
      enrichWithStrategy(matched.chamber, company),
      enrichWithStrategy(matched.other, company),
    ]);

    return NextResponse.json({ national, prefecture, city, chamber, other });
  } catch (e) {
    console.error("Matching error:", e);
    return NextResponse.json(
      { national: [], prefecture: [], city: [], chamber: [], other: [] },
      { status: 500 }
    );
  }
}
