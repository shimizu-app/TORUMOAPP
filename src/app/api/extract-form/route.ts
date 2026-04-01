import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const subsidyName = formData.get("subsidyName") as string;

    if (!file) {
      return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const text = new TextDecoder("utf-8").decode(buffer);

    const prompt = `以下は補助金「${subsidyName}」の申請書ファイルのテキストです。
記入が必要な項目を全て抽出してJSON配列で返してください。

各要素:
{
  "id": "s1",
  "label": "項目名",
  "sub": "何を書くべきかの説明",
  "required": true/false,
  "hint": "この項目で採択率を上げるためのポイント（1〜2文）"
}

ファイル内容:
${text.slice(0, 3000)}`;

    const result = await model.generateContent(prompt);
    const sections = JSON.parse(result.response.text());

    return NextResponse.json({ sections, source: "extracted" });
  } catch (e) {
    console.error("Extract form error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
