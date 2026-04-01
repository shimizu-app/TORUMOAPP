import { createServerSupabaseClient as createClient } from "@/lib/supabase/server";
import type { Company, Subsidy, SubsidiesByLayer } from "@/types";

const UNIVERSAL_KEYWORDS = [
  "中小企業支援", "雇用", "正社員化", "採用", "人材育成",
  "創業", "事業転換", "事業承継", "生産性", "効率化", "設備投資",
];

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  "製造業":           ["製造業", "ものづくり", "設備", "DX", "IoT", "省エネ", "生産性", "設備更新", "自動化"],
  "IT・ソフトウェア":  ["IT化", "DX", "デジタル", "クラウド", "システム", "SaaS", "IoT活用", "EC"],
  "小売・卸売":       ["販路開拓", "EC", "デジタル", "小規模事業者", "IT化", "DX"],
  "医療・福祉":       ["医療", "福祉", "介護", "助成金", "雇用", "DX", "IT化"],
  "建設業":           ["設備投資", "建設", "DX", "省エネ", "IT化", "雇用"],
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

  // target_area で「全国 OR 企業の県 OR 企業の市」を含むものを取得
  const orConditions = ["target_area.ilike.%全国%"];
  if (company.prefecture) orConditions.push(`target_area.ilike.%${company.prefecture}%`);
  if (company.city) orConditions.push(`target_area.ilike.%${company.city}%`);

  const { data: allSubsidies, error } = await supabase
    .from("subsidies")
    .select("*")
    .eq("is_active", true)
    .gte("deadline_date", today)
    .or(orConditions.join(","));

  if (error || !allSubsidies || allSubsidies.length === 0) {
    console.error("Supabase fetch error:", error);
    return { national: [], prefecture: [], city: [], chamber: [], other: [] };
  }

  const scored = allSubsidies.map((s) => {
    let score = s.score_base || 60;
    const tags = (s.tags as string[]) || [];
    const targetArea = (s.target_area || "").toLowerCase();

    // ① 業種マッチ
    const industryKw = INDUSTRY_KEYWORDS[company.industry || ""] || [];
    const indMatches = tags.filter((t) => industryKw.some((k) => t.includes(k))).length;
    score += indMatches * 8;

    const uniMatches = tags.filter((t) => UNIVERSAL_KEYWORDS.some((k) => t.includes(k))).length;
    score += uniMatches * 3;

    // ② 地域マッチ（target_area で判定）
    if (targetArea.includes("全国")) score += 5;
    if (company.prefecture && targetArea.includes(company.prefecture.toLowerCase())) score += 20;
    if (company.city && targetArea.includes(company.city.toLowerCase())) score += 30;

    // ③ 課題マッチ
    (company.challenges || []).forEach((ch: string) => {
      const ckw = CHALLENGE_KEYWORDS[ch] || [];
      const matches = tags.filter((t) => ckw.some((k) => t.includes(k))).length;
      score += matches * 6;
    });

    // ④ 財務
    if (company.profit === "黒字") score += 5;
    if (company.profit === "赤字") score -= 8;
    if (company.cashflow === "毎月プラス（安定）") score += 3;
    if (company.cashflow === "慢性的にマイナス") score -= 5;

    // ⑤ 申請経験
    if (company.subsidyExp === "複数回採択あり") score += 10;
    else if (company.subsidyExp === "過去に採択あり") score += 6;
    else if (company.subsidyExp === "初めて" && s.difficulty === "低") score += 8;

    // ⑥ 雇用
    if (company.employment === "増やす予定" && tags.some((t) => t.includes("雇用"))) score += 8;

    // ⑦ 認定
    if ((company.certifications || []).some((c: string) => c !== "なし")) score += 4;

    const deadline = s.deadline_date
      ? Math.ceil((new Date(s.deadline_date).getTime() - Date.now()) / 86400000)
      : 90;

    const normalizedScore = Math.min(95, Math.max(50, score));

    // layer を target_area から動的判定
    let layer = s.layer || "national";
    if (company.city && targetArea.includes(company.city.toLowerCase())) {
      layer = "city";
    } else if (company.prefecture && targetArea.includes(company.prefecture.toLowerCase()) && !targetArea.includes("全国")) {
      layer = "prefecture";
    }

    return {
      id: s.id,
      name: s.name,
      org: s.org,
      layer,
      maxAmount: s.max_amount || "",
      rate: s.rate || "",
      deadline,
      score: normalizedScore,
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
      target_area: s.target_area,
    } as Subsidy;
  })
  .filter((s) => s.deadline > 0)
  .sort((a, b) => b.score - a.score);

  return {
    national: scored
      .filter((s) => s.layer === "national")
      .slice(0, 4),
    prefecture: scored
      .filter((s) => s.layer === "prefecture")
      .slice(0, 4),
    city: scored
      .filter((s) => s.layer === "city")
      .slice(0, 4),
    chamber: scored
      .filter((s) => s.layer === "chamber")
      .slice(0, 4),
    other: scored
      .filter((s) => s.layer === "other")
      .slice(0, 4),
  };
}
