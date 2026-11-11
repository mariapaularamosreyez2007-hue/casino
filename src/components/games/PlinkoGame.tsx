import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { plinkoVFX } from './VFX';
import {
  Collision2D,
  createConvexPolygon,
  createTriangleWedge,
  ConvexPolygon,
  drawPBRSphere,
  drawPBRConvexPolygon,
} from './Engine';
import { UniversalStakeControl } from './UniversalStakeControl';
import { ProvablyFairModal } from '../modals/ProvablyFairModal';
import { Volume2, VolumeX } from 'lucide-react';

interface PlinkoGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordBet: (betAmount: number, multiplier: number, payout: number, isWin: boolean) => void;
}

interface PinState {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  row: number;
  glowTime: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glow: string;
  specular: string;
  bet: number;
  restitution: number;
  friction: number;
}

export const PlinkoGame: React.FC<PlinkoGameProps> = ({
  balance,
  onUpdateBalance,
  onRecordBet,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [rows, setRows] = useState<number>(10);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeBalls, setActiveBalls] = useState<number>(0);
  const [recentHits, setRecentHits] = useState<number[]>([1.4, 0.6, 2.0, 5.0, 22.0]);
  const [showProvablyFair, setShowProvablyFair] = useState<boolean>(false);
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [autoBetsRemaining, setAutoBetsRemaining] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bucketBounceRef = useRef<number[]>([]);
  const pinsRef = useRef<PinState[]>([]);
  const ballsRef = useRef<Ball[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const autoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Exact Stake Plinko multiplier arrays
  const getMultipliers = (r: 'low' | 'medium' | 'high', rowCount: number): number[] => {
    if (rowCount === 8) {
      if (r === 'low') return [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6];
      if (r === 'medium') return [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13];
      return [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29];
    }
    if (rowCount === 10) {
      if (r === 'low') return [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9];
      if (r === 'medium') return [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22];
      return [76, 10, 3, 1.4, 0.2, 0.2, 0.2, 1.4, 3, 10, 76];
    }
    // 12 rows
    if (r === 'low') return [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10];
    if (r === 'medium') return [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33];
    return [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170];
  };

  const multipliers = useMemo(() => getMultipliers(risk, rows), [risk, rows]);

  useEffect(() => {
    bucketBounceRef.current = new Array(multipliers.length).fill(0);
  }, [multipliers.length]);

  /**
   * Continuous Thermal Gradient Interpolation for Multipliers
   * Color(x) = lerp(Gold, Laser Fuchsia, |x|^2) from center out
   */
  const getMultiplierGradient = (index: number, total: number) => {
    const mid = (total - 1) / 2;
    const dist = Math.abs(index - mid) / mid;
    const t = dist * dist;

    if (t < 0.12) {
      return { bg1: '#facc15', bg2: '#ca8a04', text: '#0f212e', border: '#eab308' }; // Gold
    } else if (t < 0.4) {
      return { bg1: '#fb923c', bg2: '#ea580c', text: '#0f212e', border: '#f97316' }; // Warm Orange
    } else if (t < 0.75) {
      return { bg1: '#ef4444', bg2: '#b91c1c', text: '#ffffff', border: '#dc2626' }; // Fiery Crimson
    } else {
      return { bg1: '#ec4899', bg2: '#9d174d', text: '#ffffff', border: '#f43f5e' }; // Laser Fuchsia
    }
  };

  // Drop single or burst ball
  const dropBall = useCallback(
    (count = 1) => {
      const totalCost = betAmount * count;
      if (totalCost <= 0) return;
      if (totalCost > balance) {
        if (isAutoRunning) {
          setIsAutoRunning(false);
          if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
        }
        return;
      }

      onUpdateBalance(balance - totalCost);
      setActiveBalls((prev) => prev + count);

      const canvas = canvasRef.current;
      if (!canvas) return;

      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          // Gaussian-like drop around center aperture
          const u1 = Math.random();
          const u2 = Math.random();
          const randStdNormal = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
          const startX = canvas.width / 2 + randStdNormal * 3.5;

          ballsRef.current.push({
            x: startX,
            y: 12,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 2.2,
            radius: 5.5,
            color: '#f43f5e',
            glow: '#fda4af',
            specular: '#ffe4e6',
            bet: betAmount,
            restitution: 0.74,
            friction: 0.08,
          });
        }, i * 110);
      }
    },
    [balance, betAmount, isAutoRunning, onUpdateBalance]
  );

  const handleStartAuto = () => {
    setIsAutoRunning(true);
    setAutoBetsRemaining(20);
    dropBall(1);
    autoIntervalRef.current = setInterval(() => {
      dropBall(1);
    }, 450);
  };

  const handleStopAuto = () => {
    setIsAutoRunning(false);
    if (autoIntervalRef.current) {
      clearInterval(autoIntervalRef.current);
      autoIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
    };
  }, []);

  // -------------------------------------------------------------
  // Canvas Animation & SAT Physics Loop with Hooke's Law
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    const width = canvas.width;
    const height = canvas.height;

    const startY = 38;
    const endY = height - 58;
    const rowSpacing = (endY - startY) / rows;
    const pinRadius = 3.6;

    const bucketCount = multipliers.length;
    const bucketSpacing = (width - 32) / bucketCount;
    const baseBucketY = height - 42;

    // Initialize Pins with Hooke's Law vibrational state
    const newPins: PinState[] = [];
    for (let r = 0; r <= rows; r++) {
      const pinCount = r + 3;
      const pinSpacing = Math.min(36, (width - 44) / (rows + 3));
      const rowWidth = (pinCount - 1) * pinSpacing;
      const rowStartX = (width - rowWidth) / 2;
      const py = startY + r * rowSpacing;

      for (let p = 0; p < pinCount; p++) {
        const px = rowStartX + p * pinSpacing;
        newPins.push({
          baseX: px,
          baseY: py,
          x: px,
          y: py,
          vx: 0,
          vy: 0,
          row: r,
          glowTime: 0,
        });
      }
    }
    pinsRef.current = newPins;

    // Build SAT Convex Deflectors (Top funnel + Side zig-zags + Bucket dividers)
    const convexDeflectors: ConvexPolygon[] = [];

    // Top Funnel
    convexDeflectors.push(
      createTriangleWedge(
        { x: width / 2 - 58, y: 0 },
        { x: width / 2 - 16, y: 22 },
        { x: width / 2 - 58, y: 28 },
        { restitution: 0.72, friction: 0.08 }
      )
    );
    convexDeflectors.push(
      createTriangleWedge(
        { x: width / 2 + 58, y: 0 },
        { x: width / 2 + 58, y: 28 },
        { x: width / 2 + 16, y: 24 },
        { restitution: 0.72, friction: 0.08 }
      )
    );

    // Side Zig-Zag Deflectors
    for (let r = 1; r <= rows; r++) {
      const pinCount = r + 3;
      const pinSpacing = Math.min(36, (width - 44) / (rows + 3));
      const rowWidth = (pinCount - 1) * pinSpacing;
      const rowStartX = (width - rowWidth) / 2;
      const py = startY + r * rowSpacing;

      const leftTipX = Math.max(8, rowStartX - pinSpacing * 0.45);
      convexDeflectors.push(
        createTriangleWedge(
          { x: 4, y: py - rowSpacing * 0.42 },
          { x: leftTipX, y: py },
          { x: 4, y: py + rowSpacing * 0.42 },
          { restitution: 0.8, friction: 0.05 }
        )
      );

      const rightPinEndX = rowStartX + (pinCount - 1) * pinSpacing;
      const rightTipX = Math.min(width - 8, rightPinEndX + pinSpacing * 0.45);
      convexDeflectors.push(
        createTriangleWedge(
          { x: width - 4, y: py - rowSpacing * 0.42 },
          { x: width - 4, y: py + rowSpacing * 0.42 },
          { x: rightTipX, y: py },
          { restitution: 0.8, friction: 0.05 }
        )
      );
    }

    // Bucket Divider teeth
    for (let i = 0; i < bucketCount - 1; i++) {
      const dividerX = 16 + (i + 1) * bucketSpacing;
      convexDeflectors.push(
        createConvexPolygon(
          [
            { x: dividerX - 2.5, y: baseBucketY + 30 },
            { x: dividerX - 2.5, y: baseBucketY + 6 },
            { x: dividerX, y: baseBucketY - 3 },
            { x: dividerX + 2.5, y: baseBucketY + 6 },
            { x: dividerX + 2.5, y: baseBucketY + 30 },
          ],
          { restitution: 0.82, friction: 0.06 }
        )
      );
    }

    let lastTime = performance.now();

    const render = (now: number) => {
      if (!running) return;

      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Draw Side Deflectors with Metallic Bevel
      for (const deflector of convexDeflectors) {
        drawPBRConvexPolygon(ctx, deflector, {
          glowColor: '#10b981',
          bevelWidth: 1.5,
          angleOffset: now * 0.002,
        });
      }

      // Update and Draw Pins with Hooke's Law Vibration
      const k = 0.28; // Spring constant
      const damping = 0.84; // Mechanical damping

      for (let i = 0; i < pinsRef.current.length; i++) {
        const pin = pinsRef.current[i];

        // Hooke's law: acceleration towards equilibrium base position
        pin.vx += (pin.baseX - pin.x) * k;
        pin.vy += (pin.baseY - pin.y) * k;
        pin.vx *= damping;
        pin.vy *= damping;
        pin.x += pin.vx;
        pin.y += pin.vy;

        if (pin.glowTime > 0) {
          pin.glowTime = Math.max(0, pin.glowTime - dt * 3.5);
        }

        // Draw Pin (Base + Glowing Core on hit)
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, pinRadius + 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#213743';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pin.x, pin.y, pinRadius, 0, Math.PI * 2);
        ctx.fillStyle = pin.glowTime > 0 ? '#00e701' : '#ffffff';
        if (pin.glowTime > 0) {
          ctx.shadowColor = '#00e701';
          ctx.shadowBlur = 10 * pin.glowTime;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Specular glint
        ctx.beginPath();
        ctx.arc(pin.x - 1, pin.y - 1, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      // Draw Multiplier Buckets with Continuous Thermal Gradient
      multipliers.forEach((mult, idx) => {
        const x = 16 + idx * bucketSpacing;
        const bounce = bucketBounceRef.current[idx] || 0;
        if (bounce > 0) {
          bucketBounceRef.current[idx] = Math.max(0, bounce - 0.35);
        }
        const bucketY = baseBucketY + bounce;

        const colorScheme = getMultiplierGradient(idx, multipliers.length);

        const grad = ctx.createLinearGradient(x, bucketY, x, bucketY + 28);
        grad.addColorStop(0, colorScheme.bg1);
        grad.addColorStop(1, colorScheme.bg2);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x + 2, bucketY, bucketSpacing - 4, 28, 5);
        ctx.fill();

        ctx.strokeStyle = colorScheme.border;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = colorScheme.text;
        ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${mult}x`, x + bucketSpacing / 2, bucketY + 14);
      });

      // -------------------------------------------------------------
      // Sub-Stepped Continuous Physics Simulation (Zero-Allocation)
      // -------------------------------------------------------------
      const subSteps = 3;
      const subDt = dt / subSteps;
      const updatedBalls: Ball[] = [];

      for (let i = 0; i < ballsRef.current.length; i++) {
        const ball = ballsRef.current[i];
        let hasLanded = false;

        for (let step = 0; step < subSteps; step++) {
          ball.vy += 450 * subDt;
          ball.vx *= Math.pow(0.992, subDt * 60);
          ball.vy *= Math.pow(0.994, subDt * 60);

          ball.x += ball.vx * (subDt * 60);
          ball.y += ball.vy * (subDt * 60);

          // 1. Deflectors SAT Collisions
          for (let d = 0; d < convexDeflectors.length; d++) {
            const deflector = convexDeflectors[d];
            const didHit = Collision2D.resolveElasticPolygonCollision(ball, deflector);
            if (didHit) {
              sounds.playPegBounce();
              plinkoVFX.triggerDeflectorHit(ball.x, ball.y, '#10b981');
            }
          }

          // 2. Pins Collisions with Elastic Hooke's Law Kickback
          for (let pIdx = 0; pIdx < pinsRef.current.length; pIdx++) {
            const pin = pinsRef.current[pIdx];
            const dx = ball.x - pin.x;
            const dy = ball.y - pin.y;
            const distSq = dx * dx + dy * dy;
            const minDist = ball.radius + pinRadius;

            if (distSq < minDist * minDist && distSq > 0.0001) {
              const dist = Math.sqrt(distSq);
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;

              // Push ball out
              ball.x += nx * (overlap + 0.1);
              ball.y += ny * (overlap + 0.1);

              const vDotN = ball.vx * nx + ball.vy * ny;
              if (vDotN < 0) {
                // Ball rebound
                const e = 0.72;
                const newVn = -vDotN * e;
                const tx = -ny;
                const ty = nx;
                const newVt = (ball.vx * tx + ball.vy * ty) * 0.92;
                const jitter = (Math.random() - 0.5) * 0.9;
                ball.vx = newVn * nx + newVt * tx + jitter;
                ball.vy = newVn * ny + newVt * ty;

                // Hooke's law kickback impulse applied to the physical pin!
                pin.vx -= nx * 2.8;
                pin.vy -= ny * 2.8;
                pin.glowTime = 1;

                // Pure Web Audio Pentatonic Pitch according to row
                sounds.playPentatonicPeg(pin.row / rows);
                plinkoVFX.triggerPlinkoPegHit(pin.x, pin.y, '#00e701');
              }
            }
          }

          if (ball.y >= baseBucketY) {
            hasLanded = true;
            break;
          }
        }

        if (hasLanded) {
          const relX = ball.x - 16;
          const bucketIndex = Math.max(0, Math.min(bucketCount - 1, Math.floor(relX / bucketSpacing)));
          const hitMult = multipliers[bucketIndex];
          const payout = parseFloat((ball.bet * hitMult).toFixed(2));

          if (bucketBounceRef.current[bucketIndex] !== undefined) {
            bucketBounceRef.current[bucketIndex] = 7;
          }

          plinkoVFX.triggerPlinkoBucketWin(ball.x, baseBucketY + 14, hitMult);

          if (hitMult >= 1.5) {
            sounds.playCashout();
            if (hitMult >= 10) {
              confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
            }
          }

          onUpdateBalance(balance + payout);
          onRecordBet(ball.bet, hitMult, payout, hitMult >= 1);
          setRecentHits((prev) => [hitMult, ...prev.slice(0, 4)]);
          setActiveBalls((prev) => Math.max(0, prev - 1));
        } else {
          drawPBRSphere(ctx, ball.x, ball.y, ball.radius, ball.color, ball.specular, -Math.PI / 4);
          updatedBalls.push(ball);
        }
      }

      ballsRef.current = updatedBalls;

      plinkoVFX.update(1);
      plinkoVFX.draw(ctx);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [multipliers, rows, balance, onRecordBet, onUpdateBalance]);

  return (
    <div className="flex flex-col lg:flex-row bg-[#0f212e] rounded-2xl overflow-hidden border border-[#213743] shadow-2xl">
      {/* Universal Stake Canonical Control Panel */}
      <UniversalStakeControl
        balance={balance}
        betAmount={betAmount}
        onChangeBetAmount={setBetAmount}
        onAction={(isAuto) => (isAuto ? handleStartAuto() : dropBall(1))}
        actionLabel="Apostar (Tirar Bola)"
        actionDisabled={betAmount > balance || betAmount <= 0}
        isAutoRunning={isAutoRunning}
        onStopAuto={handleStopAuto}
        autoBetsLeft={autoBetsRemaining}
        onOpenProvablyFair={() => setShowProvablyFair(true)}
        enableHotkeys={true}
        gameId="plinko"
      >
        {/* Risk Level */}
        <div>
          <label className="text-xs text-[#b1bad3] mb-1.5 font-semibold block">Nivel de Riesgo</label>
          <div className="grid grid-cols-3 gap-1 bg-[#0f212e] p-1 rounded-xl border border-[#213743]">
            {(['low', 'medium', 'high'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRisk(r)}
                className={`py-2 text-xs font-black rounded-lg capitalize transition-all cursor-pointer ${
                  risk === r ? 'bg-[#213743] text-white shadow-sm' : 'text-[#b1bad3] hover:text-white'
                }`}
              >
                {r === 'low' ? 'Bajo' : r === 'medium' ? 'Medio' : 'Alto'}
              </button>
            ))}
          </div>
        </div>

        {/* Rows Selector */}
        <div>
          <div className="flex justify-between text-xs text-[#b1bad3] mb-1.5 font-semibold">
            <span>Filas</span>
            <span className="font-bold text-white font-mono">{rows} Filas</span>
          </div>
          <select
            value={rows}
            onChange={(e) => setRows(parseInt(e.target.value, 10))}
            className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#00e701] rounded-lg py-2.5 px-3 text-sm font-semibold text-white focus:outline-none transition-colors cursor-pointer"
          >
            {[8, 10, 12].map((num) => (
              <option key={num} value={num}>
                {num} Filas
              </option>
            ))}
          </select>
        </div>
      </UniversalStakeControl>

      {/* Canvas Arena (Right) */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-between relative bg-[#0f212e]">
        {/* Top bar: Volume & Recent Multipliers Bar */}
        <div className="w-full flex items-center justify-between gap-1.5 mb-2 z-10">
          <button
            onClick={() => {
              sounds.enabled = !soundEnabled;
              setSoundEnabled(!soundEnabled);
            }}
            className="text-[#b1bad3] hover:text-white p-1.5 rounded-lg hover:bg-[#213743] transition-colors"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#557086] mr-1 font-medium">Recientes:</span>
            {recentHits.map((h, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border tabular-nums ${
                  h >= 20
                    ? 'bg-pink-500/20 text-pink-400 border-pink-500/40'
                    : h >= 2
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-[#213743] text-[#b1bad3] border-[#2f4553]'
                }`}
              >
                {h}x
              </span>
            ))}
          </div>
        </div>

        {/* Canvas Display */}
        <div className="relative w-full max-w-lg aspect-[500/460] rounded-2xl overflow-hidden border border-[#213743] bg-[#0f212e] shadow-inner">
          <canvas
            ref={canvasRef}
            width={500}
            height={460}
            className="w-full h-full block"
          />
        </div>

        {/* Footer Indicators */}
        <div className="flex items-center gap-2 text-xs text-[#557086] mt-3 tabular-nums">
          <span>Bolas en juego: <strong className="text-white font-mono">{activeBalls}</strong></span>
          <span>·</span>
          <span>Física: <strong className="text-emerald-400">Hooke&apos;s Law + SAT</strong></span>
          <span>·</span>
          <span>Audio: <strong className="text-amber-400">Escala Pentatónica 880Hz-110Hz</strong></span>
        </div>
      </div>

      {/* Provably Fair Modal */}
      <ProvablyFairModal
        isOpen={showProvablyFair}
        onClose={() => setShowProvablyFair(false)}
        gameTitle="Plinko Stake Original"
      />
    </div>
  );
};
