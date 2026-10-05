import React, { useState } from 'react';
import { UserPlus, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { StudentRecord } from '../types';
import { calculateAttendanceMetrics } from '../utils/calculator';

interface AddStudentModalProps {
  isOpen: boolean;
  defaultTotalClasses?: number;
  onClose: () => void;
  onSubmit: (student: StudentRecord) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  defaultTotalClasses = 45,
  onClose,
  onSubmit,
}) => {
  const [rollNumber, setRollNumber] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [totalClasses, setTotalClasses] = useState<number>(defaultTotalClasses);
  const [presentClasses, setPresentClasses] = useState<number>(Math.round(defaultTotalClasses * 0.8));
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const metrics = calculateAttendanceMetrics(presentClasses, totalClasses);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim() || !name.trim()) return;

    onSubmit({
      rollNumber: rollNumber.trim().toUpperCase(),
      name: name.trim(),
      department: department.trim(),
      totalClasses,
      presentClasses,
      percentage: metrics.percentage,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Add New Student</h3>
              <p className="text-xs text-slate-500">Record a new student in the attendance roster</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Roll Number *
              </label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. CS-111"
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ishaan Gupta"
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Department / Branch
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science & Engineering"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Classes Held
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={totalClasses}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setTotalClasses(val);
                  if (presentClasses > val) setPresentClasses(val);
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-center font-bold text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Classes Attended
              </label>
              <input
                type="number"
                min="0"
                max={totalClasses}
                value={presentClasses}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setPresentClasses(Math.min(totalClasses, val));
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-center font-bold text-slate-800"
                required
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="flex items-center justify-between p-3.5 bg-slate-100/80 rounded-xl text-xs">
            <span className="font-semibold text-slate-600">Calculated Attendance:</span>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-slate-900">
                {metrics.formattedPercentage}
              </span>
              {metrics.isDefaulter ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Short Attendance
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Eligible
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Medical certificate on file"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
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
              Save Student Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
