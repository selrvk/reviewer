(function () {
  const C = String.raw;
  window.TOPICS = window.TOPICS || [];

  const EMP = {
    head: ["emp_id", "name", "dept_id", "manager_id", "salary", "hire_date"],
    rows: [
      ["1", "Ana", "10", "NULL", "90000", "2019-03-01"],
      ["2", "Ben", "10", "1", "60000", "2020-07-15"],
      ["3", "Carlo", "20", "1", "75000", "2018-01-10"],
      ["4", "Dana", "20", "3", "75000", "2021-05-20"],
      ["5", "Ed", "30", "3", "50000", "2022-02-01"],
      ["6", "Faye", "NULL", "1", "45000", "2023-08-08"]
    ]
  };
  const DEPT = {
    head: ["dept_id", "dept_name", "location"],
    rows: [
      ["10", "Engineering", "Manila"],
      ["20", "Billing", "Cebu"],
      ["30", "Support", "Manila"],
      ["40", "Marketing", "Davao"]
    ]
  };

  window.TOPICS.push({
    id: "sql",
    title: "SQL",
    dir: "sql/",
    accent: "sql",
    blurb: "Joins, GROUP BY/HAVING, subqueries, keys, normalization, transactions and the classic hand-written queries. Telecom systems tend to run on Oracle, so learn the Oracle-specific bits too.",

    notes: [
      {
        title: "Command categories & query order",
        blocks: [
          { table: {
            head: ["Category", "Commands", "Purpose"],
            rows: [
              ["**DDL**: Data Definition", "`CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `RENAME`", "Define/modify structure (auto-commits in Oracle)"],
              ["**DML**: Data Manipulation", "`INSERT`, `UPDATE`, `DELETE`, `MERGE`", "Change data (can be rolled back)"],
              ["**DQL**: Data Query", "`SELECT`", "Read data"],
              ["**DCL**: Data Control", "`GRANT`, `REVOKE`", "Permissions"],
              ["**TCL**: Transaction Control", "`COMMIT`, `ROLLBACK`, `SAVEPOINT`", "Manage transactions"]
            ]
          }},
          { p: "**Logical order of execution**, which differs from the order you *write* the clauses:" },
          { code: C`
            1. FROM / JOIN      -- pick tables, combine rows
            2. WHERE            -- filter ROWS (can't use aggregates or SELECT aliases)
            3. GROUP BY         -- form groups
            4. HAVING           -- filter GROUPS (can use aggregates)
            5. SELECT           -- compute columns, aliases, window functions
            6. DISTINCT         -- remove duplicate rows
            7. ORDER BY         -- sort (CAN use SELECT aliases)
            8. LIMIT / FETCH    -- return top N
          `, lang: "plaintext" },
          { tip: "This order explains a lot of interview questions: why you can't write `WHERE COUNT(*) > 1` (WHERE runs before grouping), and why `ORDER BY alias` works but `WHERE alias = …` doesn't." }
        ]
      },
      {
        title: "Sample tables used in these notes",
        blocks: [
          { p: "**employees**: note Faye has no department, and Ana has no manager." },
          { table: EMP },
          { p: "**departments**: note Marketing (40) has no employees." },
          { table: DEPT }
        ]
      },
      {
        title: "Keys & constraints",
        blocks: [
          { code: C`
            CREATE TABLE departments (
                dept_id    NUMBER(4)     PRIMARY KEY,
                dept_name  VARCHAR2(50)  NOT NULL UNIQUE,
                location   VARCHAR2(50)  DEFAULT 'Manila'
            );

            CREATE TABLE employees (
                emp_id     NUMBER(6)     PRIMARY KEY,
                name       VARCHAR2(100) NOT NULL,
                email      VARCHAR2(100) UNIQUE,
                dept_id    NUMBER(4)     REFERENCES departments(dept_id),   -- FOREIGN KEY
                manager_id NUMBER(6)     REFERENCES employees(emp_id),      -- self-reference
                salary     NUMBER(10,2)  CHECK (salary > 0),
                hire_date  DATE          DEFAULT SYSDATE
            );
          `, lang: "sql" },
          { table: {
            head: ["Term", "Meaning"],
            rows: [
              ["**Primary key**", "Uniquely identifies each row. **Unique + NOT NULL**. Only **one** per table (it can span several columns)."],
              ["**Foreign key**", "A column referencing another table's PK. Enforces **referential integrity**: you can't insert an orphan or delete a referenced parent (unless `ON DELETE CASCADE` / `SET NULL`)."],
              ["**Unique key**", "No duplicate values, but **allows NULL**. A table can have **many**."],
              ["**Candidate key**", "Any column set that could serve as the PK. One is chosen; the rest are *alternate keys*."],
              ["**Composite key**", "A key made of 2+ columns, e.g. `(order_id, line_no)`."],
              ["**Surrogate key**", "An artificial ID (sequence/identity) with no business meaning."],
              ["**Natural key**", "A real-world unique value (email, SSN, MSISDN)."],
              ["**NOT NULL / CHECK / DEFAULT**", "Require a value / validate a condition / supply a value when none is given."]
            ]
          }}
        ]
      },
      {
        title: "Joins (with results)",
        blocks: [
          { code: C`
            -- INNER JOIN: only matching rows in BOTH tables
            SELECT e.name, d.dept_name
            FROM employees e
            INNER JOIN departments d ON e.dept_id = d.dept_id;
          `, lang: "sql" },
          { table: { head: ["name", "dept_name"], rows: [["Ana", "Engineering"], ["Ben", "Engineering"], ["Carlo", "Billing"], ["Dana", "Billing"], ["Ed", "Support"]] } },
          { p: "5 rows. **Faye** (no dept) and **Marketing** (no employees) are excluded." },
          { code: C`
            -- LEFT (OUTER) JOIN: ALL rows from the left table + matches (NULL if none)
            SELECT e.name, d.dept_name
            FROM employees e
            LEFT JOIN departments d ON e.dept_id = d.dept_id;
          `, lang: "sql" },
          { p: "6 rows: the 5 above **plus `Faye | NULL`**." },
          { code: C`
            -- RIGHT (OUTER) JOIN: ALL rows from the right table + matches
            SELECT e.name, d.dept_name
            FROM employees e
            RIGHT JOIN departments d ON e.dept_id = d.dept_id;
          `, lang: "sql" },
          { p: "6 rows: the 5 matches **plus `NULL | Marketing`**." },
          { code: C`
            -- FULL (OUTER) JOIN: everything from both sides
            SELECT e.name, d.dept_name
            FROM employees e
            FULL OUTER JOIN departments d ON e.dept_id = d.dept_id;
            -- (MySQL has no FULL JOIN: use LEFT JOIN ... UNION ... RIGHT JOIN)
          `, lang: "sql" },
          { p: "7 rows: 5 matches + Faye/NULL + NULL/Marketing." },
          { code: C`
            -- CROSS JOIN: every combination (Cartesian product)
            SELECT e.name, d.dept_name FROM employees e CROSS JOIN departments d;   -- 6 x 4 = 24 rows

            -- SELF JOIN: a table joined to itself (employee -> manager)
            SELECT e.name AS employee, m.name AS manager
            FROM employees e
            JOIN employees m ON e.manager_id = m.emp_id;
          `, lang: "sql" },
          { table: { head: ["employee", "manager"], rows: [["Ben", "Ana"], ["Carlo", "Ana"], ["Dana", "Carlo"], ["Ed", "Carlo"], ["Faye", "Ana"]] } },
          { p: "Ana isn't listed because her `manager_id` is NULL. Use a `LEFT JOIN` to include her with a NULL manager." },
          { tip: "Old Oracle syntax you may see: `WHERE e.dept_id = d.dept_id(+)` is a left outer join (the `(+)` marks the side that may be NULL). Recognize it, but write ANSI `JOIN`s." }
        ]
      },
      {
        title: "Aggregates, GROUP BY & HAVING",
        blocks: [
          { p: "Aggregate functions: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. They **ignore NULLs**, except `COUNT(*)`." },
          { code: C`
            SELECT dept_id, COUNT(*) AS headcount, AVG(salary) AS avg_sal, MAX(salary) AS top_sal
            FROM employees
            GROUP BY dept_id
            ORDER BY dept_id;
          `, lang: "sql" },
          { table: { head: ["dept_id", "headcount", "avg_sal", "top_sal"], rows: [["10", "2", "75000", "90000"], ["20", "2", "75000", "75000"], ["30", "1", "50000", "50000"], ["NULL", "1", "45000", "45000"]] } },
          { p: "NULLs form their own group. (Oracle sorts NULLs **last** in ascending order by default.)" },
          { code: C`
            -- departments with more than 1 employee
            SELECT dept_id, COUNT(*)
            FROM employees
            GROUP BY dept_id
            HAVING COUNT(*) > 1;            -- -> 10 and 20

            -- WHERE + HAVING together
            SELECT dept_id, AVG(salary)
            FROM employees
            WHERE hire_date >= DATE '2019-01-01'   -- filter rows first
            GROUP BY dept_id
            HAVING AVG(salary) > 55000;            -- then filter groups
          `, lang: "sql" },
          { table: {
            head: ["", "WHERE", "HAVING"],
            rows: [
              ["Filters", "Individual rows", "Groups"],
              ["Runs", "Before GROUP BY", "After GROUP BY"],
              ["Aggregates allowed?", "**No**", "**Yes**"],
              ["Without GROUP BY?", "Yes", "Yes (treats the whole table as one group)"]
            ]
          }},
          { table: {
            head: ["Expression", "Counts"],
            rows: [
              ["`COUNT(*)`", "All rows, including NULLs → 6"],
              ["`COUNT(dept_id)`", "Non-NULL values in the column → 5"],
              ["`COUNT(DISTINCT dept_id)`", "Distinct non-NULL values → 3"]
            ]
          }},
          { warn: "Every non-aggregated column in SELECT must appear in GROUP BY. `SELECT dept_id, name, COUNT(*) … GROUP BY dept_id` is an error in Oracle (ORA-00979) and in standard SQL." }
        ]
      },
      {
        title: "Subqueries, EXISTS & set operators",
        blocks: [
          { code: C`
            -- Single-row subquery: who earns more than the average?
            SELECT name, salary FROM employees
            WHERE salary > (SELECT AVG(salary) FROM employees);       -- avg = 65833.33 -> Ana, Carlo, Dana

            -- Multi-row subquery with IN
            SELECT name FROM employees
            WHERE dept_id IN (SELECT dept_id FROM departments WHERE location = 'Manila');   -- Ana, Ben, Ed

            -- Correlated subquery: runs once per outer row
            -- employees earning more than their department's average
            SELECT e.name, e.salary
            FROM employees e
            WHERE e.salary > (SELECT AVG(salary) FROM employees x WHERE x.dept_id = e.dept_id);   -- Ana

            -- EXISTS: true if the subquery returns at least one row
            SELECT d.dept_name FROM departments d
            WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.dept_id);   -- Marketing
          `, lang: "sql" },
          { warn: "**The NOT IN + NULL trap:** if the subquery returns any NULL, `NOT IN` returns **no rows**, because `x <> NULL` is UNKNOWN. `SELECT dept_name FROM departments WHERE dept_id NOT IN (SELECT dept_id FROM employees)` returns nothing here, since Faye's dept_id is NULL. Use `NOT EXISTS` or filter out NULLs." },
          { table: {
            head: ["Operator", "Returns"],
            rows: [
              ["`UNION`", "Rows from both queries, **duplicates removed** (it sorts/hashes, so it's slower)"],
              ["`UNION ALL`", "Rows from both, **duplicates kept**, faster"],
              ["`INTERSECT`", "Rows present in **both**"],
              ["`MINUS` (Oracle) / `EXCEPT` (SQL Server, PostgreSQL)", "Rows in the first query **not** in the second"]
            ]
          }},
          { p: "Rules: the same **number** of columns, **compatible types**, and column names come from the first query. `ORDER BY` only at the very end." }
        ]
      },
      {
        title: "DELETE vs TRUNCATE vs DROP",
        blocks: [
          { table: {
            head: ["", "DELETE", "TRUNCATE", "DROP"],
            rows: [
              ["Type", "DML", "DDL", "DDL"],
              ["Removes", "Selected rows (`WHERE`) or all", "**All** rows", "Whole table: data + structure + indexes + constraints"],
              ["WHERE clause", "✔", "✘", "✘"],
              ["Rollback?", "✔ (before COMMIT)", "✘ in Oracle (auto-commit)*", "✘ (Oracle 10g+: `FLASHBACK TABLE … TO BEFORE DROP` from the recycle bin)"],
              ["Triggers fire?", "✔", "✘", "✘"],
              ["Speed", "Slow (logs every row)", "Fast (deallocates pages)", "Fast"],
              ["Identity / sequence", "Not reset", "Reset (identity columns)", "Gone"]
            ]
          }},
          { p: "*In SQL Server and PostgreSQL, TRUNCATE *can* be rolled back inside an explicit transaction. In interviews the expected answer is usually the Oracle one: TRUNCATE is DDL and auto-commits." }
        ]
      },
      {
        title: "Indexes",
        blocks: [
          { p: "An **index** is a separate structure (usually a **B-tree**) that lets the database find rows without scanning the whole table, like a book's index." },
          { code: C`
            CREATE INDEX idx_emp_dept ON employees(dept_id);
            CREATE UNIQUE INDEX idx_emp_email ON employees(email);
            CREATE INDEX idx_emp_dept_sal ON employees(dept_id, salary);   -- composite
            DROP INDEX idx_emp_dept;
          `, lang: "sql" },
          { table: {
            head: ["", "Clustered", "Non-clustered"],
            rows: [
              ["Data", "Table rows are **physically stored** in index order", "A separate structure with pointers (ROWIDs) to rows"],
              ["How many", "**One** per table", "Many"],
              ["Example", "SQL Server PK by default; Oracle's equivalent is an Index-Organized Table", "Most secondary indexes"]
            ]
          }},
          { ul: [
            "**Good for:** columns in `WHERE`, `JOIN`, `ORDER BY`, high-selectivity columns, foreign keys.",
            "**Cost:** extra storage, and **slower INSERT/UPDATE/DELETE**, because indexes must be maintained too.",
            "**Index can't be used when** you wrap the column in a function (`WHERE UPPER(name) = 'ANA'`, unless there's a function-based index), use a leading wildcard (`LIKE '%ana'`), or compare with implicit type conversion.",
            "A composite index `(dept_id, salary)` helps queries that filter on `dept_id` (the leading column), not on `salary` alone.",
            "PK and UNIQUE constraints create an index automatically.",
            "Check usage with `EXPLAIN PLAN FOR …` (Oracle) or `EXPLAIN` (MySQL/PostgreSQL)."
          ]}
        ]
      },
      {
        title: "Normalization",
        blocks: [
          { p: "Organizing tables to **reduce redundancy** and avoid **update, insert and delete anomalies**." },
          { table: {
            head: ["Form", "Rule", "Fix"],
            rows: [
              ["**1NF**", "Atomic values; no repeating groups or multi-valued columns", "`phones = '0917…, 0918…'` → one row per phone, or a separate table"],
              ["**2NF**", "1NF + no **partial dependency**: non-key columns depend on the *whole* composite key", "In `(order_id, product_id) → product_name`, product_name depends only on product_id → move it to a products table"],
              ["**3NF**", "2NF + no **transitive dependency**: non-key → non-key", "`emp_id → dept_id → dept_name`: move dept_name to departments"],
              ["**BCNF**", "Stricter 3NF: every determinant is a candidate key", "Split the table on the offending dependency"]
            ]
          }},
          { p: "Memory aid: every non-key column depends on **the key (1NF), the whole key (2NF), and nothing but the key (3NF)**." },
          { p: "**Denormalization** deliberately adds redundancy (pre-joined or summary tables) to speed up reads in reporting or data warehouses, at the cost of harder updates." }
        ]
      },
      {
        title: "Transactions, ACID & isolation",
        blocks: [
          { ul: [
            "**Atomicity**: all or nothing. If any step fails, the whole transaction rolls back.",
            "**Consistency**: moves the DB from one valid state to another (constraints hold).",
            "**Isolation**: concurrent transactions don't see each other's uncommitted work.",
            "**Durability**: once committed, the change survives crashes (redo logs)."
          ]},
          { code: C`
            UPDATE accounts SET balance = balance - 500 WHERE acct_id = 1;
            SAVEPOINT after_debit;
            UPDATE accounts SET balance = balance + 500 WHERE acct_id = 2;
            -- something wrong?
            ROLLBACK TO after_debit;   -- undo only the credit
            -- all good?
            COMMIT;                    -- make permanent
          `, lang: "sql" },
          { table: {
            head: ["Isolation level", "Dirty read", "Non-repeatable read", "Phantom read"],
            rows: [
              ["READ UNCOMMITTED", "Possible", "Possible", "Possible"],
              ["READ COMMITTED (**Oracle default**)", "✘", "Possible", "Possible"],
              ["REPEATABLE READ (MySQL InnoDB default)", "✘", "✘", "Possible*"],
              ["SERIALIZABLE", "✘", "✘", "✘"]
            ]
          }},
          { ul: [
            "**Dirty read**: reading another transaction's *uncommitted* change (which may be rolled back).",
            "**Non-repeatable read**: you re-read the same row and its *value* changed (someone committed an UPDATE).",
            "**Phantom read**: you re-run the same query and *new rows* appear (someone committed an INSERT)."
          ]},
          { p: "*InnoDB largely prevents phantoms at REPEATABLE READ using next-key locks." }
        ]
      },
      {
        title: "Window (analytic) functions",
        blocks: [
          { p: "Window functions compute across a set of rows **without collapsing them** like GROUP BY does. Syntax: `FUNCTION() OVER (PARTITION BY … ORDER BY …)`." },
          { code: C`
            SELECT name, salary,
                   ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
                   RANK()       OVER (ORDER BY salary DESC) AS rnk,
                   DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk
            FROM employees;
          `, lang: "sql" },
          { table: {
            head: ["name", "salary", "ROW_NUMBER", "RANK", "DENSE_RANK"],
            rows: [
              ["Ana", "90000", "1", "1", "1"],
              ["Carlo", "75000", "2", "2", "2"],
              ["Dana", "75000", "3", "2", "2"],
              ["Ben", "60000", "4", "**4**", "**3**"],
              ["Ed", "50000", "5", "5", "4"],
              ["Faye", "45000", "6", "6", "5"]
            ]
          }},
          { p: "**ROW_NUMBER** is always unique (ties broken arbitrarily). **RANK** gives ties the same rank and then **skips** (1, 2, 2, 4). **DENSE_RANK** gives ties the same rank with **no gaps** (1, 2, 2, 3)." },
          { code: C`
            -- per-department ranking
            SELECT name, dept_id, salary,
                   RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dept_rank
            FROM employees;

            -- running total & previous row's value
            SELECT name, hire_date, salary,
                   SUM(salary) OVER (ORDER BY hire_date)  AS running_total,
                   LAG(salary)  OVER (ORDER BY hire_date) AS prev_hire_salary,
                   LEAD(salary) OVER (ORDER BY hire_date) AS next_hire_salary
            FROM employees;

            -- each employee vs department average (no GROUP BY needed)
            SELECT name, dept_id, salary,
                   AVG(salary) OVER (PARTITION BY dept_id) AS dept_avg
            FROM employees;
          `, lang: "sql" }
        ]
      },
      {
        title: "Views, procedures, triggers & more",
        blocks: [
          { table: {
            head: ["Object", "What it is"],
            rows: [
              ["**View**", "A saved SELECT, i.e. a *virtual table* with no data of its own (it runs the query each time). Used for security (hide columns) and simplicity. Simple views can be updatable."],
              ["**Materialized view**", "Stores the query result physically; refreshed on schedule or on commit. Fast reads for reports."],
              ["**Stored procedure**", "Precompiled named PL/SQL block. Can have IN/OUT params, run DML and transactions. Called with `EXEC` / `CALL`. Doesn't have to return a value."],
              ["**Function**", "Must **return a value**; can be used inside SQL (`SELECT fn(x) FROM …`). Shouldn't do DML when called from SQL."],
              ["**Trigger**", "Code that runs **automatically** BEFORE/AFTER INSERT/UPDATE/DELETE on a table, for auditing, validation or derived columns."],
              ["**Cursor**", "A pointer for processing a query's result **row by row** in PL/SQL. *Implicit* for single statements; *explicit* with OPEN / FETCH / CLOSE."],
              ["**Sequence**", "Oracle object generating unique numbers: `emp_seq.NEXTVAL`, `emp_seq.CURRVAL`."],
              ["**Synonym**", "An alias for another object (often in another schema)."]
            ]
          }},
          { code: C`
            CREATE OR REPLACE VIEW v_emp_dept AS
            SELECT e.name, d.dept_name, e.salary
            FROM employees e JOIN departments d ON e.dept_id = d.dept_id;

            CREATE OR REPLACE PROCEDURE raise_salary(p_emp_id IN NUMBER, p_pct IN NUMBER) AS
            BEGIN
                UPDATE employees SET salary = salary * (1 + p_pct / 100) WHERE emp_id = p_emp_id;
                COMMIT;
            END;
            /
            EXEC raise_salary(2, 10);

            CREATE OR REPLACE TRIGGER trg_emp_audit
            AFTER UPDATE OF salary ON employees
            FOR EACH ROW
            BEGIN
                INSERT INTO salary_audit(emp_id, old_sal, new_sal, changed_on)
                VALUES (:OLD.emp_id, :OLD.salary, :NEW.salary, SYSDATE);
            END;
            /
          `, lang: "sql" }
        ]
      },
      {
        title: "NULLs & handy functions (Oracle vs others)",
        blocks: [
          { ul: [
            "NULL means *unknown*. Any comparison with NULL (`=`, `<>`, `>`) is **UNKNOWN**, so use `IS NULL` / `IS NOT NULL`.",
            "`NULL + 5` = NULL. Aggregates skip NULLs, so `AVG(10, 20, NULL)` = 15, not 10.",
            "In Oracle, an **empty string `''` is treated as NULL**."
          ]},
          { table: {
            head: ["Need", "Oracle", "MySQL", "SQL Server / Postgres"],
            rows: [
              ["Replace NULL", "`NVL(x, 0)`, `COALESCE`", "`IFNULL(x, 0)`, `COALESCE`", "`ISNULL` / `COALESCE`"],
              ["Top N rows", "`FETCH FIRST 5 ROWS ONLY` (12c+), `WHERE ROWNUM <= 5`", "`LIMIT 5`", "`TOP 5` / `LIMIT 5`"],
              ["Current date", "`SYSDATE`, `SYSTIMESTAMP`", "`NOW()`, `CURDATE()`", "`GETDATE()` / `NOW()`"],
              ["Dummy table", "`SELECT 1 FROM DUAL`", "Not needed", "Not needed"],
              ["Concat", "`'a' || 'b'`, `CONCAT`", "`CONCAT('a','b')`", "`+` / `||`"],
              ["Set difference", "`MINUS`", "(8.0.31+: `EXCEPT`)", "`EXCEPT`"],
              ["Date → text", "`TO_CHAR(d, 'YYYY-MM-DD')`", "`DATE_FORMAT`", "`FORMAT` / `TO_CHAR`"],
              ["Text → date", "`TO_DATE('2026-11-26','YYYY-MM-DD')`", "`STR_TO_DATE`", "`CAST` / `TO_DATE`"]
            ]
          }},
          { code: C`
            SELECT UPPER(name), LOWER(name), LENGTH(name),
                   SUBSTR(name, 1, 3),         -- first 3 chars (Oracle is 1-based)
                   INSTR(name, 'a'),           -- position of 'a'
                   TRIM('  hi  '), REPLACE(name, 'a', 'o'),
                   ROUND(salary / 12, 2), TRUNC(hire_date, 'MM'),
                   NVL(manager_id, 0),
                   CASE WHEN salary >= 75000 THEN 'High'
                        WHEN salary >= 50000 THEN 'Mid'
                        ELSE 'Entry' END AS band,
                   DECODE(dept_id, 10, 'Eng', 20, 'Bill', 'Other') AS short_dept   -- Oracle-only
            FROM employees;

            -- ROWNUM pitfall: ROWNUM is assigned BEFORE ORDER BY
            SELECT * FROM (SELECT * FROM employees ORDER BY salary DESC) WHERE ROWNUM <= 3;   -- correct top 3
          `, lang: "sql" }
        ]
      },
      {
        title: "Classic interview queries",
        blocks: [
          { p: "Be ready to write these **by hand**, and know more than one way to do each." },
          { code: C`
            -- 1) SECOND HIGHEST salary  (-> 75000)
            SELECT MAX(salary) FROM employees
            WHERE salary < (SELECT MAX(salary) FROM employees);

            -- 2) Nth HIGHEST salary (N = 3 -> 60000) with DENSE_RANK
            SELECT DISTINCT salary FROM (
                SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
                FROM employees
            ) t
            WHERE rnk = 3;

            --    ...or with OFFSET/FETCH (Oracle 12c+, PostgreSQL)
            SELECT DISTINCT salary FROM employees
            ORDER BY salary DESC
            OFFSET 2 ROWS FETCH NEXT 1 ROWS ONLY;

            --    ...or MySQL
            SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 2;

            -- 3) Find DUPLICATE emails
            SELECT email, COUNT(*) AS cnt
            FROM customers
            GROUP BY email
            HAVING COUNT(*) > 1;

            -- 4) DELETE duplicates, keep the lowest id
            DELETE FROM customers
            WHERE id NOT IN (SELECT MIN(id) FROM customers GROUP BY email);

            --    Oracle classic using ROWID
            DELETE FROM customers a
            WHERE a.ROWID > (SELECT MIN(b.ROWID) FROM customers b WHERE b.email = a.email);

            -- 5) Employees who earn MORE than their MANAGER
            SELECT e.name, e.salary, m.name AS manager, m.salary AS mgr_salary
            FROM employees e
            JOIN employees m ON e.manager_id = m.emp_id
            WHERE e.salary > m.salary;

            -- 6) HIGHEST-paid employee in EACH department
            SELECT dept_id, name, salary FROM (
                SELECT e.*, RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk
                FROM employees e
            ) t
            WHERE rnk = 1;

            --    without window functions
            SELECT e.dept_id, e.name, e.salary
            FROM employees e
            WHERE e.salary = (SELECT MAX(salary) FROM employees x WHERE x.dept_id = e.dept_id);

            -- 7) Departments with NO employees (-> Marketing)
            SELECT d.dept_name
            FROM departments d
            LEFT JOIN employees e ON e.dept_id = d.dept_id
            WHERE e.emp_id IS NULL;

            -- 8) Headcount per department INCLUDING zero
            SELECT d.dept_name, COUNT(e.emp_id) AS headcount     -- COUNT(col), not COUNT(*)!
            FROM departments d
            LEFT JOIN employees e ON e.dept_id = d.dept_id
            GROUP BY d.dept_name;

            -- 9) Department with the HIGHEST average salary
            SELECT dept_id, AVG(salary) AS avg_sal
            FROM employees
            WHERE dept_id IS NOT NULL
            GROUP BY dept_id
            ORDER BY avg_sal DESC
            FETCH FIRST 1 ROWS ONLY;       -- MySQL: LIMIT 1  (note: ties 10 & 20 here!)

            -- 10) Pattern matching
            SELECT name FROM employees WHERE name LIKE 'A%';    -- starts with A
            SELECT name FROM employees WHERE name LIKE '%a';    -- ends with a
            SELECT name FROM employees WHERE name LIKE '_a%';   -- 2nd letter is a  (Dana, Faye)

            -- 11) Employees hired in 2021 / in the last 90 days
            SELECT * FROM employees WHERE EXTRACT(YEAR FROM hire_date) = 2021;
            SELECT * FROM employees WHERE hire_date >= SYSDATE - 90;

            -- 12) Odd / even rows by id
            SELECT * FROM employees WHERE MOD(emp_id, 2) = 1;

            -- 13) Copy a table's structure (and optionally data)
            CREATE TABLE emp_backup AS SELECT * FROM employees;            -- with data
            CREATE TABLE emp_empty  AS SELECT * FROM employees WHERE 1 = 0; -- structure only

            -- 14) UPDATE with a subquery: give Billing a 5% raise
            UPDATE employees
            SET salary = salary * 1.05
            WHERE dept_id = (SELECT dept_id FROM departments WHERE dept_name = 'Billing');
          `, lang: "sql" },
          { tip: "For #9, mention the tie. Interviewers like it when you spot that `LIMIT 1` hides a second department with the same average. A `RANK()` approach returns both." }
        ]
      }
    ],

    qa: [
      { q: "What is the difference between DELETE, TRUNCATE and DROP?", a: "**DELETE** (DML) removes selected rows with WHERE, fires triggers, can be rolled back, and is slow. **TRUNCATE** (DDL) removes all rows quickly, has no WHERE, fires no triggers, auto-commits in Oracle and resets identity. **DROP** (DDL) removes the whole table: structure, data, indexes and constraints." },
      { q: "WHERE vs HAVING?", a: "WHERE filters **rows before** grouping and can't use aggregates. HAVING filters **groups after** GROUP BY and can use aggregates like `COUNT(*) > 1`. Prefer WHERE for row filters; it's more efficient." },
      { q: "Primary key vs unique key?", a: "Both enforce uniqueness. A **primary key** can't be NULL, there's only **one** per table, and it's the row's main identifier (often clustered in SQL Server). A **unique key** allows NULL(s), and a table can have **many**." },
      { q: "What is a foreign key?", a: "A column (or set) in a child table that references the primary/unique key of a parent table, enforcing **referential integrity**. You can't insert a value that doesn't exist in the parent, or delete a parent that still has children, unless you use `ON DELETE CASCADE` or `ON DELETE SET NULL`." },
      { q: "Explain the different types of JOINs.", a: "- **INNER**: only matching rows from both tables.\n- **LEFT**: all left rows + matches (NULLs where none).\n- **RIGHT**: all right rows + matches.\n- **FULL OUTER**: all rows from both sides.\n- **CROSS**: Cartesian product (m × n).\n- **SELF**: a table joined to itself, e.g. employee → manager." },
      { q: "How do you find the second highest salary?", a: "Max of salaries below the max, or DENSE_RANK = 2.", code: "SELECT MAX(salary) FROM employees\nWHERE salary < (SELECT MAX(salary) FROM employees);", lang: "sql" },
      { q: "RANK vs DENSE_RANK vs ROW_NUMBER?", a: "For salaries 90, 75, 75, 60: **ROW_NUMBER** gives 1, 2, 3, 4 (always unique). **RANK** gives 1, 2, 2, 4 (ties share a rank, then a gap). **DENSE_RANK** gives 1, 2, 2, 3 (ties share a rank, no gap). Use DENSE_RANK for \"Nth highest distinct value\"." },
      { q: "UNION vs UNION ALL?", a: "UNION combines results and **removes duplicates**, which needs a sort or hash, so it's slower. UNION ALL keeps **all** rows including duplicates and is faster. Both need the same number of columns with compatible types." },
      { q: "What is normalization? Explain 1NF, 2NF, 3NF.", a: "Structuring tables to reduce redundancy and anomalies.\n- **1NF**: atomic values, no repeating groups.\n- **2NF**: 1NF + no partial dependency on part of a composite key.\n- **3NF**: 2NF + no transitive dependency (non-key column depending on another non-key column).\nIn short: \"the key, the whole key, and nothing but the key\"." },
      { q: "What is denormalization and when would you use it?", a: "Intentionally adding redundancy (duplicate columns, pre-aggregated tables) to reduce joins and speed up reads, typically for reporting, dashboards or data warehouses. The trade-off is more storage and harder, riskier updates." },
      { q: "What are ACID properties?", a: "**Atomicity**: all or nothing. **Consistency**: constraints always hold. **Isolation**: concurrent transactions don't interfere. **Durability**: committed data survives failures." },
      { q: "What is an index? What are its disadvantages?", a: "A data structure (usually a B-tree) that speeds up lookups on columns used in WHERE, JOIN and ORDER BY. Downsides: extra storage, and slower INSERT/UPDATE/DELETE because the index must be maintained. Too many indexes hurt write-heavy tables." },
      { q: "Clustered vs non-clustered index?", a: "A clustered index determines the **physical order** of rows, so there's only one per table (SQL Server PK by default; Oracle's equivalent is an index-organized table). A non-clustered index is a separate structure with pointers to rows, and you can have many." },
      { q: "What is a view? Can you update through a view?", a: "A view is a stored query that acts as a virtual table with no data of its own. It's used to simplify complex joins and restrict access to columns or rows. Simple views over one table without aggregates, DISTINCT or GROUP BY are usually updatable. Complex ones need INSTEAD OF triggers." },
      { q: "Stored procedure vs function?", a: "A **function** must return a value, can be called inside SQL (`SELECT fn(col)`), and generally shouldn't do DML when used in queries. A **procedure** may return nothing or use OUT params, is called with EXEC/CALL, can run DML and manage transactions, but can't be used in a SELECT." },
      { q: "What is a trigger?", a: "PL/SQL code that runs automatically BEFORE or AFTER an INSERT, UPDATE or DELETE (row-level or statement-level). It's used for auditing, enforcing complex rules, or maintaining derived data. Overusing triggers makes behavior hard to trace." },
      { q: "What is a correlated subquery?", a: "A subquery that references a column from the outer query, so it runs **once per outer row**. Example: employees earning more than their own department's average: `WHERE salary > (SELECT AVG(salary) FROM employees x WHERE x.dept_id = e.dept_id)`." },
      { q: "IN vs EXISTS?", a: "`IN` compares a value against a list or subquery result. `EXISTS` checks whether the subquery returns at least one row and stops at the first match. EXISTS is often better for large correlated subqueries, and `NOT EXISTS` is **NULL-safe**, unlike `NOT IN`, which returns nothing if the list contains a NULL." },
      { q: "COUNT(*) vs COUNT(column) vs COUNT(DISTINCT column)?", a: "`COUNT(*)` counts all rows, NULLs included. `COUNT(col)` counts non-NULL values of that column. `COUNT(DISTINCT col)` counts unique non-NULL values." },
      { q: "How do you handle NULLs in SQL?", a: "Use `IS NULL` / `IS NOT NULL`, never `= NULL`. Replace them with `NVL` (Oracle), `IFNULL` (MySQL) or `COALESCE` (standard, which returns the first non-NULL argument). Remember that aggregates ignore NULLs and that any arithmetic with NULL gives NULL." },
      { q: "What are the transaction isolation levels?", a: "READ UNCOMMITTED (dirty reads possible) → READ COMMITTED (Oracle default; no dirty reads) → REPEATABLE READ (no non-repeatable reads; MySQL default) → SERIALIZABLE (fully isolated, slowest). Higher isolation means fewer anomalies but more locking and less concurrency." },
      { q: "What is a deadlock in databases?", a: "Two transactions each hold a lock the other needs. The DB detects it and rolls back one of them (Oracle raises ORA-00060). Avoid it by accessing tables and rows in a consistent order and keeping transactions short." },
      { q: "What is the difference between CHAR and VARCHAR2?", a: "`CHAR(n)` is fixed length and padded with spaces up to n. `VARCHAR2(n)` (Oracle; `VARCHAR` elsewhere) is variable length and stores only the actual characters. Use VARCHAR2 for most text." },
      { q: "What is ROWNUM vs ROWID in Oracle?", a: "**ROWNUM** is a pseudo-column numbering rows *as they are returned*, assigned before ORDER BY, so wrap the sort in a subquery for top-N. **ROWID** is the physical address of a row: the fastest way to access a row, and handy for deleting duplicates." },
      { q: "What is the difference between a primary key and an index?", a: "A primary key is a **constraint** (a logical rule: unique + not null). An index is a **physical structure** for fast lookup. Creating a PK automatically creates a unique index to enforce it." },
      { q: "How do you find duplicate records in a table?", a: "Group by the columns that define a duplicate and filter with HAVING.", code: "SELECT email, COUNT(*)\nFROM customers\nGROUP BY email\nHAVING COUNT(*) > 1;", lang: "sql" },
      { q: "What is a cursor?", a: "A pointer to a query's result set that PL/SQL code processes **one row at a time**. **Implicit** cursors are created automatically for single DML/SELECT INTO. **Explicit** cursors are declared, then OPEN → FETCH (loop) → CLOSE. Row-by-row work is slower than set-based SQL, so use cursors only when necessary." },
      { q: "What's the difference between OLTP and OLAP?", a: "**OLTP** (Online Transaction Processing): many small, fast reads and writes, normalized, e.g. billing transactions. **OLAP** (Online Analytical Processing): complex read-heavy queries over large historical data, often denormalized star schemas, e.g. revenue reports." }
    ],

    quiz: [
      { q: "Which command removes all rows quickly, **can't** use WHERE, and auto-commits in Oracle?", options: ["DELETE", "TRUNCATE", "DROP", "REMOVE"], answer: 1,
        explain: "TRUNCATE is DDL: fast, removes all rows, no WHERE, no row triggers, implicit commit in Oracle." },
      { q: "Which clause filters **groups** after aggregation?", options: ["WHERE", "GROUP BY", "HAVING", "ORDER BY"], answer: 2,
        explain: "HAVING runs after GROUP BY and can use aggregates such as `COUNT(*) > 1`." },
      { q: "Which of these is logically evaluated **first**?", options: ["SELECT", "WHERE", "GROUP BY", "ORDER BY"], answer: 1,
        explain: "The order is FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY." },
      { q: "`employees` has 6 rows (one with NULL dept_id). `departments` has 4 rows (one with no employees). How many rows does `employees LEFT JOIN departments ON dept_id` return?", options: ["5", "6", "7", "24"], answer: 1,
        explain: "LEFT JOIN keeps all 6 employees. The NULL-dept employee gets NULL department columns, and the empty department is not included." },
      { q: "A table has 5 rows. `commission` is NULL in 2 of them. What does `SELECT COUNT(*), COUNT(commission)` return?", options: ["5, 5", "5, 3", "3, 3", "5, 2"], answer: 1,
        explain: "COUNT(*) counts every row. COUNT(column) skips NULLs." },
      { q: "What does `SELECT * FROM emp WHERE manager_id = NULL;` return?", options: ["Rows with NULL manager_id", "All rows", "No rows", "Syntax error"], answer: 2,
        explain: "`= NULL` evaluates to UNKNOWN, never TRUE. Use `IS NULL`." },
      { q: "What is the key difference between UNION and UNION ALL?", options: ["UNION ALL removes duplicates", "UNION removes duplicates", "UNION requires same column names", "No difference"], answer: 1,
        explain: "UNION de-duplicates (extra sort/hash work). UNION ALL keeps every row and is faster." },
      { q: "Which statement is TRUE?", options: ["A table can have many primary keys", "A primary key can contain NULL", "A table can have many UNIQUE constraints but only one primary key", "UNIQUE never allows NULL"], answer: 2,
        explain: "One PK (unique + not null) per table; any number of UNIQUE constraints, which allow NULLs." },
      { q: "Which is a **DDL** command?", options: ["UPDATE", "ALTER", "INSERT", "GRANT"], answer: 1,
        explain: "DDL = CREATE, ALTER, DROP, TRUNCATE, RENAME. UPDATE/INSERT are DML; GRANT is DCL." },
      { q: "Which is a **TCL** command?", options: ["SAVEPOINT", "SELECT", "REVOKE", "MERGE"], answer: 0,
        explain: "TCL = COMMIT, ROLLBACK, SAVEPOINT." },
      { q: "`SELECT name FROM employees WHERE dept_id NOT IN (10, NULL);` returns:", options: ["Everyone not in dept 10", "Everyone", "No rows", "Error"], answer: 2,
        explain: "NOT IN expands to `dept_id <> 10 AND dept_id <> NULL`. The second part is UNKNOWN, so no row qualifies." },
      { q: "Salaries 90k, 75k, 75k, 60k ordered DESC. What `DENSE_RANK()` does 60k get?", options: ["2", "3", "4", "5"], answer: 1,
        explain: "DENSE_RANK has no gaps: 1, 2, 2, 3." },
      { q: "Same data (90k, 75k, 75k, 60k). What `RANK()` does 60k get?", options: ["2", "3", "4", "5"], answer: 2,
        explain: "RANK leaves a gap after ties: 1, 2, 2, 4." },
      { q: "What is the main **disadvantage** of adding many indexes?", options: ["Slower SELECTs", "Slower INSERT/UPDATE/DELETE and more storage", "Data loss", "Breaks foreign keys"], answer: 1,
        explain: "Every write must update every index, and each index takes space." },
      { q: "2NF eliminates which dependency?", options: ["Transitive", "Partial (on part of a composite key)", "Multi-valued", "Join"], answer: 1,
        explain: "2NF removes partial dependencies. 3NF removes transitive ones." },
      { q: "In ACID, the **I** stands for:", options: ["Integrity", "Indexing", "Isolation", "Idempotency"], answer: 2,
        explain: "Atomicity, Consistency, Isolation, Durability." },
      { q: "Which isolation level allows **dirty reads**?", options: ["READ COMMITTED", "READ UNCOMMITTED", "REPEATABLE READ", "SERIALIZABLE"], answer: 1,
        explain: "Only READ UNCOMMITTED lets you see other transactions' uncommitted changes." },
      { q: "`WHERE name LIKE '_a%'` matches names where:", options: ["The name starts with a", "The second letter is a", "The name ends with a", "The name contains _a"], answer: 1,
        explain: "`_` = exactly one character, `%` = any number of characters." },
      { q: "In Oracle, which operator returns rows from the first query that are **not** in the second?", options: ["EXCEPT ALL", "MINUS", "DIFF", "NOT UNION"], answer: 1,
        explain: "Oracle uses MINUS. SQL Server and PostgreSQL use EXCEPT." },
      { q: "What is `AVG(score)` over the values 10, 20 and NULL?", options: ["10", "15", "NULL", "Error"], answer: 1,
        explain: "Aggregates ignore NULLs: (10 + 20) / 2 = 15." },
      { q: "A view is best described as:", options: ["A physical copy of a table", "A stored query / virtual table", "An index", "A backup"], answer: 1,
        explain: "A (non-materialized) view stores only the query. Data is read from the base tables each time." },
      { q: "A SELF JOIN is typically used for:", options: ["Combining two databases", "Hierarchical data like employee → manager", "Removing duplicates", "Creating indexes"], answer: 1,
        explain: "Join the table to itself with aliases, e.g. `e.manager_id = m.emp_id`." },
      { q: "`employees` (6 rows) CROSS JOIN `departments` (4 rows) returns how many rows?", options: ["6", "10", "24", "4"], answer: 2,
        explain: "Cartesian product: 6 × 4 = 24." },
      { q: "What happens with: `SELECT dept_id, name, COUNT(*) FROM employees GROUP BY dept_id;` in Oracle?", options: ["Works fine", "Error: name is not a GROUP BY expression", "Returns one row", "Returns all rows"], answer: 1,
        explain: "Non-aggregated columns in SELECT must be in GROUP BY (ORA-00979)." },
      { q: "Which removes the table **structure** as well as the data?", options: ["DELETE", "TRUNCATE", "DROP", "ROLLBACK"], answer: 2,
        explain: "DROP removes the table definition, data, indexes and constraints." },
      { q: "In Oracle, how do you get the top 3 earners correctly with ROWNUM?", options: ["SELECT * FROM emp WHERE ROWNUM <= 3 ORDER BY salary DESC", "SELECT * FROM (SELECT * FROM emp ORDER BY salary DESC) WHERE ROWNUM <= 3", "SELECT TOP 3 * FROM emp", "SELECT * FROM emp LIMIT 3"], answer: 1,
        explain: "ROWNUM is assigned before ORDER BY, so sort in a subquery first. (12c+ can also use FETCH FIRST 3 ROWS ONLY.)" }
    ]
  });
})();
