import { useState } from 'react';
import { Layers, LockKeyhole } from 'lucide-react';
import { configureSmtpSession, endAuthSession } from '../../services/authService';
import { useAppStore } from '../../store/useAppStore';

export const SmtpCredentialsPage = ({ currentUser }) => {
  const setSmtpReady = useAppStore((state) => state.setSmtpReady);
  const logout = useAppStore((state) => state.logout);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await configureSmtpSession(password);
      setPassword('');
      setSmtpReady(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setError('');
    setIsLoggingOut(true);
    try {
      await endAuthSession();
      setPassword('');
      logout();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fbff] px-4 py-10 text-slate-800">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-[#ABD2FA]/20">
        <div className="bg-[#091540] px-8 py-8 text-white">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-tr from-[#1B2CC1] to-[#7692FF]">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Connect your Gmail</h1>
          <p className="mt-1 text-sm text-[#ABD2FA]">
            Enter your Gmail app password to send mail as your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-7">
          <label className="block text-sm font-medium text-slate-700">
            SMTP username
            <input
              type="email"
              value={currentUser.email}
              readOnly
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Gmail app password
            <input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#7692FF] focus:ring-2 focus:ring-[#7692FF]/20"
              placeholder="Enter your app password"
            />
          </label>

          <p className="flex gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#1B2CC1]" />
            This password is verified by Gmail and kept only in backend memory. It is
            not saved in MongoDB or browser storage. Use a Gmail app password, not
            your account password.
          </p>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full rounded-xl bg-[#1B2CC1] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#16249c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Verifying with Gmail...' : 'Verify and continue'}
          </button>
          <button
            type="button"
            disabled={isLoggingOut || isSubmitting}
            onClick={handleLogout}
            className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </form>
      </section>
    </main>
  );
};
