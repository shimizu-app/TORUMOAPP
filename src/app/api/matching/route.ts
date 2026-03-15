import { NextResponse } from "next/server";
import { matchSubsidies } from "@/lib/matching";
import type { Company } from "@/types";

export async function POST(req: Request) {
  try {
    const company: Company = await req.json();
    const result = await matchSubsidies(company);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Matching error:", e);
    return NextResponse.json(
      { national: [], prefecture: [], city: [], chamber: [], other: [] },
      { status: 500 }
    );
  }
}
