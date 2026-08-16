import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database/prisma";
import { handleApiError, jsonError } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/security/origin";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(10).max(72),
});

/**
 * Development-only self-registration for the dev-credentials provider.
 * Google OAuth (lib/auth) is the supported production sign-up path — see
 * README.md for Google Cloud OAuth setup instructions.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_DEV_CREDENTIALS_LOGIN !== "true") {
    return jsonError("Not found.", 404);
  }
  try {
    if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);
    const body = schema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return jsonError("An account with this email already exists.", 409);

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, passwordHash, role: "INVESTOR", status: "ACTIVE" },
    });

    return NextResponse.json({ userId: user.id });
  } catch (error) {
    return handleApiError(error);
  }
}
