import { useState, useRef, type FormEvent } from 'react';
import ReactPlayer from 'react-player';

type YoutubePlayerProps = {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isActive: boolean;
  setActive: () => void;
};

// Pixel art speaker icons
const SPEAKER_MUTED = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgc2hhcGUtcmVuZGVyaW5nPSJjcmlzcEVkZ2VzIj48cmVjdCB4PSI0IiB5PSIxMCIgd2lkdGg9IjQiIGhlaWdodD0iMTIiIGZpbGw9IiMyRDFCNEUiLz48cmVjdCB4PSI4IiB5PSI2IiB3aWR0aD0iNCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzJEMUI0RSIvPjxyZWN0IHg9IjEyIiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSIyNCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjE2IiB5PSI0IiB3aWR0aD0iMiIgaGVpZ2h0PSIyNCIgZmlsbD0iI0M0NEJGRiIvPjxyZWN0IHg9IjIyIiB5PSIxMCIgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iI0ZGMDA0MCIvPjxyZWN0IHg9IjI0IiB5PSIxMiIgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iI0ZGMDA0MCIvPjxyZWN0IHg9IjI2IiB5PSIxNCIgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iI0ZGMDA0MCIvPjxyZWN0IHg9IjI0IiB5PSIxNiIgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iI0ZGMDA0MCIvPjxyZWN0IHg9IjIyIiB5PSIxOCIgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iI0ZGMDA0MCIvPjxyZWN0IHg9IjI2IiB5PSIxMCIgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iI0ZGMDA0MCIvPjxyZWN0IHg9IjIyIiB5PSIxNCIgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iI0ZGMDA0MCIvPjxyZWN0IHg9IjI2IiB5PSIxOCIgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iI0ZGMDA0MCIvPjwvc3ZnPg==';

const SPEAKER_LOW = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgc2hhcGUtcmVuZGVyaW5nPSJjcmlzcEVkZ2VzIj48cmVjdCB4PSI0IiB5PSIxMCIgd2lkdGg9IjQiIGhlaWdodD0iMTIiIGZpbGw9IiMyRDFCNEUiLz48cmVjdCB4PSI4IiB5PSI2IiB3aWR0aD0iNCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzJEMUI0RSIvPjxyZWN0IHg9IjEyIiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSIyNCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjE2IiB5PSI0IiB3aWR0aD0iMiIgaGVpZ2h0PSIyNCIgZmlsbD0iI0M0NEJGRiIvPjxyZWN0IHg9IjIyIiB5PSIxMiIgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iIzhBMkJFMiIvPjxyZWN0IHg9IjI0IiB5PSIxMCIgd2lkdGg9IjIiIGhlaWdodD0iNiIgZmlsbD0iIzhBMkJFMiIvPjxyZWN0IHg9IjI2IiB5PSIxMiIgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iIzhBMkJFMiIvPjwvc3ZnPg==';

const SPEAKER_MED = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgc2hhcGUtcmVuZGVyaW5nPSJjcmlzcEVkZ2VzIj48cmVjdCB4PSI0IiB5PSIxMCIgd2lkdGg9IjQiIGhlaWdodD0iMTIiIGZpbGw9IiMyRDFCNEUiLz48cmVjdCB4PSI4IiB5PSI2IiB3aWR0aD0iNCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzJEMUI0RSIvPjxyZWN0IHg9IjEyIiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSIyNCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjE2IiB5PSI0IiB3aWR0aD0iMiIgaGVpZ2h0PSIyNCIgZmlsbD0iI0M0NEJGRiIvPjxyZWN0IHg9IjIyIiB5PSIxMCIgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iIzhBMkJFMiIvPjxyZWN0IHg9IjI0IiB5PSI4IiB3aWR0aD0iMiIgaGVpZ2h0PSI2IiBmaWxsPSIjOEEyQkUyIi8+PHJlY3QgeD0iMjYiIHk9IjYiIHdpZHRoPSIyIiBoZWlnaHQ9IjEwIiBmaWxsPSIjOEEyQkUyIi8+PHJlY3QgeD0iMjgiIHk9IjgiIHdpZHRoPSIyIiBoZWlnaHQ9IjYiIGZpbGw9IiM4QTJCRTIiLz48cmVjdCB4PSIzMCIgeT0iMTAiIHdpZHRoPSIyIiBoZWlnaHQ9IjIiIGZpbGw9IiM4QTJCRTIiLz48L3N2Zz4=';

