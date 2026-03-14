import { createClient } from "@/lib/supabase/client";
import type { Company, Subsidy, SubsidiesByLayer } from "@/types";

export async function matchSubsidies(company: Company): Promise<SubsidiesByLayer> {
  const supabase = createClient();

  // 1. DBから候補を取得（条件マッチング）
  const { data: allSubsidies } = await supabase
    .from("subsidies")
    .select("*")
    .eq("is_active", true);

  if (!allSubsidies || allSubsidies.length === 0) {
    return { national: [], prefecture: [], city: [], chamber: [], other: [] };
  }

  // 2. スコアリング
  const scored = allSubsidies
    .map((s) => {
      let score = s.score_base || 60;

      // 業種マッチ
      if (s.tags?.some((t: string) => company.industry?.includes(t))) score += 10;

      // 地域マッチ
      if (s.prefecture === company.prefecture) score += 15;
      if (s.layer === "national") score += 0;

      // 課題マッチ
      const challengeMatches =
        company.challenges?.filter((c) =>
          s.tags?.some((t: string) => t.includes(c))
        ).length || 0;
      score += challengeMatches * 5;

      // 財務状況
      if (company.profit === "黒字") score += 5;
      if (company.profit === "赤字") score -= 10;

      // 申請経験
      if (company.subsidyExp === "過去に採択あり") score += 8;
      if (company.subsidyExp === "複数回採択あり") score += 12;

      // 締切日から残り日数を計算
      const deadline = s.deadline_date
        ? Math.ceil(
            (new Date(s.deadline_date).getTime() - Date.now()) / 86400000
          )
        : 90;

      // DB形式をフロントエンド形式に変換
      return {
        id: s.id,
        name: s.name,
        org: s.org,
        layer: s.layer,
        maxAmount: s.max_amount || "",
        rate: s.rate || "",
        deadline,
        score: Math.min(score, 95),
        status: deadline <= 0 ? "終了" : score >= 70 ? "高" : score >= 50 ? "中" : "低",
        summary: s.summary,
        strategy: s.strategy,
        nameIdeas: s.name_ideas,
        tags: s.tags,
        eligible: s.eligible,
        expense: s.expense,
        difficulty: s.difficulty,
        url: s.url,
        form_url: s.form_url,
        sections: s.sections,
        prefecture: s.prefecture,
      } as Subsidy;
    })
    .filter((s) => s.deadline > 0)
    .sort((a, b) => b.score - a.score);

  // 3. レイヤー別に整理
  return {
    national: scored.filter((s) => s.layer === "national").slice(0, 4),
    prefecture: scored
      .filter(
        (s) =>
          s.layer === "prefecture" &&
          (!s.prefecture || s.prefecture === company.prefecture)
      )
      .slice(0, 4),
    city: scored.filter((s) => s.layer === "city").slice(0, 4),
    chamber: scored.filter((s) => s.layer === "chamber").slice(0, 4),
    other: scored.filter((s) => s.layer === "other").slice(0, 4),
  };
}
