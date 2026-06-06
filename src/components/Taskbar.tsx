import StartMenu from './StartMenu';

type WindowType = 'gallery' | 'music' | 'upload' | 'pcbfixer';

type TaskbarProps = {
  openWindows: WindowType[];
  activeWindow: WindowType;
  onShutdown: () => void;
  minimizedWindows: Set<WindowType>;
  restoreWindow: (win: WindowType) => void;
  setActiveWindow: (win: WindowType) => void;
};

// Pixel art icons matching desktop shortcuts
const GALLERY_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iOCIgeT0iOCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjM2IiBmaWxsPSJub25lIiBzdHJva2U9IiM4QTJCRTIiIHN0cm9rZS13aWR0aD0iNCIvPjxyZWN0IHg9IjE2IiB5PSIyMCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjI4IiB5PSIyMCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0MwNEZGRiIvPjxyZWN0IHg9IjQwIiB5PSIyMCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjE2IiB5PSIzMiIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0MwNEZGRiIvPjxyZWN0IHg9IjI4IiB5PSIzMiIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjQwIiB5PSIzMiIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0MwNEZGRiIvPjwvc3ZnPg==';
const MUSIC_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iMjQiIHk9IjI4IiB3aWR0aD0iOCIgaGVpZ2h0PSIyNCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjM2IiB5PSIyMCIgd2lkdGg9IjgiIGhlaWdodD0iMzIiIGZpbGw9IiM4QTJCRTIiLz48Y2lyY2xlIGN4PSIyOCIgY3k9IjUyIiByPSI0IiBmaWxsPSIjQzA0RkZGIi8+PGNpcmNsZSBjeD0iNDAiIGN5PSI1MiIgcj0iNCIgZmlsbD0iI0ZGMDBGRiIvPjwvc3ZnPg==';
const UPLOAD_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iMTYiIHk9IjMyIiB3aWR0aD0iMzIiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzhBMkJFMiIgc3Ryb2tlLXdpZHRoPSI0Ii8+PHJlY3QgeD0iMjQiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjI4IiBmaWxsPSIjRkYwMEZGIi8+PHJlY3QgeD0iMTYiIHk9IjIwIiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjQzA0RkZGIi8+PHJlY3QgeD0iMzIiIHk9IjIwIiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjQzA0RkZGIi8+PC9zdmc+';

// PCB-Fixer custom pixel art icon
const PCBFIXER_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiBmaWxsPSIjMDAyMjAwIiBzdHJva2U9IiNGRjAwRkYiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMyMjg4MjIiLz48cmVjdCB4PSI0OCIgeT0iNDgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMyMjg4MjIiLz48cmVjdCB4PSIxNiIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIyNCIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIzMiIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSI0MCIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIxMiIgeT0iMjAiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIxMiIgeT0iMjgiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIxMiIgeT0iMzYiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIxMiIgeT0iNDQiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIyMCIgeT0iMjQiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMzMzMiLz48cmVjdCB4PSIzMiIgeT0iMjQiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMzMzMiLz48cmVjdCB4PSIyNCIgeT0iMzIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiMzMzMzMzMiLz48cmVjdCB4PSIzNiIgeT0iMzYiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMzMzMiLz48cmVjdCB4PSI0NCIgeT0iMjgiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiMzMzMzMzMiLz48dGV4dCB4PSIxMiIgeT0iMTgiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC13ZWlnaHQ9ImJvbGQiPkE8L3RleHQ+PHRleHQgeD0iNTAiIHk9IjU4IiBmaWxsPSIjZmZmIiBmb250LXNpemU9IjYiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtd2VpZ2h0PSJib2xkIj5CPC90ZXh0Pjwvc3ZnPg==';

export default function Taskbar({ 
  openWindows, 
  activeWindow, 
  onShutdown,
  minimizedWindows,
  restoreWindow,
  setActiveWindow
}: TaskbarProps) {

  const windowsList = [
    { id: 'gallery' as WindowType, label: 'DONGO GALLERY', shortLabel: 'Gallery', icon: GALLERY_ICON },
    { id: 'music' as WindowType, label: 'LO-FI STATION', shortLabel: 'Music', icon: MUSIC_ICON },
    { id: 'upload' as WindowType, label: 'UPLOAD MOMENTS', shortLabel: 'Upload', icon: UPLOAD_ICON },
    { id: 'pcbfixer' as WindowType, label: 'PCB-FIXER', shortLabel: 'PCB', icon: PCBFIXER_ICON },
  ];

  const handleTaskbarClick = (win: WindowType) => {
    if (minimizedWindows.has(win)) {
      restoreWindow(win);
    } else if (activeWindow === win) {
      setActiveWindow(win);
    } else {
      setActiveWindow(win);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-14 sm:h-16 bg-white/95 border-t-4 border-[#FF00FF] flex items-center px-2 sm:px-4 z-50 backdrop-blur-sm">

      {/* Start Menu */}
      <StartMenu 
        onOpenWindow={restoreWindow}
        onShutdown={onShutdown} 
      />

      {/* Open Windows */}
      <div className="flex gap-1 sm:gap-3 ml-2 sm:ml-6 overflow-x-auto">
        {windowsList.map((win) => {
          const isOpen = openWindows.includes(win.id);
          const isMinimized = minimizedWindows.has(win.id);
          return isOpen ? (
            <button
              key={win.id}
              onClick={() => handleTaskbarClick(win.id)}
              className={`flex items-center gap-1 sm:gap-3 px-2 sm:px-6 h-9 sm:h-11 text-xs sm:text-sm font-medium border-2 transition-all rounded flex-shrink-0 ${
                activeWindow === win.id && !isMinimized
                  ? 'bg-[#FF00FF] text-white border-[#FF00FF]' 
                  : isMinimized
                    ? 'bg-yellow-100 text-[#4B0082] border-[#FF00FF]/60 italic'
                    : 'border-[#FF00FF]/60 hover:bg-white/80'
              }`}
            >
              <img src={win.icon} alt={win.label} className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{win.label}</span>
              <span className="sm:hidden">{win.shortLabel}</span>
            </button>
          ) : null;
        })}
      </div>

      {/* System Tray */}
      <div className="ml-auto flex items-center gap-2 sm:gap-6 text-xs sm:text-sm text-[#4B0082]">
        <div className="hidden sm:block">Magelang, Indonesia</div>
        <div className="font-mono text-xs">
          {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-xs border border-[#FF00FF]/50 px-2 sm:px-3 py-1 rounded hidden sm:block">
          © 1998 Alien320
        </div>
      </div>
    </div>
  );
}