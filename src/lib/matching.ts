import { createServerSupabaseClient as createClient } from "@/lib/supabase/server";
import type { Company, Subsidy, SubsidiesByLayer } from "@/types";

// どの業種でも関連する共通キーワード
const UNIVERSAL_KEYWORDS = [
  "中小企業支援", "雇用", "正社員化", "採用", "人材育成",
  "創業", "事業転換", "事業承継", "生産性", "効率化", "設備投資",
];

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  "製造業":           ["製造業", "ものづくり", "設備", "DX", "IoT", "省エネ", "生産性", "設備更新", "自動化"],
  "IT・ソフトウェア":  ["IT化", "DX", "デジタル", "クラウド", "システム", "SaaS", "IoT活用", "EC"],
  "小売・卸売":       ["販路開拓", "EC", "デジタル", "小規模事業者", "IT化", "DX"],
  "医療・福祉":       ["医療", "福祉", "介護", "助成金", "雇用", "DX", "IT化"],
  "建設業":           ["設備投資", "建設", "DX", "省エネ", "IT化", "雇用", "採用"],
  "運輸・物流":       ["物流", "DX", "省エネ", "設備", "IT化", "効率化"],
  "飲食・宿泊":       ["販路開拓", "小規模事業者", "EC", "デジタル", "IT化", "雇用"],
  "その他":           ["創業", "販路開拓", "DX", "IT化", "デジタル", "設備投資"],
};

const CHALLENGE_KEYWORDS: Record<string, string[]> = {
  "設備の老朽化":     ["設備投資", "設備更新", "ものづくり", "生産性"],
  "IT化・デジタル化": ["IT化", "DX", "デジタル", "クラウド", "システム"],
  "人手不足":         ["雇用", "正社員化", "採用", "DX", "自動化"],
  "新規市場の開拓":   ["販路開拓", "創業", "新製品", "新市場"],
  "コスト削減":       ["省エネ", "DX", "効率化", "IT化"],
  "後継者問題":       ["事業承継", "創業"],
  "海外展開":         ["海外展開", "グローバル"],
  "脱炭素・GX":      ["省エネ", "GX", "カーボンニュートラル", "NEDO"],
  "品質向上":         ["ものづくり", "DX", "IoT", "製造業"],
  "資金調達":         ["創業", "事業転換", "設備投資"],
};

function safeParseJSON(val: any): any {
  if (val === null || val === undefined) return null;
  if (typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return null; }
}

