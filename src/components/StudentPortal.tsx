import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle,
  AlertTriangle,
  Calculator,
  User,
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { StudentRecord } from '../types';
import { calculateAttendanceMetrics } from '../utils/calculator';

interface StudentPortalProps {
  students: StudentRecord[];
  onSelectStudent?: (student: StudentRecord) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ students }) => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedRoll, setSelectedRoll] = useState<string>(
    students.length > 0 ? students[1]?.rollNumber || students[0]?.rollNumber || '' : ''
  );

  // Future simulation inputs
  const [simAttended, setSimAttended] = useState<number>(3);
  const [simMissed, setSimMissed] = useState<number>(0);

  // Quick suggestions based on search query
  const suggestions = useMemo(() => {
    if (!searchInput.trim()) return [];
    const q = searchInput.trim().toLowerCase();
    return students.filter(
      (s) =>
        s.rollNumber.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchInput, students]);

  // Current active student
  const activeStudent = useMemo(() => {
    if (!selectedRoll) return null;
    return students.find(
      (s) => s.rollNumber.toLowerCase() === selectedRoll.trim().toLowerCase()
    ) || null;
  }, [selectedRoll, students]);

  const metrics = useMemo(() => {
    if (!activeStudent) return null;
    return calculateAttendanceMetrics(activeStudent.presentClasses, activeStudent.totalClasses);
  }, [activeStudent]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    // Check direct match
    const match = students.find(
      (s) =>
        s.rollNumber.toLowerCase() === searchInput.trim().toLowerCase() ||
        s.name.toLowerCase() === searchInput.trim().toLowerCase()
    );

    if (match) {
      setSelectedRoll(match.rollNumber);
      setSearchInput('');
    } else if (suggestions.length > 0) {
      setSelectedRoll(suggestions[0].rollNumber);
      setSearchInput('');
    }
  };

  const handleSelectSuggestion = (roll: string) => {
    setSelectedRoll(roll);
    setSearchInput('');
  };

  // Simulation output
  const simulation = useMemo(() => {
    if (!metrics) return null;
    return metrics.simulateFuture(simAttended, simMissed);
  }, [metrics, simAttended, simMissed]);

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 md:p-8 shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-indigo-200 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Student Attendance Self-Service Portal</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Check Your Attendance & Exam Eligibility
          </h2>
          <p className="mt-2 text-sm text-indigo-100/80 leading-relaxed">
            Enter your Roll Number below to see your real-time attendance percentage, exam qualification status, and consecutive class planner.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="mt-5 relative">
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5 text-indigo-300" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Roll Number (e.g. CS-101, CS-102)..."
                className="w-full pl-12 pr-28 py-3.5 bg-white text-slate-900 placeholder-slate-400 text-sm md:text-base rounded-2xl shadow-lg focus:outline-hidden focus:ring-4 focus:ring-indigo-400/50 transition-all font-medium"
              />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs md:text-sm rounded-xl transition-all shadow-md active:scale-95"
              >
                Search
              </button>
            </div>

            {/* Suggestions drop-down */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-30 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                {suggestions.map((student) => {
                  const m = calculateAttendanceMetrics(student.presentClasses, student.totalClasses);
                  return (
                    <button
                      key={student.rollNumber}
                      type="button"
                      onClick={() => handleSelectSuggestion(student.rollNumber)}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50/80 flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg">
                          {student.rollNumber}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {student.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {student.department || 'General'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            m.isDefaulter
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {m.formattedPercentage}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </form>

          {/* Quick Select Chips */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-indigo-200">
            <span className="text-indigo-300 font-medium mr-1">Quick Select:</span>
            {students.slice(0, 6).map((s) => (
              <button
                key={s.rollNumber}
                type="button"
                onClick={() => setSelectedRoll(s.rollNumber)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedRoll.toLowerCase() === s.rollNumber.toLowerCase()
                    ? 'bg-white text-indigo-900 font-bold shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {s.rollNumber}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Student Report Card */}
      {activeStudent && metrics ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Dashboard Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-6">
            {/* Student Bio & Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-500 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                  {activeStudent.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                      {activeStudent.rollNumber}
                    </span>
                    {activeStudent.department && (
                      <span className="text-xs text-slate-500 font-medium">
                        • {activeStudent.department}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
                    {activeStudent.name}
                  </h3>
                </div>
              </div>

              {/* Requirement: Status Badge (Red "Short Attendance Warning" if < 75%, else Green "Eligible") */}
              <div>
                {metrics.isDefaulter ? (
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-xs animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold tracking-wide uppercase">
                      Short Attendance Warning
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold tracking-wide uppercase">
                      Eligible
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Progress Section */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Current Attendance
                  </span>
                  <div className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-0.5 flex items-baseline gap-2">
                    <span>{metrics.formattedPercentage}</span>
                    <span className="text-sm font-normal text-slate-400">
                      (Minimum threshold: 75%)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Class Ratio</span>
                  <span className="text-base font-bold text-slate-800">
                    {activeStudent.presentClasses} / {activeStudent.totalClasses}
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="relative pt-2 pb-1">
                {/* 75% Benchmark Target Marker */}
                <div
                  className="absolute top-0 transform -translate-x-1/2 z-10 flex flex-col items-center"
                  style={{ left: '75%' }}
                >
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 rounded-sm border border-amber-200">
                    75% Goal
                  </span>
                  <div className="w-0.5 h-6 bg-amber-400/80 mt-0.5" />
                </div>

                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      metrics.isDefaulter
                        ? 'bg-linear-to-r from-rose-500 to-rose-600'
                        : metrics.isHonors
                        ? 'bg-linear-to-r from-emerald-500 via-teal-500 to-indigo-600'
                        : 'bg-linear-to-r from-emerald-500 to-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, metrics.percentage)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0%</span>
                <span className="text-amber-600 font-semibold">75% Passing Threshold</span>
                <span>100%</span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs text-slate-500 font-medium block">Total Classes</span>
                <span className="text-xl md:text-2xl font-bold text-slate-800 mt-1 block">
                  {activeStudent.totalClasses}
                </span>
                <span className="text-[11px] text-slate-400">Held to date</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
                <span className="text-xs text-emerald-700 font-medium block">Present</span>
                <span className="text-xl md:text-2xl font-bold text-emerald-700 mt-1 block">
                  {activeStudent.presentClasses}
                </span>
                <span className="text-[11px] text-emerald-600">Attended</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 text-center">
                <span className="text-xs text-rose-700 font-medium block">Absent</span>
                <span className="text-xl md:text-2xl font-bold text-rose-700 mt-1 block">
                  {activeStudent.totalClasses - activeStudent.presentClasses}
                </span>
                <span className="text-[11px] text-rose-600">Missed</span>
              </div>
            </div>

            {/* Remarks / Notes */}
            {activeStudent.notes && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 flex items-start space-x-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700">Official Note: </span>
                  {activeStudent.notes}
                </div>
              </div>
            )}
          </div>

          {/* Calculator Card (Requirement 3: "If below 75%, show how many consecutive future classes they need to attend to reach 75%") */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    Consecutive Class Calculator
                  </h4>
                  <p className="text-xs text-slate-500">
                    Smart attendance target analysis
                  </p>
                </div>
              </div>

              {/* Defaulter Action Plan */}
              {metrics.isDefaulter ? (
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Attendance Shortfall Detected</span>
                  </div>

                  <p className="text-xs text-rose-700 leading-relaxed">
                    You currently have <span className="font-bold">{metrics.formattedPercentage}</span> attendance, which is below the mandatory 75% requirement.
                  </p>

                  <div className="bg-white/90 rounded-xl p-4 border border-rose-200/80 text-center shadow-xs">
                    <span className="text-xs text-slate-500 font-medium block">
                      Required Consecutive Classes:
                    </span>
                    <div className="text-3xl md:text-4xl font-extrabold text-rose-600 mt-1">
                      {metrics.classesNeededFor75}
                    </div>
                    <span className="text-xs font-semibold text-rose-700 mt-1 block">
                      Must attend next {metrics.classesNeededFor75} classes without missing any
                    </span>
                  </div>

                  <p className="text-[11px] text-rose-600/90 italic">
                    Formula: (Present + x) / (Total + x) ≥ 0.75 → Requires {metrics.classesNeededFor75} consecutive lectures.
                  </p>
                </div>
              ) : (
                /* Eligible Buffer Analysis */
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Attendance in Good Standing</span>
                  </div>

                  <p className="text-xs text-emerald-700 leading-relaxed">
                    You have <span className="font-bold">{metrics.formattedPercentage}</span> attendance. You have cleared the 75% minimum threshold!
                  </p>

                  <div className="bg-white/90 rounded-xl p-4 border border-emerald-200/80 text-center shadow-xs">
                    <span className="text-xs text-slate-500 font-medium block">
                      Safe Absence Margin:
                    </span>
                    <div className="text-3xl md:text-4xl font-extrabold text-emerald-600 mt-1">
                      {metrics.classesCanAffordToMiss}
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 mt-1 block">
                      {metrics.classesCanAffordToMiss === 0
                        ? 'Borderline! Missing even 1 class will drop you below 75%'
                        : `You can safely miss up to ${metrics.classesCanAffordToMiss} class${metrics.classesCanAffordToMiss > 1 ? 'es' : ''} while remaining ≥ 75%`}
                    </span>
                  </div>
                </div>
              )}

              {/* What-If Simulator */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Future Simulator</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Preview changes</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Attend next:
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={simAttended}
                        onChange={(e) => setSimAttended(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-center font-bold text-slate-800"
                      />
                      <span className="text-slate-400 text-xs">classes</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Miss next:
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={simMissed}
                        onChange={(e) => setSimMissed(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-center font-bold text-slate-800"
                      />
                      <span className="text-slate-400 text-xs">classes</span>
                    </div>
                  </div>
                </div>

                {simulation && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block">Projected Attendance:</span>
                      <span className="font-semibold text-slate-700">
                        {simulation.newPresent} / {simulation.newTotal} classes
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-base font-extrabold ${
                          simulation.isDefaulter ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {simulation.newPercentage.toFixed(1)}%
                      </span>
                      <span
                        className={`block text-[10px] font-bold ${
                          simulation.isDefaulter ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {simulation.isDefaulter ? 'Short Attendance' : 'Eligible'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Student Selected</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Please search for a student's roll number or click one of the quick select buttons above.
          </p>
        </div>
      )}
    </div>
  );
};
