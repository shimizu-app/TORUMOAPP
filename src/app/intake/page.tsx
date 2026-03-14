"use client";

import { useRouter } from "next/navigation";
import Intake from "@/components/intake/Intake";
import Nav from "@/components/layout/Nav";
import type { Company } from "@/types";

export default function IntakePage() {
  const router = useRouter();

  const handleDone = (answers: Company) => {
    // Store answers in sessionStorage for the analyzing page
    sessionStorage.setItem("torumo_company", JSON.stringify(answers));
    router.push("/analyzing");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "Noto Sans JP, Inter, sans-serif" }}>
      <Nav page="intake" setPage={(p) => router.push(p === "home" ? "/" : `/${p}`)} showFull={false} />
      <Intake onDone={handleDone} />
    </div>
  );
}
