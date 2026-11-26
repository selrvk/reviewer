(function () {
  "use strict";

  const TOPICS = window.TOPICS || [];
  const CRAM = window.CRAM || {};
  const byId = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
  const LANG = { java: "java", linux: "bash", sql: "sql", amdocs: "plaintext" };

  const main = document.getElementById("main");
  const nav = document.getElementById("nav");
  const searchInput = document.getElementById("search");

  /* ---------------- storage ---------------- */
  const KEY = "amdocs-reviewer:v1";
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { store = {}; }
  function ensure() {
    store.read = store.read || {};
    store.known = store.known || {};
    store.quiz = store.quiz || {};
    store.mock = store.mock || [];
    store.prefs = store.prefs || { qaMode: "list", qaFilter: "all" };
  }
  ensure();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage unavailable */ } }
  function has(bucket, id, i) { return (store[bucket][id] || []).includes(i); }
  function toggle(bucket, id, i, on) {
    const s = new Set(store[bucket][id] || []);
    const next = on === undefined ? !s.has(i) : on;
    next ? s.add(i) : s.delete(i);
    store[bucket][id] = [...s];
    save();
    return next;
  }

  /* ---------------- text helpers ---------------- */
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

  // escape + minimal markdown: `code`, **bold**, *em*
  function inline(s) {
    const codes = [];
    let h = String(s).replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return "\u0000" + (codes.length - 1) + "\u0000"; });
    h = esc(h);
    h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,:;!?]|$)/g, "$1<em>$2</em>");
    return h.replace(/\u0000(\d+)\u0000/g, (_, i) => "<code>" + esc(codes[+i]) + "</code>");
  }

  // multi-line text: lines starting with "- " become a list
  function rich(s) {
    const lines = String(s).split("\n");
    let out = "", list = [], para = [];
    const flushPara = () => { if (para.length) { out += "<p>" + para.map(inline).join("<br>") + "</p>"; para = []; } };
    const flushList = () => { if (list.length) { out += "<ul>" + list.map((l) => "<li>" + inline(l) + "</li>").join("") + "</ul>"; list = []; } };
    lines.forEach((l) => {
      if (/^\s*-\s+/.test(l)) { flushPara(); list.push(l.replace(/^\s*-\s+/, "")); }
      else if (l.trim() === "") { flushPara(); flushList(); }
      else { flushList(); para.push(l); }
    });
    flushPara(); flushList();
    return out;
  }

  function dedent(s) {
    s = String(s).replace(/^\s*\n/, "").replace(/\s+$/, "");
    const lines = s.split("\n");
    const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
    const min = indents.length ? Math.min(...indents) : 0;
    return lines.map((l) => l.slice(min)).join("\n");
  }

  function codeBlock(code, lang) {
    return '<div class="code"><button class="copy" type="button" data-copy>copy</button><pre><code class="language-' +
      (lang || "plaintext") + '">' + esc(dedent(code)) + "</code></pre></div>";
  }

  function renderBlock(b) {
    if (b.p) return "<p>" + inline(b.p) + "</p>";
    if (b.h) return "<h4>" + inline(b.h) + "</h4>";
    if (b.ul) return "<ul>" + b.ul.map((x) => "<li>" + inline(x) + "</li>").join("") + "</ul>";
    if (b.ol) return "<ol>" + b.ol.map((x) => "<li>" + inline(x) + "</li>").join("") + "</ol>";
    if (b.code) return codeBlock(b.code, b.lang);
    if (b.tip) return '<div class="callout"><span class="callout-label">Tip</span><div>' + inline(b.tip) + "</div></div>";
    if (b.warn) return '<div class="callout warn"><span class="callout-label">Careful</span><div>' + inline(b.warn) + "</div></div>";
    if (b.table) {
      const t = b.table;
      return '<div class="table-wrap"><table><thead><tr>' + t.head.map((h) => "<th>" + inline(h) + "</th>").join("") +
        "</tr></thead><tbody>" + t.rows.map((r) => "<tr>" + r.map((c) => "<td>" + inline(c) + "</td>").join("") + "</tr>").join("") +
        "</tbody></table></div>";
    }
    return "";
  }

  function highlight(root) {
    if (!window.hljs) return;
    root.querySelectorAll("pre code").forEach((el) => { try { window.hljs.highlightElement(el); } catch (e) { /* ignore */ } });
  }

  const pad = (n) => String(n).padStart(2, "0");
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const plain = (s) => String(s).replace(/`/g, "").replace(/\*\*/g, "");

  /* ---------------- stats ---------------- */
  function topicStats(t) {
    const read = (store.read[t.id] || []).filter((i) => i < t.notes.length).length;
    const known = (store.known[t.id] || []).filter((i) => i < t.qa.length).length;
    const q = store.quiz[t.id];
    const best = q ? q.best : null;
    const overall = Math.round(((read / t.notes.length) + (known / t.qa.length) + ((best || 0) / 100)) / 3 * 100);
    return { read, known, best, overall };
  }

  /* ---------------- routing ---------------- */
  let keyHandler = null;
  let exam = null;          // mock exam state survives navigation
  let examTick = null;

  function parts() {
    return location.hash.replace(/^#\/?/, "").split("/").map((p) => { try { return decodeURIComponent(p); } catch (e) { return p; } });
  }

  function route() {
    const [a, b, c, d] = parts();
    keyHandler = null;
    document.body.classList.remove("nav-open");
    document.getElementById("scrim").hidden = true;
    document.getElementById("menu-btn").setAttribute("aria-expanded", "false");

    if (a === "t" && byId[b]) renderTopic(byId[b], c || "notes", d);
    else if (a === "mock") renderMock();
    else if (a === "cram") renderCram();
    else if (a === "search") renderSearch(b || "");
    else renderHome();

    if (a !== "search" && document.activeElement !== searchInput) searchInput.value = "";
    renderNav();
  }

  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

  /* ---------------- nav ---------------- */
  function renderNav() {
    const [a, b, c] = parts();
    const item = (href, label, meta, active, cls) =>
      '<a href="' + href + '" class="tree-item ' + (cls || "") + (active ? " active" : "") + '"' + (active ? ' aria-current="page"' : "") + ">" +
      '<span class="tree-label">' + label + "</span>" + (meta ? '<span class="tree-meta">' + meta + "</span>" : "") + "</a>";

    let html = '<div class="tree-root">~/amdocs-review/</div>';
    html += item("#/", "README.md", "", !a || (a !== "t" && a !== "mock" && a !== "cram" && a !== "search"), "file first");
    TOPICS.forEach((t) => {
      const s = topicStats(t);
      const here = a === "t" && b === t.id;
      html += '<div class="tree-dir" style="--accent: var(--' + t.accent + ')">' +
        item("#/t/" + t.id + "/notes", t.dir, s.overall + "%", false, "dir") +
        '<div class="tree-children">' +
        item("#/t/" + t.id + "/notes", "notes.md", s.read + "/" + t.notes.length, here && (c || "notes") === "notes") +
        item("#/t/" + t.id + "/qa", "interview-qa.md", s.known + "/" + t.qa.length, here && c === "qa") +
        item("#/t/" + t.id + "/quiz", "quiz.sh", s.best != null ? "best " + s.best + "%" : t.quiz.length + " q", here && c === "quiz") +
        "</div></div>";
    });
    const lastMock = store.mock[store.mock.length - 1];
    const mockMeta = exam && !exam.done ? '<span class="live">● running</span>' : lastMock ? "last " + lastMock.pct + "%" : "";
    html += item("#/mock", "mock-exam.sh", mockMeta, a === "mock", "file");
    html += item("#/cram", "cram-sheet.txt", "", a === "cram", "file");
    nav.innerHTML = html;
  }

  /* ---------------- home ---------------- */
  function daysLeft() {
    if (!store.date) return null;
    const target = new Date(store.date + "T00:00:00");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  }
  function countdownText() {
    const d = daysLeft();
    if (d === null) return "—";
    if (d < 0) return "done";
    if (d === 0) return "today!";
    return d + (d === 1 ? " day" : " days");
  }

  function renderHome() {
    document.title = "Amdocs Interview Reviewer";
    const overall = Math.round(TOPICS.reduce((acc, t) => acc + topicStats(t).overall, 0) / (TOPICS.length || 1));
    const totalQuiz = TOPICS.reduce((a, t) => a + t.quiz.length, 0);
    const totalQA = TOPICS.reduce((a, t) => a + t.qa.length, 0);

    const card = (t) => {
      const s = topicStats(t);
      return '<article class="card" style="--accent: var(--' + t.accent + ')">' +
        '<div class="card-dir">~/' + t.dir + "</div>" +
        "<h3>" + esc(t.title) + "</h3>" +
        "<p>" + inline(t.blurb) + "</p>" +
        '<div class="meter" role="progressbar" aria-label="' + esc(t.title) + ' progress" aria-valuenow="' + s.overall + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + s.overall + '%"></span></div>' +
        '<dl class="card-stats">' +
        "<div><dt>Notes read</dt><dd>" + s.read + "/" + t.notes.length + "</dd></div>" +
        "<div><dt>Q&amp;A known</dt><dd>" + s.known + "/" + t.qa.length + "</dd></div>" +
        "<div><dt>Best quiz</dt><dd>" + (s.best != null ? s.best + "%" : "—") + "</dd></div>" +
        "</dl>" +
        '<div class="card-actions">' +
        '<a class="btn small" href="#/t/' + t.id + '/notes">Notes</a>' +
        '<a class="btn small" href="#/t/' + t.id + '/qa">Interview Q&amp;A</a>' +
        '<a class="btn small" href="#/t/' + t.id + '/quiz">Quiz</a>' +
        "</div></article>";
    };

    main.innerHTML = '<div class="page">' +
      '<section class="hero">' +
      '<div class="eyebrow"><span class="ps1">~/amdocs-review $</span> <span class="typed">./prepare --interview</span></div>' +
      "<h1>Amdocs interview reviewer: <em>Java, Unix and SQL</em></h1>" +
      '<p class="lede">Candidates most often report these three technical areas, so this reviewer covers each one in depth, then adds the telecom basics and HR questions. Every topic has study notes, interview Q&amp;A you can drill as flashcards, and a quiz with explanations. Progress is saved in this browser.</p>' +
      '<div class="hero-stats">' +
      '<div class="stat"><span class="stat-num">' + overall + '%</span><span class="stat-label">overall progress</span></div>' +
      '<div class="stat"><span class="stat-num">' + totalQA + '</span><span class="stat-label">interview Q&amp;A</span></div>' +
      '<div class="stat"><span class="stat-num">' + totalQuiz + '</span><span class="stat-label">quiz questions</span></div>' +
      '<div class="stat"><span class="stat-num" id="countdown">' + countdownText() + '</span><label class="stat-label" for="idate">until interview' +
      '<input type="date" id="idate" value="' + esc(store.date || "") + '"></label></div>' +
      "</div></section>" +

      '<h2 class="section-title">// topics</h2>' +
      '<section class="cards">' + TOPICS.map(card).join("") + "</section>" +

      '<h2 class="section-title">// suggested routine</h2>' +
      '<ol class="steps">' +
      "<li><strong>Read the notes</strong>Go topic by topic. Tick “Mark as read” as you finish each section.</li>" +
      "<li><strong>Drill the Q&amp;A</strong>Use flashcard mode. Answer out loud before flipping, as you would in the interview.</li>" +
      "<li><strong>Take the quizzes</strong>Read every explanation, then retry only the ones you missed.</li>" +
      "<li><strong>Mock exam + cram</strong>Sit a timed mixed exam the day before. Skim the cram sheet the morning of.</li>" +
      "</ol>" +

      '<div class="cta-row">' +
      '<a class="cta" href="#/mock"><span class="file">./mock-exam.sh</span><strong>Timed mock exam</strong><span>Mixed questions from every topic, one minute each, scored with a per-topic breakdown.</span></a>' +
      '<a class="cta" href="#/cram"><span class="file">cat cram-sheet.txt</span><strong>Last-minute cram sheet</strong><span>The facts most likely to be asked, on one printable page.</span></a>' +
      "</div></div>";

    const idate = document.getElementById("idate");
    idate.addEventListener("change", () => {
      store.date = idate.value || null; save();
      document.getElementById("countdown").textContent = countdownText();
    });
  }

  /* ---------------- topic ---------------- */
  function renderTopic(t, tab, deep) {
    if (!["notes", "qa", "quiz"].includes(tab)) tab = "notes";
    const labels = { notes: "Notes", qa: "Interview Q&A", quiz: "Quiz" };
    document.title = t.title + " · " + labels[tab] + " · Amdocs Reviewer";
    const tabLink = (k, label, count) =>
      '<a href="#/t/' + t.id + "/" + k + '" class="' + (tab === k ? "active" : "") + '"' + (tab === k ? ' aria-current="page"' : "") + ">" +
      label + ' <span class="count">' + count + "</span></a>";

    main.innerHTML = '<div class="page" style="--accent: var(--' + t.accent + ')">' +
      '<header class="topic-head"><div class="eyebrow"><span class="ps1">~/amdocs-review/' + t.dir + "</span></div>" +
      "<h1>" + esc(t.title) + "</h1><p>" + inline(t.blurb) + "</p></header>" +
      '<nav class="tabs" aria-label="' + esc(t.title) + ' sections">' +
      tabLink("notes", "Notes", t.notes.length) +
      tabLink("qa", "Interview Q&amp;A", t.qa.length) +
      tabLink("quiz", "Quiz", t.quiz.length) +
      '</nav><div id="view"></div></div>';

    const view = document.getElementById("view");
    if (tab === "notes") renderNotes(t, view, deep);
    else if (tab === "qa") renderQA(t, view, deep);
    else renderQuizStart(t, view);

    if (deep === undefined) window.scrollTo(0, 0);
  }

  /* ---------------- notes ---------------- */
  function renderNotes(t, el, deep) {
    el.innerHTML = '<div class="notes-layout">' +
      '<nav class="toc" aria-label="Contents"><div class="toc-title">contents</div>' +
      t.notes.map((s, i) => '<a href="#/t/' + t.id + "/notes/" + i + '" data-sec="' + i + '" class="' + (has("read", t.id, i) ? "is-read" : "") + '">' +
        '<span class="toc-num"><span>' + pad(i + 1) + "</span></span>" + esc(s.title) + "</a>").join("") +
      "</nav>" +
      '<div class="notes">' +
      t.notes.map((s, i) => {
        const on = has("read", t.id, i);
        return '<section class="note" id="sec-' + i + '" aria-labelledby="sec-h-' + i + '">' +
          '<header class="note-head"><span class="note-num">' + pad(i + 1) + '</span><h2 id="sec-h-' + i + '">' + esc(s.title) + "</h2>" +
          '<button type="button" class="read-toggle' + (on ? " on" : "") + '" data-read="' + i + '" aria-pressed="' + on + '">' + (on ? "✓ Read" : "Mark as read") + "</button></header>" +
          s.blocks.map(renderBlock).join("") + "</section>";
      }).join("") +
      "</div></div>";

    highlight(el);

    el.querySelector(".toc").addEventListener("click", (e) => {
      const a = e.target.closest("a[data-sec]");
      if (!a) return;
      e.preventDefault();
      const sec = document.getElementById("sec-" + a.dataset.sec);
      sec.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", a.getAttribute("href"));
    });

    el.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-read]");
      if (!btn) return;
      const i = +btn.dataset.read;
      const on = toggle("read", t.id, i);
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", on);
      btn.textContent = on ? "✓ Read" : "Mark as read";
      el.querySelector('.toc a[data-sec="' + i + '"]').classList.toggle("is-read", on);
      renderNav();
    });

    if (deep !== undefined) {
      const sec = document.getElementById("sec-" + deep);
      if (sec) requestAnimationFrame(() => sec.scrollIntoView({ block: "start" }));
    }
  }

  /* ---------------- Q&A ---------------- */
  function renderQA(t, el, deep) {
    if (deep !== undefined) store.prefs.qaMode = "list";
    const mode = store.prefs.qaMode;
    const filter = store.prefs.qaFilter;
    const knownCount = t.qa.filter((_, i) => has("known", t.id, i)).length;
    const items = t.qa.map((x, i) => Object.assign({ i }, x)).filter((x) => filter === "all" || !has("known", t.id, x.i));

    el.innerHTML = '<div class="toolbar">' +
      '<div class="seg" role="group" aria-label="View mode">' +
      '<button type="button" data-mode="list" aria-pressed="' + (mode === "list") + '">List</button>' +
      '<button type="button" data-mode="flash" aria-pressed="' + (mode === "flash") + '">Flashcards</button></div>' +
      '<div class="seg" role="group" aria-label="Filter">' +
      '<button type="button" data-filter="all" aria-pressed="' + (filter === "all") + '">All ' + t.qa.length + "</button>" +
      '<button type="button" data-filter="review" aria-pressed="' + (filter === "review") + '">To review ' + (t.qa.length - knownCount) + "</button></div>" +
      '<span class="spacer"></span>' +
      (mode === "list" ? '<button type="button" class="btn small" data-expand>Expand all</button><button type="button" class="btn small" data-collapse>Collapse all</button>' : "") +
      '</div><div id="qa-view"></div>';

    el.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { store.prefs.qaMode = b.dataset.mode; save(); renderQA(t, el); }));
    el.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => { store.prefs.qaFilter = b.dataset.filter; save(); renderQA(t, el); }));

    const qv = el.querySelector("#qa-view");
    if (!items.length) {
      qv.innerHTML = '<div class="empty"><div class="big">✓</div><p><strong>You’ve marked every question in this topic as known.</strong></p>' +
        '<button class="btn" type="button" data-showall>Show all questions</button></div>';
      qv.querySelector("[data-showall]").addEventListener("click", () => { store.prefs.qaFilter = "all"; save(); renderQA(t, el); });
      return;
    }
    if (mode === "flash") return renderFlash(t, qv, items, () => renderQA(t, el));

    qv.innerHTML = items.map((x) => {
      const k = has("known", t.id, x.i);
      return '<details class="qa" id="qa-' + x.i + '"' + (String(x.i) === String(deep) ? " open" : "") + ">" +
        '<summary><span class="qa-num">Q' + (x.i + 1) + '</span><span class="qa-q">' + inline(x.q) + "</span>" +
        '<span class="qa-known" data-badge="' + x.i + '"' + (k ? "" : " hidden") + ">✓ known</span></summary>" +
        '<div class="qa-body">' + rich(x.a) + (x.code ? codeBlock(x.code, x.lang) : "") +
        '<div class="qa-foot"><button type="button" class="btn small" data-known="' + x.i + '" aria-pressed="' + k + '">' + (k ? "✓ Known · undo" : "I know this") + "</button></div>" +
        "</div></details>";
    }).join("");
    highlight(qv);

    qv.addEventListener("click", (e) => {
      const b = e.target.closest("[data-known]");
      if (!b) return;
      const i = +b.dataset.known;
      const on = toggle("known", t.id, i);
      b.textContent = on ? "✓ Known · undo" : "I know this";
      b.setAttribute("aria-pressed", on);
      qv.querySelector('[data-badge="' + i + '"]').hidden = !on;
      if (on) b.closest("details").open = false;
      renderNav();
    });
    const ex = el.querySelector("[data-expand]"), co = el.querySelector("[data-collapse]");
    if (ex) ex.addEventListener("click", () => qv.querySelectorAll("details").forEach((d) => (d.open = true)));
    if (co) co.addEventListener("click", () => qv.querySelectorAll("details").forEach((d) => (d.open = false)));

    if (deep !== undefined) {
      const d = document.getElementById("qa-" + deep);
      if (d) requestAnimationFrame(() => d.scrollIntoView({ block: "center" }));
    }
  }

  function renderFlash(t, el, items, rerender) {
    let deck = items.slice();
    let pos = 0, flipped = false;

    function draw() {
      if (pos >= deck.length) {
        const knownNow = t.qa.filter((_, i) => has("known", t.id, i)).length;
        el.innerHTML = '<div class="empty"><div class="big">🎉</div><p><strong>End of deck.</strong> You know ' + knownNow + " of " + t.qa.length + " questions in this topic.</p>" +
          '<div class="flash-actions"><button class="btn" type="button" data-restart>Go again</button>' +
          '<button class="btn primary" type="button" data-review>Review only unknown</button></div></div>';
        el.querySelector("[data-restart]").addEventListener("click", () => { pos = 0; flipped = false; draw(); });
        el.querySelector("[data-review]").addEventListener("click", () => { store.prefs.qaFilter = "review"; save(); rerender(); });
        return;
      }
      const x = deck[pos];
      const k = has("known", t.id, x.i);
      el.innerHTML = '<div class="flash">' +
        '<div class="flash-meta"><span>card ' + (pos + 1) + " / " + deck.length + "</span>" +
        '<button type="button" class="btn small" data-shuffle>Shuffle</button></div>' +
        '<button type="button" class="flash-card" data-flip aria-live="polite">' +
        (flipped
          ? '<span class="flash-side">answer · Q' + (x.i + 1) + (k ? " · ✓ known" : "") + '</span><div class="flash-a">' + rich(x.a) + (x.code ? codeBlock(x.code, x.lang) : "") + "</div>"
          : '<span class="flash-side">question · Q' + (x.i + 1) + (k ? " · ✓ known" : "") + '</span><div class="flash-q">' + inline(x.q) + '</div><span class="flash-hint">Answer out loud, then tap to flip</span>') +
        "</button>" +
        '<div class="flash-actions">' +
        '<button type="button" class="btn" data-prev ' + (pos === 0 ? "disabled" : "") + ' aria-label="Previous card">←</button>' +
        '<button type="button" class="btn" data-again>Still learning</button>' +
        '<button type="button" class="btn know" data-know>Know it ✓</button>' +
        '<button type="button" class="btn" data-next aria-label="Next card">→</button>' +
        "</div>" +
        '<p class="kbd-hint"><kbd>Space</kbd> flip · <kbd>←</kbd> <kbd>→</kbd> move · <kbd>K</kbd> know it · <kbd>L</kbd> still learning</p></div>';
      highlight(el);
      el.querySelector("[data-flip]").addEventListener("click", (e) => { if (e.target.closest("[data-copy]")) return; flip(); });
      el.querySelector("[data-prev]").addEventListener("click", prev);
      el.querySelector("[data-next]").addEventListener("click", next);
      el.querySelector("[data-know]").addEventListener("click", know);
      el.querySelector("[data-again]").addEventListener("click", again);
      el.querySelector("[data-shuffle]").addEventListener("click", () => { deck = shuffle(deck); pos = 0; flipped = false; draw(); });
    }
    const flip = () => { flipped = !flipped; draw(); };
    const next = () => { pos++; flipped = false; draw(); };
    const prev = () => { if (pos > 0) { pos--; flipped = false; draw(); } };
    const know = () => { toggle("known", t.id, deck[pos].i, true); renderNav(); next(); };
    const again = () => { toggle("known", t.id, deck[pos].i, false); renderNav(); next(); };

    keyHandler = (e) => {
      if (pos >= deck.length) return;
      if ((e.key === " " || e.key === "Enter") && e.target instanceof HTMLButtonElement) return; // native click handles it
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); }
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key.toLowerCase() === "k") know();
      else if (e.key.toLowerCase() === "l") again();
    };
    draw();
  }

  /* ---------------- quiz (topic) ---------------- */
  function renderQuizStart(t, el) {
    const q = store.quiz[t.id];
    let count = Math.min(20, t.quiz.length);
    const counts = [10, 20, t.quiz.length].filter((n, i, a) => n <= t.quiz.length && a.indexOf(n) === i);

    el.innerHTML = '<div class="panel quiz-start">' +
      "<h2>" + esc(t.title) + " quiz</h2>" +
      '<p class="sub">' + t.quiz.length + " questions in the bank. You get instant feedback and an explanation after every answer.</p>" +
      '<div class="field"><span class="field-label">Number of questions</span><div class="seg" role="group" aria-label="Number of questions">' +
      counts.map((n) => '<button type="button" data-count="' + n + '" aria-pressed="' + (n === count) + '">' + (n === t.quiz.length ? "All " + n : n) + "</button>").join("") +
      "</div></div>" +
      '<label class="check"><input type="checkbox" id="q-shuffle" checked> Shuffle question order</label>' +
      '<button type="button" class="btn primary" data-start>Start quiz →</button>' +
      (q ? '<div class="history">Best score <strong>' + q.best + "%</strong> · Last <strong>" + q.last + "%</strong> · " + q.attempts + " attempt" + (q.attempts === 1 ? "" : "s") + "</div>" : "") +
      "</div>";

    el.querySelectorAll("[data-count]").forEach((b) => b.addEventListener("click", () => {
      count = +b.dataset.count;
      el.querySelectorAll("[data-count]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    }));
    el.querySelector("[data-start]").addEventListener("click", () => {
      let qs = t.quiz.map((x, i) => Object.assign({ i, topic: t.id }, x));
      if (el.querySelector("#q-shuffle").checked) qs = shuffle(qs);
      runQuiz(t, el, qs.slice(0, count));
    });
  }

  function runQuiz(t, el, qs) {
    let i = 0, score = 0;
    const answers = [];

    function show() {
      const q = qs[i];
      el.innerHTML = '<div class="quiz">' +
        '<div class="quiz-top"><span>question ' + (i + 1) + " / " + qs.length + "</span><span>" + score + " correct</span></div>" +
        '<div class="meter"><span style="width:' + pct(i, qs.length) + '%"></span></div>' +
        '<p class="q-text">' + inline(q.q) + "</p>" + (q.code ? codeBlock(q.code, q.lang || LANG[q.topic]) : "") +
        '<div class="options" role="group" aria-label="Answer options">' + q.options.map((o, k) =>
          '<button type="button" class="option" data-opt="' + k + '"><span class="opt-key">' + "ABCD"[k] + "</span><span>" + inline(o) + "</span></button>").join("") +
        "</div>" +
        '<div class="feedback" aria-live="polite" hidden></div>' +
        '<div class="quiz-nav"><button type="button" class="btn" data-quit>Quit</button>' +
        '<button type="button" class="btn primary" data-next hidden>' + (i + 1 === qs.length ? "See results" : "Next →") + "</button></div>" +
        '<p class="kbd-hint"><kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> to answer · <kbd>Enter</kbd> next</p></div>';
      highlight(el);
      el.querySelectorAll("[data-opt]").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.opt)));
      el.querySelector("[data-next]").addEventListener("click", next);
      el.querySelector("[data-quit]").addEventListener("click", () => renderQuizStart(t, el));
      el.querySelector(".q-text").scrollIntoView({ block: "nearest" });
    }

    function choose(k) {
      if (answers[i] !== undefined) return;
      const q = qs[i];
      const ok = k === q.answer;
      if (ok) score++;
      answers[i] = k;
      el.querySelectorAll("[data-opt]").forEach((b) => {
        const n = +b.dataset.opt;
        b.disabled = true;
        if (n === q.answer) b.classList.add("correct");
        else if (n === k) b.classList.add("wrong");
        else b.classList.add("dim");
      });
      const fb = el.querySelector(".feedback");
      fb.hidden = false;
      fb.className = "feedback " + (ok ? "good" : "bad");
      fb.innerHTML = '<span class="verdict">' + (ok ? "Correct" : "Not quite. Answer: " + "ABCD"[q.answer]) + "</span>" + inline(q.explain || "");
      el.querySelector(".quiz-top span:last-child").textContent = score + " correct";
      const nb = el.querySelector("[data-next]");
      nb.hidden = false;
      nb.focus({ preventScroll: true });
    }

    function next() {
      if (answers[i] === undefined) return;
      i++;
      if (i < qs.length) show(); else finish();
    }

    function finish() {
      keyHandler = null;
      const p = pct(score, qs.length);
      const rec = store.quiz[t.id] || { best: 0, last: 0, attempts: 0 };
      rec.best = Math.max(rec.best, p); rec.last = p; rec.attempts++;
      store.quiz[t.id] = rec; save(); renderNav();
      const wrong = qs.filter((q, n) => answers[n] !== q.answer);
      el.innerHTML = resultsHTML(p, score, qs.length, verdict(p), null, qs, answers,
        '<button type="button" class="btn primary" data-retry>Retry quiz</button>' +
        (wrong.length ? '<button type="button" class="btn" data-wrong>Retry the ' + wrong.length + " I missed</button>" : "") +
        '<a class="btn" href="#/t/' + t.id + '/notes">Back to notes</a>');
      highlight(el);
      el.querySelector("[data-retry]").addEventListener("click", () => renderQuizStart(t, el));
      const w = el.querySelector("[data-wrong]");
      if (w) w.addEventListener("click", () => runQuiz(t, el, shuffle(wrong)));
      window.scrollTo(0, 0);
    }

    keyHandler = (e) => {
      const map = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 };
      const k = map[e.key.toLowerCase()];
      if (k !== undefined && answers[i] === undefined && k < qs[i].options.length) choose(k);
      else if (e.key === "Enter" && answers[i] !== undefined && !(e.target instanceof HTMLButtonElement)) next();
    };
    show();
  }

  function verdict(p) {
    if (p >= 90) return "Excellent. You’re interview-ready on this.";
    if (p >= 75) return "Solid. Review the explanations below for the few you missed.";
    if (p >= 50) return "Getting there. Re-read the notes for the topics you missed, then retry.";
    return "Worth another pass through the notes before retrying.";
  }

  function resultsHTML(p, score, total, msg, extraHead, qs, answers, actions) {
    const order = qs.map((q, n) => n).sort((a, b) => (answers[a] === qs[a].answer) - (answers[b] === qs[b].answer));
    return '<div class="results">' +
      '<div class="results-head"><div class="ring" style="--p:' + p + '"><span>' + p + "%</span></div>" +
      "<div><h2>" + score + " / " + total + " correct</h2><p>" + msg + "</p>" +
      '<div class="results-actions no-print">' + actions + "</div></div></div>" +
      (extraHead || "") +
      '<section class="review"><h3>Review: misses first</h3>' +
      order.map((n) => {
        const q = qs[n], a = answers[n], ok = a === q.answer;
        const topic = byId[q.topic];
        return '<div class="review-item' + (ok ? "" : " is-wrong") + '" style="--accent: var(--' + (topic ? topic.accent : "linux") + ')">' +
          (topic ? '<span class="q-tag">' + esc(topic.title) + "</span>" : "") +
          '<p class="q-text">' + inline(q.q) + "</p>" + (q.code ? codeBlock(q.code, q.lang || LANG[q.topic]) : "") +
          '<p class="review-ans">Your answer: <b class="' + (ok ? "ok" : "no") + '">' + (a === undefined || a === null ? "(no answer)" : "ABCD"[a] + ". " + inline(q.options[a])) + "</b></p>" +
          (ok ? "" : '<p class="review-ans">Correct: <b class="ok">' + "ABCD"[q.answer] + ". " + inline(q.options[q.answer]) + "</b></p>") +
          (q.explain ? '<p class="review-explain">' + inline(q.explain) + "</p>" : "") +
          "</div>";
      }).join("") + "</section></div>";
  }

  /* ---------------- mock exam ---------------- */
  function buildExam(topicIds, count) {
    const pools = topicIds.map((id) => shuffle(byId[id].quiz.map((x, i) => Object.assign({ i, topic: id }, x))));
    const out = [];
    let k = 0;
    while (out.length < count && pools.some((p) => p.length)) {
      const p = pools[k % pools.length];
      if (p.length) out.push(p.pop());
      k++;
    }
    return shuffle(out);
  }

  const fmt = (s) => pad(Math.floor(s / 60)) + ":" + pad(s % 60);

  function renderMock() {
    document.title = "Mock exam · Amdocs Reviewer";
    if (exam) return exam.done ? renderMockResults() : renderExam();

    const all = TOPICS.reduce((a, t) => a + t.quiz.length, 0);
    let count = 30;
    main.innerHTML = '<div class="page">' +
      '<header class="topic-head"><div class="eyebrow"><span class="ps1">~/amdocs-review $</span> ./mock-exam.sh</div>' +
      "<h1>Timed mock exam</h1><p>Questions are drawn evenly from the topics you pick. You get <strong>1 minute per question</strong> and no feedback until you submit, like the real online assessment. Flag questions to come back to them.</p></header>" +
      '<div class="panel quiz-start">' +
      '<div class="field"><span class="field-label">Topics</span><div class="chips">' +
      TOPICS.map((t) => '<label class="chip-check"><input type="checkbox" name="mt" value="' + t.id + '" checked><span class="dot" style="background: var(--' + t.accent + ')"></span>' + esc(t.title) + "</label>").join("") +
      "</div></div>" +
      '<div class="field"><span class="field-label">Questions</span><div class="seg" role="group" aria-label="Number of questions">' +
      [20, 30, 50].map((n) => '<button type="button" data-count="' + n + '" aria-pressed="' + (n === count) + '">' + n + " · " + n + " min</button>").join("") +
      "</div></div>" +
      '<button type="button" class="btn primary" data-start>Start exam →</button>' +
      (store.mock.length ? '<div class="history">Recent: ' + store.mock.slice(-5).reverse().map((m) =>
        "<strong>" + m.pct + "%</strong> (" + m.score + "/" + m.total + ", " + esc(m.date) + ")").join(" · ") + "</div>" : "") +
      '<p class="toolbar-note" style="margin-top:14px">' + all + " questions available across all topics.</p>" +
      "</div></div>";

    main.querySelectorAll("[data-count]").forEach((b) => b.addEventListener("click", () => {
      count = +b.dataset.count;
      main.querySelectorAll("[data-count]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    }));
    main.querySelector("[data-start]").addEventListener("click", () => {
      const ids = [...main.querySelectorAll('input[name="mt"]:checked')].map((x) => x.value);
      if (!ids.length) { alert("Pick at least one topic."); return; }
      const qs = buildExam(ids, count);
      exam = { qs, answers: new Array(qs.length).fill(null), flags: new Set(), cur: 0, total: qs.length * 60, left: qs.length * 60, done: false };
      clearInterval(examTick);
      examTick = setInterval(() => {
        if (!exam || exam.done) { clearInterval(examTick); return; }
        exam.left--;
        const tEl = document.getElementById("timer");
        if (tEl) { tEl.textContent = fmt(Math.max(exam.left, 0)); tEl.classList.toggle("low", exam.left <= 60); }
        if (exam.left <= 0) submitExam(true);
      }, 1000);
      renderExam();
      renderNav();
    });
  }

  function renderExam() {
    const e = exam, q = e.qs[e.cur];
    const answered = e.answers.filter((a) => a !== null).length;
    const topic = byId[q.topic];
    main.innerHTML = '<div class="page"><div class="quiz" style="max-width:860px">' +
      '<div class="exam-bar"><span class="timer' + (e.left <= 60 ? " low" : "") + '" id="timer" aria-label="Time left">' + fmt(e.left) + "</span>" +
      '<span class="answered">' + answered + " / " + e.qs.length + " answered</span><span class=\"spacer\"></span>" +
      '<button type="button" class="btn small" data-abandon>Abandon</button>' +
      '<button type="button" class="btn primary small" data-submit>Submit exam</button></div>' +
      '<div style="--accent: var(--' + topic.accent + ')"><span class="q-tag">Q' + (e.cur + 1) + " · " + esc(topic.title) + "</span>" +
      '<p class="q-text">' + inline(q.q) + "</p>" + (q.code ? codeBlock(q.code, q.lang || LANG[q.topic]) : "") +
      '<div class="options" role="group" aria-label="Answer options">' + q.options.map((o, k) =>
        '<button type="button" class="option' + (e.answers[e.cur] === k ? " chosen" : "") + '" data-opt="' + k + '" aria-pressed="' + (e.answers[e.cur] === k) + '"><span class="opt-key">' + "ABCD"[k] + "</span><span>" + inline(o) + "</span></button>").join("") +
      "</div></div>" +
      '<div class="quiz-nav"><button type="button" class="btn" data-prev ' + (e.cur === 0 ? "disabled" : "") + ">← Prev</button>" +
      '<button type="button" class="btn flag-btn" data-flag aria-pressed="' + e.flags.has(e.cur) + '">' + (e.flags.has(e.cur) ? "⚑ Flagged" : "⚐ Flag for review") + "</button>" +
      '<button type="button" class="btn primary" data-next ' + (e.cur === e.qs.length - 1 ? "disabled" : "") + ">Next →</button></div>" +
      '<div class="qgrid" aria-label="Jump to question">' + e.qs.map((_, n) =>
        '<button type="button" data-jump="' + n + '" class="' + (e.answers[n] !== null ? "done " : "") + (e.flags.has(n) ? "flagged " : "") + (n === e.cur ? "current" : "") + '" aria-label="Question ' + (n + 1) + '">' + (n + 1) + "</button>").join("") +
      "</div>" +
      '<div class="legend"><span>■ answered</span><span style="color:var(--warn)">● flagged</span><span><kbd>1</kbd>–<kbd>4</kbd> answer · <kbd>←</kbd> <kbd>→</kbd> navigate · <kbd>F</kbd> flag</span></div>' +
      "</div></div>";
    highlight(main);

    const moveTo = (n) => { e.cur = Math.max(0, Math.min(e.qs.length - 1, n)); renderExam(); };
    main.querySelectorAll("[data-opt]").forEach((b) => b.addEventListener("click", () => { e.answers[e.cur] = +b.dataset.opt; renderExam(); }));
    main.querySelector("[data-prev]").addEventListener("click", () => moveTo(e.cur - 1));
    main.querySelector("[data-next]").addEventListener("click", () => moveTo(e.cur + 1));
    main.querySelector("[data-flag]").addEventListener("click", () => { e.flags.has(e.cur) ? e.flags.delete(e.cur) : e.flags.add(e.cur); renderExam(); });
    main.querySelectorAll("[data-jump]").forEach((b) => b.addEventListener("click", () => moveTo(+b.dataset.jump)));
    main.querySelector("[data-submit]").addEventListener("click", () => {
      const left = e.answers.filter((a) => a === null).length;
      if (confirm(left ? "You have " + left + " unanswered question" + (left === 1 ? "" : "s") + ". Submit anyway?" : "Submit the exam?")) submitExam(false);
    });
    main.querySelector("[data-abandon]").addEventListener("click", () => {
      if (confirm("Abandon this exam? Nothing will be saved.")) { clearInterval(examTick); exam = null; renderMock(); renderNav(); }
    });
    keyHandler = (ev) => {
      const map = { "1": 0, "2": 1, "3": 2, "4": 3 };
      if (map[ev.key] !== undefined && map[ev.key] < q.options.length) { e.answers[e.cur] = map[ev.key]; renderExam(); }
      else if (ev.key === "ArrowRight") moveTo(e.cur + 1);
      else if (ev.key === "ArrowLeft") moveTo(e.cur - 1);
      else if (ev.key.toLowerCase() === "f") { e.flags.has(e.cur) ? e.flags.delete(e.cur) : e.flags.add(e.cur); renderExam(); }
    };
  }

  function submitExam(timeUp) {
    if (!exam || exam.done) return;
    clearInterval(examTick);
    exam.done = true;
    exam.timeUp = timeUp;
    exam.used = exam.total - Math.max(exam.left, 0);
    exam.score = exam.qs.filter((q, n) => exam.answers[n] === q.answer).length;
    exam.pct = pct(exam.score, exam.qs.length);
    const d = new Date();
    store.mock.push({ pct: exam.pct, score: exam.score, total: exam.qs.length, date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) });
    store.mock = store.mock.slice(-20);
    save();
    renderNav();
    if (parts()[0] === "mock") renderMockResults();
  }

  function renderMockResults() {
    const e = exam;
    keyHandler = null;
    const byTopic = {};
    e.qs.forEach((q, n) => {
      byTopic[q.topic] = byTopic[q.topic] || { right: 0, total: 0 };
      byTopic[q.topic].total++;
      if (e.answers[n] === q.answer) byTopic[q.topic].right++;
    });
    const breakdown = '<section class="breakdown" aria-label="Score by topic">' + Object.keys(byTopic).map((id) => {
      const b = byTopic[id], t = byId[id], p = pct(b.right, b.total);
      return '<div class="breakdown-row" style="--accent: var(--' + t.accent + ')"><span>' + esc(t.title) + '</span><div class="meter"><span style="width:' + p + '%"></span></div><span class="num">' + b.right + "/" + b.total + "</span></div>";
    }).join("") + "</section>";

    const weakest = Object.keys(byTopic).sort((a, b) => byTopic[a].right / byTopic[a].total - byTopic[b].right / byTopic[b].total)[0];
    const msg = (e.timeUp ? "Time’s up! " : "") + "Finished in " + fmt(e.used) + ". " + verdict(e.pct) +
      (weakest && byTopic[weakest].right < byTopic[weakest].total ? " Weakest area: <strong>" + esc(byId[weakest].title) + "</strong>." : "");

    main.innerHTML = '<div class="page">' +
      '<header class="topic-head"><div class="eyebrow"><span class="ps1">~/amdocs-review $</span> ./mock-exam.sh --results</div></header>' +
      resultsHTML(e.pct, e.score, e.qs.length, msg, breakdown, e.qs, e.answers,
        '<button type="button" class="btn primary" data-new>New exam</button>' +
        (weakest ? '<a class="btn" href="#/t/' + weakest + '/notes">Study ' + esc(byId[weakest].title) + "</a>" : "")) +
      "</div>";
    highlight(main);
    main.querySelector("[data-new]").addEventListener("click", () => { exam = null; renderMock(); renderNav(); });
    window.scrollTo(0, 0);
  }

  /* ---------------- cram ---------------- */
  function renderCram() {
    document.title = "Cram sheet · Amdocs Reviewer";
    main.innerHTML = '<div class="page">' +
      '<header class="topic-head"><div class="eyebrow"><span class="ps1">~/amdocs-review $</span> cat cram-sheet.txt</div>' +
      "<h1>Last-minute cram sheet</h1><p>The facts that come up most, one line each. Read it the morning of the interview, or print it.</p></header>" +
      '<div class="toolbar no-print"><button type="button" class="btn small" onclick="window.print()">Print / save as PDF</button></div>' +
      '<div class="cram-grid">' + TOPICS.map((t) =>
        '<section class="cram-col" style="--accent: var(--' + t.accent + ')"><h2>' + esc(t.title) + "<span>" + t.dir + "</span></h2><ol>" +
        (CRAM[t.id] || []).map((x) => "<li>" + inline(x) + "</li>").join("") + "</ol></section>").join("") +
      "</div></div>";
    window.scrollTo(0, 0);
  }

  /* ---------------- search ---------------- */
  function blockText(b) {
    if (b.p || b.h || b.tip || b.warn) return b.p || b.h || b.tip || b.warn;
    if (b.ul || b.ol) return (b.ul || b.ol).join(" ");
    if (b.code) return b.code;
    if (b.table) return b.table.head.concat(...b.table.rows).join(" ");
    return "";
  }

  function snippet(text, q) {
    const flat = plain(text).replace(/\s+/g, " ").trim();
    const idx = flat.toLowerCase().indexOf(q);
    if (idx < 0) return esc(flat.slice(0, 150)) + (flat.length > 150 ? "…" : "");
    const start = Math.max(0, idx - 60);
    const s = (start ? "…" : "") + flat.slice(start, idx + q.length + 90) + (idx + q.length + 90 < flat.length ? "…" : "");
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
    let out = "", last = 0, m;
    while ((m = re.exec(s))) { out += esc(s.slice(last, m.index)) + "<mark>" + esc(m[0]) + "</mark>"; last = m.index + m[0].length; }
    return out + esc(s.slice(last));
  }

  function renderSearch(raw) {
    document.title = "Search · Amdocs Reviewer";
    const q = raw.trim().toLowerCase();
    if (document.activeElement !== searchInput) searchInput.value = raw;
    if (q.length < 2) {
      main.innerHTML = '<div class="page"><div class="empty"><p>Type at least 2 characters to search notes, interview questions and quizzes.</p></div></div>';
      return;
    }
    let total = 0;
    const groups = TOPICS.map((t) => {
      const res = [];
      t.notes.forEach((s, i) => {
        const text = s.title + " " + s.blocks.map(blockText).join(" ");
        if (text.toLowerCase().includes(q)) res.push({ kind: "notes", title: s.title, href: "#/t/" + t.id + "/notes/" + i, snip: snippet(s.blocks.map(blockText).join(" "), q) });
      });
      t.qa.forEach((x, i) => {
        const text = x.q + " " + x.a + " " + (x.code || "");
        if (text.toLowerCase().includes(q)) res.push({ kind: "interview q&a", title: plain(x.q), href: "#/t/" + t.id + "/qa/" + i, snip: snippet(x.a, q) });
      });
      t.quiz.forEach((x) => {
        const text = x.q + " " + (x.code || "") + " " + x.options.join(" ") + " " + (x.explain || "");
        if (text.toLowerCase().includes(q)) res.push({ kind: "quiz", title: plain(x.q), href: "#/t/" + t.id + "/quiz", snip: snippet((x.code ? x.code + " " : "") + (x.explain || ""), q) });
      });
      total += res.length;
      return { t, res };
    }).filter((g) => g.res.length);

    main.innerHTML = '<div class="page">' +
      '<header class="topic-head"><div class="eyebrow"><span class="ps1">~/amdocs-review $</span> grep -ri "' + esc(raw) + '" .</div>' +
      "<h1>" + total + " result" + (total === 1 ? "" : "s") + "</h1></header>" +
      (groups.length ? groups.map((g) =>
        '<section class="result-group" style="--accent: var(--' + g.t.accent + ')"><h2>' + g.t.dir + " (" + g.res.length + ")</h2>" +
        g.res.slice(0, 30).map((r) => '<a class="result" href="' + r.href + '"><span class="result-kind">' + r.kind + '</span><span class="result-title">' + esc(r.title) + '</span><span class="result-snip">' + r.snip + "</span></a>").join("") +
        "</section>").join("") : '<div class="empty"><p>No matches. Try a different word, like <code>join</code>, <code>chmod</code> or <code>HashMap</code>.</p></div>') +
      "</div>";
  }

  /* ---------------- global wiring ---------------- */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    e.stopPropagation();
    const text = btn.parentElement.querySelector("pre").innerText;
    const done = () => { btn.textContent = "copied"; setTimeout(() => (btn.textContent = "copy"), 1200); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => {});
  }, true);

  document.addEventListener("keydown", (e) => {
    const typing = e.target.matches && e.target.matches("input, textarea, select");
    if (e.key === "/" && !typing) { e.preventDefault(); searchInput.focus(); searchInput.select(); return; }
    if (e.key === "Escape" && document.activeElement === searchInput) { searchInput.blur(); return; }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (keyHandler) keyHandler(e);
  });

  let searchTimer = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const v = searchInput.value;
      if (v.trim()) location.replace("#/search/" + encodeURIComponent(v));
      else if (parts()[0] === "search") location.replace("#/");
    }, 160);
  });

  // theme
  const themeBtn = document.getElementById("theme-btn");
  function currentTheme() {
    return store.theme || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  function paintThemeBtn() { themeBtn.textContent = currentTheme() === "dark" ? "☀ Light mode" : "☾ Dark mode"; }
  themeBtn.addEventListener("click", () => {
    store.theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", store.theme);
    save(); paintThemeBtn();
  });
  paintThemeBtn();

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (!confirm("Reset all progress (read notes, known cards, quiz and mock scores)?")) return;
    const theme = store.theme, date = store.date;
    store = { theme, date };
    ensure(); save(); route();
  });

  // mobile menu
  const menuBtn = document.getElementById("menu-btn");
  const scrim = document.getElementById("scrim");
  menuBtn.addEventListener("click", () => {
    const open = !document.body.classList.contains("nav-open");
    document.body.classList.toggle("nav-open", open);
    scrim.hidden = !open;
    menuBtn.setAttribute("aria-expanded", open);
  });
  scrim.addEventListener("click", () => { document.body.classList.remove("nav-open"); scrim.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); });

  window.addEventListener("hashchange", route);
  route();
})();
