import { useState, useCallback, useEffect } from "react";
import { Rnd } from "react-rnd";
import { CloudinaryMedia } from "./components/CloudinaryMedia";
import { YoutubePlayer } from "./components/YoutubePlayer";
import { UploadGallery } from "./components/UploadGallery";
import { PCBFixer } from "./components/PCBFixer";
import Taskbar from "./components/Taskbar";

type WindowType = "gallery" | "music" | "upload" | "pcbfixer";

// App-specific pixelated logos
const GALLERY_LOGO =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iOCIgeT0iOCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjM2IiBmaWxsPSJub25lIiBzdHJva2U9IiM4QTJCRTIiIHN0cm9rZS13aWR0aD0iNCIvPjxyZWN0IHg9IjE2IiB5PSIyMCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjI4IiB5PSIyMCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0MwNEZGRiIvPjxyZWN0IHg9IjQwIiB5PSIyMCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjE2IiB5PSIzMiIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0MwNEZGRiIvPjxyZWN0IHg9IjI4IiB5PSIzMiIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjQwIiB5PSIzMiIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI0MwNEZGRiIvPjwvc3ZnPg==";
const MUSIC_LOGO =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iMjQiIHk9IjI4IiB3aWR0aD0iOCIgaGVpZ2h0PSIyNCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjM2IiB5PSIyMCIgd2lkdGg9IjgiIGhlaWdodD0iMzIiIGZpbGw9IiM4QTJCRTIiLz48Y2lyY2xlIGN4PSIyOCIgY3k9IjUyIiByPSI0IiBmaWxsPSIjQzA0RkZGIi8+PGNpcmNsZSBjeD0iNDAiIGN5PSI1MiIgcj0iNCIgZmlsbD0iI0ZGMDBGRiIvPjwvc3ZnPg==";
const UPLOAD_LOGO =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iMTYiIHk9IjMyIiB3aWR0aD0iMzIiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzhBMkJFMiIgc3Ryb2tlLXdpZHRoPSI0Ii8+PHJlY3QgeD0iMjQiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjI4IiBmaWxsPSIjRkYwMEZGIi8+PHJlY3QgeD0iMTYiIHk9IjIwIiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjQzA0RkZGIi8+PHJlY3QgeD0iMzIiIHk9IjIwIiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjQzA0RkZGIi8+PC9zdmc+";

// PCB-Fixer custom pixel art icon — matches the retro theme
const PCBFIXER_LOGO =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiBmaWxsPSIjMDAyMjAwIiBzdHJva2U9IiNGRjAwRkYiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMyMjg4MjIiLz48cmVjdCB4PSI0OCIgeT0iNDgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMyMjg4MjIiLz48cmVjdCB4PSIxNiIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIyNCIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIzMiIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSI0MCIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIxMiIgeT0iMjAiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIxMiIgeT0iMjgiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIxMiIgeT0iMzYiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIxMiIgeT0iNDQiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiNEQUE1MjAiLz48cmVjdCB4PSIyMCIgeT0iMjQiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMzMzMiLz48cmVjdCB4PSIzMiIgeT0iMjQiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMzMzMiLz48cmVjdCB4PSIyNCIgeT0iMzIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiMzMzMzMzMiLz48cmVjdCB4PSIzNiIgeT0iMzYiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMzMzMiLz48cmVjdCB4PSI0NCIgeT0iMjgiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiMzMzMzMzMiLz48dGV4dCB4PSIxMiIgeT0iMTgiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC13ZWlnaHQ9ImJvbGQiPkE8L3RleHQ+PHRleHQgeD0iNTAiIHk9IjU4IiBmaWxsPSIjZmZmIiBmb250LXNpemU9IjYiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtd2VpZ2h0PSJib2xkIj5CPC90ZXh0Pjwvc3ZnPg==";

