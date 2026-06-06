import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.1.13:3001";
const STORAGE_KEY = "fotokenanganXIEA";

type MediaItem = {
  id: number | string;
  publicId?: string;
  type: "image" | "video";
  title: string;
  date: string;
  uploader: string;
  imageData?: string;
  fileType?: "image" | "video";
  source: "cloudinary" | "localStorage";
  tags?: string[];
};

const optimizeUrl = (url: string): string => {
  if (!url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};

async function fetchMediaFromAPI(
  endpoint: string = "/api/media",
): Promise<MediaItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "API returned error");

    return data.data.map((item: any) => ({
      ...item,
      imageData: optimizeUrl(item.imageData || item.secure_url || ""),
    }));
  } catch (error) {
    console.error("Failed to fetch from API:", error);
    return [];
  }
}

function loadLocalStorageItems(): MediaItem[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((item: any) => {
      const isVideoFile =
        item.fileType === "video" ||
        item.format === "webm" ||
        item.format === "mp4" ||
        item.format === "mov" ||
        (item.cloudinaryUrl &&
          (item.cloudinaryUrl.includes("video/upload") ||
            item.cloudinaryUrl.endsWith(".mp4") ||
            item.cloudinaryUrl.endsWith(".webm") ||
            item.cloudinaryUrl.endsWith(".mov")));

      return {
        id: item.id,
        publicId: item.publicId || undefined,
        type: isVideoFile ? "video" : "image",
        title: item.imageName || "Untitled",
        date: item.uploadDate || "",
        uploader: item.uploaderName || "Anonymous",
        imageData: item.cloudinaryUrl || item.imageData,
        fileType: isVideoFile ? "video" : "image",
        source: "localStorage",
      };
    });
  } catch (e) {
    console.error("Failed to load uploaded items:", e);
    return [];
  }
}

function LazyImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" },
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative ${className || ""}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <span className="text-2xl">📸</span>
        </div>
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}

function usePinchZoom() {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    initialDistance: 0,
    initialScale: 1,
    isPinching: false,
    isDragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  const getDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        stateRef.current.isPinching = true;
        stateRef.current.initialDistance = getDistance(
          e.touches as unknown as TouchList,
        );
        stateRef.current.initialScale = scale;
      } else if (e.touches.length === 1 && scale > 1.1) {
        stateRef.current.isDragging = true;
        stateRef.current.startX = e.touches[0].clientX;
        stateRef.current.startY = e.touches[0].clientY;
        stateRef.current.startPanX = position.x;
        stateRef.current.startPanY = position.y;
      }
    },
    [scale, position],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2 && stateRef.current.isPinching) {
        e.preventDefault();
        const distance = getDistance(e.touches as unknown as TouchList);
        const newScale = Math.min(
          Math.max(
            stateRef.current.initialScale *
              (distance / stateRef.current.initialDistance),
            1,
          ),
          4,
        );
        setScale(newScale);
        if (newScale <= 1.1) setPosition({ x: 0, y: 0 });
      } else if (
        e.touches.length === 1 &&
        stateRef.current.isDragging &&
        scale > 1.1
      ) {
        const deltaX = e.touches[0].clientX - stateRef.current.startX;
        const deltaY = e.touches[0].clientY - stateRef.current.startY;
        setPosition({
          x: stateRef.current.startPanX + deltaX,
          y: stateRef.current.startPanY + deltaY,
        });
      }
    },
    [scale],
  );

  const handleTouchEnd = useCallback(() => {
    stateRef.current.isPinching = false;
    stateRef.current.isDragging = false;
    if (scale < 1.1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  const handleDoubleTap = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (scale > 1.1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(2.5);
      }
    },
    [scale],
  );

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  return {
    scale,
    position,
    containerRef,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onClick: handleDoubleTap,
    },
    resetZoom,
  };
}

