import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, CloudRain } from 'lucide-react';


export const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.3);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const noiseSourceRef = useRef<AudioNode | null>(null);
  const isWebAudioPlayingRef = useRef<boolean>(false);

  // Initialize Web Audio ambient generator (Rain & Noir Vinyl atmosphere)
  const startNoirAmbient = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (isWebAudioPlayingRef.current) return;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // 1. Soothing Rain Generator (Pink noise + Lowpass filter)
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Gentle lowpass filter simulating rain outside window
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      whiteNoise.start();
      noiseSourceRef.current = whiteNoise;

      // 2. Subtle low moody noir hum / drone (48Hz gentle sine wave)
      const droneOsc = ctx.createOscillator();
      droneOsc.type = 'sine';
      droneOsc.frequency.setValueAtTime(55, ctx.currentTime); // A1 note
      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.08, ctx.currentTime);
      droneOsc.connect(droneGain);
      droneGain.connect(masterGain);
      droneOsc.start();

      isWebAudioPlayingRef.current = true;
    } catch (e) {
      console.warn('Audio synthesis fallback notice:', e);
    }
  };

  const stopNoirAmbient = () => {
    try {
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend();
      }
      isWebAudioPlayingRef.current = false;
    } catch (e) {
      console.warn('Audio stop notice:', e);
    }
  };

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    }
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (isPlaying) {
      stopNoirAmbient();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      startNoirAmbient();
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // Autoplay fallback handled by ambient synthesis
        });
      }
      setIsPlaying(true);
    }
  };

  return (
    <div
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2 group"
      onMouseEnter={() => setShowVolumeSlider(true)}
      onMouseLeave={() => setShowVolumeSlider(false)}
    >
      {/* HTML5 Audio element configured with loop, autoplay disabled */}
      <audio
        ref={audioRef}
        loop
        preload="none"
      />

      <div className="flex items-center gap-2 bg-stone-900/95 border border-stone-700/80 rounded-full px-3 py-1.5 shadow-2xl backdrop-blur-md transition-all duration-200">
        <button
          onClick={togglePlay}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-amber-500 text-stone-950 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
          }`}
          title={isPlaying ? 'Pause Noir Ambience' : 'Play Noir Ambience'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        <div className="flex items-center gap-1.5">
          <CloudRain className={`w-3.5 h-3.5 ${isPlaying ? 'text-amber-400 animate-pulse' : 'text-stone-500'}`} />
          <span className="text-[10px] font-mono tracking-wider text-stone-300 uppercase select-none">
            {isPlaying ? 'NOIR RAIN AMBIENCE' : 'AMBIENCE OFF'}
          </span>
        </div>

        {/* Dynamic Soundwave Bars when playing */}
        {isPlaying && (
          <div className="flex items-end gap-0.5 h-3.5 px-1">
            <span className="w-0.5 bg-amber-400 h-2 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-0.5 bg-amber-400 h-3.5 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-0.5 bg-amber-400 h-1.5 animate-bounce" style={{ animationDelay: '75ms' }} />
            <span className="w-0.5 bg-amber-400 h-3 animate-bounce" style={{ animationDelay: '220ms' }} />
          </div>
        )}

        {/* Volume Slider (shown on hover or when playing) */}
        {showVolumeSlider && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-stone-800 animate-fadeIn">
            {volume === 0 ? (
              <VolumeX className="w-3 h-3 text-stone-500" />
            ) : (
              <Volume2 className="w-3 h-3 text-stone-400" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 accent-amber-500 bg-stone-700 rounded cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
};
