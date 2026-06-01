import { NextResponse } from "next/server";
import { getCars } from "@/src/lib/cars";
import { recommend } from "@/src/lib/scoring";
import { parseAnswers } from "@/src/lib/validate";

// POST /api/recommend
// Body: questionnaire answers. Validates against the allowed values, then
// delegates ranking to recommend(). All scoring logic lives in src/lib/.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 },
    );
  }

  const parsed = parseAnswers(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Invalid questionnaire input.", fieldErrors: parsed.errors },
      { status: 400 },
    );
  }

  const recommendations = recommend(parsed.value, getCars());
  return NextResponse.json({ recommendations });
}
