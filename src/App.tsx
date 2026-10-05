import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { StudentRecord, ConnectedSheetInfo } from './types';
import { INITIAL_STUDENTS } from './data/mockData';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setAccessToken,
} from './services/auth';
import {
  createAttendanceSpreadsheet,
  readAttendanceFromSheet,
  appendStudentToSheet,
  syncAllStudentsToSheet,
} from './services/sheets';
import { SheetManager } from './components/SheetManager';
import { StudentPortal } from './components/StudentPortal';
import { TeacherView } from './components/TeacherView';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AddStudentModal } from './components/AddStudentModal';
import { MarkSessionModal } from './components/MarkSessionModal';
import { EditStudentModal } from './components/EditStudentModal';

const STORAGE_KEY_SHEET = 'attendance_tracker_sheet_info';

export default function App() {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    // Check if local cache exists, else default mock
    const saved = localStorage.getItem('attendance_students_cache');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_STUDENTS;
      }
    }
    return INITIAL_STUDENTS;
  });

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(
    null
  );

  // Connected Sheet info (persisted in localStorage, without sensitive token)
  const [connectedSheet, setConnectedSheet] = useState<ConnectedSheetInfo | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SHEET);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentRecord | null>(null);

  // Mandatory confirmation dialog for Workspace mutations
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    affectedItems?: string[];
    confirmLabel?: string;
    isDestructive?: boolean;
    action?: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Save student cache for seamless offline/quick reload
  useEffect(() => {
    try {
      localStorage.setItem('attendance_students_cache', JSON.stringify(students));
    } catch (e) {
      // ignore
    }
  }, [students]);

  // Load and sync sheet data when token and connected sheet are available
  const loadSheetData = useCallback(
    async (authToken: string, sheetInfo: ConnectedSheetInfo) => {
      try {
        setIsLoading(true);
        const { students: loadedStudents } = await readAttendanceFromSheet(
          authToken,
          sheetInfo.id,
          sheetInfo.sheetTabName
        );

        if (loadedStudents.length > 0) {
          setStudents(loadedStudents);
          showToast(`Successfully synced ${loadedStudents.length} students from Google Sheet.`, 'success');
        } else {
          showToast('Google Sheet tab is currently empty. You can add students or mark attendance.', 'info');
        }

        // Update last synced
        const updated = { ...sheetInfo, lastSyncedAt: new Date().toISOString() };
        setConnectedSheet(updated);
        localStorage.setItem(STORAGE_KEY_SHEET, JSON.stringify(updated));
      } catch (err: any) {
        console.error('Failed to sync sheet:', err);
        showToast(err.message || 'Failed to sync with Google Sheet.', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setAccessToken(accessToken);
        if (connectedSheet) {
          loadSheetData(accessToken, connectedSheet);
        }
      },
      () => {
        setUser(null);
        setToken(null);
        setAccessToken(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [connectedSheet, loadSheetData]);

  // Google Sign-In Handler
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showToast(`Signed in as ${res.user.displayName || res.user.email}`, 'success');

        if (connectedSheet) {
          await loadSheetData(res.accessToken, connectedSheet);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Google Sign-In failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    showToast('Signed out of Google account.', 'info');
  };

  // Connect existing sheet
  const handleConnectSheet = async (sheetId: string, sheetTitle: string, tabName: string) => {
    if (!token) {
      showToast('Please sign in with Google first.', 'error');
      return;
    }

    const info: ConnectedSheetInfo = {
      id: sheetId,
      name: sheetTitle,
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
      sheetTabName: tabName,
      lastSyncedAt: new Date().toISOString(),
    };

    setConnectedSheet(info);
    localStorage.setItem(STORAGE_KEY_SHEET, JSON.stringify(info));
    await loadSheetData(token, info);
  };

  // Create new starter sheet directly in Google Drive
  const handleCreateNewSheet = async () => {
    if (!token) {
      handleLogin();
      return;
    }

    try {
      setIsLoading(true);
      const created = await createAttendanceSpreadsheet(token, 'Student Attendance Tracker');
      const info: ConnectedSheetInfo = {
        id: created.id,
        name: 'Student Attendance Tracker',
        url: created.url,
        sheetTabName: created.tabName,
        lastSyncedAt: new Date().toISOString(),
      };

      setConnectedSheet(info);
      localStorage.setItem(STORAGE_KEY_SHEET, JSON.stringify(info));
      await loadSheetData(token, info);
      showToast('Template Attendance Sheet created and linked successfully in your Google Drive!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to create Google Sheet.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
    if (!connectedSheet) {
      showToast('No Google Sheet connected. Showing local roster.', 'info');
      return;
    }
    if (!token) {
      showToast('Session expired. Please sign in with Google to refresh.', 'info');
      handleLogin();
      return;
    }
    await loadSheetData(token, connectedSheet);
  };

  const handleDisconnectSheet = () => {
    setConnectedSheet(null);
    localStorage.removeItem(STORAGE_KEY_SHEET);
    showToast('Disconnected Google Sheet. Reverted to local demo storage.', 'info');
  };

  // Action: Add new student record (with mandatory confirmation)
  const handleInitiateAddStudent = (newStudent: StudentRecord) => {
    setShowAddModal(false);

    // Check duplicate roll
    if (students.some((s) => s.rollNumber.toLowerCase() === newStudent.rollNumber.toLowerCase())) {
      showToast(`Roll number ${newStudent.rollNumber} already exists in the roster.`, 'error');
      return;
    }

    const targetDesc = connectedSheet
      ? `This will add a new row to your Google Sheet "${connectedSheet.name}" (${connectedSheet.sheetTabName}) for ${newStudent.name}.`
      : 'This will add a new student record to your active attendance roster.';

    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Adding Student Record',
      description: targetDesc,
      affectedItems: [
        `Roll No: ${newStudent.rollNumber}`,
        `Name: ${newStudent.name}`,
        `Attendance: ${newStudent.presentClasses}/${newStudent.totalClasses} (${newStudent.percentage}%)`,
      ],
      confirmLabel: 'Confirm & Save Student',
      action: async () => {
        try {
          setIsLoading(true);
          if (connectedSheet && token) {
            await appendStudentToSheet(
              token,
              connectedSheet.id,
              connectedSheet.sheetTabName,
              newStudent
            );
          }

          setStudents((prev) => [newStudent, ...prev]);
          showToast(`Student ${newStudent.name} (${newStudent.rollNumber}) added successfully!`, 'success');
        } catch (err: any) {
          showToast(err.message || 'Failed to save student to sheet.', 'error');
        } finally {
          setIsLoading(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Action: Mark class session (with mandatory confirmation)
  const handleInitiateSession = (session: {
    date: string;
    subject: string;
    presentRolls: string[];
    absentRolls: string[];
  }) => {
    setShowSessionModal(false);

    // Compute updated students
    const updated = students.map((s) => {
      const isPresent = session.presentRolls.includes(s.rollNumber);
      const newTotal = s.totalClasses + 1;
      const newPresent = isPresent ? s.presentClasses + 1 : s.presentClasses;
      const newPercentage = Math.round((newPresent / newTotal) * 1000) / 10;
      return {
        ...s,
        totalClasses: newTotal,
        presentClasses: newPresent,
        percentage: newPercentage,
      };
    });

    const targetDesc = connectedSheet
      ? `This will increment total classes by +1 and update attendance for ${students.length} students in Google Sheet "${connectedSheet.name}".`
      : `This will record attendance for ${students.length} students for lecture "${session.subject}".`;

    setConfirmDialog({
      isOpen: true,
      title: `Confirm Class Session Attendance (${session.date})`,
      description: targetDesc,
      affectedItems: [
        `Session: ${session.subject}`,
        `Date: ${session.date}`,
        `Present count: ${session.presentRolls.length} students`,
        `Absent count: ${session.absentRolls.length} students`,
      ],
      confirmLabel: 'Confirm & Update Sheet',
      action: async () => {
        try {
          setIsLoading(true);
          if (connectedSheet && token) {
            await syncAllStudentsToSheet(
              token,
              connectedSheet.id,
              connectedSheet.sheetTabName,
              updated
            );
          }

          setStudents(updated);
          showToast(`Attendance recorded for ${session.subject}!`, 'success');
        } catch (err: any) {
          showToast(err.message || 'Failed to sync session attendance to Google Sheet.', 'error');
        } finally {
          setIsLoading(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Action: Edit single student record (with mandatory confirmation)
  const handleInitiateEditStudent = (updatedStudent: StudentRecord) => {
    setStudentToEdit(null);

    const targetDesc = connectedSheet
      ? `This will update attendance counts for ${updatedStudent.name} (${updatedStudent.rollNumber}) in Google Sheet "${connectedSheet.name}".`
      : `This will update attendance counts for ${updatedStudent.name} (${updatedStudent.rollNumber}).`;

    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Attendance Update',
      description: targetDesc,
      affectedItems: [
        `Student: ${updatedStudent.name} (${updatedStudent.rollNumber})`,
        `New Attendance: ${updatedStudent.presentClasses}/${updatedStudent.totalClasses} (${updatedStudent.percentage}%)`,
      ],
      confirmLabel: 'Confirm & Update',
      action: async () => {
        try {
          setIsLoading(true);
          const updated = students.map((s) =>
            s.rollNumber === updatedStudent.rollNumber ? updatedStudent : s
          );

          if (connectedSheet && token) {
            await syncAllStudentsToSheet(
              token,
              connectedSheet.id,
              connectedSheet.sheetTabName,
              updated
            );
          }

          setStudents(updated);
          showToast(`Record updated for ${updatedStudent.name}.`, 'success');
        } catch (err: any) {
          showToast(err.message || 'Failed to update student in sheet.', 'error');
        } finally {
          setIsLoading(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Switch to portal with roll preselected
  const handleSelectStudentForPortal = (rollNumber: string) => {
    setActiveTab('student');
    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 antialiased flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-start space-x-3 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
            )}
            <div className="text-xs md:text-sm font-medium leading-relaxed">
              {toast.message}
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  Attendance Tracker
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  v2.0 Sheets Edition
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Connected Student & Teacher Academic Dashboard
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'student'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Portal</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('teacher')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'teacher'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Teacher View</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Google Sheet Connection Manager */}
        <SheetManager
          user={user}
          token={token}
          connectedSheet={connectedSheet}
          isLoading={isLoading}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onConnectSheet={handleConnectSheet}
          onCreateNewSheet={handleCreateNewSheet}
          onRefreshData={handleRefreshData}
          onDisconnectSheet={handleDisconnectSheet}
        />

        {/* Tab View */}
        {activeTab === 'student' ? (
          <StudentPortal students={students} />
        ) : (
          <TeacherView
            students={students}
            connectedSheetUrl={connectedSheet?.url}
            onOpenAddStudent={() => setShowAddModal(true)}
            onOpenClassSession={() => setShowSessionModal(true)}
            onOpenEditStudent={(s) => setStudentToEdit(s)}
            onSelectStudentForPortal={handleSelectStudentForPortal}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center space-x-2">
            <span>Attendance Tracker Dashboard</span>
            <span>•</span>
            <span>Powered by Google Sheets API</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">75% Minimum Criteria Rule Enforced</span>
            <span>•</span>
            <button
              onClick={() => setActiveTab(activeTab === 'student' ? 'teacher' : 'student')}
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Switch to {activeTab === 'student' ? 'Teacher View' : 'Student Portal'}
            </button>
          </div>
        </div>
      </footer>

      {/* Confirmation Modal (MANDATORY for Google Workspace Mutations) */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        affectedItems={confirmDialog.affectedItems}
        confirmLabel={confirmDialog.confirmLabel}
        isDestructive={confirmDialog.isDestructive}
        isLoading={isLoading}
        onConfirm={() => {
          if (confirmDialog.action) {
            confirmDialog.action();
          }
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddModal}
        defaultTotalClasses={students[0]?.totalClasses || 45}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleInitiateAddStudent}
      />

      {/* Mark Class Session Modal */}
      <MarkSessionModal
        isOpen={showSessionModal}
        students={students}
        onClose={() => setShowSessionModal(false)}
        onSubmitSession={handleInitiateSession}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={!!studentToEdit}
        student={studentToEdit}
        onClose={() => setStudentToEdit(null)}
        onSubmitUpdate={handleInitiateEditStudent}
      />
    </div>
  );
}
