const LANG_STORAGE_KEY = "portfolio-lang";
const BIRTH_DATE = new Date(2008, 2, 19);
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const DRAG_CLOSE_THRESHOLD = 55;
const SCROLL_STEP = 400;
let currentLang = "pt";
const CAREER_ORDER = ["course", "course11", "promoping", "course12", "panel", "bot", "mobile", "codepad", "riya", "cstudy", "biblioteca", "trevor", "internship", "discord"];

const careerDetails = {
  pt: {
    labels: {
      work: "O que fiz",
      learned: "O que aprendi",
      title: "Detalhe do percurso",
    },
    course: {
      icon: "C",
      title: "Curso Prof. Programao e SI",
      meta: "Formao 2024 2026",
      summary:
        "Base tcnica onde consolidei programao, bases de dados, desenvolvimento web e organizao de projetos.",
      work: [
        "Desenvolvi exerccios e projetos em C#, PHP, JavaScript, HTML e CSS.",
        "Trabalhei com bases de dados MySQL/MariaDB e lgica de aplicaes.",
        "Aprendi a documentar, testar e apresentar solues tcnicas.",
      ],
      learned: [
        "Transformar requisitos em funcionalidades concretas.",
        "Organizar cdigo e evoluir projetos por etapas.",
        "Ganhar disciplina para continuar a aprender de forma autnoma.",
      ],
    },
    course11: {
      icon: "11",
      title: "Projeto do curso (11PSI2)",
      meta: "Formao 18 set 2024 12 jun 2025",
      summary:
        "Projeto de estudo do 11PSI2 para praticar C#, Windows Forms e lgica de aplicaes.",
      work: [
        "Desenvolvi o projeto ao longo do ano letivo com foco em Windows Forms.",
        "Pratiquei estruturao de interface e lgica de aplicao.",
        "Usei o projeto como base para ganhar ritmo em C#.",
      ],
      learned: [
        "Projetos longos mostram melhor a evoluo tcnica.",
        "Windows Forms ajudou a consolidar interface e eventos.",
        "A progresso por etapas deixa o desenvolvimento mais claro.",
      ],
    },
    promoping: {
      icon: "P",
      title: "PromoPing",
      meta: "PAP / Projeto set 2024 18 mar 2026",
      summary:
        "Sistema de monitorizao de preos para o mercado portugus, com scraping, histrico de preos e alertas automticos por Discord e email.",
      work: [
        "Planeei a arquitetura do projeto e as funcionalidades principais.",
        "Implementei scraping, alertas e acompanhamento de produtos.",
        "Integrei notificaes e lgica de comparao de preos.",
      ],
      learned: [
        "Projetos reais exigem decises entre simplicidade e ambio.",
        "Automao precisa de tratamento de erros e dados consistentes.",
        "Uma boa ideia melhora muito quando tem uma interface clara.",
      ],
    },
    course12: {
      icon: "12",
      title: "Projetos do curso (12PSI2)",
      meta: "Formao 16 set 9 dez 2025",
      summary:
        "Conjunto de projetos e exerccios do 12PSI2, focados em consolidar prtica em C#, PHP, JavaScript, CSS e HTML.",
      work: [
        "Desenvolvi exerccios e projetos de vrias disciplinas tcnicas.",
        "Pratiquei C#, PHP, JavaScript, CSS e HTML em contexto escolar.",
        "Usei os projetos para reforar bases e ritmo de execuo.",
      ],
      learned: [
        "A repetio em projetos curtos melhora a fluidez tcnica.",
        "Cada linguagem pede formas diferentes de organizar o pensamento.",
        "Projetos de curso ajudam a consolidar fundamentos com regularidade.",
      ],
    },
    panel: {
      icon: "C#",
      title: "PromoPing Painel Admin C#",
      meta: "Projeto 14 out 2025 3 mar 2026",
      summary:
        "Painel administrativo em C# para gerir utilizadores, produtos e dados relacionados com o PromoPing.",
      work: [
        "Criei interfaces de gesto em C#.",
        "Implementei operaes de criao, edio e consulta de dados.",
        "Organizei funcionalidades de administrao para o projeto principal.",
      ],
      learned: [
        "Separar interface, lgica e dados deixa o projeto mais fcil de manter.",
        "Dashboards precisam mostrar o essencial sem rudo.",
        "C# uma boa base para aplicaes estruturadas.",
      ],
    },
    bot: {
      icon: "J",
      title: "PromoPing Bot Suporter",
      meta: "Projeto 28 jan 3 mar 2026",
      summary:
        "Bot de Discord desenvolvido em Java para apoiar o ecossistema PromoPing no servidor Discord.",
      work: [
        "Implementei comandos e fluxos de resposta para Discord.",
        "Explorei a API JDA e organizao de eventos em bots.",
        "Liguei automaes ao contexto de alertas e suporte do PromoPing.",
      ],
      learned: [
        "Estruturao inicial de projetos Java.",
        "Trabalhar com eventos assncronos e APIs.",
        "Pensar em UX tambm dentro de bots e comandos.",
      ],
    },
    mobile: {
      icon: "M",
      title: "PromoPing Mobile",
      meta: "Projeto 2 fev 2 mar 2026",
      summary:
        "Verso mobile do ecossistema PromoPing para acompanhar promoes e adaptar a ideia principal a um formato mais porttil.",
      work: [
        "Estruturei uma verso mobile do conceito PromoPing.",
        "Organizei ecrs e fluxos para consulta rpida de promoes.",
        "Adaptei a experincia do projeto principal a um contexto mais mvel.",
      ],
      learned: [
        "Interfaces mobile exigem foco no essencial.",
        "A navegao precisa ser simples e previsvel.",
        "Projetos derivados ajudam a consolidar a arquitetura principal.",
      ],
    },
    codepad: {
      icon: "CP",
      title: "CodePad",
      meta: "Projeto 30 jan 16 abr 2026 em desenvolvimento",
      summary:
        "Editor e ambiente de prtica criado para testar ideias, organizar cdigo e explorar um fluxo prprio de estudo e produtividade.",
      work: [
        "Defini a base do editor e do ambiente de prtica.",
        "Experimentei interaes para escrita e organizao de cdigo.",
        "Mantive o projeto em evoluo ao longo de vrias iteraes.",
      ],
      learned: [
        "Ferramentas prprias obrigam a pensar melhor no fluxo de uso.",
        "UX de produtividade depende de pequenos detalhes.",
        "Iterar vrias vezes melhora a clareza do produto.",
      ],
    },
    riya: {
      icon: "RB",
      title: "Riya Bot Discord",
      meta: "Projeto 7 abr 14 abr 2026 em desenvolvimento",
      summary:
        "Bot de Discord criado para praticar automao, comandos e integrao com servidores, ainda em fase de desenvolvimento.",
      work: [
        "Estruturei comandos e respostas para o bot.",
        "Explorei automaes ligadas a eventos no Discord.",
        "Mantive o projeto em desenvolvimento com pequenas iteraes rpidas.",
      ],
      learned: [
        "Bots exigem clareza de comandos e respostas.",
        "Eventos assncronos pedem boa organizao.",
        "Projetos curtos ajudam a testar ideias rapidamente.",
      ],
    },
    cstudy: {
      icon: "C",
      title: "Estudos em C",
      meta: "Aprendizagem desde 24 mar 2026",
      summary:
        "Repositrio de estudo em C para reforar fundamentos de programao, memria, lgica e estrutura de programas.",
      work: [
        "Pratiquei exerccios e bases da linguagem C.",
        "Explorei lgica, estruturas e conceitos mais prximos do sistema.",
        "Usei o repositrio como espao contnuo de prtica.",
      ],
      learned: [
        "C ajuda a entender melhor a base da programao.",
        "Memria e estrutura de dados exigem mais rigor.",
        "Exerccios frequentes melhoram muito a confiana tcnica.",
      ],
    },
    biblioteca: {
      icon: "BB",
      title: "Biblioteca Brotero",
      meta: "Projeto 18 mar 23 abr 2026",
      summary:
        "Projeto de biblioteca escolar para praticar organizao de dados, interfaces e funcionalidades de gesto.",
      work: [
        "Modelei fluxos de gesto ligados ao contexto de biblioteca.",
        "Estruturei a organizao de dados e operaes principais.",
        "Usei o projeto para praticar interface e lgica aplicada.",
      ],
      learned: [
        "Projetos temticos ajudam a pensar melhor no domnio.",
        "Gesto de dados pede consistncia e clareza.",
        "Interfaces administrativas precisam de objetividade.",
      ],
    },
    trevor: {
      icon: "TA",
      title: "TrevorAuth",
      meta: "Projeto desde 17 abr 2026 em desenvolvimento",
      summary:
        "Projeto focado em autenticao, controlo de acesso e estrutura de segurana, ainda em desenvolvimento.",
      work: [
        "Iniciei a estrutura base para fluxos de autenticao.",
        "Explorei organizao de acesso e validao de utilizadores.",
        "Mantive o projeto aberto para aprofundar segurana e login.",
      ],
      learned: [
        "Autenticao precisa de estrutura e consistncia.",
        "Segurana comea nas decises base do projeto.",
        "Projetos em progresso ajudam a estudar casos reais com mais profundidade.",
      ],
    },
    internship: {
      icon: "E",
      title: "Estgio na FAmazing como Web Developer",
      meta: "Estgio 16 mar 4 jul 2026",
      summary:
        "Experincia prtica em ambiente profissional, focada em desenvolvimento web, manuteno de interfaces e colaborao com uma equipa real.",
      work: [
        "Apoiei tarefas de desenvolvimento web e ajustes de interface.",
        "Trabalhei com requisitos, feedback e pequenas iteraes.",
        "Pratiquei comunicao tcnica em contexto de equipa.",
      ],
      learned: [
        "Cdigo precisa ser claro para outras pessoas, no spara mim.",
        "Detalhes de UI importam muito na experincia final.",
        "Prazos e feedback mudam a forma como se prioriza.",
      ],
    },
    discord: {
      icon: "JS",
      title: "Aprendendo a fazer bot de Discord em JS",
      meta: "Aprendizagem 2020",
      summary:
        "Primeiros passos com automao, JavaScript e bots de Discord. Foi uma fase experimental que abriu caminho para projetos mais completos depois.",
      work: [
        "Criei comandos simples para Discord.",
        "Explorei eventos, mensagens e respostas automticas.",
        "Testei ideias pequenas para entender a lgica de bots.",
      ],
      learned: [
        "Programao fica mais clara quando se constri algo divertido.",
        "APIs e eventos so fundamentos importantes.",
        "Projetos pequenos ajudam a ganhar confiana.",
      ],
    },
  },
  en: {
    labels: {
      work: "Stuff I worked on",
      learned: "Things I learned",
      title: "Career detail",
    },
    course: {
      icon: "C",
      title: "Programming and Information Systems Course",
      meta: "Education 2024 2026",
      summary:
        "Technical foundation where I consolidated programming, databases, web development, and project organization.",
      work: [
        "Built projects in C#, PHP, JavaScript, HTML, and CSS.",
        "Worked with MySQL/MariaDB databases.",
        "Practiced documentation, testing, and technical presentations.",
      ],
      learned: [
        "Turn requirements into real features.",
        "Organize code through project stages.",
        "Keep learning independently.",
      ],
    },
    course11: {
      icon: "11",
      title: "Course project (11PSI2)",
      meta: "Education Sep 18, 2024 Jun 12, 2025",
      summary:
        "11PSI2 study project built to practice C#, Windows Forms, and application logic.",
      work: [
        "Developed the project across the school year with Windows Forms focus.",
        "Practiced interface structure and application logic.",
        "Used the project to build consistency in C#.",
      ],
      learned: [
        "Longer projects show technical growth more clearly.",
        "Windows Forms helped solidify interface and event handling.",
        "Step-by-step progress makes development easier to manage.",
      ],
    },
    promoping: {
      icon: "P",
      title: "PromoPing",
      meta: "Final project Sep 2024 Mar 18, 2026",
      summary:
        "Price monitoring system for the Portuguese market with scraping, price history, and automated alerts.",
      work: [
        "Planned the main architecture.",
        "Built scraping, alerts, and product tracking.",
        "Integrated notifications and price comparison logic.",
      ],
      learned: [
        "Real projects require tradeoffs.",
        "Automation needs consistent data and error handling.",
        "A clear interface improves a strong idea.",
      ],
    },
    course12: {
      icon: "12",
      title: "Course projects (12PSI2)",
      meta: "Education Sep 16 Dec 9, 2025",
      summary:
        "Set of 12PSI2 projects and exercises focused on consolidating work in C#, PHP, JavaScript, CSS, and HTML.",
      work: [
        "Built exercises and projects across technical subjects.",
        "Practiced C#, PHP, JavaScript, CSS, and HTML in school context.",
        "Used the projects to reinforce fundamentals and execution rhythm.",
      ],
      learned: [
        "Repetition through short projects improves fluency.",
        "Each language demands a different way of structuring thought.",
        "Course projects are good for steady reinforcement of fundamentals.",
      ],
    },
    panel: {
      icon: "C#",
      title: "PromoPing Admin Panel C#",
      meta: "Project Oct 14, 2025 Mar 3, 2026",
      summary: "C# admin panel for managing users, products, and PromoPing data.",
      work: [
        "Created C# management interfaces.",
        "Implemented create, edit, and query flows.",
        "Organized admin features for the main project.",
      ],
      learned: [
        "Separate UI, logic, and data.",
        "Dashboards should show what matters.",
        "C# is solid for structured apps.",
      ],
    },
    bot: {
      icon: "J",
      title: "PromoPing Bot Suporter",
      meta: "Project Jan 28 Mar 3, 2026",
      summary:
        "Discord bot developed in Java to support the PromoPing ecosystem on Discord.",
      work: [
        "Implemented Discord commands.",
        "Explored JDA and event-driven bot logic.",
        "Connected automations to alerts and support flows.",
      ],
      learned: [
        "Java project structure.",
        "Working with async events and APIs.",
        "UX matters in bot commands too.",
      ],
    },
    mobile: {
      icon: "M",
      title: "PromoPing Mobile",
      meta: "Project Feb 2 Mar 2, 2026",
      summary:
        "Mobile version of the PromoPing ecosystem for tracking deals and adapting the main idea to a more portable experience.",
      work: [
        "Structured a mobile version of the PromoPing concept.",
        "Organized screens and flows for quick deal tracking.",
        "Adapted the main project experience to a mobile context.",
      ],
      learned: [
        "Mobile interfaces need strong focus on essentials.",
        "Navigation has to stay simple and predictable.",
        "Spin-off projects help validate the main product direction.",
      ],
    },
    codepad: {
      icon: "CP",
      title: "CodePad",
      meta: "Project Jan 30 Apr 16, 2026 in development",
      summary:
        "Editor and practice environment created to test ideas, organize code, and explore a personal study workflow.",
      work: [
        "Defined the base structure of the editor and practice environment.",
        "Tested interactions for writing and organizing code.",
        "Kept the project evolving through several iterations.",
      ],
      learned: [
        "Building tools changes how you think about workflow.",
        "Productivity UX depends on small details.",
        "Repeated iteration improves product clarity.",
      ],
    },
    riya: {
      icon: "RB",
      title: "Riya Bot Discord",
      meta: "Project Apr 7 Apr 14, 2026 in development",
      summary:
        "Discord bot created to practice automation, commands, and server integration, still in development.",
      work: [
        "Structured bot commands and replies.",
        "Explored event-driven automations for Discord.",
        "Kept the project moving with short, fast iterations.",
      ],
      learned: [
        "Bots require clear commands and responses.",
        "Async events need clean organization.",
        "Short projects are great for testing ideas quickly.",
      ],
    },
    cstudy: {
      icon: "C",
      title: "C Studies",
      meta: "Learning since Mar 24, 2026",
      summary:
        "Study repository in C focused on programming fundamentals, memory, logic, and program structure.",
      work: [
        "Practiced exercises and core concepts in C.",
        "Explored logic, structures, and lower-level programming ideas.",
        "Used the repository as a continuous study space.",
      ],
      learned: [
        "C helps build stronger programming foundations.",
        "Memory and structure demand more rigor.",
        "Frequent exercises improve technical confidence.",
      ],
    },
    biblioteca: {
      icon: "BB",
      title: "Biblioteca Brotero",
      meta: "Project Mar 18 Apr 23, 2026",
      summary:
        "School library project for practicing data organization, interfaces, and management features.",
      work: [
        "Modeled management flows around a library domain.",
        "Structured data organization and core operations.",
        "Used the project to practice interface and applied logic.",
      ],
      learned: [
        "Domain-driven projects improve product thinking.",
        "Data management needs consistency and clarity.",
        "Administrative interfaces should stay objective.",
      ],
    },
    trevor: {
      icon: "TA",
      title: "TrevorAuth",
      meta: "Project since Apr 17, 2026 in development",
      summary:
        "Authentication-focused project exploring access control and security structure, still in development.",
      work: [
        "Started the base structure for authentication flows.",
        "Explored access organization and user validation.",
        "Kept the project open to deepen login and security concepts.",
      ],
      learned: [
        "Authentication needs structure and consistency.",
        "Security starts in the foundation of the project.",
        "Ongoing projects are useful for deeper technical study.",
      ],
    },
    internship: {
      icon: "E",
      title: "FAmazing Web Developer Internship",
      meta: "Internship Mar 16 Jul 4, 2026",
      summary:
        "Professional experience focused on web development, UI maintenance, and team collaboration.",
      work: [
        "Supported web development tasks.",
        "Worked from requirements and feedback.",
        "Practiced technical communication.",
      ],
      learned: [
        "Code should be clear for other people.",
        "UI details matter.",
        "Deadlines affect prioritization.",
      ],
    },
    discord: {
      icon: "JS",
      title: "Learning Discord bot development in JS",
      meta: "Learning 2020",
      summary:
        "First steps with automation, JavaScript, and Discord bots.",
      work: [
        "Built simple Discord commands.",
        "Explored events, messages, and automated replies.",
        "Tested small ideas to understand bot logic.",
      ],
      learned: [
        "Programming gets clearer with fun projects.",
        "APIs and events are important foundations.",
        "Small projects build confidence.",
      ],
    },
  },
};

