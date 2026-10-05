export interface StudentRecord {
  rollNumber: string;
  name: string;
  totalClasses: number;
  presentClasses: number;
  percentage: number;
  department?: string;
  email?: string;
  notes?: string;
  sheetRowIndex?: number; // 1-based index in the Google Sheet for precision editing
}

export interface AttendanceSession {
  date: string;
  subject: string;
  attendanceMap: Record<string, 'present' | 'absent'>;
  notes?: string;
}

export interface ConnectedSheetInfo {
  id: string;
  name: string;
  url: string;
  sheetTabName: string;
  lastSyncedAt?: string;
}

export interface CalculationResult {
  currentPercentage: number;
  isDefaulter: boolean; // < 75%
  requiredConsecutiveClasses: number; // to reach 75%
  canAffordToMiss: number; // if >= 75%, how many can be missed
  targetClassesNeeded: (targetPercent: number) => number;
}
