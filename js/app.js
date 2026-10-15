/* ==========================================================================
   FUTURE OS // MAIN APPLICATION CONTROLLER
   - Live Clock & Date
   - Hero Section Action Buttons ("Explore My Work", "Contact Me")
   - Home View Navigation & Window Management
   - Desktop Context Menu & System Controls
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Live Clock & Date
  const clockEl = document.getElementById('top-clock');
  const dateEl = document.getElementById('top-date');

  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    if (clockEl) {
      clockEl.textContent = `${hours}:${minutes}:${seconds}`;
    }

    if (dateEl) {
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const dayName = days[now.getDay()];
      const monthName = months[now.getMonth()];
      const dateNum = String(now.getDate()).padStart(2, '0');
      const year = now.getFullYear();
      dateEl.textContent = `${dayName} ${dateNum} ${monthName} ${year}`;
    }
  }

  setInterval(updateClock, 1000);
  updateClock();

  // 2. Hero Landing Page Action Buttons
  const btnExplore = document.getElementById('hero-btn-explore');
  if (btnExplore) {
    btnExplore.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.soundSystem) window.soundSystem.playClick();
      if (window.windowManager) {
        window.windowManager.open('projects');
      }
    });
  }

  const btnContact = document.getElementById('hero-btn-contact');
  if (btnContact) {
    btnContact.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.soundSystem) window.soundSystem.playClick();
      if (window.windowManager) {
        window.windowManager.open('contact');
      }
    });
  }

  // 3. Return to Home (SUYASH AG. Brand trigger)
  const brandTrigger = document.getElementById('brand-trigger');
  if (brandTrigger) {
    brandTrigger.addEventListener('click', () => {
      if (window.windowManager) {
        window.windowManager.goHome();
      }
    });
  }

  // 4. Right-Click Desktop Context Menu
  const contextMenu = document.getElementById('context-menu');
  const workspace = document.getElementById('workspace');

  if (workspace && contextMenu) {
    workspace.addEventListener('contextmenu', (e) => {
      // If clicking inside an open window, let standard handle
      if (e.target.closest('.os-window')) return;

      e.preventDefault();
      if (window.soundSystem) window.soundSystem.playClick();

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      contextMenu.style.display = 'flex';
      const menuW = contextMenu.offsetWidth || 210;
      const menuH = contextMenu.offsetHeight || 220;

      const posX = mouseX + menuW > window.innerWidth ? window.innerWidth - menuW - 10 : mouseX;
      const posY = mouseY + menuH > window.innerHeight ? window.innerHeight - menuH - 10 : mouseY;

      contextMenu.style.left = `${posX}px`;
      contextMenu.style.top = `${posY}px`;
    });

    document.addEventListener('click', () => hideContextMenu());
    window.addEventListener('resize', () => hideContextMenu());
  }

  function hideContextMenu() {
    if (contextMenu) contextMenu.style.display = 'none';
  }

  // Bind context menu items
  document.querySelectorAll('[data-context-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.contextAction;
      hideContextMenu();

      if (action === 'palette' && window.commandPalette) window.commandPalette.open();
      if (action === 'home' && window.windowManager) window.windowManager.goHome();
      if (action === 'tile' && window.windowManager) window.windowManager.tileAll();
      if (action === 'cascade' && window.windowManager) window.windowManager.cascadeAll();
      if (action === 'minimize-all' && window.windowManager) window.windowManager.goHome();
      if (action === 'toggle-sound' && window.soundSystem) window.soundSystem.toggle();
      if (action === 'toggle-grid' && window.cyberBackground) window.cyberBackground.toggleGrid();
    });
  });

  // 5. Status Bar Buttons
  const cmdPaletteBtn = document.getElementById('cmd-palette-btn');
  if (cmdPaletteBtn) {
    cmdPaletteBtn.addEventListener('click', () => {
      if (window.commandPalette) window.commandPalette.open();
    });
  }

  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      if (window.soundSystem) window.soundSystem.toggle();
    });
  }

  const fullscreenBtn = document.getElementById('fullscreen-btn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      toggleFullScreen();
    });
  }

  // 6. Subnavigation Tabs in Window Headers & About Me Dashboard Navigation
  document.querySelectorAll('.subnav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = tab.closest('.subnav-tabs');
      if (parent) {
        parent.querySelectorAll('.subnav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (window.soundSystem) window.soundSystem.playClick();
      }

      // About Me Dashboard Sub-Navigation
      const dashTab = tab.dataset.dashTab;
      if (dashTab) {
        const dashBody = document.querySelector('#win-about .dash-body');
        if (!dashBody) return;

        if (dashTab === 'all') {
          dashBody.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const targetModule = document.querySelector(`#win-about [data-dash-module="${dashTab}"]`);
          if (targetModule) {
            const targetOffset = targetModule.offsetTop - dashBody.offsetTop - 12;
            dashBody.scrollTo({ top: Math.max(0, targetOffset), behavior: 'smooth' });

            // Trigger futuristic module glow highlight
            targetModule.classList.remove('dash-module-focused');
            void targetModule.offsetWidth; // Force reflow
            targetModule.classList.add('dash-module-focused');
            setTimeout(() => {
              targetModule.classList.remove('dash-module-focused');
            }, 1400);
          }
        }
      }
    });
  });

  // 7. Initial state: Visitors see the Home landing page directly!
  // No floating window is forced open, keeping the hero section clean and prominent.

  // 8. Holographic Energy Pulse Controller for Profile Photo
  const photoFrame = document.getElementById('hero-photo-frame');
  const photoWrapper = document.getElementById('hero-photo-wrapper');
  let isHoloPulsing = false;

  function triggerHoloPulse() {
    if (isHoloPulsing || !photoWrapper) return;
    isHoloPulsing = true;

    // Reset class and force reflow for smooth animation replay
    photoWrapper.classList.remove('pulse-active');
    void photoWrapper.offsetWidth;
    photoWrapper.classList.add('pulse-active');

    // Trigger futuristic synthesized acoustic feedback
    if (window.soundSystem && typeof window.soundSystem.playHoloPulse === 'function') {
      window.soundSystem.playHoloPulse();
    } else if (window.soundSystem) {
      window.soundSystem.playClick();
    }

    // Return to original appearance after 820ms (between 700-900ms)
    setTimeout(() => {
      if (photoWrapper) {
        photoWrapper.classList.remove('pulse-active');
      }
      isHoloPulsing = false;
    }, 820);
  }

  if (photoFrame) {
    photoFrame.addEventListener('click', (e) => {
      e.preventDefault();
      triggerHoloPulse();
    });

    photoFrame.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerHoloPulse();
      }
    });
  }
});
