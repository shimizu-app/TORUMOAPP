import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "トルモ — 補助金AI",
  description: "業種と規模を入力するだけで、国・都道府県・市区町村・商工会議所の補助金を横断検索。申請書の下書きまで、AIがまるごとサポート。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: "Noto Sans JP, Inter, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
