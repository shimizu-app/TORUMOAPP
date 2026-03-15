import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const MAJOR_CITIES = [
  "札幌市","仙台市","さいたま市","千葉市","横浜市","川崎市",
  "名古屋市","京都市","大阪市","神戸市","広島市","福岡市",
  "北九州市","那覇市","東京都千代田区","東京都新宿区",
];

async function fetchFromJgrants(area: string, limit = 50): Promise<any[]> {
  try {
    const url = new URL("https://api.jgrants-portal.go.jp/exp/v1/public/subsidies");
    url.searchParams.set("target_area_search", area);
    url.searchParams.set("acceptance", "1");
    url.searchParams.set("sort", "acceptance_end_datetime");
    url.searchParams.set("order", "ASC");
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.result || [];
  } catch (e) {
    console.error(`Jgrants fetch error (${area}):`, e);
    return [];
  }
}

function transformSubsidy(
  s: any,
  layer: string,
  prefecture?: string,
  city?: string
) {
  const endDate = s.acceptance_end_datetime
    ? new Date(s.acceptance_end_datetime).toISOString().split("T")[0]
    : null;

  const maxAmount = s.subsidy_max_limit
    ? s.subsidy_max_limit >= 10000
      ? `${Math.floor(s.subsidy_max_limit / 10000)}万円`
      : `${s.subsidy_max_limit}円`
    : "要確認";

  const tags: string[] = [];
  const title = (s.title || "").toLowerCase();
  if (title.includes("it") || title.includes("デジタル") || title.includes("dx"))
    tags.push("IT化", "DX", "デジタル");
  if (title.includes("設備") || title.includes("機械")) tags.push("設備投資");
  if (title.includes("省エネ") || title.includes("gx") || title.includes("環境"))
    tags.push("省エネ", "GX");
  if (title.includes("雇用") || title.includes("採用") || title.includes("人材"))
    tags.push("雇用");
  if (title.includes("販路") || title.includes("ec") || title.includes("販売"))
    tags.push("販路開拓");
  if (title.includes("創業") || title.includes("起業")) tags.push("創業");
  if (title.includes("ものづくり") || title.includes("製造"))
    tags.push("製造業", "ものづくり");
  if (title.includes("小規模")) tags.push("小規模事業者");
  if (tags.length === 0) tags.push("中小企業支援");

  return {
    jgrants_id: s.id,
    name: s.title || "不明",
    org: s.government_agencies || "主管機関",
    layer,
    prefecture: prefecture || null,
    city: city || null,
    max_amount: maxAmount,
    rate: s.subsidy_rate || "要確認",
    deadline_date: endDate,
    score_base: 60,
    status: "公募中",
    summary: s.summary || s.title || "",
    strategy: null,
    name_ideas: null,
    tags,
    eligible: s.target_number_of_employees || "中小企業・小規模事業者",
    expense: s.subsidy_expense || "要確認",
    difficulty: "中",
    sections: null,
    url:
      s.acceptance_url ||
      `https://jgrants-portal.go.jp/subsidy/${s.id}`,
    is_active: true,
    last_synced_at: new Date().toISOString(),
  };
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  let totalUpserted = 0;

  try {
    // 1. 全国
    console.log("Fetching national subsidies...");
    const national = await fetchFromJgrants("全国", 100);
    const nationalRecords = national.map((s) =>
      transformSubsidy(s, "national")
    );

    // 2. 都道府県ごと
    const prefRecords: ReturnType<typeof transformSubsidy>[] = [];
    for (const pref of PREFECTURES) {
      await new Promise((r) => setTimeout(r, 200));
      const items = await fetchFromJgrants(pref, 30);
      const prefOnly = items.filter(
        (s) =>
          s.target_area_search && !s.target_area_search.includes("全国")
      );
      prefRecords.push(
        ...prefOnly.map((s) => transformSubsidy(s, "prefecture", pref))
      );
    }

    // 3. 主要都市
    const cityRecords: ReturnType<typeof transformSubsidy>[] = [];
    for (const city of MAJOR_CITIES) {
      await new Promise((r) => setTimeout(r, 200));
      const items = await fetchFromJgrants(city, 20);
      const cityOnly = items.filter(
        (s) => s.target_area_search && s.target_area_search.includes(city)
      );
      const pref = PREFECTURES.find((p) =>
        city.includes(p.replace(/[都道府県]/, "").slice(0, 2))
      );
      cityRecords.push(
        ...cityOnly.map((s) => transformSubsidy(s, "city", pref, city))
      );
    }

    // 4. Supabase に upsert
    const allRecords = [
      ...nationalRecords,
      ...prefRecords,
      ...cityRecords,
    ];
    if (allRecords.length > 0) {
      const { error } = await supabase
        .from("subsidies")
        .upsert(allRecords, {
          onConflict: "jgrants_id",
          ignoreDuplicates: false,
        });
      if (error) console.error("Upsert error:", error);
      else totalUpserted = allRecords.length;
    }

    // 5. 期限切れを無効化
    await supabase
      .from("subsidies")
      .update({ is_active: false })
      .lt("deadline_date", new Date().toISOString().split("T")[0]);

    console.log(`Sync complete: ${totalUpserted} records upserted`);
    return NextResponse.json({ success: true, upserted: totalUpserted });
  } catch (e) {
    console.error("Batch sync error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
