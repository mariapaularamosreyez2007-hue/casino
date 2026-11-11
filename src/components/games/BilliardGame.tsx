import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { ParticleSystem } from '../../utils/particles';
import { showToast } from '../../utils/toast';
import {
  Volume2,
  VolumeX,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Trophy,
  Target,
  Flame,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Eye,
} from 'lucide-react';

interface BilliardGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordBet: (betAmount: number, multiplier: number, payout: number, isWin: boolean) => void;
}

type TableCloth = 'green' | 'blue' | 'burgundy' | 'graphite';
type GameMode = 'pool8' | 'carambola' | 'trickshot';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  number: number;
  isStriped?: boolean;
  isCue?: boolean;
  pocketsIn?: boolean;
  inPocket?: boolean;
  scale?: number;
}

const CLOTH_STYLES: Record<TableCloth, { name: string; felt: string; border: string; accent: string }> = {
  green: {
    name: 'Verde Simónis 860',
    felt: '#0a633a',
    border: '#064226',
    accent: '#00e701',
  },
  blue: {
    name: 'Azul Casino Eléctrico',
    felt: '#124878',
    border: '#0b2e4d',
    accent: '#38bdf8',
  },
  burgundy: {
    name: 'Borgoña VIP Club',
    felt: '#5e1026',
    border: '#3b0a18',
    accent: '#fb7185',
  },
  graphite: {
    name: 'Grafito Neón Asted',
    felt: '#182430',
    border: '#0f1720',
    accent: '#a855f7',
  },
};

const BALL_COLORS = [
  '#ffffff', // 0: Cue ball
  '#facc15', // 1: Yellow
  '#2563eb', // 2: Blue
  '#dc2626', // 3: Red
  '#7c3aed', // 4: Purple
  '#f97316', // 5: Orange
  '#16a34a', // 6: Green
  '#991b1b', // 7: Maroon
  '#09090b', // 8: 8-Ball Black
  '#facc15', // 9: Striped Yellow
  '#2563eb', // 10: Striped Blue
  '#dc2626', // 11: Striped Red
  '#7c3aed', // 12: Striped Purple
  '#f97316', // 13: Striped Orange
  '#16a34a', // 14: Striped Green
  '#991b1b', // 15: Striped Maroon
];

