import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth/guards";
import { getOrCreateDepositAddress } from "@/lib/deposits";
import { depositAddressRequestSchema } from "@/lib/validation/schemas";
import { handleApiError, jsonError } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/security/origin";

export async function POST(request: NextRequest) {
  try {
    if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);
    const user = await requireUser();
    const body = depositAddressRequestSchema.parse(await request.json());
    const depositAddress = await getOrCreateDepositAddress(user.id, body.assetId);
    const qrCodeDataUrl = await QRCode.toDataURL(depositAddress.address);
    return NextResponse.json({ depositAddress, qrCodeDataUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
