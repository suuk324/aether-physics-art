import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AppConfig, SoundWave, ColorTheme } from '../types';
import { playSynthNote, playKickPulse } from '../utils/audio';

interface CanvasProps {
  config: AppConfig;
  handPoint: {
    x: number | null;
    y: number | null;
    isPinch: boolean;
    isFist: boolean;
    active: boolean;
  };
}

class Particle3D {
  x: number; // 3D original space coordinates relative to (0,0,0) center
  y: number;
  z: number;
  originX: number;
  originY: number;
  originZ: number;
  targetX: number | null = null;
  targetY: number | null = null;
  targetZ: number | null = null;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  baseSize: number;
  color: string;
  alpha: number;
  angle: number;
  speed: number;
  friction: number;
  ease: number;

  // Transformed (perspective projected) coordinates for drawing
  projX: number = 0;
  projY: number = 0;
  projSize: number = 0;
  projAlpha: number = 0;
  rotatedZ: number = 0;

  constructor(x: number, y: number, z: number, color: string, baseSize: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.originX = x;
    this.originY = y;
    this.originZ = z;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.vz = (Math.random() - 0.5) * 4;
    this.baseSize = baseSize;
    this.size = baseSize;
    this.color = color;
    this.alpha = Math.random() * 0.5 + 0.5;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 1.5 + 0.5;
    this.friction = 0.96;
    this.ease = Math.random() * 0.08 + 0.04;
  }

  // Update particle positions based on full 3D physics forces
  update(
    mouseX: number | null,
    mouseY: number | null,
    handX: number | null,
    handY: number | null,
    isPinch: boolean,
    isFist: boolean,
    mode: string,
    interactionRadius: number,
    gravityStrength: number,
    pulseMultiplier: number,
    width: number,
    height: number,
    depthRange: number
  ) {
    // Pulse animation sizes mapping
    this.size = this.baseSize * pulseMultiplier;

    // 1. Target coordinate pulling (for elegant 3D holographic lettering)
    if (mode === 'text' && this.targetX !== null && this.targetY !== null && this.targetZ !== null) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dz = this.targetZ - this.z;
      
      this.vx += dx * this.ease * 0.12;
      this.vy += dy * this.ease * 0.12;
      this.vz += dz * this.ease * 0.12;
      
      this.vx *= this.friction * 0.88;
      this.vy *= this.friction * 0.88;
      this.vz *= this.friction * 0.88;
    } else {
      // 2. Free wandering motion for abstract modes
      this.angle += (Math.random() - 0.5) * 0.15;
      const speedScale = 0.12;
      this.vx += Math.cos(this.angle) * speedScale;
      this.vy += Math.sin(this.angle) * speedScale;
      this.vz += (Math.random() - 0.5) * speedScale;
      
      this.vx *= 0.98;
      this.vy *= 0.98;
      this.vz *= 0.98;
    }

    // Determine 3D force sources (mapping 2D screen mouse positions onto 3D space at Z=0)
    const sources: { x: number; y: number; z: number; forceMode: string; activeRadius: number }[] = [];

    if (mouseX !== null && mouseY !== null) {
      sources.push({
        x: mouseX - width / 2,
        y: mouseY - height / 2,
        z: 0,
        forceMode: mode,
        activeRadius: interactionRadius,
      });
    }

    if (handX !== null && handY !== null) {
      // Flex hand gestures mapping: Fist -> Black Hole; Pinch -> Binary Pulsar; Open Palm -> Stellar Liquid Flow Ripples
      const handMode = isFist ? 'gravity' : isPinch ? 'vortex' : 'flow';
      const radiusScale = isFist ? 2.5 : isPinch ? 1.8 : 1.2;
      
      // An elegant dynamic hand coordinates Z mapping: Fist creates heavy mass depth force!
      const handZ = isFist ? -150 : isPinch ? 150 : Math.sin(Date.now() * 0.002) * 100;

      sources.push({
        x: handX - width / 2,
        y: handY - height / 2,
        z: handZ,
        forceMode: handMode,
        activeRadius: interactionRadius * radiusScale,
      });
    }