export const BilliardGame: React.FC<BilliardGameProps> = ({
  balance,
  onUpdateBalance,
  onRecordBet,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [gameMode, setGameMode] = useState<GameMode>('pool8');
  const [tableCloth, setTableCloth] = useState<TableCloth>('green');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [targetCall, setTargetCall] = useState<'any' | 'combo' | 'ball8'>('any');

  // Shot state
  const [aimAngle, setAimAngle] = useState<number>(0); // radians
  const [power, setPower] = useState<number>(65); // 10 to 100
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [ballsMoving, setBallsMoving] = useState<boolean>(false);
  const [cueOffset, setCueOffset] = useState<number>(0); // pull-back visual

  // Results
  const [lastWin, setLastWin] = useState<number>(0);
  const [lastMultiplier, setLastMultiplier] = useState<number>(0);
  const [shotHistory, setShotHistory] = useState<string[]>([]);
  const [cushionHitsCount, setCushionHitsCount] = useState<number>(0);
  const [pocketedThisShot, setPocketedThisShot] = useState<number[]>([]);
  const [showStoryModal, setShowStoryModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());
  const ballsRef = useRef<Ball[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Table dimensions on 760x420 virtual space
  const TABLE_WIDTH = 760;
  const TABLE_HEIGHT = 420;
  const CUSHION = 36;
  const BALL_RADIUS = 12;

  // 6 Pockets
  const pockets = [
    { x: CUSHION + 4, y: CUSHION + 4, r: 22 }, // Top-Left
    { x: TABLE_WIDTH / 2, y: CUSHION - 2, r: 19 }, // Top-Center
    { x: TABLE_WIDTH - CUSHION - 4, y: CUSHION + 4, r: 22 }, // Top-Right
    { x: CUSHION + 4, y: TABLE_HEIGHT - CUSHION - 4, r: 22 }, // Bottom-Left
    { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - CUSHION + 2, r: 19 }, // Bottom-Center
    { x: TABLE_WIDTH - CUSHION - 4, y: TABLE_HEIGHT - CUSHION - 4, r: 22 }, // Bottom-Right
  ];

  // Initialize balls based on mode
  const resetRack = useCallback((mode: GameMode = gameMode) => {
    const list: Ball[] = [];

    if (mode === 'carambola') {
      // 3 balls: White cue, Yellow second, Red carom
      list.push({
        id: 0,
        x: TABLE_WIDTH * 0.28,
        y: TABLE_HEIGHT * 0.5,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS * 1.05,
        color: '#ffffff',
        number: 0,
        isCue: true,
      });
      list.push({
        id: 1,
        x: TABLE_WIDTH * 0.65,
        y: TABLE_HEIGHT * 0.38,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS * 1.05,
        color: '#facc15',
        number: 1,
      });
      list.push({
        id: 2,
        x: TABLE_WIDTH * 0.72,
        y: TABLE_HEIGHT * 0.62,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS * 1.05,
        color: '#ef4444',
        number: 2,
      });
    } else if (mode === 'trickshot') {
      // Cue ball + 4 obstacle balls in a challenging golden alignment
      list.push({
        id: 0,
        x: TABLE_WIDTH * 0.25,
        y: TABLE_HEIGHT * 0.52,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        color: '#ffffff',
        number: 0,
        isCue: true,
      });
      list.push({
        id: 8,
        x: TABLE_WIDTH * 0.62,
        y: TABLE_HEIGHT * 0.42,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        color: '#09090b',
        number: 8,
      });
      list.push({
        id: 3,
        x: TABLE_WIDTH * 0.55,
        y: TABLE_HEIGHT * 0.48,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        color: '#dc2626',
        number: 3,
      });
      list.push({
        id: 2,
        x: TABLE_WIDTH * 0.55,
        y: TABLE_HEIGHT * 0.56,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        color: '#2563eb',
        number: 2,
      });
      list.push({
        id: 1,
        x: TABLE_WIDTH * 0.75,
        y: TABLE_HEIGHT * 0.32,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        color: '#facc15',
        number: 1,
      });
    } else {
      // Pool 8-Ball Classic Triangle Rack
      // Cue ball on head string
      list.push({
        id: 0,
        x: TABLE_WIDTH * 0.24,
        y: TABLE_HEIGHT * 0.5,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        color: '#ffffff',
        number: 0,
        isCue: true,
      });

      // Triangle rack apex at 0.65 of width
      const apexX = TABLE_WIDTH * 0.65;
      const apexY = TABLE_HEIGHT * 0.5;
      const spacing = BALL_RADIUS * 2 + 1;
      const sqrt3 = Math.sqrt(3);

      const rackBallNumbers = [
        1,
        9, 2,
        10, 8, 3, // 8-ball in center of 3rd row
        4, 11, 5, 12,
        13, 6, 14, 7, 15
      ];
      let bIdx = 0;

      for (let col = 0; col < 5; col++) {
        const colX = apexX + col * (spacing * sqrt3 * 0.5);
        const startY = apexY - (col * spacing * 0.5);
        for (let row = 0; row <= col; row++) {
          const colY = startY + row * spacing;
          const num = rackBallNumbers[bIdx] || (bIdx + 1);
          list.push({
            id: num,
            x: colX,
            y: colY,
            vx: 0,
            vy: 0,
            radius: BALL_RADIUS,
            color: BALL_COLORS[num] || '#ffffff',
            number: num,
            isStriped: num > 8,
          });
          bIdx++;
        }
      }
    }

    ballsRef.current = list;
    setPocketedThisShot([]);
    setCushionHitsCount(0);
    setAimAngle(0);
  }, [gameMode]);

  useEffect(() => {
    resetRack(gameMode);
  }, [gameMode, resetRack]);

  // Main Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let active = true;

    const gameLoop = () => {
      if (!active) return;

      const balls = ballsRef.current;
      let anyMoving = false;
      const friction = 0.988; // realistic billiard cloth roll friction

      // 1. Move balls & Rail Collisions
      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        if (b.inPocket) continue;

        // If ball is falling into pocket
        if (b.pocketsIn) {
          b.scale = (b.scale || 1) * 0.85;
          b.vx *= 0.5;
          b.vy *= 0.5;
          b.x += b.vx;
          b.y += b.vy;
          if (b.scale < 0.15) {
            b.inPocket = true;
            b.pocketsIn = false;
          }
          anyMoving = true;
          continue;
        }

        b.x += b.vx;
        b.y += b.vy;
        b.vx *= friction;
        b.vy *= friction;

        // Velocity threshold to prevent endless micro-jitter
        const speed = Math.hypot(b.vx, b.vy);
        if (speed < 0.05) {
          b.vx = 0;
          b.vy = 0;
        } else {
          anyMoving = true;
        }

        // Cushion Boundaries
        const minX = CUSHION + b.radius;
        const maxX = TABLE_WIDTH - CUSHION - b.radius;
        const minY = CUSHION + b.radius;
        const maxY = TABLE_HEIGHT - CUSHION - b.radius;

        // Left / Right rails
        if (b.x < minX) {
          b.x = minX;
          b.vx = -b.vx * 0.85;
          if (speed > 0.4) {
            sounds.playCushionThud();
            setCushionHitsCount((c) => c + 1);
          }
        } else if (b.x > maxX) {
          b.x = maxX;
          b.vx = -b.vx * 0.85;
          if (speed > 0.4) {
            sounds.playCushionThud();
            setCushionHitsCount((c) => c + 1);
          }
        }

        // Top / Bottom rails
        if (b.y < minY) {
          b.y = minY;
          b.vy = -b.vy * 0.85;
          if (speed > 0.4) {
            sounds.playCushionThud();
            setCushionHitsCount((c) => c + 1);
          }
        } else if (b.y > maxY) {
          b.y = maxY;
          b.vy = -b.vy * 0.85;
          if (speed > 0.4) {
            sounds.playCushionThud();
            setCushionHitsCount((c) => c + 1);
          }
        }

        // Pocket check (only in pool & trickshot mode)
        if (gameMode !== 'carambola' && !b.pocketsIn && !b.inPocket) {
          for (const p of pockets) {
            const dist = Math.hypot(b.x - p.x, b.y - p.y);
            if (dist < p.r * 1.1) {
              b.pocketsIn = true;
              b.scale = 1;
              sounds.playPocketDrop();
              setPocketedThisShot((prev) => [...prev, b.number]);
              particlesRef.current.emitSparkles(p.x, p.y, 20, [b.color, '#facc15', '#ffffff']);
              break;
            }
          }
        }
      }

      // 2. Ball-to-Ball Collisions (Elastic 2D)
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const b1 = balls[i];
          const b2 = balls[j];
          if (b1.inPocket || b2.inPocket || b1.pocketsIn || b2.pocketsIn) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = b1.radius + b2.radius;

          if (dist < minDist && dist > 0) {
            // Overlap resolution
            const overlap = (minDist - dist) * 0.5;
            const nx = dx / dist;
            const ny = dy / dist;

            b1.x -= nx * overlap;
            b1.y -= ny * overlap;
            b2.x += nx * overlap;
            b2.y += ny * overlap;

            // Normal and tangential velocities
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / 2; // Equal mass

            b1.vx -= p * nx * 0.94; // slight restitution
            b1.vy -= p * ny * 0.94;
            b2.vx += p * nx * 0.94;
            b2.vy += p * ny * 0.94;

            const relSpeed = Math.hypot(kx, ky);
            if (relSpeed > 0.3) {
              sounds.playBallHit(relSpeed);
            }
          }
        }
      }

      // Check if all balls stopped moving after shot
      if (ballsMoving && !anyMoving) {
        setBallsMoving(false);
        // Cue ball in pocket? Scratch recovery
        const cueBall = balls.find((b) => b.isCue);
        if (cueBall && cueBall.inPocket) {
          cueBall.inPocket = false;
          cueBall.pocketsIn = false;
          cueBall.scale = 1;
          cueBall.x = TABLE_WIDTH * 0.25;
          cueBall.y = TABLE_HEIGHT * 0.5;
          cueBall.vx = 0;
          cueBall.vy = 0;
        }

        // Calculate payout results
        handleShotFinish();
      }

      // 3. DRAWING
      drawTable(ctx);
      particlesRef.current.update();
      particlesRef.current.draw(ctx);

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [ballsMoving, gameMode, tableCloth, aimAngle, power, cueOffset]);

  // Handle outcome when balls come to a full stop
  const handleShotFinish = () => {
    let multiplier = 0;
    let description = '';

    if (gameMode === 'carambola') {
      // 3 Bandas challenge: at least 3 cushion hits
      if (cushionHitsCount >= 3) {
        multiplier = cushionHitsCount === 3 ? 12.0 : cushionHitsCount === 4 ? 25.0 : 45.0;
        description = `¡Carambola Magistral a ${cushionHitsCount} Bandas!`;
      } else {
        description = `Tiro finalizado (${cushionHitsCount} bandas)`;
      }
    } else {
      // Pool / Trickshot
      const pocketed = pocketedThisShot.filter((n) => n !== 0); // exclude cue ball scratch
      if (targetCall === 'ball8') {
        if (pocketed.includes(8)) {
          multiplier = 15.0;
          description = '¡BOLA 8 DE ORO ENTRONCADA!';
        }
      } else if (targetCall === 'combo') {
        if (pocketed.length >= 2) {
          multiplier = 4.5 * pocketed.length;
          description = `¡COMBO DOBLE! ${pocketed.length} bolas en un solo tiro`;
        } else if (pocketed.length === 1) {
          multiplier = 1.2;
          description = '1 bola entroncada';
        }
      } else {
        // Any ball
        if (pocketed.length >= 1) {
          multiplier = 1.8 + (pocketed.length - 1) * 2.0;
          description = `¡Acierto! ${pocketed.length} bola(s) entroncada(s)`;
        }
      }
    }

    const payout = parseFloat((betAmount * multiplier).toFixed(2));
    setLastWin(payout);
    setLastMultiplier(multiplier);

    if (multiplier > 0) {
      sounds.playGoldenJackpot();
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 } });
      onUpdateBalance(balance + payout);
      onRecordBet(betAmount, multiplier, payout, true);
      setShotHistory((prev) => [`Ganaste US$${payout.toFixed(2)} (${multiplier}× - ${description})`, ...prev.slice(0, 4)]);
    } else {
      onRecordBet(betAmount, 0, 0, false);
      setShotHistory((prev) => [`Tiro sin premio (${description || 'Ninguna bola entroncada'})`, ...prev.slice(0, 4)]);
    }
  };

  // Render Table Canvas
  const drawTable = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    const style = CLOTH_STYLES[tableCloth];

    // 1. Outer Wood Frame with Metallic Corner Accents
    ctx.fillStyle = '#26170d';
    ctx.beginPath();
    ctx.roundRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT, 24);
    ctx.fill();

    // Wood Grain Polish
    const woodGrad = ctx.createLinearGradient(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    woodGrad.addColorStop(0, '#3d2314');
    woodGrad.addColorStop(0.5, '#22130b');
    woodGrad.addColorStop(1, '#3d2314');
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(4, 4, TABLE_WIDTH - 8, TABLE_HEIGHT - 8, 20);
    ctx.fill();

    // Inlaid Diamond Aiming Sights on Cushions
    ctx.fillStyle = '#e2e8f0';
    const sightSpacingX = (TABLE_WIDTH - CUSHION * 2) / 8;
    for (let i = 1; i < 8; i++) {
      // Top sights
      drawDiamond(ctx, CUSHION + i * sightSpacingX, CUSHION * 0.45, 3);
      // Bottom sights
      drawDiamond(ctx, CUSHION + i * sightSpacingX, TABLE_HEIGHT - CUSHION * 0.45, 3);
    }
    const sightSpacingY = (TABLE_HEIGHT - CUSHION * 2) / 4;
    for (let i = 1; i < 4; i++) {
      // Left sights
      drawDiamond(ctx, CUSHION * 0.45, CUSHION + i * sightSpacingY, 3);
      // Right sights
      drawDiamond(ctx, TABLE_WIDTH - CUSHION * 0.45, CUSHION + i * sightSpacingY, 3);
    }

    // 2. Cloth Bed Felt
    ctx.fillStyle = style.felt;
    ctx.beginPath();
    ctx.roundRect(CUSHION, CUSHION, TABLE_WIDTH - CUSHION * 2, TABLE_HEIGHT - CUSHION * 2, 8);
    ctx.fill();

    // Cushion Inner Shadow
    ctx.strokeStyle = style.border;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Asted Logo watermark on felt
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.font = '900 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ASTED CUE CLUB', TABLE_WIDTH / 2, TABLE_HEIGHT / 2);
    ctx.restore();

    // Head String (D-line marker)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(TABLE_WIDTH * 0.25, CUSHION);
    ctx.lineTo(TABLE_WIDTH * 0.25, TABLE_HEIGHT - CUSHION);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Pockets (if not carambola)
    if (gameMode !== 'carambola') {
      pockets.forEach((p) => {
        // Brass pocket trim
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
        ctx.fill();

        // Pocket hole
        const holeGrad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.r);
        holeGrad.addColorStop(0, '#000000');
        holeGrad.addColorStop(0.8, '#09090b');
        holeGrad.addColorStop(1, '#18181b');
        ctx.fillStyle = holeGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 4. Balls
    const balls = ballsRef.current;
    balls.forEach((b) => {
      if (b.inPocket) return;
      const scale = b.scale || 1;
      const r = b.radius * scale;

      // Ball shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(b.x + 3, b.y + 4, r * 1.05, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball Body
      const ballGrad = ctx.createRadialGradient(b.x - r * 0.35, b.y - r * 0.35, r * 0.1, b.x, b.y, r);
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.3, b.color);
      ballGrad.addColorStop(1, '#000000');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Striped pattern if striped ball
      if (b.isStriped && scale > 0.5) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x - r, b.y - r * 0.45, r * 2, r * 0.9);
        ctx.restore();
      }

      // Ball Number Plate (except cue ball)
      if (!b.isCue && scale > 0.6) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, r * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.max(7, Math.floor(r * 0.65))}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.number.toString(), b.x, b.y + 0.5);
      }
    });

    // 5. Aiming Line & Cue Stick (When not moving and cue ball is active)
    const cueBall = balls.find((b) => b.isCue && !b.inPocket);
    if (cueBall && !ballsMoving) {
      // Dotted aim laser line
      const aimDist = 260;
      const endX = cueBall.x + Math.cos(aimAngle) * aimDist;
      const endY = cueBall.y + Math.sin(aimAngle) * aimDist;

      ctx.save();
      ctx.strokeStyle = style.accent;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(cueBall.x, cueBall.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Ghost target ring at aim end
      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, Math.PI * 2);
      ctx.fillStyle = style.accent;
      ctx.fill();
      ctx.restore();

      // Cue Stick Drawing
      ctx.save();
      ctx.translate(cueBall.x, cueBall.y);
      ctx.rotate(aimAngle + Math.PI); // point towards cue ball

      const stickDist = cueBall.radius + 8 + (isShooting ? cueOffset : (power / 100) * 16);
      const stickLength = 220;

      // Cue Tip (Blue chalk)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(stickDist, -2.5, 6, 5);

      // Cue Ferrule (White)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(stickDist + 6, -3, 8, 6);

      // Cue Shaft (Maple wood gradient)
      const shaftGrad = ctx.createLinearGradient(stickDist + 14, 0, stickDist + stickLength, 0);
      shaftGrad.addColorStop(0, '#fef08a');
      shaftGrad.addColorStop(0.6, '#b45309');
      shaftGrad.addColorStop(1, '#18181b');
      ctx.fillStyle = shaftGrad;
      ctx.fillRect(stickDist + 14, -4, stickLength, 8);

      ctx.restore();
    }
  };

  const drawDiamond = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fill();
  };

  // Mouse / Touch Aiming
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (ballsMoving) return;
    updateAimFromEvent(e.clientX, e.clientY);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (ballsMoving || (e.buttons !== 1 && !e.shiftKey)) return;
    updateAimFromEvent(e.clientX, e.clientY);
  };

  const updateAimFromEvent = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = TABLE_WIDTH / rect.width;
    const scaleY = TABLE_HEIGHT / rect.height;

    const mouseX = (clientX - rect.left) * scaleX;
    const mouseY = (clientY - rect.top) * scaleY;

    const cueBall = ballsRef.current.find((b) => b.isCue && !b.inPocket);
    if (!cueBall) return;

    const angle = Math.atan2(mouseY - cueBall.y, mouseX - cueBall.x);
    setAimAngle(angle);
  };

  // Execute the Shot!
  const shoot = () => {
    if (ballsMoving || betAmount <= 0) return;
    if (betAmount > balance) {
      showToast('Saldo insuficiente en tu cartera de Asted.', 'error');
      return;
    }

    const cueBall = ballsRef.current.find((b) => b.isCue && !b.inPocket);
    if (!cueBall) return;

    // Deduct bet amount
    onUpdateBalance(balance - betAmount);
    setLastWin(0);
    setLastMultiplier(0);
    setPocketedThisShot([]);
    setCushionHitsCount(0);
    setIsShooting(true);

    // Pull-back cue stick animation
    let pullStep = 0;
    const pullInterval = setInterval(() => {
      pullStep += 1;
      setCueOffset(pullStep * 4);

      if (pullStep >= 5) {
        clearInterval(pullInterval);
        // Snap forward and strike
        setCueOffset(-6);
        setTimeout(() => {
          setCueOffset(0);
          setIsShooting(false);
          setBallsMoving(true);

          // Apply impulse to cue ball
          const speed = (power / 100) * 22 + 4; // Velocity scale
          cueBall.vx = Math.cos(aimAngle) * speed;
          cueBall.vy = Math.sin(aimAngle) * speed;

          sounds.playCueStrike(power / 100);
        }, 60);
      }
    }, 20);
  };

  return (
    <div className="flex flex-col lg:flex-row bg-[#0f212e] rounded-2xl overflow-hidden border border-[#213743] shadow-2xl">
      {/* Left Control Panel */}
      <div className="w-full lg:w-80 bg-[#1a2c38] p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#213743]">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#213743]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e701] shadow-[0_0_8px_#00e701]" />
              <span className="text-sm font-black tracking-wider text-white uppercase">
                Villar Pro Asted Club
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowStoryModal(!showStoryModal)}
                className="text-[#b1bad3] hover:text-white p-1 rounded transition-colors"
                title="Historia y Reglas del Billar"
              >
                <HelpCircle size={18} />
              </button>
              <button
                onClick={() => {
                  sounds.enabled = !soundEnabled;
                  setSoundEnabled(!soundEnabled);
                }}
                className="text-[#b1bad3] hover:text-white p-1 rounded transition-colors"
                title="Sonido"
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>
          </div>

          {/* Game Mode Selector */}
          <div>
            <label className="text-xs text-[#b1bad3] font-semibold uppercase tracking-wider block mb-1.5">
              Modalidad de Billar
            </label>
            <div className="grid grid-cols-3 gap-1 bg-[#0f212e] p-1 rounded-xl border border-[#213743]">
              <button
                type="button"
                disabled={ballsMoving}
                onClick={() => setGameMode('pool8')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  gameMode === 'pool8'
                    ? 'bg-[#213743] text-white shadow-sm'
                    : 'text-[#b1bad3] hover:text-white'
                }`}
              >
                Bola 8
              </button>
              <button
                type="button"
                disabled={ballsMoving}
                onClick={() => setGameMode('carambola')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  gameMode === 'carambola'
                    ? 'bg-[#213743] text-white shadow-sm'
                    : 'text-[#b1bad3] hover:text-white'
                }`}
              >
                3 Bandas
              </button>
              <button
                type="button"
                disabled={ballsMoving}
                onClick={() => setGameMode('trickshot')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  gameMode === 'trickshot'
                    ? 'bg-[#213743] text-white shadow-sm'
                    : 'text-[#b1bad3] hover:text-white'
                }`}
              >
                Trick Shot
              </button>
            </div>
          </div>

          {/* Table Cloth Color Picker */}
          <div>
            <label className="text-xs text-[#b1bad3] font-semibold uppercase tracking-wider block mb-1.5">
              Tapiz de la Mesa
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(CLOTH_STYLES) as TableCloth[]).map((key) => {
                const item = CLOTH_STYLES[key];
                const isSelected = tableCloth === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTableCloth(key)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'border-white text-white shadow-md'
                        : 'border-[#213743] text-[#b1bad3] hover:border-[#2f4553]'
                    }`}
                    style={{ backgroundColor: item.felt }}
                  >
                    <span className="truncate w-full text-center drop-shadow">{item.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <div className="flex justify-between text-xs text-[#b1bad3] mb-1.5 font-medium">
              <span>Monto de la Apuesta</span>
              <span className="font-mono text-white font-bold">US$ {betAmount.toFixed(2)}</span>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-xs font-semibold text-[#557086]">$</div>
              <input
                type="number"
                min="1"
                step="5"
                disabled={ballsMoving}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#00e701] rounded-lg py-2.5 pl-7 pr-24 text-sm font-semibold text-white focus:outline-none transition-colors disabled:opacity-60 font-mono"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  disabled={ballsMoving}
                  onClick={() => setBetAmount(Math.max(1, parseFloat((betAmount / 2).toFixed(2))))}
                  className="px-2 py-1 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white text-xs font-bold rounded transition-colors"
                >
                  ½
                </button>
                <button
                  type="button"
                  disabled={ballsMoving}
                  onClick={() => setBetAmount(parseFloat((betAmount * 2).toFixed(2)))}
                  className="px-2 py-1 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white text-xs font-bold rounded transition-colors"
                >
                  2×
                </button>
              </div>
            </div>
          </div>

          {/* Target Call Multiplier (Only in Pool / Trickshot) */}
          {gameMode !== 'carambola' ? (
            <div>
              <label className="text-xs text-[#b1bad3] font-semibold uppercase tracking-wider block mb-1.5">
                Desafío de Multiplicador
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  disabled={ballsMoving}
                  onClick={() => setTargetCall('any')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    targetCall === 'any'
                      ? 'border-[#00e701] bg-[#00e701]/10 text-white'
                      : 'border-[#213743] bg-[#0f212e] text-[#b1bad3]'
                  }`}
                >
                  <span className="block text-[11px] font-bold">Cualquier Bola</span>
                  <span className="text-xs font-black text-[#00e701] font-mono">1.80×</span>
                </button>
                <button
                  type="button"
                  disabled={ballsMoving}
                  onClick={() => setTargetCall('combo')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    targetCall === 'combo'
                      ? 'border-[#38bdf8] bg-[#38bdf8]/10 text-white'
                      : 'border-[#213743] bg-[#0f212e] text-[#b1bad3]'
                  }`}
                >
                  <span className="block text-[11px] font-bold">Combo Doble</span>
                  <span className="text-xs font-black text-[#38bdf8] font-mono">4.50×</span>
                </button>
                <button
                  type="button"
                  disabled={ballsMoving}
                  onClick={() => setTargetCall('ball8')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    targetCall === 'ball8'
                      ? 'border-amber-400 bg-amber-400/10 text-white'
                      : 'border-[#213743] bg-[#0f212e] text-[#b1bad3]'
                  }`}
                >
                  <span className="block text-[11px] font-bold">Bola 8 Oro</span>
                  <span className="text-xs font-black text-amber-400 font-mono">15.00×</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#0f212e] border border-[#213743] rounded-xl text-xs space-y-1">
              <span className="font-bold text-amber-400 block uppercase">Regla de 3 Bandas</span>
              <p className="text-[#b1bad3] leading-relaxed">
                La bola blanca debe golpear un mínimo de 3 bandas antes o después del contacto para ganar hasta 45x!
              </p>
            </div>
          )}

          {/* Shot Power Control */}
          <div>
            <div className="flex justify-between text-xs text-[#b1bad3] mb-1 font-semibold">
              <span className="flex items-center gap-1">
                <Flame size={14} className="text-amber-400" /> Fuerza del Tiro
              </span>
              <span className="font-mono text-white font-bold">{power}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="100"
              disabled={ballsMoving}
              value={power}
              onChange={(e) => setPower(parseInt(e.target.value))}
              className="w-full h-2 bg-[#0f212e] rounded-lg appearance-none cursor-pointer accent-[#00e701]"
            />
          </div>

          {/* Precision Aim Angle Controls */}
          <div className="flex items-center justify-between bg-[#0f212e] p-2 rounded-xl border border-[#213743]">
            <span className="text-xs text-[#b1bad3] font-medium">Ajuste Fino de Ángulo</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={ballsMoving}
                onClick={() => setAimAngle((a) => a - 0.035)}
                className="p-1.5 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white rounded-lg text-xs"
                title="-2 Grados"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={ballsMoving}
                onClick={() => setAimAngle((a) => a + 0.035)}
                className="p-1.5 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white rounded-lg text-xs"
                title="+2 Grados"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                disabled={ballsMoving}
                onClick={() => resetRack(gameMode)}
                className="p-1.5 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white rounded-lg text-xs"
                title="Reiniciar Mesa"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Big Win Banner */}
          {lastWin > 0 && (
            <div className="bg-[#00e701]/10 border border-[#00e701]/40 p-3.5 rounded-xl text-center animate-in zoom-in-95">
              <span className="text-xs text-[#00e701] font-black uppercase tracking-wider flex items-center justify-center gap-1">
                <Sparkles size={16} /> ¡JUGADA MAESTRA!
              </span>
              <p className="text-2xl font-black text-white font-mono mt-1">
                +US$ {lastWin.toFixed(2)}
              </p>
              <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                Multiplicador Pagado: {lastMultiplier}×
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4 mt-4 border-t border-[#213743]">
          <button
            onClick={shoot}
            disabled={ballsMoving}
            className="w-full py-4 bg-[#00e701] hover:bg-[#00c701] text-[#0f212e] font-black text-sm tracking-wider uppercase rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-[#00e701]/30 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Target size={18} />
            <span>{ballsMoving ? 'Bolas en Juego...' : 'Ejecutar Tiro'}</span>
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#557086] mt-2.5">
            <ShieldCheck size={14} className="text-[#00e701]" />
            <span>Física 2D de Colisión Acelerada · RTP 98.7%</span>
          </div>
        </div>
      </div>

      {/* Right Canvas Billiard Arena */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center relative bg-gradient-to-b from-[#1a2c38]/80 via-[#0f212e] to-[#1a2c38]/60">
        {/* Top Arena Header */}
        <div className="w-full max-w-3xl flex items-center justify-between mb-3 text-xs text-[#b1bad3]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider">
              {gameMode === 'pool8' ? 'Mesa Pool Bola 8 de Competición' : gameMode === 'carambola' ? 'Mesa Francesa de 3 Bandas' : 'Mesa de Desafíos Trick Shot'}
            </span>
            <span className="text-[10px] bg-[#213743] px-2 py-0.5 rounded text-[#38bdf8] font-bold">
              Paño: {CLOTH_STYLES[tableCloth].name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {cushionHitsCount > 0 && (
              <span className="text-amber-400 font-mono font-bold">
                Bandas: {cushionHitsCount}
              </span>
            )}
            {pocketedThisShot.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[#00e701] font-bold">Entroncadas:</span>
                {pocketedThisShot.map((n, i) => (
                  <span
                    key={i}
                    className="w-5 h-5 rounded-full bg-white text-black font-mono font-black text-[10px] flex items-center justify-center border border-black/40 shadow-sm"
                  >
                    {n}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Billiard Table Canvas Container */}
        <div className="relative w-full max-w-3xl aspect-[760/420] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden border border-[#2f4553]/60 cursor-crosshair">
          <canvas
            ref={canvasRef}
            width={TABLE_WIDTH}
            height={TABLE_HEIGHT}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            className="w-full h-full block"
          />

          {/* Interactive Aim Helper overlay */}
          <div className="absolute bottom-3 left-4 pointer-events-none text-[11px] text-white/70 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            <span>Arrastra el ratón o toca la mesa para apuntar el taco</span>
          </div>
        </div>

        {/* Shot Log & Statistics */}
        <div className="w-full max-w-3xl mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#557086]">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-amber-400" />
            <span className="text-[#b1bad3] font-medium">Últimos Tiros:</span>
            <span className="font-mono text-white/90">
              {shotHistory[0] || 'Apunta a las bolas y jala el taco para comenzar'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Coeficiente Restitución e: 0.94</span>
            <span>·</span>
            <span>Gravedad cero en plano</span>
          </div>
        </div>
      </div>

      {/* Story / Lore Modal */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1a2c38] border border-[#2f4553] max-w-lg w-full rounded-2xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#213743]">
              <div className="flex items-center gap-2">
                <Trophy className="text-amber-400" size={20} />
                <h3 className="text-lg font-black tracking-wide">HISTORIA & REGLAS DEL CLUB DE BILLAR ASTED</h3>
              </div>
              <button
                onClick={() => setShowStoryModal(false)}
                className="text-[#b1bad3] hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[#b1bad3] leading-relaxed">
              En las exclusivas salas privadas de Asted, los maestros del taco se enfrentan en mesas profesionales equipadas con paño Simónis de fricción reducida y bolas de resina fenólica pura.
            </p>

            <div className="space-y-3 text-xs text-[#b1bad3]">
              <div className="p-3 bg-[#0f212e] rounded-xl border border-[#213743]">
                <strong className="text-white block mb-1">🎱 Pool Bola 8:</strong>
                Apunta con el taco para golpear las bolas hacia cualquiera de las 6 buchacas. Si solicitas el desafío &quot;Bola 8 de Oro&quot; y la entroncas directamente, ganas un multiplicador de 15×!
              </div>

              <div className="p-3 bg-[#0f212e] rounded-xl border border-[#213743]">
                <strong className="text-white block mb-1">🟡 Carambola 3 Bandas:</strong>
                Mesa sin troneras. Tu bola blanca debe rebotar contra un mínimo de 3 bandas antes de completar la trayectoria para premios de hasta 45×.
              </div>

              <div className="p-3 bg-[#0f212e] rounded-xl border border-[#213743]">
                <strong className="text-white block mb-1">🎯 Trick Shot / Tiro Maestro:</strong>
                Configuración con bolas obstáculo para jugadores que buscan tiros de banco y dobles rebotes espectaculares.
              </div>
            </div>

            <button
              onClick={() => setShowStoryModal(false)}
              className="w-full py-3 bg-[#00e701] text-[#0f212e] font-black uppercase rounded-xl tracking-wider hover:bg-[#00c701] transition-colors"
            >
              Entendido, ¡A la Mesa!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
