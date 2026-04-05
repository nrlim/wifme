import { prisma } from "@/lib/prisma";

export interface FeeConfig {
  feeType: "PERCENT" | "FLAT";
  feeValue: number;
}

/**
 * Calculate the total price a Jamaah pays, including service fee.
 */
export function calcTotalWithFee(basePrice: number, duration: number, fee: FeeConfig): number {
  const base = basePrice * duration;
  const serviceFee =
    fee.feeType === "PERCENT"
      ? Math.round(base * (fee.feeValue / 100))
      : Math.round(fee.feeValue);
  return base + serviceFee;
}

/**
 * Calculate the service fee amount only.
 */
export function calcServiceFee(basePrice: number, duration: number, fee: FeeConfig): number {
  const base = basePrice * duration;
  return fee.feeType === "PERCENT"
    ? Math.round(base * (fee.feeValue / 100))
    : Math.round(fee.feeValue);
}

/**
 * Fetch fee config from DB (singleton). Falls back to 0% if not set.
 */
export async function getFeeConfig(): Promise<FeeConfig> {
  try {
    const settings = await prisma.globalSetting.findUnique({
      where: { id: "singleton" },
      select: { feeType: true, feeValue: true },
    });
    if (settings) {
      return { feeType: settings.feeType as "PERCENT" | "FLAT", feeValue: settings.feeValue };
    }
  } catch {
    // DB not available — use safe default
  }
  return { feeType: "PERCENT", feeValue: 0 };
}
