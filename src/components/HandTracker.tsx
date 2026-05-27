import React, { useEffect, useRef, useState } from 'react';
import { useMediaPipeLoader } from '../hooks/useMediaPipeLoader';
import { Camera, RefreshCw, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface HandTrackerProps {
  enable: boolean;
  mirror: boolean;
  onUpdate: (data: {
    x: number | null;
    y: number | null;
    isPinch: boolean;
    isFist: boolean;
    active: boolean;
  }) => void;
}

export function HandTracker({ enable, mirror, onUpdate }: HandTrackerProps) {
  const { loaded, error: loadError } = useMediaPipeLoader();
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'running' | 'error' | 'permission-denied'>('idle');
  const [trackingActive, setTrackingActive] = useState<boolean>(false);
  const [showMiniPreview, setShowMiniPreview] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handsRef = useRef<any>(null);
  const cameraInstanceRef = useRef<any>(null);

  // Full-screen overlay canvas ref for fluid cursor trails
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time tracking coordinates
  const rawXRef = useRef<number | null>(null);
  const rawYRef = useRef<number | null>(null);
  const isPinchRef = useRef<boolean>(false);
  const isFistRef = useRef<boolean>(false);
  const isTrackingRef = useRef<boolean>(false);

  // Smooth inertial tracking elements
  const smoothXRef = useRef<number | null>(null);
  const smoothYRef = useRef<number | null>(null);
  const vxRef = useRef<number>(0);
  const vyRef = useRef<number>(0);

  // Particle trail system ref
  const trailParticlesRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    color: string;
    life: number;
    decay: number;
  }[]>([]);

  // 1. Full-screen overlay canvas resizing
  useEffect(() => {
    if (!enable) return;
    const handleResize = () => {
      const canvas = overlayCanvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [enable]);

  // 2. Continuous high-FPS animation & physics loop
  useEffect(() => {
    if (!enable) return;

    let animId = 0;

    const tick = () => {
      const targetX = rawXRef.current;
      const targetY = rawYRef.current;
      const active = isTrackingRef.current;
      const pinch = isPinchRef.current;
      const fist = isFistRef.current;

      const overlayCanvas = overlayCanvasRef.current;
      const ctx = overlayCanvas?.getContext('2d');

      if (active && targetX !== null && targetY !== null) {
        if (smoothXRef.current === null || smoothYRef.current === null) {
          smoothXRef.current = targetX;
          smoothYRef.current = targetY;
        }

        const isOpenPalm = !pinch && !fist;

        // Apply visual and physics inertia based on states
        if (isOpenPalm) {
          const dx = targetX - smoothXRef.current;
          const dy = targetY - smoothYRef.current;
          
          // Spring attraction acceleration
          const ax = dx * 0.055;
          const ay = dy * 0.055;

          // Preserve momentum with soft friction/damping (0.91)
          vxRef.current = (vxRef.current + ax) * 0.91;
          vyRef.current = (vyRef.current + ay) * 0.91;

          smoothXRef.current += vxRef.current;
          smoothYRef.current += vyRef.current;
        } else {
          // Snappy transition for pinched/fist states with negligible lag
          const dx = targetX - smoothXRef.current;
          const dy = targetY - smoothYRef.current;
          smoothXRef.current += dx * 0.35;
          smoothYRef.current += dy * 0.35;
          vxRef.current = 0;
          vyRef.current = 0;
        }

        // Propagate smoothed location upwards to feed gravity wells smoothly at 60Hz/120Hz
        onUpdate({
          x: smoothXRef.current,
          y: smoothYRef.current,
          isPinch: pinch,
          isFist: fist,
          active: true,
        });

        // Spawn beautiful stardust stream particles
        if (isOpenPalm) {
          const speed = Math.sqrt(vxRef.current * vxRef.current + vyRef.current * vyRef.current);
          const numParticlesToSpawn = Math.min(3, Math.floor(speed * 0.12) + 1);

          for (let i = 0; i < numParticlesToSpawn; i++) {
            const angle = Math.atan2(vyRef.current, vxRef.current) + Math.PI + (Math.random() - 0.5) * 0.9;
            const pSpeed = (Math.random() * 0.2 + 0.05) * (speed + 1.5);
            
            trailParticlesRef.current.push({
              x: smoothXRef.current + (Math.random() - 0.5) * 5,
              y: smoothYRef.current + (Math.random() - 0.5) * 5,
              vx: Math.cos(angle) * pSpeed + (Math.random() - 0.5) * 0.4,
              vy: Math.sin(angle) * pSpeed + (Math.random() - 0.5) * 0.4,
              size: Math.random() * 2.5 + 1.2,
              alpha: Math.random() * 0.5 + 0.3,
              color: Math.random() > 0.4 ? 'rgba(100, 220, 255, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              life: 1.0,
              decay: Math.random() * 0.025 + 0.015,
            });
          }
        }
      } else {
        // Fade out smooth coords when tracking is lost
        smoothXRef.current = null;
        smoothYRef.current = null;
        vxRef.current = 0;
        vyRef.current = 0;

        onUpdate({
          x: null,
          y: null,
          isPinch: false,
          isFist: false,
          active: false,
        });
      }

      // Update particle physics
      trailParticlesRef.current.forEach((tp) => {
        tp.x += tp.vx;
        tp.y += tp.vy;
        tp.life -= tp.decay;
        tp.alpha = tp.life * 0.7;
        tp.size *= 0.97;
      });
      trailParticlesRef.current = trailParticlesRef.current.filter((tp) => tp.life > 0 && tp.size > 0.1);

      // Render full screen trail overlay
      if (overlayCanvas && ctx) {
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        // Render trail particles
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        trailParticlesRef.current.forEach((tp) => {
          const grad = ctx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, tp.size * 2);
          grad.addColorStop(0, `rgba(255, 255, 255, ${tp.alpha})`);
          grad.addColorStop(0.3, `rgba(135, 206, 250, ${tp.alpha * 0.4})`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, tp.size * 2, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();

        // Render fluid cursor only for active open palm state
        if (active && targetX !== null && targetY !== null && !pinch && !fist && smoothXRef.current !== null && smoothYRef.current !== null) {
          ctx.save();
          const sx = smoothXRef.current;
          const sy = smoothYRef.current;

          const speed = Math.sqrt(vxRef.current * vxRef.current + vyRef.current * vyRef.current);
          const sizePulse = 1.0 + Math.sin(Date.now() * 0.005) * 0.08;
          const currentRadius = 15 * sizePulse;

          // 1. Drawing outermost kinetic dynamic ripple lines
          ctx.beginPath();
          ctx.arc(sx, sy, currentRadius + speed * 1.5 + 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0.04, 0.15 - speed * 0.005)})`;
          ctx.lineWidth = 0.8;
          ctx.setLineDash([2, 5]);
          ctx.stroke();

          // 2. Outer fuzzy gaseous fluid boundary
          ctx.beginPath();
          ctx.arc(sx, sy, currentRadius + speed * 0.8, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1.0;
          ctx.stroke();

          // 3. Inertially stretched inner stellar fluid core
          ctx.translate(sx, sy);
          if (speed > 1.0) {
            const angle = Math.atan2(vyRef.current, vxRef.current);
            ctx.rotate(angle);
            // stretch scaled based on velocity (elongation factor in direction of motion)
            ctx.scale(1.0 + Math.min(1.2, speed * 0.03), 1.0 - Math.min(0.5, speed * 0.015));
          }

          const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius * 0.8);
          auraGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
          auraGrad.addColorStop(0.4, 'rgba(100, 220, 255, 0.09)');
          auraGrad.addColorStop(1, 'transparent');
          
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(0, 0, currentRadius * 0.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => cancelAnimationFrame(animId);
  }, [enable, onUpdate]);

  // Initialize MediaPipe hands engine when scripts loaded and tracking enabled
  useEffect(() => {
    if (!loaded || !enable || cameraState === 'running') return;

    const startHandTracking = async () => {
      setCameraState('starting');
      setErrorMessage('');

      try {
        const HandsClass = (window as any).Hands;
        if (!HandsClass) {
          throw new Error('Hands global class not found');
        }

        // 1. Setup MediaPipe hands engine configuration
        const hands = new HandsClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1, // Track 1 hand for high performance
          modelComplexity: 1, // High quality landmarking
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        // 2. Setup standard onResults callback
        hands.onResults((results: any) => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          
          if (canvas && ctx) {
            // Draw visual diagnostic feedback on miniature tracking canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (results.image) {
              ctx.save();
              if (mirror) {
                // Mirror miniature canvas display
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
              }
              ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
              ctx.restore();
            }

            // Draw tracks
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              setTrackingActive(true);
              const landmarks = results.multiHandLandmarks[0];

              // Landmark coordinates mapping:
              // Index tip = 8, Thumb tip = 4, middle tip = 12, ring tip = 16, pinky tip = 20, wrist = 0
              const thumbTip = landmarks[4];
              const indexTip = landmarks[8];
              const middleTip = landmarks[12];
              const ringTip = landmarks[16];
              const pinkyTip = landmarks[20];
              const wrist = landmarks[0];

              // Index MCP joint (5) for hand center ref
              const indexMcp = landmarks[5];

              // Calculate actual window screen coords (Y percentage is direct, X flipped depending on mirror parameter)
              const w = window.innerWidth;
              const h = window.innerHeight;
              
              const rawX = indexTip.x;
              const targetX = mirror ? (1 - rawX) * w : rawX * w;
              const targetY = indexTip.y * h;

              // Gesture Detection logic:
              // Pinch: index tip and thumb tip close
              const distPinch = Math.sqrt(
                Math.pow(indexTip.x - thumbTip.x, 2) +
                Math.pow(indexTip.y - thumbTip.y, 2)
              );
              const isPinch = distPinch < 0.08;

              // Fist: average distance from all 4 fingers tips to wrist is extremely small
              const averageTipWristDist = (
                Math.sqrt(Math.pow(indexTip.x - wrist.x, 2) + Math.pow(indexTip.y - wrist.y, 2)) +
                Math.sqrt(Math.pow(middleTip.x - wrist.x, 2) + Math.pow(middleTip.y - wrist.y, 2)) +
                Math.sqrt(Math.pow(ringTip.x - wrist.x, 2) + Math.pow(ringTip.y - wrist.y, 2)) +
                Math.sqrt(Math.pow(pinkyTip.x - wrist.x, 2) + Math.pow(pinkyTip.y - wrist.y, 2))
              ) / 4;

              // Closed fist means average finger tip is close to knuckles/wrist (typically threshold ~0.2)
              const isFist = averageTipWristDist < 0.22;

              // Update coordinate refs silently so the animation/physics ticker handles them
              rawXRef.current = targetX;
              rawYRef.current = targetY;
              isPinchRef.current = isPinch;
              isFistRef.current = isFist;
              isTrackingRef.current = true;

              // Render landmarks skeletal feedback overlay on mini corner video
              ctx.fillStyle = isFist ? '#f43f5e' : isPinch ? '#3b82f6' : '#10b981';
              landmarks.forEach((pt: any) => {
                const px = mirror ? (1 - pt.x) * canvas.width : pt.x * canvas.width;
                const py = pt.y * canvas.height;
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
              });

              // Circle of index point explicitly larger
              const indexPx = mirror ? (1 - indexTip.x) * canvas.width : indexTip.x * canvas.width;
              const indexPy = indexTip.y * canvas.height;
              ctx.beginPath();
              ctx.arc(indexPx, indexPy, 6, 0, Math.PI * 2);
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            } else {
              setTrackingActive(false);
              rawXRef.current = null;
              rawYRef.current = null;
              isPinchRef.current = false;
              isFistRef.current = false;
              isTrackingRef.current = false;
            }
          }
        });

        handsRef.current = hands;

        // 3. Request actual camera stream via MediaPipe Camera utils
        if (videoRef.current) {
          const CameraClass = (window as any).Camera;
          if (!CameraClass) {
            throw new Error('Camera helper class not found');
          }

          const cameraInstance = new CameraClass(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && handsRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 320,
            height: 240,
          });

          await cameraInstance.start();
          cameraInstanceRef.current = cameraInstance;
          setCameraState('running');
        }
      } catch (err: any) {
        console.error('Camera initialization failure:', err);
        setCameraState('error');
        setErrorMessage(err.message || '无法访问摄像头或MediaPipe初始化失败');
        onUpdate({ x: null, y: null, isPinch: false, isFist: false, active: false });
      }
    };

    startHandTracking();

    return () => {
      // Cleanup camera instances dynamically when checkbox is off
      if (cameraInstanceRef.current) {
        try {
          cameraInstanceRef.current.stop();
        } catch (e) {}
        cameraInstanceRef.current = null;
      }
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch (e) {}
        handsRef.current = null;
      }
      setCameraState('idle');
      setTrackingActive(false);
      onUpdate({ x: null, y: null, isPinch: false, isFist: false, active: false });
    };
  }, [loaded, enable, mirror, onUpdate]);

  // Handle active status messages display
  if (!enable) return null;

  return (
    <>
      <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Loading & Tracking Status indicators */}
        <div className="flex items-center gap-2 p-2 bg-black/75 border border-white/10 rounded-xl backdrop-blur-md max-w-xs text-xs">
          {loadError ? (
            <div className="flex items-center gap-1.5 text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>依赖载入异常，请刷新重试</span>
            </div>
          ) : !loaded ? (
            <div className="flex items-center gap-1.5 text-zinc-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>正在加载 AI 视觉追踪引擎...</span>
            </div>
          ) : cameraState === 'starting' ? (
            <div className="flex items-center gap-1.5 text-amber-400">
              <Camera className="w-3.5 h-3.5 animate-pulse" />
              <span>请求摄像头许可并建立通信...</span>
            </div>
          ) : cameraState === 'running' ? (
            <div className="flex items-center gap-3 justify-between w-full">
              <div className="flex items-center gap-1.5 text-green-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>AI 手势跟踪已就绪</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full animate-ping ${trackingActive ? 'bg-orange-500' : 'bg-green-500'}`} />
                <button
                  onClick={() => setShowMiniPreview(!showMiniPreview)}
                  className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors"
                >
                  {showMiniPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showMiniPreview ? '隐藏视频' : '小窗'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1 text-rose-400 max-w-xs">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>智能识别启动失败</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-normal">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Embedded Miniature Cam Preview Display in browser corner */}
        {loaded && enable && cameraState === 'running' && showMiniPreview && (
          <div className="relative h-28 w-36 bg-black border border-white/15 rounded-xl overflow-hidden shadow-2xl group transition-all shrink-0">
            {/* Unused camera feeds element */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover hidden pointer-events-none"
              playsInline
              muted
            />
            {/* Master landmarks tracking feedback overlays */}
            <canvas
              ref={canvasRef}
              width={320}
              height={240}
              className="absolute inset-0 w-full h-full object-cover rounded-xl"
            />
            {/* Subtle overlay header tag */}
            <div className="absolute bottom-1 right-1 bg-black/60 px-1 py-0.5 rounded text-[8px] tracking-wider text-zinc-400 select-none uppercase pointer-events-none font-mono">
              cam input
            </div>
          </div>
        )}
      </div>

      {/* Global screen-wide high-FPS stardust overlay trail */}
      {loaded && enable && cameraState === 'running' && (
        <canvas
          ref={overlayCanvasRef}
          className="fixed inset-0 w-full h-full pointer-events-none z-40"
        />
      )}
    </>
  );
}
