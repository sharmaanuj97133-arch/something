import React, { useState, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  CalendarCheck2,
  FileSpreadsheet,
  Edit2,
  TrendingDown,
  UserPlus,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { StudentRecord } from '../types';
import { calculateAttendanceMetrics } from '../utils/calculator';

interface TeacherViewProps {
  students: StudentRecord[];
  connectedSheetUrl?: string;
  onOpenAddStudent: () => void;
  onOpenClassSession: () => void;
  onOpenEditStudent: (student: StudentRecord) => void;
  onSelectStudentForPortal: (rollNumber: string) => void;
}

type FilterType = 'all' | 'defaulters' | 'eligible';
type SortField = 'roll' | 'name' | 'percentage' | 'present';

export const TeacherView: React.FC<TeacherViewProps> = ({
  students,
  connectedSheetUrl,
  onOpenAddStudent,
  onOpenClassSession,
  onOpenEditStudent,
  onSelectStudentForPortal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('roll');
  const [sortAsc, setSortAsc] = useState(true);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0) {
      return { total: 0, defaulters: 0, eligible: 0, avgPercent: 0 };
    }

    let defaulters = 0;
    let sumPercentage = 0;

    for (const s of students) {
      const p = s.totalClasses > 0 ? (s.presentClasses / s.totalClasses) * 100 : 0;
      if (p < 75) defaulters++;
      sumPercentage += p;
    }

    const eligible = total - defaulters;
    const avgPercent = Math.round((sumPercentage / total) * 10) / 10;

    return { total, defaulters, eligible, avgPercent };
  }, [students]);

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    return students
      .filter((student) => {
        // Text search
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          student.rollNumber.toLowerCase().includes(q) ||
          student.name.toLowerCase().includes(q) ||
          (student.department && student.department.toLowerCase().includes(q));

        if (!matchesQuery) return false;

        const p = student.totalClasses > 0 ? (student.presentClasses / student.totalClasses) * 100 : 0;
        if (filterType === 'defaulters') return p < 75;
        if (filterType === 'eligible') return p >= 75;
        return true;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortField === 'roll') {
          valA = a.rollNumber;
          valB = b.rollNumber;
        } else if (sortField === 'name') {
          valA = a.name;
          valB = b.name;
        } else if (sortField === 'percentage') {
          valA = a.totalClasses > 0 ? a.presentClasses / a.totalClasses : 0;
          valB = b.totalClasses > 0 ? b.presentClasses / b.totalClasses : 0;
        } else if (sortField === 'present') {
          valA = a.presentClasses;
          valB = b.presentClasses;
        }

        if (typeof valA === 'string') {
          return sortAsc
            ? valA.localeCompare(String(valB), undefined, { numeric: true })
            : String(valB).localeCompare(valA, undefined, { numeric: true });
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [students, searchQuery, filterType, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'percentage' ? false : true); // default descending for %
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Total Enrolled
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
            <span className="text-xs text-slate-500">Active students in roster</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Defaulters (< 75%) */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200/90 shadow-xs flex items-center justify-between bg-linear-to-br from-rose-50/40 to-white">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500 block">
              Short Attendance (&lt; 75%)
            </span>
            <div className="text-2xl font-black text-rose-600 mt-1">{stats.defaulters}</div>
            <span className="text-xs text-rose-500 font-medium">Defaulters flagged</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Eligible Students (>= 75%) */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-xs flex items-center justify-between bg-linear-to-br from-emerald-50/40 to-white">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 block">
              Eligible Students (≥ 75%)
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{stats.eligible}</div>
            <span className="text-xs text-emerald-600 font-medium">Qualified for exams</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Class Average */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Class Average
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.avgPercent}%</div>
            <span className="text-xs text-slate-500">Overall class attendance</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Controls & Action Bar */}
        <div className="p-5 md:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Student Attendance Roster</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Defaulters below the mandatory 75% threshold are highlighted in red.
              </p>
            </div>

            {/* Quick Actions (Requirement: "with an option to add a new attendance entry") */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenClassSession}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs md:text-sm rounded-xl shadow-xs transition-colors"
              >
                <CalendarCheck2 className="w-4 h-4" />
                <span>Mark Class Session</span>
              </button>

              <button
                type="button"
                onClick={onOpenAddStudent}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs md:text-sm rounded-xl transition-colors"
              >
                <UserPlus className="w-4 h-4 text-slate-600" />
                <span>Add Student</span>
              </button>

              {connectedSheetUrl && (
                <a
                  href={connectedSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium text-xs rounded-xl border border-emerald-200/80 transition-colors"
                  title="Open live Google Sheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Google Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Search & Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, roll no, department..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterType === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('defaulters')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                  filterType === 'defaulters'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Defaulters ({stats.defaulters})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('eligible')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                  filterType === 'eligible'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle className="w-3 h-3" />
                <span>Eligible ({stats.eligible})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                <th
                  onClick={() => toggleSort('roll')}
                  className="py-3 px-4 sm:px-6 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Roll No</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Student Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Total</th>
                <th
                  onClick={() => toggleSort('present')}
                  className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Present</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Absent</th>
                <th
                  onClick={() => toggleSort('percentage')}
                  className="py-3 px-4 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Attendance %</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Status Badge</th>
                <th className="py-3 px-4 text-right sm:pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const m = calculateAttendanceMetrics(
                    student.presentClasses,
                    student.totalClasses
                  );

                  return (
                    <tr
                      key={student.rollNumber}
                      className={`transition-colors hover:bg-slate-50/90 ${
                        m.isDefaulter
                          ? 'bg-rose-50/50 hover:bg-rose-50/80 border-l-4 border-l-rose-500'
                          : 'border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Roll Number */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <button
                          type="button"
                          onClick={() => onSelectStudentForPortal(student.rollNumber)}
                          className="font-mono text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-800 hover:bg-indigo-100 hover:text-indigo-800 transition-colors"
                          title="Click to view student portal"
                        >
                          {student.rollNumber}
                        </button>
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{student.name}</div>
                        {student.department && (
                          <div className="text-[11px] text-slate-400">{student.department}</div>
                        )}
                      </td>

                      {/* Total Classes */}
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                        {student.totalClasses}
                      </td>

                      {/* Present Classes */}
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                        {student.presentClasses}
                      </td>

                      {/* Absent Classes */}
                      <td className="py-3.5 px-4 text-center font-medium text-rose-600">
                        {student.totalClasses - student.presentClasses}
                      </td>

                      {/* Attendance Percentage + Progress */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-black text-xs md:text-sm ${
                              m.isDefaulter ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {m.formattedPercentage}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.isDefaulter ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, m.percentage)}%` }}
                          />
                        </div>
                      </td>

                      {/* Status Badge (Requirement: Red "Short Attendance Warning" if < 75%, else Green "Eligible") */}
                      <td className="py-3.5 px-4">
                        {m.isDefaulter ? (
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Short Attendance Warning</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Eligible</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right sm:pr-6">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenEditStudent(student)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit student attendance record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectStudentForPortal(student.rollNumber)}
                            className="px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Open in Student Portal"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No students match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Showing <strong className="text-slate-800">{filteredStudents.length}</strong> of{' '}
            <strong className="text-slate-800">{students.length}</strong> total students
          </span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 text-rose-600 font-medium">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block" />
              <span>Red row indicates attendance shortfall (&lt; 75%)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
