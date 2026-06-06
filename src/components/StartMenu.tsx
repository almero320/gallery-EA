import { useState } from 'react';

type WindowType = 'gallery' | 'music' | 'upload' | 'pcbfixer';

type StartMenuProps = {
  onOpenWindow: (win: WindowType) => void;
  onShutdown: () => void;
};

// Pixel art icons matching desktop shortcuts
const GALLERY_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iOCIgeT0iOCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjM2IiBmaWxsPSJub25lIiBzdHJva2U9IiM4QTJCRTIiIHN0cm9rZS13aWR0aD0iNCIvPjxyZWN0IHg9IjE2IiB5PSIyMCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjI4IiB5PSIyMCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0MwNEZGRiIvPjxyZWN0IHg9IjQwIiB5PSIyMCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjE2IiB5PSIzMiIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0MwNEZGRiIvPjxyZWN0IHg9IjI4IiB5PSIzMiIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjQwIiB5PSIzMiIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0MwNEZGRiIvPjwvc3ZnPg==';
const MUSIC_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iMjQiIHk9IjI4IiB3aWR0aD0iOCIgaGVpZ2h0PSIyNCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjM2IiB5PSIyMCIgd2lkdGg9IjgiIGhlaWdodD0iMzIiIGZpbGw9IiM4QTJCRTIiLz48Y2lyY2xlIGN4PSIyOCIgY3k9IjUyIiByPSI0IiBmaWxsPSIjQzA0RkZGIi8+PGNpcmNsZSBjeD0iNDAiIGN5PSI1MiIgcj0iNCIgZmlsbD0iI0ZGMDBGRiIvPjwvc3ZnPg==';
const UPLOAD_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iMTYiIHk9IjMyIiB3aWR0aD0iMzIiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzhBMkJFMiIgc3Ryb2tlLXdpZHRoPSI0Ii8+PHJlY3QgeD0iMjQiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjI4IiBmaWxsPSIjRkYwMEZGIi8+PHJlY3QgeD0iMTYiIHk9IjIwIiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjQzA0RkZGIi8+PHJlY3QgeD0iMzIiIHk9IjIwIiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjQzA0RkZGIi8+PC9zdmc+';

// PCB-Fixer custom pixel art icon
const PCBFIXER_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiBmaWxsPSIjMDAyMjAwIiBzdHJva2U9IiNGRjAwRkYiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMyMjg4MjIiLz48cmVjdCB4PSI0OCIgeT0iNDgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMyMjg4MjIiLz48cmVjdCB4PSIxNiIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIyNCIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIzMiIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSI0MCIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIxMiIgeT0iMjAiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIxMiIgeT0iMjgiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIxMiIgeT0iMzYiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIxMiIgeT0iNDQiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIyMCIgeT0iMjQiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMzMzMiLz48cmVjdCB4PSIzMiIgeT0iMjQiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMzMzMiLz48cmVjdCB4PSIyNCIgeT0iMzIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiMzMzMzMzMiLz48cmVjdCB4PSIzNiIgeT0iMzYiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMzMzMiLz48cmVjdCB4PSI0NCIgeT0iMjgiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiMzMzMzMzMiLz48dGV4dCB4PSIxMiIgeT0iMTgiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC13ZWlnaHQ9ImJvbGQiPkE8L3RleHQ+PHRleHQgeD0iNTAiIHk9IjU4IiBmaWxsPSIjZmZmIiBmb250LXNpemU9IjYiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtd2VpZ2h0PSJib2xkIj5CPC90ZXh0Pjwvc3ZnPg==';

export default function StartMenu({ onOpenWindow, onShutdown }: StartMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { 
      label: "EA Galleri", 
      icon: GALLERY_ICON,
      action: () => onOpenWindow('gallery') 
    },
    { 
      label: "Music Station", 
      icon: MUSIC_ICON,
      action: () => onOpenWindow('music') 
    },
    { 
      label: "Upload Momen", 
      icon: UPLOAD_ICON,
      action: () => onOpenWindow('upload') 
    },
    { 
      label: "PCB-Fixer", 
      icon: PCBFIXER_ICON,
      action: () => onOpenWindow('pcbfixer') 
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="nes-btn is-primary flex items-center gap-3 px-8 py-3 text-base font-bold"
      >
        START
      </button>

      {isOpen && (
        <div className="absolute bottom-16 left-0 w-72 bg-white border-4 border-[#FF00FF] shadow-2xl z-50 rounded overflow-hidden">
          <div className="bg-gradient-to-r from-[#C44BFF] to-[#FF00FF] text-white p-4 font-bold text-center">
            MUSEUM MEMORIES OF EA
          </div>

          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.action();
                setIsOpen(false);
              }}
              className="w-full text-left px-6 py-4 hover:bg-[#FF00FF] hover:text-white border-b border-gray-200 last:border-none flex items-center gap-4"
            >
              <img src={item.icon} alt={item.label} className="w-8 h-8" />
              <span>{item.label}</span>
            </button>
          ))}

          {/* Shutdown Button */}
          <button
            onClick={() => {
              setIsOpen(false);
              onShutdown();
            }}
            className="w-full text-left px-6 py-4 text-red-600 hover:bg-red-600 hover:text-white border-t-2 border-gray-300 font-bold flex items-center gap-4"
          >
            <span className="text-2xl">⏻</span>
            <span>Shutdown</span>
          </button>
        </div>
      )}
    </div>
  );
}