import { useState } from 'react';
import { Inbox, Search, Star, Trash2 } from 'lucide-react';
import { fetchMailMessages, updateMessageStar } from '../../services/mailService';
import { useAppStore } from '../../store/useAppStore';

export const FolderView = ({ title, description, items, emptyText, onSelectDraft }) => {
  const { toggleStar, deleteDraft, settings, syncMailMessages, showToast } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.recipient?.toLowerCase().includes(q) ||
      item.subject?.toLowerCase().includes(q) ||
      item.snippet?.toLowerCase().includes(q)
    );
  });

  // Gmail-style items per page limit
  const displayItems = filteredItems.slice(0, settings.conversationsPerPage || 25);

  const handleToggleStar = async (event, item) => {
    event.stopPropagation();
    toggleStar(item.id);
    if (item.id.startsWith('d-')) return;

    try {
      await updateMessageStar(item.id, !item.isStarred);
    } catch (error) {
      try {
        syncMailMessages(await fetchMailMessages());
      } catch (refreshError) {
        console.error(refreshError);
      }
      showToast('error', 'Could not update Starred', error.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fbff] p-4 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#091540]">{title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>

        {/* Search within folder */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-[#091540] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B2CC1] shadow-xs"
          />
        </div>
      </div>

      {/* List Container */}
      <div className="max-w-5xl mx-auto w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-[#ABD2FA]/15 overflow-hidden flex flex-col">
        {/* Table/List Header */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Showing up to {settings.conversationsPerPage} items per page</span>
          <span>{filteredItems.length} total conversations</span>
        </div>

        {/* List items */}
        {displayItems.length === 0 ? (
          <div className="py-20 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-[#ABD2FA]/20 flex items-center justify-center text-[#1B2CC1] mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#091540]">No items found</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-1">{emptyText}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="px-6 py-4 hover:bg-[#ABD2FA]/10 transition-colors flex items-center gap-4 group cursor-pointer"
                onClick={() => {
                  if (onSelectDraft && item.id.startsWith('d-')) {
                    onSelectDraft(item);
                  }
                }}
              >
                {/* Star action */}
                <button
                  type="button"
                  onClick={(event) => handleToggleStar(event, item)}
                  className="p-1 rounded-md text-slate-300 hover:text-amber-400 transition-colors"
                >
                  <Star
                    className={`w-5 h-5 ${
                      item.isStarred ? 'text-amber-400 fill-amber-400' : ''
                    }`}
                  />
                </button>

                {/* Recipient / Title */}
                <div className="w-48 shrink-0 truncate">
                  <span className="text-sm font-semibold text-[#091540]">
                    {item.recipient}
                  </span>
                </div>

                {/* Subject & snippet preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#091540] truncate">
                      {item.subject}
                    </span>
                    <span className="text-sm text-slate-400 truncate hidden md:inline">
                      — {item.snippet}
                    </span>
                  </div>
                </div>

                {/* Timestamp & Actions */}
                <div className="shrink-0 flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                    {item.timestamp}
                  </span>

                  {item.id.startsWith('d-') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDraft(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="Discard Draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
