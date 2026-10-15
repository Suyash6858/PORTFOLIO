/* ==========================================================================
   FUTURE OS // PROJECTS CONTROLLER
   Renders asymmetric project cards and handles the expandable
   featured project details modal overlay with smooth transitions,
   keyboard navigation, scroll locking, and event isolation.
   ========================================================================== */

class ProjectsController {
  constructor() {
    this.projects = typeof PROJECTS_DATA !== 'undefined' ? PROJECTS_DATA : [];
    this.gridContainer = document.getElementById('projects-grid');
    this.modalOverlay = document.getElementById('project-modal-overlay');
    this.modalContent = document.getElementById('project-modal-body');
    this.modalCloseBtn = document.getElementById('project-modal-close');
    this.subnavTabs = document.querySelectorAll('#win-projects .subnav-tab');
    this.windowBody = document.querySelector('#win-projects .window-body');
    
    this.activeFilter = 'all';
    this.activeProjectId = null;
    this.savedScrollTop = 0;
    this.lastFocusedCard = null;

    this.init();
  }

  init() {
    if (!this.gridContainer) return;

    // 1. Render all project cards from PROJECTS_DATA
    this.renderCards();

    // 2. Setup category filter tabs
    this.initFilterTabs();

    // 3. Setup modal overlay event listeners
    this.initModalControls();
  }