const SPEAKER_HIGH = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgc2hhcGUtcmVuZGVyaW5nPSJjcmlzcEVkZ2VzIj48cmVjdCB4PSI0IiB5PSIxMCIgd2lkdGg9IjQiIGhlaWdodD0iMTIiIGZpbGw9IiMyRDFCNEUiLz48cmVjdCB4PSI4IiB5PSI2IiB3aWR0aD0iNCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzJEMUI0RSIvPjxyZWN0IHg9IjEyIiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSIyNCIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjE2IiB5PSI0IiB3aWR0aD0iMiIgaGVpZ2h0PSIyNCIgZmlsbD0iI0M0NEJGRiIvPjxyZWN0IHg9IjIyIiB5PSI4IiB3aWR0aD0iMiIgaGVpZ2h0PSIyIiBmaWxsPSIjOEEyQkUyIi8+PHJlY3QgeD0iMjQiIHk9IjYiIHdpZHRoPSIyIiBoZWlnaHQ9IjYiIGZpbGw9IiM4QTJCRTIiLz48cmVjdCB4PSIyNiIgeT0iNCIgd2lkdGg9IjIiIGhlaWdodD0iMTAiIGZpbGw9IiM4QTJCRTIiLz48cmVjdCB4PSIyOCIgeT0iMiIgd2lkdGg9IjIiIGhlaWdodD0iMTQiIGZpbGw9IiM4QTJCRTIiLz48cmVjdCB4PSIzMCIgeT0iNCIgd2lkdGg9IjIiIGhlaWdodD0iMTAiIGZpbGw9IiM4QTJCRTIiLz48cmVjdCB4PSIzMiIgeT0iNiIgd2lkdGg9IjIiIGhlaWdodD0iNiIgZmlsbD0iIzhBMkJFMiIvPjxyZWN0IHg9IjM0IiB5PSI4IiB3aWR0aD0iMiIgaGVpZ2h0PSIyIiBmaWxsPSIjOEEyQkUyIi8+PC9zdmc+';

export function YoutubePlayer({ onClose, onMinimize, onMaximize, isActive, setActive }: YoutubePlayerProps) {
  const [url, setUrl] = useState<string>("https://www.youtube.com/watch?v=5qap5aO7eqU");
  const [playing, setPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);
  const [muted, setMuted] = useState<boolean>(false);
  const [prevVolume, setPrevVolume] = useState<number>(0.5);

  const playerRef = useRef<any>(null);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = (form.elements.namedItem('search') as HTMLInputElement)?.value?.trim();

    if (input && (input.includes('youtube.com') || input.includes('youtu.be'))) {
      setUrl(input);
      setPlaying(true);
    }
    form.reset();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && muted) setMuted(false);
  };

  const toggleMute = () => {
    if (muted) {
      setMuted(false);
      setVolume(prevVolume > 0 ? prevVolume : 0.5);
    } else {
      setPrevVolume(volume);
      setMuted(true);
      setVolume(0);
    }
  };

  const handleVolumeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const getSpeakerIcon = () => {
    if (muted || volume === 0) return SPEAKER_MUTED;
    if (volume < 0.3) return SPEAKER_LOW;
    if (volume < 0.7) return SPEAKER_MED;
    return SPEAKER_HIGH;
  };

  return (
    <div 
      className={`window h-full flex flex-col ${isActive ? 'ring-2 ring-[#FF00FF]' : ''}`}
      onClick={setActive}
    >
      <div className="title-bar flex items-center justify-between cursor-move">
        <div className="flex items-center gap-2">
          <span>🎵</span>
          <span className="hidden sm:inline">PIXEL MUSIC PLAYER</span>
          <span className="sm:hidden">PIXEL MUSIC PLAYER</span>
        </div>
        <div className="flex gap-1">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="hidden sm:inline px-2 hover:bg-white/20"
          >🗕</button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onMaximize(); }}
            className="hidden sm:inline px-2 hover:bg-white/20"
          >🗖</button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="px-2 hover:bg-red-500 hover:text-white"
          >✕</button>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 bg-white flex flex-col">
        <form onSubmit={handleSearch} className="mb-4">
          <input 
            name="search" 
            type="text" 
            placeholder="Masukkan YouTube URL..."
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-4 border-[#FF00FF] text-sm font-mono focus:outline-none"
          />
        </form>

        <div className="flex-1 bg-black rounded border-4 border-[#6B00B8] overflow-hidden mb-4 relative min-h-[150px] sm:min-h-[200px]">
          <ReactPlayer
            ref={playerRef}
            src={url}
            playing={playing}
            muted={muted}
            volume={volume}
            width="100%"
            height="100%"
            controls={false}
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
        </div>

        <div className="flex gap-2 sm:gap-3 items-center">
          <button 
            type="button"
            onClick={() => setPlaying(!playing)} 
            className="nes-btn is-primary flex-1 text-xs sm:text-sm py-2"
          >
            {playing ? 'PAUSE' : 'PLAY'}
          </button>
          <button 
            type="button"
            onClick={() => setPlaying(false)} 
            className="nes-btn is-error text-xs sm:text-sm py-2 px-3"
          >
            STOP
          </button>
        </div>

        {/* Volume Control */}
        <div 
          className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-3 bg-gray-100 rounded-lg px-3 sm:px-4 py-2"
          onMouseDown={handleVolumeMouseDown}
        >
          <button
            type="button"
            onClick={toggleMute}
            className="hover:scale-110 transition-transform flex-shrink-0"
            title={muted ? 'Unmute' : 'Mute'}
          >
            <img src={getSpeakerIcon()} alt="volume" className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            onMouseDown={handleVolumeMouseDown}
            className="flex-1 h-2 bg-[#FF00FF] rounded-lg appearance-none cursor-pointer accent-[#C44BFF] min-w-0"
          />
          <span className="text-xs font-mono text-[#4B0082] w-8 sm:w-10 text-right flex-shrink-0">
            {Math.round((muted ? 0 : volume) * 100)}%
          </span>
        </div>

        <div className="mt-3 sm:mt-4 text-xs text-center text-[#FF00FF]">
          Dibuat dengan penuh cinta untuk kenangan yang tak terlupakan 💜
        </div>
      </div>
    </div>
  );
}