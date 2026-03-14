import { NextResponse } from "next/server";
import { callClaude } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { subsidyName, sectionLabel, sectionSub, nameIdea, company } = await req.json();

    const text = await callClaude(
      `あなたは${subsidyName}の申請書専門家です。「${sectionLabel}」セクションで書くべき内容を、企業情報をもとに3点のヒントで教えてください。`,
      `企業情報:${JSON.stringify(company)}\n申請名目:${nameIdea}\n\n「${sectionLabel}」(${sectionSub})に書くべき内容を3点、箇条書きで簡潔に。`
    );

    return NextResponse.json({ text });
  } catch (e) {
    console.error("Wizard hint error:", e);
    return NextResponse.json({ text: "" }, { status: 500 });
  }
}
