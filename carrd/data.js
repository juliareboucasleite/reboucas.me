/* ------------------------------------------------------------------
 * carrd content — edit this file to update the page.
 *
 * QUICK REFERENCE
 *   tone:   1–9   color of the icon chip
 *           1 = neutral (default)
 *           2 = sky-ish gray         5 = mid neutral
 *           3 = warm gray            6 = GOLD (use for OK / open)
 *           4 = warm beige           7 = warm brown
 *           8 = cool gray            9 = deeper neutral
 *
 *   schedule item kind:
 *           "mini"     compact row (most entries)
 *           "feature"  taller card with right-fade gradient (highlight)
 *
 *   To add a new month → push to schedule.months (newest goes on top).
 *   To add a new project → push to projects.items.
 * ------------------------------------------------------------------ */

window.carrdData = {

  pageTitle: "Commissions & Projects",

  about: {
    title: "About",
    name: "",   // set to e.g. "leeksxy" to show the big italic name on top
    tagline: "Hii! my name is leeksxy and I create cute & aesthetic frontend projects, Roblox maps, and clothing packs. Commissions are open, with my schedule visible beside it.",
    actions: [
      { type: "primary", label: "Book on Ko-fi", href: "https://ko-fi.com/leeksxy" },
      { type: "copy",    label: "Copy @leeksxy", value: "leeksxy" }
    ],
    sections: [
      { label: "CURRENT STATUS", text: "Fully booked until May 18. Next openings from June 1." },
      { label: "STYLE",          text: "Cute, soft, aesthetic. Palettes in mauve, dusty pink, and off-white. Focus on playful interfaces and visuals." },
      { label: "SPECIALTIES",    text: "Cute frontend pages, Roblox maps, clothing packs, standalone illustrations, and covers/banners." },
      { label: "HOW TO BOOK",    text: "Send a direct message on Ko-fi with references, your desired deadline, and the commission type. Reply in 24–48h." },
      { label: "PAYMENT",        text: "50% upfront to reserve the slot, 50% on delivery. Ko-fi, PayPal, or MB Way." }
    ]
  },

  schedule: {
    title: "Schedule",
    months: [
      {
        month: "JUL", year: "2026",
        band: "OPEN SLOTS",
        milestone: { text: "3 open slots", date: "jul" },
        items: [
          { kind: "mini", tone: 6, icon: "OK", title: "Open slot — any type", meta: "1 – 14 jul 2026" },
          { kind: "mini", tone: 6, icon: "OK", title: "Open slot — any type", meta: "15 – 28 jul 2026" }
        ]
      },
      {
        month: "JUN", year: "2026",
        band: "SLOTS OPEN",
        milestone: { text: "Bookings reopen", date: "1 jun" },
        items: [
          { kind: "feature", tone: 2, icon: "FE", title: "Frontend — cute landing page (reserved)", meta: "1 – 14 jun 2026" },
          { kind: "mini",    tone: 6, icon: "OK", title: "Open slot — Roblox / pack",               meta: "15 – 28 jun 2026" }
        ]
      },
      {
        month: "MAI", year: "2026",
        band: "IN PROGRESS",
        milestone: { text: "Fully booked", date: "até 18 mai" },
        items: [
          { kind: "feature", tone: 4, icon: "FE", title: "Frontend portfolio — Client A",  meta: "5 – 18 mai 2026 · ativo" },
          { kind: "feature", tone: 3, icon: "CP", title: "Clothing pack — Client B",       meta: "4 – 12 mai 2026 · ativo" },
          { kind: "mini",    tone: 2, icon: "RB", title: "Roblox map — aesthetic café",    meta: "since Apr 28 · in progress" }
        ]
      },
      {
        month: "ABR", year: "2026",
        items: [
          { kind: "mini", tone: 4, icon: "CP", title: "Pastel clothing pack — delivered",   meta: "10 – 22 abr 2026" },
          { kind: "mini", tone: 5, icon: "IL", title: "Chibi illustration — delivered",     meta: "3 – 8 abr 2026" }
        ]
      },
      {
        month: "MAR", year: "2026",
        items: [
          { kind: "mini", tone: 3, icon: "FE", title: "Portfolio site — delivered",         meta: "1 – 19 mar 2026" },
          { kind: "mini", tone: 7, icon: "RB", title: "Roblox showroom map — delivered",    meta: "20 – 30 mar 2026" }
        ]
      },
      {
        month: "FEV", year: "2026",
        items: [
          { kind: "mini", tone: 8, icon: "CP", title: "Winter clothing pack — delivered",   meta: "2 – 18 fev 2026" }
        ]
      },
      {
        month: "JAN", year: "2026",
        milestone: { text: "Commission list open", date: "5 jan" },
        items: []
      }
    ]
  },

  commissions: {
    title: "Commission types",
    items: [
      { title: "Cute frontend",         desc: "Landing pages, portfolios, and mini-sites with a soft aesthetic. HTML, CSS, and light interactions.", linkLabel: "Book →", href: "https://ko-fi.com/leeksxy" },
      { title: "Roblox maps",           desc: "Themed maps and scenes: cafés, shops, aesthetic rooms, showrooms. Clean and lightweight builds.",     linkLabel: "Book →", href: "https://ko-fi.com/leeksxy" },
      { title: "Clothing packs",        desc: "Roblox clothing packs in coordinated collections. Tops, pants, and full sets.",                       linkLabel: "Book →", href: "https://ko-fi.com/leeksxy" },
      { title: "Illustration / banners", desc: "Covers, Discord and Twitch banners, headers, and custom chibi illustrations.",                       linkLabel: "Book →", href: "https://ko-fi.com/leeksxy" }
    ]
  },

  projects: {
    title: "Works & projects",
    items: [
      { tone: 1, icon: "FE", title: "Portfolio site — Client M",      desc: "One-page mini-site in a dusty pink aesthetic with an animated header, stacked sections, and a contact form. Delivered Mar 2026.", url: "https://ko-fi.com/leeksxy", urlLabel: "KO-FI.COM/LEEKSXY" },
      { tone: 2, icon: "RB", title: "Roblox map — aesthetic café",    desc: "Café setting in mauve tones with custom furniture, ordering area, and garden. Private commission, in progress." },
      { tone: 3, icon: "CP", title: "Pastel clothing pack",           desc: "Collection of 8 coordinated pieces in a pastel palette: tops, pants, and full sets. Delivered Apr 2026." },
      { tone: 4, icon: "IL", title: "Chibi illustration — Client L",  desc: "Full-body chibi illustration with a simple background and soft palette. For social media use. Delivered Apr 2026." },
      { tone: 5, icon: "FE", title: "Landing — aesthetic online shop", desc: "Launch page for a micro-shop with product gallery, cottagecore aesthetic, and news section." },
      { tone: 6, icon: "RB", title: "Roblox map — showroom",          desc: "Interactive showroom to present a Roblox clothing collection, with mannequins and lounge area. Delivered Mar 2026." },
      { tone: 7, icon: "CP", title: "Winter clothing pack",           desc: "Winter collection in warm tones: coats, beanies, and boots. Delivered Feb 2026." },
      { tone: 8, icon: "BN", title: "Discord banners — pack",         desc: "Set of 5 themed banners for a Discord server, with editable PNG and PSD included." }
    ]
  },

  ideas: {
    title: "Ideas I'm exploring",
    items: [
      { title: "Ko-fi shop with presets", desc: "Sell presets, ready-made packs, and templates alongside custom commissions." },
      { title: "Original character",      desc: "Create a mascot OC for the leeksxy brand, with a mauve palette." },
      { title: "Frontend templates",      desc: "Release ready-to-customize landing templates in a cute aesthetic." },
      { title: "Process stream",          desc: "Show the commission process live on Twitch / Twitter." }
    ]
  }

};
