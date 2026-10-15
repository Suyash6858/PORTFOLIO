/* ==========================================================================
   FUTURE OS // COMMAND PALETTE (CTRL+K / CMD+K)
   ========================================================================== */

class CommandPalette {
  constructor() {
    this.overlay = document.getElementById('palette-overlay');
    this.input = document.getElementById('palette-input');
    this.resultsContainer = document.getElementById('palette-results');
    this.selectedIndex = 0;
    this.filteredItems = [];

    this.commands = [
      // Sections (Portfolio Sections)
      { id: 'sec-home', type: 'section', category: 'PORTFOLIO SECTIONS', title: 'Home', code: '01 // LANDING', desc: 'Main Landing Page & Holographic Profile', action: () => window.windowManager.goHome(), icon: 'home' },
      { id: 'sec-about', type: 'section', category: 'PORTFOLIO SECTIONS', title: 'About Me', code: '02 // ABOUT ME', windowId: 'about', icon: 'about' },
      { id: 'sec-projects', type: 'section', category: 'PORTFOLIO SECTIONS', title: 'Projects', code: '03 // PROJECTS', windowId: 'projects', icon: 'projects' },
      { id: 'sec-skills', type: 'section', category: 'PORTFOLIO SECTIONS', title: 'Skills', code: '04 // SKILLS', windowId: 'skills', icon: 'skills' },
      { id: 'sec-education', type: 'section', category: 'PORTFOLIO SECTIONS', title: 'Education', code: '05 // EDUCATION', windowId: 'education', icon: 'education' },
      { id: 'sec-contact', type: 'section', category: 'PORTFOLIO SECTIONS', title: 'Contact', code: '06 // CONTACT', windowId: 'contact', icon: 'contact' },

      // System Actions
      { id: 'act-home', type: 'action', category: 'SYSTEM COMMANDS', title: 'Return to Home Page', desc: 'Reveal the Hero Landing section', action: () => window.windowManager.goHome() },
      { id: 'act-tile', type: 'action', category: 'SYSTEM COMMANDS', title: 'Tile Windows', desc: 'Arrange open windows in a grid', action: () => window.windowManager.tileAll() },
      { id: 'act-cascade', type: 'action', category: 'SYSTEM COMMANDS', title: 'Cascade Windows', desc: 'Layer open windows diagonally', action: () => window.windowManager.cascadeAll() },
      { id: 'act-min-all', type: 'action', category: 'SYSTEM COMMANDS', title: 'Minimize All Windows', desc: 'Clear desktop workspace and return Home', action: () => window.windowManager.goHome() },
      { id: 'act-audio', type: 'action', category: 'SYSTEM COMMANDS', title: 'Toggle Audio Feedback', desc: 'Mute/unmute synthesized UI sounds', action: () => window.soundSystem.toggle() },
      { id: 'act-grid', type: 'action', category: 'SYSTEM COMMANDS', title: 'Toggle Cyber Grid', desc: 'Toggle 3D horizon perspective grid', action: () => window.cyberBackground.toggleGrid() },
      { id: 'act-fullscreen', type: 'action', category: 'SYSTEM COMMANDS', title: 'Toggle Fullscreen', desc: 'Enter/exit immersive mode', action: () => toggleFullScreen() }
    ];

    this.init();
  }

  init() {
    if (!this.overlay || !this.input) return;

    // Keyboard Shortcuts: Ctrl+K or Cmd+K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      } else if (this.isOpen()) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.navigate(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.navigate(-1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.executeSelected();
        }
      }
    });

    // Close when clicking outside palette box
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Input filter
    this.input.addEventListener('input', () => {
      this.filter(this.input.value);
    });

    // Initial render
    this.filter('');
  }

  isOpen() {
    return this.overlay.classList.contains('active');
  }

  open() {
    if (window.soundSystem) window.soundSystem.playClick();
    this.overlay.classList.add('active');
    this.input.value = '';
    this.filter('');
    setTimeout(() => this.input.focus(), 50);
  }

  close() {
    this.overlay.classList.remove('active');
  }

  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  filter(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      this.filteredItems = [...this.commands];
    } else {
      this.filteredItems = this.commands.filter(item => {
        return item.title.toLowerCase().includes(q) ||
               (item.code && item.code.toLowerCase().includes(q)) ||
               (item.desc && item.desc.toLowerCase().includes(q));
      });
    }

    this.selectedIndex = 0;
    this.render();
  }

  render() {
    this.resultsContainer.innerHTML = '';

    if (this.filteredItems.length === 0) {
      this.resultsContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-dim); font-family: var(--font-mono); font-size: 12px;">
          NO COMMANDS OR SECTIONS FOUND
        </div>
      `;
      return;
    }

    let lastCategory = '';

    this.filteredItems.forEach((item, index) => {
      if (item.category !== lastCategory) {
        lastCategory = item.category;
        const groupEl = document.createElement('div');
        groupEl.className = 'palette-group-title';
        groupEl.textContent = lastCategory;
        this.resultsContainer.appendChild(groupEl);
      }

      const itemEl = document.createElement('div');
      itemEl.className = `palette-item ${index === this.selectedIndex ? 'active' : ''}`;
      itemEl.dataset.index = index;

      itemEl.innerHTML = `
        <div class="palette-item-left">
          <svg class="palette-item-icon" viewBox="0 0 24 24" stroke-width="2">
            ${item.type === 'section' 
              ? '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>' 
              : '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>'}
          </svg>
          <span class="palette-item-title">${item.title}</span>
          ${item.code ? `<span class="palette-item-desc">${item.code}</span>` : ''}
          ${item.desc ? `<span class="palette-item-desc">${item.desc}</span>` : ''}
        </div>
        <div class="palette-item-action">${item.type === 'section' ? 'OPEN' : 'RUN'}</div>
      `;

      itemEl.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.updateActiveItem();
      });

      itemEl.addEventListener('click', () => {
        this.executeSelected();
      });

      this.resultsContainer.appendChild(itemEl);
    });

    this.scrollToSelected();
  }

  navigate(dir) {
    if (this.filteredItems.length === 0) return;
    this.selectedIndex = (this.selectedIndex + dir + this.filteredItems.length) % this.filteredItems.length;
    this.updateActiveItem();
    this.scrollToSelected();
  }

  updateActiveItem() {
    const items = this.resultsContainer.querySelectorAll('.palette-item');
    items.forEach((el, idx) => {
      el.classList.toggle('active', parseInt(el.dataset.index) === this.selectedIndex);
    });
  }

  scrollToSelected() {
    const activeEl = this.resultsContainer.querySelector('.palette-item.active');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }

  executeSelected() {
    const item = this.filteredItems[this.selectedIndex];
    if (!item) return;

    this.close();

    if (typeof item.action === 'function') {
      item.action();
    } else if (item.windowId === 'home') {
      window.windowManager.goHome();
    } else if (item.type === 'section' && item.windowId) {
      window.windowManager.open(item.windowId);
    }
  }
}

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }
}

window.commandPalette = new CommandPalette();
