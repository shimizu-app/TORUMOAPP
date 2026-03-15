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

const MAJOR_CITIES: { city: string; pref: string }[] = [
  { city: "札幌市",     pref: "北海道" },
  { city: "仙台市",     pref: "宮城県" },
  { city: "さいたま市", pref: "埼玉県" },
  { city: "千葉市",     pref: "千葉県" },
  { city: "横浜市",     pref: "神奈川県" },
  { city: "川崎市",     pref: "神奈川県" },
  { city: "名古屋市",   pref: "愛知県" },
  { city: "京都市",     pref: "京都府" },
  { city: "大阪市",     pref: "大阪府" },
  { city: "神戸市",     pref: "兵庫県" },
  { city: "広島市",     pref: "広島県" },
  { city: "福岡市",     pref: "福岡県" },
  { city: "北九州市",   pref: "福岡県" },
  { city: "那覇市",     pref: "沖縄県" },
  { city: "新宿区",     pref: "東京都" },
  { city: "渋谷区",     pref: "東京都" },
  { city: "千代田区",   pref: "東京都" },
  { city: "静岡市",     pref: "静岡県" },
  { city: "浜松市",     pref: "静岡県" },
  { city: "岡山市",     pref: "岡山県" },
  { city: "熊本市",     pref: "熊本県" },
  { city: "鹿児島市",   pref: "鹿児島県" },
  { city: "宇都宮市",   pref: "栃木県" },
  { city: "金沢市",     pref: "石川県" },
  { city: "松山市",     pref: "愛媛県" },
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

  // タイトル・概要・対象者・経費を横断してタグ付け
  const tags: string[] = [];
  const searchText = [
    s.title || "",
    s.summary || "",
    s.target_number_of_employees || "",
    s.subsidy_expense || "",
  ].join(" ").toLowerCase();

  // IT・DX
  if (searchText.includes("it") || searchText.includes("デジタル") || searchText.includes("dx")
    || searchText.includes("ict") || searchText.includes("クラウド") || searchText.includes("システム"))
    tags.push("IT化", "DX", "デジタル");
  if (searchText.includes("クラウド") || searchText.includes("saas"))
    tags.push("クラウド", "SaaS");

  // 設備投資
  if (searchText.includes("設備") || searchText.includes("機械") || searchText.includes("装置"))
    tags.push("設備投資");
  if (searchText.includes("設備更新") || searchText.includes("老朽"))
    tags.push("設備更新");

  // 省エネ・GX
  if (searchText.includes("省エネ") || searchText.includes("gx") || searchText.includes("環境")
    || searchText.includes("脱炭素") || searchText.includes("カーボン"))
    tags.push("省エネ", "GX", "カーボンニュートラル");
  if (searchText.includes("nedo"))
    tags.push("NEDO");

  // 雇用
  if (searchText.includes("雇用") || searchText.includes("採用") || searchText.includes("人材")
    || searchText.includes("正社員") || searchText.includes("賃金") || searchText.includes("労働"))
    tags.push("雇用");
  if (searchText.includes("正社員化") || searchText.includes("キャリアアップ"))
    tags.push("正社員化");

  // 販路開拓
  if (searchText.includes("販路") || searchText.includes("ec") || searchText.includes("販売")
    || searchText.includes("展示会") || searchText.includes("マーケティング"))
    tags.push("販路開拓");
  if (searchText.includes("ec") || searchText.includes("eコマース") || searchText.includes("ネットショップ"))
    tags.push("EC");

  // 創業・事業承継
  if (searchText.includes("創業") || searchText.includes("起業") || searchText.includes("スタートアップ"))
    tags.push("創業");
  if (searchText.includes("事業承継") || searchText.includes("後継者") || searchText.includes("引継"))
    tags.push("事業承継");
  if (searchText.includes("事業転換") || searchText.includes("再構築"))
    tags.push("事業転換");

  // 製造業
  if (searchText.includes("ものづくり") || searchText.includes("製造") || searchText.includes("工場"))
    tags.push("製造業", "ものづくり");
  if (searchText.includes("iot") || searchText.includes("センサー") || searchText.includes("自動化"))
    tags.push("IoT活用");

  // 業種特化
  if (searchText.includes("小規模"))
    tags.push("小規模事業者");
  if (searchText.includes("介護") || searchText.includes("福祉"))
    tags.push("福祉", "介護");
  if (searchText.includes("医療") || searchText.includes("病院") || searchText.includes("診療所"))
    tags.push("医療");
  if (searchText.includes("建設") || searchText.includes("建築") || searchText.includes("土木"))
    tags.push("建設");
  if (searchText.includes("物流") || searchText.includes("運送") || searchText.includes("トラック"))
    tags.push("物流");
  if (searchText.includes("飲食") || searchText.includes("宿泊") || searchText.includes("観光"))
    tags.push("販路開拓", "小規模事業者");
  if (searchText.includes("海外") || searchText.includes("輸出") || searchText.includes("グローバル"))
    tags.push("海外展開", "グローバル");

  // 生産性
  if (searchText.includes("生産性") || searchText.includes("効率化") || searchText.includes("業務改善"))
    tags.push("生産性", "効率化");

  // 重複排除
  const uniqueTags = Array.from(new Set(tags));
  if (uniqueTags.length === 0) uniqueTags.push("中小企業支援");

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
    tags: uniqueTags,
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
    for (const { city, pref } of MAJOR_CITIES) {
      await new Promise((r) => setTimeout(r, 300));
      const items = await fetchFromJgrants(city, 20);
      const cityOnly = items.filter(
        (s: any) => s.target_area_search && s.target_area_search.includes(city)
      );
      cityRecords.push(
        ...cityOnly.map((s: any) => transformSubsidy(s, "city", pref, city))
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
