"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { G, GD, GL, GL2, GRAD, BG, CARD, SOFT, SH, SHG, BD, T1, T2, T3 } from "@/lib/constants";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setMessage("ログインしました。リダイレクト中...");
      window.location.href = "/";
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <div style={{ background: CARD, borderRadius: 24, padding: "40px 48px", boxShadow: SH, width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgb(18,130,55)", letterSpacing: ".12em", fontFamily: "Arial,sans-serif", marginBottom: 1 }}>補助金AI</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: "rgb(34,177,76)", fontFamily: "'M PLUS 1p', sans-serif", letterSpacing: "-.05em" }}>トルモ</div>
          <div style={{ fontSize: 14, color: T2, marginTop: 8 }}>ログイン</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T2, display: "block", marginBottom: 6 }}>メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: "100%", background: SOFT, border: `2px solid ${BD}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, color: T1, outline: "none", fontFamily: "inherit" }}
              placeholder="example@company.co.jp" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T2, display: "block", marginBottom: 6 }}>パスワード</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{ width: "100%", background: SOFT, border: `2px solid ${BD}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, color: T1, outline: "none", fontFamily: "inherit" }}
              placeholder="••••••••" />
          </div>

          {error && <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 12, padding: "8px 12px", background: "#FEF2F2", borderRadius: 8 }}>{error}</div>}
          {message && <div style={{ fontSize: 12, color: GD, marginBottom: 12, padding: "8px 12px", background: GL2, borderRadius: 8 }}>{message}</div>}

          <button type="submit" disabled={loading}
            style={{ width: "100%", background: GRAD, color: "#fff", borderRadius: 13, height: 50, fontSize: 15, fontWeight: 900, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: SHG, opacity: loading ? 0.7 : 1 }}>
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: T3 }}>
          アカウントをお持ちでない方は
          <a href="/auth/signup" style={{ color: G, fontWeight: 600, textDecoration: "none", marginLeft: 4 }}>新規登録</a>
        </div>
      </div>
    </div>
  );
}
