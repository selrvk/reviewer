/* Coding practice: Java problems (compiled and run in the browser by CheerpJ, a WebAssembly JVM)
   and SQL problems (run on SQLite in the browser via sql.js). app.js calls createPractice(api). */
window.createPractice = function (api) {
  "use strict";

  const P = window.PRACTICE || {};
  const JAVA = P.java || [];
  const SQLP = P.sql || [];
  const DBS = P.sqlDatabases || {};
  const byJava = Object.fromEntries(JAVA.map((p) => [p.id, p]));
  const bySql = Object.fromEntries(SQLP.map((p) => [p.id, p]));
  const { esc, inline, renderBlock, codeBlock, highlight, dedent } = api;

  const CDN = {
    cm: "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/",
    sqljs: "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/",
    cheerpj: "https://cjrtnc.leaningtech.com/5.0/loader.js"
  };
  const TIME_LIMIT_MS = 4000;
  const MAX_ROWS = 200;
  const STARTER_JAVA = "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n    }\n}\n";
  const DIFF_ORDER = { Easy: 0, Medium: 1, Hard: 2 };

  let viewToken = 0; // bumps on every render so late async results don't paint over a newer page

  /* ---------------- state ---------------- */
  function st() {
    const s = api.store();
    s.code = s.code || {};
    s.code.java = s.code.java || {};
    s.code.sql = s.code.sql || {};
    s.solved = s.solved || {};
    s.solved.java = s.solved.java || {};
    s.solved.sql = s.solved.sql || {};
    s.prefs = s.prefs || {};
    return s;
  }
  function stats() {
    const s = st();
    return {
      javaSolved: JAVA.filter((p) => s.solved.java[p.id]).length, javaTotal: JAVA.length,
      sqlSolved: SQLP.filter((p) => s.solved.sql[p.id]).length, sqlTotal: SQLP.length
    };
  }

  /* ---------------- loaders ---------------- */
  const loaded = {};
  function loadScript(src) {
    if (!loaded[src]) {
      loaded[src] = new Promise((res, rej) => {
        const el = document.createElement("script");
        el.src = src; el.async = true;
        el.onload = res;
        el.onerror = () => { delete loaded[src]; rej(new Error("Could not load " + src)); };
        document.head.appendChild(el);
      });
    }
    return loaded[src];
  }
  function loadCSS(href) {
    if (!loaded[href]) {
      loaded[href] = new Promise((res) => {
        const el = document.createElement("link");
        el.rel = "stylesheet"; el.href = href; el.onload = res; el.onerror = res;
        document.head.appendChild(el);
      });
    }
    return loaded[href];
  }
  let cmPromise = null;
  function loadCodeMirror() {
    if (!cmPromise) {
      cmPromise = (async () => {
        await Promise.all([loadCSS(CDN.cm + "codemirror.min.css"), loadScript(CDN.cm + "codemirror.min.js")]);
        await Promise.all(["mode/clike/clike.min.js", "mode/sql/sql.min.js", "addon/edit/matchbrackets.min.js", "addon/edit/closebrackets.min.js"]
          .map((f) => loadScript(CDN.cm + f)));
        return window.CodeMirror;
      })();
      cmPromise.catch(() => { cmPromise = null; });
    }
    return cmPromise;
  }

  /* ---------------- editor (textarea, upgraded to CodeMirror when it loads) ---------------- */
  function createEditor(host, opts) {
    host.innerHTML = '<textarea class="code-input" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="' + esc(opts.label) + '"></textarea>';
    const ta = host.querySelector("textarea");
    ta.value = opts.value;
    let cm = null;
    const ed = {
      get: () => (cm ? cm.getValue() : ta.value),
      set: (v) => { cm ? cm.setValue(v) : (ta.value = v); },
      focus: () => (cm ? cm.focus() : ta.focus())
    };
    let saveTimer = null;
    const changed = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => opts.onChange(ed.get()), 300); };

    ta.addEventListener("input", changed);
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.setRangeText("    ", s, ta.selectionEnd, "end");
        changed();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.shiftKey ? opts.onSubmit() : opts.onRun();
      }
    });

    loadCodeMirror().then((CM) => {
      if (!CM || !host.isConnected) return;
      const run = () => opts.onRun(), sub = () => opts.onSubmit();
      cm = CM.fromTextArea(ta, {
        mode: opts.mode, lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false,
        matchBrackets: true, autoCloseBrackets: true, lineWrapping: false,
        extraKeys: {
          "Ctrl-Enter": run, "Cmd-Enter": run, "Shift-Ctrl-Enter": sub, "Shift-Cmd-Enter": sub,
          Tab: (c) => (c.somethingSelected() ? c.indentSelection("add") : c.replaceSelection("    ", "end")),
          "Shift-Tab": (c) => c.indentSelection("subtract")
        }
      });
      cm.on("change", changed);
      host.classList.add("has-cm");
    }).catch(() => { /* keep the plain textarea */ });
    return ed;
  }

  /* ---------------- Java runner (CheerpJ) ---------------- */
  let jvmPromise = null, warmPromise = null, jobChain = Promise.resolve(), jobId = 0;
  let runtimeState = { text: "", kind: "" };
  const statusEls = () => document.querySelectorAll("[data-runtime-status]");
  function setRuntime(text, kind) {
    runtimeState = { text, kind: kind || "" };
    statusEls().forEach((el) => { el.textContent = text; el.dataset.kind = kind || ""; });
  }

  function harnessPath() {
    // CheerpJ's /app/ mount maps to this site's web root
    return "/app" + new URL("cheerpj/harness.jar", location.href).pathname;
  }

  function ensureJVM() {
    if (location.protocol === "file:") return Promise.reject(new Error("FILE"));
    if (!jvmPromise) {
      setRuntime("Downloading the Java runtime… (first visit only)", "busy");
      jvmPromise = (async () => {
        await loadScript(CDN.cheerpj);
        await window.cheerpjInit({ version: 17, status: "none" });
      })();
      jvmPromise.then(() => setRuntime("Java runtime ready", "ok"), (e) => {
        jvmPromise = null;
        setRuntime("Java runtime failed to load", "bad");
        throw e;
      });
    }
    return jvmPromise;
  }

  function enqueue(fn) {
    const p = jobChain.then(fn, fn);
    jobChain = p.catch(() => {});
    return p;
  }

  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = (s) => {
    if (!s) return "-";
    const bytes = enc.encode(s);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  const unb64 = (s) => (!s || s === "-" ? "" : dec.decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0))));

  function mainClassOf(code) {
    const m = code.match(/public\s+(?:(?:final|abstract)\s+)*class\s+([A-Za-z_$][\w$]*)/) || code.match(/\bclass\s+([A-Za-z_$][\w$]*)/);
    return m ? m[1] : "Main";
  }

  async function runJavaRaw(code, inputs) {
    await ensureJVM();
    const id = ++jobId;
    const src = code.replace(/^[ \t]*package\s+[\w.]+\s*;/m, (m) => " ".repeat(m.length)); // keep offsets/line numbers
    const stamp = Date.now().toString(36) + id;
    window.cheerpOSAddStringFile("/str/rv" + stamp + ".java", src);
    window.cheerpOSAddStringFile("/str/rv" + stamp + ".in", inputs.length + "\n" + inputs.map(b64).join("\n") + "\n");
    const outPath = "/files/rv/out" + stamp + ".txt";
    await window.cheerpjRunMain("reviewer.Harness", harnessPath(), "/str/rv" + stamp + ".java", "/str/rv" + stamp + ".in", outPath, mainClassOf(src), String(TIME_LIMIT_MS));
    let text = "";
    try { const blob = await window.cjFileBlob(outPath); text = blob ? await blob.text() : ""; } catch (e) { text = ""; }
    if (!text.trim()) throw new Error("The runner produced no result. Try again, or reload the page.");
    const lines = text.trim().split("\n");
    const head = lines[0].split(" ");
    if (head[1] === "ERR") return { compileError: unb64(head[2]), results: [] };
    const results = inputs.map((_, i) => {
      const l = lines[i + 1];
      if (!l) return { status: "EARLYEXIT", ms: 0, out: "", err: "" };
      const p = l.split(" ");
      return { status: p[1], ms: +p[2], out: unb64(p[3]), err: unb64(p[4]) };
    });
    return { compileError: null, results };
  }

  function warmUp() {
    if (!warmPromise) {
      warmPromise = ensureJVM().then(() => {
        setRuntime("Warming up the Java compiler…", "busy");
        return enqueue(() => runJavaRaw("public class Main { public static void main(String[] a) { System.out.print(1); } }", [""]));
      }).then(() => setRuntime("Java ready", "ok"), (e) => { warmPromise = null; throw e; });
      warmPromise.catch(() => {});
    }
    return warmPromise;
  }

  /* ---------------- SQL runner (sql.js) ---------------- */
  let sqlPromise = null;
  function ensureSQL() {
    if (!sqlPromise) {
      sqlPromise = loadScript(CDN.sqljs + "sql-wasm.js").then(() => window.initSqlJs({ locateFile: (f) => CDN.sqljs + f }));
      sqlPromise.catch(() => { sqlPromise = null; });
    }
    return sqlPromise;
  }
  async function openDb(key) {
    const SQL = await ensureSQL();
    const db = new SQL.Database();
    db.exec(dedent(DBS[key].schema));
    db.create_function("NVL", (a, b) => (a === null || a === undefined ? b : a)); // Oracle habit
    return db;
  }
  /** Runs SQL on a fresh copy of the database; returns { columns, values, rowsModified } of the LAST statement. */
  async function runSql(key, text) {
    const db = await openDb(key);
    try {
      const t0 = performance.now();
      const res = db.exec(text);
      const ms = Math.round(performance.now() - t0);
      const last = res[res.length - 1];
      return last ? { columns: last.columns, values: last.values, ms } : { columns: [], values: [], ms, rowsModified: db.getRowsModified(), noResult: true };
    } finally {
      db.close();
    }
  }

  const normVal = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return Math.round(v * 100) / 100;
    const s = String(v);
    return /^-?\d+(\.\d+)?$/.test(s.trim()) ? Math.round(parseFloat(s) * 100) / 100 : s;
  };
  const rowKey = (r) => JSON.stringify(r.map(normVal));

  function compareSql(got, exp, ordered) {
    if (got.noResult) return { ok: false, msg: "Your SQL didn't return any rows. The last statement must be a <code>SELECT</code>." };
    if (got.columns.length !== exp.columns.length) {
      return { ok: false, msg: "Expected <strong>" + exp.columns.length + "</strong> column" + (exp.columns.length === 1 ? "" : "s") + " (" + exp.columns.map(esc).join(", ") + ") but your query returned <strong>" + got.columns.length + "</strong>." };
    }
    if (got.values.length !== exp.values.length) {
      return { ok: false, msg: "Expected <strong>" + exp.values.length + "</strong> row" + (exp.values.length === 1 ? "" : "s") + " but your query returned <strong>" + got.values.length + "</strong>." };
    }
    const gk = got.values.map(rowKey), ek = exp.values.map(rowKey);
    const sameSet = gk.slice().sort().join("\n") === ek.slice().sort().join("\n");
    if (ordered) {
      const i = gk.findIndex((k, n) => k !== ek[n]);
      if (i === -1) return { ok: true };
      if (sameSet) return { ok: false, msg: "The rows are right, but in the wrong <strong>order</strong>. Check your <code>ORDER BY</code>." };
      return { ok: false, msg: "Row " + (i + 1) + " differs. Got <code>" + esc(fmtRow(got.values[i])) + "</code>, expected <code>" + esc(fmtRow(exp.values[i])) + "</code>." };
    }
    if (sameSet) return { ok: true };
    const missing = ek.findIndex((k) => !gk.includes(k));
    return { ok: false, msg: missing >= 0 ? "Missing row <code>" + esc(fmtRow(exp.values[missing])) + "</code>." : "Your rows don't match the expected result." };
  }
  const fmtRow = (r) => "(" + r.map((v) => (v === null ? "NULL" : String(v))).join(", ") + ")";

  function tableHTML(res, opts) {
    opts = opts || {};
    if (!res.columns.length) return "";
    const rows = res.values.slice(0, MAX_ROWS);
    return '<div class="table-wrap result-table"><table><thead><tr>' + res.columns.map((c) => "<th>" + esc(c) + "</th>").join("") + "</tr></thead><tbody>" +
      (rows.length ? rows.map((r) => "<tr>" + r.map((v) => (v === null ? '<td class="null">NULL</td>' : "<td>" + esc(String(v)) + "</td>")).join("") + "</tr>").join("")
        : '<tr><td colspan="' + res.columns.length + '" class="null">(no rows)</td></tr>') +
      "</tbody></table></div>" +
      (res.values.length > MAX_ROWS ? '<p class="muted">Showing ' + MAX_ROWS + " of " + res.values.length + " rows.</p>" : "") +
      (opts.caption ? '<p class="muted">' + opts.caption + "</p>" : "");
  }

  async function schemaHTML(key) {
    const db = await openDb(key);
    try {
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY rowid")[0].values.map((r) => r[0]);
      return tables.map((t) => {
        const cols = db.exec("PRAGMA table_info(" + t + ")")[0].values; // cid, name, type, notnull, dflt, pk
        const data = db.exec("SELECT * FROM " + t)[0] || { columns: cols.map((c) => c[1]), values: [] };
        return '<details class="schema-table"><summary><code>' + esc(t) + "</code>" +
          '<span class="schema-cols">' + cols.map((c) => esc(c[1]) + (c[5] ? " 🔑" : "")).join(", ") + "</span>" +
          '<span class="muted">' + data.values.length + " rows</span></summary>" + tableHTML(data) + "</details>";
      }).join("");
    } finally {
      db.close();
    }
  }

  /* ---------------- shared bits ---------------- */
  const diffPill = (d) => '<span class="diff diff-' + d.toLowerCase() + '">' + d + "</span>";
  const norm = (s) => String(s).replace(/\r\n/g, "\n").split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n+$/, "");

  function head(pathLabel, title, sub) {
    return '<header class="topic-head"><div class="eyebrow"><span class="ps1">~/amdocs-review/practice/</span>' + pathLabel + "</div>" +
      (title ? "<h1>" + title + "</h1>" : "") + (sub ? "<p>" + sub + "</p>" : "") + "</header>";
  }

  function practiceTabs(active) {
    const s = stats();
    const t = (k, href, label, count) => '<a href="' + href + '" class="' + (active === k ? "active" : "") + '"' + (active === k ? ' aria-current="page"' : "") + ">" + label + (count != null ? ' <span class="count">' + count + "</span>" : "") + "</a>";
    return '<nav class="tabs" aria-label="Practice sections">' +
      t("java", "#/practice/java", "Java problems", s.javaSolved + "/" + s.javaTotal) +
      t("sql", "#/practice/sql", "SQL problems", s.sqlSolved + "/" + s.sqlTotal) +
      t("playground", "#/practice/sql/playground", "SQL playground") + "</nav>";
  }

  const credit = '<p class="credit">Java code is compiled and run in your browser by <a href="https://cheerpj.com" target="_blank" rel="noopener">CheerpJ</a> (Java 17, free for personal use). SQL runs on SQLite via <a href="https://sql.js.org" target="_blank" rel="noopener">sql.js</a>. Nothing is sent to a server.</p>';

  /* ---------------- problem list ---------------- */
  function renderList(lang) {
    lang = lang === "sql" ? "sql" : "java";
    const s = st();
    const list = lang === "java" ? JAVA : SQLP;
    const solved = s.solved[lang];
    const f = s.prefs.practiceFilter || { diff: "All", status: "All" };
    document.title = (lang === "java" ? "Java" : "SQL") + " problems · Amdocs Reviewer";

    const rows = list.filter((p) => (f.diff === "All" || p.difficulty === f.diff) && (f.status === "All" || (f.status === "Solved") === !!solved[p.id]));
    const n = stats();
    const done = lang === "java" ? n.javaSolved : n.sqlSolved;

    api.main.innerHTML = '<div class="page" style="--accent: var(--practice)">' +
      head(lang === "java" ? "java-problems/" : "sql-problems/", "Coding practice",
        lang === "java"
          ? "CodeChum-style problems: read from standard input, print to standard output, and your code is judged against sample and hidden test cases. It's real Java 17, compiled in your browser. The first run downloads the Java runtime, which takes a little while."
          : "Write real queries against real tables. Your result is compared with the expected result. Databases reset on every run, so experiment freely (even <code>DELETE</code>). Runs on SQLite: use <code>LIMIT</code> instead of <code>ROWNUM</code>, and <code>||</code> for concatenation. <code>NVL</code> works too.") +
      practiceTabs(lang) +
      '<div class="toolbar">' +
      '<div class="seg" role="group" aria-label="Difficulty">' + ["All", "Easy", "Medium", "Hard"].map((d) => '<button type="button" data-fdiff="' + d + '" aria-pressed="' + (f.diff === d) + '">' + d + "</button>").join("") + "</div>" +
      '<div class="seg" role="group" aria-label="Status">' + ["All", "Unsolved", "Solved"].map((d) => '<button type="button" data-fstatus="' + d + '" aria-pressed="' + (f.status === d) + '">' + d + "</button>").join("") + "</div>" +
      '<span class="spacer"></span><span class="toolbar-note">' + done + " of " + list.length + " solved</span></div>" +
      '<div class="meter" style="margin-bottom:18px"><span style="width:' + Math.round((done / (list.length || 1)) * 100) + '%"></span></div>' +
      '<div class="problem-list">' + (rows.length ? rows.map((p) => {
        const i = list.indexOf(p);
        return '<a class="problem-row" href="#/practice/' + lang + "/" + p.id + '">' +
          '<span class="pr-status' + (solved[p.id] ? " ok" : "") + '" aria-label="' + (solved[p.id] ? "Solved" : "Not solved") + '">' + (solved[p.id] ? "✓" : String(i + 1).padStart(2, "0")) + "</span>" +
          '<span class="pr-main"><span class="pr-title">' + esc(p.title) + '</span><span class="pr-tags">' + p.tags.map(esc).join(" · ") + (lang === "sql" ? " · " + esc(DBS[p.db].title) + " db" : "") + "</span></span>" +
          diffPill(p.difficulty) + "</a>";
      }).join("") : '<div class="empty"><p>No problems match these filters.</p></div>') + "</div>" + credit + "</div>";

    api.main.querySelectorAll("[data-fdiff]").forEach((b) => b.addEventListener("click", () => { s.prefs.practiceFilter = Object.assign({}, f, { diff: b.dataset.fdiff }); api.save(); renderList(lang); }));
    api.main.querySelectorAll("[data-fstatus]").forEach((b) => b.addEventListener("click", () => { s.prefs.practiceFilter = Object.assign({}, f, { status: b.dataset.fstatus }); api.save(); renderList(lang); }));
    window.scrollTo(0, 0);
  }

  function neighbours(list, p, lang) {
    const i = list.indexOf(p);
    const prev = list[i - 1], next = list[i + 1];
    return '<div class="prob-nav">' +
      (prev ? '<a class="btn small" href="#/practice/' + lang + "/" + prev.id + '">← ' + esc(prev.title) + "</a>" : "<span></span>") +
      (next ? '<a class="btn small" href="#/practice/' + lang + "/" + next.id + '">' + esc(next.title) + " →</a>" : "<span></span>") + "</div>";
  }

  function revealSolution(el, onReveal) {
    el.addEventListener("toggle", () => { if (el.open) onReveal && onReveal(); }, { once: true });
  }

  /* ---------------- Java problem page ---------------- */
  function renderJava(p) {
    const token = ++viewToken;
    const s = st();
    document.title = p.title + " · Java practice · Amdocs Reviewer";
    const samples = p.tests.filter((t) => t.sample);
    const code = s.code.java[p.id] != null ? s.code.java[p.id] : (p.starter ? dedent(p.starter) + "\n" : STARTER_JAVA);

    api.main.innerHTML = '<div class="page wide" style="--accent: var(--practice)">' +
      head('<a href="#/practice/java">java-problems/</a>' + esc(p.id) + ".java") +
      '<div class="ide">' +
      '<section class="prob" aria-label="Problem statement">' +
      '<div class="prob-head"><h1>' + esc(p.title) + "</h1>" + diffPill(p.difficulty) + (s.solved.java[p.id] ? '<span class="solved-badge">✓ Solved</span>' : "") + "</div>" +
      '<div class="pr-tags">' + p.tags.map(esc).join(" · ") + "</div>" +
      '<div class="note prob-body">' + p.body.map(renderBlock).join("") +
      "<h4>Input</h4><p>" + inline(p.input) + "</p><h4>Output</h4><p>" + inline(p.output) + "</p>" +
      samples.map((t, i) => '<h4>Sample ' + (i + 1) + '</h4><div class="sample"><div><span class="io-label">Input</span><pre class="io">' + esc(t.in) + '</pre></div><div><span class="io-label">Output</span><pre class="io">' + esc(t.out) + "</pre></div></div>").join("") +
      '<p class="muted">Plus ' + (p.tests.length - samples.length) + " hidden test case" + (p.tests.length - samples.length === 1 ? "" : "s") + " on submit.</p>" +
      "</div>" +
      '<details class="reveal"><summary>💡 Hint</summary><div>' + inline(p.hint || "No hint for this one.") + "</div></details>" +
      '<details class="reveal" data-sol><summary>🔓 Show solution</summary><div class="sol-body"></div></details>' +
      neighbours(JAVA, p, "java") +
      "</section>" +
      '<section class="work" aria-label="Code editor">' +
      '<div class="editor-bar"><span class="file-tab">' + esc(mainClassOf(code)) + '.java</span><span class="spacer"></span>' +
      '<button type="button" class="btn small" data-custom aria-pressed="false">Custom input</button>' +
      '<button type="button" class="btn small" data-reset>Reset code</button></div>' +
      '<div class="editor-host"></div>' +
      '<div class="custom-input" hidden><label for="custom-stdin">Custom input (stdin), run with ▶ Run</label><textarea id="custom-stdin" class="code-input small" spellcheck="false"></textarea></div>' +
      '<div class="run-bar"><span class="runtime-status" data-runtime-status data-kind="' + runtimeState.kind + '">' + esc(runtimeState.text) + "</span>" +
      '<span class="spacer"></span><button type="button" class="btn" data-run>▶ Run</button><button type="button" class="btn primary" data-submit>Submit</button></div>' +
      '<p class="kbd-hint left"><kbd>Ctrl/⌘</kbd>+<kbd>Enter</kbd> run samples · <kbd>Ctrl/⌘</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd> submit · time limit ' + TIME_LIMIT_MS / 1000 + "s per test</p>" +
      '<div class="results" aria-live="polite"></div>' +
      "</section></div>" + credit + "</div>";

    const root = api.main;
    const results = root.querySelector(".results");
    const runBtn = root.querySelector("[data-run]"), subBtn = root.querySelector("[data-submit]");
    const customWrap = root.querySelector(".custom-input"), customTa = root.querySelector("#custom-stdin");
    const fileTab = root.querySelector(".file-tab");

    const editor = createEditor(root.querySelector(".editor-host"), {
      value: code, mode: "text/x-java", label: "Java code editor",
      onChange: (v) => { st().code.java[p.id] = v; api.save(); fileTab.textContent = mainClassOf(v) + ".java"; },
      onRun: () => go(false), onSubmit: () => go(true)
    });

    root.querySelector("[data-reset]").addEventListener("click", () => {
      if (!confirm("Replace your code with the starter template?")) return;
      const fresh = p.starter ? dedent(p.starter) + "\n" : STARTER_JAVA;
      editor.set(fresh); delete st().code.java[p.id]; api.save();
    });
    root.querySelector("[data-custom]").addEventListener("click", (e) => {
      const on = customWrap.hidden;
      customWrap.hidden = !on;
      e.currentTarget.setAttribute("aria-pressed", on);
      if (on) customTa.focus();
    });
    const sol = root.querySelector("[data-sol]");
    revealSolution(sol, () => {
      sol.querySelector(".sol-body").innerHTML = '<p class="muted">Try it yourself first. Interviewers will ask you to write these without help.</p>' + codeBlock(p.solution, "java") +
        '<button type="button" class="btn small" data-use>Copy into editor</button>';
      highlight(sol);
      sol.querySelector("[data-use]").addEventListener("click", () => { if (confirm("Overwrite your code with the solution?")) { editor.set(dedent(p.solution) + "\n"); st().code.java[p.id] = editor.get(); api.save(); } });
    });
    highlight(root.querySelector(".prob"));
    runBtn.addEventListener("click", () => go(false));
    subBtn.addEventListener("click", () => go(true));

    let running = false;
    async function go(submit) {
      if (running) return;
      if (location.protocol === "file:") {
        results.innerHTML = '<div class="verdict bad"><strong>Java needs the site to be served over http.</strong> Open your Vercel URL, or run <code>python3 dev-server.py</code> in the project folder and visit <code>http://localhost:5173</code>.</div>';
        return;
      }
      running = true;
      runBtn.disabled = subBtn.disabled = true;
      const src = editor.get();
      st().code.java[p.id] = src; api.save();

      const tests = (submit ? p.tests : samples).map((t) => ({ in: t.in, out: t.out, sample: !!t.sample }));
      const custom = !submit && !customWrap.hidden ? customTa.value : null;
      if (custom !== null) tests.push({ in: custom, out: null, custom: true });

      const t0 = performance.now();
      const label = submit ? "Submitting: compiling and running " + tests.length + " tests" : "Compiling and running";
      results.innerHTML = '<div class="verdict busy"><span class="spinner"></span> <span data-progress>' + label + "…</span></div>";
      const prog = results.querySelector("[data-progress]");
      const tick = setInterval(() => {
        if (!prog.isConnected) return clearInterval(tick);
        const secs = Math.round((performance.now() - t0) / 1000);
        prog.textContent = (jvmPromise && warmPromise ? label : "Starting Java (first run can take ~20–40 s)") + "… " + secs + "s";
      }, 500);

      try {
        await ensureJVM();
        const res = await enqueue(() => runJavaRaw(src, tests.map((t) => t.in)));
        warmPromise = warmPromise || Promise.resolve();
        setRuntime("Java ready", "ok");
        if (token !== viewToken) return;
        renderJavaResults(results, p, tests, res, submit, Math.round((performance.now() - t0) / 1000));
      } catch (e) {
        if (token !== viewToken) return;
        const msg = e && e.message === "FILE" ? "Java needs the site served over http." : (e && e.message) || String(e);
        results.innerHTML = '<div class="verdict bad"><strong>Couldn’t run your code.</strong> ' + esc(msg) + "<br><span class=\"muted\">The Java runtime loads from cjrtnc.leaningtech.com. Check your connection and try again.</span></div>";
      } finally {
        clearInterval(tick);
        running = false;
        if (runBtn.isConnected) runBtn.disabled = subBtn.disabled = false;
      }
    }

    // start downloading/warming the JVM while the user reads the problem
    if (location.protocol !== "file:") warmUp().catch(() => {});
  }

  function renderJavaResults(el, p, tests, res, submit, secs) {
    if (res.compileError !== null) {
      el.innerHTML = '<div class="verdict bad"><strong>Compilation error</strong></div><pre class="io err">' + esc(res.compileError) + "</pre>";
      return;
    }
    const outcomes = tests.map((t, i) => {
      const r = res.results[i];
      let verdict;
      if (r.status === "TIMEOUT") verdict = "Time limit exceeded";
      else if (r.status === "EXCEPTION") verdict = "Runtime error";
      else if (r.status === "NOMAIN") verdict = "No main method";
      else if (r.status === "EARLYEXIT") verdict = "Program exited early";
      else if (t.custom) verdict = "Ran";
      else verdict = norm(r.out) === norm(t.out) ? "Passed" : "Wrong answer";
      return { t, r, verdict, ok: verdict === "Passed" || verdict === "Ran" };
    });
    const graded = outcomes.filter((o) => !o.t.custom);
    const passed = graded.filter((o) => o.ok).length;
    const all = passed === graded.length;

    if (submit && all) {
      const s = st();
      const first = !s.solved.java[p.id];
      s.solved.java[p.id] = true; api.save(); api.renderNav();
      const badge = api.main.querySelector(".prob-head");
      if (badge && !badge.querySelector(".solved-badge")) badge.insertAdjacentHTML("beforeend", '<span class="solved-badge">✓ Solved</span>');
      if (first) celebrate();
    }

    const summary = submit
      ? (all ? '<div class="verdict good"><strong>✓ Accepted</strong>: all ' + graded.length + " tests passed in " + secs + "s.</div>"
        : '<div class="verdict bad"><strong>✗ ' + passed + " / " + graded.length + " tests passed.</strong> Open a failing test below to see the input and expected output.</div>")
      : (graded.length ? (all ? '<div class="verdict good"><strong>Sample tests pass.</strong> Now <em>Submit</em> to run the hidden tests too.</div>'
        : '<div class="verdict bad"><strong>' + passed + " / " + graded.length + " sample tests passed.</strong></div>") : "");

    let hiddenNo = 0, sampleNo = 0;
    el.innerHTML = summary + '<div class="tests">' + outcomes.map((o) => {
      const name = o.t.custom ? "Custom input" : o.t.sample ? "Sample " + ++sampleNo : "Hidden test " + ++hiddenNo;
      const open = !o.ok && (o.t.sample || o.t.custom) ? " open" : o.t.custom ? " open" : "";
      const expLines = o.t.out != null ? norm(o.t.out).split("\n") : [];
      const gotLines = norm(o.r.out).split("\n");
      const gotHTML = o.t.out != null
        ? gotLines.map((l, i) => '<span class="' + (l !== expLines[i] ? "diff-line" : "") + '">' + (esc(l) || " ") + "</span>").join("\n")
        : esc(o.r.out);
      return '<details class="test ' + (o.ok ? "pass" : "fail") + '"' + open + "><summary>" +
        '<span class="t-icon">' + (o.t.custom ? "▸" : o.ok ? "✓" : "✗") + "</span>" +
        '<span class="t-name">' + name + "</span>" +
        '<span class="t-verdict">' + o.verdict + "</span>" +
        '<span class="t-ms">' + o.r.ms + " ms</span></summary>" +
        '<div class="io-grid' + (o.t.custom ? " two" : "") + '">' +
        '<div><span class="io-label">Input</span><pre class="io">' + (esc(o.t.in) || '<span class="muted">(empty)</span>') + "</pre></div>" +
        (o.t.custom ? "" : '<div><span class="io-label">Expected output</span><pre class="io">' + esc(norm(o.t.out)) + "</pre></div>") +
        '<div><span class="io-label">Your output</span><pre class="io">' + (o.r.out ? gotHTML : '<span class="muted">(nothing printed)</span>') + "</pre></div>" +
        "</div>" +
        (o.r.err ? '<span class="io-label">Errors (stderr)</span><pre class="io err">' + esc(o.r.err) + "</pre>" : "") +
        (o.verdict === "Time limit exceeded" ? '<p class="muted">Your program ran longer than ' + TIME_LIMIT_MS / 1000 + "s. Look for an infinite loop, or a loop that waits for input that never comes.</p>" : "") +
        (o.verdict === "Program exited early" ? '<p class="muted">The program stopped before this test ran, probably via <code>System.exit()</code>. Just return from <code>main</code> instead.</p>' : "") +
        "</details>";
    }).join("") + "</div>";
  }

  function celebrate() {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = "✓ Solved! Nice work.";
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("out"), 2200);
    setTimeout(() => el.remove(), 2800);
  }

  /* ---------------- SQL problem page ---------------- */
  function renderSqlProblem(p) {
    const token = ++viewToken;
    const s = st();
    document.title = p.title + " · SQL practice · Amdocs Reviewer";
    const code = s.code.sql[p.id] != null ? s.code.sql[p.id] : "-- Write your query here\nSELECT \n";

    api.main.innerHTML = '<div class="page wide" style="--accent: var(--practice)">' +
      head('<a href="#/practice/sql">sql-problems/</a>' + esc(p.id) + ".sql") +
      '<div class="ide">' +
      '<section class="prob" aria-label="Problem statement">' +
      '<div class="prob-head"><h1>' + esc(p.title) + "</h1>" + diffPill(p.difficulty) + (s.solved.sql[p.id] ? '<span class="solved-badge">✓ Solved</span>' : "") + "</div>" +
      '<div class="pr-tags">' + p.tags.map(esc).join(" · ") + " · " + esc(DBS[p.db].title) + " database</div>" +
      '<div class="note prob-body">' + p.body.map(renderBlock).join("") +
      '<p class="muted">' + (p.ordered ? "Row order matters for this one." : "Row order doesn't matter.") + " Column names aren't checked, only the values.</p></div>" +
      '<details class="reveal"' + (window.innerWidth > 1100 ? " open" : "") + '><summary>🗂 Tables</summary><div class="schema" data-schema><p class="muted">Loading tables…</p></div></details>' +
      '<details class="reveal" data-expected><summary>🎯 Expected output</summary><div data-exp-body><p class="muted">Loading…</p></div></details>' +
      '<details class="reveal"><summary>💡 Hint</summary><div>' + inline(p.hint || "") + "</div></details>" +
      '<details class="reveal" data-sol><summary>🔓 Show solution</summary><div class="sol-body"></div></details>' +
      neighbours(SQLP, p, "sql") +
      "</section>" +
      '<section class="work" aria-label="SQL editor">' +
      '<div class="editor-bar"><span class="file-tab">query.sql</span><span class="spacer"></span><button type="button" class="btn small" data-reset>Reset</button></div>' +
      '<div class="editor-host sql"></div>' +
      '<div class="run-bar"><span class="runtime-status" data-sql-status></span><span class="spacer"></span><button type="button" class="btn" data-run>▶ Run</button><button type="button" class="btn primary" data-submit>Submit</button></div>' +
      '<p class="kbd-hint left"><kbd>Ctrl/⌘</kbd>+<kbd>Enter</kbd> run · <kbd>Ctrl/⌘</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd> submit · the database resets on every run</p>' +
      '<div class="results" aria-live="polite"></div>' +
      "</section></div>" + credit + "</div>";

    const root = api.main;
    const results = root.querySelector(".results");
    const status = root.querySelector("[data-sql-status]");
    const editor = createEditor(root.querySelector(".editor-host"), {
      value: code, mode: "text/x-sqlite", label: "SQL editor",
      onChange: (v) => { st().code.sql[p.id] = v; api.save(); },
      onRun: () => go(false), onSubmit: () => go(true)
    });
    root.querySelector("[data-reset]").addEventListener("click", () => {
      if (!confirm("Clear your query?")) return;
      editor.set("-- Write your query here\nSELECT \n"); delete st().code.sql[p.id]; api.save();
    });

    const sol = root.querySelector("[data-sol]");
    revealSolution(sol, () => {
      sol.querySelector(".sol-body").innerHTML = codeBlock(p.solution, "sql") + '<button type="button" class="btn small" data-use>Copy into editor</button>';
      highlight(sol);
      sol.querySelector("[data-use]").addEventListener("click", () => { editor.set(dedent(p.solution) + "\n"); st().code.sql[p.id] = editor.get(); api.save(); });
    });
    highlight(root.querySelector(".prob"));
    root.querySelector(".work [data-run]").addEventListener("click", () => go(false));
    root.querySelector(".work [data-submit]").addEventListener("click", () => go(true));

    status.textContent = "Loading SQLite…";
    const expectedP = ensureSQL().then(() => runSql(p.db, dedent(p.solution)));
    ensureSQL().then(async () => {
      if (token !== viewToken) return;
      status.textContent = "SQLite ready";
      root.querySelector("[data-schema]").innerHTML = await schemaHTML(p.db);
      const exp = await expectedP;
      if (token !== viewToken) return;
      root.querySelector("[data-exp-body]").innerHTML = tableHTML(exp, { caption: exp.values.length + " row" + (exp.values.length === 1 ? "" : "s") });
    }).catch((e) => { status.textContent = "SQLite failed to load. Check your connection."; status.dataset.kind = "bad"; });

    async function go(submit) {
      const text = editor.get();
      st().code.sql[p.id] = text; api.save();
      if (!text.replace(/--.*$/gm, "").trim()) { results.innerHTML = '<div class="verdict bad">Write a query first.</div>'; return; }
      results.innerHTML = '<div class="verdict busy"><span class="spinner"></span> Running…</div>';
      let got;
      try {
        got = await runSql(p.db, text);
      } catch (e) {
        if (token !== viewToken) return;
        results.innerHTML = '<div class="verdict bad"><strong>SQL error</strong></div><pre class="io err">' + esc(e.message || String(e)) + "</pre>" + sqliteTip(e.message || "");
        return;
      }
      if (token !== viewToken) return;
      const yours = got.noResult
        ? '<p class="muted">Statement executed. ' + (got.rowsModified || 0) + " row(s) changed, and no result set came back. (The database resets on the next run.)</p>"
        : '<span class="io-label">Your output · ' + got.values.length + " row" + (got.values.length === 1 ? "" : "s") + " · " + got.ms + " ms</span>" + tableHTML(got);
      if (!submit) { results.innerHTML = yours; return; }

      const exp = await expectedP;
      const cmp = compareSql(got, exp, p.ordered);
      if (cmp.ok) {
        const s = st();
        const first = !s.solved.sql[p.id];
        s.solved.sql[p.id] = true; api.save(); api.renderNav();
        const badge = root.querySelector(".prob-head");
        if (badge && !badge.querySelector(".solved-badge")) badge.insertAdjacentHTML("beforeend", '<span class="solved-badge">✓ Solved</span>');
        if (first) celebrate();
        const names = got.columns.map((c) => c.toLowerCase()).join(",") === exp.columns.map((c) => c.toLowerCase()).join(",");
        results.innerHTML = '<div class="verdict good"><strong>✓ Accepted</strong>: your result matches.' +
          (names ? "" : ' <span class="muted">Tip: the reference solution names the columns ' + exp.columns.map((c) => "<code>" + esc(c) + "</code>").join(", ") + ". Use <code>AS</code> aliases for readable output.</span>") + "</div>" + yours;
      } else {
        results.innerHTML = '<div class="verdict bad"><strong>✗ Not quite.</strong> ' + cmp.msg + "</div>" + yours +
          '<span class="io-label">Expected output · ' + exp.values.length + " row" + (exp.values.length === 1 ? "" : "s") + "</span>" + tableHTML(exp);
      }
    }
  }

  function sqliteTip(msg) {
    const m = msg.toLowerCase();
    let tip = "";
    if (m.includes("rownum")) tip = "SQLite has no <code>ROWNUM</code>. Use <code>LIMIT n</code> (Oracle 12c+ equivalent: <code>FETCH FIRST n ROWS ONLY</code>).";
    else if (m.includes("sysdate")) tip = "SQLite has no <code>SYSDATE</code>. Use <code>date('now')</code>.";
    else if (m.includes("dual")) tip = "SQLite doesn't need <code>FROM DUAL</code>. Just <code>SELECT 1 + 1;</code>.";
    else if (m.includes("decode")) tip = "SQLite has no <code>DECODE</code>. Use <code>CASE WHEN … THEN … END</code>.";
    else if (m.includes("to_char") || m.includes("to_date")) tip = "Dates here are text like <code>'2026-11-09'</code>. Compare them directly, or use <code>strftime('%Y-%m', col)</code>.";
    else if (m.includes("minus")) tip = "SQLite uses <code>EXCEPT</code> where Oracle uses <code>MINUS</code>.";
    else if (m.includes("incomplete input")) tip = "Your statement looks unfinished. Check for a missing closing parenthesis or quote.";
    return tip ? '<div class="callout"><span class="callout-label">Tip</span><div>' + tip + "</div></div>" : "";
  }

  /* ---------------- SQL playground ---------------- */
  function renderPlayground() {
    const token = ++viewToken;
    const s = st();
    document.title = "SQL playground · Amdocs Reviewer";
    let dbKey = s.prefs.playgroundDb && DBS[s.prefs.playgroundDb] ? s.prefs.playgroundDb : "telco";
    const draftKey = "__playground_" + dbKey;
    const starter = dbKey === "hr" ? "SELECT e.name, d.dept_name, e.salary\nFROM employees e\nLEFT JOIN departments d ON d.dept_id = e.dept_id\nORDER BY e.salary DESC;\n"
      : "SELECT c.name, s.msisdn, p.plan_name, s.status\nFROM subscriptions s\nJOIN customers c ON c.customer_id = s.customer_id\nJOIN plans p ON p.plan_id = s.plan_id\nORDER BY c.name;\n";

    api.main.innerHTML = '<div class="page wide" style="--accent: var(--practice)">' +
      head("sql-playground.sql", "Coding practice", "Free-form SQL. Explore the practice databases, try queries from the notes, break things. Every run starts from a fresh copy.") +
      practiceTabs("playground") +
      '<div class="ide">' +
      '<section class="prob" aria-label="Database">' +
      '<div class="toolbar"><div class="seg" role="group" aria-label="Database">' +
      Object.keys(DBS).map((k) => '<button type="button" data-db="' + k + '" aria-pressed="' + (k === dbKey) + '">' + esc(DBS[k].title) + "</button>").join("") +
      "</div></div><p class=\"muted\">" + esc(DBS[dbKey].blurb) + '</p><div class="schema" data-schema><p class="muted">Loading tables…</p></div></section>' +
      '<section class="work" aria-label="SQL editor">' +
      '<div class="editor-bar"><span class="file-tab">' + dbKey + '.sql</span><span class="spacer"></span><button type="button" class="btn small" data-reset>Reset</button></div>' +
      '<div class="editor-host sql"></div>' +
      '<div class="run-bar"><span class="runtime-status" data-sql-status></span><span class="spacer"></span><button type="button" class="btn primary" data-run>▶ Run</button></div>' +
      '<p class="kbd-hint left"><kbd>Ctrl/⌘</kbd>+<kbd>Enter</kbd> run · results show the last statement</p>' +
      '<div class="results" aria-live="polite"></div></section></div>' + credit + "</div>";

    const root = api.main;
    const results = root.querySelector(".results");
    const editor = createEditor(root.querySelector(".editor-host"), {
      value: s.code.sql[draftKey] != null ? s.code.sql[draftKey] : starter, mode: "text/x-sqlite", label: "SQL editor",
      onChange: (v) => { st().code.sql[draftKey] = v; api.save(); }, onRun: run, onSubmit: run
    });
    root.querySelectorAll("[data-db]").forEach((b) => b.addEventListener("click", () => { st().prefs.playgroundDb = b.dataset.db; api.save(); renderPlayground(); }));
    root.querySelector("[data-reset]").addEventListener("click", () => { editor.set(starter); delete st().code.sql[draftKey]; api.save(); });
    root.querySelector("[data-run]").addEventListener("click", run);

    const status = root.querySelector("[data-sql-status]");
    status.textContent = "Loading SQLite…";
    ensureSQL().then(async () => {
      if (token !== viewToken) return;
      status.textContent = "SQLite ready";
      root.querySelector("[data-schema]").innerHTML = await schemaHTML(dbKey);
    }).catch(() => { status.textContent = "SQLite failed to load. Check your connection."; });

    async function run() {
      const text = editor.get();
      st().code.sql[draftKey] = text; api.save();
      results.innerHTML = '<div class="verdict busy"><span class="spinner"></span> Running…</div>';
      try {
        const got = await runSql(dbKey, text);
        if (token !== viewToken) return;
        results.innerHTML = got.noResult
          ? '<div class="verdict good">Statement executed. ' + (got.rowsModified || 0) + " row(s) changed.</div>"
          : '<span class="io-label">' + got.values.length + " row" + (got.values.length === 1 ? "" : "s") + " · " + got.ms + " ms</span>" + tableHTML(got);
      } catch (e) {
        if (token !== viewToken) return;
        results.innerHTML = '<div class="verdict bad"><strong>SQL error</strong></div><pre class="io err">' + esc(e.message || String(e)) + "</pre>" + sqliteTip(e.message || "");
      }
    }
  }

  /* ---------------- public API ---------------- */
  return {
    stats,
    render(lang, id) {
      if (lang === "java" && id && byJava[id]) return renderJava(byJava[id]);
      if (lang === "sql" && id === "playground") return renderPlayground();
      if (lang === "sql" && id && bySql[id]) return renderSqlProblem(bySql[id]);
      return renderList(lang === "sql" ? "sql" : "java");
    },
    searchItems() {
      return JAVA.map((p) => ({ group: "practice/java-problems/", kind: "java problem", title: p.title, href: "#/practice/java/" + p.id, text: [p.title, p.tags.join(" ")].concat(p.body.map((b) => b.p || b.tip || "")).join(" ") }))
        .concat(SQLP.map((p) => ({ group: "practice/sql-problems/", kind: "sql problem", title: p.title, href: "#/practice/sql/" + p.id, text: [p.title, p.tags.join(" ")].concat(p.body.map((b) => b.p || b.warn || "")).join(" ") })));
    }
  };
};
