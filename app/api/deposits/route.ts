import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { listDeposits } from "@/lib/deposits";
import { handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const deposits = await listDeposits(user.id);
    return NextResponse.json({ deposits });
  } catch (error) {
    return handleApiError(error);
  }
}
