import { NextResponse } from "next/server";
import { callClaude } from "@/lib/anthropic";
import { MATCH_SYS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const { company, layerDesc } = await req.json();

    const text = await callClaude(
      MATCH_SYS,
      `企業情報:${company}\n\n${layerDesc}補助金を4件、JSON配列のみで返してください。`
    );

    return NextResponse.json({ text });
  } catch (e) {
    console.error("Matching error:", e);
    return NextResponse.json({ text: "[]" }, { status: 500 });
  }
}
