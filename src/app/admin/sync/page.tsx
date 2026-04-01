"use client";

import { useState } from "react";

interface SyncResult {
  success: boolean;
  upserted?: number;
  stats?: Record<string, number>;
  logs?: string[];
  error?: string;
}

export default function AdminSyncPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const runSync = async () => {
    setRunning(true);
    setResult(null);
    setElapsed(0);

    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    try {
      const res = await fetch("/api/admin/sync-subsidies", {
        signal: AbortSignal.timeout(300000), // 5分タイムアウト
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ success: false, error: String(e) });
    } finally {
      clearInterval(timer);
      setElapsed(Math.floor((Date.now() - start) / 1000));
      setRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px", fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>J-Grants 同期管理</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        J-Grants APIから補助金データを取得してSupabaseに保存します。
        47都道府県分を順に取得するため2〜3分かかります。
      </p>

      <button
        onClick={runSync}
        disabled={running}
        style={{
          padding: "12px 32px",
          fontSize: 16,
          fontWeight: "bold",
          background: running ? "#999" : "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: running ? "wait" : "pointer",
        }}
      >
        {running ? `同期実行中... (${elapsed}秒)` : "同期を実行"}
      </button>

      {running && (
        <p style={{ marginTop: 16, color: "#f59e0b" }}>
          実行中です。ページを閉じないでください。（目安: 2〜3分）
        </p>
      )}

      {result && (
        <div style={{ marginTop: 24, padding: 20, background: result.success ? "#f0fdf4" : "#fef2f2", borderRadius: 8, border: `1px solid ${result.success ? "#86efac" : "#fca5a5"}` }}>
          <h2 style={{ fontSize: 18, marginBottom: 12, color: result.success ? "#166534" : "#991b1b" }}>
            {result.success ? `完了 (${elapsed}秒)` : "エラー"}
          </h2>

          {result.upserted !== undefined && (
            <p style={{ fontSize: 16, marginBottom: 12 }}>
              <strong>{result.upserted}</strong> 件 upsert
            </p>
          )}

          {result.stats && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>レイヤー別件数 (active):</h3>
              <table style={{ borderCollapse: "collapse" }}>
                <tbody>
                  {Object.entries(result.stats).map(([layer, count]) => (
                    <tr key={layer}>
                      <td style={{ padding: "4px 16px 4px 0", fontWeight: "bold" }}>{layer}</td>
                      <td style={{ padding: "4px 0" }}>{count} 件</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.error && (
            <pre style={{ color: "#991b1b", whiteSpace: "pre-wrap" }}>{result.error}</pre>
          )}

          {result.logs && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: "pointer", color: "#666" }}>詳細ログ ({result.logs.length} 行)</summary>
              <pre style={{ marginTop: 8, padding: 12, background: "#fff", borderRadius: 4, fontSize: 12, maxHeight: 400, overflow: "auto", whiteSpace: "pre-wrap" }}>
                {result.logs.join("\n")}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