    // 3. Process forces (Gravity, Cyclones, Repulsions)
    sources.forEach((source) => {
      const dx = source.x - this.x;
      const dy = source.y - this.y;
      const dz = source.z - this.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

      if (source.forceMode === 'gravity') {
        // --- 🌌 OPTION B: SINGULARITY BLACK HOLE (isFist) ---
        const activeRadiusLimit = source.activeRadius * 2.8;
        if (distance < activeRadiusLimit) {
          const ratio = (activeRadiusLimit - distance) / activeRadiusLimit;
          
          // 1. Relativistic Event Horizon & Polar Jet Ejection
          if (distance < 24 && isFist) {
            const jetDir = Math.random() > 0.5 ? 1 : -1;
            this.vz = jetDir * (Math.random() * 12 + 10); // Hyper velocity eject along polar axis
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = (Math.random() - 0.5) * 3;
            this.alpha = 1.0; // Reignite brightest starlight on excitation
          } else {
            // 2. Strong gravity well pull
            const pull = ratio * gravityStrength * (isFist ? 2.8 : 0.8);
            this.vx += (dx / distance) * pull;
            this.vy += (dy / distance) * pull;
            this.vz += (dz / distance) * pull;

            // 3. Accretion Disk Swirl Orbit Rotation (Fast spin as they get closer)
            const swirlSpeed = ratio * gravityStrength * (isFist ? 3.2 : 1.2);
            const tx = -dy / distance;
            const ty = dx / distance;
            this.vx += tx * swirlSpeed;
            this.vy += ty * swirlSpeed;
          }
        }
      } else if (source.forceMode === 'vortex') {
        // --- 💫 OPTION B: BINARY PULSAR HELIX SWARM (isPinch) ---
        if (isPinch) {
          // Dynamic pair of orbiting gravitational cores
          const speedFactor = Date.now() * 0.0035;
          const separationRadius = source.activeRadius * 0.45;
          
          // Core A
          const cAx = source.x + Math.cos(speedFactor) * separationRadius;
          const cAy = source.y + Math.sin(speedFactor) * separationRadius;
          const cAz = source.z + Math.cos(speedFactor * 0.5) * separationRadius * 0.25;

          // Core B
          const cBx = source.x - Math.cos(speedFactor) * separationRadius;
          const cBy = source.y - Math.sin(speedFactor) * separationRadius;
          const cBz = source.z - Math.cos(speedFactor * 0.5) * separationRadius * 0.25;

          // Pull to both
          const dAx = cAx - this.x;
          const dAy = cAy - this.y;
          const dAz = cAz - this.z;
          const distA = Math.sqrt(dAx * dAx + dAy * dAy + dAz * dAz) || 1;

          const dBx = cBx - this.x;
          const dBy = cBy - this.y;
          const dBz = cBz - this.z;
          const distB = Math.sqrt(dBx * dBx + dBy * dBy + dBz * dBz) || 1;

          const nearestDist = Math.min(distA, distB);
          const activeRadiusLimit = source.activeRadius * 2.4;
          
          if (nearestDist < activeRadiusLimit) {
            const ratio = (activeRadiusLimit - nearestDist) / activeRadiusLimit;
            
            // Proportional vector gravity pull
            const pA = (1 / distA) * ratio * gravityStrength * 1.6;
            const pB = (1 / distB) * ratio * gravityStrength * 1.6;
            this.vx += dAx * pA + dBx * pB;
            this.vy += dAy * pA + dBy * pB;
            this.vz += dAz * pA + dBz * pB;

            // Fluid whiplash orbital spins
            const rotS = ratio * gravityStrength * 2.0;
            if (distA < distB) {
              this.vx += (-dAy / distA) * rotS;
              this.vy += (dAx / distA) * rotS;
            } else {
              this.vx += (-dBy / distB) * rotS;
              this.vy += (dBx / distB) * rotS;
            }
          }
        } else {
          // Fallback simple single vortex
          const fieldSize = source.activeRadius * 2.2;
          const ratio = (fieldSize - distance) / fieldSize;
          if (ratio > 0) {
            const pull = ratio * gravityStrength * 0.25;
            this.vx += (dx / distance) * pull;
            this.vy += (dy / distance) * pull;
            this.vz += (dz / distance) * pull;

            const theta = ratio * 2.5 * 0.08;
            const cos = Math.cos(theta);
            const sin = Math.sin(theta);
            const rx = dx * cos - dy * sin;
            const ry = dx * sin + dy * cos;
            this.vx += (rx - dx) * 0.1;
            this.vy += (ry - dy) * 0.1;
          }
        }
      } else if (source.forceMode === 'flow') {
        // --- 🌊 OPTION B: SPACE-TIME LENSING RIPPLES (Open Palm Glide) ---
        const activeRadiusLimit = source.activeRadius * 2.2;
        if (distance < activeRadiusLimit) {
          const ratio = (activeRadiusLimit - distance) / activeRadiusLimit;
          // Fluid wavy refraction wave curves pushing and pulling stars like liquid space
          const wavePeriod = distance * 0.08 - Date.now() * 0.015;
          const waveRipple = Math.sin(wavePeriod) * ratio * 2.8;
          
          this.vx += (dx / distance) * waveRipple;
          this.vy += (dy / distance) * waveRipple;
          this.vz += (dz / distance) * waveRipple;
        }
      }

      // 4. Boundary protection - skip on heavy singularity fist to allow absolute collapse
      if (source.forceMode !== 'gravity' || !isFist) {
        const pushMin = source.activeRadius * 0.55;
        if (distance < pushMin) {
          const ratio = (pushMin - distance) / pushMin;
          const force = ratio * 2.6;
          this.vx -= (dx / distance) * force;
          this.vy -= (dy / distance) * force;
          this.vz -= (dz / distance) * force;
        }
      }
    });