export function CloudinaryMedia() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const lightboxZoom = usePinchZoom();

  useEffect(() => {
    if (!selected) lightboxZoom.resetZoom();
  }, [selected]);

  const checkApiHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        setApiConnected(true);
        return true;
      }
    } catch {
      setApiConnected(false);
    }
    return false;
  }, []);

  const loadAllMedia = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const isApiUp = await checkApiHealth();
      let apiItems: MediaItem[] = [];

      if (isApiUp) {
        const endpoint = tagFilter
          ? `/api/media/tag/${encodeURIComponent(tagFilter)}`
          : "/api/media";
        apiItems = await fetchMediaFromAPI(endpoint);
      }

      const localItems = loadLocalStorageItems();
      const seen = new Set<string>();
      const merged: MediaItem[] = [];

      apiItems.forEach((item) => {
        const key = item.publicId || item.imageData || "";
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      });

      localItems.forEach((item) => {
        const key = item.publicId || item.imageData || "";
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      });

      merged.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });

      setMediaItems(merged);

      if (merged.length === 0) {
        setFetchError(
          !isApiUp
            ? `Backend API offline at ${API_BASE_URL}`
            : "No media found.",
        );
      }
    } catch (error) {
      console.error(error);
      setFetchError("Failed to load media.");
      setMediaItems(loadLocalStorageItems());
    } finally {
      setIsLoading(false);
    }
  }, [tagFilter, checkApiHealth]);

  useEffect(() => {
    loadAllMedia();
  }, [loadAllMedia]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAllMedia();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadAllMedia]);

  // ─── Delete Media Handler ────────────────────────────────────────
  const handleDelete = async (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation(); // Avoid triggering lightbox click events

    const confirmDelete = window.confirm(
      `Hapus memori "${item.title}" secara permanen?`,
    );
    if (!confirmDelete) return;

    try {
      if (item.source === "cloudinary") {
        if (!apiConnected) {
          alert("Gagal menghapus: API Server sedang offline.");
          return;
        }

        // Send backend DELETE request (Make sure your backend endpoint accepts item.id or publicId)
        const targetId = item.publicId || item.id;
        const response = await fetch(
          `${API_BASE_URL}/api/media/${encodeURIComponent(targetId)}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          },
        );

        const resData = await response.json();
        if (!response.ok || !resData.success) {
          throw new Error(
            resData.error || "Gagal menghapus asset dari server backend.",
          );
        }
      }

      // Sync and purge from Client local storage list matching this item definition
      const rawStored = localStorage.getItem(STORAGE_KEY);
      if (rawStored) {
        const parsed = JSON.parse(rawStored);
        // Sync filter check matching keys
        const updatedLocal = parsed.filter((localItem: any) => {
          if (item.source === "localStorage") return localItem.id !== item.id;
          return localItem.publicId !== item.publicId;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocal));
      }

      alert("Item berhasil dihapus! 🗑️");

      // Close the open lightbox if we just deleted the viewing item
      if (selected && selected.id === item.id) {
        setSelected(null);
      }

      loadAllMedia();
    } catch (error) {
      console.error("Delete error:", error);
      alert(
        `Gagal menghapus: ${error instanceof Error ? error.message : "Terjadi kesalahan"}`,
      );
    }
  };

  const getUrl = (item: MediaItem): string => item.imageData || "";

  const isVideo = (item: MediaItem): boolean => {
    if (item.type === "video" || item.fileType === "video") return true;
    if (item.imageData) {
      const url = item.imageData.toLowerCase();
      return (
        url.includes("video/upload") ||
        url.endsWith(".mp4") ||
        url.endsWith(".webm") ||
        url.endsWith(".mov") ||
        url.startsWith("data:video")
      );
    }
    return false;
  };

  return (
    <div>
      {/* Upper Navigation controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold text-[#FF00FF] tracking-widest">
            GALERI EA
          </h2>
          <p className="text-[#FFD700] text-xs sm:text-sm mt-1">
            24 EA • Memori Doksli
          </p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <div
            className={`text-[10px] px-2 py-1 rounded border ${apiConnected ? "bg-green-100 border-green-500 text-green-800" : "bg-red-100 border-red-500 text-red-800"}`}
          >
            {apiConnected ? "🟢 API Online" : "🔴 API Offline"}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#4B0082] font-bold">TAG:</span>
            <input
              type="text"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="Filter tag..."
              className="px-2 py-1 border-2 border-[#FF00FF] text-xs w-24 focus:outline-none"
            />
          </div>
          <button
            onClick={loadAllMedia}
            className="nes-btn is-primary text-xs px-2 py-1"
            disabled={isLoading}
          >
            {isLoading ? "⟳" : "🔄"}
          </button>
          <button
            onClick={() => setView("grid")}
            className={`nes-btn ${view === "grid" ? "is-primary" : ""} text-xs`}
          >
            GRID
          </button>
          <button
            onClick={() => setView("list")}
            className={`nes-btn ${view === "list" ? "is-primary" : ""} text-xs`}
          >
            LIST
          </button>
        </div>
      </div>

      {/* Analytics info string */}
      <div className="flex items-center justify-between text-[10px] text-[#4B0082] mb-3 bg-white/50 p-2 rounded border border-[#FF00FF]/30">
        <div className="flex items-center gap-2">
          <span>📦 {mediaItems.length} items</span>
          <span className="text-[#FF00FF]">|</span>
          <span>
            ☁️ {mediaItems.filter((i) => i.source === "cloudinary").length}{" "}
            Cloudinary
          </span>
          <span className="text-[#FF00FF]">|</span>
          <span>
            💾 {mediaItems.filter((i) => i.source === "localStorage").length}{" "}
            local
          </span>
        </div>
      </div>

      {fetchError && (
        <div className="mb-4 p-3 bg-yellow-100 border-2 border-yellow-500 rounded text-xs text-yellow-800">
          ⚠️ {fetchError}
        </div>
      )}

      {/* Primary Grid Layout Rendering loop */}
      {!isLoading || mediaItems.length > 0 ? (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
              : "space-y-4"
          }
        >
          {mediaItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              className="group relative cursor-pointer bg-white border-4 border-[#FF00FF] hover:border-[#C44BFF] transition-all rounded-lg overflow-hidden hover:scale-[1.02]"
            >
              {/* Quick Delete Overlay Button on main card list item view */}
              <button
                onClick={(e) => handleDelete(e, item)}
                className="absolute top-2 left-2 z-10 bg-red-600 text-white p-1.5 rounded-md hover:bg-red-700 active:scale-95 transition-all text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-md border border-white"
                title="Hapus Momen"
              >
                🗑️
              </button>

              <div className="relative aspect-video">
                {isVideo(item) ? (
                  <div className="w-full h-full bg-black flex items-center justify-center relative overflow-hidden">
                    <video
                      src={getUrl(item)}
                      className="absolute inset-0 w-full h-full object-cover opacity-70"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-[#FF00FF]/80 rounded-full flex items-center justify-center text-white text-2xl">
                        ▶
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-[#FF00FF] text-white text-xs px-2 py-1 rounded-full font-bold">
                      VIDEO
                    </div>
                  </div>
                ) : (
                  <>
                    <LazyImage
                      src={getUrl(item)}
                      alt={item.title}
                      className="w-full h-full"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      {item.type}
                    </div>
                  </>
                )}
              </div>
              <div className="p-3">
                <p className="font-bold text-[#2D1B4E] group-hover:text-[#FF00FF] line-clamp-2 text-sm">
                  {item.title}
                </p>
                <div className="flex justify-between items-end mt-1">
                  <div>
                    <p className="text-xs text-[#FF00FF]">by {item.uploader}</p>
                    <p className="text-xs text-gray-500">{item.date}</p>
                  </div>
                  {/* Small trash bin button visible on mobile layout fields natively */}
                  <span
                    onClick={(e) => handleDelete(e, item)}
                    className="sm:hidden text-sm bg-gray-100 p-1 rounded border border-gray-300"
                  >
                    🗑️
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Lightbox Section */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/95 flex flex-col justify-between z-[200] overflow-hidden"
          >
            {/* Top Bar Area */}
            <div className="p-4 flex justify-between items-center z-30 w-full bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex gap-2 items-center">
                {lightboxZoom.scale > 1.1 && (
                  <div className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-mono">
                    {Math.round(lightboxZoom.scale * 100)}%
                  </div>
                )}
                {/* Trash Button inside open lightbox view */}
                <button
                  onClick={(e) => handleDelete(e, selected)}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 hover:bg-red-700 active:scale-95 transition-transform border border-white/50"
                >
                  🗑️ Hapus
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(null);
                }}
                className="w-12 h-12 bg-[#FF00FF] text-white rounded-full flex items-center justify-center text-xl font-bold border-2 border-white shadow-md active:scale-90 transition-transform"
              >
                ✕
              </button>
            </div>

            {/* Central Media Viewer Frame */}
            <div
              ref={lightboxZoom.containerRef}
              {...lightboxZoom.handlers}
              className="relative flex-1 w-full flex items-center justify-center overflow-hidden p-2 touch-none"
              onClick={() => {
                if (lightboxZoom.scale <= 1.1) setSelected(null);
              }}
            >
              {isVideo(selected) ? (
                <video
                  src={getUrl(selected)}
                  className="max-w-full max-h-[65vh] sm:max-h-[80vh] object-contain select-none z-10"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <motion.img
                  src={getUrl(selected)}
                  alt={selected.title}
                  className="max-w-full max-h-[85vh] object-contain select-none cursor-grab active:cursor-grabbing"
                  animate={{
                    scale: lightboxZoom.scale,
                    x: lightboxZoom.position.x,
                    y: lightboxZoom.position.y,
                  }}
                  transition={{
                    type: lightboxZoom.scale === 1 ? "spring" : "tween",
                    stiffness: 250,
                    damping: 25,
                    duration: lightboxZoom.scale === 1 ? 0.25 : 0,
                  }}
                  draggable={false}
                />
              )}
            </div>

            {/* Bottom Info Title Card */}
            <div className="bg-gradient-to-t from-black via-black/90 to-transparent p-4 pb-6 sm:p-6 z-20 w-full border-t border-white/10">
              <h3 className="text-white font-bold text-base sm:text-lg">
                {selected.title}
              </h3>
              <p className="text-[#FF00FF] text-xs sm:text-sm">
                by {selected.uploader} • {selected.date}
              </p>
              <p className="text-white/60 text-[11px] mt-1.5 leading-tight">
                {isVideo(selected) ? "🎬 Video Player" : "📸 Image Viewer"} •{" "}
                {lightboxZoom.scale > 1.1
                  ? "Geser untuk memindahkan gambar"
                  : "Ketuk dua kali / cubit untuk memperbesar"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