  /* ------------------------------------------------------------------------
     CARD RENDERING
     ------------------------------------------------------------------------ */
  renderCards() {
    this.gridContainer.innerHTML = '';

    const filtered = this.projects.filter(project => {
      if (this.activeFilter === 'all') return true;
      if (this.activeFilter === 'featured') return !!project.featured;

      const inCategory = (cat) => {
        if (project.category === cat) return true;
        if (Array.isArray(project.categories) && project.categories.includes(cat)) return true;
        return false;
      };

      if (this.activeFilter === 'web') return inCategory('web');
      if (this.activeFilter === 'ai') return inCategory('ai');
      if (this.activeFilter === 'safety') return inCategory('safety');
      return true;
    });

    if (filtered.length === 0) {
      this.gridContainer.innerHTML = `
        <div class="projects-empty-state">
          <span class="empty-icon">⚠</span>
          <p>No project nodes matching active filter criteria.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(project => {
      const cardEl = this.createCardElement(project);
      this.gridContainer.appendChild(cardEl);
    });
  }

  createCardElement(project) {
    const card = document.createElement('article');
    card.className = `project-card ${project.featured ? 'card-featured' : ''} card-${project.statusType}`;
    card.setAttribute('data-project-id', project.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Explore ${project.name}: ${project.tagline}`);

    // Use explicit cardTags if available, else derive from techStack
    let cardTags = [];
    if (project.cardTags && project.cardTags.length > 0) {
      cardTags = project.cardTags;
    } else if (project.techStack) {
      project.techStack.forEach(cat => {
        cat.tags.forEach(t => {
          if (cardTags.length < 4) cardTags.push(t);
        });
      });
    }

    // Context badge (Event for SAJAG) - No team-member names
    let contextBadgeHtml = '';
    if (project.hackathonContext) {
      contextBadgeHtml = `
        <div class="card-context-pill">
          <span class="context-icon">🏆</span>
          <span>${project.hackathonContext}</span>
        </div>
      `;
    }

    // Preview HUD SVG visual based on project type
    const previewSvg = this.generatePreviewSvg(project);

    // Live link pill in card header if available
    const liveLinkHtml = project.liveUrl ? `
      <a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" class="card-live-pill" title="Visit live project in new window" onclick="event.stopPropagation();">
        <span class="pulse-dot-green"></span>
        <span>Visit Live Project ↗</span>
      </a>
    ` : '';

    card.innerHTML = `
      <!-- Card Cyber Header -->
      <div class="project-card-header">
        <div class="card-category-tag">
          <span class="category-indicator"></span>
          <span>${project.categoryLabel}</span>
        </div>
        <div class="card-badges-row">
          ${liveLinkHtml}
          <span class="status-pill status-pill-${project.statusType}">
            <span class="status-dot"></span>
            ${project.status}
          </span>
        </div>
      </div>

      <!-- Visual Preview Viewport -->
      <div class="project-preview-viewport">
        ${previewSvg}
        <div class="preview-sheen" aria-hidden="true"></div>
        <div class="corner-bracket top-left"></div>
        <div class="corner-bracket top-right"></div>
        <div class="corner-bracket bottom-left"></div>
        <div class="corner-bracket bottom-right"></div>
      </div>

      <!-- Card Core Information -->
      <div class="project-card-info">
        <div class="project-heading-group">
          <div class="project-title-row">
            <h3 class="project-name">${project.name}</h3>
            ${project.featured ? '<span class="featured-badge">FEATURED</span>' : ''}
          </div>
          <p class="project-tagline">${project.tagline}</p>
        </div>

        ${contextBadgeHtml}

        <p class="project-description">${project.shortDescription}</p>

        <!-- Tech Stack Tags -->
        <div class="project-tech-tags">
          ${cardTags.map(tag => `<span class="tech-tag">${tag}</span>`).join('')}
        </div>

        <!-- Footer Action -->
        <div class="project-card-footer">
          <div class="card-footer-btns">
            <button type="button" class="explore-btn" tabindex="-1">
              <span>Explore Project</span>
              <svg class="explore-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            ${project.liveUrl ? `
              <a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" class="card-live-cta-btn" title="Visit live project in new tab" onclick="event.stopPropagation();">
                <span>Visit Live Project ↗</span>
              </a>
            ` : ''}
          </div>
          <span class="card-prompt-hint">CLICK TO EXPAND //</span>
        </div>
      </div>
    `;

    // Click & Keyboard triggers to expand (ignoring link clicks)
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      this.lastFocusedCard = card;
      this.openProjectModal(project.id);
    });

    card.addEventListener('keydown', (e) => {
      if (e.target.closest('a')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.lastFocusedCard = card;
        this.openProjectModal(project.id);
      }
    });

    return card;
  }

  /* ------------------------------------------------------------------------
     PREVIEW SVG GENERATOR (FUTURISTIC HUD SCHEMATICS)
     ------------------------------------------------------------------------ */
  generatePreviewSvg(project) {
    if (project.id === 'gyansetu') {
      return `
        <div class="hud-graphic hud-gyansetu">
          <div class="hud-browser-bar">
            <div class="hud-dots">
              <span class="h-dot red"></span>
              <span class="h-dot yellow"></span>
              <span class="h-dot green"></span>
            </div>
            <div class="hud-url-bar">https://gyaan-setu-one.vercel.app/</div>
            <div class="hud-telemetry">DEPLOYED // EDGE</div>
          </div>
          <!-- Real Platform Screenshot with automatic fallback to HUD Canvas -->
          <img src="images/gyansetu-preview.jpg" alt="GyanSetu Web Platform Screenshot" class="card-real-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" onload="this.classList.add('loaded');">
          <div class="hud-browser-canvas">
            <div class="gyansetu-logo-area">
              <div class="gyan-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  <line x1="12" y1="6" x2="16" y2="6"></line>
                  <line x1="12" y1="10" x2="16" y2="10"></line>
                </svg>
              </div>
              <div class="gyan-titles">
                <span class="gyan-title">GyanSetu // Platform</span>
                <span class="gyan-sub">Where Wisdom Meets Ambition</span>
              </div>
            </div>
            <div class="gyan-domain-pills-row">
              <span class="d-pill">💻 Tech</span>
              <span class="d-pill">💰 Finance</span>
              <span class="d-pill">🎨 Arts</span>
              <span class="d-pill">🎵 Music</span>
              <span class="d-pill">🍛 Cooking</span>
            </div>
            <div class="gyan-mockup-grid">
              <div class="mockup-card">
                <div class="m-avatar" style="background:#3b82f6;">RI</div>
                <div class="m-lines"><span class="m-name">Prof. Ramesh (72)</span><span class="m-role">Python &amp; Automation</span></div>
              </div>
              <div class="mockup-card">
                <div class="m-avatar" style="background:#f59e0b;">GP</div>
                <div class="m-lines"><span class="m-name">C.A. Govind (68)</span><span class="m-role">Finance &amp; Taxes</span></div>
              </div>
              <div class="mockup-card">
                <div class="m-avatar" style="background:#a78bfa;">SD</div>
                <div class="m-lines"><span class="m-name">Saraswati Devi (75)</span><span class="m-role">Madhubani Art</span></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (project.id === 'sajag') {
      return `
        <div class="hud-graphic hud-sajag">
          <div class="hud-radar-sweep"></div>
          <!-- Real Prototype Photo with automatic fallback to HUD Schematic -->
          <img src="images/sajag-prototype.jpg" alt="SAJAG Quadruped Hardware Prototype" class="card-real-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" onload="this.classList.add('loaded');">
          <div class="hud-sajag-overlay">
            <div class="sajag-telemetry-top">
              <span>SYS_TELEMETRY: ACTIVE</span>
              <span class="sajag-badge">ROBOTICS · 8× SG90 SERVOS</span>
            </div>
            <div class="sajag-chassis-viz">
              <svg width="150" height="85" viewBox="0 0 150 85" fill="none" stroke="currentColor">
                <!-- Quadruped Chassis Body -->
                <rect x="42" y="22" width="66" height="26" rx="5" stroke="#a78bfa" stroke-width="2" fill="rgba(139, 92, 246, 0.18)"></rect>
                <!-- ESP32-CAM Head Payload -->
                <polygon points="108,27 126,31 126,39 108,43" stroke="#00f0ff" stroke-width="2" fill="rgba(0, 240, 255, 0.3)"></polygon>
                <circle cx="118" cy="35" r="3" fill="#00f0ff"></circle>
                <!-- Ultrasonic Sensor Beams -->
                <path d="M 128 30 A 8 8 0 0 1 128 40" stroke="#38f4ff" stroke-width="1.5" fill="none" stroke-linecap="round"></path>
                <path d="M 133 27 A 14 14 0 0 1 133 43" stroke="rgba(0, 240, 255, 0.6)" stroke-width="1.2" fill="none" stroke-linecap="round"></path>
                <!-- Front Leg 1 (Right): Hip & Knee SG90 Servos -->
                <circle cx="100" cy="46" r="3" fill="#00f0ff"></circle>
                <polyline points="100,46 108,60 118,78" stroke="#00f0ff" stroke-width="2.2" stroke-linecap="round"></polyline>
                <circle cx="108" cy="60" r="2.5" fill="#a78bfa"></circle>
                <!-- Front Leg 2 (Left): Hip & Knee SG90 Servos -->
                <polyline points="92,46 98,58 106,78" stroke="#8b5cf6" stroke-width="1.6" stroke-dasharray="3 2" stroke-linecap="round"></polyline>
                <!-- Rear Leg 1 (Right): Hip & Knee SG90 Servos -->
                <circle cx="50" cy="46" r="3" fill="#00f0ff"></circle>
                <polyline points="50,46 40,60 30,78" stroke="#00f0ff" stroke-width="2.2" stroke-linecap="round"></polyline>
                <circle cx="40" cy="60" r="2.5" fill="#a78bfa"></circle>
                <!-- Rear Leg 2 (Left): Hip & Knee SG90 Servos -->
                <polyline points="58,46 52,58 44,78" stroke="#8b5cf6" stroke-width="1.6" stroke-dasharray="3 2" stroke-linecap="round"></polyline>
                <!-- Ground / Railway Track Plane -->
                <line x1="14" y1="78" x2="136" y2="78" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"></line>
                <!-- Sleeper ties -->
                <line x1="25" y1="78" x2="33" y2="84" stroke="rgba(100, 116, 139, 0.6)" stroke-width="1.5"></line>
                <line x1="55" y1="78" x2="63" y2="84" stroke="rgba(100, 116, 139, 0.6)" stroke-width="1.5"></line>
                <line x1="85" y1="78" x2="93" y2="84" stroke="rgba(100, 116, 139, 0.6)" stroke-width="1.5"></line>
                <line x1="115" y1="78" x2="123" y2="84" stroke="rgba(100, 116, 139, 0.6)" stroke-width="1.5"></line>
                <!-- Sensor indicators on chassis -->
                <rect x="52" y="26" width="12" height="10" rx="2" fill="rgba(245, 158, 11, 0.3)" stroke="#f59e0b" stroke-width="1"></rect>
                <text x="54" y="34" fill="#f59e0b" font-size="6" font-family="monospace">MQ</text>
                <rect x="70" y="26" width="14" height="10" rx="2" fill="rgba(20, 184, 166, 0.3)" stroke="#14b8a6" stroke-width="1"></rect>
                <text x="72" y="34" fill="#2dd4bf" font-size="6" font-family="monospace">IMU</text>
                <!-- HUD Boundary -->
                <rect x="18" y="12" width="114" height="70" stroke="rgba(0, 240, 255, 0.35)" stroke-width="0.8" stroke-dasharray="4 4" fill="none"></rect>
              </svg>
            </div>
            <div class="sajag-telemetry-bottom">
              <span class="t-pill">ORIENTATION: 0.8° NORMAL</span>
              <span class="t-pill">OBSTACLE: 142 CM</span>
              <span class="t-pill">MQ: BASELINE</span>
            </div>
          </div>
        </div>
      `;
    }

    if (project.id === 'travalert') {
      return `
        <div class="hud-graphic hud-travalert">
          <div class="hud-geofence-map">
            <svg width="100%" height="100%" viewBox="0 0 200 110" fill="none">
              <!-- Grid background -->
              <defs>
                <pattern id="grid-pat" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(20, 184, 166, 0.15)" stroke-width="0.8"/>
                </pattern>
              </defs>
              <rect width="200" height="110" fill="url(#grid-pat)" />
              <!-- Safe Zone Perimeter -->
              <polygon points="30,20 110,15 140,55 90,95 25,75" stroke="#14b8a6" stroke-width="1.5" fill="rgba(20, 184, 166, 0.12)" stroke-dasharray="4 3"></polygon>
              <!-- SOS Ping Circle -->
              <circle cx="100" cy="55" r="14" stroke="#f43f5e" stroke-width="1.5" fill="rgba(244, 63, 94, 0.2)"></circle>
              <circle cx="100" cy="55" r="28" stroke="rgba(244, 63, 94, 0.4)" stroke-width="1" stroke-dasharray="2 2"></circle>
              <circle cx="100" cy="55" r="4" fill="#f43f5e"></circle>
              <!-- Tourist Beacon -->
              <circle cx="55" cy="45" r="5" fill="#00f0ff"></circle>
              <circle cx="55" cy="45" r="10" stroke="rgba(0, 240, 255, 0.5)" stroke-width="1"></circle>
              <!-- Geofence Labels -->
              <text x="35" y="32" fill="#2dd4bf" font-size="8" font-family="monospace">SAFE_ZONE // ALPHA</text>
              <text x="105" y="75" fill="#f43f5e" font-size="8" font-family="monospace">SOS_DISPATCH</text>
            </svg>
          </div>
          <div class="travalert-hud-bar">
            <span>GEOFENCE PERIMETER: MONITORED</span>
            <span class="geo-status-tag">DIGITAL ID TOKEN: VERIFIED</span>
          </div>
        </div>
      `;
    }

    return '';
  }

  /* ------------------------------------------------------------------------
     EXPANDED MODAL VIEW
     ------------------------------------------------------------------------ */
  openProjectModal(projectId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project || !this.modalOverlay || !this.modalContent) return;

    this.activeProjectId = projectId;

    if (window.soundSystem) window.soundSystem.playWindowOpen();

    // Save scroll position of gallery body
    if (this.windowBody) {
      this.savedScrollTop = this.windowBody.scrollTop;
      this.windowBody.classList.add('modal-scroll-locked');
    }

    // Populate modal body
    this.renderModalContent(project);

    // Show modal
    this.modalOverlay.classList.add('active');
    this.modalOverlay.setAttribute('aria-hidden', 'false');

    // Focus close button for keyboard users
    setTimeout(() => {
      if (this.modalCloseBtn) this.modalCloseBtn.focus();
    }, 100);
  }

  closeProjectModal() {
    if (!this.modalOverlay) return;

    if (window.soundSystem) window.soundSystem.playWindowClose();

    this.modalOverlay.classList.remove('active');
    this.modalOverlay.setAttribute('aria-hidden', 'true');
    this.activeProjectId = null;

    // Restore gallery scroll
    if (this.windowBody) {
      this.windowBody.classList.remove('modal-scroll-locked');
      this.windowBody.scrollTop = this.savedScrollTop;
    }

    // Restore focus to triggering card
    if (this.lastFocusedCard) {
      this.lastFocusedCard.focus();
    }
  }

  renderModalContent(project) {
    if (project.id === 'sajag') {
      this.renderSajagModalContent(project);
      return;
    }
    if (project.id === 'gyansetu') {
      this.renderGyanSetuModalContent(project);
      return;
    }
    if (project.id === 'travalert') {
      this.renderTravAlertModalContent(project);
      return;
    }

    // Generate Action Links
    let actionButtonsHtml = '';
    if (project.liveUrl) {
      actionButtonsHtml += `
        <a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" class="modal-cta-btn btn-primary" title="Open live project in new browser window">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          <span>Launch Live Application</span>
        </a>
      `;
    }

    if (project.githubUrl) {
      actionButtonsHtml += `
        <a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer" class="modal-cta-btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          <span>View Source Code</span>
        </a>
      `;
    } else {
      actionButtonsHtml += `
        <div class="modal-repo-pill">
          <span class="repo-icon">🔒</span>
          <span>${project.repoNote || 'Source code & blueprints available upon request'}</span>
        </div>
      `;
    }

    // Generate Tech Stack groups
    const techStackHtml = project.techStack.map(group => `
      <div class="modal-tech-group">
        <span class="tech-group-title">${group.category}</span>
        <div class="tech-group-tags">
          ${group.tags.map(t => `<span class="tech-tag modal-tag">${t}</span>`).join('')}
        </div>
      </div>
    `).join('');

    // Generate Key Features
    const keyFeaturesHtml = project.keyFeatures.map((feat, idx) => `
      <li class="modal-feature-item">
        <span class="feature-index">0${idx + 1}</span>
        <p class="feature-text">${feat}</p>
      </li>
    `).join('');

    const previewSvg = this.generatePreviewSvg(project);

    this.modalContent.innerHTML = `
      <!-- Top Cyber Banner -->
      <div class="modal-hero-banner">
        <div class="modal-hero-meta">
          <div class="modal-category-badge">
            <span class="pulse-dot"></span>
            <span>${project.badge}</span>
          </div>
          <span class="modal-status-badge status-pill-${project.statusType}">${project.status}</span>
        </div>

        <h1 class="modal-project-title">${project.name}</h1>
        <p class="modal-project-tagline">${project.tagline}</p>

        <!-- Actions Bar -->
        <div class="modal-actions-bar">
          ${actionButtonsHtml}
        </div>
      </div>

      <!-- Main Visual Media / Demonstration Viewport -->
      <div class="modal-media-container">
        <div class="modal-media-header">
          <span class="media-title">DEMONSTRATION MEDIA // INTERACTIVE VIEWPORT</span>
          <span class="media-node-id">PROJECT_SYS_NODE: ${project.id.toUpperCase()}</span>
        </div>
        <div class="modal-media-canvas">
          ${previewSvg}
        </div>
      </div>

      <!-- 2-Column Structured Information Grid -->
      <div class="modal-info-grid">

        <!-- Column 1: Architecture, Problem & Solution -->
        <div class="modal-info-col">
          <!-- 1. Overview -->
          <section class="modal-section-card">
            <h3 class="section-card-title">
              <span class="title-index">01</span>
              <span>Project Overview</span>
            </h3>
            <p class="section-card-text">${project.overview}</p>
          </section>

          <!-- 2. Problem Statement -->
          <section class="modal-section-card">
            <h3 class="section-card-title">
              <span class="title-index">02</span>
              <span>Problem Statement</span>
            </h3>
            <div class="problem-box">
              <p class="section-card-text">${project.problemStatement}</p>
            </div>
          </section>

          <!-- 3. Proposed Solution -->
          <section class="modal-section-card">
            <h3 class="section-card-title">
              <span class="title-index">03</span>
              <span>Proposed Solution</span>
            </h3>
            <div class="solution-box">
              <p class="section-card-text">${project.proposedSolution}</p>
            </div>
          </section>

          <!-- 4. Key Features -->
          <section class="modal-section-card">
            <h3 class="section-card-title">
              <span class="title-index">04</span>
              <span>Key Features &amp; Capabilities</span>
            </h3>
            <ul class="modal-features-list">
              ${keyFeaturesHtml}
            </ul>
          </section>
        </div>

        <!-- Column 2: Tech Stack, Role, Learnings & Actions -->
        <div class="modal-info-col">
          <!-- 5. Technology Stack -->
          <section class="modal-section-card">
            <h3 class="section-card-title">
              <span class="title-index">05</span>
              <span>Technology Stack</span>
            </h3>
            <div class="modal-tech-stack-container">
              ${techStackHtml}
            </div>
          </section>

          <!-- 6. Role & Contributions -->
          <section class="modal-section-card">
            <h3 class="section-card-title">
              <span class="title-index">06</span>
              <span>My Role &amp; Contributions</span>
            </h3>
            <div class="role-highlight-box">
              <p class="section-card-text">${project.roleAndContributions}</p>
            </div>
          </section>

          <!-- 7. Challenges & Learnings -->
          <section class="modal-section-card">
            <h3 class="section-card-title">
              <span class="title-index">07</span>
              <span>Challenges &amp; Key Learnings</span>
            </h3>
            <p class="section-card-text">${project.challengesAndLearnings}</p>
          </section>
        </div>

      </div>

      <!-- Footer Transmission Strip -->
      <div class="modal-footer-strip">
        <span class="terminal-prompt">&gt; NEXUS_PROJECT_DISPATCH: LOADED COMPLETE</span>
        <button type="button" class="modal-return-btn" id="modal-footer-close-btn">
          <span>Close Specification View</span>
        </button>
      </div>
    `;

    // Connect footer close button
    const footerCloseBtn = this.modalContent.querySelector('#modal-footer-close-btn');
    if (footerCloseBtn) {
      footerCloseBtn.addEventListener('click', () => this.closeProjectModal());
    }
  }

  /* ------------------------------------------------------------------------
     GYANSETU DEDICATED EXPANDED MODAL RENDERER (ALL 10 SLIDES)
     ------------------------------------------------------------------------ */
  renderGyanSetuModalContent(project) {
    // Slide 2: The Challenge points
    const challengePointsHtml = (project.challengePoints || []).map(pt => `
      <li class="modal-feature-item">
        <span class="feature-index">⚠</span>
        <p class="feature-text">${pt}</p>
      </li>
    `).join('');

    // Slide 3: What Is GyanSetu points
    const whatIsPointsHtml = (project.whatIsPoints || []).map((pt, idx) => `
      <li class="modal-feature-item">
        <span class="feature-index">0${idx + 1}</span>
        <p class="feature-text">${pt}</p>
      </li>
    `).join('');

    // Slide 4: How GyanSetu Helps (7 Objectives)
    const objectivesHtml = (project.objectives || []).map((obj, idx) => `
      <div class="sajag-hw-card">
        <span class="hw-category">OBJECTIVE 0${idx + 1}</span>
        <p class="hw-desc" style="color: #ffffff; font-weight: 500;">${obj}</p>
      </div>
    `).join('');

    // Slide 4: Transformative Community & Interaction Cycle
    const cycleHtml = (project.interactionCycle || []).map((step, idx, arr) => `
      <span class="cycle-pill">${step}</span>
      ${idx < arr.length - 1 ? '<span class="cycle-arrow">➔</span>' : ''}
    `).join('');

    // Slide 5: Technology Stack
    const frontendTechHtml = (project.techStackDetails?.frontend || []).map(t => `
      <div class="gyan-tech-card">
        <span class="tech-sub-badge">FRONTEND</span>
        <h4 class="tech-main-name">${t.name}</h4>
        <p class="tech-role-desc">${t.desc}</p>
      </div>
    `).join('');

    const dataTechHtml = (project.techStackDetails?.dataHandling || []).map(t => `
      <div class="gyan-tech-card">
        <span class="tech-sub-badge">DATA HANDLING</span>
        <h4 class="tech-main-name">${t.name}</h4>
        <p class="tech-role-desc">${t.desc}</p>
      </div>
    `).join('');

    const archHighlightsHtml = (project.techStackDetails?.architectureHighlights || []).map(h => `
      <li class="arch-sub-item">
        <span class="sub-bullet">◈</span>
        <span>${h}</span>
      </li>
    `).join('');

    // Slide 6: Website Structure
    const structureHtml = (project.websiteStructure || []).map((s, idx) => `
      <div class="gyan-ux-card">
        <div class="ux-card-header">
          <span class="ux-index">0${idx + 1}</span>
          <h4 class="ux-title">${s.title}</h4>
        </div>
        <p class="ux-desc">${s.desc}</p>
      </div>
    `).join('');

    // Slide 7: UI/UX Principles
    const uiUxHtml = (project.uiUxFeatures || []).map((u, idx) => `
      <div class="gyan-ux-card">
        <div class="ux-card-header">
          <span class="ux-index">0${idx + 1}</span>
          <h4 class="ux-title">${u.title}</h4>
        </div>
        <p class="ux-desc">${u.desc}</p>
      </div>
    `).join('');

    // Slide 8: Navigation Flow Steps
    const navFlowStepsHtml = (project.navigationFlow?.mainPath || []).map(st => `
      <div class="gyan-flow-step">
        <div class="step-top">
          <span class="step-num">${st.step}</span>
        </div>
        <h5 class="step-title">${st.name}</h5>
        <p class="step-desc">${st.desc}</p>
      </div>
    `).join('');

    // Slide 9: Feature Taxonomy Mindmap
    const taxonomyHtml = (project.featureTaxonomy || []).map(tax => {
      let badgeClass = tax.statusType === 'operational' ? 'feat-operational' : (tax.statusType === 'concept' ? 'feat-concept' : 'feat-prototype');
      return `
        <div class="mindmap-branch-card">
          <div class="mindmap-branch-header">
            <h4 class="mindmap-branch-title">${tax.group}</h4>
            <span class="feat-status-badge ${badgeClass}">${tax.status}</span>
          </div>
          <ul class="mindmap-sub-items">
            ${tax.items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `;
    }).join('');

    // Slide 10: Impact
    const impactsHtml = (project.impacts || []).map((imp, idx) => `
      <div class="sajag-hw-card">
        <span class="hw-category">IMPACT 0${idx + 1}</span>
        <h4 class="hw-name">${imp.title}</h4>
        <p class="hw-desc">${imp.desc}</p>
      </div>
    `).join('');

    // Slide 10: Future Scope
    const futureScopeHtml = (project.futureScope || []).map((fs, idx) => `
      <div class="gyan-roadmap-card">
        <div class="rm-top-bar">
          <span class="rm-phase-tag">FUTURE SCOPE 0${idx + 1}</span>
          <span class="rm-status-pill">PLANNED</span>
        </div>
        <h4 class="rm-card-title">${fs.title}</h4>
        <p class="rm-card-desc">${fs.desc}</p>
      </div>
    `).join('');

    this.modalContent.innerHTML = `
      <!-- Top Cyber Banner -->
      <div class="modal-hero-banner">
        <div class="modal-hero-meta">
          <div class="modal-category-badge">
            <span class="pulse-dot"></span>
            <span>${project.badge}</span>
          </div>
          <span class="modal-status-badge status-pill-${project.statusType}">${project.status}</span>
        </div>

        <h1 class="modal-project-title">${project.name}</h1>
        <p class="modal-project-tagline">${project.tagline}</p>

        <!-- Actions Bar -->
        <div class="modal-actions-bar">
          <a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" class="modal-cta-btn btn-primary" title="Visit live project in new tab">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            <span>Visit Live Project ↗</span>
          </a>
          <div class="modal-repo-pill highlight-pill">
            <span class="repo-icon">🌐</span>
            <span>${project.repoNote}</span>
          </div>
        </div>
      </div>

      <!-- Large Visual Demonstration Stage (Interactive Platform Browser Mockup) -->
      <div class="modal-media-container gyan-browser-stage">
        <div class="modal-media-header">
          <div class="media-title-group">
            <span class="media-indicator"></span>
            <span class="media-title">LIVE PLATFORM VIEWPORT // VERCEL EDGE DEPLOYMENT</span>
          </div>
          <div class="browser-address-chip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" class="browser-chip-link">${project.liveUrl}</a>
          </div>
        </div>
        <div class="modal-media-canvas">
          <div class="gyan-photo-frame">
            <div class="gyan-mockup-wrapper">
              ${this.generateGyanSetuDetailedMockup()}
            </div>
          </div>
        </div>
        <!-- Real-Time Platform Telemetry Bar -->
        <div class="gyan-telemetry-bar">
          <div class="tel-item"><span class="dot-green"></span><span>DEPLOYED: VERCEL (GLOBAL EDGE)</span></div>
          <div class="tel-item"><span class="dot-cyan"></span><span>CLIENT: VANILLA JS + LOCALSTORAGE</span></div>
          <div class="tel-item"><span class="dot-violet"></span><span>CATEGORIES: 5 CORE DOMAINS</span></div>
          <div class="tel-item"><span class="dot-amber"></span><span>A11Y: DUAL-GENERATION OPTIMIZED</span></div>
        </div>
      </div>

      <!-- SLIDE 1 — Project Introduction & Live Website -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">01</span>
            <span>Slide 1 — Project Introduction</span>
          </h3>
          <span class="card-header-badge">WEB PROGRAMMING PROJECT</span>
        </div>
        <p class="section-card-text" style="font-size: 14.5px; line-height: 1.6;">${project.overview}</p>
        <div class="overview-live-callout" style="margin-top: 14px;">
          <span class="ol-label">OFFICIAL LIVE WEBSITE:</span>
          <a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" class="ol-link">
            <span>Visit Live Project: ${project.liveUrl}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
        </div>
      </section>

      <!-- SLIDE 2 & SLIDE 3: The Challenge & What Is GyanSetu -->
      <div class="modal-info-grid">
        <!-- Slide 2: The Challenge -->
        <div class="modal-info-col">
          <section class="modal-section-card gyan-problem-panel">
            <div class="section-card-header-row">
              <h3 class="section-card-title">
                <span class="title-index">02</span>
                <span>Slide 2 — The Challenge</span>
              </h3>
              <span class="card-header-badge problem-badge">IDENTIFIED BARRIER</span>
            </div>
            <p class="section-card-text" style="margin-bottom: 12px;">${project.challengeContext}</p>
            <ul class="modal-features-list">
              ${challengePointsHtml}
            </ul>
          </section>
        </div>

        <!-- Slide 3: What Is GyanSetu? -->
        <div class="modal-info-col">
          <section class="modal-section-card gyan-solution-panel">
            <div class="section-card-header-row">
              <h3 class="section-card-title">
                <span class="title-index">03</span>
                <span>Slide 3 — What Is GyanSetu?</span>
              </h3>
              <span class="card-header-badge solution-badge">CORE MISSION</span>
            </div>
            <ul class="modal-features-list" style="margin-bottom: 16px;">
              ${whatIsPointsHtml}
            </ul>
            <div class="solution-box" style="background: rgba(0, 240, 255, 0.08); border-color: rgba(0, 240, 255, 0.35);">
              <p class="section-card-text" style="font-family: var(--font-display); font-style: italic; color: #ffffff;">
                “${project.bridgeQuote}”
              </p>
            </div>
          </section>
        </div>
      </div>

      <!-- SLIDE 4 — How GyanSetu Helps (7 Objectives & Transformative Community) -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">04</span>
            <span>Slide 4 — How GyanSetu Helps</span>
          </h3>
          <span class="card-header-badge">7 PLATFORM OBJECTIVES</span>
        </div>
        <p class="section-card-text sub-intro">Seven foundational objectives driving intergenerational knowledge exchange:</p>
        <div class="sajag-hardware-grid">
          ${objectivesHtml}
        </div>

        <!-- Conceptual Relationship Model: Transformative Community -->
        <div class="gyan-community-model">
          <div class="community-triad">
            <div class="triad-card">
              <div class="triad-title" style="color: var(--cyan-bright);">Senior Citizens</div>
              <p class="triad-desc">Experienced mentors offering life wisdom, culinary arts, craft, music, and professional experience.</p>
            </div>
            <div class="triad-card center-bridge">
              <div class="triad-title" style="color: #ffffff;">Transformative Community</div>
              <p class="triad-desc">GyanSetu Knowledge Bridge enabling mutual respect, generational dialogue, and active learning.</p>
            </div>
            <div class="triad-card">
              <div class="triad-title" style="color: var(--violet-soft);">Learners &amp; Students</div>
              <p class="triad-desc">Students seeking practical guidance, hands-on real-world skills, and personalized mentorship.</p>
            </div>
          </div>
          <div class="interaction-cycle-row">
            <span style="font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); margin-right: 6px;">CORE INTERACTION CYCLE:</span>
            ${cycleHtml}
          </div>
        </div>
      </section>

      <!-- SLIDE 5 — Technology Stack -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">05</span>
            <span>Slide 5 — Technology Stack</span>
          </h3>
          <span class="card-header-badge">FRONTEND &amp; LOCAL DATA</span>
        </div>
        <p class="section-card-text sub-intro">Clean, lightweight client-side architecture with zero external heavy frameworks or backend database dependencies:</p>
        
        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 14px;">
          <h5 style="font-family: var(--font-mono); font-size: 11px; color: var(--cyan-primary); margin: 0; letter-spacing: 0.05em;">FRONTEND DEVELOPMENT</h5>
          <div class="gyan-tech-grid">
            ${frontendTechHtml}
          </div>

          <h5 style="font-family: var(--font-mono); font-size: 11px; color: var(--cyan-primary); margin: 6px 0 0 0; letter-spacing: 0.05em;">DATA HANDLING</h5>
          <div class="gyan-tech-grid">
            ${dataTechHtml}
          </div>

          <div class="solution-box" style="margin-top: 8px;">
            <h5 style="font-family: var(--font-mono); font-size: 11px; color: #ffffff; margin: 0 0 8px 0;">ARCHITECTURE &amp; DESIGN HIGHLIGHTS</h5>
            <ul class="arch-sub-list">
              ${archHighlightsHtml}
            </ul>
          </div>
        </div>
      </section>

      <!-- SLIDE 6 — Website Structure -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">06</span>
            <span>Slide 6 — Website Structure</span>
          </h3>
          <span class="card-header-badge">MODULAR CODEBASE</span>
        </div>
        <p class="section-card-text sub-intro">Structural architectural breakdown of the web application codebase and hosting environment:</p>
        <div class="gyan-ux-grid">
          ${structureHtml}
        </div>
      </section>

      <!-- SLIDE 7 — UI/UX -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">07</span>
            <span>Slide 7 — UI/UX Design</span>
          </h3>
          <span class="card-header-badge">ACCESSIBILITY &amp; ERGONOMICS</span>
        </div>
        <p class="section-card-text sub-intro">User-centric design principles tailored for elderly ease-of-use and intuitive student navigation:</p>
        <div class="gyan-ux-grid">
          ${uiUxHtml}
        </div>
      </section>

      <!-- SLIDE 8 — Navigation Flow -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">08</span>
            <span>Slide 8 — Navigation Flow</span>
          </h3>
          <span class="card-header-badge">END-TO-END USER JOURNEY</span>
        </div>
        <p class="section-card-text sub-intro">Complete step-by-step navigation path through the platform, from first arrival to session conclusion:</p>
        <div class="gyan-flow-container">
          ${navFlowStepsHtml}
        </div>
        <div class="gyan-flow-optional">
          <span class="opt-tag">OPTIONAL PATH</span>
          <p class="opt-desc"><strong>${project.navigationFlow?.optionalPath?.name || 'Become Mentor → Add Skills'}:</strong> ${project.navigationFlow?.optionalPath?.desc || ''}</p>
        </div>
      </section>

      <!-- SLIDE 9 — Features of GyanSetu -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">09</span>
            <span>Slide 9 — Features of GyanSetu</span>
          </h3>
          <span class="card-header-badge">FEATURE TAXONOMY MINDMAP</span>
        </div>
        <p class="section-card-text sub-intro">Comprehensive feature group taxonomy, clearly distinguishing currently implemented functionality from proposed concepts and future plans:</p>
        <div class="gyan-mindmap-grid">
          ${taxonomyHtml}
        </div>
      </section>

      <!-- SLIDE 10 — Impact and Future Scope -->
      <div class="modal-info-grid">
        <!-- Impact -->
        <div class="modal-info-col">
          <section class="modal-section-card">
            <div class="section-card-header-row">
              <h3 class="section-card-title">
                <span class="title-index">10</span>
                <span>Slide 10 — Platform Impact</span>
              </h3>
              <span class="card-header-badge" style="color: #2dd4bf; border-color: rgba(45, 212, 191, 0.3); background: rgba(45, 212, 191, 0.1);">COMMUNITY IMPACT</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
              ${impactsHtml}
            </div>
          </section>
        </div>

        <!-- Future Scope -->
        <div class="modal-info-col">
          <section class="modal-section-card">
            <div class="section-card-header-row">
              <h3 class="section-card-title">
                <span class="title-index">10</span>
                <span>Slide 10 — Future Scope</span>
              </h3>
              <span class="card-header-badge planned-badge">PLANNED EXPANSIONS</span>
            </div>
            <div class="gyan-roadmap-grid" style="grid-template-columns: 1fr; margin-top: 10px;">
              ${futureScopeHtml}
            </div>
          </section>
        </div>
      </div>

      <!-- Footer Transmission Strip -->
      <div class="modal-footer-strip">
        <span class="terminal-prompt">&gt; GYANSETU_SYS_SPEC: VERIFIED // ALL 10 SLIDES LOADED</span>
        <button type="button" class="modal-return-btn" id="modal-footer-close-btn">
          <span>Close Specification View</span>
        </button>
      </div>
    `;

    const footerCloseBtn = this.modalContent.querySelector('#modal-footer-close-btn');
    if (footerCloseBtn) {
      footerCloseBtn.addEventListener('click', () => this.closeProjectModal());
    }
  }

  /* ------------------------------------------------------------------------
     GYANSETU VECTOR INTERACTIVE BROWSER MOCKUP
     ------------------------------------------------------------------------ */
  generateGyanSetuDetailedMockup() {
    return `
      <div class="gyan-browser-window">
        <!-- Browser Top Bar -->
        <div class="gbw-top-bar">
          <div class="gbw-traffic-dots">
            <span class="tdot red"></span>
            <span class="tdot yellow"></span>
            <span class="tdot green"></span>
          </div>
          <div class="gbw-address-box">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span class="address-url">https://gyaan-setu-one.vercel.app/</span>
            <span class="address-ssl">SSL SECURE // EDGE</span>
          </div>
          <div class="gbw-status-badge">DEPLOYED</div>
        </div>

        <!-- Web Content Body -->
        <div class="gbw-content-body">
          <!-- Web Navigation Bar -->
          <div class="gbw-nav">
            <div class="gbw-brand">
              <span class="brand-glyph">GS</span>
              <span class="brand-name">GyanSetu</span>
            </div>
            <div class="gbw-links">
              <span class="nav-item active">Domains</span>
              <span class="nav-item">Courses</span>
              <span class="nav-item">Mentors</span>
              <span class="nav-item">Community</span>
              <span class="nav-cta">Start Learning Free</span>
            </div>
          </div>

          <!-- Hero Section -->
          <div class="gbw-hero">
            <div class="gbw-hero-eyebrow">
              <span class="eyebrow-ping"></span>
              <span>Intergenerational Learning Platform</span>
            </div>
            <h2 class="gbw-hero-headline">
              <span class="gradient-text">Where Wisdom Meets Ambition.</span><br>
              <span class="plain-text">Learn From Those Who Lived It.</span>
            </h2>
            <p class="gbw-hero-sub">Connect with retired professionals, master real-world skills, and share what you know. A platform where experience is the greatest teacher.</p>
            
            <div class="gbw-stats-strip">
              <div class="stat-pill"><span class="stat-v">12,400+</span><span class="stat-l">Active Learners</span></div>
              <div class="stat-pill"><span class="stat-v">480+</span><span class="stat-l">Expert Mentors</span></div>
              <div class="stat-pill"><span class="stat-v">98%</span><span class="stat-l">Satisfaction</span></div>
            </div>
          </div>

          <!-- 5 Curated Domains -->
          <div class="gbw-domains-strip">
            <div class="domains-title">Explore Curated Skill Categories:</div>
            <div class="domains-scroll">
              <div class="domain-badge"><span class="d-icon">🎵</span><span>Music</span></div>
              <div class="domain-badge"><span class="d-icon">🍲</span><span>Cooking</span></div>
              <div class="domain-badge"><span class="d-icon">💻</span><span>Technology</span></div>
              <div class="domain-badge"><span class="d-icon">🗣️</span><span>Communication</span></div>
              <div class="domain-badge"><span class="d-icon">🌱</span><span>Life Guidance</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ------------------------------------------------------------------------
     SAJAG DEDICATED EXPANDED MODAL RENDERER (ALL 8 SECTIONS)
     ------------------------------------------------------------------------ */
  renderSajagModalContent(project) {
    // 03. Technical Approach cards
    const techApproachHtml = (project.technicalApproach || []).map((ta, idx) => `
      <div class="sajag-hw-card">
        <span class="hw-category">APPROACH 0${idx + 1}</span>
        <h4 class="hw-name">${ta.title}</h4>
        <p class="hw-desc">${ta.desc}</p>
      </div>
    `).join('');

    // 04. System Architecture diagram HTML
    const archHtml = `
      <div class="sajag-arch-diagram">
        <!-- Node 1: Hardware Sensors -->
        <div class="arch-node-box">
          <div class="arch-node-header">
            <h4 class="arch-node-title">Hardware Sensors</h4>
            <span class="arch-node-tag">SENSORS</span>
          </div>
          <ul class="arch-sub-list">
            ${(project.architecture?.hardwareSensors || []).map(s => `
              <li class="arch-sub-item">
                <span class="sub-bullet">▸</span>
                <span><strong>${s.name}:</strong> ${s.role}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Flow Arrow -->
        <div class="arch-flow-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </div>

        <!-- Node 2: ESP32 Main Processor -->
        <div class="arch-node-box highlight-processor">
          <div class="arch-node-header">
            <h4 class="arch-node-title">${project.architecture?.mainProcessor?.name || 'ESP32 Main Processor'}</h4>
            <span class="arch-node-tag">CORE MCU</span>
          </div>
          <ul class="arch-sub-list">
            ${(project.architecture?.mainProcessor?.responsibilities || []).map(r => `
              <li class="arch-sub-item">
                <span class="sub-bullet">⚡</span>
                <span>${r}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Flow Arrow -->
        <div class="arch-flow-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </div>

        <!-- Node 3: Wireless Link & Operator Dashboard -->
        <div class="arch-node-box">
          <div class="arch-node-header">
            <h4 class="arch-node-title">Operator Dashboard</h4>
            <span class="arch-node-tag">UI / TELEMETRY</span>
          </div>
          <p style="font-family: var(--font-mono); font-size: 10.5px; color: var(--cyan-primary); margin: 0 0 6px 0;">Link: WebSocket / HTTP</p>
          <ul class="arch-sub-list">
            ${(project.architecture?.operatorDashboard?.elements || []).map(el => `
              <li class="arch-sub-item">
                <span class="sub-bullet">◈</span>
                <span>${el}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

    // 05. Hardware Components (10 verified items)
    const hardwareHtml = (project.hardwareComponents || []).map(hw => `
      <div class="sajag-hw-card">
        <span class="hw-category">${hw.category}</span>
        <h4 class="hw-name">${hw.name}</h4>
        <p class="hw-desc">${hw.desc}</p>
      </div>
    `).join('');

    // 06. Engineering Challenges (5 items)
    const challengesHtml = (project.engineeringChallenges || []).map(ch => `
      <div class="sajag-ch-card">
        <div class="ch-header">
          <span class="ch-num">${ch.num}</span>
          <h4 class="ch-title">${ch.title}</h4>
        </div>
        <p class="ch-desc">${ch.desc}</p>
      </div>
    `).join('');

    // 08. Next Iteration (4 improvements)
    const nextIterationHtml = (project.nextIteration || []).map((it, idx) => `
      <div class="gyan-roadmap-card">
        <div class="rm-top-bar">
          <span class="rm-phase-tag">ITERATION 0${idx + 1}</span>
          <span class="rm-status-pill">PLANNED IMPROVEMENT</span>
        </div>
        <h4 class="rm-card-title">${it.title}</h4>
        <p class="rm-card-desc">${it.desc}</p>
      </div>
    `).join('');

    this.modalContent.innerHTML = `
      <!-- Top Cyber Banner -->
      <div class="modal-hero-banner">
        <div class="modal-hero-meta">
          <div class="modal-category-badge">
            <span class="pulse-dot"></span>
            <span>${project.badge}</span>
          </div>
          <span class="modal-status-badge status-pill-${project.statusType}">${project.status}</span>
        </div>

        <h1 class="modal-project-title">${project.name}</h1>
        <p class="modal-project-tagline">${project.tagline}</p>

        <!-- Hackathon Context Banner -->
        <div class="sajag-hackathon-callout">
          <div class="callout-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="7"></circle>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
          </div>
          <div class="callout-text">
            <span class="callout-title">EVENT DEMONSTRATION // HARDWARE PROOF OF CONCEPT</span>
            <span class="callout-desc">${project.event}</span>
          </div>
        </div>

        <!-- Actions / Blueprint Bar -->
        <div class="modal-actions-bar">
          <div class="modal-repo-pill highlight-pill">
            <span class="repo-icon">📡</span>
            <span>${project.repoNote}</span>
          </div>
        </div>
      </div>

      <!-- Large Visual Prototype Stage (Vector Blueprint Schematic) -->
      <div class="modal-media-container sajag-media-stage">
        <div class="modal-media-header">
          <div class="media-title-group">
            <span class="media-indicator"></span>
            <span class="media-title">PROTOTYPE TECHNICAL BLUEPRINT // HARDWARE SCHEMATIC</span>
          </div>
          <span class="media-node-id">CHASSIS_REV: V1.0-EXP // 8-SERVO QUADRUPED</span>
        </div>
        <div class="modal-media-canvas">
          <div class="sajag-photo-frame">
            <div class="sajag-schematic-wrapper">
              ${this.generateSajagDetailedSchematic()}
            </div>
          </div>
        </div>
        <!-- Real-Time Prototype Telemetry Bar -->
        <div class="sajag-telemetry-bar">
          <div class="tel-item"><span class="dot-green"></span><span>SYS: HARDWARE PROTOTYPE ACTIVE</span></div>
          <div class="tel-item"><span class="dot-cyan"></span><span>MPU6050: 0.0° ROLL / PITCH BALANCED</span></div>
          <div class="tel-item"><span class="dot-amber"></span><span>ULTRASONIC: 142 CM CLEARANCE</span></div>
          <div class="tel-item"><span class="dot-violet"></span><span>MQ SENSORS: BASELINE ANOMALY MONITOR</span></div>
          <div class="tel-item"><span class="dot-cyan"></span><span>PCA9685: 8-CH PWM SYNC</span></div>
        </div>
      </div>

      <!-- 2-Column Grid: 01. Overview & 02. Problem -->
      <div class="modal-info-grid">
        <div class="modal-info-col">
          <!-- 01. Overview -->
          <section class="modal-section-card">
            <div class="section-card-header-row">
              <h3 class="section-card-title">
                <span class="title-index">01</span>
                <span>Overview</span>
              </h3>
              <span class="card-header-badge">REMOTE INSPECTION</span>
            </div>
            <p class="section-card-text">${project.overview}</p>
          </section>
        </div>

        <div class="modal-info-col">
          <!-- 02. Problem -->
          <section class="modal-section-card">
            <div class="section-card-header-row">
              <h3 class="section-card-title">
                <span class="title-index">02</span>
                <span>Problem Statement</span>
              </h3>
              <span class="card-header-badge problem-badge">PERSONNEL EXPOSURE</span>
            </div>
            <div class="problem-box">
              <p class="section-card-text">${project.problemStatement}</p>
            </div>
          </section>
        </div>
      </div>

      <!-- 03. Technical Approach -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">03</span>
            <span>Technical Approach</span>
          </h3>
          <span class="card-header-badge">5 CORE SUBSYSTEMS</span>
        </div>
        <div class="sajag-hardware-grid">
          ${techApproachHtml}
        </div>
      </section>

      <!-- 04. System Architecture Diagram -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">04</span>
            <span>System Architecture</span>
          </h3>
          <span class="card-header-badge">HARDWARE &amp; SOFTWARE FLOW</span>
        </div>
        <p class="section-card-text sub-intro">End-to-end signal flow connecting onboard sensors and motor actuators through the ESP32 and wireless link to the operator browser dashboard:</p>
        ${archHtml}
      </section>

      <!-- 05. Hardware and Technology Stack (10 Components) -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">05</span>
            <span>Hardware and Technology Stack</span>
          </h3>
          <span class="card-header-badge">10 VERIFIED SUBSYSTEMS</span>
        </div>
        <div class="sajag-hardware-grid">
          ${hardwareHtml}
        </div>
      </section>

      <!-- 06. Engineering Challenges (5 Challenges) -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">06</span>
            <span>Engineering Challenges</span>
          </h3>
          <span class="card-header-badge planned-badge">5 TECHNICAL CHALLENGES</span>
        </div>
        <div class="sajag-challenges-grid">
          ${challengesHtml}
        </div>
      </section>

      <!-- 07. Results -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">07</span>
            <span>Results &amp; Demonstration</span>
          </h3>
          <span class="card-header-badge" style="color:#2dd4bf; border-color:rgba(45,212,191,0.3); background:rgba(45,212,191,0.1);">WORKING PROTOTYPE</span>
        </div>
        <div class="solution-box">
          <p class="section-card-text">${project.results}</p>
        </div>
      </section>

      <!-- 08. Next Iteration (4 Improvements) -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">08</span>
            <span>Next Iteration &amp; Roadmap</span>
          </h3>
          <span class="card-header-badge planned-badge">4 ROADMAP PRIORITIES</span>
        </div>
        <div class="gyan-roadmap-grid">
          ${nextIterationHtml}
        </div>
      </section>

      <!-- Safety and Technical Accuracy Disclaimer Panel -->
      <div class="sajag-safety-panel">
        <div class="safety-icon-col">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="safety-text-col">
          <h4 class="safety-heading">SAFETY &amp; TECHNICAL ACCURACY NOTICE</h4>
          <p class="safety-body">${project.safetyDisclaimer}</p>
        </div>
      </div>

      <!-- Footer Transmission Strip -->
      <div class="modal-footer-strip">
        <span class="terminal-prompt">&gt; SAJAG_SYSTEM_SPEC: VERIFIED // JECRC HACKQUEST</span>
        <button type="button" class="modal-return-btn" id="modal-footer-close-btn">
          <span>Close Specification View</span>
        </button>
      </div>
    `;

    const footerCloseBtn = this.modalContent.querySelector('#modal-footer-close-btn');
    if (footerCloseBtn) {
      footerCloseBtn.addEventListener('click', () => this.closeProjectModal());
    }
  }

  /* ------------------------------------------------------------------------
     VECTOR BLUEPRINT SCHEMATIC (SAJAG DETAILED HARDWARE ARCHITECTURE)
     ------------------------------------------------------------------------ */
  generateSajagDetailedSchematic() {
    return `
      <svg class="sajag-detailed-blueprint" viewBox="0 0 760 360" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="bp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 240, 255, 0.07)" stroke-width="0.8"/>
          </pattern>
          <radialGradient id="bp-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(0, 240, 255, 0.12)" />
            <stop offset="100%" stop-color="rgba(0, 240, 255, 0)" />
          </radialGradient>
        </defs>

        <rect width="760" height="360" fill="url(#bp-grid)" rx="8" />
        <circle cx="380" cy="180" r="220" fill="url(#bp-glow)" />

        <!-- Reference Railway Tracks (Ground Plane) -->
        <g opacity="0.35">
          <line x1="80" y1="310" x2="680" y2="310" stroke="#64748b" stroke-width="2" stroke-dasharray="6 4" />
          <line x1="80" y1="324" x2="680" y2="324" stroke="#64748b" stroke-width="2" stroke-dasharray="6 4" />
          <line x1="120" y1="304" x2="120" y2="330" stroke="#475569" stroke-width="2" />
          <line x1="200" y1="304" x2="200" y2="330" stroke="#475569" stroke-width="2" />
          <line x1="280" y1="304" x2="280" y2="330" stroke="#475569" stroke-width="2" />
          <line x1="360" y1="304" x2="360" y2="330" stroke="#475569" stroke-width="2" />
          <line x1="440" y1="304" x2="440" y2="330" stroke="#475569" stroke-width="2" />
          <line x1="520" y1="304" x2="520" y2="330" stroke="#475569" stroke-width="2" />
          <line x1="600" y1="304" x2="600" y2="330" stroke="#475569" stroke-width="2" />
          <text x="640" y="338" fill="#64748b" font-size="8" font-family="monospace">RAILWAY_TRACK_DATUM</text>
        </g>

        <!-- Stance and Dimension Guideline Markers -->
        <g stroke="rgba(0, 240, 255, 0.25)" stroke-width="0.8" stroke-dasharray="2 2">
          <line x1="230" y1="52" x2="530" y2="52" />
          <line x1="230" y1="46" x2="230" y2="58" />
          <line x1="530" y1="46" x2="530" y2="58" />
          <text x="345" y="46" fill="#00f0ff" font-size="8.5" font-family="monospace">CHASSIS SPAN: 210 MM</text>
        </g>

        <!-- Limbs & Kinematics -->
        <g id="limb-fr">
          <circle cx="490" cy="130" r="9" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" stroke-width="1.8" />
          <circle cx="490" cy="130" r="3" fill="#00f0ff" />
          <line x1="490" y1="130" x2="550" y2="90" stroke="#00f0ff" stroke-width="3" stroke-linecap="round" />
          <circle cx="550" cy="90" r="7" fill="rgba(167, 139, 250, 0.3)" stroke="#a78bfa" stroke-width="1.8" />
          <circle cx="550" cy="90" r="2.5" fill="#a78bfa" />
          <line x1="550" y1="90" x2="595" y2="65" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="595" cy="65" r="4" fill="#00f0ff" />
          <text x="620" y="88" fill="#a78bfa" font-size="8" font-family="monospace">FR LEG: 2× SG90 (HIP/KNEE)</text>
        </g>

        <g id="limb-fl">
          <circle cx="490" cy="230" r="9" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" stroke-width="1.8" />
          <circle cx="490" cy="230" r="3" fill="#00f0ff" />
          <line x1="490" y1="230" x2="550" y2="270" stroke="#00f0ff" stroke-width="3" stroke-linecap="round" />
          <circle cx="550" cy="270" r="7" fill="rgba(167, 139, 250, 0.3)" stroke="#a78bfa" stroke-width="1.8" />
          <circle cx="550" cy="270" r="2.5" fill="#a78bfa" />
          <line x1="550" y1="270" x2="595" y2="295" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="595" cy="295" r="4" fill="#00f0ff" />
          <text x="620" y="275" fill="#a78bfa" font-size="8" font-family="monospace">FL LEG: 2× SG90 (HIP/KNEE)</text>
        </g>

        <g id="limb-rr">
          <circle cx="270" cy="130" r="9" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" stroke-width="1.8" />
          <circle cx="270" cy="130" r="3" fill="#00f0ff" />
          <line x1="270" y1="130" x2="210" y2="90" stroke="#00f0ff" stroke-width="3" stroke-linecap="round" />
          <circle cx="210" cy="90" r="7" fill="rgba(167, 139, 250, 0.3)" stroke="#a78bfa" stroke-width="1.8" />
          <circle cx="210" cy="90" r="2.5" fill="#a78bfa" />
          <line x1="210" y1="90" x2="165" y2="65" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="165" cy="65" r="4" fill="#00f0ff" />
          <text x="50" y="88" fill="#a78bfa" font-size="8" font-family="monospace">RR LEG: 2× SG90 (HIP/KNEE)</text>
        </g>

        <g id="limb-rl">
          <circle cx="270" cy="230" r="9" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" stroke-width="1.8" />
          <circle cx="270" cy="230" r="3" fill="#00f0ff" />
          <line x1="270" y1="230" x2="210" y2="270" stroke="#00f0ff" stroke-width="3" stroke-linecap="round" />
          <circle cx="210" cy="270" r="7" fill="rgba(167, 139, 250, 0.3)" stroke="#a78bfa" stroke-width="1.8" />
          <circle cx="210" cy="270" r="2.5" fill="#a78bfa" />
          <line x1="210" y1="270" x2="165" y2="295" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="165" cy="295" r="4" fill="#00f0ff" />
          <text x="50" y="275" fill="#a78bfa" font-size="8" font-family="monospace">RL LEG: 2× SG90 (HIP/KNEE)</text>
        </g>

        <!-- Main Chassis Body -->
        <rect x="250" y="110" width="260" height="140" rx="12" fill="rgba(11, 20, 44, 0.88)" stroke="#00f0ff" stroke-width="2" />
        
        <!-- ESP32 & PCA9685 Modules -->
        <rect x="270" y="130" width="100" height="48" rx="4" fill="rgba(0, 240, 255, 0.12)" stroke="#00f0ff" stroke-width="1.2" />
        <text x="282" y="152" fill="#00f0ff" font-size="9" font-family="monospace" font-weight="bold">ESP32 MCU</text>
        <text x="282" y="165" fill="#94a3b8" font-size="7.5" font-family="monospace">Dual-Core 240MHz</text>

        <rect x="390" y="130" width="100" height="48" rx="4" fill="rgba(167, 139, 250, 0.12)" stroke="#a78bfa" stroke-width="1.2" />
        <text x="402" y="152" fill="#a78bfa" font-size="9" font-family="monospace" font-weight="bold">PCA9685</text>
        <text x="402" y="165" fill="#94a3b8" font-size="7.5" font-family="monospace">16-Ch 12-Bit I2C PWM</text>

        <!-- Sensors & Camera -->
        <rect x="270" y="190" width="65" height="42" rx="4" fill="rgba(20, 184, 166, 0.12)" stroke="#14b8a6" stroke-width="1.2" />
        <text x="278" y="210" fill="#2dd4bf" font-size="8" font-family="monospace" font-weight="bold">MPU6050</text>
        <text x="278" y="222" fill="#94a3b8" font-size="7" font-family="monospace">6-Axis IMU</text>

        <rect x="345" y="190" width="70" height="42" rx="4" fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" stroke-width="1.2" />
        <text x="353" y="210" fill="#f59e0b" font-size="8" font-family="monospace" font-weight="bold">MQ SENSORS</text>
        <text x="353" y="222" fill="#94a3b8" font-size="7" font-family="monospace">Vapour Flags</text>

        <rect x="425" y="190" width="65" height="42" rx="4" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" stroke-width="1.2" />
        <text x="431" y="210" fill="#38bdf8" font-size="8" font-family="monospace" font-weight="bold">ULTRASONIC</text>
        <text x="431" y="222" fill="#94a3b8" font-size="7" font-family="monospace">Distance</text>

        <!-- Camera Head Module -->
        <polygon points="510,165 545,150 545,210 510,195" fill="rgba(0, 240, 255, 0.25)" stroke="#00f0ff" stroke-width="1.8" />
        <circle cx="530" cy="180" r="5" fill="#00f0ff" />
        <text x="555" y="184" fill="#00f0ff" font-size="8.5" font-family="monospace">ESP32-CAM (STREAM)</text>
      </svg>
    `;
  }

  /* ------------------------------------------------------------------------
     TRAVALERT DEDICATED EXPANDED MODAL RENDERER (ALL 11 SLIDES - NO TEAM)
     ------------------------------------------------------------------------ */
  renderTravAlertModalContent(project) {
    // Slide 3: Problem points
    const problemPointsHtml = (project.problemPoints || []).map(pt => `
      <li class="modal-feature-item">
        <span class="feature-index">⚠</span>
        <p class="feature-text">${pt}</p>
      </li>
    `).join('');

    // Slide 4: Solution points
    const solutionPointsHtml = (project.solutionPoints || []).map((pt, idx) => `
      <li class="modal-feature-item">
        <span class="feature-index">0${idx + 1}</span>
        <p class="feature-text">${pt}</p>
      </li>
    `).join('');

    // Slide 5: Discover Our Services (4 core modules)
    const servicesHtml = (project.services || []).map((srv, idx) => `
      <div class="travalert-mod-card mod-mvp">
        <div class="mod-top">
          <span class="mod-index">SERVICE 0${idx + 1}</span>
          <span class="feat-status-badge feat-operational">${srv.tag}</span>
        </div>
        <h4 class="mod-name">${srv.name}</h4>
        <p class="mod-desc">${srv.desc}</p>
      </div>
    `).join('');

    // Slide 6: Business Model Revenue Streams
    const revenueStreamsHtml = (project.businessModel?.revenueStreams || []).map((rs, idx) => `
      <div class="travalert-biz-card">
        <div class="biz-top">
          <span class="biz-pill">REVENUE STREAM 0${idx + 1}</span>
        </div>
        <h4 class="biz-title">${rs.name}</h4>
        <p class="biz-desc">${rs.desc}</p>
      </div>
    `).join('');

    // Slide 6: Target Customers
    const targetCustomersHtml = (project.businessModel?.targetCustomers || []).map(tc => `
      <div class="travalert-market-card">
        <h4 class="tm-title" style="color: var(--cyan-bright);">${tc.name}</h4>
        <p class="tm-desc">${tc.desc}</p>
      </div>
    `).join('');

    // Slide 6: Value Proposition
    const valuePropListHtml = (project.businessModel?.valueProposition || []).map(vp => `
      <li class="arch-sub-item">
        <span class="sub-bullet">✔</span>
        <span>${vp}</span>
      </li>
    `).join('');

    // Slide 6: Key Partners & Cost Structure & Growth Opportunities
    const keyPartnersHtml = (project.businessModel?.keyPartners || []).map(kp => `<li>${kp}</li>`).join('');
    const costStructureHtml = (project.businessModel?.costStructure || []).map(cs => `<li>${cs}</li>`).join('');
    const growthOppHtml = (project.businessModel?.futureGrowthOpportunities || []).map(go => `<li>${go}</li>`).join('');

    // Slide 7: Market Statistics
    const statsHtml = (project.marketAnalysis?.stats || []).map(st => `
      <div class="travalert-stat-card">
        <span class="stat-big-num">${st.value}</span>
        <span class="stat-big-label">${st.label}</span>
        <p class="stat-desc">${st.desc}</p>
      </div>
    `).join('');

    // Slide 7: Major States
    const majorStatesHtml = (project.marketAnalysis?.majorStates || []).map(ms => `
      <div class="state-growth-card">
        <span class="state-name">${ms.state}</span>
        <span class="state-metric">${ms.metric}</span>
      </div>
    `).join('');

    // Slide 8: Competitive Analysis Comparison Matrix
    const competitiveHtml = (project.competitiveAnalysis || []).map(comp => `
      <div class="comp-factor-card">
        <span class="comp-factor-title">${comp.factor}</span>
        <div class="comp-traditional-col">
          <strong style="display:block; margin-bottom:2px; font-size:10px; color:#f87171;">EXISTING APPS</strong>
          ${comp.traditional}
        </div>
        <div class="comp-travalert-col">
          <strong style="display:block; margin-bottom:2px; font-size:10px; color:var(--teal-accent);">TRAVALERT ADVANTAGE</strong>
          ${comp.travalert}
        </div>
      </div>
    `).join('');

    // Slide 9: Traction & Development Roadmap Pipeline
    const tractionStagesHtml = (project.traction?.stages || []).map(st => {
      let isDone = st.statusType === 'completed';
      return `
        <div class="traction-stage-card ${isDone ? 'stage-completed' : 'stage-active'}">
          <div class="stage-header">
            <span class="stage-num">STAGE ${st.num}</span>
            <span class="stage-status-badge ${isDone ? 'badge-done' : 'badge-active'}">${st.status}</span>
          </div>
          <h4 class="stage-title">${st.name}</h4>
          <p class="stage-desc">${st.desc}</p>
        </div>
      `;
    }).join('');

    this.modalContent.innerHTML = `
      <!-- Top Cyber Banner -->
      <div class="modal-hero-banner">
        <div class="modal-hero-meta">
          <div class="modal-category-badge">
            <span class="pulse-dot"></span>
            <span>${project.badge}</span>
          </div>
          <span class="modal-status-badge status-pill-${project.statusType}">${project.status}</span>
        </div>

        <h1 class="modal-project-title">${project.name}</h1>
        <p class="modal-project-tagline">${project.tagline}</p>

        <!-- Development Stage Callout with Micro-Badges -->
        <div class="travalert-mvp-callout">
          <div class="callout-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div class="callout-text">
            <span class="callout-title">SMART TOURISM SAFETY PLATFORM // EDP PRESENTATION</span>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
              ${(project.introBadges || []).map(b => `<span class="cycle-pill" style="font-size: 9.5px; padding: 2px 8px;">${b}</span>`).join('')}
            </div>
          </div>
        </div>

        <!-- Actions / Blueprint Bar -->
        <div class="modal-actions-bar">
          <div class="modal-repo-pill highlight-pill">
            <span class="repo-icon">🛡️</span>
            <span>${project.repoNote}</span>
          </div>
        </div>
      </div>

      <!-- Large Visual Demonstration Stage (Geofence & Safety HUD) -->
      <div class="modal-media-container travalert-media-stage">
        <div class="modal-media-header">
          <div class="media-title-group">
            <span class="media-indicator"></span>
            <span class="media-title">SPATIAL GEOFENCING HUD // REAL-TIME DISPATCH MATRIX</span>
          </div>
          <span class="media-node-id">SEC_LAYER: GEO_FENCE_V2.1 // SOS PROTOCOL</span>
        </div>
        <div class="modal-media-canvas">
          <div class="travalert-schematic-wrapper">
            ${this.generateTravAlertDetailedSchematic()}
          </div>
        </div>
        <div class="travalert-telemetry-bar">
          <div class="tel-item"><span class="dot-green"></span><span>GEOFENCE: MULTI-ZONE PERIMETERS MONITORED</span></div>
          <div class="tel-item"><span class="dot-cyan"></span><span>DIGITAL ID: BLOCKCHAIN ENCRYPTED</span></div>
          <div class="tel-item"><span class="dot-amber"></span><span>SOS DISPATCH: ACTIVE BEACON</span></div>
          <div class="tel-item"><span class="dot-violet"></span><span>NETWORK: HYBRID CLOUD / LOCAL MESH</span></div>
        </div>
      </div>

      <!-- SLIDE 1 & 2: Introduction -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">01</span>
            <span>Slide 1 &amp; 2 — Introduction &amp; Project Description</span>
          </h3>
          <span class="card-header-badge">AI-POWERED PLATFORM</span>
        </div>
        <p class="section-card-text" style="font-size: 14.5px; line-height: 1.6;">${project.overview}</p>
      </section>

      <!-- SLIDE 3 & SLIDE 4: Problem Statement & Solution Provided -->
      <div class="modal-info-grid">
        <!-- Slide 3: Problem Statement -->
        <div class="modal-info-col">
          <section class="modal-section-card">
            <div class="section-card-header-row">
              <h3 class="section-card-title">
                <span class="title-index">02</span>
                <span>Slide 3 — Problem Statement</span>
              </h3>
              <span class="card-header-badge problem-badge">TOURIST SAFETY CHALLENGE</span>
            </div>
            <ul class="modal-features-list">
              ${problemPointsHtml}
            </ul>
          </section>
        </div>

        <!-- Slide 4: Solution Provided -->
        <div class="modal-info-col">
          <section class="modal-section-card">
            <div class="section-card-header-row">
              <h3 class="section-card-title">
                <span class="title-index">03</span>
                <span>Slide 4 — Solution Provided</span>
              </h3>
              <span class="card-header-badge solution-badge">INTEGRATED SAFETY SUITE</span>
            </div>
            <ul class="modal-features-list">
              ${solutionPointsHtml}
            </ul>
          </section>
        </div>
      </div>

      <!-- SLIDE 5: Discover Our Services (4 Core Capabilities) -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">04</span>
            <span>Slide 5 — Discover Our Services</span>
          </h3>
          <span class="card-header-badge">4 CORE MODULES</span>
        </div>
        <p class="section-card-text sub-intro">Intelligent safety, spatial boundary control, tamper-proof identity, and rapid emergency dispatch:</p>
        <div class="travalert-modules-grid">
          ${servicesHtml}
        </div>
      </section>

      <!-- SLIDE 6: Business Model & Ecosystem Canvas -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">05</span>
            <span>Slide 6 — Business Model &amp; Ecosystem</span>
          </h3>
          <span class="card-header-badge">COMMERCIAL ARCHITECTURE</span>
        </div>

        <!-- Value Proposition Box -->
        <div class="travalert-value-prop-box" style="margin-top: 10px;">
          <div class="vp-header">
            <span class="vp-badge">1. VALUE PROPOSITION</span>
          </div>
          <ul class="arch-sub-list" style="margin-top: 6px;">
            ${valuePropListHtml}
          </ul>
        </div>

        <!-- Revenue Streams Grid -->
        <div style="margin-top: 16px;">
          <h4 style="font-family: var(--font-mono); font-size: 11px; color: var(--violet-soft); margin: 0 0 10px 0; letter-spacing: 0.05em;">2. REVENUE STREAMS</h4>
          <div class="travalert-biz-grid" style="margin-top: 0;">
            ${revenueStreamsHtml}
          </div>
        </div>

        <!-- Target Customers Grid -->
        <div style="margin-top: 16px;">
          <h4 style="font-family: var(--font-mono); font-size: 11px; color: var(--cyan-primary); margin: 0 0 10px 0; letter-spacing: 0.05em;">3. TARGET CUSTOMERS</h4>
          <div class="travalert-market-grid" style="margin-top: 0;">
            ${targetCustomersHtml}
          </div>
        </div>

        <!-- 3-Column Box: Key Partners, Cost Structure, Future Growth -->
        <div class="gyan-mindmap-grid" style="margin-top: 16px;">
          <div class="mindmap-branch-card">
            <div class="mindmap-branch-header">
              <h4 class="mindmap-branch-title" style="color: var(--teal-accent);">4. KEY PARTNERS</h4>
            </div>
            <ul class="mindmap-sub-items">
              ${keyPartnersHtml}
            </ul>
          </div>

          <div class="mindmap-branch-card">
            <div class="mindmap-branch-header">
              <h4 class="mindmap-branch-title" style="color: #f87171;">5. COST STRUCTURE</h4>
            </div>
            <ul class="mindmap-sub-items">
              ${costStructureHtml}
            </ul>
          </div>

          <div class="mindmap-branch-card">
            <div class="mindmap-branch-header">
              <h4 class="mindmap-branch-title" style="color: var(--violet-soft);">6. FUTURE GROWTH</h4>
            </div>
            <ul class="mindmap-sub-items">
              ${growthOppHtml}
            </ul>
          </div>
        </div>
      </section>

      <!-- SLIDE 7: Market Analysis (Statistics & State Numbers) -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">06</span>
            <span>Slide 7 — Market Analysis</span>
          </h3>
          <span class="card-header-badge">INDIA TOURISM GROWTH 2024</span>
        </div>
        <p class="section-card-text sub-intro">Official tourism sector statistics reflecting surging international and domestic travel across India:</p>
        <div class="travalert-stats-grid">
          ${statsHtml}
        </div>

        <!-- State Growth Callouts -->
        <div style="margin-top: 16px;">
          <h4 style="font-family: var(--font-mono); font-size: 11px; color: #ffffff; margin: 0 0 10px 0;">MAJOR TOURIST STATES EXPERIENCING REMARKABLE GROWTH:</h4>
          <div class="state-growth-grid">
            ${majorStatesHtml}
          </div>
        </div>
      </section>

      <!-- SLIDE 8: Competitive Analysis -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">07</span>
            <span>Slide 8 — Competitive Analysis</span>
          </h3>
          <span class="card-header-badge">MARKET DIFFERENTIATION</span>
        </div>
        <p class="section-card-text sub-intro">Why existing general travel booking apps fail to provide safety, and how TravAlert solves the gap:</p>
        <div class="competitive-comp-grid">
          ${competitiveHtml}
        </div>
      </section>

      <!-- SLIDE 9: Traction & Development Roadmap -->
      <section class="modal-section-card full-width-card">
        <div class="section-card-header-row">
          <h3 class="section-card-title">
            <span class="title-index">08</span>
            <span>Slide 9 — Traction &amp; Development Stages</span>
          </h3>
          <span class="card-header-badge" style="color: var(--cyan-bright); border-color: rgba(0, 240, 255, 0.3); background: rgba(0, 240, 255, 0.1);">MVP PROGRESSION</span>
        </div>
        <p class="section-card-text">${project.traction?.context || ''}</p>
        <div class="traction-pipeline">
          ${tractionStagesHtml}
        </div>
        <div class="solution-box" style="margin-top: 14px; background: rgba(0, 240, 255, 0.05);">
          <strong style="color: var(--cyan-primary); font-family: var(--font-mono); font-size: 11px;">NEXT STEPS:</strong>
          <span style="color: var(--text-secondary); font-size: 12px; margin-left: 6px;">${project.traction?.nextSteps || ''}</span>
        </div>
      </section>

      <!-- Footer Transmission Strip -->
      <div class="modal-footer-strip">
        <span class="terminal-prompt">&gt; TRAVALERT_SYS_SPEC: VERIFIED // ALL 11 SLIDES LOADED (TEAM DETAILS EXCLUDED)</span>
        <button type="button" class="modal-return-btn" id="modal-footer-close-btn">
          <span>Close Specification View</span>
        </button>
      </div>
    `;

    const footerCloseBtn = this.modalContent.querySelector('#modal-footer-close-btn');
    if (footerCloseBtn) {
      footerCloseBtn.addEventListener('click', () => this.closeProjectModal());
    }
  }

  /* ------------------------------------------------------------------------
     VECTOR BLUEPRINT SCHEMATIC (TRAVALERT SPATIAL GEOFENCING HUD)
     ------------------------------------------------------------------------ */
  generateTravAlertDetailedSchematic() {
    return `
      <svg class="travalert-detailed-blueprint" viewBox="0 0 760 360" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="geo-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(20, 184, 166, 0.1)" stroke-width="0.8"/>
          </pattern>
          <radialGradient id="geo-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(20, 184, 166, 0.15)" />
            <stop offset="100%" stop-color="rgba(20, 184, 166, 0)" />
          </radialGradient>
        </defs>

        <rect width="760" height="360" fill="url(#geo-grid)" rx="8" />
        <circle cx="380" cy="180" r="260" fill="url(#geo-center-glow)" />

        <g opacity="0.3" stroke="#2dd4bf" stroke-width="0.8">
          <circle cx="380" cy="180" r="140" stroke-dasharray="4 6" fill="none" />
          <line x1="380" y1="30" x2="380" y2="330" stroke-dasharray="2 4" />
          <line x1="160" y1="180" x2="600" y2="180" stroke-dasharray="2 4" />
          <text x="385" y="42" fill="#2dd4bf" font-size="9" font-family="monospace">N 26° 55' 12"</text>
          <text x="560" y="175" fill="#2dd4bf" font-size="9" font-family="monospace">E 75° 49' 28"</text>
        </g>

        <!-- Safe Zone Geofence Perimeter -->
        <polygon points="180,70 420,50 560,140 480,310 210,280 140,180" 
                 stroke="#14b8a6" stroke-width="2" fill="rgba(20, 184, 166, 0.08)" stroke-dasharray="8 4" />
        
        <!-- Safe Zone Anchor Nodes -->
        <circle cx="180" cy="70" r="4" fill="#14b8a6" />
        <circle cx="420" cy="50" r="4" fill="#14b8a6" />
        <circle cx="560" cy="140" r="4" fill="#14b8a6" />
        <circle cx="480" cy="310" r="4" fill="#14b8a6" />
        <circle cx="210" cy="280" r="4" fill="#14b8a6" />
        <circle cx="140" cy="180" r="4" fill="#14b8a6" />
        <text x="190" y="85" fill="#2dd4bf" font-size="10" font-family="monospace">SAFE_ZONE // ALPHA_SECTOR [MONITORED]</text>

        <!-- Warning / Restricted Perimeter Sector -->
        <polygon points="560,140 680,110 710,250 580,270 480,310" 
                 stroke="#f43f5e" stroke-width="1.8" fill="rgba(244, 63, 94, 0.08)" stroke-dasharray="5 3" />
        <text x="600" y="200" fill="#f43f5e" font-size="9.5" font-family="monospace">RESTRICTED_ZONE // HIGH_RISK</text>

        <!-- Tourist Active Beacon -->
        <circle cx="310" cy="160" r="6" fill="#00f0ff" />
        <circle cx="310" cy="160" r="16" stroke="rgba(0, 240, 255, 0.6)" stroke-width="1.5" stroke-dasharray="3 3" />
        <circle cx="310" cy="160" r="28" stroke="rgba(0, 240, 255, 0.25)" stroke-width="1" />
        <line x1="310" y1="160" x2="260" y2="120" stroke="rgba(0, 240, 255, 0.5)" stroke-width="1" />
        <text x="200" y="115" fill="#00f0ff" font-size="9" font-family="monospace">TOURIST_ID: #TX-9042 [STATUS: SECURE]</text>

        <!-- SOS Active Incident Beacon -->
        <circle cx="490" cy="190" r="8" fill="#f43f5e" />
        <circle cx="490" cy="190" r="22" stroke="rgba(244, 63, 94, 0.7)" stroke-width="1.5" />
        <circle cx="490" cy="190" r="40" stroke="rgba(244, 63, 94, 0.35)" stroke-width="1" stroke-dasharray="4 4" />
        <line x1="490" y1="190" x2="570" y2="220" stroke="rgba(244, 63, 94, 0.6)" stroke-width="1" />
        <text x="575" y="224" fill="#f43f5e" font-size="9" font-family="monospace">EMERGENCY_SOS // LIVE DISPATCH [ACTIVE]</text>

        <!-- Emergency Responder Vector Path -->
        <polyline points="230,260 360,230 480,195" stroke="#a78bfa" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round" />
        <circle cx="230" cy="260" r="5" fill="#a78bfa" />
        <text x="175" y="275" fill="#a78bfa" font-size="8.5" font-family="monospace">DISPATCH_UNIT_01 (ETA: 4 MIN)</text>

        <!-- Blockchain & Protocol Telemetry Callouts -->
        <g font-family="monospace" font-size="8.5" fill="#64748b">
          <text x="30" y="335">// IDENTITY: BLOCKCHAIN D-ID SHA-256 VERIFIED</text>
          <text x="320" y="335">// PROTOCOL: ZERO-KNOWLEDGE LOCATION PROOF</text>
          <text x="590" y="335">// ENCRYPTION: AES-256-GCM</text>
        </g>
      </svg>
    `;
  }

    initModalControls() {
    // 1. Close button click
    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener('click', () => {
        this.closeProjectModal();
      });
    }

    // 2. Click outside modal box on backdrop
    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        // If clicking on the backdrop itself (not inside the modal container)
        if (e.target === this.modalOverlay) {
          this.closeProjectModal();
        }
      });
    }

    // 3. Global Escape key handling
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalOverlay && this.modalOverlay.classList.contains('active')) {
        e.preventDefault();
        this.closeProjectModal();
      }
    });
  }

  /* ------------------------------------------------------------------------
     FILTER TABS
     ------------------------------------------------------------------------ */
  initFilterTabs() {
    this.subnavTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const filterVal = tab.getAttribute('data-project-filter') || 'all';
        if (this.activeFilter !== filterVal) {
          this.activeFilter = filterVal;
          this.subnavTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.renderCards();
        }
      });
    });
  }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.projectsController = new ProjectsController();
});
