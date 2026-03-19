import { NextResponse } from "next/server";
import { callAI } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { subsidyName, sectionLabel, sectionId, sectionSub, nameIdea, company, length, wizardAnswer, policyBackground } =
      await req.json();

    const len =
      length === "簡潔" ? "200字程度" : length === "標準" ? "400字程度" : "700字程度";

    const systemPrompt = `あなたは補助金申請書の専門家です。
「${sectionLabel}」を${len}で書いてください。
政策背景: ${policyBackground || ""}
申請名目: ${nameIdea}

以下のルールを守ること:
・具体的な数字・固有名詞を必ず入れる
・「革新性」「実現可能性」を意識した表現にする
・申請者の補足情報がある場合は最優先で反映する
・採択されやすい説得力のある文章にする
${sectionId === "finance" ? "・特にキャッシュフローと投資回収期間を具体的に記載すること" : ""}`;

    const userPrompt = `補助金: ${subsidyName}
企業情報: ${JSON.stringify(company, null, 2)}
${wizardAnswer ? `\n【申請者からの補足情報（最優先で反映すること）】\n${wizardAnswer}` : ""}

「${sectionLabel}」（${sectionSub || ""}）を${len}で作成してください。`;

    const text = await callAI(systemPrompt, userPrompt);

    return NextResponse.json({ text });
  } catch (e) {
    console.error("Draft error:", e);
    return NextResponse.json({ text: "" }, { status: 500 });
  }
}
