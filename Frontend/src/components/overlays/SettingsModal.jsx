import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';

export const SettingsModal = () => {
  const { isSettingsOpen, closeSettings, settings } = useAppStore();

  if (!isSettingsOpen) return null;

  return <SettingsDialog settings={settings} closeSettings={closeSettings} />;
};

const SettingsDialog = ({ settings, closeSettings }) => {
  const updateSettings = useAppStore((state) => state.updateSettings);
  const [localConversations, setLocalConversations] = useState(settings.conversationsPerPage);
  const [localTheme, setLocalTheme] = useState(settings.theme);

  const handleSave = () => {
    updateSettings({
      conversationsPerPage: Number(localConversations),
      theme: localTheme,
    });
    closeSettings();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#091540]/60 backdrop-blur-sm transition-opacity"
        onClick={closeSettings}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-7 py-5 bg-[#091540] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#ABD2FA]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">Inbox Preferences</h3>
              <p className="text-xs text-[#ABD2FA]/80">Configure your inbox preferences</p>
            </div>
          </div>
          <button
            onClick={closeSettings}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-7 space-y-6 bg-slate-50/50">
          {/* Conversation Page Size */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-[#091540]">
                Maximum page size
              </label>
              <span className="text-xs text-slate-500 font-medium">Conversations per page</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Similar to Gmail inbox display. Controls how many items render simultaneously.
            </p>
            <div className="relative">
              <select
                value={localConversations}
                onChange={(e) => setLocalConversations(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-[#091540] focus:ring-2 focus:ring-[#1B2CC1] focus:border-transparent outline-none transition-all cursor-pointer"
              >
                <option value={10}>10 conversations per page</option>
                <option value={25}>25 conversations per page (Recommended)</option>
                <option value={50}>50 conversations per page</option>
                <option value={100}>100 conversations per page</option>
              </select>
            </div>
          </div>

          {/* Theme Preference */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <label className="block text-sm font-semibold text-[#091540] mb-1">
              Visual Appearance
            </label>
            <p className="text-xs text-slate-500 mb-3">Select your workspace interface mood.</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLocalTheme(t.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    localTheme === t.id
                      ? 'bg-[#091540] text-white border-[#091540]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-7 py-4 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={closeSettings}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};
