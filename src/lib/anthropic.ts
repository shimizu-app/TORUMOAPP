import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default anthropic;

export async function callClaude(system: string, userMessage: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: userMessage }],
    });
    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  } catch (e) {
    console.error("Claude API error:", e);
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
