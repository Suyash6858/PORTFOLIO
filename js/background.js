/* ==========================================================================
   FUTURE OS // CYBERNETIC BACKGROUND (CANVAS + PARALLAX)
   Multi-colour palette: Cyan, Electric-Blue, Soft Violet, Subtle Teal
   Deep midnight navy & charcoal gradient base
   ========================================================================== */

class CyberBackground {
  constructor() {
    this.canvas = document.getElementById('canvas-bg');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.particles = [];
    this.particleCount = 55;
    this.maxDistance = 140;
    
    this.showGrid = true;
    this.gridOffset = 0;
    
    this.mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      radius: 170
    };

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Smooth mouse parallax tracking
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
    });

    this.createParticles();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    const count = window.innerWidth < 768 ? 25 : this.particleCount;
    // Multi-colour palette for particles:
    // 0: Cyan, 1: Electric Blue, 2: Soft Violet, 3: Subtle Teal
    const palette = [
      'rgba(0, 240, 255, ',
      'rgba(0, 112, 243, ',
      'rgba(167, 139, 250, ',
      'rgba(45, 212, 191, '
    ];

    for (let i = 0; i < count; i++) {
      const colorIndex = Math.floor(Math.random() * palette.length);
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.55,
        vy: (Math.random() - 0.5) * 0.55,
        radius: Math.random() * 2 + 1,
        color: palette[colorIndex],
        baseAlpha: Math.random() * 0.45 + 0.25
      });
    }
  }

  toggleGrid() {
    this.showGrid = !this.showGrid;
    return this.showGrid;
  }

  drawGrid() {
    if (!this.showGrid) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const horizon = h * 0.52;

    ctx.save();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
    ctx.lineWidth = 1;

    // Moving horizontal grid lines with perspective compression
    this.gridOffset = (this.gridOffset + 0.18) % 35;
    for (let y = horizon; y <= h; y += 35) {
      const perspectiveY = horizon + Math.pow((y - horizon) / (h - horizon), 1.8) * (h - horizon);
      ctx.beginPath();
      ctx.moveTo(0, perspectiveY);
      ctx.lineTo(w, perspectiveY);
      ctx.stroke();
    }

    // Perspective vertical vanishing lines
    const vanishingX = w / 2 + (this.mouse.x - w / 2) * 0.05;
    const vanishingY = horizon - 40;
    const cols = 28;
    const step = (w * 2) / cols;

    for (let x = -w * 0.5; x <= w * 1.5; x += step) {
      ctx.beginPath();
      ctx.moveTo(vanishingX, vanishingY);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    ctx.restore();
  }

  animate() {
    // Parallax ease
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Deep space multi-colour gradient
    const bgGrad = this.ctx.createRadialGradient(
      this.mouse.x, this.mouse.y, 20,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.85
    );
    bgGrad.addColorStop(0, '#0c1635');      // Navy ambient center
    bgGrad.addColorStop(0.35, '#070d20');   // Deep midnight
    bgGrad.addColorStop(0.7, '#040713');    // Charcoal navy
    bgGrad.addColorStop(1, '#020308');      // Deepest charcoal
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw Cyber Grid
    this.drawGrid();

    // Draw Particles & Interconnections
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Bounce at screen edges
      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.height) p.vy *= -1;

      // Mouse gentle repulsion
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.mouse.radius) {
        const force = (this.mouse.radius - dist) / this.mouse.radius;
        p.x -= (dx / dist) * force * 1.5;
        p.y -= (dy / dist) * force * 1.5;
      }

      // Draw particle dot
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + p.baseAlpha + ')';
      this.ctx.shadowBlur = 6;
      this.ctx.shadowColor = p.color + '0.6)';
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Connect with nearby particles
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const connDx = p.x - p2.x;
        const connDy = p.y - p2.y;
        const connDist = Math.sqrt(connDx * connDx + connDy * connDy);

        if (connDist < this.maxDistance) {
          const alpha = (1 - connDist / this.maxDistance) * 0.16;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
          this.ctx.lineWidth = 0.75;
          this.ctx.stroke();
        }
      }
    }

    requestAnimationFrame(this.animate);
  }
}

window.cyberBackground = new CyberBackground();
