"use client";

import { useRouter } from "next/navigation";
import List from "@/components/list/List";
import Nav from "@/components/layout/Nav";
import type { Subsidy, SubsidiesByLayer } from "@/types";

export default function ListPage() {
  const router = useRouter();

  // In the standalone page mode, read from sessionStorage
  const emptyLayer: SubsidiesByLayer = { national: [], prefecture: [], city: [], chamber: [], other: [] };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "Noto Sans JP, Inter, sans-serif" }}>
      <Nav page="list" setPage={(p) => router.push(p === "home" ? "/" : `/${p}`)} showFull={true} />
      <List
        subsidiesByLayer={emptyLayer}
        setPage={(p) => router.push(p === "home" ? "/" : `/${p}`)}
        setSelected={() => {}}
      />
    </div>
  );
}