    // Save inertia velocity
    if (sources.length > 0) {
      const slowMultiplier = mode === 'text' ? 0.90 : 0.94;
      this.vx *= this.friction * slowMultiplier;
      this.vy *= this.friction * slowMultiplier;
      this.vz *= this.friction * slowMultiplier;
    }

    // Apply 3D translations
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    // 5. 3D Bounds Elasticity constraints (for drifting particles)
    if (mode !== 'text') {
      const bufferW = width / 2 - 20;
      const bufferH = height / 2 - 20;
      const bufferD = depthRange / 2 - 20;

      if (this.x < -bufferW) { this.x = -bufferW; this.vx *= -1.2; }
      else if (this.x > bufferW) { this.x = bufferW; this.vx *= -1.2; }

      if (this.y < -bufferH) { this.y = -bufferH; this.vy *= -1.2; }
      else if (this.y > bufferH) { this.y = bufferH; this.vy *= -1.2; }

      if (this.z < -bufferD) { this.z = -bufferD; this.vz *= -1.2; }
      else if (this.z > bufferD) { this.z = bufferD; this.vz *= -1.2; }
    }
  }

  // Calculate 3D rotations & perspective camera projection projections
  project(
    angleX: number,
    angleY: number,
    fov: number,
    cameraDist: number,
    width: number,
    height: number
  ) {
    // 3D Rotational transforms mapping Euler perspective matrix manually
    // Rotate Yaw (around Y axis)
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const rx1 = this.x * cosY - this.z * sinY;
    const rz1 = this.x * sinY + this.z * cosY;

    // Rotate Pitch (around X axis)
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    const ry2 = this.y * cosX - rz1 * sinX;
    const rz2 = this.y * sinX + rz1 * cosX;

    // Cache local rotated depth for sorting
    this.rotatedZ = rz2;

    // Camera offset translation
    const visualZ = rz2 + cameraDist;

    // Clip elements falling behind the screen plane (behind camera lens lens)
    if (visualZ <= 60) {
      this.projAlpha = 0;
      return;
    }

    // Perspective projection formula
    const scale = fov / visualZ;
    this.projX = rx1 * scale + width / 2;
    this.projY = ry2 * scale + height / 2;
    this.projSize = Math.max(0.2, this.size * scale);

    // Compute highly realistic depth of field falloff & transparency
    // Distant particles fade beautifully into the shadows creating rich visual mystery!
    const depthRatio = cameraDist / visualZ;
    this.projAlpha = Math.max(0.1, Math.min(1.0, this.alpha * depthRatio * 1.5));
  }

  // Draw projected 3D coordinates
  draw(ctx: CanvasRenderingContext2D, isGlowing: boolean = false) {
    if (this.projAlpha <= 0) return;

    const rad = this.projSize;
    if (rad <= 0.1) return;

    ctx.save();
    ctx.globalAlpha = this.projAlpha;

    if (isGlowing && rad > 1.2) {
      // Cosmic Nebula Flare: dynamic soft radial starlight gaseous gradient
      const gradient = ctx.createRadialGradient(
        this.projX, this.projY, rad * 0.1,
        this.projX, this.projY, rad * 3.0
      );
      // Pure stellar core into gaseous dispersion cloud
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.2, this.color);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.projX, this.projY, rad * 3.0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Elegant stellar stardust
      ctx.beginPath();
      ctx.arc(this.projX, this.projY, rad, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
    ctx.restore();
  }
}

