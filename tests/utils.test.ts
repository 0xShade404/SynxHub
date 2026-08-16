import { describe, it, expect } from "vitest";
import { formatUsd, formatPercent, truncateAddress } from "@/lib/utils";

describe("formatUsd", () => {
  it("formats positive values as USD currency", () => {
    expect(formatUsd(1234.5)).toBe("$1,234.50");
  });

  it("formats zero", () => {
    expect(formatUsd(0)).toBe("$0.00");
  });
});

describe("formatPercent", () => {
  it("shows an explicit sign for positive and negative values", () => {
    expect(formatPercent(5)).toBe("+5%");
    expect(formatPercent(-5)).toBe("-5%");
    expect(formatPercent(5.5)).toBe("+5.5%");
  });
});

describe("truncateAddress", () => {
  it("truncates long addresses with an ellipsis", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    const result = truncateAddress(addr);
    expect(result.startsWith("0x1234")).toBe(true);
    expect(result).toContain("…");
  });

  it("leaves short strings untouched", () => {
    expect(truncateAddress("short")).toBe("short");
  });
});
