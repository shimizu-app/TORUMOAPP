"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [isNew, setIsNew]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      if (isNew) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        router.push("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (e: any) {
      setError(e.message || "エラーが発生しました");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const inp = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-inherit outline-none mb-3 focus:border-emerald-400 transition-colors";

  return (
    <div className="min-h-screen bg-[#EEF2EF] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-10 w-full max-w-sm shadow-xl">
        {/* ロゴ */}
        <div className="text-center mb-6">
          <div className="text-[9px] font-bold tracking-widest text-[rgb(18,130,55)] mb-1">補助金AI</div>
          <div className="text-4xl font-black text-[rgb(34,177,76)] tracking-tight leading-none" style={{ fontFamily: "'M PLUS 1p', sans-serif" }}>トルモ</div>
        </div>

        <div className="text-lg font-black text-gray-900 text-center mb-1 tracking-tight">
          {isNew ? "アカウントを作成" : "ログイン"}
        </div>
        <div className="text-xs text-gray-400 text-center mb-6">診断履歴・申請書を保存するにはログインが必要です</div>

        {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4">{error}</div>}

        {isNew && (
          <>
            <div className="text-xs font-bold text-gray-500 mb-1.5">会社名</div>
            <input className={inp} placeholder="株式会社○○"/>
          </>
        )}
        <div className="text-xs font-bold text-gray-500 mb-1.5">メールアドレス</div>
        <input className={inp} type="email" placeholder="example@company.com"
          value={email} onChange={e => setEmail(e.target.value)}/>
        <div className="text-xs font-bold text-gray-500 mb-1.5">パスワード</div>
        <input className={inp} type="password" placeholder="••••••••"
          value={password} onChange={e => setPassword(e.target.value)}/>

        {!isNew && (
          <div className="text-right -mt-2 mb-3">
            <span className="text-xs text-emerald-500 cursor-pointer font-semibold">パスワードを忘れた方</span>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-400 to-green-400 text-white rounded-xl h-12 text-sm font-black mb-4 shadow-lg shadow-emerald-200 disabled:opacity-60">
          {loading ? "処理中..." : isNew ? "アカウントを作成する" : "ログインする"}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200"/>
          <span className="text-xs text-gray-400">または</span>
          <div className="flex-1 h-px bg-gray-200"/>
        </div>

        <button onClick={handleGoogle}
          className="w-full bg-white border border-gray-200 rounded-xl h-11 text-sm font-semibold text-gray-500 flex items-center justify-center gap-2 mb-5">
          <svg viewBox="0 0 24 24" width={18} height={18}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Googleでログイン
        </button>

        <div className="text-center text-xs text-gray-400">
          {isNew ? "すでにアカウントをお持ちの方は" : "アカウントをお持ちでない方は"}{" "}
          <span onClick={() => setIsNew(v => !v)} className="text-emerald-500 cursor-pointer font-bold">
            {isNew ? "ログイン" : "新規登録"}
          </span>
        </div>
      </div>
    </div>
  );
}
