/**
 * Lightweight, network-aware destination address validation. This is a
 * format/checksum-shape sanity check — it does not guarantee the address is
 * controlled by the recipient or reachable on-chain. A production custody
 * integration should perform its own authoritative validation as well.
 */
const EVM_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const BASE58_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{25,44}$/;
const BECH32_PATTERN = /^(bc1|tb1)[a-z0-9]{25,62}$/;
const SOLANA_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const EVM_NETWORKS = new Set([
  "ethereum",
  "bnb-smart-chain",
  "avalanche",
  "polygon",
  "arbitrum",
  "base",
]);

export function isValidAddressForNetwork(address: string, network: string): boolean {
  if (!address || address.length < 20 || address.length > 90) return false;
  const key = network.toLowerCase();

  if (EVM_NETWORKS.has(key)) return EVM_PATTERN.test(address);
  if (key === "bitcoin") return BASE58_PATTERN.test(address) || BECH32_PATTERN.test(address);
  if (key === "solana") return SOLANA_PATTERN.test(address);
  if (key === "cosmos") return /^cosmos1[a-z0-9]{38}$/.test(address);

  // Unknown/other networks: conservative generic alphanumeric shape check.
  return /^[a-zA-Z0-9]{20,90}$/.test(address);
}
