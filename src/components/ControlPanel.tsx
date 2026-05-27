import React from 'react';
import { AppConfig, InteractiveMode, ColorTheme } from '../types';
import { Sliders, Music, Sparkles, Type, Play, Volume2, Info, Camera } from 'lucide-react';

interface ControlPanelProps {
  config: AppConfig;
  onChange: (updates: Partial<AppConfig>) => void;
}

export function ControlPanel({ config, onChange }: ControlPanelProps) {
  // Common beautiful preset terms so user can click to apply instantly
  const wordPresets = ['AETHER', 'GRAVITY', 'VORTEX', 'COSMOS', 'VOID', 'STARDUST'];

  return (
    <div className="flex flex-col gap-5 w-full max-w-sm bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 text-white shadow-2xl overflow-y-auto max-h-[85vh] scrollbar-thin select-none">
      {/* App Branding Title / Header */}
      <div>
        <div className="flex items-center gap-2 text-zinc-100 font-serif text-lg tracking-[0.2em] uppercase">
          <span>A E T H E R   P H Y S I C S</span>
        </div>
        <p className="text-xs text-zinc-400 mt-1 lines-leading font-sans font-light">
          以双手或触控塑造虚空。触摸屏幕或启用 AI 摄像头，引导并凝聚数千个微小星尘，在三维视界中体会宏大的星流物理。
        </p>
      </div>

      <hr className="border-white/10" />

      {/* Mode Select Tabs */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <Sliders className="w-3.5 h-3.5" />
          <span>交互模式 (Modes)</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900/60 rounded-xl border border-white/5">
          {(
            [
              { id: 'text', label: 'Aether Sign (文字结晶)' },
              { id: 'vortex', label: 'Vortex (旋转星层)' },
              { id: 'gravity', label: 'Singularity (重力奇点)' },
              { id: 'flow', label: 'Cosmic Fluid (天体流体)' },
            ] as { id: InteractiveMode; label: string }[]
          ).map((m) => {
            const active = config.mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onChange({ mode: m.id })}
                className={`py-2 px-1 text-[11px] font-medium rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Text Config (Only relevant if custom mode is 'text') */}
      {config.mode === 'text' && (
        <div className="flex flex-col gap-3.5 bg-zinc-900/40 p-3 rounded-xl border border-white/5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-zinc-400" />
              <span>定制展示内容</span>
            </label>
            <input
              type="text"
              maxLength={15}
              value={config.text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder="请输入你想汇聚的名字/表白短语"
              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-400 transition-colors text-white"
            />
          </div>

          {/* Render quick presets shortcuts */}
          <div className="flex flex-wrap gap-1">
            {wordPresets.map((word) => (
              <button
                key={word}
                onClick={() => onChange({ text: word })}
                className="text-[10px] bg-zinc-800 hover:bg-zinc-700 font-medium px-2 py-1 rounded transition-colors text-zinc-300 hover:text-white"
              >
                {word}
              </button>
            ))}
          </div>

          {/* Text Size Scale */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">字体大小 ({config.fontSize}px)</span>
            </div>
            <input
              type="range"
              min={60}
              max={260}
              step={10}
              value={config.fontSize}
              onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-100"
            />
          </div>
        </div>
      )}

      {/* Neon Color Palettes */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          粒子霓虹配色 (Nons Preset)
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { id: 'cyberpunk', label: '「仙女仙境」紫红', colors: ['#9d4edd', '#4cc9f0'] },
              { id: 'sunset', label: '「参宿四核」金赤', colors: ['#fb8500', '#d90429'] },
              { id: 'aurora', label: '「磁极光河」莹绿', colors: ['#06d6a0', '#073b4c'] },
              { id: 'sakura', label: '「星尘石英」莹姬', colors: ['#ffccd5', '#590d22'] },
              { id: 'monochrome', label: '「银汉寂虚」钛白', colors: ['#ffffff', '#475569'] },
            ] as { id: ColorTheme; label: string; colors: string[] }[]
          ).map((t) => {
            const active = config.theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange({ theme: t.id })}
                className={`flex items-center gap-1.5 p-2 rounded-xl border text-left transition-all duration-200 ${
                  active
                    ? 'border-zinc-300 bg-white/10 text-white'
                    : 'border-white/5 bg-zinc-900/40 text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex gap-0.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.colors[0] }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.colors[1] }} />
                </div>
                <span className="text-[11px] font-medium leading-none">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-white/10" />

      {/* Physics Engine Fine-Tuning */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          物理引擎微调 (Physics Engine)
        </label>

        {/* Quantity */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">粒子数量</span>
            <span className="text-zinc-300 font-mono">{config.particleCount}</span>
          </div>
          <input
            type="range"
            min={300}
            max={3000}
            step={100}
            value={config.particleCount}
            onChange={(e) => onChange({ particleCount: parseInt(e.target.value) })}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-100"
          />
        </div>

        {/* Thickness */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">单个粒子半径</span>
            <span className="text-zinc-300 font-mono">{config.particleSize}px</span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            step={0.5}
            value={config.particleSize}
            onChange={(e) => onChange({ particleSize: parseFloat(e.target.value) })}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-100"
          />
        </div>

        {/* Interaction Scale */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">手势避让半径</span>
            <span className="text-zinc-300 font-mono">{config.interactionRadius}px</span>
          </div>
          <input
            type="range"
            min={50}
            max={300}
            step={10}
            value={config.interactionRadius}
            onChange={(e) => onChange({ interactionRadius: parseInt(e.target.value) })}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-100"
          />
        </div>

        {/* Motion Streak/Trails */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">拖尾轨迹强度 (彗尾)</span>
            <span className="text-zinc-300 font-mono">{Math.round((1 - config.trailLength) * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.03}
            max={0.5}
            step={0.01}
            value={config.trailLength} // lower is longer trail
            onChange={(e) => onChange({ trailLength: parseFloat(e.target.value) })}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-100"
          />
        </div>
      </div>

      <hr className="border-white/10" />

      {/* 3D Space Controls */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-zinc-100 font-medium font-serif">
            🌐 <span>3D 空间与全景相机</span>
          </span>
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              id="enable-orbit"
              checked={config.autoOrbit3D}
              onChange={(e) => onChange({ autoOrbit3D: e.target.checked })}
              className="accent-zinc-100 cursor-pointer h-3.5 w-3.5 rounded"
            />
            <span className="text-[10px] text-zinc-400">自动巡航</span>
          </div>
        </label>

        {/* 3D Depth Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">3D 视界纵深</span>
            <span className="text-zinc-300 font-mono">{config.depth3D}px</span>
          </div>
          <input
            type="range"
            min={100}
            max={1200}
            step={50}
            value={config.depth3D}
            onChange={(e) => onChange({ depth3D: parseInt(e.target.value) })}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-100"
          />
        </div>

        {/* Orbit Speed Slider */}
        {config.autoOrbit3D && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">相机巡航旋转速率</span>
              <span className="text-zinc-300 font-mono">{config.orbitSpeed3D}x</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={4.0}
              step={0.1}
              value={config.orbitSpeed3D}
              onChange={(e) => onChange({ orbitSpeed3D: parseFloat(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-100"
            />
          </div>
        )}

        {/* Interactive camera manual orbiting hints */}
        <div className="text-[10px] text-zinc-500 leading-normal bg-zinc-900/40 p-2.5 rounded-lg border border-white/5">
          💡 <strong>高级极客操作：</strong>在屏幕空白处<strong>按住并拖拽</strong>，可以直接交互控制 3D 相机的环绕仰俯视角，让发光粒子在你的指尖全景旋转！
        </div>
      </div>

      <hr className="border-white/10" />

      {/* Camera Gesture Controls */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-[0.1em] flex items-center justify-between font-serif">
          <span className="flex items-center gap-1.5 text-zinc-200">
            <Camera className="w-4 h-4 text-zinc-400" />
            <span>AI 摄像头手势交互</span>
          </span>
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              id="enable-camera"
              checked={config.enableCameraGesture || false}
              onChange={(e) => onChange({ enableCameraGesture: e.target.checked })}
              className="accent-zinc-100 cursor-pointer h-3.5 w-3.5 rounded"
            />
          </div>
        </label>

        {config.enableCameraGesture && (
          <div className="flex flex-col gap-2.5 bg-zinc-900/40 p-3 rounded-xl border border-white/5 text-xs">
            {/* Mirror Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">水平镜像翻转摄像头</span>
              <input
                type="checkbox"
                checked={config.mirrorCamera}
                onChange={(e) => onChange({ mirrorCamera: e.target.checked })}
                className="accent-zinc-100 cursor-pointer h-3.5 w-3.5 rounded"
              />
            </div>
            
            {/* Interactive Custom guide descriptors */}
            <div className="text-[10px] text-zinc-500 leading-normal border-t border-white/5 pt-2 flex flex-col gap-1.5">
              <div>• 🖐 <strong>张开五指 (平移)</strong>：开启 Aether-Wave <span className="text-zinc-350 font-medium font-serif">/ 星流涟漪效应</span></div>
              <div>• ✊ <strong>紧握拳头 (奇点)</strong>：启动 Singularity <span className="text-zinc-350 font-medium font-serif">/ 引力奇点坍缩</span></div>
              <div>• 🤏 <strong>指尖捏合 (旋臂)</strong>：激发起 Pulsar-Orbit <span className="text-zinc-350 font-medium font-serif">/ 联星脉冲极流</span></div>
            </div>
          </div>
        )}
      </div>

      <hr className="border-white/10" />

      {/* Synthesizer & Sound setup */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-[0.1em] flex items-center justify-between font-serif">
          <span className="flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-zinc-450" />
            <span>智能音乐合成器 (Beats)</span>
          </span>
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              id="enable-sound"
              checked={config.interactiveSound}
              onChange={(e) => onChange({ interactiveSound: e.target.checked })}
              className="accent-zinc-100 cursor-pointer h-3.5 w-3.5 rounded"
            />
          </div>
        </label>

        {config.interactiveSound && (
          <div className="flex flex-col gap-3 bg-zinc-900/40 p-3 rounded-xl border border-white/5 text-xs">
            {/* Wave type */}
            <div className="flex flex-col gap-1.5">
              <span className="text-zinc-400 font-medium">波形采样类型</span>
              <div className="grid grid-cols-4 gap-1">
                {(['sine', 'triangle', 'square', 'sawtooth'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => onChange({ synthType: type })}
                    className={`py-1.5 rounded text-[10px] capitalize transition-colors ${
                      config.synthType === type
                        ? 'bg-zinc-100 text-zinc-950 font-medium font-semibold'
                        : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {type === 'sine' ? '柔弦' : type === 'triangle' ? '暖铃' : type === 'square' ? '数码' : '铜管'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub Bass Autoplay Beat */}
            <div className="flex flex-col gap-2 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-medium flex items-center gap-1">
                  <Play className={`w-3 h-3 ${config.beatPulse ? 'text-zinc-200' : 'text-zinc-500'}`} />
                  自动律动重低音 (Autoplay)
                </span>
                <input
                  type="checkbox"
                  checked={config.beatPulse}
                  onChange={(e) => onChange({ beatPulse: e.target.checked })}
                  className="accent-zinc-100 cursor-pointer h-3.5 w-3.5 rounded"
                />
              </div>

              {config.beatPulse && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-zinc-400 font-serif">
                    <span>鼓机速度 (BPM)</span>
                    <span className="text-zinc-300 font-mono">{config.pulseInterval} bpm</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={180}
                    step={5}
                    value={config.pulseInterval}
                    onChange={(e) => onChange({ pulseInterval: parseInt(e.target.value) })}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-100"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Touch Info Tip Footer */}
      <div className="flex gap-2 p-2.5 bg-zinc-900/30 rounded-lg border border-white/5 text-[11px] text-zinc-400 leading-normal">
        <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
        <span>
          在屏幕上拖拽，粒子会像流水般避开。<strong>单次点击</strong>可以触发高保真泛星音，并爆破凝聚附近的粒子！
        </span>
      </div>
    </div>
  );
}
