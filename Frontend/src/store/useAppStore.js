import { create } from 'zustand';
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  storeAuthToken,
} from '../services/authToken';

export const useAppStore = create((set, get) => ({
  currentUser: null,
  authToken: getStoredAuthToken(),
  smtpReady: false,
  setAuthentication: (currentUser, authToken) => {
    storeAuthToken(authToken);
    set({
      currentUser,
      authToken,
      smtpReady: false,
      activeTab: 'compose',
      starredMessages: [],
      sentMessages: [],
      drafts: [],
      composer: { recipient: '', subject: '', message: '', lastSaved: null },
    });
  },
  setCurrentUser: (currentUser) => set({ currentUser }),
  setSmtpReady: (smtpReady) => set({ smtpReady }),
  logout: () => {
    clearStoredAuthToken();
    set({
      currentUser: null,
      authToken: null,
      smtpReady: false,
      activeTab: 'compose',
      composer: { recipient: '', subject: '', message: '', lastSaved: null },
      starredMessages: [],
      sentMessages: [],
      scheduledMessages: [],
      drafts: [],
      toast: null,
      isSettingsOpen: false,
    });
  },

  // Sidebar state
  isSidebarOpen: true,
  isMobileSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  setMobileSidebar: (open) => set({ isMobileSidebarOpen: open }),

  // Navigation
  activeTab: 'compose', // 'compose' | 'starred' | 'sent' | 'scheduled' | 'drafts'
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Composer State
  composer: {
    recipient: '',
    subject: '',
    message: '',
    lastSaved: null,
  },
  setComposerField: (field, value) =>
    set((state) => ({
      composer: { ...state.composer, [field]: value },
    })),
  resetComposer: () =>
    set({
      composer: { recipient: '', subject: '', message: '', lastSaved: null },
    }),

  // Message Repositories
  starredMessages: [],
  sentMessages: [],
  scheduledMessages: [],
  drafts: [],

  // Actions on lists
  toggleStar: (id) =>
    set((state) => {
      const currentItem = [
        ...state.sentMessages,
        ...state.scheduledMessages,
        ...state.drafts,
        ...state.starredMessages,
      ].find((item) => item.id === id);
      if (!currentItem) return state;

      const isStarred = !currentItem.isStarred;
      const updateList = (list) =>
        list.map((item) => (item.id === id ? { ...item, isStarred } : item));
      const sentMessages = updateList(state.sentMessages);
      const scheduledMessages = updateList(state.scheduledMessages);
      const drafts = updateList(state.drafts);
      const starredMessages = [
        ...new Map(
          [...sentMessages, ...scheduledMessages, ...drafts, ...updateList(state.starredMessages)]
            .filter((item) => item.isStarred)
            .map((item) => [item.id, item]),
        ).values(),
      ];
      return {
        starredMessages,
        sentMessages,
        scheduledMessages,
        drafts,
      };
    }),

  // Manual explicit save only
  saveAsDraft: (recipientOverride) => {
    const { composer, drafts } = get();
    const recipient = recipientOverride ?? composer.recipient;
    if (!composer.subject.trim() && !composer.message.trim() && !recipient.trim()) {
      set({
        toast: {
          visible: true,
          type: 'error',
          title: 'Empty Draft',
          message: 'Please write a subject or message content before saving.',
        },
      });
      return false;
    }
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newDraft = {
      id: 'd-' + Date.now(),
      recipient: recipient || 'No recipient',
      subject: composer.subject || '(Untitled Draft)',
      snippet: composer.message ? composer.message.slice(0, 75) + '...' : '(Empty message body)',
      message: composer.message,
      timestamp: `Saved today at ${timeString}`,
      isStarred: false,
    };

    set({
      drafts: [newDraft, ...drafts],
      composer: { ...composer, lastSaved: timeString },
      toast: {
        visible: true,
        type: 'success',
        title: 'Draft Saved',
        message: `Saved at ${timeString}. You can find it under Drafts.`,
      },
    });
    return true;
  },

  deleteDraft: (id) =>
    set((state) => ({
      drafts: state.drafts.filter((draft) => draft.id !== id),
      starredMessages: state.starredMessages.filter((message) => message.id !== id),
      toast: {
        visible: true,
        type: 'info',
        title: 'Draft Discarded',
        message: 'The draft was removed from storage.',
      },
    })),

  recordSentMessages: (messages) =>
    set((state) => ({
      sentMessages: [...messages, ...state.sentMessages],
    })),
  syncMailMessages: ({ scheduledMessages, sentMessages }) =>
    set((state) => {
      const syncedSent = sentMessages.map((message) => ({
        ...message,
        isStarred: Boolean(message.isStarred),
      }));
      const syncedScheduled = scheduledMessages.map((message) => ({
        ...message,
        isStarred: Boolean(message.isStarred),
      }));
      const syncedStarred = [
        ...syncedSent,
        ...syncedScheduled,
        ...state.drafts,
      ].filter((message) => message.isStarred);

      return {
        sentMessages: syncedSent,
        scheduledMessages: syncedScheduled,
        starredMessages: syncedStarred,
      };
    }),
  addScheduledMessage: (message) =>
    set((state) => ({
      scheduledMessages: [message, ...state.scheduledMessages],
    })),
  showToast: (type, title, message) =>
    set({ toast: { visible: true, type, title, message } }),

  // Settings State
  settings: {
    conversationsPerPage: 25,
    theme: 'light',
  },
  isSettingsOpen: false,
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  // Toast / Alerts
  toast: null,
  clearToast: () => set({ toast: null }),
}));
