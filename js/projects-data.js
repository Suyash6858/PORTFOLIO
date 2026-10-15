/* ==========================================================================
   FUTURE OS // PROJECTS DATA STORE
   Centralized, editable data object powering project cards
   and expanded detail modals in the Projects Command Centre.
   ========================================================================== */

const PROJECTS_DATA = [
  // --------------------------------------------------------------------------
  // 01. SAJAG — FEATURED (AI & ROBOTICS)
  // --------------------------------------------------------------------------
  {
    id: "sajag",
    name: "SAJAG",
    tagline: "Remote First Inspection. Safer Decisions.",
    type: "Railway security quadruped robot proof of concept",
    featured: true, // Only SAJAG is Featured!
    category: "ai",
    categories: ["ai"], // AI & Robotics only
    categoryLabel: "AI & Robotics · Railway Security",
    status: "Working Hardware Prototype",
    statusType: "prototype",
    badge: "FEATURED SYSTEM // AI & ROBOTICS PROTOTYPE",
    event: "JECRC HackQuest, associated with the Smart India Hackathon initiative",
    hackathonContext: "JECRC HackQuest, associated with the Smart India Hackathon initiative",
    shortDescription: "A proof-of-concept quadruped robot designed to assist security personnel in inspecting potentially hazardous or suspicious areas remotely, without placing people in direct contact with an unknown situation.",
    cardTags: ["ESP32", "C++", "Quadruped", "Live Stream"],
    liveUrl: null, // Working hardware prototype
    githubUrl: null,
    repoNote: "Hardware schematics, C++ Arduino firmware & operator dashboard code available on request",

    // 01 — Overview
    overview: "SAJAG is a proof-of-concept quadruped robot designed to assist security personnel in inspecting potentially hazardous or suspicious areas remotely, without placing people in direct contact with an unknown situation. The robot can walk, stop, wave, and perform simple gestures on command. It streams a live camera feed, reports orientation data, monitors anomalous vapour conditions, and detects obstacles in front of it. These capabilities are accessible through a browser-based operator dashboard.",

    // 02 — Problem
    problemStatement: "Railway security personnel sometimes need to approach areas such as dark carriages, under-platform spaces, and abandoned equipment, where a visual or sensor scan could be safer than immediate physical presence. A small, remotely controlled robot carrying a camera and a basic sensor array could reduce personnel exposure during preliminary inspection. SAJAG is an exploratory student prototype demonstrating a hardware-and-software proof of concept, not a completed railway security deployment.",

    // 03 — Technical Approach
    technicalApproach: [
      {
        title: "Quadruped Locomotion",
        desc: "Four legs, each with hip and knee joints powered by eight SG90 servo motors (two per leg). A PCA9685 I2C servo driver coordinates the eight servos without exhausting the ESP32's PWM resources. Movement sequences are command-driven: WALK, STOP, HI, and DANCE."
      },
      {
        title: "Orientation and Obstacle Awareness",
        desc: "An MPU6050 6-axis IMU provides continuous real-time orientation and tilt readings to detect balance anomalies. An ultrasonic acoustic sensor provides forward obstacle-distance measurements to assist navigation."
      },
      {
        title: "Atmospheric Anomaly Monitoring",
        desc: "MQ-series gas/vapour sensors flag anomalous atmospheric readings for human review. These sensors cannot reliably identify specific substances, functioning strictly as preliminary anomaly indicators (never claimed as confirmed narcotics, explosives, or chemical identification)."
      },
      {
        title: "Visual Monitoring",
        desc: "An onboard ESP32-CAM module streams live video directly to the operator interface, providing first-person situational awareness into confined or unlit railway spaces."
      },
      {
        title: "Wireless Operation",
        desc: "Sensor telemetry and motor commands travel over a low-latency wireless link (WebSocket / HTTP) between the onboard ESP32 and the browser dashboard."
      }
    ],

    // 04 — System Architecture
    architecture: {
      hardwareSensors: [
        { name: "MPU6050 (I2C)", role: "Orientation and tilt telemetry" },
        { name: "Ultrasonic Sensor", role: "Forward obstacle distance measurements" },
        { name: "MQ-Series Sensors", role: "Gas/vapour atmospheric anomaly flags" },
        { name: "ESP32-CAM", role: "Live video stream to operator dashboard" }
      ],
      mainProcessor: {
        name: "ESP32 Main Processor",
        responsibilities: [
          "Reads incoming sensor data across I2C and analog/digital pins",
          "Drives the PCA9685 16-channel servo driver over I2C",
          "Controls eight SG90 servo motors across four articulated limbs",
          "Parses gait commands and choreographed motor sequences",
          "Executes command routines: WALK, STOP, HI (wave), and DANCE"
        ]
      },
      wirelessLink: {
        name: "Wireless Communication Link",
        role: "Connects the robot to the operator's browser dashboard using lightweight WebSocket / HTTP transmission for commands and telemetry."
      },
      operatorDashboard: {
        name: "Operator Browser Dashboard",
        elements: [
          "Live camera feed perspective",
          "IMU / orientation and tilt readings",
          "Obstacle-distance clearance readouts",
          "Vapour / gas anomaly sensor status",
          "Choreographed command buttons (WALK, STOP, HI, DANCE)",
          "Real-time robot connectivity status display"
        ]
      }
    },

    // 05 — Hardware and Technology Stack (All 10 verified components)
    hardwareComponents: [
      { name: "ESP32", category: "Microcontroller", desc: "Dual-core main processor managing sensor polling, I2C coordination, and wireless telemetry." },
      { name: "ESP32-CAM", category: "Visual Monitoring", desc: "Dedicated camera module streaming live visual video feed to the operator interface." },
      { name: "PCA9685 Servo Driver", category: "Actuation Interface", desc: "16-channel 12-bit PWM driver communicating via I2C to control eight servos without exhausting MCU resources." },
      { name: "Eight SG90 Servo Motors", category: "Robotic Limbs", desc: "Two servos per leg operating hip and knee kinematics across four articulated quadruped limbs." },
      { name: "MPU6050 IMU", category: "Orientation & Tilt", desc: "6-axis accelerometer and gyroscope providing real-time tilt, roll, and pitch telemetry." },
      { name: "Ultrasonic Sensor", category: "Obstacle Distance", desc: "Acoustic distance sensor monitoring the forward path for obstacle clearance." },
      { name: "MQ-Series Sensors", category: "Atmospheric Anomaly", desc: "Preliminary gas and vapour anomaly sensors flagging abnormal readings for human evaluation." },
      { name: "C++ (Arduino Framework)", category: "Firmware Software", desc: "Modular, timer-efficient C++ code driving joint kinematics, servo choreography, and sensor sampling." },
      { name: "Wireless Communication", category: "Data Transmission", desc: "Wireless communication link transmitting sensor telemetry and receiving motor commands via WebSocket/HTTP." },
      { name: "Regulated Battery Power", category: "Power Subsystem", desc: "Dedicated regulated power distribution rails ensuring stable voltage isolation for servos, MCU, and camera." }
    ],

    // 06 — Engineering Challenges (All 5 items)
    engineeringChallenges: [
      {
        num: "01",
        title: "Quadruped Gait Stability",
        desc: "Creating stable quadruped gait sequences that prevent the robot from toppling under battery load and dynamic center-of-mass shifts."
      },
      {
        num: "02",
        title: "I2C Communication & Polling Rates",
        desc: "Managing I2C communication and polling rates smoothly between the MPU6050 IMU and PCA9685 driver without frame drops or timing jitter."
      },
      {
        num: "03",
        title: "Wireless Latency Optimization",
        desc: "Keeping wireless latency low enough for meaningful operator control and responsive command dispatch in congested RF environments."
      },
      {
        num: "04",
        title: "Multi-Rail Regulated Power Isolation",
        desc: "Powering eight loaded servo motors, multiple sensor modules, the ESP32 microcontroller, and the camera through a stable regulated supply to avoid brownouts."
      },
      {
        num: "05",
        title: "Accurate Sensor Data Presentation",
        desc: "Presenting vapour and environmental readings accurately without overstating what non-specific MQ-series sensors can detect."
      }
    ],

    // 07 — Results
    results: "SAJAG is a working hardware prototype that walks, stops, waves, and dances on command from a browser dashboard. It streams a live camera feed and displays IMU, obstacle, and vapour-sensor readings in real time. The prototype was built and demonstrated at JECRC HackQuest, associated with the Smart India Hackathon initiative. Note: SAJAG is an exploratory student prototype demonstrating hardware-and-software proof of concept; it does not claim autonomous railway patrols, validated hazardous-substance identification, or operational field deployment.",

    // 08 — Next Iteration (All 4 improvements)
    nextIteration: [
      { title: "Robust Gait Control", desc: "More robust gait control algorithms adapted for uneven surfaces, ballast stone, and inclines." },
      { title: "Expanded Range & Low Latency", desc: "Improved wireless range and lower-latency video streaming using optimized compression protocols." },
      { title: "Advanced Power Management", desc: "Better onboard power management, telemetry monitoring, and low-battery protection circuits." },
      { title: "Structured Operator Interface", desc: "A more structured operator interface with sensor-history graphs, 3D attitude visualization, and incident logging." }
    ],

    safetyDisclaimer: "SAFETY & TECHNICAL ACCURACY NOTE: SAJAG is an exploratory student proof-of-concept prototype built and demonstrated at JECRC HackQuest (part of the Smart India Hackathon initiative). The onboard MQ-series sensors function as preliminary anomaly indicators for operator review and do not claim verified narcotics or explosives detection, autonomous patrols, or certified deployment in operational railway environments."
  },

  // --------------------------------------------------------------------------
  // 02. GYANSETU — WEB SYSTEMS
  // --------------------------------------------------------------------------
  {
    id: "gyansetu",
    name: "GyanSetu",
    tagline: "Bridging Knowledge Across Generations.",
    category: "web",
    categories: ["web"], // Web Systems only, plus All Projects
    categoryLabel: "Web Systems · Intergenerational Learning",
    status: "Deployed Web Platform",
    statusType: "live",
    featured: false, // NOT featured
    badge: "WEB SYSTEMS // DEPLOYED PLATFORM",
    shortDescription: "GyanSetu is a web platform connecting seniors with learners to share skills and knowledge through a simple, accessible interface, promoting intergenerational learning and community engagement.",
    cardTags: ["HTML5", "CSS3", "JavaScript", "LocalStorage", "Vercel"],
    liveUrl: "https://gyaan-setu-one.vercel.app/",
    githubUrl: null,
    repoNote: "Deployed on Vercel Edge · Platform architecture available upon request",
    ctaLabel: "Visit Live Project",

    // Slide 1 — Project Introduction
    overview: "GyanSetu is a web platform connecting seniors with learners to share skills and knowledge through a simple, accessible interface, promoting intergenerational learning and community engagement.",

    // Slide 2 — The Challenge
    challengeContext: "In today’s world, many senior citizens have valuable knowledge and life skills, but they lack a digital platform to share them. At the same time, students and learners are searching for practical skills, guidance, and real-world experience.",
    challengePoints: [
      "Generation gap between seniors and students.",
      "Low digital awareness among senior citizens.",
      "Difficulty in using complex websites and applications.",
      "No centralized platform for skill sharing.",
      "Trust issues between users and mentors.",
      "Limited accessibility and user-friendly design.",
      "Valuable knowledge remains unused."
    ],

    // Slide 3 — What Is GyanSetu?
    whatIsPoints: [
      "A web-based platform designed to connect learners with experienced senior mentors.",
      "A simple, user-friendly interface where users can easily explore and share skills.",
      "Learners can browse different skills and send requests to mentors for guidance.",
      "Mentors can create profiles and offer their knowledge in various fields such as cooking, music, or life skills.",
      "The platform ensures smooth interaction through a structured request-and-response system."
    ],
    bridgeQuote: "GyanSetu acts as a bridge between generations, enabling effective knowledge sharing and community learning.",

    // Slide 4 — How GyanSetu Helps (7 Objectives & Conceptual Model)
    objectives: [
      "Develop a user-friendly web platform for skill sharing.",
      "Connect learners with experienced senior mentors.",
      "Promote knowledge exchange between generations.",
      "Make learning accessible and interactive.",
      "Encourage sharing of real-life skills and experiences.",
      "Build a simple and reliable communication system.",
      "Utilize valuable knowledge that often remains unused."
    ],
    interactionCycle: ["DISCOVER", "REQUEST", "FEEDBACK", "REPUTATION"],

    // Slide 5 — Technology Stack
    techStackDetails: {
      frontend: [
        { name: "HTML5", desc: "Structure of the website, semantic elements, and accessible content organization." },
        { name: "CSS3", desc: "Styling, layout, soft color palette, and responsive design across viewports." },
        { name: "Vanilla JavaScript", desc: "Interactivity, DOM manipulation, dynamic rendering, and client-side logic." }
      ],
      dataHandling: [
        { name: "LocalStorage", desc: "Client-side storage used to store and manage user-added skills and preferences." },
        { name: "Dynamic Rendering", desc: "Dynamic rendering of content and data arrays using pure JavaScript." }
      ],
      architectureHighlights: [
        "Web-based application with no external client framework required.",
        "Lightweight architecture for rapid page loads and minimal overhead.",
        "Beginner-friendly and accessible design tailored for senior users.",
        "Soft color palette and high visual contrast.",
        "No backend framework or external database required."
      ]
    },

    // Slide 6 — Website Structure
    websiteStructure: [
      {
        title: "Structured Hero Section (HTML)",
        desc: "Designed a clean and engaging hero section with heading, subtitle, and call-to-action buttons like “Explore Skills” and “Become a Mentor”."
      },
      {
        title: "Semantic & Organized Layout",
        desc: "Used proper HTML tags (section, div, h1, p) and clean class naming to keep the code readable, modular, and easy to maintain."
      },
      {
        title: "Responsive Design using CSS Flexbox",
        desc: "Applied display: flex and alignment properties to ensure the layout adapts smoothly across desktop, tablet, and mobile devices."
      },
      {
        title: "Dynamic Data with JavaScript",
        desc: "Created dynamic arrays for categories, mentors, and testimonials to manage and display platform content without hardcoded repetition."
      },
      {
        title: "Deployment & Hosting on Vercel",
        desc: "Successfully deployed on Vercel for fast performance, secure hosting, and reliable accessibility across devices with global edge distribution."
      },
      {
        title: "Scalable & Maintainable Code",
        desc: "Separated HTML, CSS, and JS into distinct files, making the project structured, modular, and easy to expand in the future."
      }
    ],

    // Slide 7 — UI/UX
    uiUxFeatures: [
      {
        title: "User-Centric Design",
        desc: "Thoughtfully crafted to cater to two distinct generations: senior citizens seeking simplicity and younger learners seeking clear guidance."
      },
      {
        title: "Simple Navigation",
        desc: "Intuitive, shallow navigation paths with minimal complexity, avoiding hidden dropdowns or confusing multi-level menus."
      },
      {
        title: "Large Fonts & Readable Layout",
        desc: "High-contrast typography, generous line-heights, and clear visual hierarchy optimized for maximum accessibility and readability."
      }
    ],

    // Slide 8 — Navigation Flow
    navigationFlow: {
      mainPath: [
        { step: "01", name: "START / Home Page", desc: "User arrives on the home page and explores the platform overview." },
        { step: "02", name: "Explore Categories", desc: "User browses different mentorship categories (Music, Cooking, Tech, etc.)." },
        { step: "03", name: "Select Mentor", desc: "User filters and chooses an experienced senior mentor from the curated list." },
        { step: "04", name: "View Profile", desc: "User views the mentor's detailed profile, background, and offered skills." },
        { step: "05", name: "Access Account", desc: "If not logged in, user registers or signs in to proceed with booking." },
        { step: "06", name: "Book Session", desc: "User schedules a learning interaction and submits a guidance request." },
        { step: "07", name: "Learning Session", desc: "User participates in the knowledge-sharing engagement with the mentor." },
        { step: "08", name: "Feedback & Rating", desc: "User shares feedback, submits a rating, and records session outcomes." },
        { step: "09", name: "END / Completed", desc: "User completes the learning cycle with acquired practical knowledge." }
      ],
      optionalPath: {
        name: "Become Mentor → Add Skills",
        desc: "Seniors can sign up as mentors to list their practical skills, setup availability, and start mentoring."
      }
    },

    // Slide 9 — Features of GyanSetu (All 8 feature groups with implemented vs proposed status)
    featureTaxonomy: [
      {
        group: "Account Creation",
        status: "Implemented",
        statusType: "operational",
        items: ["User Registration", "Profile Setup"]
      },
      {
        group: "Skill Categories",
        status: "Implemented",
        statusType: "operational",
        items: ["Music", "Cooking", "Technology", "Communication Skills", "Life Guidance"]
      },
      {
        group: "Mentor Connection",
        status: "Implemented",
        statusType: "operational",
        items: ["Mentor connections across all listed skill categories", "Structured request-and-response workflow"]
      },
      {
        group: "Community Engagement",
        status: "Implemented / Concept",
        statusType: "operational",
        items: ["Mentorship (Implemented)", "Gamified Rewards (Proposed)", "AI Assistance (Proposed)", "Certifications (Proposed)"]
      },
      {
        group: "GyanSetu Currency",
        status: "Proposed Concept",
        statusType: "concept",
        items: ["Points Collection", "Badge Unlocking", "Achievement Gain"]
      },
      {
        group: "Digital Certifications",
        status: "Proposed Concept",
        statusType: "concept",
        items: ["Course Completion Badges", "Session Completion Certificates"]
      },
      {
        group: "AI Chatbot",
        status: "Proposed / Under Development",
        statusType: "prototype",
        items: ["Platform Navigation Support", "Doubt Resolution", "Mentor & Skill Recommendations"]
      },
      {
        group: "Live Sessions",
        status: "Proposed Concept",
        statusType: "concept",
        items: ["Live Virtual Sessions", "Interactive Real-Time Learning"]
      }
    ],

    // Slide 10 — Impact and Future Scope
    impacts: [
      {
        title: "Bridges Generation Gap",
        desc: "Connects senior citizens with younger learners, building mutual respect, empathy, and shared perspectives."
      },
      {
        title: "Empowers Senior Citizens",
        desc: "Provides seniors with a renewed sense of purpose, active community engagement, and appreciation for their life achievements."
      },
      {
        title: "Promotes Practical Learning",
        desc: "Fosters hands-on, experience-based skill acquisition that complements academic study with real-world wisdom."
      },
      {
        title: "Encourages Community Building",
        desc: "Strengthens intergenerational social bonds, combats isolation among seniors, and builds supportive learning communities."
      }
    ],
    futureScope: [
      { title: "Demonstration Classes", desc: "Interactive demo sessions allowing learners to preview topics before committing." },
      { title: "Mobile Application", desc: "A dedicated mobile app for smartphones to enable convenient on-the-go interactions." },
      { title: "Learning Roadmaps", desc: "Structured, milestone-based step-by-step roadmaps for mastering complex skills." },
      { title: "Greater Community Involvement", desc: "Expanding outreach through community centers, local elder clubs, and university student chapters." }
    ]
  },

  // --------------------------------------------------------------------------
  // 03. TRAVALERT — WEB SYSTEMS & SAFETY / GEOTECH
  // --------------------------------------------------------------------------
  {
    id: "travalert",
    name: "TravAlert",
    tagline: "Explore Freely. Travel Fearlessly.",
    featured: false, // NOT featured
    category: "safety",
    categories: ["web", "safety"], // Web Systems AND Safety & GeoTech
    categoryLabel: "Safety & GeoTech · Web Systems",
    status: "MVP Under Development",
    statusType: "concept",
    badge: "SAFETY & GEOTECH // WEB SYSTEMS MVP",
    shortDescription: "TravAlert is an AI-powered tourist safety platform designed to provide real-time monitoring and instant emergency assistance for travelers using geo-fencing, live location tracking, and blockchain-based digital identity verification.",
    cardTags: ["AI Threat Detection", "Geo-Fencing", "Blockchain ID", "Emergency SOS"],
    liveUrl: null, // MVP under development
    githubUrl: null,
    repoNote: "MVP architectural specifications & safety protocol designs available on request",

    // Slide 1 & 2 — Introduction
    overview: "TravAlert is an AI-powered tourist safety platform designed to provide real-time monitoring and instant emergency assistance for travelers. The system uses geo-fencing and live location tracking to detect unsafe situations and send immediate alerts to authorities and emergency contacts. By integrating blockchain-based identity verification, TravAlert ensures secure data handling, reliable protection, and a safer travel experience.",
    introBadges: ["AI-Powered", "Geo-Fencing", "Blockchain Secured", "Real-Time Protection"],

    // Slide 3 — Problem Statement (All 7 points)
    problemPoints: [
      "Tourism is growing rapidly, increasing the number of travelers visiting unfamiliar locations.",
      "Tourists face safety risks such as theft, unsafe zones, scams, and medical emergencies.",
      "Existing tourism safety systems lack real-time monitoring and quick emergency response.",
      "Delayed communication with authorities can worsen emergency situations.",
      "Travelers often struggle with communication barriers in unknown regions.",
      "Traditional identity verification systems are not secure and are vulnerable to data misuse or tampering.",
      "There is a need for a smart and secure system that can ensure tourist safety, provide emergency support, and protect personal data."
    ],

    // Slide 4 — Solution Provided (All 9 points)
    solutionPoints: [
      "A smart tourism safety platform powered by AI, Geo-Fencing, and Blockchain technology.",
      "Provides tourists with a secure blockchain-based digital identity.",
      "Verified personal and emergency information is stored safely with tamper-proof security.",
      "Geo-fencing continuously monitors tourist locations and detects unsafe or restricted areas.",
      "Instant alerts are sent when tourists enter potentially risky zones.",
      "AI-driven monitoring analyzes activities in real time to identify unusual behavior and possible threats.",
      "Integrated SOS feature instantly shares live location and emergency details with nearby authorities and emergency contacts.",
      "Faster emergency response and better coordination improve tourist safety.",
      "Combines advanced technologies to create a safer, smarter, and more reliable travel experience."
    ],

    // Slide 5 — Discover Our Services (4 Core Modules)
    services: [
      {
        name: "AI-Based Threat Detection",
        tag: "Intelligent Monitoring",
        desc: "Detects unusual activities and possible threats in real time using AI monitoring to identify concerning patterns before escalation."
      },
      {
        name: "Geo-Fencing Safety Alerts",
        tag: "Spatial Boundary Protection",
        desc: "Sends instant automated alerts when tourists cross boundaries into unsafe, high-risk, or restricted sectors."
      },
      {
        name: "Blockchain Digital ID",
        tag: "Tamper-Proof Verification",
        desc: "Provides secure, tamper-proof storage of tourist identity and emergency information, preventing identity fraud and data misuse."
      },
      {
        name: "Instant SOS & Live Location Sharing",
        tag: "Rapid Emergency Dispatch",
        desc: "Shares live GPS coordinates and emergency details instantly with local authorities, emergency contacts, and medical units for fast response."
      }
    ],

    // Slide 6 — Business Model (Comprehensive Canvas)
    businessModel: {
      valueProposition: [
        "Real-time safety monitoring for tourists",
        "Secure blockchain-based digital identity",
        "Instant alerts for unsafe or restricted zones",
        "AI detects unusual activity and potential threats",
        "Quick emergency response with SOS integration",
        "Safer, smarter, and more reliable travel experience"
      ],
      revenueStreams: [
        { name: "Premium Subscription Plans", desc: "Advanced features and customized safety options for individual travelers and families." },
        { name: "Partnerships with Hotels & Travel Agencies", desc: "B2B integration licenses and bulk tourist safety packages bundled into bookings." },
        { name: "Government Tourism & Smart City Projects", desc: "Public sector enterprise solutions for citywide tourist monitoring and emergency dispatch coordination." },
        { name: "In-App Advertisements and Promotions", desc: "Contextual promotions from verified travel, hospitality, and local transport businesses." },
        { name: "Data Analytics", desc: "Aggregated, anonymous tourism safety insights and trend reports for destination authorities." }
      ],
      targetCustomers: [
        { name: "Tourists and Solo Travelers", desc: "Independent domestic and international visitors, solo travelers, and women travelers seeking personal safety." },
        { name: "Travel Agencies & Tour Operators", desc: "Commercial operators requiring duty-of-care tracking and safety assurance for guided groups." },
        { name: "Hotels and Hospitality Businesses", desc: "Accommodation providers offering safety amenities and local area threat advisories to guests." },
        { name: "Government Tourism Departments", desc: "Municipal, state, and national bodies working to improve destination security ratings." }
      ],
      keyPartners: [
        "Emergency Services (Ambulance, Fire, Police)",
        "Tourism Authorities & Municipal Security",
        "Hotels and Travel Agencies",
        "Cloud & Blockchain Infrastructure Providers",
        "GPS & Mapping Service Providers"
      ],
      costStructure: [
        "App development & ongoing software maintenance",
        "AI, blockchain & cloud infrastructure hosting",
        "Server and secure data storage costs",
        "GPS & mapping API integration fees",
        "Marketing, public outreach & promotional campaigns",
        "24/7 customer support & platform security audits"
      ],
      futureGrowthOpportunities: [
        "Expand to international tourism markets across Asia and Europe",
        "Integration with smart wearables and connected IoT safety beacons",
        "AI-based personalized safe-travel recommendations",
        "Collaborations with airlines, railways, and intercity transport operators",
        "Smart tourism analytics and predictive risk modeling for governments"
      ]
    },

    // Slide 7 — Market Analysis (Exact 2024 statistics)
    marketAnalysis: {
      stats: [
        { value: "20.57M", label: "Total International Arrivals", desc: "Total international tourist arrivals in India during 2024" },
        { value: "9.95M", label: "Foreign Tourists", desc: "Foreign tourists welcomed by India in 2024" },
        { value: "2.94B", label: "Domestic Tourist Visits", desc: "Domestic tourist visits recorded across India in 2024" },
        { value: "₹3.1T", label: "Visitor Spending (US$36B)", desc: "Spent by international visitors in India during 2024" },
        { value: "76M+", label: "Tourism Jobs Generated", desc: "Employment created by Indian tourism sector from 2023 to 2024" }
      ],
      majorStates: [
        { state: "Madhya Pradesh", metric: "134.1 million tourists in 2024" },
        { state: "Goa", metric: "10 million tourists in 2025" },
        { state: "Uttar Pradesh", metric: "478 million domestic visits" }
      ]
    },

    // Slide 8 — Competitive Analysis
    competitiveAnalysis: [
      {
        factor: "Primary Focus",
        traditional: "Booking tickets, hotels, and general travel navigation guidance.",
        travalert: "Dedicated real-time traveler personal safety, emergency response, and threat detection."
      },
      {
        factor: "Real-Time Monitoring",
        traditional: "No active real-time monitoring of traveler location or safety context.",
        travalert: "Continuous AI-driven monitoring of traveler locations and spatial risk factors."
      },
      {
        factor: "Emergency Response",
        traditional: "Slow, manual phone calls lacking instant coordinated responder dispatch.",
        travalert: "One-touch instant SOS sharing live GPS coordinates directly with authorities and emergency contacts."
      },
      {
        factor: "Hazard Detection",
        traditional: "Cannot automatically detect unsafe, prohibited, or restricted areas.",
        travalert: "Automated Geo-Fencing alerts trigger the moment a tourist enters potentially risky zones."
      },
      {
        factor: "Identity Verification",
        traditional: "Weak document copies vulnerable to loss, misuse, fraud, and tampering.",
        travalert: "Cryptographically secured blockchain digital ID providing tamper-proof credential storage."
      },
      {
        factor: "Threat Analysis",
        traditional: "Completely lacks AI-based unusual behavior analysis or proactive danger prediction.",
        travalert: "AI-powered anomaly detection identifying erratic travel patterns and emerging threats."
      }
    ],

    // Slide 9 — Traction & Development Roadmap
    traction: {
      context: "20.57M international tourists and 2.94B domestic visits in India (2024) drive an urgent, rising demand for smart tourist safety solutions. Target users focus especially on foreign visitors, solo travelers, and women travelers.",
      stages: [
        {
          num: "01",
          name: "Market Research",
          status: "Completed",
          statusType: "completed",
          desc: "Comprehensive surveys and interviews to understand core traveler safety needs, tourist vulnerability points, and authority requirements."
        },
        {
          num: "02",
          name: "Feature Finalization",
          status: "Completed",
          statusType: "completed",
          desc: "Architectural definition of core safety features: Geofencing perimeters, Blockchain Digital ID schema, and Instant SOS protocol."
        },
        {
          num: "03",
          name: "MVP Development",
          status: "Under Development",
          statusType: "active",
          desc: "Building the working Minimum Viable Product, developing prototype geofencing triggers, and testing emergency communication pathways."
        }
      ],
      nextSteps: "Planned partnerships with municipal tourism boards, emergency services, and hospitality networks."
    }
  }
];
