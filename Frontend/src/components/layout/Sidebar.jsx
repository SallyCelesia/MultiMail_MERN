import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Clock, FileText, Layers, LogOut, Send, Settings, Sliders, Star, X } from 'lucide-react';
import { endAuthSession } from '../../services/authService';
import { useAppStore } from '../../store/useAppStore';

export const Sidebar = () => {
  const {
    currentUser,
    isSidebarOpen,
    toggleSidebar,
    activeTab,
    setActiveTab,
    starredMessages,
    sentMessages,
    scheduledMessages,
    drafts,
    openSettings,
    logout,
    showToast,
    isMobileSidebarOpen,
    setMobileSidebar,
  } = useAppStore();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await endAuthSession();
      logout();
    } catch (error) {
      showToast(
        'error',
        'Logout could not be completed',
        `${error.message} Your mail session is still active; try logging out again.`,
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    {
      id: 'compose',
      label: 'New Message',
      icon: Send,
      count: null,
      highlight: true,
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: Star,
      count: starredMessages.length,
    },
    {
      id: 'sent',
      label: 'Sent msgs',
      icon: ArrowRight,
      count: sentMessages.length,
    },
    {
      id: 'scheduled',
      label: 'Scheduled',
      icon: Clock,
      count: scheduledMessages.length,
    },
    {
      id: 'drafts',
      label: 'Drafts',
      icon: FileText,
      count: drafts.length,
    },
  ];

  return (
    <>
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#091540]/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      {/* Main Sidebar Shell: 30% Midnight Navy (#091540) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col justify-between bg-[#091540] text-slate-100 transition-all duration-300 ease-in-out border-r border-[#091540] shadow-xl md:shadow-none ${
          isSidebarOpen ? 'w-72' : 'w-20'
        } ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Toggle Header */}
          <div className="h-20 px-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-[#1B2CC1] to-[#7692FF] flex items-center justify-center shadow-lg shadow-[#1B2CC1]/40 shrink-0">
                <Layers className="w-5 h-5 text-white" />
              </div>
              {isSidebarOpen && (
                <div className="leading-tight transition-opacity duration-200 whitespace-nowrap">
                  <h1 className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
                    MultiMail
                  </h1>
                  <span className="text-xs text-[#ABD2FA]/70">Workspace Suite</span>
                </div>
              )}
            </div>

            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-2 rounded-xl text-[#ABD2FA]/80 hover:text-white hover:bg-white/10 transition-colors"
              title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setMobileSidebar(false)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3.5 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebar(false);
                  }}
                  className={`w-full group relative flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    item.highlight && !isActive
                      ? 'bg-linear-to-r from-[#1B2CC1] to-[#1B2CC1]/80 text-white shadow-md hover:brightness-110 mb-2'
                      : isActive
                      ? 'bg-[#1B2CC1] text-white shadow-lg shadow-[#1B2CC1]/30 font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : item.highlight ? 'text-white' : 'text-[#ABD2FA]'
                    }`}
                  />

                  {isSidebarOpen && (
                    <div className="flex-1 flex items-center justify-between overflow-hidden">
                      <span className="truncate">{item.label}</span>
                      {item.count !== null && item.count > 0 && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            isActive
                              ? 'bg-white text-[#1B2CC1]'
                              : 'bg-white/10 text-[#ABD2FA]'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </div>
                  )}

                  {!isSidebarOpen && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#091540] border border-white/20 text-white text-xs rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                      {item.label}
                      {item.count !== null && ` (${item.count})`}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Area: Signed-in profile avatar & Settings */}
        <div className="p-3.5 border-t border-white/10 bg-black/15">
          <button
            onClick={openSettings}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors mb-2 group"
            title={!isSidebarOpen ? 'Settings' : undefined}
          >
            <Settings className="w-5 h-5 text-[#ABD2FA] group-hover:rotate-45 transition-transform shrink-0" />
            {isSidebarOpen && <span>Settings</span>}
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-white/10 transition-all text-left group"
            >
              <div className="relative shrink-0">
                <div
                  aria-label={currentUser.name}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7692FF] font-semibold text-white ring-2 ring-[#7692FF]/50 group-hover:ring-[#ABD2FA]"
                >
                  {currentUser.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#091540]" />
              </div>

              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate leading-tight">
                    {currentUser.name}
                  </h4>
                  <p className="text-xs text-[#ABD2FA]/70 truncate">{currentUser.email}</p>
                </div>
              )}
            </button>

            {/* Profile Dropdown */}
            {profileMenuOpen && (
              <div className="absolute bottom-full left-0 mb-3 w-64 bg-white text-[#091540] rounded-2xl shadow-2xl border border-slate-200/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 border-b border-slate-100 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7692FF] font-semibold text-white">
                    {currentUser.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#091540] truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                      Signed in
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      openSettings();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2.5"
                  >
                    <Sliders className="w-4 h-4 text-[#1B2CC1]" />
                    Preferences
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
