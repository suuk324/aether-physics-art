import React, { useState } from 'react';
import { AppConfig } from './types';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import { ControlPanel } from './components/ControlPanel';
import { HandTracker } from './components/HandTracker';
import { Sparkles, Settings, Eye, EyeOff, Github, Heart, Play } from 'lucide-react';

export default function App() {
  // Default viral out-of-the-box configuration
  const [config, setConfig] = useState<AppConfig>({
    text: 'AETHER',
    mode: 'text',
    theme: 'monochrome',
    particleCount: 1800,
    particleSize: 2.0,
    speed: 1.2,
    interactionRadius: 130,
    gravityStrength: 4.0,
    fontSize: 150,
    trailLength: 0.18, // Smooth elegant standard trail
    interactiveSound: true,
    synthType: 'triangle', // Warm bells default
    beatPulse: false, // Quiet starry aether defaults
    pulseInterval: 100, // Peaceful tempo
    enableCameraGesture: false, // Default off so camera initializes on click
    mirrorCamera: true, // Mirror raw frame display for intuitive hand movements
    depth3D: 700, // 3D depth bounds
    autoOrbit3D: true, // Auto camera orbits
    orbitSpeed3D: 1.2, // Camera orbit speed multiplier
  });

  const [handPoint, setHandPoint] = useState<{
    x: number | null;
    y: number | null;
    isPinch: boolean;
    isFist: boolean;
    active: boolean;
  }>({
    x: null,
    y: null,
    isPinch: false,
    isFist: false,
    active: false,
  });

  const [showControls, setShowControls] = useState<boolean>(true);

  const handleConfigChange = (updates: Partial<AppConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050508] font-sans antialiased text-white select-none">
      {/* Absolute fullscreen Interactive Canvas Layer */}
      <InteractiveCanvas config={config} handPoint={handPoint} />

      {/* AI Camera Hand Tracker Layer */}
      <HandTracker
        enable={config.enableCameraGesture}
        mirror={config.mirrorCamera}
        onUpdate={setHandPoint}
      />

      {/* Aesthetic Floating Header watermark */}
      <div className="absolute top-6 left-6 pointer-events-none flex flex-col gap-1 select-none z-10 transition-opacity duration-300">
        <h1 className="text-2xl font-light tracking-[0.25em] font-serif uppercase text-zinc-100 opacity-90">
          AETHER
        </h1>
        <p className="text-[10px] text-zinc-400 font-mono tracking-[0.2em] uppercase opacity-55">
          3D Celestial Dust Art
        </p>
      </div>

      {/* Screen recording / focus mode floating widget */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
        <button
          onClick={() => setShowControls(!showControls)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/60 hover:bg-zinc-800 border border-white/10 backdrop-blur-md text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-lg active:scale-95"
          title={showControls ? '隐藏控制面板' : '显示控制面板'}
        >
          {showControls ? (
            <>
              <EyeOff className="w-4 h-4 text-zinc-400" />
              <span>全屏沉浸模式 (Hide UI)</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 text-zinc-400" />
              <span>配置参数 (Show Settings)</span>
            </>
          )}
        </button>
      </div>

      {/* Primary Sidebar Configuration Block */}
      <div
        className={`absolute top-20 left-6 z-20 transition-all duration-500 ease-in-out ${
          showControls
            ? 'translate-x-0 opacity-100 pointer-events-auto'
            : '-translate-x-96 opacity-0 pointer-events-none'
        }`}
      >
        <ControlPanel config={config} onChange={handleConfigChange} />
      </div>

      {/* Tiny guide message overlay when controls are hidden */}
      {!showControls && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10 opacity-70 transition-all">
          <p className="text-xs font-light text-zinc-300 tracking-[0.18em] font-mono uppercase">
            Touch to guide stardust  /  Drag space to orbit lens
          </p>
        </div>
      )}

      {/* Micro copyright disclaimer, ultra clean */}
      <div className="absolute bottom-4 right-6 pointer-events-none select-none text-[9px] text-zinc-650 font-mono tracking-[0.2em] opacity-40 z-10 transition-opacity duration-300">
        A E T H E R   P H Y S I C S   L A B   //   A E S T H E T I C  M E D I A  A R T
      </div>
    </div>
  );
}
