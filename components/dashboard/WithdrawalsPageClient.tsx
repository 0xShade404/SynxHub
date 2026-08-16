"use client";

import { useRouter } from "next/navigation";
import { WithdrawalFlow } from "./WithdrawalFlow";

interface Props {
  assets: { id: string; symbol: string; name: string; network: string; withdrawalEnabled: boolean }[];
  balances: Record<string, { available: number; symbol: string }>;
  mfaEnabled: boolean;
}

export function WithdrawalsPageClient({ assets, balances, mfaEnabled }: Props) {
  const router = useRouter();
  return (
    <WithdrawalFlow
      assets={assets}
      balances={balances}
      mfaEnabled={mfaEnabled}
      onSubmitted={() => router.refresh()}
    />
  );
}
