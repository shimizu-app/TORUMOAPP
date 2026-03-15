import { NextResponse } from "next/server";
import { createServerSupabaseClient as createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  // 全件カウント
  const { count: totalCount } = await supabase
    .from("subsidies")
    .select("*", { count: "exact", head: true });

  // アクティブ＆期限内
  const { count: activeCount } = await supabase
    .from("subsidies")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .gte("deadline_date", today);

  // レイヤー別カウント
  const { data: allActive } = await supabase
    .from("subsidies")
    .select("layer, prefecture, city, name")
    .eq("is_active", true)
    .gte("deadline_date", today);

  const layers: Record<string, number> = {};
  const prefectures: Record<string, number> = {};
  const cities: Record<string, number> = {};

  (allActive || []).forEach((s) => {
    layers[s.layer] = (layers[s.layer] || 0) + 1;
    if (s.prefecture) prefectures[s.prefecture] = (prefectures[s.prefecture] || 0) + 1;
    if (s.city) cities[s.city] = (cities[s.city] || 0) + 1;
  });

  return NextResponse.json({
    today,
    totalCount,
    activeCount,
    layers,
    prefectures,
    cities,
    subsidies: (allActive || []).map((s) => ({
      name: s.name,
      layer: s.layer,
      prefecture: s.prefecture,
      city: s.city,
    })),
  });
}
