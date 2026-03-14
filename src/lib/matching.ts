import { createServerSupabaseClient as createClient } from "@/lib/supabase/server";
import type { Company, Subsidy, SubsidiesByLayer } from "@/types";
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  "製造業":           ["製造業", "ものづくり", "設備", "DX", "IoT", "省エネ", "生産性"],
  "IT・ソフトウェア":  ["IT化", "DX", "デジタル", "クラウド", "システム", "SaaS"],
  "小売・卸売":       ["販路開拓", "EC", "デジタル", "小規模事業者"],
  "医療・福祉":       ["医療", "福祉", "介護", "助成金", "雇用"],
  "建設業":           ["設備投資", "建設", "DX", "省エネ"],
  "運輸・物流":       ["物流", "DX", "省エネ", "設備", "IT化"],
  "飲食・宿泊":       ["販路開拓", "小規模事業者", "EC", "デジタル"],
  "その他":           ["創業", "販路開拓", "DX"],
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
    // ① 業種マッチ（最大 +24）
    const industryKw = INDUSTRY_KEYWORDS[company.industry || ""] || [];
    const indMatches = (s.tags as string[] || []).filter((t) =>
      industryKw.some((k) => t.includes(k))
    ).length;
    score += indMatches * 8;
    // ② 地域マッチ（最大 +20）
    if (["national", "chamber", "other"].includes(s.layer)) score += 5;
    if (s.prefecture && s.prefecture === company.prefecture) score += 20;
    if (s.layer === "city" && company.city && s.name.includes(company.city)) score += 15;
    // ③ 課題マッチ（最大 +30）
    (company.challenges || []).forEach((ch: string) => {
      const ckw = CHALLENGE_KEYWORDS[ch] || [];
      const matches = (s.tags as string[] || []).filter((t) =>
        ckw.some((k) => t.includes(k))
      ).length;
      score += matches * 6;
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
      if ((s.tags as string[] || []).some((t) => t.includes("雇用"))) score += 8;
    }
    // ⑦ 認定・受賞歴
    if ((company.certifications || []).some((c: string) => c !== "なし")) score += 4;
    const deadline = Math.ceil(
      (new Date(s.deadline_date).getTime() - Date.now()) / 86400000
    );
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
      status: normalizedScore >= 70 ? "高" : normalizedScore >= 55 ? "中" : "低",
      summary: s.summary,
      strategy: s.strategy,
      nameIdeas: typeof s.name_ideas === "string" ? JSON.parse(s.name_ideas) : s.name_ideas,
      tags: s.tags,
      eligible: s.eligible,
      expense: s.expense,
      difficulty: s.difficulty,
      url: s.url,
      form_url: s.form_url,
      sections: typeof s.sections === "string" ? JSON.parse(s.sections) : s.sections,
      prefecture: s.prefecture,
    } as Subsidy;
  })
  .filter((s) => s.deadline > 0)
  .sort((a, b) => b.score - a.score);
  return {
    national:   scored.filter((s) => s.layer === "national"),
    prefecture: scored.filter((s) =>
      s.layer === "prefecture" &&
      (!s.prefecture || s.prefecture === company.prefecture)
    ),
    city:     scored.filter((s) => s.layer === "city"),
    chamber:  scored.filter((s) => s.layer === "chamber"),
    other:    scored.filter((s) => s.layer === "other"),
  };
}
