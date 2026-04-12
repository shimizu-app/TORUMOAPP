"use client";

import React, { useState } from "react";
import Nav from "@/components/layout/Nav";
import Home from "@/components/home/Home";
import Intake from "@/components/intake/Intake";
import AnalyzingScreen from "@/components/analyzing/AnalyzingScreen";
import List from "@/components/list/List";
import Dashboard from "@/components/dashboard/Dashboard";
import ModeSelect, { type Mode } from "@/components/finance/ModeSelect";
import DebtFinancePanel, { DEMO_INPUTS, calcCreditModel } from "@/components/finance/DebtFinancePanel";
import { DEMO_COMPANY, DEMO_SUBSIDIES } from "@/lib/data";
import type { Company, Subsidy, SubsidiesByLayer } from "@/types";

export default function AppPage() {
  const [page, setPage] = useState("mode");
  const [mode, setMode] = useState<Mode | null>(null);
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

    const res = await fetch("/api/matching", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers),
    });

    if (!res.ok) {
      console.error("Matching API failed:", res.status);
      setPage("list");
      return;
    }

    const result: SubsidiesByLayer = await res.json();
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
      {page !== "analyzing" && page !== "mode" && <Nav page={page} setPage={setPage} showFull={diagnosed} />}
      {page === "mode" && (
        <ModeSelect
          onSelect={(m) => {
            setMode(m);
            if (m === "finance") setPage("finance");
            else setPage("home");
          }}
          onSample={(m) => {
            setMode(m);
            if (m === "finance") setPage("finance");
            else loadDemo();
          }}
        />
      )}
      {page === "home" && <Home setPage={setPage} loadDemo={loadDemo} />}
      {page === "intake" && <Intake onDone={handleDone} />}
      {page === "analyzing" && <AnalyzingScreen />}
      {page === "list" && (
        <List subsidiesByLayer={subsidiesByLayer} setPage={setPage} setSelected={setSelected} />
      )}
      {page === "db" && <Dashboard selected={selected} company={company} />}
      {page === "finance" && (
        <div style={{ flex: 1, overflowY: "auto", background: "#EEF2EF", padding: 24 }}>
          <DebtFinancePanel inputs={DEMO_INPUTS} result={calcCreditModel(DEMO_INPUTS)} />
        </div>
      )}
    </div>
  );
}
