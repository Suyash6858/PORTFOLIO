/* ==========================================================================
   FUTURE OS // WINDOW MANAGER
   Handles opening, closing, minimizing, maximizing, dragging, resizing,
   focus z-indexing, cascading, and tiling.
   ========================================================================== */

class WindowManager {
  constructor() {
    this.windows = {};
    this.topZIndex = 100;
    this.activeWindowId = null;
    this.dragTarget = null;
    this.dragOffset = { x: 0, y: 0 };
    this.resizeTarget = null;
    this.resizeStart = { x: 0, y: 0, width: 0, height: 0, left: 0, top: 0, edge: '' };
    this.cascadeOffset = 0;

    this.init();
  }

  init() {
    // Find all window elements in DOM
    const winElements = document.querySelectorAll('.os-window');
    winElements.forEach((el, index) => {
      const id = el.dataset.windowId;
      this.windows[id] = {
        element: el,
        id: id,
        title: el.querySelector('.window-title')?.textContent || id,
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        prevRect: null
      };

      // Set initial staggered positions for desk layout
      const offset = 40 + (index % 5) * 28;
      const initialLeft = Math.min(window.innerWidth - 650, 140 + offset);
      const initialTop = 60 + offset;
      
      el.style.left = `${Math.max(20, initialLeft)}px`;
      el.style.top = `${Math.max(50, initialTop)}px`;
      el.style.width = '720px';
      el.style.height = '480px';
      el.style.display = 'none';

      // Event listeners for window controls
      const closeBtn = el.querySelector('.win-close');
      const minBtn = el.querySelector('.win-minimize');
      const maxBtn = el.querySelector('.win-maximize');
      const header = el.querySelector('.window-header');

      if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.close(id); });
      if (minBtn) minBtn.addEventListener('click', (e) => { e.stopPropagation(); this.minimize(id); });
      if (maxBtn) maxBtn.addEventListener('click', (e) => { e.stopPropagation(); this.maximize(id); });

      // Focus on click
      el.addEventListener('mousedown', () => this.focus(id));
      el.addEventListener('touchstart', () => this.focus(id), { passive: true });

      // Dragging events on header
      if (header) {
        header.addEventListener('mousedown', (e) => this.startDrag(e, id));
        header.addEventListener('touchstart', (e) => this.startTouchDrag(e, id), { passive: false });
        header.addEventListener('dblclick', () => this.maximize(id));
      }

      // Resize handles
      const rHandle = el.querySelector('.resize-r');
      const bHandle = el.querySelector('.resize-b');
      const brHandle = el.querySelector('.resize-br');

      if (rHandle) rHandle.addEventListener('mousedown', (e) => this.startResize(e, id, 'r'));
      if (bHandle) bHandle.addEventListener('mousedown', (e) => this.startResize(e, id, 'b'));
      if (brHandle) brHandle.addEventListener('mousedown', (e) => this.startResize(e, id, 'br'));
    });

    // Global drag & resize listeners
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.endInteraction());
    window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    window.addEventListener('touchend', () => this.endInteraction());

    // Initially show the Home main landing page
    this.goHome(false);
  }

  open(id) {
    if (id === 'home') {
      this.goHome();
      return;
    }

    const win = this.windows[id];
    if (!win) return;

    if (window.soundSystem) window.soundSystem.playWindowOpen();

    // Hide the main hero landing section while an application window is open
    const heroLanding = document.getElementById('hero-landing');
    if (heroLanding) {
      heroLanding.style.display = 'none';
    }

    // Hide any other open windows so the active section has full focus
    Object.values(this.windows).forEach(w => {
      if (w.id !== id && w.isOpen) {
        w.isOpen = false;
        w.isMinimized = false;
        w.element.style.display = 'none';
        w.element.classList.remove('opening', 'focused');
        this.updateDockState(w.id);
      }
    });

    win.isOpen = true;
    win.isMinimized = false;

    // Open full-screen by default in the available area
    win.isMaximized = true;
    win.element.classList.add('maximized');
    win.element.style.display = 'flex';
    win.element.classList.remove('closing', 'minimized');
    win.element.classList.add('opening');

    setTimeout(() => {
      win.element.classList.remove('opening');
    }, 300);

    this.focus(id);
    this.setHomeDockActive(false);
    this.updateDockState(id);
    this.updateActivePill(win.title);
  }

  close(id) {
    const win = this.windows[id];
    if (!win || !win.isOpen) return;

    if (window.soundSystem) window.soundSystem.playWindowClose();

    win.element.classList.add('closing');
    win.isOpen = false;
    win.isMinimized = false;

    setTimeout(() => {
      win.element.style.display = 'none';
      win.element.classList.remove('closing');
    }, 200);

    this.updateDockState(id);

    // If no other windows are open, return to main landing page
    const openWins = Object.values(this.windows).filter(w => w.isOpen && !w.isMinimized && w.id !== id);
    if (openWins.length > 0) {
      openWins.sort((a, b) => parseInt(b.element.style.zIndex || 0) - parseInt(a.element.style.zIndex || 0));
      this.focus(openWins[0].id);
    } else {
      this.goHome(false);
    }
  }

  minimize(id) {
    const win = this.windows[id];
    if (!win || !win.isOpen) return;

    if (window.soundSystem) window.soundSystem.playMinimize();

    win.isMinimized = true;
    win.element.classList.add('minimized');
    this.updateDockState(id);

    // If no other windows are open, return to main landing page
    const remaining = Object.values(this.windows).filter(w => w.isOpen && !w.isMinimized && w.id !== id);
    if (remaining.length > 0) {
      remaining.sort((a, b) => parseInt(b.element.style.zIndex || 0) - parseInt(a.element.style.zIndex || 0));
      this.focus(remaining[0].id);
    } else {
      this.goHome(false);
    }
  }

  maximize(id) {
    const win = this.windows[id];
    if (!win || !win.isOpen) return;

    if (window.innerWidth <= 768) return; // Always full on mobile

    if (window.soundSystem) window.soundSystem.playMaximize();

    if (win.isMaximized) {
      // Restore previous geometry
      win.isMaximized = false;
      win.element.classList.remove('maximized');
      if (win.prevRect) {
        win.element.style.left = win.prevRect.left;
        win.element.style.top = win.prevRect.top;
        win.element.style.width = win.prevRect.width;
        win.element.style.height = win.prevRect.height;
      }
    } else {
      // Save current geometry and expand
      win.prevRect = {
        left: win.element.style.left,
        top: win.element.style.top,
        width: win.element.style.width,
        height: win.element.style.height
      };
      win.isMaximized = true;
      win.element.classList.add('maximized');
    }
    this.focus(id);
  }

  focus(id) {
    const win = this.windows[id];
    if (!win) return;

    this.topZIndex += 2;
    win.element.style.zIndex = this.topZIndex;
    this.activeWindowId = id;

    // Toggle focused class
    Object.values(this.windows).forEach(w => {
      w.element.classList.toggle('focused', w.id === id);
    });

    this.updateActivePill(win.title);
  }

  // ------------------------------------------------------------------------
  // DRAG & RESIZE HANDLING
  // ------------------------------------------------------------------------
  startDrag(e, id) {
    const win = this.windows[id];
    if (!win || win.isMaximized || window.innerWidth <= 768) return;
    if (e.target.closest('.window-controls')) return;

    this.focus(id);
    this.dragTarget = win;
    const rect = win.element.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;
  }

  startTouchDrag(e, id) {
    const win = this.windows[id];
    if (!win || win.isMaximized || window.innerWidth <= 768) return;
    if (e.target.closest('.window-controls')) return;

    const touch = e.touches[0];
    this.focus(id);
    this.dragTarget = win;
    const rect = win.element.getBoundingClientRect();
    this.dragOffset.x = touch.clientX - rect.left;
    this.dragOffset.y = touch.clientY - rect.top;
    e.preventDefault();
  }

  startResize(e, id, edge) {
    e.stopPropagation();
    e.preventDefault();
    const win = this.windows[id];
    if (!win || win.isMaximized || window.innerWidth <= 768) return;

    this.focus(id);
    this.resizeTarget = win;
    const rect = win.element.getBoundingClientRect();

    this.resizeStart = {
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height,
      edge: edge
    };
  }

  onMouseMove(e) {
    if (this.dragTarget) {
      let x = e.clientX - this.dragOffset.x;
      let y = e.clientY - this.dragOffset.y;

      // Keep within viewport bounds
      const minTop = 40; // Top bar height
      const maxTop = window.innerHeight - 80;
      const minLeft = - (this.dragTarget.element.offsetWidth - 100);
      const maxLeft = window.innerWidth - 100;

      x = Math.max(minLeft, Math.min(x, maxLeft));
      y = Math.max(minTop, Math.min(y, maxTop));

      this.dragTarget.element.style.left = `${x}px`;
      this.dragTarget.element.style.top = `${y}px`;
    } else if (this.resizeTarget) {
      const dx = e.clientX - this.resizeStart.x;
      const dy = e.clientY - this.resizeStart.y;
      const edge = this.resizeStart.edge;

      if (edge === 'r' || edge === 'br') {
        const newWidth = Math.max(380, this.resizeStart.width + dx);
        this.resizeTarget.element.style.width = `${newWidth}px`;
      }
      if (edge === 'b' || edge === 'br') {
        const newHeight = Math.max(280, this.resizeStart.height + dy);
        this.resizeTarget.element.style.height = `${newHeight}px`;
      }
    }
  }

  onTouchMove(e) {
    if (!this.dragTarget || window.innerWidth <= 768) return;
    const touch = e.touches[0];
    let x = touch.clientX - this.dragOffset.x;
    let y = touch.clientY - this.dragOffset.y;

    x = Math.max(0, Math.min(x, window.innerWidth - 100));
    y = Math.max(40, Math.min(y, window.innerHeight - 100));

    this.dragTarget.element.style.left = `${x}px`;
    this.dragTarget.element.style.top = `${y}px`;
    e.preventDefault();
  }

  endInteraction() {
    this.dragTarget = null;
    this.resizeTarget = null;
  }

  // ------------------------------------------------------------------------
  // WINDOW LAYOUT ACTIONS
  // ------------------------------------------------------------------------
  tileAll() {
    const openWins = Object.values(this.windows).filter(w => w.isOpen && !w.isMinimized);
    if (openWins.length === 0) return;

    if (window.soundSystem) window.soundSystem.playClick();

    const topOffset = 46;
    const bottomOffset = 84;
    const availWidth = window.innerWidth;
    const availHeight = window.innerHeight - topOffset - bottomOffset;

    if (openWins.length === 1) {
      const w = openWins[0];
      w.element.style.left = '40px';
      w.element.style.top = `${topOffset + 20}px`;
      w.element.style.width = `${availWidth - 80}px`;
      w.element.style.height = `${availHeight - 40}px`;
    } else if (openWins.length === 2) {
      const colWidth = (availWidth - 30) / 2;
      openWins[0].element.style.left = '10px';
      openWins[0].element.style.top = `${topOffset + 10}px`;
      openWins[0].element.style.width = `${colWidth}px`;
      openWins[0].element.style.height = `${availHeight - 20}px`;

      openWins[1].element.style.left = `${colWidth + 20}px`;
      openWins[1].element.style.top = `${topOffset + 10}px`;
      openWins[1].element.style.width = `${colWidth}px`;
      openWins[1].element.style.height = `${availHeight - 20}px`;
    } else {
      // 2x2 grid or multi-column
      const cols = openWins.length <= 4 ? 2 : 3;
      const rows = Math.ceil(openWins.length / cols);
      const cellWidth = (availWidth - (cols + 1) * 10) / cols;
      const cellHeight = (availHeight - (rows + 1) * 10) / rows;

      openWins.forEach((w, idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        w.element.style.left = `${10 + c * (cellWidth + 10)}px`;
        w.element.style.top = `${topOffset + 10 + r * (cellHeight + 10)}px`;
        w.element.style.width = `${cellWidth}px`;
        w.element.style.height = `${cellHeight}px`;
      });
    }
  }

  cascadeAll() {
    const openWins = Object.values(this.windows).filter(w => w.isOpen && !w.isMinimized);
    if (openWins.length === 0) return;

    if (window.soundSystem) window.soundSystem.playClick();

    const baseLeft = 60;
    const baseTop = 60;
    const step = 32;

    openWins.forEach((w, idx) => {
      w.element.classList.remove('maximized');
      w.isMaximized = false;
      w.element.style.left = `${baseLeft + (idx % 8) * step}px`;
      w.element.style.top = `${baseTop + (idx % 8) * step}px`;
      w.element.style.width = '700px';
      w.element.style.height = '460px';
      this.focus(w.id);
    });
  }

  minimizeAll() {
    this.goHome(true);
  }

  goHome(playSound = true) {
    // Hide/minimize all open application windows
    Object.values(this.windows).forEach(w => {
      w.isOpen = false;
      w.isMinimized = false;
      w.element.style.display = 'none';
      w.element.classList.remove('opening', 'closing', 'minimized', 'focused');
      this.updateDockState(w.id);
    });

    this.activeWindowId = null;

    // Display main hero landing page
    const heroLanding = document.getElementById('hero-landing');
    if (heroLanding) {
      heroLanding.style.display = 'flex';
      heroLanding.classList.remove('hidden');
    }

    // Update status pill to HOME
    this.updateActivePill('HOME');

    // Update dock indicator for Home
    this.setHomeDockActive(true);

    // Sound feedback if enabled
    if (playSound && window.soundSystem) {
      window.soundSystem.playClick();
    }
  }

  setHomeDockActive(isActive) {
    const homeDock = document.querySelector('.dock-item[data-window-id="home"]');
    if (homeDock) {
      homeDock.classList.toggle('running', isActive);
      homeDock.classList.toggle('active', isActive);
    }
  }

  // ------------------------------------------------------------------------
  // UI SYNC
  // ------------------------------------------------------------------------
  updateDockState(id) {
    if (id === 'home') {
      const isHomeActive = !Object.values(this.windows).some(w => w.isOpen && !w.isMinimized);
      this.setHomeDockActive(isHomeActive);
      return;
    }
    const win = this.windows[id];
    const dockItem = document.querySelector(`.dock-item[data-window-id="${id}"]`);
    if (!dockItem || !win) return;

    dockItem.classList.toggle('running', win.isOpen);
    dockItem.classList.toggle('minimized', win.isMinimized);
    dockItem.classList.toggle('focused', this.activeWindowId === id);
  }

  updateActivePill(title) {
    const label = document.getElementById('active-window-name');
    if (label) {
      label.textContent = title.toUpperCase();
    }
  }
}

window.windowManager = new WindowManager();