export default function App() {
  const [openWindows, setOpenWindows] = useState<WindowType[]>(["gallery"]);
  const [activeWindow, setActiveWindow] = useState<WindowType>("gallery");
  const [showShutdown, setShowShutdown] = useState(false);
  const [maximizedWindow, setMaximizedWindow] = useState<WindowType | null>(
    null,
  );
  const [minimizedWindows, setMinimizedWindows] = useState<Set<WindowType>>(
    new Set(),
  );
  const [windowHeight, setWindowHeight] = useState<number>(
    window.innerHeight - 64,
  );
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  // Handle resize and orientation change
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight - 64);
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const openWindow = useCallback((win: WindowType) => {
    setOpenWindows((prev) => {
      if (!prev.includes(win)) return [...prev, win];
      return prev;
    });
    setMinimizedWindows((prev) => {
      const newSet = new Set(prev);
      newSet.delete(win);
      return newSet;
    });
    setActiveWindow(win);
  }, []);

  const closeWindow = useCallback(
    (win: WindowType) => {
      setOpenWindows((prev) => prev.filter((w) => w !== win));
      setMinimizedWindows((prev) => {
        const newSet = new Set(prev);
        newSet.delete(win);
        return newSet;
      });
      setMaximizedWindow((prev) => (prev === win ? null : prev));
      setActiveWindow((prev) => {
        if (prev === win) {
          const remaining = openWindows.filter((w) => w !== win);
          return remaining.length > 0
            ? remaining[remaining.length - 1]
            : "gallery";
        }
        return prev;
      });
    },
    [openWindows],
  );

  const minimizeWindow = useCallback((win: WindowType) => {
    setMinimizedWindows((prev) => {
      const newSet = new Set(prev);
      newSet.add(win);
      return newSet;
    });
  }, []);

  const maximizeWindow = useCallback((win: WindowType) => {
    setMaximizedWindow((prev) => (prev === win ? null : win));
    setActiveWindow(win);
  }, []);

  const restoreWindow = useCallback((win: WindowType) => {
    setMinimizedWindows((prev) => {
      const newSet = new Set(prev);
      newSet.delete(win);
      return newSet;
    });
    setOpenWindows((prev) => {
      if (!prev.includes(win)) return [...prev, win];
      return prev;
    });
    setActiveWindow(win);
  }, []);

  const handleShutdown = () => {
    setShowShutdown(true);
  };

  const isMaximized = (win: WindowType) => maximizedWindow === win;

  const getMaximizeSize = () => ({
    width: window.innerWidth,
    height: windowHeight,
  });

  const getMaximizePosition = () => ({ x: 0, y: 0 });

  // Mobile: full screen for all windows
  const getMobileDefaults = () => ({
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: windowHeight,
  });

  return (
    <div className="crt min-h-screen overflow-hidden select-none relative">
      {/* Desktop Shortcuts - Hidden on mobile */}
      <div className="hidden sm:block">
        <div
          className="desktop-icon"
          style={{ position: "fixed", top: "80px", left: "60px", zIndex: 50 }}
          onClick={(e) => {
            e.stopPropagation();
            if (!showShutdown) openWindow("gallery");
          }}
        >
          <img src={GALLERY_LOGO} alt="gallery" />
          <span>Galeri</span>
        </div>

        <div
          className="desktop-icon"
          style={{ position: "fixed", top: "200px", left: "60px", zIndex: 50 }}
          onClick={(e) => {
            e.stopPropagation();
            if (!showShutdown) openWindow("music");
          }}
        >
          <img src={MUSIC_LOGO} alt="music" />
          <span>Musik</span>
        </div>

        <div
          className="desktop-icon"
          style={{ position: "fixed", top: "320px", left: "60px", zIndex: 50 }}
          onClick={(e) => {
            e.stopPropagation();
            if (!showShutdown) openWindow("upload");
          }}
        >
          <img src={UPLOAD_LOGO} alt="upload" />
          <span>Upload</span>
        </div>

        {/* PCB-Fixer Desktop Shortcut */}
        <div
          className="desktop-icon"
          style={{ position: "fixed", top: "440px", left: "60px", zIndex: 50 }}
          onClick={(e) => {
            e.stopPropagation();
            if (!showShutdown) openWindow("pcbfixer");
          }}
        >
          <img src={PCBFIXER_LOGO} alt="pcb-fixer" />
          <span>PCB-Fixer</span>
        </div>
      </div>

      {/* Mobile App Grid */}
      <div className="sm:hidden fixed top-4 left-0 right-0 z-50 px-4">
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => openWindow("gallery")}
            className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg border-2 border-[#FF00FF] active:scale-95 transition-transform"
          >
            <img src={GALLERY_LOGO} alt="gallery" className="w-12 h-12" />
            <span className="text-xs font-bold text-[#2D1B4E]">Galeri</span>
          </button>
          <button
            onClick={() => openWindow("music")}
            className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg border-2 border-[#FF00FF] active:scale-95 transition-transform"
          >
            <img src={MUSIC_LOGO} alt="music" className="w-12 h-12" />
            <span className="text-xs font-bold text-[#2D1B4E]">Musik</span>
          </button>
          <button
            onClick={() => openWindow("upload")}
            className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg border-2 border-[#FF00FF] active:scale-95 transition-transform"
          >
            <img src={UPLOAD_LOGO} alt="upload" className="w-12 h-12" />
            <span className="text-xs font-bold text-[#2D1B4E]">Upload</span>
          </button>
          {/* PCB-Fixer Mobile */}
          <button
            onClick={() => openWindow("pcbfixer")}
            className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg border-2 border-[#FF00FF] active:scale-95 transition-transform"
          >
            <img src={PCBFIXER_LOGO} alt="pcb-fixer" className="w-12 h-12" />
            <span className="text-xs font-bold text-[#2D1B4E]">PCB-Fixer</span>
          </button>
        </div>
      </div>

      {/* Background Clouds */}
      <div className="absolute top-20 right-40 text-6xl opacity-30 pointer-events-none">
        ☁️
      </div>
      <div className="absolute bottom-52 left-52 text-5xl opacity-30 pointer-events-none">
        ☁️
      </div>

      <div
        className="relative h-screen"
        style={{ padding: maximizedWindow ? 0 : isMobile ? 0 : 32 }}
      >
        {/* Gallery Window */}
        {openWindows.includes("gallery") &&
          !minimizedWindows.has("gallery") && (
            <Rnd
              key={`gallery-rnd-${maximizedWindow === "gallery" ? "max" : "normal"}-${isMobile ? "mob" : "desk"}`}
              default={
                isMobile
                  ? getMobileDefaults()
                  : { x: 120, y: 80, width: 920, height: 680 }
              }
              size={
                isMaximized("gallery") || isMobile
                  ? getMaximizeSize()
                  : undefined
              }
              position={
                isMaximized("gallery") || isMobile
                  ? getMaximizePosition()
                  : undefined
              }
              minWidth={isMobile ? window.innerWidth : 700}
              minHeight={isMobile ? windowHeight : 500}
              bounds="parent"
              disableDragging={isMaximized("gallery") || isMobile}
              enableResizing={!isMaximized("gallery") && !isMobile}
              style={{
                zIndex: activeWindow === "gallery" ? 100 : 40,
              }}
              onMouseDown={() => setActiveWindow("gallery")}
            >
              <div className="window h-full flex flex-col">
                <div
                  className="title-bar flex items-center justify-between"
                  onClick={() => setActiveWindow("gallery")}
                >
                  <div className="flex items-center gap-3">
                    <span>📸</span>
                    <span className="hidden sm:inline">
                      GALERI 24 EA — MUSEUM PENUH MEMORI
                    </span>
                    <span className="sm:hidden">GALERI</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="hidden sm:inline"
                      onClick={(e) => {
                        e.stopPropagation();
                        minimizeWindow("gallery");
                      }}
                    >
                      🗕
                    </button>
                    <button
                      type="button"
                      className="hidden sm:inline"
                      onClick={(e) => {
                        e.stopPropagation();
                        maximizeWindow("gallery");
                      }}
                    >
                      🗖
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeWindow("gallery");
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-4 sm:p-8 overflow-auto bg-white/95">
                  <CloudinaryMedia />
                </div>
              </div>
            </Rnd>
          )}

        {/* Music Player */}
        {openWindows.includes("music") && !minimizedWindows.has("music") && (
          <Rnd
            key={`music-rnd-${maximizedWindow === "music" ? "max" : "normal"}-${isMobile ? "mob" : "desk"}`}
            default={
              isMobile
                ? getMobileDefaults()
                : { x: 500, y: 180, width: 420, height: 460 }
            }
            size={
              isMaximized("music") || isMobile ? getMaximizeSize() : undefined
            }
            position={
              isMaximized("music") || isMobile
                ? getMaximizePosition()
                : undefined
            }
            minWidth={isMobile ? window.innerWidth : 400}
            minHeight={isMobile ? windowHeight : 400}
            bounds="parent"
            disableDragging={isMaximized("music") || isMobile}
            enableResizing={!isMaximized("music") && !isMobile}
            style={{
              zIndex: activeWindow === "music" ? 100 : 40,
            }}
            onMouseDown={() => setActiveWindow("music")}
          >
            <YoutubePlayer
              onClose={() => closeWindow("music")}
              onMinimize={() => minimizeWindow("music")}
              onMaximize={() => maximizeWindow("music")}
              isActive={activeWindow === "music"}
              setActive={() => setActiveWindow("music")}
            />
          </Rnd>
        )}

        {/* Upload Gallery */}
        {openWindows.includes("upload") && !minimizedWindows.has("upload") && (
          <Rnd
            key={`upload-rnd-${maximizedWindow === "upload" ? "max" : "normal"}-${isMobile ? "mob" : "desk"}`}
            default={
              isMobile
                ? getMobileDefaults()
                : { x: 950, y: 140, width: 500, height: 500 }
            }
            size={
              isMaximized("upload") || isMobile ? getMaximizeSize() : undefined
            }
            position={
              isMaximized("upload") || isMobile
                ? getMaximizePosition()
                : undefined
            }
            minWidth={isMobile ? window.innerWidth : 450}
            minHeight={isMobile ? windowHeight : 400}
            bounds="parent"
            disableDragging={isMaximized("upload") || isMobile}
            enableResizing={!isMaximized("upload") && !isMobile}
            style={{
              zIndex: activeWindow === "upload" ? 100 : 40,
            }}
            onMouseDown={() => setActiveWindow("upload")}
          >
            <div className="window h-full flex flex-col">
              <div
                className="title-bar flex items-center justify-between"
                onClick={() => setActiveWindow("upload")}
              >
                <div className="flex items-center gap-3">
                  <span>📤</span>
                  <span>UPLOAD MOMEN</span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="hidden sm:inline"
                    onClick={(e) => {
                      e.stopPropagation();
                      minimizeWindow("upload");
                    }}
                  >
                    🗕
                  </button>
                  <button
                    type="button"
                    className="hidden sm:inline"
                    onClick={(e) => {
                      e.stopPropagation();
                      maximizeWindow("upload");
                    }}
                  >
                    🗖
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeWindow("upload");
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4 sm:p-8 overflow-auto bg-white/95">
                <UploadGallery onUploadSuccess={() => openWindow("gallery")} />
              </div>
            </div>
          </Rnd>
        )}

        {/* PCB-Fixer Game Window */}
        {openWindows.includes("pcbfixer") &&
          !minimizedWindows.has("pcbfixer") && (
            <Rnd
              key={`pcbfixer-rnd-${maximizedWindow === "pcbfixer" ? "max" : "normal"}-${isMobile ? "mob" : "desk"}`}
              default={
                isMobile
                  ? getMobileDefaults()
                  : { x: 200, y: 100, width: 560, height: 640 }
              }
              size={
                isMaximized("pcbfixer") || isMobile
                  ? getMaximizeSize()
                  : undefined
              }
              position={
                isMaximized("pcbfixer") || isMobile
                  ? getMaximizePosition()
                  : undefined
              }
              minWidth={isMobile ? window.innerWidth : 480}
              minHeight={isMobile ? windowHeight : 520}
              bounds="parent"
              disableDragging={isMaximized("pcbfixer") || isMobile}
              enableResizing={!isMaximized("pcbfixer") && !isMobile}
              dragHandleClassName="title-bar"
              cancel=".pcb-game-area"
              style={{
                zIndex: activeWindow === "pcbfixer" ? 100 : 40,
              }}
              onMouseDown={() => setActiveWindow("pcbfixer")}
            >
              <div className="pcb-game-area h-full">
                <PCBFixer
                  onClose={() => closeWindow("pcbfixer")}
                  onMinimize={() => minimizeWindow("pcbfixer")}
                  onMaximize={() => maximizeWindow("pcbfixer")}
                  isActive={activeWindow === "pcbfixer"}
                  setActive={() => setActiveWindow("pcbfixer")}
                />
              </div>
            </Rnd>
          )}
      </div>

      <Taskbar
        openWindows={openWindows}
        activeWindow={activeWindow}
        onShutdown={handleShutdown}
        minimizedWindows={minimizedWindows}
        restoreWindow={restoreWindow}
        setActiveWindow={setActiveWindow}
      />

      {/* Shutdown Screen */}
      {showShutdown && (
        <div className="shutdown-screen">
          <div className="text-6xl mb-8">☁️</div>
          <div className="text-3xl tracking-widest">Selamat Tinggal</div>
          <div className="mt-8 text-xl">Terimakasih Telah Mampir Yaa!</div>
          <div className="mt-12 text-sm">Semoga Harimu Menyenangkan Kawan</div>
        </div>
      )}
    </div>
  );
}
