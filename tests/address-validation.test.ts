import { describe, it, expect } from "vitest";
import { isValidAddressForNetwork } from "@/lib/validation/address";

describe("isValidAddressForNetwork", () => {
  it("accepts a well-formed EVM address on ethereum", () => {
    expect(isValidAddressForNetwork("0x" + "a".repeat(40), "ethereum")).toBe(true);
  });

  it("rejects a malformed EVM address", () => {
    expect(isValidAddressForNetwork("0x123", "ethereum")).toBe(false);
    expect(isValidAddressForNetwork("not-an-address", "ethereum")).toBe(false);
  });

  it("rejects an EVM-style address on a non-EVM network", () => {
    // Right shape for Ethereum, wrong network — Solana addresses are base58, not 0x-hex.
    expect(isValidAddressForNetwork("0x" + "a".repeat(40), "solana")).toBe(false);
  });

  it("accepts a plausible base58 Solana address", () => {
    expect(isValidAddressForNetwork("11111111111111111111111111111111", "solana")).toBe(true);
  });

  it("accepts a bech32 bitcoin address", () => {
    expect(isValidAddressForNetwork("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", "bitcoin")).toBe(true);
  });

  it("rejects addresses that are too short", () => {
    expect(isValidAddressForNetwork("abc", "bitcoin")).toBe(false);
  });

  it("rejects an empty address", () => {
    expect(isValidAddressForNetwork("", "ethereum")).toBe(false);
  });
});
