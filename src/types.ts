export type InteractiveMode = 'text' | 'gravity' | 'flow' | 'vortex';

export type ColorTheme = 'cyberpunk' | 'sunset' | 'aurora' | 'sakura' | 'monochrome';

export interface AppConfig {
  text: string;
  mode: InteractiveMode;
  theme: ColorTheme;
  particleCount: number;
  particleSize: number;
  speed: number;
  interactionRadius: number;
  gravityStrength: number;
  fontSize: number;
  trailLength: number; // 0 to 1 transparency trail length
  interactiveSound: boolean;
  synthType: 'sine' | 'square' | 'triangle' | 'sawtooth';
  beatPulse: boolean; // Pulsing with automatic virtual rhythmic beat
  pulseInterval: number; // bpm
  enableCameraGesture: boolean; // Camera gesture tracking flag
  mirrorCamera: boolean; // Mirror video input or not
  depth3D: number; // 3D depth strength scalar
  autoOrbit3D: boolean; // Auto orbit rotation toggle
  orbitSpeed3D: number; // Rotation speed
}

export interface SoundWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}