export async function matchSubsidies(company: Company): Promise<SubsidiesByLayer> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: allSubsidies, error } = await supabase
    .from("subsidies")
    .select("*")
    .eq("is_active", true)
    .gte("deadline_date", today);

  if (error || !allSubsidies || allSubsidies.length === 0) {
    console.error("Supabase fetch error:", error);
    return { national: [], prefecture: [], city: [], chamber: [], other: [] };
  }

  const scored = allSubsidies.map((s) => {
    let score = s.score_base || 60;
    let relevanceHits = 0; // 業種・課題で何個タグがマッチしたか

    // ① 業種マッチ（業種固有 + 全業種共通）
    const industryKw = INDUSTRY_KEYWORDS[company.industry || ""] || [];
    const tags = (s.tags as string[]) || [];
    const indMatches = tags.filter((t) =>
      industryKw.some((k) => t.includes(k))
    ).length;
    score += indMatches * 8;
    relevanceHits += indMatches;

    // 全業種共通キーワード（雇用・創業・事業承継など業種を問わず関連）
    const uniMatches = tags.filter((t) =>
      UNIVERSAL_KEYWORDS.some((k) => t.includes(k))
    ).length;
    score += uniMatches * 3;
    relevanceHits += uniMatches;

    // ② 地域マッチ（地域一致も関連性としてカウント）
    if (["national", "chamber", "other"].includes(s.layer)) score += 5;
    if (s.prefecture && s.prefecture === company.prefecture) {
      score += 20;
      relevanceHits += 1;
    }
    if (s.layer === "city" && s.city && s.city === company.city) {
      score += 15;
      relevanceHits += 1;
    }

    // ③ 課題マッチ
    (company.challenges || []).forEach((ch: string) => {
      const ckw = CHALLENGE_KEYWORDS[ch] || [];
      const matches = tags.filter((t) =>
        ckw.some((k) => t.includes(k))
      ).length;
      score += matches * 6;
      relevanceHits += matches;
    });

    // ④ 財務状況
    if (company.profit === "黒字") score += 5;
    if (company.profit === "赤字") score -= 8;
    if (company.cashflow === "毎月プラス（安定）") score += 3;
    if (company.cashflow === "慢性的にマイナス") score -= 5;

    // ⑤ 申請経験
    if (company.subsidyExp === "複数回採択あり") score += 10;
    else if (company.subsidyExp === "過去に採択あり") score += 6;
    else if (company.subsidyExp === "初めて" && s.difficulty === "低") score += 8;

    // ⑥ 雇用予定
    if (company.employment === "増やす予定") {
      if (tags.some((t) => t.includes("雇用"))) {
        score += 8;
        relevanceHits += 1;
      }
    }

    // ⑦ 認定・受賞歴
    if ((company.certifications || []).some((c: string) => c !== "なし")) score += 4;

    // ⑧ eligible（対象者）テキストに業種名が含まれていればボーナス
    const eligibleText = (s.eligible || "").toLowerCase();
    const industryName = (company.industry || "").toLowerCase();
    if (industryName && eligibleText.includes(industryName)) {
      score += 10;
      relevanceHits += 1;
    }

    // deadline_date が null の場合は 90 日としておく
    const deadline = s.deadline_date
      ? Math.ceil((new Date(s.deadline_date).getTime() - Date.now()) / 86400000)
      : 90;

    const normalizedScore = Math.min(95, Math.max(50, score));

    return {
      id: s.id,
      name: s.name,
      org: s.org,
      layer: s.layer,
      maxAmount: s.max_amount || "",
      rate: s.rate || "",
      deadline,
      score: normalizedScore,
      relevanceHits,
      status: normalizedScore >= 70 ? "高" : normalizedScore >= 55 ? "中" : "低",
      summary: s.summary,
      strategy: s.strategy,
      nameIdeas: safeParseJSON(s.name_ideas),
      tags: s.tags,
      eligible: s.eligible,
      expense: s.expense,
      difficulty: s.difficulty,
      url: s.url,
      form_url: s.form_url,
      sections: safeParseJSON(s.sections),
      prefecture: s.prefecture,
      city: s.city,
    } as Subsidy;
  })
  // 関連性が0の補助金は除外（業種・課題に1つも引っかからない＝無関係）
  .filter((s) => s.deadline > 0)
  .sort((a, b) => b.score - a.score);

  return {
    // 国：全件対象
    national: scored
      .filter((s) => s.layer === "national")
      .slice(0, 4),

    // 都道府県：完全一致必須（nullは除外）
    prefecture: scored
      .filter((s) =>
        s.layer === "prefecture" &&
        s.prefecture === company.prefecture
      )
      .slice(0, 4),

    // 市区町村：完全一致必須
    city: scored
      .filter((s) =>
        s.layer === "city" &&
        s.city === company.city
      )
      .slice(0, 4),

    // 商工会議所：同じ都道府県 or 全国
    chamber: scored
      .filter((s) =>
        s.layer === "chamber" &&
        (!s.prefecture || s.prefecture === company.prefecture)
      )
      .slice(0, 4),

    // 公的機関：同じ都道府県 or 全国
    other: scored
      .filter((s) =>
        s.layer === "other" &&
        (!s.prefecture || s.prefecture === company.prefecture)
      )
      .slice(0, 4),
  };
}
