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

// 主要市（県との対応付き）
const MAJOR_CITIES: { city: string; pref: string }[] = [
  { city: "札幌市", pref: "北海道" },
  { city: "仙台市", pref: "宮城県" },
  { city: "さいたま市", pref: "埼玉県" },
  { city: "千葉市", pref: "千葉県" },
  { city: "横浜市", pref: "神奈川県" },
  { city: "川崎市", pref: "神奈川県" },
  { city: "名古屋市", pref: "愛知県" },
  { city: "豊橋市", pref: "愛知県" },
  { city: "豊田市", pref: "愛知県" },
  { city: "岡崎市", pref: "愛知県" },
  { city: "京都市", pref: "京都府" },
  { city: "大阪市", pref: "大阪府" },
  { city: "堺市", pref: "大阪府" },
  { city: "神戸市", pref: "兵庫県" },
  { city: "広島市", pref: "広島県" },
  { city: "福岡市", pref: "福岡県" },
  { city: "北九州市", pref: "福岡県" },
  { city: "那覇市", pref: "沖縄県" },
  { city: "新宿区", pref: "東京都" },
  { city: "渋谷区", pref: "東京都" },
  { city: "千代田区", pref: "東京都" },
  { city: "港区", pref: "東京都" },
  { city: "静岡市", pref: "静岡県" },
  { city: "浜松市", pref: "静岡県" },
  { city: "岡山市", pref: "岡山県" },
  { city: "熊本市", pref: "熊本県" },
  { city: "鹿児島市", pref: "鹿児島県" },
  { city: "宇都宮市", pref: "栃木県" },
  { city: "金沢市", pref: "石川県" },
  { city: "松山市", pref: "愛媛県" },
  { city: "高松市", pref: "香川県" },
  { city: "高知市", pref: "高知県" },
  { city: "長崎市", pref: "長崎県" },
  { city: "大分市", pref: "大分県" },
  { city: "宮崎市", pref: "宮崎県" },
  { city: "前橋市", pref: "群馬県" },
  { city: "高崎市", pref: "群馬県" },
  { city: "水戸市", pref: "茨城県" },
  { city: "つくば市", pref: "茨城県" },
  { city: "盛岡市", pref: "岩手県" },
  { city: "青森市", pref: "青森県" },
  { city: "秋田市", pref: "秋田県" },
  { city: "山形市", pref: "山形県" },
  { city: "福島市", pref: "福島県" },
  { city: "郡山市", pref: "福島県" },
  { city: "いわき市", pref: "福島県" },
  { city: "新潟市", pref: "新潟県" },
  { city: "富山市", pref: "富山県" },
  { city: "福井市", pref: "福井県" },
  { city: "甲府市", pref: "山梨県" },
  { city: "長野市", pref: "長野県" },
  { city: "松本市", pref: "長野県" },
  { city: "岐阜市", pref: "岐阜県" },
  { city: "津市", pref: "三重県" },
  { city: "四日市市", pref: "三重県" },
  { city: "大津市", pref: "滋賀県" },
  { city: "奈良市", pref: "奈良県" },
  { city: "和歌山市", pref: "和歌山県" },
  { city: "鳥取市", pref: "鳥取県" },
  { city: "松江市", pref: "島根県" },
  { city: "倉敷市", pref: "岡山県" },
  { city: "福山市", pref: "広島県" },
  { city: "下関市", pref: "山口県" },
  { city: "徳島市", pref: "徳島県" },
  { city: "高松市", pref: "香川県" },
  { city: "佐賀市", pref: "佐賀県" },
];

// キーワードでJ-Grantsから取得（ページング対応）
async function fetchByKeyword(keyword: string, maxRecords = 200): Promise<any[]> {
  const results: any[] = [];
  const limit = 100;
  let offset = 0;

  while (results.length < maxRecords) {
    try {
      const url = new URL("https://api.jgrants-portal.go.jp/exp/v1/public/subsidies");
      url.searchParams.set("keyword", keyword);
      url.searchParams.set("acceptance", "1");
      url.searchParams.set("sort", "acceptance_end_datetime");
      url.searchParams.set("order", "ASC");
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("offset", String(offset));

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) break;
      const data = await res.json();
      const items = data.result || [];
      if (items.length === 0) break;

      results.push(...items);
      offset += limit;
      if (items.length < limit) break;

      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.error(`Fetch error (keyword=${keyword}, offset=${offset}):`, e);
      break;
    }
  }

  return results;
}

