import { useState } from 'react';
import { Layers } from 'lucide-react';
import { logIn, signUp } from '../../services/authService';
import { useAppStore } from '../../store/useAppStore';

const passwordRules = [
  { label: 'At least 6 characters', test: (password) => password.length >= 6 },
  { label: 'At least one number', test: (password) => /\d/.test(password) },
  { label: 'At least one symbol', test: (password) => /[^A-Za-z0-9\s]/.test(password) },
];

export const AuthPage = ({ initialError = '' }) => {
  const setAuthentication = useAppStore((state) => state.setAuthentication);
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === 'signup';
  const passwordValid = passwordRules.every((rule) => rule.test(password));
  const passwordMatches = password === confirmPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (isSignup && !passwordValid) {
      setError('Meet all password requirements before creating your account.');
      return;
    }
    if (isSignup && !passwordMatches) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = isSignup
        ? await signUp({ name, email, password })
        : await logIn({ email, password });
      setAuthentication(result.user, result.token);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fbff] px-4 py-10 text-slate-800">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-[#ABD2FA]/20">
        <div className="bg-[#091540] px-8 py-8 text-white">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-tr from-[#1B2CC1] to-[#7692FF]">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">MultiMail</h1>
          <p className="mt-1 text-sm text-[#ABD2FA]">
            {isSignup ? 'Create your workspace account' : 'Sign in to your workspace'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-7">
          {isSignup && (
            <label className="block text-sm font-medium text-slate-700">
              Name
              <input
                autoComplete="name"
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#7692FF] focus:ring-2 focus:ring-[#7692FF]/20"
                placeholder="Your name"
              />
            </label>
          )}

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#7692FF] focus:ring-2 focus:ring-[#7692FF]/20"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#7692FF] focus:ring-2 focus:ring-[#7692FF]/20"
              placeholder="Enter your password"
            />
          </label>

          {isSignup && (
            <>
              <ul className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs">
                {passwordRules.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <li
                      key={rule.label}
                      className={passed ? 'text-emerald-700' : 'text-slate-500'}
                    >
                      <span aria-hidden="true">{passed ? '✓' : '○'}</span>
                      <span className="ml-2">{rule.label}</span>
                    </li>
                  );
                })}
              </ul>

              <label className="block text-sm font-medium text-slate-700">
                Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#7692FF] focus:ring-2 focus:ring-[#7692FF]/20"
                  placeholder="Re-enter your password"
                />
              </label>
              {confirmPassword && !passwordMatches && (
                <p className="-mt-3 text-xs text-rose-600">Passwords do not match.</p>
              )}
            </>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || (isSignup && (!passwordValid || !passwordMatches))}
            className="w-full rounded-xl bg-[#1B2CC1] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#16249c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? 'Please wait...'
              : isSignup
                ? 'Create account'
                : 'Log in'}
          </button>

          <p className="text-center text-sm text-slate-500">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => switchMode(isSignup ? 'login' : 'signup')}
              className="font-semibold text-[#1B2CC1] hover:underline"
            >
              {isSignup ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
};