function qsa(selector) {
  return document.querySelectorAll(selector);
}

function applyLanguage(lang) {
  if (typeof i18n === "undefined" || !i18n[lang]) return;
  currentLang = lang;

  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (_) { }

  const translations = i18n[lang];
  document.documentElement.lang = lang === "pt" ? "pt-PT" : "en";

  qsa("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[key] != null) el.textContent = translations[key];
  });

  qsa("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (translations[key] != null) el.innerHTML = translations[key];
  });

  qsa("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (translations[key] != null) el.setAttribute("aria-label", translations[key]);
  });

  qsa(".lang-btn").forEach((btn) => {
    const isActive = btn.getAttribute("data-lang") === lang;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", isActive);
  });
}

function initLanguage() {
  qsa(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      if (lang === "pt" || lang === "en") applyLanguage(lang);
    });
  });

  let savedLang = "pt";
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "pt" || stored === "en") savedLang = stored;
  } catch (_) { }

  applyLanguage(savedLang);
}

function initCopyEmail() {
  const copyEmailBtn = document.querySelector(".btn--copy");
  if (!copyEmailBtn) return;

  copyEmailBtn.addEventListener("click", () => {
    const email = "juliareboucasleite@gmail.com";
    navigator.clipboard.writeText(email).then(() => {
      const translations = i18n[currentLang];
      const doneText = translations && translations.copyDone ? translations.copyDone : "Copied!";
      const originalText = translations && translations.copyEmail ? translations.copyEmail : copyEmailBtn.textContent;

      copyEmailBtn.classList.add("is-copied");
      copyEmailBtn.textContent = doneText;

      setTimeout(() => {
        copyEmailBtn.classList.remove("is-copied");
        copyEmailBtn.textContent = originalText;
      }, 1500);
    });
  });
}

