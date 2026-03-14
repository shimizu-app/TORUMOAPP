"use client";

import React, { useState } from "react";
import Nav from "@/components/layout/Nav";
import Home from "@/components/home/Home";
import Intake from "@/components/intake/Intake";
import AnalyzingScreen from "@/components/analyzing/AnalyzingScreen";
import List from "@/components/list/List";
import Dashboard from "@/components/dashboard/Dashboard";
import { MATCH_SYS } from "@/lib/constants";
import { DEMO_COMPANY, DEMO_SUBSIDIES } from "@/lib/data";
import type { Company, Subsidy, SubsidiesByLayer } from "@/types";

function safeJSON<T = unknown[]>(text: string): T {
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

export default function AppPage() {
  const [page, setPage] = useState("home");
  const [company, setCompany] = useState<Company>({});
  const [subsidiesByLayer, setSubsidiesByLayer] = useState<SubsidiesByLayer>({
    national: [],
    prefecture: [],
    city: [],
    chamber: [],
    other: [],
  });
  const [selected, setSelected] = useState<Subsidy | null>(null);
  const [diagnosed, setDiagnosed] = useState(false);

  const loadDemo = () => {
    setCompany(DEMO_COMPANY);
    setSubsidiesByLayer(DEMO_SUBSIDIES);
    setSelected(DEMO_SUBSIDIES.national[0]);
    setDiagnosed(true);
    setPage("db");
  };

  const handleDone = async (answers: Company) => {
    setCompany(answers);
    setDiagnosed(true);
    setPage("analyzing");

    const pref = answers.prefecture || "東京都";
    const city = answers.city || pref;
    const co = JSON.stringify(answers);

    const layers = [
      { key: "national" as const, desc: `国（中小企業庁・経済産業省・厚生労働省など）が出している` },
      { key: "prefecture" as const, desc: `${pref}が出している都道府県の` },
      { key: "city" as const, desc: `${city}の市区町村が出している` },
      { key: "chamber" as const, desc: `商工会議所・商工会・中小機構・NEDOなど公的支援機関が出している` },
      { key: "other" as const, desc: `業界団体・農協・建設組合・金融機関連携の` },
    ];

    const result: SubsidiesByLayer = { national: [], prefecture: [], city: [], chamber: [], other: [] };

    for (const layer of layers) {
      try {
        const res = await fetch("/api/matching", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company: co,
            layerDesc: layer.desc,
          }),
        });
        const data = await res.json();
        result[layer.key] = safeJSON<Subsidy[]>(data.text);
      } catch (e) {
        console.error(layer.key, e);
      }
    }

    setSubsidiesByLayer(result);
    setPage("list");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "Noto Sans JP, Inter, sans-serif",
      }}
    >
      {page !== "analyzing" && <Nav page={page} setPage={setPage} showFull={diagnosed} />}
      {page === "home" && <Home setPage={setPage} loadDemo={loadDemo} />}
      {page === "intake" && <Intake onDone={handleDone} />}
      {page === "analyzing" && <AnalyzingScreen />}
      {page === "list" && (
        <List subsidiesByLayer={subsidiesByLayer} setPage={setPage} setSelected={setSelected} />
      )}
      {page === "db" && <Dashboard selected={selected} company={company} />}
    </div>
  );
}
