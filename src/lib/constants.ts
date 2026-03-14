/* ─── カラー ─── */
export const G = "#10B981";
export const GD = "#059669";
export const GL = "#D1FAE5";
export const GL2 = "#ECFDF5";
export const GRAD = "linear-gradient(90deg,#10B981,#22C55E)";
export const BG = "#EEF2EF";
export const CARD = "#fff";
export const SOFT = "#F7FAF8";
export const T1 = "#0A0F0A";
export const T2 = "#475569";
export const T3 = "#94A3B8";
export const BD = "#E2E8F0";
export const SH = "0 4px 20px rgba(15,23,42,0.06)";
export const SHG = "0 8px 24px rgba(16,185,129,0.22)";
export const ORG = "#F97316";
export const ORGL = "#FFF4ED";
export const ORGD = "#C2510A";

/* ─── マッチングプロンプト ─── */
export const MATCH_SYS = `補助金マッチングAIです。企業情報を受け取り、補助金を4件提案してください。
JSON配列のみを返してください。説明文やコードブロックは不要です。
各要素: name, org, maxAmount("500万円"形式), rate("1/2"形式), deadline(数値), score(50-92の数値), status("高"/"中"/"低"), summary(概要2文), strategy(戦略1文), nameIdeas([{label:"攻め",text:""},{label:"標準",text:""},{label:"確実",text:""}]), tags([3つ]), eligible, expense, difficulty("低"/"中"/"高"), reason(1文), url, sections([{id,label,sub} 3-5件])`;
