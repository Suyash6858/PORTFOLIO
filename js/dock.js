/* ==========================================================================
   FUTURE OS // FLOATING DOCK LOGIC & MAGNIFICATION
   ========================================================================== */

class DockManager {
  constructor() {
    this.dock = document.getElementById('dock');
    this.dockItems = document.querySelectorAll('.dock-item');
    this.baseWidth = 48;
    this.maxScale = 1.35;
    this.range = 140;

    this.init();
  }

  init() {
    if (!this.dock) return;

    // Hover audio & click handling
    this.dockItems.forEach(item => {
      const winId = item.dataset.windowId;

      item.addEventListener('mouseenter', () => {
        if (window.soundSystem) window.soundSystem.playHover();
      });

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.soundSystem) window.soundSystem.playClick();

        if (winId === 'home') {
          window.windowManager.goHome();
        } else if (winId) {
          const win = window.windowManager.windows[winId];
          if (win && win.isOpen && !win.isMinimized && window.windowManager.activeWindowId === winId) {
            // Already focused, minimize it (returns to Home)
            window.windowManager.minimize(winId);
          } else {
            // Open application section full-screen
            window.windowManager.open(winId);
          }
        }
      });
    });

    // Desktop hover magnification curve (disabled on mobile)
    if (window.innerWidth > 768) {
      this.dock.addEventListener('mousemove', (e) => this.onMouseMove(e));
      this.dock.addEventListener('mouseleave', () => this.resetMagnification());
    }
  }

  onMouseMove(e) {
    if (window.innerWidth <= 768) return;

    const mouseX = e.clientX;

    this.dockItems.forEach(item => {
      const rect = item.getBoundingClientRect();
      const itemCenterX = rect.left + rect.width / 2;
      const distance = Math.abs(mouseX - itemCenterX);

      if (distance < this.range) {
        // Smooth cosine scaling curve
        const factor = Math.cos((distance / this.range) * (Math.PI / 2));
        const scale = 1 + (this.maxScale - 1) * factor;
        const translateY = -10 * factor;
        item.style.transform = `translateY(${translateY}px) scale(${scale})`;
      } else {
        item.style.transform = 'translateY(0) scale(1)';
      }
    });
  }

  resetMagnification() {
    this.dockItems.forEach(item => {
      item.style.transform = '';
    });
  }
}

window.dockManager = new DockManager();
