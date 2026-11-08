import { Layers, Menu, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';

export const MobileHeader = () => {
  const { toggleMobileSidebar, setActiveTab } = useAppStore();

  return (
    <header className="md:hidden h-16 bg-[#091540] text-white px-4 flex items-center justify-between border-b border-white/10 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-xl bg-white/10 text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1B2CC1] flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide">MultiMail</span>
        </div>
      </div>

      <Button
        size="sm"
        variant="accent"
        icon={Send}
        onClick={() => setActiveTab('compose')}
      >
        Compose
      </Button>
    </header>
  );
};
