import { NextResponse } from "next/server";
import { callAI } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { system, userMessage } = await req.json();

    const text = await callAI(system, userMessage);

    return NextResponse.json({ text });
  } catch (e) {
    console.error("Chat error:", e);
    return NextResponse.json({ text: "" }, { status: 500 });
  }
}
