import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function callAI(system: string, userMessage: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: system,
    });
    const result = await model.generateContent(userMessage);
    return result.response.text();
  } catch (e) {
    console.error("Gemini API error:", e);
    return "";
  }
}

export function safeJSON<T = unknown[]>(text: string): T {
  if (!text) return [] as unknown as T;
  const s = text.indexOf("[");
  const e = text.lastIndexOf("]");
  if (s === -1 || e <= s) return [] as unknown as T;
  try {
    const r = JSON.parse(text.slice(s, e + 1));
    return Array.isArray(r) ? (r as unknown as T) : ([] as unknown as T);
  } catch {
    return [] as unknown as T;
  }
}
