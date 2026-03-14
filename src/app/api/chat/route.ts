import { NextResponse } from "next/server";
import { callClaude } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { system, userMessage } = await req.json();

    const text = await callClaude(system, userMessage);

    return NextResponse.json({ text });
  } catch (e) {
    console.error("Chat error:", e);
    return NextResponse.json({ text: "" }, { status: 500 });
  }
}
