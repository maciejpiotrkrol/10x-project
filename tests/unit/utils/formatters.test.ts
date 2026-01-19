import { describe, it, expect } from "vitest";
import { formatTime } from "@/lib/utils/formatTime";
import { formatGender } from "@/lib/utils/formatGender";

describe("formatTime", () => {
  it("should format time without hours (MM:SS)", () => {
    expect(formatTime(1230)).toBe("20:30");
    expect(formatTime(90)).toBe("1:30");
    expect(formatTime(0)).toBe("0:00");
  });

  it("should format time with hours (HH:MM:SS)", () => {
    expect(formatTime(6135)).toBe("1:42:15");
    expect(formatTime(3600)).toBe("1:00:00");
    expect(formatTime(7200)).toBe("2:00:00");
  });

  it("should pad single digit minutes and seconds with zero", () => {
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(5)).toBe("0:05");
    expect(formatTime(3605)).toBe("1:00:05");
  });

  it("should handle edge cases", () => {
    expect(formatTime(59)).toBe("0:59");
    expect(formatTime(60)).toBe("1:00");
    expect(formatTime(3599)).toBe("59:59");
    expect(formatTime(3601)).toBe("1:00:01");
  });
});

describe("formatGender", () => {
  it("should format male gender to Polish", () => {
    expect(formatGender("M")).toBe("Mężczyzna");
  });

  it("should format female gender to Polish", () => {
    expect(formatGender("F")).toBe("Kobieta");
  });
});
