import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// J-Grants APIは keyword AND target_area_search のAND検索。
// 1つのキーワードでは網羅できないため、複数キーワードで叩いてマージする。
const KEYWORDS = [
  "補助金", "助成", "支援", "設備", "雇用", "中小", "事業",
  "IT", "デジタル", "省エネ", "創業", "販路",
];

async function fetchFromJgrants(keyword: string, area?: string, limit = 100): Promise<any[]> {
  try {
    const url = new URL("https://api.jgrants-portal.go.jp/exp/v1/public/subsidies");
    url.searchParams.set("keyword", keyword);
    if (area) url.searchParams.set("target_area_search", area);
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
    console.error(`Jgrants fetch error (kw=${keyword}, area=${area}):`, e);
    return [];
  }
}

async function fetchAllForArea(area?: string): Promise<any[]> {
  const seen = new Map<string, any>();
  for (const kw of KEYWORDS) {
    await new Promise((r) => setTimeout(r, 200));
    const items = await fetchFromJgrants(kw, area, 100);
    for (const item of items) {
      if (!seen.has(item.id)) seen.set(item.id, item);
    }
  }
  return Array.from(seen.values());
}

function buildTags(s: any): string[] {
  const tags: string[] = [];
  const text = [s.title || "", s.summary || "", s.target_number_of_employees || "", s.subsidy_expense || ""].join(" ").toLowerCase();

  if (text.includes("it") || text.includes("デジタル") || text.includes("dx") || text.includes("クラウド") || text.includes("システム")) tags.push("IT化", "DX", "デジタル");
  if (text.includes("設備") || text.includes("機械") || text.includes("装置")) tags.push("設備投資");
  if (text.includes("設備更新") || text.includes("老朽")) tags.push("設備更新");
  if (text.includes("省エネ") || text.includes("gx") || text.includes("脱炭素") || text.includes("カーボン")) tags.push("省エネ", "GX");
  if (text.includes("雇用") || text.includes("採用") || text.includes("人材") || text.includes("賃金")) tags.push("雇用");
  if (text.includes("正社員") || text.includes("キャリアアップ")) tags.push("正社員化");
  if (text.includes("販路") || text.includes("展示会") || text.includes("マーケティング")) tags.push("販路開拓");
  if (text.includes("ec") || text.includes("eコマース")) tags.push("EC");
  if (text.includes("創業") || text.includes("起業") || text.includes("スタートアップ")) tags.push("創業");
  if (text.includes("事業承継") || text.includes("後継者")) tags.push("事業承継");
  if (text.includes("事業転換") || text.includes("再構築")) tags.push("事業転換");
  if (text.includes("ものづくり") || text.includes("製造") || text.includes("工場")) tags.push("製造業", "ものづくり");
  if (text.includes("iot") || text.includes("自動化")) tags.push("IoT活用");
  if (text.includes("小規模")) tags.push("小規模事業者");
  if (text.includes("介護") || text.includes("福祉")) tags.push("福祉", "介護");
  if (text.includes("医療") || text.includes("病院")) tags.push("医療");
  if (text.includes("建設") || text.includes("建築") || text.includes("土木")) tags.push("建設");
  if (text.includes("物流") || text.includes("運送")) tags.push("物流");
  if (text.includes("海外") || text.includes("輸出")) tags.push("海外展開");
  if (text.includes("生産性") || text.includes("効率化")) tags.push("生産性", "効率化");

  const unique = Array.from(new Set(tags));
  return unique.length > 0 ? unique : ["中小企業支援"];
}

function determineLayer(targetArea: string): string {
  if (targetArea === "全国") return "national";
  if (targetArea.includes("市") || targetArea.includes("区") || targetArea.includes("町") || targetArea.includes("村")) return "city";
  return "prefecture";
}

function extractPrefecture(targetArea: string): string | null {
  const prefList = [
    "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
    "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
    "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
    "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
    "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
    "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
    "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
  ];
  for (const p of prefList) {
    if (targetArea.includes(p)) return p;
  }
  return null;
}

function transformSubsidy(s: any) {
  const endDate = s.acceptance_end_datetime
    ? new Date(s.acceptance_end_datetime).toISOString().split("T")[0]
    : null;
  const maxAmount = s.subsidy_max_limit
    ? s.subsidy_max_limit >= 10000
      ? `${Math.floor(s.subsidy_max_limit / 10000)}万円`
      : `${s.subsidy_max_limit}円`
    : "要確認";

  const targetArea = s.target_area_search || "全国";
  const layer = determineLayer(targetArea);
  const prefecture = extractPrefecture(targetArea);

  return {
    jgrants_id: s.id,
    name: s.title || "不明",
    org: s.government_agencies || "主管機関",
    layer,
    prefecture,
    target_area: targetArea,
    max_amount: maxAmount,
    rate: s.subsidy_rate || "要確認",
    deadline_date: endDate,
    score_base: 60,
    status: "公募中",
    summary: s.summary || s.title || "",
    strategy: null,
    name_ideas: null,
    tags: buildTags(s),
    eligible: s.target_number_of_employees || "中小企業・小規模事業者",
    expense: s.subsidy_expense || "要確認",
    difficulty: "中",
    sections: null,
    url: s.acceptance_url || `https://jgrants-portal.go.jp/subsidy/${s.id}`,
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
    const allItems = await fetchAllForArea(undefined);
    const allRecords = allItems.map(transformSubsidy);

    if (allRecords.length > 0) {
      const CHUNK = 100;
      for (let i = 0; i < allRecords.length; i += CHUNK) {
        const chunk = allRecords.slice(i, i + CHUNK);
        const { error } = await supabase
          .from("subsidies")
          .upsert(chunk, { onConflict: "jgrants_id", ignoreDuplicates: false });
        if (error) console.error(`Upsert error (chunk ${i}):`, error);
        else totalUpserted += chunk.length;
      }
    }

    await supabase
      .from("subsidies")
      .update({ is_active: false })
      .lt("deadline_date", new Date().toISOString().split("T")[0])
      .not("deadline_date", "is", null);

    console.log(`Sync complete: ${totalUpserted} records`);
    return NextResponse.json({ success: true, upserted: totalUpserted });
  } catch (e) {
    console.error("Batch sync error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
