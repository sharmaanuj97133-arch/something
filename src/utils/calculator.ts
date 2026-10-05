export interface AttendanceMetrics {
  percentage: number;
  formattedPercentage: string;
  isDefaulter: boolean;
  isCritical: boolean; // < 65%
  isBorderline: boolean; // 75% - 78%
  isHonors: boolean; // >= 85%
  classesNeededFor75: number;
  classesCanAffordToMiss: number;
  classesNeededForTarget: (targetPercent: number) => number;
  simulateFuture: (attendedNext: number, missedNext: number) => {
    newTotal: number;
    newPresent: number;
    newPercentage: number;
    isDefaulter: boolean;
  };
}

export function calculateAttendanceMetrics(present: number, total: number): AttendanceMetrics {
  const safeTotal = Math.max(0, total);
  const safePresent = Math.min(safeTotal, Math.max(0, present));

  const rawPercent = safeTotal > 0 ? (safePresent / safeTotal) * 100 : 0;
  const percentage = Math.round(rawPercent * 10) / 10;
  const formattedPercentage = percentage.toFixed(1) + '%';

  const isDefaulter = percentage < 75;
  const isCritical = percentage < 65;
  const isBorderline = percentage >= 75 && percentage <= 78;
  const isHonors = percentage >= 85;

  // Formula for 75%: consecutive classes x = ceil((3T - 4P))
  const rawNeeded75 = 3 * safeTotal - 4 * safePresent;
  const classesNeededFor75 = isDefaulter ? Math.max(1, Math.ceil(rawNeeded75)) : 0;

  // Formula for classes allowed to miss before dropping below 75%:
  // y <= floor((4P - 3T) / 3)
  const rawCanMiss = Math.floor((4 * safePresent - 3 * safeTotal) / 3);
  const classesCanAffordToMiss = !isDefaulter && rawCanMiss > 0 ? rawCanMiss : 0;

  const classesNeededForTarget = (targetPercent: number): number => {
    if (targetPercent <= 0) return 0;
    if (targetPercent >= 100) {
      // If student has missed any class, 100% can never be reached
      if (safePresent < safeTotal) return -1;
      return 0;
    }
    const current = safeTotal > 0 ? (safePresent / safeTotal) * 100 : 0;
    if (current >= targetPercent) return 0;

    // x >= (Target * T - 100 * P) / (100 - Target)
    const numerator = targetPercent * safeTotal - 100 * safePresent;
    const denominator = 100 - targetPercent;
    return Math.max(1, Math.ceil(numerator / denominator));
  };

  const simulateFuture = (attendedNext: number, missedNext: number) => {
    const newTotal = safeTotal + attendedNext + missedNext;
    const newPresent = safePresent + attendedNext;
    const newRaw = newTotal > 0 ? (newPresent / newTotal) * 100 : 0;
    const newPercentage = Math.round(newRaw * 10) / 10;
    return {
      newTotal,
      newPresent,
      newPercentage,
      isDefaulter: newPercentage < 75,
    };
  };

  return {
    percentage,
    formattedPercentage,
    isDefaulter,
    isCritical,
    isBorderline,
    isHonors,
    classesNeededFor75,
    classesCanAffordToMiss,
    classesNeededForTarget,
    simulateFuture,
  };
}