function buildTags(s: any): string[] {
  const tags: string[] = [];
  const text = [
    s.title || "",
    s.summary || "",
    s.target_number_of_employees || "",
    s.subsidy_expense || "",
  ].join(" ").toLowerCase();

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

function classifyLayer(s: any, sourcePref?: string, sourceCity?: string): {
  layer: string;
  prefecture: string | null;
  city: string | null;
} {
  const targetArea = s.target_area_search || "";

  // 市区町村キーワードで取得した場合
  if (sourceCity && sourcePref) {
    return { layer: "city", prefecture: sourcePref, city: sourceCity };
  }

  // 都道府県キーワードで取得した場合
  if (sourcePref) {
    // target_areaに市区町村が含まれていればcity
    const prefRemoved = targetArea.replace(sourcePref, "").trim();
    const isCityLevel = prefRemoved.length > 0 && (
      prefRemoved.includes("市") || prefRemoved.includes("区") ||
      prefRemoved.includes("町") || prefRemoved.includes("村")
    );
    if (isCityLevel) {
      return { layer: "city", prefecture: sourcePref, city: prefRemoved.split(/[\/、,]/)[0].trim() || null };
    }
    return { layer: "prefecture", prefecture: sourcePref, city: null };
  }

  // 全国キーワードで取得した場合: target_areaで判定
  if (!targetArea || targetArea.includes("全国") || targetArea === "") {
    return { layer: "national", prefecture: null, city: null };
  }

  const matchedPref = PREFECTURES.find(p => targetArea.includes(p));
  if (!matchedPref) return { layer: "national", prefecture: null, city: null };

  const prefRemoved = targetArea.replace(matchedPref, "").trim();
  const isCityLevel = prefRemoved.length > 0 && (
    prefRemoved.includes("市") || prefRemoved.includes("区") ||
    prefRemoved.includes("町") || prefRemoved.includes("村")
  );

  return {
    layer: isCityLevel ? "city" : "prefecture",
    prefecture: matchedPref,
    city: isCityLevel ? (prefRemoved.split(/[\/、,]/)[0].trim() || null) : null,
  };
}

function transformSubsidy(s: any, sourcePref?: string, sourceCity?: string) {
  const { layer, prefecture, city } = classifyLayer(s, sourcePref, sourceCity);

  const endDate = s.acceptance_end_datetime
    ? new Date(s.acceptance_end_datetime).toISOString().split("T")[0]
    : null;

  const maxAmount = s.subsidy_max_limit
    ? s.subsidy_max_limit >= 10000
      ? `${Math.floor(s.subsidy_max_limit / 10000)}万円`
      : `${s.subsidy_max_limit}円`
    : "要確認";

  return {
    jgrants_id: s.id,
    name: s.title || "不明",
    org: s.government_agencies || "主管機関",
    layer,
    prefecture,
    city,
    target_area: s.target_area_search || "全国",
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

async function upsertChunked(supabase: any, records: any[]) {
  const CHUNK = 100;
  let total = 0;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("subsidies")
      .upsert(chunk, { onConflict: "jgrants_id", ignoreDuplicates: false });
    if (error) console.error(`Upsert error:`, error);
    else total += chunk.length;
  }
  return total;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const seenIds = new Set<string>();
  let totalUpserted = 0;

  try {
    // ── 1. 全国系キーワードで国の補助金を取得 ──
    console.log("=== STEP 1: 全国系キーワード ===");
    const nationalKeywords = [
      "補助金", "助成金", "支援", "ものづくり", "IT導入",
      "事業再構築", "省エネ", "雇用調整", "キャリアアップ",
      "DX", "GX", "創業", "事業承継",
    ];
    const nationalRecords: any[] = [];
    for (const kw of nationalKeywords) {
      const items = await fetchByKeyword(kw, 200);
      let added = 0;
      for (const item of items) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          nationalRecords.push(transformSubsidy(item));
          added++;
        }
      }
      console.log(`  "${kw}": ${items.length}件取得 → ${added}件新規`);
      await new Promise(r => setTimeout(r, 300));
    }
    console.log(`全国系合計: ${nationalRecords.length}件`);
    totalUpserted += await upsertChunked(supabase, nationalRecords);

    // ── 2. 都道府県名キーワードで県の補助金を取得 ──
    console.log("=== STEP 2: 都道府県キーワード ===");
    const prefRecords: any[] = [];
    for (const pref of PREFECTURES) {
      const items = await fetchByKeyword(pref, 100);
      let added = 0;
      for (const item of items) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          prefRecords.push(transformSubsidy(item, pref));
          added++;
        }
      }
      if (items.length > 0) {
        console.log(`  ${pref}: ${items.length}件取得 → ${added}件新規`);
      }
      await new Promise(r => setTimeout(r, 300));
    }
    console.log(`都道府県系合計: ${prefRecords.length}件`);
    totalUpserted += await upsertChunked(supabase, prefRecords);

    // ── 3. 市名キーワードで市の補助金を取得 ──
    console.log("=== STEP 3: 市名キーワード ===");
    const cityRecords: any[] = [];
    for (const { city, pref } of MAJOR_CITIES) {
      const items = await fetchByKeyword(city, 50);
      let added = 0;
      for (const item of items) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          cityRecords.push(transformSubsidy(item, pref, city));
          added++;
        }
      }
      if (items.length > 0) {
        console.log(`  ${city}: ${items.length}件取得 → ${added}件新規`);
      }
      await new Promise(r => setTimeout(r, 300));
    }
    console.log(`市区町村系合計: ${cityRecords.length}件`);
    totalUpserted += await upsertChunked(supabase, cityRecords);

    // ── 4. 期限切れを無効化 ──
    await supabase
      .from("subsidies")
      .update({ is_active: false })
      .lt("deadline_date", new Date().toISOString().split("T")[0])
      .not("deadline_date", "is", null);

    // ── 5. DB件数確認 ──
    const { data: stats } = await supabase
      .from("subsidies")
      .select("layer")
      .eq("is_active", true);

    const dbStats = (stats || []).reduce((acc: any, r: any) => {
      acc[r.layer] = (acc[r.layer] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n=== 完了: ${totalUpserted}件 ===`);
    console.log("DB stats:", dbStats);

    return NextResponse.json({
      success: true,
      upserted: totalUpserted,
      dbStats,
    });
  } catch (e) {
    console.error("Batch sync error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