function initAgeCounter() {
  const ageCounterEl = document.getElementById("age-counter");
  if (!ageCounterEl) return;

  const updateAgeCounter = () => {
    const now = new Date();
    const age = (now - BIRTH_DATE) / MS_PER_YEAR;
    ageCounterEl.textContent = age.toFixed(10);
  };

  updateAgeCounter();
  setInterval(updateAgeCounter, 100);
}

function initIdeasModals() {
  const openIdeasBtns = qsa(".open-ideas-modal");
  let dragStartY = 0;
  let lastDragY = 0;
  let currentDragSheet = null;

  const openIdeasModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const block = modal.closest(".block");
    if (block) {
      block.scrollTop = 0;
      block.classList.add("has-open-modal");
    }

    const sheet = modal.querySelector(".ideas-modal-sheet, .career-detail-panel__sheet");
    modal.classList.add("is-visible");
    modal.setAttribute("aria-hidden", "false");
    if (sheet) sheet.style.transform = "translateY(0)";
  };

  const closeIdeasModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const block = modal.closest(".block");
    const sheet = modal.querySelector(".ideas-modal-sheet, .career-detail-panel__sheet");
    modal.classList.remove("is-visible");
    modal.setAttribute("aria-hidden", "true");
    if (sheet) sheet.style.transform = "";

    if (block && !block.querySelector(".modal.is-visible, .career-detail-panel.is-visible")) {
      block.classList.remove("has-open-modal");
    }
  };

  const onHandlePointerMove = (e) => {
    if (e.type === "touchmove") e.preventDefault();
    const y = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
    lastDragY = y;
    const dy = Math.max(0, y - dragStartY);
    if (currentDragSheet) currentDragSheet.style.transform = "translateY(" + dy + "px)";
  };

  const onHandlePointerUp = () => {
    document.removeEventListener("mousemove", onHandlePointerMove);
    document.removeEventListener("mouseup", onHandlePointerUp);
    document.removeEventListener("touchmove", onHandlePointerMove, { passive: false });
    document.removeEventListener("touchend", onHandlePointerUp);
    document.removeEventListener("touchcancel", onHandlePointerUp);

    const dy = lastDragY - dragStartY;
    if (currentDragSheet) {
      const modal = currentDragSheet.closest(".modal, .career-detail-panel");
      if (dy >= DRAG_CLOSE_THRESHOLD && modal) closeIdeasModal(modal.id);
      else currentDragSheet.style.transform = "translateY(0)";
    }
    currentDragSheet = null;
  };

  const onHandlePointerDown = (e) => {
    const modalId = e.currentTarget.getAttribute("data-ideas-modal");
    const modal = document.getElementById(modalId);
    currentDragSheet = modal ? modal.querySelector(".ideas-modal-sheet, .career-detail-panel__sheet") : null;
    dragStartY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    lastDragY = dragStartY;

    document.addEventListener("mousemove", onHandlePointerMove);
    document.addEventListener("mouseup", onHandlePointerUp);
    document.addEventListener("touchmove", onHandlePointerMove, { passive: false });
    document.addEventListener("touchend", onHandlePointerUp);
    document.addEventListener("touchcancel", onHandlePointerUp);
  };

  openIdeasBtns.forEach((btn) => {
    const modalId = btn.getAttribute("data-ideas-modal");
    if (!modalId) return;

    btn.addEventListener("click", () => openIdeasModal(modalId));
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openIdeasModal(modalId);
      }
    });
  });

  qsa(".ideas-modal-backdrop").forEach((el) => {
    el.addEventListener("click", () => {
      const modalId = el.getAttribute("data-ideas-modal");
      if (modalId) closeIdeasModal(modalId);
    });
  });

  qsa(".ideas-modal-close").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-ideas-modal");
      if (modalId) closeIdeasModal(modalId);
    });
  });

  qsa(".ideas-modal-handle").forEach((handle) => {
    handle.addEventListener("mousedown", onHandlePointerDown);
    handle.addEventListener("touchstart", onHandlePointerDown, { passive: true });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const visible = document.querySelector(".modal.is-visible, .career-detail-panel.is-visible");
    if (visible) closeIdeasModal(visible.id);
  });
}

