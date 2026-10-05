import React from 'react';
import { AlertTriangle, CheckCircle, HelpCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  affectedItems?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  affectedItems,
  confirmLabel = 'Confirm & Proceed',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-xl flex items-center justify-center ${
                isDestructive
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-indigo-100 text-indigo-600'
              }`}
            >
              {isDestructive ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <HelpCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 id="modal-title" className="text-lg font-semibold text-slate-900">
                {title}
              </h3>
              <p className="text-xs text-slate-500">Google Sheets Mutation Confirmation</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>

          {affectedItems && affectedItems.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 text-xs">
              <span className="font-semibold text-slate-700 block mb-2">
                Affected Entries ({affectedItems.length}):
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-100">
                {affectedItems.map((item, idx) => (
                  <div key={idx} className="pt-1 first:pt-0 text-slate-600 font-mono text-[11px] truncate">
                    • {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center text-xs text-slate-500 bg-amber-50 border border-amber-200/60 rounded-lg p-2.5 space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>This action directly updates user data in the connected Google Sheet.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-4 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-slate-300"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 text-sm font-medium text-white rounded-xl shadow-xs transition-colors flex items-center space-x-2 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-400'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400'
            } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
            )}
            <span>{isLoading ? 'Updating...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
