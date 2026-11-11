export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  gravity?: number;
  rotation?: number;
  vRot?: number;
  shape?: 'circle' | 'square' | 'spark' | 'star';
}

export class ParticleSystem {
  private particles: Particle[] = [];

  emitSparkles(x: number, y: number, count = 20, colors = ['#00e701', '#34d399', '#fef08a']) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        radius: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.025 + 0.015,
        gravity: 0.08,
        shape: 'spark',
      });
    }
  }

  emitExplosion(x: number, y: number, count = 35) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      const colors = ['#ef4444', '#f97316', '#fef08a', '#475569', '#1e293b'];
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        radius: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02,
        gravity: 0.15,
        shape: Math.random() > 0.5 ? 'square' : 'circle',
      });
    }
  }

  emitCoins(x: number, y: number, count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = Math.random() * 7 + 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 3,
        color: '#facc15',
        alpha: 1,
        decay: 0.012,
        gravity: 0.22,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        shape: 'circle',
      });
    }
  }

  emitThrusterFlame(x: number, y: number, angle: number) {
    for (let i = 0; i < 4; i++) {
      const spread = (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 4 + 3;
      const moveAngle = angle + Math.PI + spread;
      const colors = ['#fef08a', '#fb923c', '#ef4444'];
      this.particles.push({
        x,
        y,
        vx: Math.cos(moveAngle) * speed,
        vy: Math.sin(moveAngle) * speed,
        radius: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.9,
        decay: 0.06,
        shape: 'circle',
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      if (p.rotation !== undefined && p.vRot) p.rotation += p.vRot;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
      } else if (p.shape === 'square') {
        ctx.translate(p.x, p.y);
        if (p.rotation) ctx.rotate(p.rotation);
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  clear() {
    this.particles = [];
  }
}