function initHorizontalScrollNav() {
  const scrollArea = document.getElementById("scroll-area");
  const scrollPrevBtn = document.getElementById("scroll-prev");
  const scrollNextBtn = document.getElementById("scroll-next");

  if (scrollArea && scrollPrevBtn) {
    scrollPrevBtn.addEventListener("click", () => {
      scrollArea.scrollBy({ left: -SCROLL_STEP, behavior: "smooth" });
    });
  }

  if (scrollArea && scrollNextBtn) {
    scrollNextBtn.addEventListener("click", () => {
      scrollArea.scrollBy({ left: SCROLL_STEP, behavior: "smooth" });
    });
  }
}

function initCareerDetails() {
  const modal = document.getElementById("career-detail-modal");
  if (!modal) return;

  const titleEl = document.getElementById("career-detail-title");
  const iconEl = document.getElementById("career-detail-icon");
  const headingEl = document.getElementById("career-detail-heading");
  const metaEl = document.getElementById("career-detail-meta");
  const summaryEl = document.getElementById("career-detail-summary");
  const workTitleEl = document.getElementById("career-detail-work-title");
  const learnedTitleEl = document.getElementById("career-detail-learned-title");
  const workListEl = document.getElementById("career-detail-work");
  const learnedListEl = document.getElementById("career-detail-learned");
  const prevBtn = document.getElementById("career-detail-prev");
  const nextBtn = document.getElementById("career-detail-next");
  let activeCareerKey = CAREER_ORDER[0];

  const renderList = (listEl, items) => {
    listEl.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      listEl.appendChild(li);
    });
  };

  const openDetail = (key) => {
    const languageDetails = careerDetails[currentLang] || careerDetails.pt;
    const detail = languageDetails[key];
    if (!detail) return;

    activeCareerKey = key;
    titleEl.textContent = languageDetails.labels.title;
    iconEl.textContent = detail.icon;
    headingEl.textContent = detail.title;
    metaEl.textContent = detail.meta;
    summaryEl.textContent = detail.summary;
    workTitleEl.textContent = languageDetails.labels.work;
    learnedTitleEl.textContent = languageDetails.labels.learned;
    renderList(workListEl, detail.work);
    renderList(learnedListEl, detail.learned);

    modal.classList.add("is-visible");
    modal.setAttribute("aria-hidden", "false");
    const sheet = modal.querySelector(".career-detail-panel__sheet");
    if (sheet) sheet.style.transform = "translateY(0)";
  };

  const openAdjacentDetail = (direction) => {
    const currentIndex = CAREER_ORDER.indexOf(activeCareerKey);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (safeIndex + direction + CAREER_ORDER.length) % CAREER_ORDER.length;
    openDetail(CAREER_ORDER[nextIndex]);
  };

  qsa("[data-career-key]").forEach((card) => {
    const key = card.getAttribute("data-career-key");
    card.addEventListener("click", () => openDetail(key));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDetail(key);
      }
    });
  });

  if (prevBtn) prevBtn.addEventListener("click", () => openAdjacentDetail(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => openAdjacentDetail(1));
}

initLanguage();
initCopyEmail();
initAgeCounter();
initIdeasModals();
initHorizontalScrollNav();
initCareerDetails();
