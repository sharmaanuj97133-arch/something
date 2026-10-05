import React, { useState } from 'react';
import { CalendarCheck2, X, Check, Search, CheckSquare, XSquare, Users } from 'lucide-react';
import { StudentRecord } from '../types';

interface MarkSessionModalProps {
  isOpen: boolean;
  students: StudentRecord[];
  onClose: () => void;
  onSubmitSession: (
    sessionDetails: {
      date: string;
      subject: string;
      presentRolls: string[];
      absentRolls: string[];
    }
  ) => void;
}

export const MarkSessionModal: React.FC<MarkSessionModalProps> = ({
  isOpen,
  students,
  onClose,
  onSubmitSession,
}) => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('Computer Networks - Lecture Session');
  const [filterQuery, setFilterQuery] = useState('');

  // Map of rollNumber -> boolean (true = present, false = absent)
  // Default all students to true (present)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    students.forEach((s) => {
      init[s.rollNumber] = true;
    });
    return init;
  });

  if (!isOpen) return null;

  const toggleStudent = (roll: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [roll]: !prev[roll],
    }));
  };

  const markAll = (status: boolean) => {
    const updated: Record<string, boolean> = {};
    students.forEach((s) => {
      updated[s.rollNumber] = status;
    });
    setAttendanceMap(updated);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.rollNumber.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const presentCount = students.filter((s) => attendanceMap[s.rollNumber]).length;
  const absentCount = students.length - presentCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const presentRolls: string[] = [];
    const absentRolls: string[] = [];

    students.forEach((s) => {
      if (attendanceMap[s.rollNumber]) {
        presentRolls.push(s.rollNumber);
      } else {
        absentRolls.push(s.rollNumber);
      }
    });

    onSubmitSession({
      date,
      subject,
      presentRolls,
      absentRolls,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Mark Daily Attendance Session</h3>
              <p className="text-xs text-slate-500">Record attendance for today's lecture</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Top Session Details */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/40 grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Session Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Subject / Lecture Title
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Operating Systems - Lecture 12"
                required
                className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quick Actions & Tally */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            {/* Tally */}
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-semibold text-slate-500">Session Tally:</span>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold">
                ✓ {presentCount} Present
              </span>
              <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg font-bold">
                ✕ {absentCount} Absent
              </span>
            </div>

            {/* Quick Buttons */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => markAll(true)}
                className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center space-x-1"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>All Present</span>
              </button>
              <button
                type="button"
                onClick={() => markAll(false)}
                className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center space-x-1"
              >
                <XSquare className="w-3.5 h-3.5" />
                <span>All Absent</span>
              </button>
            </div>
          </div>

          {/* Search bar inside list */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/20 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search students in class..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Student Roll Call List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
            {filteredStudents.map((student) => {
              const isPresent = attendanceMap[student.rollNumber] ?? true;

              return (
                <div
                  key={student.rollNumber}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      {student.rollNumber}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-slate-800 block">
                        {student.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Current: {student.presentClasses}/{student.totalClasses} (
                        {student.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() =>
                        setAttendanceMap((prev) => ({ ...prev, [student.rollNumber]: true }))
                      }
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        isPresent
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAttendanceMap((prev) => ({ ...prev, [student.rollNumber]: false }))
                      }
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        !isPresent
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500">
              Each student's total classes will increment by +1.
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Review & Apply Attendance
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
