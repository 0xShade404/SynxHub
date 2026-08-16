const EXPLORER_TX_TEMPLATES: Record<string, string> = {
  bitcoin: "https://mempool.space/tx/{hash}",
  ethereum: "https://etherscan.io/tx/{hash}",
  avalanche: "https://snowtrace.io/tx/{hash}",
  solana: "https://solscan.io/tx/{hash}",
  cosmos: "https://www.mintscan.io/cosmos/txs/{hash}",
  polkadot: "https://polkadot.subscan.io/extrinsic/{hash}",
  near: "https://nearblocks.io/txns/{hash}",
  sui: "https://suiscan.xyz/mainnet/tx/{hash}",
};

export function getExplorerTxUrl(network: string, txHash: string): string | null {
  const template = EXPLORER_TX_TEMPLATES[network.toLowerCase()];
  if (!template) return null;
  return template.replace("{hash}", txHash);
}
