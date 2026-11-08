import { useEffect } from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const ToastNotice = () => {
  const { toast, clearToast } = useAppStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  if (!toast || !toast.visible) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xl flex items-center gap-3.5 max-w-sm">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-600'
              : toast.type === 'error'
              ? 'bg-rose-50 text-rose-600'
              : 'bg-[#ABD2FA]/30 text-[#1B2CC1]'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
          {toast.type === 'error' && <X className="w-5 h-5" />}
          {toast.type === 'info' && <Sparkles className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#091540] truncate">{toast.title}</h4>
          <p className="text-xs text-slate-500 truncate">{toast.message}</p>
        </div>
        <button
          onClick={clearToast}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
