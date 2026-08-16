import { prisma } from "@/lib/database/prisma";
import type { Prisma } from "@prisma/client";

interface AuditParams {
  actorUserId?: string | null;
  actorRole?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/** Every admin action and every sensitive account action must call this. */
export async function recordAuditLog(params: AuditParams) {
  return prisma.auditLog.create({
    data: {
      actorUserId: params.actorUserId ?? null,
      actorRole: params.actorRole ?? null,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
      ipAddress: params.ipAddress ?? null,
    },
  });
}

interface SecurityEventParams {
  userId: string;
  type: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  metadata?: Record<string, unknown>;
}

export async function recordSecurityEvent(params: SecurityEventParams) {
  return prisma.securityEvent.create({
    data: {
      userId: params.userId,
      type: params.type,
      severity: params.severity,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}
