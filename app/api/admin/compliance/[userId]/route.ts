import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { recordAuditLog } from "@/lib/security/audit";
import { handleApiError, jsonError } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/security/origin";

const schema = z.object({
  status: z.enum(["NOT_STARTED", "PENDING", "APPROVED", "REJECTED", "EXPIRED"]),
  reviewerNote: z.string().max(1000).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);
    const reviewer = await requireRole(["ADMIN", "COMPLIANCE"]);
    const { userId } = await params;
    const body = schema.parse(await request.json());

    const latest = await prisma.kycRecord.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const record = latest
      ? await prisma.kycRecord.update({
          where: { id: latest.id },
          data: { status: body.status, reviewerNote: body.reviewerNote, reviewedAt: new Date() },
        })
      : await prisma.kycRecord.create({
          data: {
            userId,
            provider: "manual-review",
            status: body.status,
            reviewerNote: body.reviewerNote,
            reviewedAt: new Date(),
          },
        });

    await recordAuditLog({
      actorUserId: reviewer.id,
      actorRole: reviewer.role,
      action: "KYC_STATUS_UPDATED",
      targetType: "KycRecord",
      targetId: record.id,
      metadata: { userId, newStatus: body.status },
    });

    return NextResponse.json({ record });
  } catch (error) {
    return handleApiError(error);
  }
}