export function InteractiveCanvas({ config, handPoint }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mouse, setMouse] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [soundWaves, setSoundWaves] = useState<SoundWave[]>([]);
  const [pulseScale, setPulseScale] = useState<number>(1.0); // Visual beat pulse size scalar

  // Direct Gyroscope / view rotation angles (ease toward target target Yaw and Pitch)
  const angleXRef = useRef<number>(0.0);
  const angleYRef = useRef<number>(0.0);
  const targetAngleXRef = useRef<number>(0.15); // Slight initial pitch down for 3D layout perception
  const targetAngleYRef = useRef<number>(0.0);

  // Refs to trace gesture changes for specialized sounds & ripples
  const lastIsFistRef = useRef<boolean>(false);
  const lastIsPinchRef = useRef<boolean>(false);

  // Drag controls for orbit rotators
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Refs to hold particle systems so we don't recreate them unless needed
  const particlesRef = useRef<Particle3D[]>([]);
  const configRef = useRef<AppConfig>(config);
  
  // Update ref so animation loops always have fresh parameters
  configRef.current = config;

  // Preset Colors generator according to selected theme
  const getThemePalette = useCallback((theme: ColorTheme): string[] => {
    switch (theme) {
      case 'cyberpunk':
        // Nebula Core: Space-violet, stellar fuchsia, starlight white, helium pink, orbital neon-blue
        return ['#9d4edd', '#ff007f', '#ffffff', '#f72585', '#4cc9f0'];
      case 'sunset':
        // Betelgeuse Accretion: Carbon-red, dust orange, coronas-amber, peach, warm gold
        return ['#d90429', '#ffb703', '#fb8500', '#ffe5ec', '#ffe5b4'];
      case 'aurora':
        // Solar Wind Green/Teal: Hydrogen green, space wind turquoise, pulsar cyan, magnetosphere indigo, helium teal
        return ['#06d6a0', '#4ea8de', '#e0fbfc', '#073b4c', '#118ab2'];
      case 'sakura':
        // Andromeda Quartz: Starlight rose pink, quartz dust, cosmic lavender, lunar quartz, dark-matter magenta
        return ['#ffccd5', '#ffb3c1', '#e29578', '#fff0f3', '#590d22'];
      case 'monochrome':
      default:
        // White Dwarf Void: Deep-space titanium white, cold starlight, space dust gray, void grey, bright silver
        return ['#ffffff', '#e2e8f0', '#94a3b8', '#475569', '#f1f5f9'];
    }
  }, []);

  // Compute key note frequencies for chord/scale on interactive drag/tap
  const getInteractiveFrequency = useCallback((yPercent: number) => {
    const scale = [110, 123.47, 130.81, 146.83, 164.81, 196.00, 220, 246.94, 261.63, 293.66, 329.63, 392.00, 440, 523.25, 587.33, 659.25, 783.99, 880];
    const index = Math.floor((1 - yPercent) * scale.length);
    return scale[Math.min(index >= 0 ? index : 4, scale.length - 1)];
  }, []);

  // Multi-Sensory Gesture Chord Transition Triggers
  useEffect(() => {
    if (!handPoint.active || handPoint.x === null || handPoint.y === null) {
      lastIsFistRef.current = false;
      lastIsPinchRef.current = false;
      return;
    }

    // Capture Fist -> Singularity Black Hole Trigger
    if (handPoint.isFist && !lastIsFistRef.current) {
      if (config.interactiveSound) {
        // Option B: Massive deep gravity sub-bass singing bowl sweep (decaying drone)
        playSynthNote('sine', 43.65, 1.8, 0.98); // Massive resonant gravity drone
        setTimeout(() => {
          playSynthNote('sine', 65.41, 1.2, 0.75); // Fifth harmonic resonance
        }, 150);
      }

      // Gravitational Singularity Accretion Ring Shockwave (Deep violet-fuchsia)
      setSoundWaves(prev => [
        ...prev,
        {
          x: handPoint.x!,
          y: handPoint.y!,
          radius: 10,
          maxRadius: config.interactionRadius * 4.4,
          color: '#9d4edd',
          alpha: 0.9
        }
      ]);

      // Massive gravitational suction pull on all particles immediately
      particlesRef.current.forEach(p => {
        const dx = handPoint.x! - p.projX;
        const dy = handPoint.y! - p.projY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const radiusLimit = config.interactionRadius * 3.8;
        
        if (dist < radiusLimit) {
          const forceRatio = (radiusLimit - dist) / radiusLimit;
          const suctionStrength = forceRatio * 25;
          p.vx -= (dx / dist) * suctionStrength;
          p.vy -= (dy / dist) * suctionStrength;
          p.vz -= (Math.random() - 0.5) * suctionStrength;
        }
      });
    }

    // Capture Pinch -> Binary Pulsar Star-Swarm Swirl Trigger
    if (handPoint.isPinch && !lastIsPinchRef.current) {
      if (config.interactiveSound) {
        // Option B: Crystalline singing bowls metallic chime layer (Eb5 -> Bb5 -> Eb6)
        playSynthNote('triangle', 622.25, 0.85, 0.35); // Warm crystalline bell
        setTimeout(() => {
          playSynthNote('sine', 932.33, 1.0, 0.4); // Deep space pure harmonic resonance, Eb5 5th
        }, 100);
        setTimeout(() => {
          playSynthNote('triangle', 1244.50, 1.4, 0.25); // Sparkling celestial starlight octa-chime
        }, 200);
      }

      // Polar Solar-Teal Swirling Whiplash Ring
      setSoundWaves(prev => [
        ...prev,
        {
          x: handPoint.x!,
          y: handPoint.y!,
          radius: 15,
          maxRadius: config.interactionRadius * 3.5,
          color: '#06d6a0',
          alpha: 0.8
        }
      ]);

      // Immediate double swirl rotational whip-spin on stardust
      particlesRef.current.forEach(p => {
        const dx = p.projX - handPoint.x!;
        const dy = p.projY - handPoint.y!;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const radiusLimit = config.interactionRadius * 2.8;

        if (dist < radiusLimit) {
          const ratio = (radiusLimit - dist) / radiusLimit;
          const tx = -dy / dist;
          const ty = dx / dist;
          p.vx += tx * ratio * 18;
          p.vy += ty * ratio * 18;
        }
      });
    }

    lastIsFistRef.current = handPoint.isFist;
    lastIsPinchRef.current = handPoint.isPinch;
  }, [handPoint.isFist, handPoint.isPinch, handPoint.active, handPoint.x, handPoint.y, config.interactiveSound, config.interactionRadius]);

  // Core Text Processing algorithm to extract (x,y,z) coordinates for holographic lettering
  const extractTextCoordinates = useCallback((textStr: string, width: number, height: number, customFontSize: number, depth3D: number) => {
    if (typeof document === 'undefined') return [];
    
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return [];

    ctx.clearRect(0, 0, width, height);
    
    // Choose beautiful display typography
    ctx.font = `300 ${customFontSize}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw the word beautifully in center
    ctx.fillText(textStr, width / 2, height / 2);

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const coords: { x: number; y: number; z: number }[] = [];

    // Sample the pixels to maintain robust frame rates
    const step = customFontSize < 100 ? 5 : customFontSize < 160 ? 6 : 8;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        if (alpha > 120) { // Solid text pixel hit
          // Convert from top-left layout into centered (-w/2, -h/2) origin space
          const centeredX = x - width / 2;
          const centeredY = y - height / 2;
          
          // Generate realistic volumetric depth by distributing particles along Z plane
          const centeredZ = (Math.random() - 0.5) * depth3D * 0.45;

          coords.push({ x: centeredX, y: centeredY, z: centeredZ });
        }
      }
    }

    // Shuffle rotation indices for seamless text assemblies
    for (let i = coords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [coords[i], coords[j]] = [coords[j], coords[i]];
    }

    return coords;
  }, []);

  // Initialize Particle system originally scattered inside box volume
  const initParticles = useCallback((count: number, theme: ColorTheme, size: number, depth3D: number) => {
    if (typeof window === 'undefined') return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const palette = getThemePalette(theme);
    
    const temp: Particle3D[] = [];
    for (let i = 0; i < count; i++) {
      // Scattered inside coordinate boundaries relative to Center
      const rx = (Math.random() - 0.5) * w;
      const ry = (Math.random() - 0.5) * h;
      const rz = (Math.random() - 0.5) * depth3D;
      
      const col = palette[Math.floor(Math.random() * palette.length)];
      temp.push(new Particle3D(rx, ry, rz, col, size));
    }
    particlesRef.current = temp;
  }, [getThemePalette]);

  // Main canvas initialization, listening for viewport adjustments
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const container = containerRef.current;
      const canvas = canvasRef.current;
      
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      canvas.width = width;
      canvas.height = height;

      // Resample text coordinates immediately with new aspect ratio
      if (configRef.current.mode === 'text' && particlesRef.current.length > 0) {
        const coords = extractTextCoordinates(
          configRef.current.text,
          width,
          height,
          configRef.current.fontSize,
          configRef.current.depth3D
        );

        particlesRef.current.forEach((p, idx) => {
          if (coords.length > 0) {
            const coord = coords[idx % coords.length];
            p.targetX = coord.x + (Math.random() - 0.5) * 6;
            p.targetY = coord.y + (Math.random() - 0.5) * 6;
            p.targetZ = coord.z + (Math.random() - 0.5) * 6;
          } else {
            p.targetX = null;
            p.targetY = null;
            p.targetZ = null;
          }
        });
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [extractTextCoordinates]);

  // Handle configuration changes (count, size, theme, text changes, etc.)
  useEffect(() => {
    const palette = getThemePalette(config.theme);
    const existing = particlesRef.current;

    // Adjust particle count incrementally without wiping the playground completely
    if (existing.length !== config.particleCount) {
      initParticles(config.particleCount, config.theme, config.particleSize, config.depth3D);
    } else {
      // Smoothly update colors and standard size on runtime change
      existing.forEach(p => {
        p.color = palette[Math.floor(Math.random() * palette.length)];
        p.baseSize = config.particleSize;
      });
    }

    // Retarget coordinates on text update or text font update
    if (config.mode === 'text' && canvasRef.current) {
      const coords = extractTextCoordinates(
        config.text,
        canvasRef.current.width,
        canvasRef.current.height,
        config.fontSize,
        config.depth3D
      );

      particlesRef.current.forEach((p, idx) => {
        if (coords.length > 0) {
          const coord = coords[idx % coords.length];
          p.targetX = coord.x + (Math.random() - 0.5) * 6;
          p.targetY = coord.y + (Math.random() - 0.5) * 6;
          p.targetZ = coord.z + (Math.random() - 0.5) * 6;
        } else {
          p.targetX = null;
          p.targetY = null;
          p.targetZ = null;
        }
      });
    } else {
      // Wipe targets for float modes
      particlesRef.current.forEach(p => {
        p.targetX = null;
        p.targetY = null;
        p.targetZ = null;
      });
    }
  }, [config.text, config.mode, config.theme, config.particleCount, config.particleSize, config.fontSize, config.depth3D, getThemePalette, initParticles, extractTextCoordinates]);

  // Master BPM Rhythm pulse loop
  useEffect(() => {
    if (!config.beatPulse) return;

    const intervalMs = (60 / config.pulseInterval) * 1000;
    
    const triggerBeat = () => {
      if (config.interactiveSound) {
        playKickPulse();
      }

      setPulseScale(1.6);
      setTimeout(() => {
        setPulseScale(1.0);
      }, 150);

      // Pulse pushes particles outwards radially in 3D
      particlesRef.current.forEach(p => {
        const force = Math.random() * 5 + 1.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        
        p.vx += Math.sin(phi) * Math.cos(theta) * force * 0.4;
        p.vy += Math.sin(phi) * Math.sin(theta) * force * 0.4;
        p.vz += Math.cos(phi) * force * 0.4;
      });

      // Spawn subtle full-canvas centered ripple waves
      if (canvasRef.current) {
        const wc = canvasRef.current.width / 2;
        const hc = canvasRef.current.height / 2;
        const palette = getThemePalette(configRef.current.theme);
        setSoundWaves(prev => [
          ...prev,
          {
            x: wc,
            y: hc,
            radius: 5,
            maxRadius: Math.max(wc, hc) * 0.75,
            color: palette[0],
            alpha: 0.25
          }
        ]);
      }
    };

    const timer = setInterval(triggerBeat, intervalMs);

    return () => clearInterval(timer);
  }, [config.beatPulse, config.pulseInterval, config.interactiveSound, getThemePalette]);

  // Navigation drag start check
  const handleInteractionStart = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Check if clicking close to the center for particles, otherwise start dragging camera rotation
    const distToCenter = Math.sqrt(Math.pow(x - rect.width / 2, 2) + Math.pow(y - rect.height / 2, 2));

    // If dragging close to margins or text configuration allows parallax movement, register orbital controls
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: clientX, y: clientY };

    // Set particle cursor coordinate
    setMouse({ x, y });

    // Sound chime triggers
    if (configRef.current.interactiveSound) {
      const frequency = getInteractiveFrequency(y / rect.height);
      playSynthNote(configRef.current.synthType, frequency, 0.45, 0.35);
    }

    // Ripples
    const palette = getThemePalette(configRef.current.theme);
    setSoundWaves(prev => [
      ...prev,
      {
        x,
        y,
        radius: 10,
        maxRadius: configRef.current.interactionRadius * 2.5,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 0.45
      }
    ]);

    // Give explosive blast to nearby particles
    const relativeX = x - rect.width / 2;
    const relativeY = y - rect.height / 2;
    particlesRef.current.forEach(p => {
      const dx = p.x - relativeX;
      const dy = p.y - relativeY;
      const dz = p.z - 0;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      
      if (dist < configRef.current.interactionRadius) {
        const ratio = (configRef.current.interactionRadius - dist) / configRef.current.interactionRadius;
        const blast = ratio * 18;
        p.vx += (dx / dist) * blast;
        p.vy += (dy / dist) * blast;
        p.vz += (dz / dist) * blast;
      }
    });
  };

  const handleInteractionMove = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setMouse({ x, y });

    // Apply viewport camera rotation delta on drag
    if (isDraggingRef.current) {
      const deltaX = clientX - lastMousePosRef.current.x;
      const deltaY = clientY - lastMousePosRef.current.y;
      
      // Orbit rotation mapping multipliers
      targetAngleYRef.current += deltaX * 0.0075;
      targetAngleXRef.current += deltaY * 0.0075;

      lastMousePosRef.current = { x: clientX, y: clientY };
    }

    // Synthesized drag trails
    if (configRef.current.interactiveSound && Math.random() < 0.06) {
      const frequency = getInteractiveFrequency(y / rect.height);
      playSynthNote(configRef.current.synthType, frequency * 1.4, 0.18, 0.12);
    }
  };

  const handleInteractionEnd = () => {
    isDraggingRef.current = false;
    setMouse({ x: null, y: null });
  };

  // Canvas Drawing & Perspective 3D render loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = () => {
      const currentConfig = configRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Smoothly interpolate angles for orbital gyroscopes
      // Yaw rotation
      let finalTargetY = targetAngleYRef.current;
      if (currentConfig.autoOrbit3D && !isDraggingRef.current) {
        // Continue rotating Y (Yaw) on auto pilot mode
        targetAngleYRef.current += currentConfig.orbitSpeed3D * 0.0035;
        finalTargetY = targetAngleYRef.current;
      }
      
      angleXRef.current += (targetAngleXRef.current - angleXRef.current) * 0.1;
      angleYRef.current += (finalTargetY - angleYRef.current) * 0.1;

      // Clamp vertical camera pitch rotation so view doesn't flip entirely upside down
      angleXRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, angleXRef.current));

      // 2. Make trail/glow blending
      ctx.fillStyle = `rgba(8, 8, 10, ${currentConfig.trailLength})`; 
      ctx.fillRect(0, 0, w, h);

      // Render sound waves
      setSoundWaves(prev => {
        const remaining: SoundWave[] = [];
        prev.forEach(wave => {
          const nextWave = { ...wave };
          nextWave.radius += (nextWave.maxRadius - nextWave.radius) * 0.08;
          nextWave.alpha -= 0.015;
          if (nextWave.alpha > 0 && nextWave.radius < nextWave.maxRadius) {
            ctx.beginPath();
            ctx.arc(nextWave.x, nextWave.y, nextWave.radius, 0, Math.PI * 2);
            ctx.strokeStyle = nextWave.color;
            ctx.lineWidth = 2.5;
            ctx.globalAlpha = nextWave.alpha;
            ctx.stroke();
            ctx.globalAlpha = 1.0; 
            remaining.push(nextWave);
          }
        });
        return remaining;
      });

      // 3. Coordinate Update coordinates and apply 3D physics projections for sorted ordering
      const particles = particlesRef.current;
      const fov = 650;
      const cameraDistance = 750;

      particles.forEach(p => {
        p.update(
          mouse.x,
          mouse.y,
          handPoint.x,
          handPoint.y,
          handPoint.isPinch,
          handPoint.isFist,
          currentConfig.mode,
          currentConfig.interactionRadius,
          currentConfig.gravityStrength,
          pulseScale,
          w,
          h,
          currentConfig.depth3D
        );

        p.project(
          angleXRef.current,
          angleYRef.current,
          fov,
          cameraDistance,
          w,
          h
        );
      });

      // Depth sorting (Z-Index sorting) - Front-facing particles drawn last so they layer on top
      // Creates highly realistic beautiful cinematic Depth of Field feel!
      // Since rotatedZ represents Z coordinates from screen space perspective:
      // Larger rotatedZ is further away, Smaller rotatedZ is closer.
      // So sort descending to draw further ones FIRST (back of array) and closer ones LAST.
      const sortedParticles = [...particles].sort((a, b) => b.rotatedZ - a.rotatedZ);

      // Render sorted 3D point cloud
      ctx.save();
      sortedParticles.forEach((p, idx) => {
        // Draw the closest 120 particles with beautiful ambient neon glows
        const isClosestGlow = idx >= sortedParticles.length - 120;
        p.draw(ctx, isClosestGlow);
      });
      ctx.restore();

      // Reset overall Canvas transparency properties
      ctx.globalAlpha = 1.0;

      // 4. Render minimalist ambient starlight halo for tracked hands
      if (handPoint.active && handPoint.x !== null && handPoint.y !== null) {
        ctx.save();
        const palette = getThemePalette(currentConfig.theme);
        const glowColor = handPoint.isFist ? '#9d4edd' : handPoint.isPinch ? '#06d6a0' : palette[0];

        // Draw soft, organic gravitational nebula glow around the hand
        const auraRadius = currentConfig.interactionRadius * (handPoint.isFist ? 1.5 : handPoint.isPinch ? 1.2 : 0.9);
        const gradient = ctx.createRadialGradient(
          handPoint.x, handPoint.y, 0,
          handPoint.x, handPoint.y, auraRadius
        );
        gradient.addColorStop(0, `${glowColor}1c`); // delicate translucency (approx 11% opacity)
        gradient.addColorStop(0.35, `${glowColor}0b`); 
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(handPoint.x, handPoint.y, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw a quiet central star pulse core
        ctx.beginPath();
        ctx.arc(handPoint.x, handPoint.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.5;
        ctx.fill();

        // Silent luxury serif spaced-label
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#ffffff';
        ctx.font = '300 12px "Cormorant Garamond", serif';
        ctx.textAlign = 'center';
        
        const rawLabel = handPoint.isFist 
          ? 'S I N G U L A R I T Y   (奇点)' 
          : handPoint.isPinch 
            ? 'B I N A R Y   P U L S A R   (双星)' 
            : 'C O S M I C   F L U I D   (流体)';
            
        ctx.fillText(rawLabel, handPoint.x, handPoint.y + 24);
        ctx.restore();
      }

      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => cancelAnimationFrame(animId);
  }, [mouse, handPoint, pulseScale, getThemePalette]);

  return (
    <div
      ref={containerRef}
      id="canvas-container"
      className="absolute inset-0 w-full h-full bg-[#050508] overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={(e) => handleInteractionStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleInteractionMove(e.clientX, e.clientY)}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length > 0) {
          handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchEnd={handleInteractionEnd}
    >
      {/* Immersive deep-space nebulous backdrops */}
      <div className="absolute inset-0 bg-[#040406] pointer-events-none" />
      <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_20%_30%,rgba(141,78,221,0.025)_0%,transparent_50%)] pointer-events-none mix-blend-screen" />
      <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.025)_0%,transparent_50%)] pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 bg-radial-gradient(ellipse_at_center,transparent_0%,rgba(4,4,6,0.75)_80%) pointer-events-none" />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full pointer-events-none z-10"
      />
    </div>
  );
}
