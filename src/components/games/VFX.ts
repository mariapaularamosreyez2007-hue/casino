/**
 * ASTED Casino VFX System (Zero-Allocation & PBR Native Edition)
 * Specialized visual effects for Plinko, Mines HD, Dice, and high-reward casino games.
 * Features specular flares, golden glints, expanding victory glow rings, particle fountains, and ambient auras.
 */

import {
  StarFlare,
  drawCasinoSpecularFlare,
  drawProceduralFacetGem,
  drawGoldCoin,
  createGold24KGradient,
} from './Engine';

export type { StarFlare };
export { drawCasinoSpecularFlare, drawProceduralFacetGem, drawGoldCoin, createGold24KGradient };

export interface ParticleVFX {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glowColor: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
  drag?: number;
  rotation?: number;
  vRot?: number;
  type: 'sparkle' | 'coin' | 'glow-ring' | 'star' | 'ray' | 'flare';
  active: boolean;
}

export class CasinoVFXManager {
  private poolSize = 400;
  private particles: ParticleVFX[] = [];
  private flareQueue: StarFlare[] = [];

  constructor(poolSize = 400) {
    this.poolSize = poolSize;
    this.particles = new Array(this.poolSize);
    for (let i = 0; i < this.poolSize; i++) {
      this.particles[i] = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 0,
        color: '#ffffff',
        glowColor: '#ca8a04',
        alpha: 0,
        life: 0,
        maxLife: 1,
        type: 'sparkle',
        active: false,
      };
    }
  }

  private obtainSlot(): ParticleVFX | null {
    for (let i = 0; i < this.poolSize; i++) {
      if (!this.particles[i].active) {
        this.particles[i].active = true;
        return this.particles[i];
      }
    }
    return null;
  }

  /**
   * Generates expanding victory glow rings around winning pegs, multiplier buckets, or winning dice
   */
  emitVictoryGlowRing(x: number, y: number, color = '#facc15', maxRadius = 50) {
    const p = this.obtainSlot();
    if (!p) return;
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = 0;
    p.radius = 6;
    p.color = color;
    p.glowColor = color;
    p.alpha = 1;
    p.life = 0;
    p.maxLife = 24;
    p.gravity = 0;
    p.drag = 1;
    p.type = 'glow-ring';
  }

  /**
   * Emits a reactive diamond/gold specular flare at a coordinate
   */
  emitSpecularFlare(x: number, y: number, size = 18, color = '#fef08a') {
    const p = this.obtainSlot();
    if (!p) return;
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = 0;
    p.radius = size;
    p.color = color;
    p.glowColor = '#ffffff';
    p.alpha = 1;
    p.life = 0;
    p.maxLife = 18;
    p.rotation = Math.random() * Math.PI;
    p.vRot = 0.08;
    p.type = 'flare';
  }

  /**
   * Generates golden starburst sparkles that radiate outward with high specular shine
   */
  emitGoldenSparkles(x: number, y: number, count = 25, spreadSpeed = 5) {
    const goldPalette = ['#ffffff', '#fef08a', '#facc15', '#fbbf24', '#eab308'];
    for (let i = 0; i < count; i++) {
      const p = this.obtainSlot();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * spreadSpeed;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 1.2;
      p.radius = 2 + Math.random() * 3.5;
      p.color = goldPalette[Math.floor(Math.random() * goldPalette.length)];
      p.glowColor = '#ca8a04';
      p.alpha = 1;
      p.life = 0;
      p.maxLife = 28 + Math.random() * 20;
      p.gravity = 0.12;
      p.drag = 0.96;
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 0.25;
      p.type = Math.random() < 0.5 ? 'star' : 'sparkle';
    }
  }

  /**
   * Generates 3D spinning gold coins bursting upwards with realistic gravity
   */
  emitCoinFountain(x: number, y: number, count = 18) {
    for (let i = 0; i < count; i++) {
      const p = this.obtainSlot();
      if (!p) break;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      const speed = 5.0 + Math.random() * 6.5;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.radius = 6 + Math.random() * 3;
      p.color = '#facc15';
      p.glowColor = '#854d0e';
      p.alpha = 1;
      p.life = 0;
      p.maxLife = 45 + Math.random() * 25;
      p.gravity = 0.26;
      p.drag = 0.985;
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 0.4;
      p.type = 'coin';
    }
  }

  /**
   * Specialized Plinko Peg impact effect with neon shockwave, sparks, and specular flare
   */
  triggerPlinkoPegHit(x: number, y: number, pegColor = '#38bdf8') {
    this.emitVictoryGlowRing(x, y, pegColor, 28);
    this.emitSpecularFlare(x, y, 16, pegColor);
    for (let i = 0; i < 6; i++) {
      const p = this.obtainSlot();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.radius = 1.8 + Math.random() * 2;
      p.color = pegColor;
      p.glowColor = '#0284c7';
      p.alpha = 0.9;
      p.life = 0;
      p.maxLife = 15;
      p.gravity = 0.04;
      p.drag = 0.94;
      p.type = 'sparkle';
    }
  }

  /**
   * Specialized Plinko Wall Deflector impact effect
   */
  triggerDeflectorHit(x: number, y: number, color = '#facc15') {
    this.emitVictoryGlowRing(x, y, color, 24);
    this.emitSpecularFlare(x, y, 22, '#ffffff');
    this.emitGoldenSparkles(x, y, 8, 3.5);
  }

  /**
   * Specialized Plinko Bucket Win effect (triggers golden shower + multiple rings)
   */
  triggerPlinkoBucketWin(x: number, y: number, mult: number) {
    const isHighWin = mult >= 10;
    this.emitVictoryGlowRing(x, y, isHighWin ? '#facc15' : '#00e701', 55);
    this.emitSpecularFlare(x, y, isHighWin ? 40 : 22, isHighWin ? '#fef08a' : '#4ade80');
    this.emitGoldenSparkles(x, y, isHighWin ? 40 : 20, isHighWin ? 7 : 4);
    if (isHighWin) {
      this.emitCoinFountain(x, y, 25);
    }
  }

  /**
   * Specialized Dice Win effect: Golden aura, starburst glints, and celebratory coins
   */
  triggerDiceWin(x: number, y: number, multiplier: number) {
    this.emitVictoryGlowRing(x, y, '#00e701', 65);
    this.emitVictoryGlowRing(x, y, '#facc15', 45);
    this.emitSpecularFlare(x, y, 32, '#ffffff');
    this.emitGoldenSparkles(x, y, 35, 6.5);
    if (multiplier >= 2) {
      this.emitCoinFountain(x, y, 20);
    }
  }

  update(dt = 1) {
    for (let i = 0; i < this.poolSize; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      if (p.gravity) p.vy += p.gravity * dt;
      if (p.drag) {
        p.vx *= Math.pow(p.drag, dt);
        p.vy *= Math.pow(p.drag, dt);
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.rotation !== undefined && p.vRot !== undefined) {
        p.rotation += p.vRot * dt;
      }

      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.type === 'glow-ring') {
        p.radius += 2.2 * dt;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (let i = 0; i < this.poolSize; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      ctx.globalAlpha = p.alpha;

      if (p.type === 'flare') {
        drawCasinoSpecularFlare(
          ctx,
          { x: p.x, y: p.y, size: p.radius, alpha: p.alpha, color: p.color },
          p.rotation || 0
        );
      } else if (p.type === 'glow-ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'star') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          ctx.rotate(Math.PI / 2);
          ctx.lineTo(p.radius * 2.2, 0);
          ctx.lineTo(p.radius * 0.5, p.radius * 0.5);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'coin') {
        drawGoldCoin(ctx, p.x, p.y, p.radius, p.rotation || 0, 0.65);
      } else {
        // Sparkle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = 8;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  clear() {
    for (let i = 0; i < this.poolSize; i++) {
      this.particles[i].active = false;
    }
  }
}

// Global shared instances for quick access
export const plinkoVFX = new CasinoVFXManager();
export const diceVFX = new CasinoVFXManager();
