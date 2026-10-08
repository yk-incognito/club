rivora-club/
│
├── index.html              # Public portal, history, rules, and feed
├── login.html              # Login via Reg No (e.g., 1001) & password
├── register.html           # Dual-name sign-up with client-side image cropper
├── dashboard.html          # Profile, suggestions (<=300 words), backups, and audit trail
├── directory.html          # Member roster (fast, lightweight, photo-less)
├── treasury.html           # Dues tracking, advance payments, and ledger
├── games.html              # Member mini-game zone with live leaderboard
├── election.html           # Zero-knowledge secret voting portal
│
├── css/
│   ├── global.css          # Design tokens, variables, resets, and utility classes
│   ├── navbar.css          # Navigation bar styles and role badges
│   ├── footer.css          # Common responsive footer
│   ├── home.css            # Public feed cards, hero, and gallery
│   ├── auth.css            # Split auth screen, crop preview
│   ├── dashboard.css       # Admin dashboard, log audit table, backup controls
│   ├── treasury.css        # Financial slabs, defaulters filter, WhatsApp action items
│   ├── games.css           # Mini-game canvas and real-time scoreboard
│   └── election.css        # Nomination cards, candidate selector, tie-breaker banner
│
└── js/
    ├── supabase-client.js  # Supabase client initialization
    ├── auth-guard.js       # Session checks and role-based redirect protection
    ├── cropper-helper.js   # 100KB-200KB compression and aspect-ratio helper
    ├── home.js             # Public feed loader and activity grid
    ├── treasury.js         # Multi-month advance calculator and export logic
    ├── games.js            # Interactive mini-game engine with nickname logging
    └── election.js         # Atomic submit logic, countdown validator, and tie detection
