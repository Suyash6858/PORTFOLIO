/* ==========================================================================
   FUTURE OS // SKILLS DASHBOARD CONTROLLER
   Handles interactive category filtering, "All Skills" selection,
   OS sound system feedback, and cyber telemetry state synchronization.
   ========================================================================== */

class SkillsController {
  constructor() {
    this.container = document.getElementById('win-skills');
    if (!this.container) return;

    this.tabs = this.container.querySelectorAll('[data-skill-filter]');
    this.modules = this.container.querySelectorAll('.skill-module-card');
    this.statusEl = this.container.querySelector('.skills-subnav-status-text');
    this.activeFilter = 'all';

    this.init();
  }

  init() {
    this.initTabs();
    this.initCardInteractions();
  }

  initTabs() {
    this.tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const filterVal = tab.getAttribute('data-skill-filter') || 'all';
        this.setFilter(filterVal);
      });

      tab.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const filterVal = tab.getAttribute('data-skill-filter') || 'all';
          this.setFilter(filterVal);
        }
      });
    });
  }

  setFilter(filterVal) {
    if (this.activeFilter === filterVal && filterVal !== 'all') {
      // Toggle back to all if clicking the same filter
      filterVal = 'all';
    }

    this.activeFilter = filterVal;

    // Futuristic audio feedback
    if (window.soundSystem && typeof window.soundSystem.playClick === 'function') {
      window.soundSystem.playClick();
    }

    // Update Tab UI
    this.tabs.forEach(tab => {
      const tabFilter = tab.getAttribute('data-skill-filter');
      const isActive = tabFilter === filterVal;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Update Modules Visibility & Focus
    let visibleCount = 0;
    this.modules.forEach(module => {
      const category = module.getAttribute('data-category');
      const matches = (filterVal === 'all' || category === filterVal);

      if (matches) {
        visibleCount++;
        module.classList.remove('module-hidden');
        module.classList.remove('module-dimmed');

        if (filterVal !== 'all') {
          module.classList.add('module-focused');
        } else {
          module.classList.remove('module-focused');
        }
      } else {
        module.classList.remove('module-focused');
        // In OS dashboard view, smoothly dim non-matching modules
        // or hide based on layout preference
        module.classList.add('module-dimmed');
      }
    });

    // Update Telemetry Status Badge
    if (this.statusEl) {
      if (filterVal === 'all') {
        this.statusEl.textContent = 'CAPABILITY STACK // 5 MODULES ACTIVE';
      } else {
        const activeTab = Array.from(this.tabs).find(t => t.getAttribute('data-skill-filter') === filterVal);
        const label = activeTab ? activeTab.textContent.trim().toUpperCase() : filterVal.toUpperCase();
        this.statusEl.textContent = `FILTER: ${label} // 1 ACTIVE`;
      }
    }
  }

  initCardInteractions() {
    // Clicking on a card header can quickly filter or focus that category
    this.modules.forEach(module => {
      const header = module.querySelector('.module-header');
      if (header) {
        header.style.cursor = 'pointer';
        header.setAttribute('title', 'Click to filter this skill module');
        header.addEventListener('click', () => {
          const cat = module.getAttribute('data-category');
          if (cat) {
            this.setFilter(cat);
          }
        });
      }
    });
  }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.skillsController = new SkillsController();
});
