import React, { useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { ConnectedSheetInfo } from '../types';
import { extractSpreadsheetId, getSpreadsheetDetails } from '../services/sheets';

interface SheetManagerProps {
  user: User | null;
  token: string | null;
  connectedSheet: ConnectedSheetInfo | null;
  isLoading: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onConnectSheet: (sheetId: string, sheetTitle: string, tabName: string) => Promise<void>;
  onCreateNewSheet: () => Promise<void>;
  onRefreshData: () => Promise<void>;
  onDisconnectSheet: () => void;
}

export const SheetManager: React.FC<SheetManagerProps> = ({
  user,
  token,
  connectedSheet,
  isLoading,
  onLogin,
  onLogout,
  onConnectSheet,
  onCreateNewSheet,
  onRefreshData,
  onDisconnectSheet,
}) => {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [sheetInput, setSheetInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [verifiedTitle, setVerifiedTitle] = useState<string>('');
  const [verifiedId, setVerifiedId] = useState<string>('');

  const handleVerifySheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const id = extractSpreadsheetId(sheetInput);
    if (!id) {
      setErrorMsg('Please enter a valid Google Sheets URL or Spreadsheet ID.');
      return;
    }

    if (!token) {
      setErrorMsg('Please sign in with Google first.');
      return;
    }

    try {
      setIsVerifying(true);
      const details = await getSpreadsheetDetails(token, id);
      setVerifiedTitle(details.title);
      setVerifiedId(details.id);
      const tabs = details.sheets.map((s) => s.title);
      setAvailableTabs(tabs);
      setSelectedTab(tabs[0] || 'Sheet1');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not access sheet. Ensure your Google account has permission.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFinalizeConnect = async () => {
    if (!verifiedId || !selectedTab) return;
    try {
      setIsVerifying(true);
      await onConnectSheet(verifiedId, verifiedTitle, selectedTab);
      setShowConnectModal(false);
      setSheetInput('');
      setAvailableTabs([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect sheet.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Connection Status */}
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                connectedSheet
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/70'
                  : 'bg-amber-50 text-amber-600 border border-amber-200/70'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Data Source:
                </span>
                {connectedSheet ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Google Sheets Synced
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    Local / Demo Mode
                  </span>
                )}
              </div>

              <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                {connectedSheet ? (
                  <>
                    <span className="truncate max-w-[200px] sm:max-w-xs">{connectedSheet.name}</span>
                    <span className="text-xs text-slate-400 font-normal">({connectedSheet.sheetTabName})</span>
                    <a
                      href={connectedSheet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 p-0.5 rounded-md hover:bg-indigo-50 inline-flex items-center ml-1 text-xs"
                      title="Open Google Sheet in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </>
                ) : (
                  <span>Using loaded course roster (Connect your Google Sheet below)</span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {connectedSheet ? (
              <>
                <button
                  type="button"
                  onClick={onRefreshData}
                  disabled={isLoading}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                  title="Reload rows from Google Sheet"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Sync Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConnectModal(true)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Change Sheet
                </button>
              </>
            ) : user ? (
              <>
                <button
                  type="button"
                  onClick={onCreateNewSheet}
                  disabled={isLoading}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create Template Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConnectModal(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Link Existing Sheet</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <GoogleSignInButton
                  onClick={onLogin}
                  isLoading={isLoading}
                  label="Connect Google Sheets"
                  className="text-xs py-1.5 px-3.5 rounded-lg"
                />
              </div>
            )}

            {/* User Profile / Logout */}
            {user && (
              <div className="flex items-center pl-2 ml-1 border-l border-slate-200 space-x-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-300 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="text-xs text-slate-600 max-w-[100px] truncate hidden lg:inline font-medium">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={onLogout}
                  title="Sign out of Google"
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connect Existing Sheet Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-900">Connect Your Google Sheet</h3>
              </div>
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  setErrorMsg(null);
                  setAvailableTabs([]);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!user ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-slate-600">
                    Sign in with Google to allow this application to read and write attendance to your Google Sheets.
                  </p>
                  <GoogleSignInButton onClick={onLogin} isLoading={isLoading} />
                </div>
              ) : availableTabs.length === 0 ? (
                <form onSubmit={handleVerifySheet} className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Paste the link to your Google Sheet or its Spreadsheet ID. Make sure the account{' '}
                    <span className="font-medium text-slate-800">({user.email})</span> has access to view and edit it.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Google Sheet URL or ID
                    </label>
                    <input
                      type="text"
                      value={sheetInput}
                      onChange={(e) => setSheetInput(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  {errorMsg && (
                    <div className="flex items-center space-x-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowConnectModal(false);
                        onCreateNewSheet();
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center space-x-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Or create a new template sheet</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isVerifying || !sheetInput.trim()}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-colors"
                    >
                      {isVerifying ? 'Checking Sheet...' : 'Verify Sheet'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                    <div className="font-semibold text-emerald-800">✓ Sheet Verified!</div>
                    <div className="text-emerald-700">{verifiedTitle}</div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Tab with Attendance Records
                    </label>
                    <select
                      value={selectedTab}
                      onChange={(e) => setSelectedTab(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {availableTabs.map((tab) => (
                        <option key={tab} value={tab}>
                          {tab}
                        </option>
                      ))}
                    </select>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center space-x-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setAvailableTabs([])}
                      className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalizeConnect}
                      disabled={isVerifying}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                    >
                      {isVerifying ? 'Connecting...' : 'Connect This Tab'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
