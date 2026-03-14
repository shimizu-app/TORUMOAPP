import { NextResponse } from "next/server";
import { callClaude } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { subsidyName, sectionLabel, sectionId, nameIdea, company, length, wizardAnswer } =
      await req.json();

    const len =
      length === "簡潔" ? "200字程度" : length === "標準" ? "400字程度" : "700字程度";

    const cfInfo = company.cashflow
      ? `\nキャッシュフロー:${company.cashflow}\n借入状況:${company.borrowing || "不明"}`
      : "";
    const wizInfo = wizardAnswer ? `\n担当者の補足情報:${wizardAnswer}` : "";

    const text = await callClaude(
      `あなたは補助金申請書の専門家です。「${sectionLabel}」を${len}で書いてください。具体的な数字・事例を入れ採択されやすい文章にしてください。${sectionId === "finance" ? "特にキャッシュフローと資金調達計画を具体的に記載してください。" : ""}`,
      `補助金:${subsidyName}\n申請名目:${nameIdea}\n企業情報:${JSON.stringify(company, null, 2)}${cfInfo}${wizInfo}\n\n「${sectionLabel}」を${len}で作成してください。`
    );

    return NextResponse.json({ text });
  } catch (e) {
    console.error("Draft error:", e);
    return NextResponse.json({ text: "" }, { status: 500 });
  }
}
