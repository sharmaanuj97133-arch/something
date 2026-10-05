/**
 * Google Sheets API v4 Integration Service
 * All mutating calls require confirmation in the UI before execution.
 */

import { StudentRecord } from '../types';

export interface SpreadsheetDetails {
  id: string;
  title: string;
  sheets: { id: number; title: string }[];
  url: string;
}

/**
 * Extracts a spreadsheet ID from a Google Sheets URL or validates a raw ID string
 */
export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Pattern: /spreadsheets/d/([a-zA-Z0-9-_]+)
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // Standalone ID pattern
  if (/^[a-zA-Z0-9-_]{25,60}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Fetches spreadsheet metadata (title and sheet tabs)
 */
export async function getSpreadsheetDetails(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetDetails> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties(sheetId,title)`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error?.message || `Failed to fetch spreadsheet (${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Attendance Sheet',
    sheets: (data.sheets || []).map((s: any) => ({
      id: s.properties?.sheetId,
      title: s.properties?.title || 'Sheet1',
    })),
    url: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

/**
 * Reads student attendance records from the specified sheet tab
 */
export async function readAttendanceFromSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string
): Promise<{ students: StudentRecord[]; rawHeaders: string[] }> {
  const range = `${encodeURIComponent(tabName)}!A1:Z500`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to read sheet data (${res.status})`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  if (rows.length === 0) {
    return { students: [], rawHeaders: [] };
  }

  const headerRow = rows[0].map((h: any) => String(h || '').trim().toLowerCase());
  const rawHeaders = rows[0].map((h: any) => String(h || '').trim());

  // Find column indices with robust aliases
  const findColIndex = (...candidates: string[]) => {
    return headerRow.findIndex((col: string) =>
      candidates.some((c) => col === c || col.includes(c))
    );
  };

  const rollIdx = findColIndex('roll', 'id', 'student id', 'roll no', 'roll number');
  const nameIdx = findColIndex('name', 'student name', 'full name');
  const totalIdx = findColIndex('total classes', 'total', 'classes held', 'total lectures');
  const presentIdx = findColIndex('present classes', 'present', 'classes attended', 'attended');
  const deptIdx = findColIndex('dept', 'department', 'branch', 'section');
  const notesIdx = findColIndex('notes', 'remarks', 'remark', 'status');

  const students: StudentRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Roll number fallback: if specific roll col not found, use first column
    const rollRaw = String(rollIdx !== -1 ? row[rollIdx] || '' : row[0] || '').trim();
    if (!rollRaw) continue; // Skip empty rows

    const nameRaw = String(nameIdx !== -1 ? row[nameIdx] || '' : row[1] || `Student ${rollRaw}`).trim();
    
    // Parse numbers safely
    const totalRaw = totalIdx !== -1 ? Number(row[totalIdx]) : Number(row[2]);
    const presentRaw = presentIdx !== -1 ? Number(row[presentIdx]) : Number(row[3]);

    const totalClasses = isNaN(totalRaw) ? 0 : Math.max(0, totalRaw);
    const presentClasses = isNaN(presentRaw) ? 0 : Math.min(totalClasses, Math.max(0, presentRaw));

    const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 1000) / 10 : 0;
    const department = deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]).trim() : undefined;
    const notes = notesIdx !== -1 && row[notesIdx] ? String(row[notesIdx]).trim() : undefined;

    students.push({
      rollNumber: rollRaw,
      name: nameRaw || `Student ${rollRaw}`,
      totalClasses,
      presentClasses,
      percentage,
      department,
      notes,
      sheetRowIndex: i + 1, // 1-based row index in Google Sheet
    });
  }

  return { students, rawHeaders };
}

/**
 * Creates a brand new ready-to-use Attendance Google Sheet with formatted headers
 */
export async function createAttendanceSpreadsheet(
  accessToken: string,
  title: string = 'Attendance Tracker'
): Promise<{ id: string; url: string; tabName: string }> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';

  const body = {
    properties: {
      title: `${title} - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
    },
    sheets: [
      {
        properties: {
          title: 'Attendance Records',
          gridProperties: {
            rowCount: 100,
            columnCount: 10,
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to create spreadsheet (${res.status})`);
  }

  const created = await res.json();
  const spreadsheetId = created.spreadsheetId;
  const tabName = 'Attendance Records';

  // Populate headers and starter student data
  const initialRows = [
    ['Roll Number', 'Student Name', 'Total Classes', 'Present Classes', 'Attendance %', 'Status', 'Department', 'Remarks'],
    ['CS-101', 'Aarav Sharma', 45, 39, '=ROUND((D2/C2)*100, 1)', '=IF(E2>=75, "Eligible", "Short Attendance Warning")', 'Computer Science', 'Good standing'],
    ['CS-102', 'Priya Patel', 45, 31, '=ROUND((D3/C3)*100, 1)', '=IF(E3>=75, "Eligible", "Short Attendance Warning")', 'Computer Science', 'Medical leave submitted'],
    ['CS-103', 'Rohan Verma', 45, 42, '=ROUND((D4/C4)*100, 1)', '=IF(E4>=75, "Eligible", "Short Attendance Warning")', 'Computer Science', 'Class Representative'],
    ['CS-104', 'Ananya Iyer', 45, 29, '=ROUND((D5/C5)*100, 1)', '=IF(E5>=75, "Eligible", "Short Attendance Warning")', 'Computer Science', 'Short attendance warning'],
    ['CS-105', 'Vikramaditya Rao', 45, 36, '=ROUND((D6/C6)*100, 1)', '=IF(E6>=75, "Eligible", "Short Attendance Warning")', 'Computer Science', 'Eligible'],
    ['CS-106', 'Sneha Kulkarni', 45, 33, '=ROUND((D7/C7)*100, 1)', '=IF(E7>=75, "Eligible", "Short Attendance Warning")', 'Computer Science', 'Borderline defaulter'],
    ['CS-107', 'Kabir Khan', 45, 38, '=ROUND((D8/C8)*100, 1)', '=IF(E8>=75, "Eligible", "Short Attendance Warning")', 'Computer Science', 'Eligible'],
    ['CS-108', 'Diya Sengupta', 45, 27, '=ROUND((D9/C9)*100, 1)', '=IF(E9>=75, "Eligible", "Short Attendance Warning")', 'Computer Science', 'Critical alert'],
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:H${initialRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: initialRows }),
    }
  );

  return {
    id: spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    tabName,
  };
}

/**
 * Appends a new student record to the connected Google Sheet
 */
export async function appendStudentToSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  student: StudentRecord
): Promise<void> {
  const rowValues = [
    student.rollNumber,
    student.name,
    student.totalClasses,
    student.presentClasses,
    `${student.percentage}%`,
    student.percentage >= 75 ? 'Eligible' : 'Short Attendance Warning',
    student.department || 'General',
    student.notes || '',
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A:H:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to add student to sheet (${res.status})`);
  }
}

/**
 * Overwrites / syncs the full table of student attendance to Google Sheet
 */
export async function syncAllStudentsToSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  students: StudentRecord[]
): Promise<void> {
  const header = ['Roll Number', 'Student Name', 'Total Classes', 'Present Classes', 'Attendance %', 'Status', 'Department', 'Remarks'];
  const rows = students.map((s) => [
    s.rollNumber,
    s.name,
    s.totalClasses,
    s.presentClasses,
    `${s.percentage.toFixed(1)}%`,
    s.percentage >= 75 ? 'Eligible' : 'Short Attendance Warning',
    s.department || '',
    s.notes || '',
  ]);

  const allValues = [header, ...rows];

  const range = `${encodeURIComponent(tabName)}!A1:H${allValues.length}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: allValues,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to sync students to sheet (${res.status})`);
  }
}
