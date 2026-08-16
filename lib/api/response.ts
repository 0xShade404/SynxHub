import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth/guards";
import { LedgerError } from "@/lib/ledger/errors";
import { WithdrawalValidationError } from "@/lib/withdrawals";

/**
 * Central error → HTTP response mapping for API routes. Never leaks stack
 * traces or internal error messages for unexpected failures — those are
 * logged server-side and returned as a generic 500.
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request.", issues: error.flatten() },
      { status: 400 }
    );
  }
  if (error instanceof LedgerError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
  }
  if (error instanceof WithdrawalValidationError) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  console.error("[api] unhandled error", error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
