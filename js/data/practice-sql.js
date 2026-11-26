(function () {
  const C = String.raw;
  window.PRACTICE = window.PRACTICE || {};

  window.PRACTICE.sqlDatabases = {
    hr: {
      title: "HR",
      blurb: "The same employees/departments tables used in the SQL notes.",
      schema: C`
        CREATE TABLE departments (
          dept_id    INTEGER PRIMARY KEY,
          dept_name  TEXT NOT NULL,
          location   TEXT
        );
        CREATE TABLE employees (
          emp_id     INTEGER PRIMARY KEY,
          name       TEXT NOT NULL,
          dept_id    INTEGER REFERENCES departments(dept_id),
          manager_id INTEGER REFERENCES employees(emp_id),
          salary     INTEGER,
          hire_date  TEXT
        );
        INSERT INTO departments VALUES
          (10, 'Engineering', 'Manila'),
          (20, 'Billing', 'Cebu'),
          (30, 'Support', 'Manila'),
          (40, 'Marketing', 'Davao');
        INSERT INTO employees VALUES
          (1, 'Ana',   10,   NULL, 90000, '2019-03-01'),
          (2, 'Ben',   10,   1,    60000, '2020-07-15'),
          (3, 'Carlo', 20,   1,    75000, '2018-01-10'),
          (4, 'Dana',  20,   3,    75000, '2021-05-20'),
          (5, 'Ed',    30,   3,    50000, '2022-02-01'),
          (6, 'Faye',  NULL, 1,    45000, '2023-08-08');`
    },
    telco: {
      title: "Telco billing",
      blurb: "A tiny telecom BSS: customers, price plans, mobile lines, usage records (CDRs), invoices and payments.",
      schema: C`
        CREATE TABLE customers (
          customer_id INTEGER PRIMARY KEY,
          name        TEXT NOT NULL,
          city        TEXT,
          join_date   TEXT
        );
        CREATE TABLE plans (
          plan_id      INTEGER PRIMARY KEY,
          plan_name    TEXT NOT NULL,
          monthly_fee  REAL,
          data_mb      INTEGER,
          call_minutes INTEGER
        );
        CREATE TABLE subscriptions (
          sub_id      INTEGER PRIMARY KEY,
          customer_id INTEGER REFERENCES customers(customer_id),
          plan_id     INTEGER REFERENCES plans(plan_id),
          msisdn      TEXT UNIQUE,
          status      TEXT,          -- ACTIVE, SUSPENDED, TERMINATED
          start_date  TEXT
        );
        CREATE TABLE usage (
          usage_id   INTEGER PRIMARY KEY,
          sub_id     INTEGER REFERENCES subscriptions(sub_id),
          usage_date TEXT,
          usage_type TEXT,           -- CALL (minutes), SMS (count), DATA (MB)
          quantity   INTEGER
        );
        CREATE TABLE invoices (
          invoice_id INTEGER PRIMARY KEY,
          sub_id     INTEGER REFERENCES subscriptions(sub_id),
          bill_month TEXT,           -- 'YYYY-MM'
          amount     REAL,
          status     TEXT            -- PAID, PARTIAL, UNPAID
        );
        CREATE TABLE payments (
          payment_id INTEGER PRIMARY KEY,
          invoice_id INTEGER REFERENCES invoices(invoice_id),
          paid_date  TEXT,
          amount     REAL
        );
        INSERT INTO customers VALUES
          (1, 'Ana Reyes',      'Manila', '2023-01-15'),
          (2, 'Ben Cruz',       'Cebu',   '2023-06-01'),
          (3, 'Carla Santos',   'Davao',  '2024-02-10'),
          (4, 'Dino Garcia',    'Manila', '2024-08-21'),
          (5, 'Ella Lim',       'Cebu',   '2025-03-05'),
          (6, 'Fritz Tan',      'Manila', '2025-11-30'),
          (7, 'Gina Ramos',     'Iloilo', '2026-01-12'),
          (8, 'Hugo Dela Cruz', 'Davao',  '2026-09-01');
        INSERT INTO plans VALUES
          (1, 'Basic 299', 299, 2048,  100),
          (2, 'Plus 599',  599, 5120,  300),
          (3, 'Unli 999',  999, 20480, 1000);
        INSERT INTO subscriptions VALUES
          (101, 1, 2, '09171234501', 'ACTIVE',     '2023-01-15'),
          (102, 1, 1, '09171234502', 'ACTIVE',     '2024-05-01'),
          (103, 2, 3, '09181234503', 'ACTIVE',     '2023-06-01'),
          (104, 3, 1, '09191234504', 'ACTIVE',     '2024-02-10'),
          (105, 4, 2, '09201234505', 'SUSPENDED',  '2024-08-21'),
          (106, 5, 2, '09211234506', 'ACTIVE',     '2025-03-05'),
          (107, 6, 1, '09221234507', 'ACTIVE',     '2025-11-30'),
          (108, 7, 3, '09231234508', 'ACTIVE',     '2026-01-12'),
          (109, 5, 1, '09211234509', 'TERMINATED', '2025-06-01');
        INSERT INTO usage VALUES
          (1,  101, '2026-10-05', 'CALL', 150),
          (2,  101, '2026-10-12', 'DATA', 4000),
          (3,  103, '2026-10-08', 'DATA', 12000),
          (4,  105, '2026-10-03', 'CALL', 50),
          (5,  105, '2026-10-09', 'DATA', 1000),
          (6,  106, '2026-10-21', 'CALL', 250),
          (7,  101, '2026-11-02', 'CALL', 120),
          (8,  101, '2026-11-09', 'DATA', 3000),
          (9,  101, '2026-11-15', 'SMS',  40),
          (10, 101, '2026-11-20', 'CALL', 95),
          (11, 101, '2026-11-24', 'DATA', 2500),
          (12, 102, '2026-11-04', 'CALL', 30),
          (13, 102, '2026-11-18', 'DATA', 1500),
          (14, 103, '2026-11-01', 'CALL', 400),
          (15, 103, '2026-11-07', 'DATA', 8000),
          (16, 103, '2026-11-11', 'SMS',  10),
          (17, 103, '2026-11-19', 'CALL', 350),
          (18, 103, '2026-11-25', 'DATA', 9000),
          (19, 104, '2026-11-03', 'CALL', 80),
          (20, 104, '2026-11-10', 'SMS',  120),
          (21, 104, '2026-11-16', 'DATA', 2100),
          (22, 104, '2026-11-22', 'CALL', 45),
          (23, 106, '2026-11-06', 'CALL', 310),
          (24, 106, '2026-11-14', 'DATA', 4800),
          (25, 107, '2026-11-08', 'DATA', 500),
          (26, 107, '2026-11-12', 'SMS',  15),
          (27, 108, '2026-11-05', 'CALL', 200),
          (28, 108, '2026-11-13', 'DATA', 25000);
        INSERT INTO invoices VALUES
          (1001, 101, '2026-10', 599.00,  'PAID'),
          (1002, 102, '2026-10', 299.00,  'PAID'),
          (1003, 103, '2026-10', 999.00,  'PAID'),
          (1004, 104, '2026-10', 349.50,  'PAID'),
          (1005, 105, '2026-10', 599.00,  'UNPAID'),
          (1006, 106, '2026-10', 599.00,  'PAID'),
          (1007, 107, '2026-10', 299.00,  'PARTIAL'),
          (1008, 108, '2026-10', 999.00,  'PAID'),
          (1009, 101, '2026-11', 789.00,  'UNPAID'),
          (1010, 102, '2026-11', 299.00,  'PAID'),
          (1011, 103, '2026-11', 999.00,  'PAID'),
          (1012, 104, '2026-11', 412.00,  'UNPAID'),
          (1013, 105, '2026-11', 599.00,  'UNPAID'),
          (1014, 106, '2026-11', 624.00,  'PAID'),
          (1015, 107, '2026-11', 299.00,  'UNPAID'),
          (1016, 108, '2026-11', 1450.00, 'PARTIAL');
        INSERT INTO payments VALUES
          (1,  1001, '2026-10-20', 599.00),
          (2,  1002, '2026-10-18', 299.00),
          (3,  1003, '2026-10-25', 999.00),
          (4,  1004, '2026-10-22', 349.50),
          (5,  1006, '2026-10-19', 599.00),
          (6,  1007, '2026-10-28', 150.00),
          (7,  1008, '2026-10-30', 999.00),
          (8,  1010, '2026-11-18', 299.00),
          (9,  1011, '2026-11-20', 999.00),
          (10, 1014, '2026-11-21', 624.00),
          (11, 1016, '2026-11-24', 1000.00);`
    }
  };

  // `ordered: true` means row order matters (the problem asks for ORDER BY).
  // Column names are not checked, only the number of columns and the values.
  window.PRACTICE.sql = [
    /* ---------------- HR ---------------- */
    {
      id: "engineering-team", title: "Engineering Team", difficulty: "Easy", db: "hr", tags: ["SELECT", "WHERE", "ORDER BY"], ordered: true,
      body: [{ p: "List the `name` and `salary` of every employee in department **10**, highest salary first." }],
      hint: "Filter with `WHERE dept_id = 10`, sort with `ORDER BY salary DESC`.",
      solution: C`SELECT name, salary
        FROM employees
        WHERE dept_id = 10
        ORDER BY salary DESC;`
    },
    {
      id: "well-paid", title: "Well Paid", difficulty: "Easy", db: "hr", tags: ["WHERE", "ORDER BY"], ordered: true,
      body: [{ p: "Show `name` and `salary` for employees earning **at least 60,000**. Sort by salary descending, then by name ascending for ties." }],
      hint: "`ORDER BY salary DESC, name ASC`. Multiple sort keys are separated by commas.",
      solution: C`SELECT name, salary
        FROM employees
        WHERE salary >= 60000
        ORDER BY salary DESC, name;`
    },
    {
      id: "headcount", title: "Headcount per Department", difficulty: "Easy", db: "hr", tags: ["GROUP BY", "COUNT"], ordered: true,
      body: [{ p: "For each `dept_id` that has employees, show the `dept_id` and the number of employees as `headcount`. **Leave out** employees with no department. Order by `dept_id`." }],
      hint: "`WHERE dept_id IS NOT NULL` before `GROUP BY dept_id`.",
      solution: C`SELECT dept_id, COUNT(*) AS headcount
        FROM employees
        WHERE dept_id IS NOT NULL
        GROUP BY dept_id
        ORDER BY dept_id;`
    },
    {
      id: "big-departments", title: "Big Departments", difficulty: "Easy", db: "hr", tags: ["GROUP BY", "HAVING"], ordered: false,
      body: [{ p: "Return the `dept_id` of every department with **more than one** employee." }],
      hint: "Filtering on an aggregate needs `HAVING COUNT(*) > 1`, not `WHERE`.",
      solution: C`SELECT dept_id
        FROM employees
        GROUP BY dept_id
        HAVING COUNT(*) > 1;`
    },
    {
      id: "who-works-where", title: "Who Works Where", difficulty: "Easy", db: "hr", tags: ["INNER JOIN"], ordered: true,
      body: [{ p: "Show each employee's `name` with their `dept_name`. Only include employees who belong to a department. Order by employee name." }],
      hint: "`employees e JOIN departments d ON e.dept_id = d.dept_id`. An INNER JOIN drops rows with no match automatically.",
      solution: C`SELECT e.name, d.dept_name
        FROM employees e
        JOIN departments d ON e.dept_id = d.dept_id
        ORDER BY e.name;`
    },
    {
      id: "nobody-left-behind", title: "Nobody Left Behind", difficulty: "Medium", db: "hr", tags: ["LEFT JOIN", "COALESCE"], ordered: true,
      body: [{ p: "List **every** employee's `name` and `dept_name`. If an employee has no department, show `'Unassigned'` instead of NULL. Order by `emp_id`." }],
      hint: "Use a `LEFT JOIN` to keep unmatched employees, then `COALESCE(d.dept_name, 'Unassigned')`. In Oracle you'd write `NVL(...)`, which also works here because the practice database defines `NVL` for you.",
      solution: C`SELECT e.name, COALESCE(d.dept_name, 'Unassigned') AS dept_name
        FROM employees e
        LEFT JOIN departments d ON e.dept_id = d.dept_id
        ORDER BY e.emp_id;`
    },
    {
      id: "reporting-line", title: "Reporting Line", difficulty: "Medium", db: "hr", tags: ["SELF JOIN", "LEFT JOIN"], ordered: true,
      body: [{ p: "Show every employee's `name` as `employee` and their manager's name as `manager`. Employees without a manager should show `'No manager'`. Order by `emp_id`." }],
      hint: "Join `employees` to itself: `employees e LEFT JOIN employees m ON e.manager_id = m.emp_id`.",
      solution: C`SELECT e.name AS employee, COALESCE(m.name, 'No manager') AS manager
        FROM employees e
        LEFT JOIN employees m ON e.manager_id = m.emp_id
        ORDER BY e.emp_id;`
    },
    {
      id: "second-highest", title: "Second Highest Salary", difficulty: "Medium", db: "hr", tags: ["subquery", "MAX"], ordered: false,
      body: [{ p: "Return the **second highest distinct** salary as a single column named `second_highest`. This is the most-asked SQL interview question." }],
      hint: "`SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)`. Also try a version with `DENSE_RANK()` or with `LIMIT 1 OFFSET 1` on distinct salaries.",
      solution: C`SELECT MAX(salary) AS second_highest
        FROM employees
        WHERE salary < (SELECT MAX(salary) FROM employees);`
    },
    {
      id: "empty-departments", title: "Empty Departments", difficulty: "Medium", db: "hr", tags: ["NOT EXISTS", "LEFT JOIN"], ordered: false,
      body: [
        { p: "Find the `dept_name` of every department that has **no** employees." },
        { warn: "Try `WHERE dept_id NOT IN (SELECT dept_id FROM employees)` first and see what happens. One employee has a NULL `dept_id`. This is the classic NOT IN + NULL trap." }
      ],
      hint: "`NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.dept_id)`, or a `LEFT JOIN ... WHERE e.emp_id IS NULL`.",
      solution: C`SELECT d.dept_name
        FROM departments d
        WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.dept_id);`
    },
    {
      id: "department-payroll", title: "Department Payroll", difficulty: "Medium", db: "hr", tags: ["JOIN", "SUM", "AVG", "ROUND"], ordered: true,
      body: [{ p: "For each department **that has employees**, show `dept_name`, `total_salary` and `avg_salary` (rounded to 2 decimals). Sort by total salary descending, then department name ascending." }],
      hint: "Join, `GROUP BY d.dept_name`, then `SUM(e.salary)` and `ROUND(AVG(e.salary), 2)`. Two departments tie on total, so the second sort key matters.",
      solution: C`SELECT d.dept_name, SUM(e.salary) AS total_salary, ROUND(AVG(e.salary), 2) AS avg_salary
        FROM employees e
        JOIN departments d ON e.dept_id = d.dept_id
        GROUP BY d.dept_name
        ORDER BY total_salary DESC, d.dept_name;`
    },
    {
      id: "salary-rank", title: "Salary Rank in Department", difficulty: "Hard", db: "hr", tags: ["window functions", "DENSE_RANK"], ordered: true,
      body: [{ p: "For employees who belong to a department, show `name`, `dept_id`, `salary` and `dept_rank`: their salary rank **within their department** (highest = 1, ties share a rank, no gaps). Order by `dept_id`, then `dept_rank`, then `name`." }],
      hint: "`DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC)`.",
      solution: C`SELECT name, dept_id, salary,
               DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dept_rank
        FROM employees
        WHERE dept_id IS NOT NULL
        ORDER BY dept_id, dept_rank, name;`
    },
    {
      id: "above-dept-average", title: "Above Department Average", difficulty: "Hard", db: "hr", tags: ["correlated subquery"], ordered: false,
      body: [{ p: "Return the `name` and `salary` of employees who earn **more than the average salary of their own department**." }],
      hint: "A correlated subquery: `WHERE e.salary > (SELECT AVG(x.salary) FROM employees x WHERE x.dept_id = e.dept_id)`. Or compute `AVG(salary) OVER (PARTITION BY dept_id)` in a subquery.",
      solution: C`SELECT e.name, e.salary
        FROM employees e
        WHERE e.salary > (SELECT AVG(x.salary) FROM employees x WHERE x.dept_id = e.dept_id);`
    },

    /* ---------------- TELCO ---------------- */
    {
      id: "active-lines", title: "Active Lines", difficulty: "Easy", db: "telco", tags: ["JOIN", "WHERE"], ordered: true,
      body: [{ p: "List the `msisdn` (mobile number) and customer `name` for every subscription with status `'ACTIVE'`, ordered by `msisdn`." }],
      hint: "Join `subscriptions` to `customers` on `customer_id` and filter on `s.status = 'ACTIVE'`.",
      solution: C`SELECT s.msisdn, c.name
        FROM subscriptions s
        JOIN customers c ON c.customer_id = s.customer_id
        WHERE s.status = 'ACTIVE'
        ORDER BY s.msisdn;`
    },
    {
      id: "plan-popularity", title: "Plan Popularity", difficulty: "Easy", db: "telco", tags: ["GROUP BY", "JOIN"], ordered: true,
      body: [{ p: "For each plan, show `plan_name` and the number of subscriptions on it (any status) as `subscribers`. Most popular first; break ties by plan name." }],
      hint: "Join `plans` to `subscriptions`, `GROUP BY p.plan_name`, `ORDER BY subscribers DESC, p.plan_name`.",
      solution: C`SELECT p.plan_name, COUNT(s.sub_id) AS subscribers
        FROM plans p
        LEFT JOIN subscriptions s ON s.plan_id = p.plan_id
        GROUP BY p.plan_name
        ORDER BY subscribers DESC, p.plan_name;`
    },
    {
      id: "customers-without-line", title: "Customers Without a Line", difficulty: "Easy", db: "telco", tags: ["NOT EXISTS", "LEFT JOIN"], ordered: false,
      body: [{ p: "Find the `name` of every customer who has **no subscription at all**." }],
      hint: "`LEFT JOIN subscriptions ... WHERE s.sub_id IS NULL`, or `NOT EXISTS`.",
      solution: C`SELECT c.name
        FROM customers c
        LEFT JOIN subscriptions s ON s.customer_id = c.customer_id
        WHERE s.sub_id IS NULL;`
    },
    {
      id: "multi-line-customers", title: "Multi-line Customers", difficulty: "Medium", db: "telco", tags: ["GROUP BY", "HAVING"], ordered: true,
      body: [{ p: "Show the `name` and number of lines (`lines`) of customers who have **more than one** subscription (any status), ordered by name." }],
      hint: "Group by customer, keep groups with `HAVING COUNT(*) > 1`.",
      solution: C`SELECT c.name, COUNT(*) AS lines
        FROM customers c
        JOIN subscriptions s ON s.customer_id = c.customer_id
        GROUP BY c.customer_id, c.name
        HAVING COUNT(*) > 1
        ORDER BY c.name;`
    },
    {
      id: "november-data", title: "November Data Usage", difficulty: "Medium", db: "telco", tags: ["SUM", "dates", "GROUP BY"], ordered: true,
      body: [{ p: "For **November 2026**, show each line's `msisdn` and total data used as `data_mb`. Only include lines that used data that month. Biggest users first." }],
      hint: "Dates are text like `'2026-11-09'`, so `usage_date LIKE '2026-11-%'` (or `strftime('%Y-%m', usage_date) = '2026-11'`) picks November. Also filter `usage_type = 'DATA'`.",
      solution: C`SELECT s.msisdn, SUM(u.quantity) AS data_mb
        FROM usage u
        JOIN subscriptions s ON s.sub_id = u.sub_id
        WHERE u.usage_type = 'DATA' AND u.usage_date LIKE '2026-11-%'
        GROUP BY s.msisdn
        ORDER BY data_mb DESC;`
    },
    {
      id: "over-the-limit", title: "Over the Data Limit", difficulty: "Hard", db: "telco", tags: ["JOIN", "HAVING", "rating"], ordered: true,
      body: [{ p: "Which lines went **over their plan's data allowance** in November 2026? Show `msisdn`, `plan_name`, `data_used`, the plan's `data_mb` allowance, and `excess_mb` (used minus allowance). Order by excess, largest first. This is exactly the check a rating engine runs before charging overage." }],
      hint: "Join `usage → subscriptions → plans`, filter November DATA rows, `GROUP BY` the line, then `HAVING SUM(u.quantity) > p.data_mb`.",
      solution: C`SELECT s.msisdn, p.plan_name, SUM(u.quantity) AS data_used, p.data_mb,
               SUM(u.quantity) - p.data_mb AS excess_mb
        FROM usage u
        JOIN subscriptions s ON s.sub_id = u.sub_id
        JOIN plans p ON p.plan_id = s.plan_id
        WHERE u.usage_type = 'DATA' AND u.usage_date LIKE '2026-11-%'
        GROUP BY s.msisdn, p.plan_name, p.data_mb
        HAVING SUM(u.quantity) > p.data_mb
        ORDER BY excess_mb DESC;`
    },
    {
      id: "top-callers", title: "Top 3 Callers", difficulty: "Medium", db: "telco", tags: ["LIMIT", "JOIN", "SUM"], ordered: true,
      body: [{ p: "Find the **top 3 lines** by total call minutes across all dates. Show `msisdn`, customer `name` and `minutes`, highest first." }],
      hint: "Filter `usage_type = 'CALL'`, group by line, order by the sum descending, and `LIMIT 3`. (Oracle 12c+: `FETCH FIRST 3 ROWS ONLY`.)",
      solution: C`SELECT s.msisdn, c.name, SUM(u.quantity) AS minutes
        FROM usage u
        JOIN subscriptions s ON s.sub_id = u.sub_id
        JOIN customers c ON c.customer_id = s.customer_id
        WHERE u.usage_type = 'CALL'
        GROUP BY s.msisdn, c.name
        ORDER BY minutes DESC
        LIMIT 3;`
    },
    {
      id: "monthly-revenue", title: "Billed vs Collected", difficulty: "Hard", db: "telco", tags: ["LEFT JOIN", "SUM", "COALESCE"], ordered: true,
      body: [{ p: "For each `bill_month`, show the total amount **billed** (`billed`) and the total actually **collected** from payments (`collected`). Order by month." }],
      hint: "`invoices LEFT JOIN payments` keeps unpaid invoices. Use `SUM(COALESCE(p.amount, 0))` for collected. Each invoice has at most one payment here, so the join doesn't double-count `amount`.",
      solution: C`SELECT i.bill_month,
               ROUND(SUM(i.amount), 2) AS billed,
               ROUND(SUM(COALESCE(p.amount, 0)), 2) AS collected
        FROM invoices i
        LEFT JOIN payments p ON p.invoice_id = i.invoice_id
        GROUP BY i.bill_month
        ORDER BY i.bill_month;`
    },
    {
      id: "outstanding-balances", title: "Outstanding Balances", difficulty: "Hard", db: "telco", tags: ["multi-join", "GROUP BY", "HAVING"], ordered: true,
      body: [{ p: "Collections wants a list of customers who still owe money. For each customer, compute `outstanding` = total invoiced − total paid, across all their lines. Show `name` and `outstanding` for customers with an outstanding amount **greater than 0**, largest first." }],
      hint: "Join `customers → subscriptions → invoices`, LEFT JOIN `payments`. Then `SUM(i.amount - COALESCE(p.amount, 0))` grouped by customer, with `HAVING ... > 0`.",
      solution: C`SELECT c.name, ROUND(SUM(i.amount - COALESCE(p.amount, 0)), 2) AS outstanding
        FROM customers c
        JOIN subscriptions s ON s.customer_id = c.customer_id
        JOIN invoices i ON i.sub_id = s.sub_id
        LEFT JOIN payments p ON p.invoice_id = i.invoice_id
        GROUP BY c.customer_id, c.name
        HAVING SUM(i.amount - COALESCE(p.amount, 0)) > 0
        ORDER BY outstanding DESC;`
    },
    {
      id: "usage-mix", title: "November Usage Mix", difficulty: "Medium", db: "telco", tags: ["GROUP BY", "COUNT", "SUM"], ordered: true,
      body: [{ p: "For November 2026, show each `usage_type`, the number of usage records as `events`, and the total `quantity` as `total`. Order by usage type." }],
      hint: "One `GROUP BY usage_type` with `COUNT(*)` and `SUM(quantity)`.",
      solution: C`SELECT usage_type, COUNT(*) AS events, SUM(quantity) AS total
        FROM usage
        WHERE usage_date LIKE '2026-11-%'
        GROUP BY usage_type
        ORDER BY usage_type;`
    },
    {
      id: "running-collections", title: "Running Collections", difficulty: "Hard", db: "telco", tags: ["window functions", "SUM OVER"], ordered: true,
      body: [{ p: "Show every payment's `paid_date`, `amount` and a `running_total` of all payments up to and including that date, in date order." }],
      hint: "`SUM(amount) OVER (ORDER BY paid_date)` gives a cumulative sum without collapsing rows.",
      solution: C`SELECT paid_date, amount,
               SUM(amount) OVER (ORDER BY paid_date) AS running_total
        FROM payments
        ORDER BY paid_date;`
    }
  ];
})();
