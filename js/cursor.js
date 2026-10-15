/* ==========================================================================
   FUTURE OS // OPTIMIZED LIQUID BLOB CUSTOM CURSOR CONTROLLER
   Fluid digital physics:
   - GPU-accelerated transform pipeline (zero layout reflows)
   - Fast, responsive spring-damped tracking (eliminated sluggish lag)
   - Velocity stretch and organic liquid droplet deformation
   - Delegated hover detection (no MutationObserver overhead)
   - Idle & hidden state auto-pausing for high efficiency
   - Full accessibility: prefers-reduced-motion & touch fallback
   ========================================================================== */

class LiquidCursor {
  constructor() {
    // Check reduced motion preference and touch screens
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768) {
      return;
    }

    this.container = null;
    this.blob = null;
    this.dot = null;

    this.mouse = { x: -100, y: -100 };
    this.blobPos = { x: -100, y: -100 };
    this.velocity = { x: 0, y: 0 };
    this.speed = 0;
    this.angle = 0;
    this.scale = 1;

    this.isHovering = false;
    this.isActive = false;
    this.isTextMode = false;
    this.isVisible = false;
    this.isPaused = false;
    this.rafId = null;

    this.init();
  }

  init() {
    this.createDOM();

    // Mouse movement & state events
    window.addEventListener('mousemove', (e) => this.onMouseMove(e), { passive: true });
    window.addEventListener('mousedown', () => this.onMouseDown(), { passive: true });
    window.addEventListener('mouseup', () => this.onMouseUp(), { passive: true });
    document.addEventListener('mouseleave', () => this.onMouseLeave(), { passive: true });
    document.addEventListener('mouseenter', (e) => this.onMouseEnter(e), { passive: true });

    // Efficient delegated hover detection (zero MutationObserver overhead)
    this.bindDelegatedHover();

    // Pause physics loop when tab is hidden to conserve resources
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isPaused = true;
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
      } else if (this.isVisible) {
        this.isPaused = false;
        if (!this.rafId) {
          this.rafId = requestAnimationFrame(this.render);
        }
      }
    });

    // Start render loop
    this.render = this.render.bind(this);
    this.rafId = requestAnimationFrame(this.render);
  }

  createDOM() {
    let container = document.getElementById('cursor-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'cursor-container';
      container.className = 'hidden';

      const blob = document.createElement('div');
      blob.id = 'cursor-blob';

      const dot = document.createElement('div');
      dot.id = 'cursor-dot';

      container.appendChild(blob);
      container.appendChild(dot);
      document.body.appendChild(container);
    }

    this.container = container;
    this.blob = document.getElementById('cursor-blob');
    this.dot = document.getElementById('cursor-dot');
  }

  onMouseMove(e) {
    if (!this.isVisible) {
      this.isVisible = true;
      if (this.container) {
        this.container.classList.remove('hidden');
      }
      // Snap position immediately on first appearance to prevent entry jump
      this.blobPos.x = e.clientX;
      this.blobPos.y = e.clientY;
    }

    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;

    // Instant central dot tracking
    if (this.dot) {
      this.dot.style.transform = `translate3d(${this.mouse.x}px, ${this.mouse.y}px, 0) translate(-50%, -50%)`;
    }

    // Wake render loop if idle
    if (this.isPaused) {
      this.isPaused = false;
      if (!this.rafId) {
        this.rafId = requestAnimationFrame(this.render);
      }
    }
  }

  onMouseDown() {
    this.isActive = true;
    if (this.container) {
      this.container.classList.add('active');
    }
    if (this.isPaused) {
      this.isPaused = false;
      if (!this.rafId) {
        this.rafId = requestAnimationFrame(this.render);
      }
    }
  }

  onMouseUp() {
    this.isActive = false;
    if (this.container) {
      this.container.classList.remove('active');
    }
    if (this.isPaused) {
      this.isPaused = false;
      if (!this.rafId) {
        this.rafId = requestAnimationFrame(this.render);
      }
    }
  }

  onMouseLeave() {
    this.isVisible = false;
    if (this.container) {
      this.container.classList.add('hidden');
    }
    this.isPaused = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  onMouseEnter(e) {
    this.isVisible = true;
    if (e && typeof e.clientX === 'number') {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.blobPos.x = e.clientX;
      this.blobPos.y = e.clientY;
    }
    if (this.container) {
      this.container.classList.remove('hidden');
    }
    this.isPaused = false;
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.render);
    }
  }

  bindDelegatedHover() {
    const interactiveSelector = 'a, button, .dock-item, .win-btn, .subnav-tab, .placeholder-card, .quick-btn, .context-item, .hero-btn, .social-icon-btn, .desktop-icon, [role="button"]';

    document.addEventListener('mouseover', (e) => {
      const target = e.target;
      if (!target || !this.container) return;

      const interactive = target.closest(interactiveSelector);
      if (interactive) {
        if (!this.isHovering) {
          this.isHovering = true;
          this.container.classList.add('hover');
          if (this.isPaused) {
            this.isPaused = false;
            if (!this.rafId) this.rafId = requestAnimationFrame(this.render);
          }
        }
        return;
      }

      const textInput = target.closest('input, textarea');
      if (textInput) {
        if (!this.isTextMode) {
          this.isTextMode = true;
          this.container.classList.add('text-mode');
          if (this.isPaused) {
            this.isPaused = false;
            if (!this.rafId) this.rafId = requestAnimationFrame(this.render);
          }
        }
        return;
      }

      if (this.isHovering) {
        this.isHovering = false;
        this.container.classList.remove('hover');
        if (this.isPaused) {
          this.isPaused = false;
          if (!this.rafId) this.rafId = requestAnimationFrame(this.render);
        }
      }
      if (this.isTextMode) {
        this.isTextMode = false;
        this.container.classList.remove('text-mode');
        if (this.isPaused) {
          this.isPaused = false;
          if (!this.rafId) this.rafId = requestAnimationFrame(this.render);
        }
      }
    }, { passive: true });
  }

  render() {
    if (!this.isVisible || this.isPaused) {
      return;
    }

    // Velocity delta
    const vx = this.mouse.x - this.blobPos.x;
    const vy = this.mouse.y - this.blobPos.y;
    const distSq = vx * vx + vy * vy;

    // Fast, responsive interpolation (0.45 factor = snappy with crisp fluid feel)
    this.blobPos.x += vx * 0.45;
    this.blobPos.y += vy * 0.45;

    // Instantaneous speed calculation
    const instantaneousSpeed = Math.sqrt(distSq);
    this.speed += (instantaneousSpeed - this.speed) * 0.35;
    this.angle = Math.atan2(vy, vx);

    // Target scale based on interaction state
    const targetScale = this.isActive ? 0.75 : (this.isHovering ? 1.45 : 1.0);
    this.scale += (targetScale - this.scale) * 0.28;

    // Lightweight organic stretch clamp
    const stretch = Math.min(1.3, 1 + this.speed * 0.005);
    const squish = Math.max(0.8, 1 - this.speed * 0.003);

    if (this.blob) {
      if (this.isTextMode) {
        this.blob.style.transform = `translate3d(${this.blobPos.x}px, ${this.blobPos.y}px, 0) translate(-50%, -50%) scale(${this.scale})`;
      } else {
        const sx = stretch * this.scale;
        const sy = squish * this.scale;
        this.blob.style.transform = `translate3d(${this.blobPos.x}px, ${this.blobPos.y}px, 0) translate(-50%, -50%) rotate(${this.angle}rad) scale(${sx}, ${sy})`;
      }
    }

    // Pause physics if cursor has settled to save CPU
    if (distSq < 0.02 && this.speed < 0.04 && Math.abs(this.scale - targetScale) < 0.01) {
      this.isPaused = true;
      this.rafId = null;
      return;
    }

    this.rafId = requestAnimationFrame(this.render);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.liquidCursor = new LiquidCursor();
});
