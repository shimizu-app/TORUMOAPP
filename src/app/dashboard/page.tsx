"use client";

import { useRouter } from "next/navigation";
import Dashboard from "@/components/dashboard/Dashboard";
import Nav from "@/components/layout/Nav";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "Noto Sans JP, Inter, sans-serif" }}>
      <Nav page="db" setPage={(p) => router.push(p === "home" ? "/" : `/${p}`)} showFull={true} />
      <Dashboard selected={null} company={{}} />
    </div>
  );
}
