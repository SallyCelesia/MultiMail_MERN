import './App.css';
import { useEffect, useRef, useState } from 'react';
import { AuthPage } from './components/auth/AuthPage';
import { SmtpCredentialsPage } from './components/auth/SmtpCredentialsPage';
import { Sidebar } from './components/layout/Sidebar';
import { MobileHeader } from './components/layout/MobileHeader';
import { ComposerView } from './components/views/ComposerView';
import { FolderView } from './components/views/FolderView';
import { SettingsModal } from './components/overlays/SettingsModal';
import { ToastNotice } from './components/overlays/ToastNotice';
import { fetchCurrentUser } from './services/authService';
import { fetchMailMessages } from './services/mailService';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const syncMailMessages = useAppStore((state) => state.syncMailMessages);
  const showToast = useAppStore((state) => state.showToast);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const logout = useAppStore((state) => state.logout);
  const hasReportedMailServerError = useRef(false);
  const [authError, setAuthError] = useState('');
  const {
    currentUser,
    authToken,
    smtpReady,
    activeTab,
    setActiveTab,
    starredMessages,
    sentMessages,
    scheduledMessages,
    drafts,
    setComposerField,
    settings,
  } = useAppStore();

  useEffect(() => {
    let active = true;
    if (!authToken) return undefined;
    fetchCurrentUser(authToken)
      .then(({ user }) => {
        if (active) {
          setCurrentUser(user);
          setAuthError('');
        }
      })
      .catch((error) => {
        if (!active) return;
        setAuthError(
          error.status === 401
            ? 'Your session expired. Please sign in again.'
            : `Sign-in unavailable: ${error.message}`,
        );
        logout();
      });

    return () => {
      active = false;
    };
  }, [authToken, logout, setCurrentUser, showToast]);

  useEffect(() => {
    if (!authToken || !currentUser) return undefined;
    let active = true;
    const refreshMessages = async () => {
      try {
        const messages = await fetchMailMessages();
        if (active) {
          hasReportedMailServerError.current = false;
          syncMailMessages(messages);
        }
      } catch (error) {
        if (active && error.status === 401) {
          logout();
        } else if (active && !hasReportedMailServerError.current) {
          hasReportedMailServerError.current = true;
          console.error(error);
          showToast('error', 'Mail server unavailable', error.message);
        }
      }
    };

    refreshMessages();
    const intervalId = setInterval(refreshMessages, 5000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [authToken, currentUser, logout, showToast, syncMailMessages]);

  const handleSelectDraft = (draft) => {
    setComposerField('recipient', draft.recipient === 'No recipient' ? '' : draft.recipient);
    setComposerField('subject', draft.subject.replace('Draft: ', ''));
    setComposerField('message', draft.message || '');
    setActiveTab('compose');
  };

  if (authToken && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fbff] text-sm text-slate-500">
        Checking your sign-in...
      </div>
    );
  }

  if (!currentUser) return <AuthPage initialError={authError} />;
  if (!smtpReady) return <SmtpCredentialsPage currentUser={currentUser} />;

  return (
    <div
      data-theme={settings.theme}
      className="flex h-screen w-screen overflow-hidden bg-[#f8fbff] text-slate-800 font-sans antialiased"
    >
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <MobileHeader />

        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'compose' && <ComposerView />}

          {activeTab === 'starred' && (
            <FolderView
              title="Starred Conversations"
              description="Important flagged emails and prioritized team threads."
              items={starredMessages}
              emptyText="You have not starred any conversations yet. Click the star icon on any message to pin it here."
            />
          )}

          {activeTab === 'sent' && (
            <FolderView
              title="Sent Messages"
              description="Historical log of successfully dispatched emails."
              items={sentMessages}
              emptyText="No sent messages recorded in this session."
            />
          )}

          {activeTab === 'scheduled' && (
            <FolderView
              title="Scheduled Messages"
              description="Queued transmissions set to automatically deliver at a later time."
              items={scheduledMessages}
              emptyText="There are no scheduled transmissions in queue."
            />
          )}

          {activeTab === 'drafts' && (
            <FolderView
              title="Saved Drafts"
              description="WIP messages saved locally. Click any item to continue editing in the composer."
              items={drafts}
              emptyText="No active drafts found. Save your current composition to see it listed here."
              onSelectDraft={handleSelectDraft}
            />
          )}
        </div>
      </main>

      <SettingsModal />
      <ToastNotice />
    </div>
  );
}
