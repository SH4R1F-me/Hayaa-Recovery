hayaa/
├── index.html          (554 lines)  — Pure HTML, zero script/style
├── css/
│   └── style.css       (642 lines)  — 27 organized sections with comments
└── js/
    ├── constants.js    (133 lines)  — All static data (habits, verses, etc.)
    ├── state.js        (146 lines)  — localStorage, defaultState, doDailyReset
    ├── utils.js         (55 lines)  — pad(), hexToRgba(), escapeHtml(), getEl()
    ├── api.js          (111 lines)  — CBT feature with graceful fallback
    ├── prayer.js       (108 lines)  — Prayer times (Aladhan API + geolocation)
    ├── render.js       (470 lines)  — All UI rendering, reads ST, never writes it
    ├── tools.js        (349 lines)  — Urge tools (timer, breathing, surf, senses)
    ├── handlers.js     (386 lines)  — Event handlers, mutates ST then calls render
    └── app.js           (88 lines)  — Entry point: switchTab, renderAll, init()
