(function () {
  window.TOPICS = window.TOPICS || [];

  window.TOPICS.push({
    id: "amdocs",
    title: "Amdocs & HR",
    dir: "amdocs-hr/",
    accent: "hr",
    blurb: "Company and telecom domain basics, SDLC/Agile/Git, support fundamentals, and the behavioral questions that decide close calls.",

    notes: [
      {
        title: "Know the company",
        blocks: [
          { ul: [
            "**What Amdocs does:** software and services for **communications, media and entertainment providers**: telcos, cable operators and streaming companies. Its systems run the business side of a telco: customer management, ordering, **billing and charging**, plus network/OSS, cloud migration and managed services.",
            "Founded in **1982**, publicly traded on NASDAQ as **DOX**, with development and delivery centers around the world.",
            "Customers are large telecom operators, so the software is **mission-critical and high-volume**: millions of subscribers, millions of usage records a day. That's why Java, SQL (often **Oracle**) and **Unix/Linux** are the core skills they screen for.",
            "Typical entry-level tracks: **software developer** (Java), **application/production support** (Unix + SQL + logs), **QA/testing**, **DevOps/cloud**."
          ]},
          { tip: "Before the interview, spend 10 minutes on **amdocs.com → Newsroom** and pick **one recent announcement** (a new customer deal, an AI or cloud initiative, a 5G product) to mention when they ask \"Why Amdocs?\" or \"What do you know about us?\". It shows genuine interest." },
          { warn: "Facts about the specific team, shift schedule, salary band and training program vary by role and batch. Ask your recruiter rather than relying on forum posts." }
        ]
      },
      {
        title: "Telecom domain crash course",
        blocks: [
          { p: "You won't be expected to be a telecom expert, but knowing these terms makes you sound prepared:" },
          { table: {
            head: ["Term", "Meaning"],
            rows: [
              ["**BSS**: Business Support Systems", "The customer- and money-facing side: **CRM, product catalog, ordering, billing, charging, payments**. Amdocs' traditional core strength."],
              ["**OSS**: Operations Support Systems", "The network-facing side: **service fulfillment/provisioning, network inventory, assurance/fault management**."],
              ["**CRM**", "Customer Relationship Management: customer profiles, interactions, cases/tickets."],
              ["**CDR / UDR**", "Call / Usage Detail Record: one record per call, SMS or data session (who, when, duration/volume, cell)."],
              ["**Mediation**", "Collects raw usage records from network elements, then validates, de-duplicates and normalizes them before rating."],
              ["**Rating**", "Applies the price plan to a usage event to work out its cost."],
              ["**Charging (online / OCS)**", "Real-time balance check and deduction, essential for **prepaid** so a call cuts off when credit runs out."],
              ["**Billing**", "At the end of each **bill cycle**, aggregates charges, discounts and taxes, then produces the **invoice** (mostly postpaid)."],
              ["**Prepaid vs postpaid**", "Prepaid: pay first, real-time charging. Postpaid: use first, billed monthly."],
              ["**Provisioning**", "Activating services on the network, e.g. turning on a SIM, data or roaming."],
              ["**Order management**", "Capturing and orchestrating a customer order (new line, plan change) across systems."],
              ["**MSISDN**", "The subscriber's **phone number**."],
              ["**IMSI**", "The unique subscriber ID stored on the SIM."],
              ["**Churn**", "Customers leaving. Reducing churn is a huge telco KPI."],
              ["**ARPU**", "Average Revenue Per User."],
              ["**Roaming**", "Using another operator's network (usually abroad)."],
              ["**5G / network slicing**", "Faster networks that let operators sell new services and dedicated virtual networks. Monetizing them is a current industry focus."]
            ]
          }},
          { p: "**Flow to remember:** network usage → **mediation** → **rating** → **charging** (real-time) / **billing** (cycle) → **invoice** → **payment** → **collections**. CRM and order management sit in front; provisioning pushes changes to the network." }
        ]
      },
      {
        title: "Interview process & strategy",
        blocks: [
          { p: "Candidates commonly report these stages. Your batch may differ, so confirm with your recruiter:" },
          { ol: [
            "**Online assessment:** aptitude (quantitative, logical reasoning, verbal/English), technical MCQs (Java, SQL, Unix, sometimes OS/networking basics), and sometimes 1–2 coding problems.",
            "**Technical interview(s):** core Java concepts, writing SQL queries by hand, Unix commands, questions about your projects, \"what would you do if…\" scenarios.",
            "**HR / managerial interview:** communication, attitude, willingness to learn, shift and location flexibility, salary expectations."
          ]},
          { h: "Strategy in the technical round" },
          { ul: [
            "**Think out loud.** Interviewers grade your reasoning, not only the final answer.",
            "**Start simple, then improve.** A brute-force solution you can explain beats a clever one you can't finish.",
            "**Say \"I'm not sure, but here's how I'd find out…\"** instead of bluffing. Mention `man` pages, docs or testing in a sandbox.",
            "**Know your resume cold.** Every technology on it is fair game. Prepare a 2-minute walkthrough of your best project: problem, your role, tech stack, a challenge, the result.",
            "**Write SQL and Java by hand.** Practice without autocomplete."
          ]}
        ]
      },
      {
        title: "SDLC, Agile & testing",
        blocks: [
          { p: "**SDLC phases:** Requirements → Design → Implementation (coding) → Testing → Deployment → Maintenance." },
          { table: {
            head: ["", "Waterfall", "Agile (Scrum)"],
            rows: [
              ["Flow", "Sequential, one phase at a time", "Iterative, in short **sprints** (1–4 weeks)"],
              ["Changes", "Hard and expensive once a phase is done", "Expected and welcomed"],
              ["Delivery", "Once, at the end", "Working increment every sprint"],
              ["Best for", "Fixed, well-understood requirements", "Evolving requirements"]
            ]
          }},
          { ul: [
            "**Scrum roles:** Product Owner (owns and prioritizes the backlog), Scrum Master (facilitator, removes blockers), Development Team.",
            "**Ceremonies:** Sprint Planning, **Daily Stand-up** (15 min: what I did, what I'll do, blockers), Sprint Review (demo), Retrospective (improve the process).",
            "**Artifacts:** Product Backlog, Sprint Backlog, Increment. **User story:** \"As a [user], I want [goal] so that [benefit]\".",
            "**Tools:** Jira (tickets and boards), Confluence (docs), Jenkins (CI/CD), Git/Bitbucket/GitHub."
          ]},
          { table: {
            head: ["Testing type", "Purpose"],
            rows: [
              ["**Unit**", "Test one class or method in isolation (JUnit)"],
              ["**Integration**", "Test that modules or services work together"],
              ["**System**", "Test the full application end to end against requirements"],
              ["**UAT**", "The business or customer verifies it meets their needs"],
              ["**Regression**", "Re-test existing features after a change to make sure nothing broke"],
              ["**Smoke**", "Quick check that the build's critical functions work (is it testable at all?)"],
              ["**Sanity**", "Narrow check that a specific fix or feature works"],
              ["**Performance / load**", "Behavior under expected or peak volume"],
              ["**Black box / white box**", "Test without / with knowledge of the internal code"]
            ]
          }}
        ]
      },
      {
        title: "Git essentials",
        blocks: [
          { code: String.raw`
            git clone <url>                 # copy a remote repository
            git status                      # what changed?
            git add file.java  |  git add . # stage changes
            git commit -m "Fix billing rounding bug"
            git push origin feature/billing # upload commits
            git pull                        # fetch + merge remote changes
            git fetch                       # download remote changes WITHOUT merging
            git branch                      # list branches
            git checkout -b feature/x       # create + switch branch  (or: git switch -c)
            git merge feature/x             # merge a branch into the current one
            git log --oneline               # history
            git diff                        # unstaged changes
            git stash  |  git stash pop     # shelve / restore work in progress
            git revert <commit>             # new commit that undoes one (safe on shared branches)
            git reset --hard <commit>       # move branch back, DISCARD changes (dangerous)
          `, lang: "bash" },
          { p: "**merge vs rebase:** merge keeps history as it happened and adds a merge commit. Rebase replays your commits on top of another branch for a linear history. Never rebase commits others already pulled." },
          { p: "**Merge conflict:** Git can't auto-combine changes to the same lines. Open the file, resolve the `<<<<<<<` / `=======` / `>>>>>>>` sections, then `git add` and commit." }
        ]
      },
      {
        title: "Support & ITIL basics",
        blocks: [
          { p: "Useful if your role is **application or production support**, which is common in telecom delivery centers:" },
          { table: {
            head: ["Term", "Meaning"],
            rows: [
              ["**Incident**", "Unplanned interruption or degradation of a service. Goal: **restore service ASAP** (a workaround is OK)."],
              ["**Problem**", "The underlying **root cause** of one or more incidents. Goal: a permanent fix."],
              ["**Change**", "A controlled modification to production, approved through change management (CAB)."],
              ["**RCA**", "Root Cause Analysis: why it happened and how to prevent it recurring (e.g. the 5 Whys)."],
              ["**SLA**", "Service Level Agreement: committed response and resolution times, e.g. P1 resolved within 4 hours."],
              ["**Severity vs priority**", "Severity = how bad the impact is technically. Priority = how urgently the business needs it fixed."],
              ["**P1 / Sev1**", "Critical outage with major business impact, e.g. billing down for all customers."],
              ["**L1 / L2 / L3**", "Support tiers: L1 triages and handles known fixes; L2 does deeper technical analysis (logs, SQL); L3 is development and code fixes."],
              ["**Shift / on-call / rotation**", "24×7 coverage of production systems, often rotating shifts."]
            ]
          }}
        ]
      },
      {
        title: "Behavioral answers: the STAR method",
        blocks: [
          { p: "For any \"Tell me about a time…\" question, answer in **STAR** format and keep it to about 90 seconds:" },
          { ul: [
            "**S**ituation: the context, in one or two sentences.",
            "**T**ask: what *you* were responsible for.",
            "**A**ction: the specific steps *you* took. Say \"I\", not \"we\". This should be the longest part.",
            "**R**esult: the outcome, with a number if possible, and what you learned."
          ]},
          { p: "**Prepare 4–5 stories** you can adapt: a technical challenge you solved, a team conflict, a mistake or failure, a time you learned something fast, and a time you went beyond what was asked. Thesis projects, OJT/internships, org work and part-time jobs all count." }
        ]
      }
    ],

    qa: [
      { q: "Tell me about yourself.", a: "Use **Present → Past → Future** in about 60–90 seconds:\n- **Present:** who you are now (e.g. a recent BS IT/CS graduate focused on Java backend and databases).\n- **Past:** 1–2 highlights that prove it: a capstone project, an internship, a certification, with specifics.\n- **Future:** why this role at Amdocs is the logical next step.\nDon't recite your whole resume, and skip personal details like age or hometown unless they're relevant." },
      { q: "Why Amdocs?", a: "Make it specific to them, not generic. For example:\n- They build **mission-critical systems** for telecom operators: large scale, real users, real impact.\n- Your interest matches their stack (**Java, SQL, Unix**) and you want to grow in enterprise or telecom software.\n- Their **global** footprint and the chance to learn the telecom domain.\n- Mention **one specific recent announcement** you read in their newsroom." },
      { q: "What do you know about Amdocs?", a: "Amdocs builds software and services for communications and media providers: billing, charging, CRM and ordering (BSS), plus network/OSS, cloud and managed services for many of the world's large telcos. It was founded in 1982 and trades on NASDAQ (DOX). Then add the recent news item you prepared." },
      { q: "Why should we hire you?", a: "Connect **three things**: (1) a skill they need, with proof (\"I built X with Java and Oracle\"), (2) a trait that matters for the role (\"I'm careful and methodical when debugging\"), and (3) your eagerness to learn their domain quickly, with an example of learning something fast." },
      { q: "What are your strengths?", a: "Pick 2–3 relevant strengths and give **evidence** for each. Example: \"I'm persistent at debugging. In my capstone, our report module produced wrong totals. I traced it to a JOIN that duplicated rows, fixed it with a subquery, and added test cases.\"" },
      { q: "What is your greatest weakness?", a: "Choose a **real but non-critical** weakness and show **what you're doing about it**. Example: \"I used to over-polish my code before asking for feedback, which slowed me down. Now I share early drafts and set time limits, and I've found I learn faster from review.\" Avoid clichés like \"I'm a perfectionist\" with no follow-up." },
      { q: "Are you willing to work in shifts / night shifts / on weekends?", a: "Many telecom delivery and support roles have rotating or night shifts because clients are in other time zones. Answer honestly. If you're open to it, say so confidently (\"Yes, I understand production systems need 24×7 coverage and I'm prepared for that\"). If you have constraints, ask about the schedule rather than giving a flat no." },
      { q: "Are you willing to relocate or be assigned to any technology?", a: "Show flexibility and a learning mindset: \"I'm open to it. I'd rather build a strong foundation in whatever the team needs, and I'm confident I can pick up new tools quickly. For example, I learned ___ in two weeks for ___.\"" },
      { q: "Where do you see yourself in 5 years?", a: "Show ambition **aligned with the company**: \"I see myself as a strong engineer here, someone the team relies on for [backend, support, the billing domain], maybe mentoring new hires or leading a module, and I'd like to have earned a certification in [Java, cloud].\"" },
      { q: "Tell me about a challenging problem you solved.", a: "Use STAR. Pick a **technical** story with real detail: what broke, how you diagnosed it (logs, debugging, isolating variables), what you tried that *didn't* work, the fix, and the measurable result. Close with what you'd do differently." },
      { q: "Describe a conflict with a teammate. How did you handle it?", a: "Use STAR and show **maturity**: you listened to understand their view, focused on the goal rather than the person, found a compromise or used data to decide, and kept the relationship intact. Don't badmouth anyone." },
      { q: "Tell me about a time you failed or made a mistake.", a: "Own it honestly, explain the impact briefly, focus on **how you fixed it** and **what you changed** so it doesn't happen again. Interviewers want accountability and learning, not perfection." },
      { q: "How do you handle pressure or tight deadlines?", a: "Give a concrete approach plus an example: break the work into smaller tasks, prioritize by impact, communicate early if something is at risk, stay calm and methodical. Then the story: \"During finals week our system demo broke…\"" },
      { q: "How do you learn a new technology quickly?", a: "Describe your method: official docs and a quick tutorial → build something small → read others' code → ask focused questions. Back it with a real example and timeline." },
      { q: "What are your salary expectations?", a: "Research typical entry-level ranges for similar roles in your city beforehand (job boards, people you know). Give a **reasonable range** and show flexibility: \"Based on my research, something around ___ to ___, but I'm open to discussing the full package, since learning opportunities matter a lot to me.\"" },
      { q: "Walk me through your capstone/thesis project.", a: "In about 2 minutes: the **problem** and who it served → **your role** → **tech stack** and *why* you chose it → **architecture** in one sentence (e.g. Java backend, MySQL, web UI) → one **hard challenge** and how you solved it → the **result**. Expect deep follow-ups on anything you mention." },
      { q: "Do you have any questions for us?", a: "Always have 2–3 ready. Good ones:\n- What does a typical day look like for someone in this role?\n- What technologies and domain (billing, CRM…) would I work on first?\n- How is training or onboarding structured for new hires?\n- What does success look like in the first 6 months?\n- What do you enjoy most about working here?\nAvoid opening with salary or leave questions in the technical round." }
    ],

    quiz: [
      { q: "Billing, CRM and order management are part of:", options: ["OSS", "BSS", "RAN", "CDN"], answer: 1,
        explain: "BSS = Business Support Systems (customer and revenue side). OSS is network operations." },
      { q: "What does CDR stand for?", options: ["Customer Data Repository", "Call Detail Record", "Central Data Router", "Charging Detail Rule"], answer: 1,
        explain: "One record per call, SMS or data session. It's the raw input for rating and billing." },
      { q: "Which component collects and normalizes raw usage records from the network before rating?", options: ["CRM", "Mediation", "Invoicing", "Provisioning"], answer: 1,
        explain: "Mediation validates, de-duplicates and formats network records for the rating engine." },
      { q: "Prepaid subscribers mainly depend on:", options: ["Monthly bill cycles", "Real-time (online) charging", "Paper invoices", "Collections"], answer: 1,
        explain: "Their balance must be checked and deducted in real time, so the service stops when credit runs out." },
      { q: "MSISDN is:", options: ["The SIM's serial number", "The subscriber's phone number", "A network cell ID", "A billing account code"], answer: 1,
        explain: "MSISDN = the mobile number. IMSI identifies the subscriber on the SIM." },
      { q: "In Scrum, who prioritizes the product backlog?", options: ["Scrum Master", "Product Owner", "Developers", "Project Manager"], answer: 1,
        explain: "The Product Owner owns and orders the backlog by business value." },
      { q: "The Daily Stand-up is time-boxed to about:", options: ["5 minutes", "15 minutes", "1 hour", "Half a day"], answer: 1,
        explain: "15 minutes: what I did, what I'll do, any blockers." },
      { q: "`git fetch` vs `git pull`:", options: ["They're identical", "fetch downloads without merging; pull = fetch + merge", "pull only downloads; fetch merges", "fetch pushes changes"], answer: 1,
        explain: "fetch updates remote-tracking branches only. pull also merges (or rebases) into your branch." },
      { q: "Re-testing existing functionality after a code change to make sure nothing broke is:", options: ["Smoke testing", "Regression testing", "UAT", "Load testing"], answer: 1,
        explain: "Regression testing catches side effects of changes." },
      { q: "In ITIL, a **problem** is:", options: ["Any user complaint", "The root cause of one or more incidents", "A planned change", "A new feature request"], answer: 1,
        explain: "Incident = restore service fast. Problem = find and fix the underlying cause." },
      { q: "STAR stands for:", options: ["Skill, Task, Ability, Result", "Situation, Task, Action, Result", "Story, Timeline, Action, Review", "Situation, Team, Approach, Reward"], answer: 1,
        explain: "Situation, Task, Action, Result: a structure for behavioral answers." },
      { q: "A quick test that a new build's critical functions work at all, before deeper testing, is:", options: ["Smoke test", "Regression test", "Penetration test", "UAT"], answer: 0,
        explain: "A smoke test is a shallow, wide check of build stability." },
      { q: "ARPU means:", options: ["Annual Revenue Per Unit", "Average Revenue Per User", "Active Roaming Per User", "Average Rate Per Usage"], answer: 1,
        explain: "A key telecom KPI: total revenue ÷ number of subscribers." },
      { q: "Which is the safest way to undo a commit that's already pushed to a shared branch?", options: ["git reset --hard", "git revert <commit>", "Delete the repo", "git push --force"], answer: 1,
        explain: "revert adds a new commit that undoes the change without rewriting shared history." }
    ]
  });

  window.CRAM = {
    java: [
      "`==` compares references; `.equals()` compares content.",
      "String is immutable and pooled. Use StringBuilder in loops; StringBuffer is the synchronized one.",
      "Integer cache is -128..127, so `==` on Integers outside it is false.",
      "Overloading = compile time, different params. Overriding = runtime, same signature, can't narrow access.",
      "Static methods are hidden, not overridden, and bound to the reference type.",
      "A `return` in `finally` overrides `try`'s return. finally is skipped only by System.exit or a crash.",
      "Checked = IOException, SQLException. Unchecked = RuntimeException family (NPE, ArithmeticException…).",
      "HashMap: buckets + hashCode + equals, load factor 0.75, treeify at more than 8, 1 null key. Hashtable/ConcurrentHashMap: no nulls.",
      "Override equals → you must override hashCode.",
      "ArrayList is O(1) get; LinkedList is O(1) add/remove at the ends.",
      "`start()` creates a thread; calling `run()` directly doesn't.",
      "sleep keeps the lock; wait releases it (and must be in synchronized).",
      "volatile = visibility, not atomicity. Use AtomicInteger for counters.",
      "Streams: intermediate ops are lazy, terminal ops trigger. map is 1→1, flatMap is 1→many, flattened.",
      "Java is always pass-by-value (reference values are copied).",
      "Local variables have no default, so using one uninitialized is a compile error.",
      "PreparedStatement is precompiled and prevents SQL injection."
    ],
    linux: [
      "chmod: r=4 w=2 x=1. 755 = rwxr-xr-x, 644 = rw-r--r--.",
      "umask 022 → files 644, dirs 755.",
      "`kill` = SIGTERM 15 (graceful). `kill -9` = SIGKILL (forced, can't be caught).",
      "`> out 2>&1` = stdout + stderr to file. `>>` appends.",
      "`$?` = last exit code (0 = success). `$#` arg count, `$@` all args, `$$` PID.",
      "`grep -i` ignore case, `-v` invert, `-c` count, `-n` line numbers, `-r` recursive, `-l` file names.",
      "`sed -i 's/a/b/g' file` = in-place replace all.",
      "`awk -F, '{print $2}'` = 2nd column. `NR` = line number. `$NF` = last field.",
      "Always `sort` before `uniq`. `uniq -c | sort -rn` = frequency ranking.",
      "`find / -mtime -1` = changed in the last 24h. `-size +100M` = big files.",
      "`tail -f` follows logs. `head -5 | tail -1` = 5th line.",
      "`df -h` = disk free per filesystem. `du -sh` = size of a directory. `free -h` = memory.",
      "`lsof -i :8080` / `ss -tulnp` = what's on a port.",
      "`nohup cmd &` survives logout. Ctrl+Z suspends, then `bg`/`fg`.",
      "Hard link = same inode. Soft link = a path; it breaks if the target is deleted.",
      "Cron: min hour dom month dow. `*/15 * * * *` = every 15 min.",
      "vi: `i` insert, `Esc`, `:wq` save+quit, `:q!` quit without saving."
    ],
    sql: [
      "Order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY.",
      "WHERE filters rows (no aggregates). HAVING filters groups.",
      "DELETE = DML, WHERE, rollback. TRUNCATE = DDL, all rows, fast. DROP = removes the table.",
      "PK: unique + not null, one per table. UNIQUE allows NULL, many per table.",
      "LEFT JOIN keeps all left rows. INNER keeps matches only. CROSS = m × n.",
      "Self join for hierarchies: `e.manager_id = m.emp_id`.",
      "`= NULL` never matches; use `IS NULL`. NVL / COALESCE replace NULLs.",
      "NOT IN with a NULL in the list returns nothing. Use NOT EXISTS.",
      "COUNT(*) counts all rows; COUNT(col) skips NULLs. Aggregates ignore NULLs.",
      "UNION removes duplicates; UNION ALL keeps them (faster). Oracle uses MINUS.",
      "2nd highest: `MAX(salary) WHERE salary < (SELECT MAX(salary) …)`.",
      "RANK: 1,2,2,4. DENSE_RANK: 1,2,2,3. ROW_NUMBER: 1,2,3,4.",
      "1NF atomic, 2NF no partial dependency, 3NF no transitive dependency.",
      "ACID = Atomicity, Consistency, Isolation, Durability. Oracle default = READ COMMITTED.",
      "Indexes speed up reads, slow down writes. Functions on a column defeat a normal index.",
      "Oracle: ROWNUM is assigned before ORDER BY, so sort in a subquery. FETCH FIRST n ROWS ONLY (12c+).",
      "Function must return a value and can be used in SELECT. Procedure can't be used in SELECT."
    ],
    amdocs: [
      "Amdocs = software and services for telcos and media companies (BSS, OSS, cloud). NASDAQ: DOX. Founded 1982.",
      "BSS = CRM, ordering, billing, charging. OSS = provisioning, inventory, assurance.",
      "Usage flow: network → mediation → rating → charging/billing → invoice → payment.",
      "Prepaid = real-time charging. Postpaid = monthly bill cycle.",
      "MSISDN = phone number. IMSI = SIM subscriber ID. CDR = Call Detail Record.",
      "Scrum: PO owns the backlog, SM removes blockers, daily stand-up is 15 min.",
      "Incident = restore fast. Problem = root cause. RCA prevents recurrence.",
      "Use STAR for behavioral questions. Say \"I\", and quantify results.",
      "Prepare: tell-me-about-yourself, why Amdocs (+1 news item), a project walkthrough, a failure story, 2–3 questions for them.",
      "Think out loud. Say what you'd check when you don't know. Never bluff."
    ]
  };
})();
