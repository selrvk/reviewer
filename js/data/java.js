(function () {
  const C = String.raw;
  window.TOPICS = window.TOPICS || [];

  window.TOPICS.push({
    id: "java",
    title: "Java",
    dir: "java/",
    accent: "java",
    blurb: "Core Java is the heaviest part of most Amdocs technical rounds: OOP, Strings, Collections, exceptions, threads, Java 8 and output-prediction questions.",

    notes: [
      {
        title: "JDK, JRE, JVM & memory",
        blocks: [
          { p: "**JDK** = JRE + development tools (`javac`, `javadoc`, `jdb`). **JRE** = JVM + core libraries, enough to *run* Java. **JVM** = the engine that loads, verifies and executes bytecode." },
          { p: "**Write once, run anywhere:** `javac` compiles `.java` source into platform-neutral **bytecode** (`.class`). Each OS has its own JVM that interprets the bytecode and **JIT-compiles** frequently used (hot) code into native machine code for speed." },
          { table: {
            head: ["Memory area", "What lives there", "Shared?"],
            rows: [
              ["**Heap**", "All objects and their instance variables (and the String pool since Java 7). Managed by the garbage collector.", "Shared by all threads"],
              ["**Stack**", "One frame per method call: local variables, primitive values, object *references*, return address.", "One per thread"],
              ["**Metaspace** (method area)", "Class metadata, static variables, runtime constant pool. Replaced PermGen in Java 8.", "Shared"],
              ["**PC register**", "Address of the instruction the thread is executing.", "One per thread"],
              ["**Native method stack**", "Frames for native (C/C++) methods.", "One per thread"]
            ]
          }},
          { p: "**Garbage collection:** an object becomes eligible for GC when no live reference can reach it. `System.gc()` only *requests* GC; nothing guarantees it runs. The heap is generational: new objects go to the **Young generation** (Eden + Survivor spaces) and long-lived ones are promoted to the **Old generation**." },
          { tip: "Common errors: `StackOverflowError` usually means infinite recursion. `OutOfMemoryError: Java heap space` means too many live objects, often a memory leak such as an ever-growing static collection." }
        ]
      },
      {
        title: "OOP: the four pillars",
        blocks: [
          { ul: [
            "**Encapsulation:** hide data with `private` fields and expose it through public getters and setters, so the class controls its own state.",
            "**Inheritance:** `class Dog extends Animal` is an IS-A relationship that reuses code. Java allows single inheritance of classes and multiple inheritance of interfaces.",
            "**Polymorphism:** one interface, many forms. *Compile-time* = method **overloading**. *Runtime* = method **overriding**, resolved by dynamic method dispatch.",
            "**Abstraction:** expose *what* an object does and hide *how*, using abstract classes and interfaces."
          ]},
          { code: C`
            abstract class Animal {
                private String name;                 // encapsulation
                Animal(String name) { this.name = name; }
                public String getName() { return name; }
                abstract String sound();             // abstraction
            }

            class Dog extends Animal {               // inheritance
                Dog(String name) { super(name); }
                @Override
                String sound() { return "Woof"; }
            }

            Animal a = new Dog("Rex");               // reference type Animal, object type Dog
            System.out.println(a.sound());           // Woof  (runtime polymorphism)
          `, lang: "java" },
          { tip: "**Why no multiple inheritance of classes?** The *diamond problem*: if two parents define the same method, which one does the child get? Interfaces avoid it. If two interfaces supply the same `default` method, the class must override it explicitly." }
        ]
      },
      {
        title: "Overloading vs overriding",
        blocks: [
          { table: {
            head: ["", "Overloading", "Overriding"],
            rows: [
              ["Resolved at", "Compile time (static binding)", "Runtime (dynamic binding)"],
              ["Where", "Same class (or inherited)", "Subclass redefines parent method"],
              ["Parameters", "**Must differ** (number, type or order)", "**Must be the same**"],
              ["Return type", "Can differ, but return type *alone* is not enough", "Same or a subtype (covariant)"],
              ["Access modifier", "Any", "Cannot be **more restrictive**"],
              ["Checked exceptions", "Any", "Cannot throw **broader/new** checked exceptions"],
              ["static / private / final", "Can be overloaded", "Cannot be overridden (a static method in the child *hides* the parent's)"]
            ]
          }},
          { code: C`
            class Calc {
                int add(int a, int b)          { return a + b; }
                double add(double a, double b) { return a + b; }   // overload
                int add(int a, int b, int c)   { return a + b + c; } // overload
            }
          `, lang: "java" }
        ]
      },
      {
        title: "Abstract class vs interface",
        blocks: [
          { table: {
            head: ["", "Abstract class", "Interface"],
            rows: [
              ["Methods", "Abstract **and** concrete", "Abstract; `default` and `static` (Java 8); `private` (Java 9)"],
              ["Variables", "Any kind (instance, static, final…)", "Only `public static final` constants"],
              ["Constructor", "Yes (runs when a subclass is created)", "No"],
              ["Inheritance", "A class `extends` only **one**", "A class `implements` **many**"],
              ["Member access", "Any modifier", "Implicitly `public`"],
              ["Use when", "Closely related classes share state/code (IS-A)", "Defining a capability/contract (CAN-DO), e.g. `Comparable`, `Runnable`"]
            ]
          }},
          { p: "**Marker interface:** an interface with no methods that tags a class for special treatment, e.g. `Serializable`, `Cloneable`." }
        ]
      },
      {
        title: "Access modifiers & key keywords",
        blocks: [
          { table: {
            head: ["Modifier", "Class", "Package", "Subclass (other pkg)", "World"],
            rows: [
              ["`private`", "✔", "", "", ""],
              ["*default* (no keyword)", "✔", "✔", "", ""],
              ["`protected`", "✔", "✔", "✔", ""],
              ["`public`", "✔", "✔", "✔", "✔"]
            ]
          }},
          { ul: [
            "**`static`**: belongs to the class, not an instance. Static methods can't use `this` or touch instance members directly. A `static {}` block runs once, when the class loads.",
            "**`final`**: on a variable it can't be reassigned (the *object* it points to can still change); on a method it can't be overridden; on a class it can't be extended (`String`, `Integer`).",
            "**`finally`**: block that always runs after try/catch, even after `return`. It is skipped only by `System.exit()` or a JVM crash.",
            "**`finalize()`**: called by the GC before reclaiming an object. Deprecated since Java 9; don't rely on it.",
            "**`this`** = current object, **`super`** = parent. `this()` and `super()` calls must be the **first** statement in a constructor, so you can't use both.",
            "**`transient`**: field is skipped during serialization.",
            "**`volatile`**: reads and writes go straight to main memory, which guarantees **visibility** across threads (not atomicity).",
            "**`synchronized`**: only one thread at a time can hold the object's lock (monitor)."
          ]},
          { p: "**Initialization order:**" },
          { code: C`
            class Demo {
                static { System.out.println("1. static block (once, when class loads)"); }
                { System.out.println("2. instance block (every new object, before constructor body)"); }
                Demo() { System.out.println("3. constructor"); }
            }
            // With inheritance: parent static -> child static -> parent instance+constructor -> child instance+constructor
          `, lang: "java" }
        ]
      },
      {
        title: "Strings",
        blocks: [
          { p: "**Strings are immutable.** Every \"modification\" (`concat`, `replace`, `toUpperCase`) returns a *new* String. Why: it makes the String pool safe, keeps strings secure as keys/URLs/passwords, makes them thread-safe for free, and lets `hashCode` be cached." },
          { p: "**String pool:** literals are stored once in a pool and reused. `new String(\"x\")` always creates a new heap object." },
          { code: C`
            String a = "java";
            String b = "java";
            String c = new String("java");

            System.out.println(a == b);          // true  -> same pooled object
            System.out.println(a == c);          // false -> different objects
            System.out.println(a.equals(c));     // true  -> same content
            System.out.println(a == c.intern()); // true  -> intern() returns pooled copy
          `, lang: "java" },
          { table: {
            head: ["", "String", "StringBuilder", "StringBuffer"],
            rows: [
              ["Mutable?", "No", "Yes", "Yes"],
              ["Thread-safe?", "Yes (immutable)", "**No**", "Yes (synchronized methods)"],
              ["Speed", "Slow for repeated concatenation", "**Fastest**", "Slower (locking)"],
              ["Use for", "Constants, map keys", "Building strings in one thread (most cases)", "Legacy multi-threaded building"]
            ]
          }},
          { tip: "`==` compares **references** (same object?). `.equals()` compares **content**. Always compare strings with `equals()`." }
        ]
      },
      {
        title: "Primitives, wrappers & autoboxing",
        blocks: [
          { table: {
            head: ["Type", "Size", "Default", "Wrapper"],
            rows: [
              ["`byte`", "1 byte", "0", "Byte"],
              ["`short`", "2 bytes", "0", "Short"],
              ["`int`", "4 bytes", "0", "Integer"],
              ["`long`", "8 bytes", "0L", "Long"],
              ["`float`", "4 bytes", "0.0f", "Float"],
              ["`double`", "8 bytes", "0.0d", "Double"],
              ["`char`", "2 bytes (UTF-16)", "'\\u0000'", "Character"],
              ["`boolean`", "JVM-dependent", "false", "Boolean"]
            ]
          }},
          { p: "Defaults apply to **instance/static fields only**. A local variable has no default, and using it before assigning it is a **compile error**." },
          { p: "**Autoboxing** turns `int` into `Integer` automatically; **unboxing** does the reverse. `Integer` caches the values **-128 to 127**, so `==` happens to work inside that range and fails outside it:" },
          { code: C`
            Integer x = 127, y = 127;
            System.out.println(x == y);       // true  (cached object)
            Integer p = 128, q = 128;
            System.out.println(p == q);       // false (two different objects)
            System.out.println(p.equals(q));  // true

            Integer n = null;
            int k = n;                        // NullPointerException on unboxing!
          `, lang: "java" }
        ]
      },
      {
        title: "Exception handling",
        blocks: [
          { code: C`
            Throwable
            ├── Error                (OutOfMemoryError, StackOverflowError) -> don't catch
            └── Exception
                ├── IOException, SQLException, ClassNotFoundException   <- CHECKED
                └── RuntimeException                                    <- UNCHECKED
                    ├── NullPointerException
                    ├── ArithmeticException            (e.g. 5 / 0)
                    ├── ArrayIndexOutOfBoundsException
                    ├── ClassCastException
                    ├── IllegalArgumentException -> NumberFormatException
                    └── ConcurrentModificationException
          `, lang: "plaintext" },
          { ul: [
            "**Checked**: checked at compile time. You must catch it or declare it with `throws`. These are recoverable conditions (file missing, DB down).",
            "**Unchecked** (`RuntimeException` and below): not forced by the compiler. They usually mean a programming bug.",
            "**`throw`** actually throws one exception object: `throw new IllegalStateException(\"x\")`.",
            "**`throws`** appears in a method signature and declares what the method may throw.",
            "A `try` needs at least one `catch` **or** a `finally` (or must be try-with-resources).",
            "Catch blocks run top to bottom, so put **specific** exceptions before general ones, or the code won't compile."
          ]},
          { code: C`
            // Custom checked exception
            class InsufficientBalanceException extends Exception {
                InsufficientBalanceException(String msg) { super(msg); }
            }

            void withdraw(double amt) throws InsufficientBalanceException {
                if (amt > balance) throw new InsufficientBalanceException("Balance too low");
                balance -= amt;
            }

            // try-with-resources (Java 7): auto-closes anything AutoCloseable
            try (BufferedReader br = new BufferedReader(new FileReader("data.txt"))) {
                System.out.println(br.readLine());
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                System.out.println("always runs");
            }
          `, lang: "java" },
          { warn: "A `return` inside `finally` **overrides** any return or exception from `try`/`catch`. It's a classic trick question, and bad practice in real code." }
        ]
      },
      {
        title: "Collections Framework",
        blocks: [
          { code: C`
            Iterable
            └── Collection
                ├── List   -> ArrayList, LinkedList, Vector (Stack)
                ├── Set    -> HashSet, LinkedHashSet, TreeSet
                └── Queue  -> PriorityQueue, ArrayDeque (Deque), LinkedList

            Map (separate hierarchy, not a Collection)
                -> HashMap, LinkedHashMap, TreeMap, Hashtable, ConcurrentHashMap
          `, lang: "plaintext" },
          { table: {
            head: ["Class", "Ordering", "Duplicates / nulls", "Notes"],
            rows: [
              ["**ArrayList**", "Insertion (index)", "Dups ✔, nulls ✔", "Resizable array. `get` O(1); insert/remove in middle O(n). Grows ~1.5×."],
              ["**LinkedList**", "Insertion", "Dups ✔, nulls ✔", "Doubly linked. `get(i)` O(n); add/remove at ends O(1). Also a Deque."],
              ["**HashSet**", "None", "No dups, one null", "Backed by a HashMap (elements are keys). O(1)."],
              ["**LinkedHashSet**", "Insertion", "No dups", "HashSet + linked list."],
              ["**TreeSet**", "Sorted", "No dups, **no null**", "Red-black tree, O(log n)."],
              ["**HashMap**", "None", "**One null key**, many null values", "Not synchronized. O(1) average."],
              ["**LinkedHashMap**", "Insertion (or access)", "Like HashMap", "Access-order mode makes an easy LRU cache."],
              ["**TreeMap**", "Sorted by key", "No null key", "Red-black tree, O(log n)."],
              ["**Hashtable**", "None", "**No nulls**", "Legacy; every method synchronized (slow)."],
              ["**ConcurrentHashMap**", "None", "**No nulls**", "Thread-safe with fine-grained locking/CAS; fast."]
            ]
          }},
          { h: "How HashMap works internally" },
          { ol: [
            "Internally it's an array of **buckets** (`Node[] table`), 16 by default.",
            "`put(k, v)`: compute `k.hashCode()`, spread the bits, take `index = hash & (n - 1)`.",
            "If the bucket is empty, store the node. Otherwise walk the bucket and compare keys with `equals()`. A match **replaces the value**; no match **appends** a new node (a collision).",
            "**Java 8+:** when one bucket has more than **8** nodes (and the table has at least 64 buckets), the list becomes a **red-black tree**, so the worst case is O(log n) instead of O(n).",
            "**Load factor 0.75:** when size exceeds capacity × 0.75 (12 for 16 buckets), the table **doubles** and entries are rehashed."
          ]},
          { tip: "This is why you must override **`hashCode()` whenever you override `equals()`**. Otherwise two \"equal\" keys land in different buckets and HashMap/HashSet stop working." },
          { h: "Fail-fast vs fail-safe iterators" },
          { p: "ArrayList/HashMap iterators are **fail-fast**: modifying the collection during iteration (other than through `iterator.remove()`) throws `ConcurrentModificationException`. Iterators of `CopyOnWriteArrayList` and `ConcurrentHashMap` are **fail-safe** (weakly consistent) and don't throw." },
          { code: C`
            List<Integer> nums = new ArrayList<>(List.of(1, 2, 3, 4));
            // for (Integer n : nums) if (n % 2 == 0) nums.remove(n);  // ConcurrentModificationException
            nums.removeIf(n -> n % 2 == 0);                             // safe -> [1, 3]

            Iterator<Integer> it = nums.iterator();
            while (it.hasNext()) if (it.next() == 1) it.remove();        // also safe
          `, lang: "java" },
          { h: "Comparable vs Comparator" },
          { code: C`
            // Comparable: the class defines its own natural order (one way)
            class Employee implements Comparable<Employee> {
                String name; double salary;
                public int compareTo(Employee o) { return Double.compare(this.salary, o.salary); }
            }
            Collections.sort(list);                                   // uses compareTo

            // Comparator: external, many possible orders, no change to the class
            list.sort(Comparator.comparing(Employee::getName));
            list.sort(Comparator.comparingDouble(Employee::getSalary).reversed());
          `, lang: "java" }
        ]
      },
      {
        title: "equals() & hashCode() contract",
        blocks: [
          { ul: [
            "If `a.equals(b)` is true, then `a.hashCode() == b.hashCode()` **must** be true.",
            "Equal hash codes do **not** mean the objects are equal (that's a collision, which is allowed).",
            "`equals` must be reflexive, symmetric, transitive, consistent, and `x.equals(null)` must return false.",
            "Fields used in `equals` should be the same fields used in `hashCode`."
          ]},
          { code: C`
            class Employee {
                private final int id;
                private final String name;

                @Override
                public boolean equals(Object o) {
                    if (this == o) return true;
                    if (!(o instanceof Employee)) return false;
                    Employee e = (Employee) o;
                    return id == e.id && Objects.equals(name, e.name);
                }

                @Override
                public int hashCode() { return Objects.hash(id, name); }
            }
          `, lang: "java" }
        ]
      },
      {
        title: "Multithreading & concurrency",
        blocks: [
          { p: "A **process** is a running program with its own memory space. A **thread** is a lightweight unit of execution *inside* a process, and threads share the process's heap." },
          { code: C`
            // 1) Extend Thread
            class MyThread extends Thread {
                public void run() { System.out.println("running"); }
            }
            new MyThread().start();

            // 2) Implement Runnable (preferred: you can still extend another class)
            Thread t = new Thread(() -> System.out.println("runnable"));
            t.start();

            // 3) Callable + ExecutorService (returns a result via Future)
            ExecutorService pool = Executors.newFixedThreadPool(4);
            Future<Integer> f = pool.submit(() -> 6 * 7);
            System.out.println(f.get());   // 42 (blocks until done)
            pool.shutdown();
          `, lang: "java" },
          { p: "**Thread states:** `NEW` → `RUNNABLE` → (`BLOCKED` | `WAITING` | `TIMED_WAITING`) → `TERMINATED`." },
          { p: "**start() vs run():** `start()` creates a new thread, which then calls `run()`. Calling `run()` directly is just a normal method call on the *current* thread. Calling `start()` twice throws `IllegalThreadStateException`." },
          { table: {
            head: ["", "sleep()", "wait()"],
            rows: [
              ["Belongs to", "`Thread` (static)", "`Object`"],
              ["Releases lock?", "**No**", "**Yes**"],
              ["Must be in synchronized?", "No", "Yes (else IllegalMonitorStateException)"],
              ["Wakes up when", "Time elapses", "`notify()` / `notifyAll()` (or timeout)"]
            ]
          }},
          { ul: [
            "**synchronized** method or block: mutual exclusion plus visibility.",
            "**volatile**: visibility only. `count++` on a volatile field is still **not** atomic.",
            "**AtomicInteger** etc.: lock-free atomic operations (`incrementAndGet`).",
            "**Deadlock**: thread A holds lock 1 and waits for lock 2 while thread B holds lock 2 and waits for lock 1. Prevent it by always acquiring locks in the same order, using `tryLock` with a timeout, or holding fewer locks.",
            "**Race condition**: the result depends on thread timing. Fix it with synchronization or atomics."
          ]}
        ]
      },
      {
        title: "Java 8+ features (lambdas & streams)",
        blocks: [
          { ul: [
            "**Lambda expressions**: `(a, b) -> a + b`, a concise implementation of a functional interface.",
            "**Functional interface**: exactly **one abstract method** (`@FunctionalInterface`). Built-ins: `Predicate<T>` (test → boolean), `Function<T,R>` (apply), `Consumer<T>` (accept), `Supplier<T>` (get), plus `Runnable` and `Comparator`.",
            "**Method references**: `String::toUpperCase`, `System.out::println`, `Employee::new`.",
            "**Stream API**: declarative processing of collections. Intermediate ops (`filter`, `map`, `sorted`, `distinct`) are **lazy**; nothing runs until a **terminal** op (`collect`, `forEach`, `count`, `reduce`).",
            "**Optional<T>**: a container that may be empty, which avoids null checks and NPEs.",
            "**default & static methods** in interfaces.",
            "**java.time** API: `LocalDate`, `LocalDateTime`, `Duration`, `Period`. Immutable and thread-safe, replacing `Date`/`Calendar`."
          ]},
          { code: C`
            List<String> names = List.of("Ana", "Ben", "Carlo", "Dana", "Ed");

            List<String> result = names.stream()
                    .filter(n -> n.length() > 2)
                    .map(String::toUpperCase)
                    .sorted()
                    .collect(Collectors.toList());     // [ANA, BEN, CARLO, DANA]

            Map<Integer, List<String>> byLen = names.stream()
                    .collect(Collectors.groupingBy(String::length));
                    // {2=[Ed], 3=[Ana, Ben], 4=[Dana], 5=[Carlo]}

            int total = IntStream.rangeClosed(1, 5).sum();               // 15
            int product = Stream.of(1, 2, 3, 4).reduce(1, (a, b) -> a * b); // 24

            Optional<String> z = names.stream().filter(n -> n.startsWith("Z")).findFirst();
            System.out.println(z.orElse("none"));                         // none

            // map vs flatMap
            List<List<Integer>> nested = List.of(List.of(1, 2), List.of(3));
            List<Integer> flat = nested.stream().flatMap(List::stream).toList(); // [1, 2, 3]
          `, lang: "java" },
          { tip: "**map** turns each element into exactly one element. **flatMap** turns each element into a *stream* and flattens the results into one stream." }
        ]
      },
      {
        title: "JDBC: Java meets SQL",
        blocks: [
          { p: "Expect at least one question connecting Java and databases. Steps: load the driver (automatic since JDBC 4) → get a `Connection` → create a `PreparedStatement` → execute → read the `ResultSet` → close everything." },
          { code: C`
            String url = "jdbc:oracle:thin:@dbhost:1521/ORCLPDB";
            String sql = "SELECT name, salary FROM employees WHERE dept_id = ?";

            try (Connection con = DriverManager.getConnection(url, user, pass);
                 PreparedStatement ps = con.prepareStatement(sql)) {

                ps.setInt(1, 10);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        System.out.println(rs.getString("name") + " " + rs.getDouble("salary"));
                    }
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }

            // Transactions
            con.setAutoCommit(false);
            try {
                debit.executeUpdate();
                credit.executeUpdate();
                con.commit();
            } catch (SQLException e) {
                con.rollback();
            }
          `, lang: "java" },
          { table: {
            head: ["", "Statement", "PreparedStatement", "CallableStatement"],
            rows: [
              ["Used for", "Static SQL", "Parameterized SQL (`?`)", "Stored procedures"],
              ["Precompiled", "No", "**Yes** (faster when reused)", "Yes"],
              ["SQL injection safe", "**No**", "**Yes**", "Yes"]
            ]
          }},
          { p: "`executeQuery()` is for SELECT and returns a `ResultSet`. `executeUpdate()` is for INSERT/UPDATE/DELETE/DDL and returns the number of affected rows. `execute()` works for any statement and returns `true` if the result is a ResultSet." }
        ]
      },
      {
        title: "Design patterns & SOLID (quick)",
        blocks: [
          { ul: [
            "**Singleton**: exactly one instance (logger, config, connection pool).",
            "**Factory**: create objects without exposing the concrete class (`Calendar.getInstance()`).",
            "**Builder**: step-by-step construction of complex objects (`StringBuilder`, Lombok `@Builder`).",
            "**Observer**: subscribers get notified of events (listeners, pub/sub).",
            "**MVC**: Model (data), View (UI), Controller (handles input). Spring MVC uses it.",
            "**DAO**: a class that isolates database access from business logic."
          ]},
          { code: C`
            // Thread-safe lazy Singleton (double-checked locking)
            public class Config {
                private static volatile Config instance;
                private Config() {}
                public static Config getInstance() {
                    if (instance == null) {
                        synchronized (Config.class) {
                            if (instance == null) instance = new Config();
                        }
                    }
                    return instance;
                }
            }
          `, lang: "java" },
          { p: "**SOLID:** **S**ingle responsibility · **O**pen for extension, closed for modification · **L**iskov substitution (a subclass must work wherever its parent does) · **I**nterface segregation (small, focused interfaces) · **D**ependency inversion (depend on abstractions, which is what Spring's DI does)." }
        ]
      },
      {
        title: "Must-know coding problems",
        blocks: [
          { p: "Practice writing these **by hand without an IDE**. Interviewers often ask you to code on paper, in a shared doc, or in a basic online editor." },
          { code: C`
            // Reverse a string
            String rev = new StringBuilder("amdocs").reverse().toString();   // "scodma"
            // manual
            String s = "amdocs", r = "";
            for (int i = s.length() - 1; i >= 0; i--) r += s.charAt(i);

            // Palindrome
            static boolean isPalindrome(String s) {
                int i = 0, j = s.length() - 1;
                while (i < j) if (s.charAt(i++) != s.charAt(j--)) return false;
                return true;
            }

            // Fibonacci (first n terms)
            int a = 0, b = 1;
            for (int i = 0; i < n; i++) { System.out.print(a + " "); int t = a + b; a = b; b = t; }

            // Factorial (recursive)
            static long fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }

            // Prime check
            static boolean isPrime(int n) {
                if (n < 2) return false;
                for (int i = 2; i * i <= n; i++) if (n % i == 0) return false;
                return true;
            }

            // Character frequency
            Map<Character, Integer> freq = new LinkedHashMap<>();
            for (char c : "banana".toCharArray()) freq.merge(c, 1, Integer::sum);  // {b=1, a=3, n=2}

            // Duplicates in an array
            Set<Integer> seen = new HashSet<>(), dups = new HashSet<>();
            for (int x : arr) if (!seen.add(x)) dups.add(x);

            // Second largest
            int first = Integer.MIN_VALUE, second = Integer.MIN_VALUE;
            for (int x : arr) {
                if (x > first) { second = first; first = x; }
                else if (x > second && x != first) second = x;
            }

            // Anagram check
            char[] c1 = "listen".toCharArray(), c2 = "silent".toCharArray();
            Arrays.sort(c1); Arrays.sort(c2);
            boolean anagram = Arrays.equals(c1, c2);   // true

            // Swap without temp
            x = x + y; y = x - y; x = x - y;

            // FizzBuzz
            for (int i = 1; i <= 15; i++)
                System.out.println(i % 15 == 0 ? "FizzBuzz" : i % 3 == 0 ? "Fizz" : i % 5 == 0 ? "Buzz" : String.valueOf(i));
          `, lang: "java" }
        ]
      }
    ],

    qa: [
      { q: "Is Java a pure object-oriented language?", a: "No. It has **primitive types** (`int`, `char`, `boolean`…) that are not objects, and **static** members that belong to no object. Wrapper classes and autoboxing narrow the gap but don't remove it." },
      { q: "Why is `main` declared `public static void main(String[] args)`?", a: "- `public`: the JVM must be able to call it from outside the class.\n- `static`: the JVM calls it without creating an object.\n- `void`: it returns nothing to the JVM (use `System.exit(code)` to send an exit code).\n- `String[] args`: command-line arguments." },
      { q: "Can we overload or override `main`?", a: "**Overload:** yes, but the JVM only calls the `main(String[])` version. **Override:** no. It's static, so a subclass's `main` just *hides* the parent's." },
      { q: "Can a static method be overridden?", a: "No. Static methods are bound at compile time to the **reference type**. Declaring the same static method in a subclass is **method hiding**: `Parent p = new Child(); p.staticMethod()` calls Parent's version." },
      { q: "Can a constructor be private? Why?", a: "Yes. It's used for **Singleton** (control instance creation), **factory methods** (`of()`, `valueOf()`), and **utility classes** that shouldn't be instantiated (like `Math` or `Collections`)." },
      { q: "What is the difference between `==` and `.equals()`?", a: "`==` compares **references** for objects (are both the same object in memory?) and values for primitives. `.equals()` compares **logical content**, provided the class overrides it (String, Integer and the collections do). `Object`'s default `equals()` is the same as `==`." },
      { q: "Why is String immutable in Java?", a: "- **String pool**: many references share one literal, so mutation would break all of them.\n- **Security**: file paths, URLs, DB credentials and class names can't be altered after validation.\n- **Thread safety** for free.\n- **hashCode caching**, which makes Strings fast HashMap keys." },
      { q: "String vs StringBuilder vs StringBuffer?", a: "String is immutable. StringBuilder is mutable, **not** synchronized, and fastest. StringBuffer is mutable and synchronized (thread-safe but slower). Use StringBuilder for string building in loops." },
      { q: "Is Java pass-by-value or pass-by-reference?", a: "**Always pass-by-value.** For objects, the *value of the reference* is copied. The method can mutate the object it points to, but reassigning the parameter doesn't affect the caller's variable." },
      { q: "Difference between `final`, `finally` and `finalize`?", a: "`final` is a keyword: constant variable, non-overridable method, non-inheritable class. `finally` is a block that always runs after try/catch, used for cleanup. `finalize()` is a method the GC called before collection; deprecated since Java 9." },
      { q: "Checked vs unchecked exceptions?", a: "**Checked** (`IOException`, `SQLException`) are verified at compile time, so you must catch or declare them. **Unchecked** (`RuntimeException` subclasses such as NPE, ArithmeticException, ArrayIndexOutOfBounds) aren't enforced and usually signal bugs. `Error`s (OutOfMemoryError) are also unchecked and shouldn't be caught." },
      { q: "Does `finally` run if there's a `return` in `try`?", a: "Yes. `finally` runs after the return value is computed but before the method actually returns. If `finally` has its own `return`, that value wins. It's skipped only by `System.exit()`, a JVM crash, or a killed thread." },
      { q: "throw vs throws?", a: "`throw` is a statement that throws one exception instance: `throw new IllegalArgumentException()`. `throws` is a clause in the method signature listing exceptions the method may propagate: `void read() throws IOException`." },
      { q: "ArrayList vs LinkedList?", a: "ArrayList is a dynamic array: fast random access O(1), but inserting or removing in the middle shifts elements, O(n). LinkedList is a doubly linked list: O(n) access by index, O(1) insert/remove at the ends or at an iterator position, plus more memory per element. Default to ArrayList." },
      { q: "ArrayList vs Vector?", a: "Both are resizable arrays. Vector is **synchronized** (thread-safe, slower), a legacy class that doubles its size on growth. ArrayList isn't synchronized and grows about 50%. For thread safety today use `Collections.synchronizedList` or `CopyOnWriteArrayList`." },
      { q: "Explain how HashMap works internally.", a: "It holds an array of buckets. `put()` hashes the key, picks the bucket index with `hash & (n-1)`, then walks that bucket comparing keys with `equals()`: a match replaces the value, otherwise a new node is appended. Since Java 8 a bucket with more than 8 entries becomes a red-black tree. When size exceeds capacity × 0.75 the table doubles and rehashes. `get()` follows the same hash → bucket → equals path." },
      { q: "HashMap vs Hashtable vs ConcurrentHashMap?", a: "HashMap isn't synchronized and allows 1 null key plus null values. Hashtable is legacy, synchronizes every method (one lock for the whole table) and allows no nulls. ConcurrentHashMap is thread-safe with fine-grained locking/CAS, much faster under concurrency, and allows no nulls." },
      { q: "How does HashSet guarantee uniqueness?", a: "HashSet is backed by a HashMap. `add(e)` calls `map.put(e, PRESENT)`. Keys are unique, so if `e` already exists (same hashCode **and** `equals`), `put` returns the old value and `add` returns `false`." },
      { q: "What happens if you override `equals()` but not `hashCode()`?", a: "Two logically equal objects get different hash codes and land in different buckets, so `HashSet` keeps \"duplicates\" and `HashMap.get()` fails to find a key you put in." },
      { q: "What is ConcurrentModificationException? How do you avoid it?", a: "A fail-fast iterator throws it when the collection is structurally modified during iteration (e.g. `list.remove()` inside a for-each). Avoid it with `iterator.remove()`, `removeIf()`, by iterating over a copy, or by using concurrent collections like `CopyOnWriteArrayList`/`ConcurrentHashMap`." },
      { q: "Comparable vs Comparator?", a: "**Comparable** (`java.lang`, `compareTo(T o)`) defines a class's single **natural ordering**, implemented inside the class. **Comparator** (`java.util`, `compare(T a, T b)`) is an external strategy, so you can have many orders without changing the class, e.g. `Comparator.comparing(Emp::getSalary).reversed()`." },
      { q: "How do you create an immutable class?", a: "- Declare the class `final`.\n- Make all fields `private final`.\n- Don't provide setters.\n- Initialize everything in the constructor.\n- Make **defensive copies** of mutable fields (Date, List) both coming in and going out." },
      { q: "Shallow copy vs deep copy?", a: "A **shallow copy** copies field values, so referenced objects are *shared* (the default `Object.clone()` does this). A **deep copy** also clones the referenced objects recursively, so the copy is fully independent." },
      { q: "What is serialization? What's `serialVersionUID`?", a: "Serialization converts an object to a byte stream (for files, network, caching). The class must implement `Serializable`. `transient` fields are skipped. `serialVersionUID` is a version ID: if it doesn't match during deserialization you get `InvalidClassException`." },
      { q: "Thread vs Runnable: which is better?", a: "Implementing **Runnable** (or Callable) is better. Java has single class inheritance, so extending Thread wastes it. Runnable also separates the *task* from the *thread mechanism*, and tasks can be submitted to an `ExecutorService`." },
      { q: "What is a deadlock and how do you prevent it?", a: "Two or more threads each hold a lock the other needs, so all of them wait forever. Prevent it with **consistent lock ordering**, `tryLock(timeout)`, holding fewer locks, or higher-level concurrency utilities. Detect it with a thread dump (`jstack <pid>`)." },
      { q: "What does `volatile` do?", a: "It guarantees **visibility**: a write by one thread is immediately visible to others (no caching in CPU registers) and it prevents some reordering. It does **not** make compound actions like `count++` atomic; use `AtomicInteger` or `synchronized` for that." },
      { q: "What is a functional interface?", a: "An interface with exactly **one abstract method** (it may have default/static methods). Lambdas and method references implement it. Examples: `Runnable`, `Callable`, `Comparator`, `Predicate`, `Function`, `Consumer`, `Supplier`." },
      { q: "map() vs flatMap() in streams?", a: "`map` transforms each element one-to-one (`Stream<T>` → `Stream<R>`). `flatMap` maps each element to a *stream* and flattens them all into one stream, e.g. `List<List<Integer>>` → `Stream<Integer>`." },
      { q: "Intermediate vs terminal stream operations?", a: "Intermediate ops (`filter`, `map`, `sorted`, `distinct`, `limit`) return a new Stream and are **lazy**. Terminal ops (`collect`, `forEach`, `reduce`, `count`, `findFirst`) trigger execution and close the stream, which can't be reused afterwards." },
      { q: "Can memory leaks happen in Java despite GC?", a: "Yes. GC only frees **unreachable** objects. Leaks come from references you forget to drop: ever-growing static collections or caches, unclosed streams/connections, listeners never unregistered, ThreadLocals in thread pools, inner classes holding outer references." },
      { q: "Stack vs heap memory?", a: "**Stack** belongs to one thread and holds method frames, local variables and references. It's LIFO, fast and freed automatically, and overflowing it gives `StackOverflowError`. **Heap** is shared and holds all objects; it's managed by GC, and exhausting it gives `OutOfMemoryError`." },
      { q: "Can an abstract class have a constructor?", a: "Yes. You can't call `new` on it directly, but its constructor runs (via `super()`) when a concrete subclass is instantiated, typically to initialize shared fields." },
      { q: "What is the diamond problem and how does Java handle it?", a: "Ambiguity when a class inherits the same method from two parents. Java forbids multiple class inheritance. With interfaces, if two `default` methods clash, the implementing class must override the method and may pick one via `InterfaceA.super.method()`." },
      { q: "What are the types of inner classes?", a: "- **Member (non-static) inner class**: tied to an outer instance.\n- **Static nested class**: no outer instance needed.\n- **Local inner class**: defined inside a method.\n- **Anonymous inner class**: one-off implementation, often replaced by lambdas." }
    ],

    quiz: [
      { q: "What is the output?", code: C`
          String s1 = "Amdocs";
          String s2 = "Amdocs";
          String s3 = new String("Amdocs");
          System.out.println((s1 == s2) + " " + (s1 == s3));`,
        options: ["true true", "true false", "false false", "false true"], answer: 1,
        explain: "`s1` and `s2` point to the same pooled literal. `new String()` creates a separate heap object, so `==` (reference comparison) is false." },
      { q: "What is the output?", code: C`System.out.println(1 + 2 + "3" + 4 + 5);`,
        options: ["12345", "3345", "339", "15"], answer: 1,
        explain: "Evaluated left to right: `1 + 2 = 3` (int), then `3 + \"3\" = \"33\"`. Once it's a String, `+` concatenates: \"334\" then \"3345\"." },
      { q: "What is the output?", code: C`
          Integer a = 127, b = 127;
          Integer c = 128, d = 128;
          System.out.println((a == b) + " " + (c == d));`,
        options: ["true true", "false false", "true false", "false true"], answer: 2,
        explain: "Integer caches -128..127, so `a` and `b` are the same object. 128 is outside the cache, so two separate objects are created." },
      { q: "What does `test()` return?", code: C`
          static int test() {
              try { return 1; }
              finally { return 2; }
          }`,
        options: ["1", "2", "Compile error", "Throws exception"], answer: 1,
        explain: "`finally` always runs, and a `return` inside `finally` overrides the return from `try`." },
      { q: "What is the output?", code: C`
          int i = 5;
          int j = i++ + ++i;
          System.out.println(i + " " + j);`,
        options: ["7 12", "6 11", "7 11", "6 12"], answer: 0,
        explain: "`i++` yields 5 (i becomes 6). `++i` makes i 7 and yields 7. j = 5 + 7 = 12, and i is 7." },
      { q: "What is the output?", code: C`
          List<Integer> list = new ArrayList<>(List.of(10, 20, 30));
          list.remove(1);
          System.out.println(list);`,
        options: ["[20, 30]", "[10, 30]", "[10, 20, 30]", "[10, 20]"], answer: 1,
        explain: "`remove(int index)` is chosen over `remove(Object)` because `1` is an int literal, so it removes the element at index 1 (20). Use `list.remove(Integer.valueOf(1))` to remove by value." },
      { q: "Which of these is a **checked** exception?", options: ["NullPointerException", "ArithmeticException", "IOException", "ArrayIndexOutOfBoundsException"], answer: 2,
        explain: "IOException extends Exception (not RuntimeException), so the compiler forces you to handle or declare it." },
      { q: "What happens if you call `t.run()` instead of `t.start()` on a Thread?", options: ["A new thread is created", "Compile error", "run() executes in the current thread, no new thread", "IllegalThreadStateException"], answer: 2,
        explain: "`run()` is just a normal method call. Only `start()` asks the JVM to create a new thread of execution." },
      { q: "Which collection keeps **insertion order** and allows **no duplicates**?", options: ["HashSet", "TreeSet", "LinkedHashSet", "ArrayList"], answer: 2,
        explain: "LinkedHashSet = HashSet + a linked list tracking insertion order. TreeSet sorts; HashSet has no order; ArrayList allows duplicates." },
      { q: "How many `null` keys can a HashMap hold?", options: ["None", "Exactly one", "Unlimited", "One per bucket"], answer: 1,
        explain: "HashMap allows one null key (stored in bucket 0) and any number of null values. Hashtable and ConcurrentHashMap allow none." },
      { q: "What is the output?", code: C`
          String s = "java";
          s.concat(" rocks");
          System.out.println(s);`,
        options: ["java rocks", "java", " rocks", "Compile error"], answer: 1,
        explain: "Strings are immutable. `concat` returns a new String, which is discarded because it isn't assigned." },
      { q: "Variables declared in an interface are implicitly:", options: ["private", "protected static", "public static final", "public abstract"], answer: 2,
        explain: "Interface fields are always constants: `public static final`." },
      { q: "What is printed by `new Child();`?", code: C`
          class Parent {
              Parent() { System.out.print("P "); }
          }
          class Child extends Parent {
              static { System.out.print("S "); }
              Child() { System.out.print("C "); }
          }`,
        options: ["P C S", "S P C", "P S C", "S C P"], answer: 1,
        explain: "Static initializers run when the class loads, before any constructor. Then `Child()` implicitly calls `super()` first, printing P, then C." },
      { q: "What is the output?", code: C`System.out.println('a' + 1);`,
        options: ["a1", "b", "98", "Compile error"], answer: 2,
        explain: "`char + int` is numeric promotion: 'a' is 97, so 97 + 1 = 98 (an int). `(char)('a' + 1)` would print b." },
      { q: "What is the output?", code: C`System.out.println(10 / 4 + " " + 10 / 4.0);`,
        options: ["2.5 2.5", "2 2.5", "2 2", "2.0 2.5"], answer: 1,
        explain: "int / int is integer division (2). If either operand is a double, the result is a double (2.5)." },
      { q: "Which line fails to compile?", code: C`
          final List<String> names = new ArrayList<>(); // line 1
          names.add("Ana");                             // line 2
          names = new ArrayList<>();                    // line 3`,
        options: ["Line 1", "Line 2", "Line 3", "None"], answer: 2,
        explain: "`final` stops *reassigning* the reference. It doesn't make the list immutable, so `add` is fine." },
      { q: "Two methods have the same name and parameters but different return types. Result?", options: ["Valid overloading", "Valid overriding", "Compile error", "Runtime error"], answer: 2,
        explain: "The return type alone isn't part of the method signature for overloading, so this is a duplicate method." },
      { q: "What is the output?", code: C`
          List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);
          System.out.println(nums.stream()
                  .filter(n -> n % 2 == 0)
                  .map(n -> n * n)
                  .collect(Collectors.toList()));`,
        options: ["[1, 9, 25]", "[4, 16, 36]", "[2, 4, 6]", "[1, 4, 9, 16, 25, 36]"], answer: 1,
        explain: "filter keeps 2, 4, 6. map squares them to 4, 16, 36." },
      { q: "Which is thread-safe?", options: ["StringBuilder", "ArrayList", "HashMap", "StringBuffer"], answer: 3,
        explain: "StringBuffer's methods are synchronized. The others aren't thread-safe." },
      { q: "What happens?", code: C`
          public static void main(String[] args) {
              int x;
              System.out.println(x);
          }`,
        options: ["Prints 0", "Prints null", "Compile error", "Runtime exception"], answer: 2,
        explain: "Local variables have no default value. The compiler reports \"variable x might not have been initialized\"." },
      { q: "What is the output?", code: C`
          int day = 2;
          switch (day) {
              case 1: System.out.print("Mon ");
              case 2: System.out.print("Tue ");
              case 3: System.out.print("Wed ");
                  break;
              default: System.out.print("Other");
          }`,
        options: ["Tue", "Tue Wed", "Tue Wed Other", "Mon Tue Wed"], answer: 1,
        explain: "Without `break`, execution falls through from case 2 into case 3 and stops at its `break`." },
      { q: "Where are objects created with `new` stored?", options: ["Stack", "Heap", "Metaspace", "PC register"], answer: 1,
        explain: "Objects live on the heap. The *reference* variable may live on the stack." },
      { q: "What does `volatile` guarantee?", options: ["Atomicity of ++", "Visibility of changes across threads", "Mutual exclusion", "Faster execution"], answer: 1,
        explain: "volatile ensures every read sees the latest write (visibility). It doesn't make compound operations atomic." },
      { q: "Which statement about abstract classes is **FALSE**?", options: ["They can have constructors", "They can have concrete methods", "They can be instantiated with `new`", "They can have static methods"], answer: 2,
        explain: "An abstract class can't be instantiated directly; only concrete subclasses can (anonymous subclasses included)." },
      { q: "What is the output?", code: C`System.out.println(Math.round(-2.5));`,
        options: ["-3", "-2", "-2.5", "2"], answer: 1,
        explain: "`Math.round(x)` = `floor(x + 0.5)`, so floor(-2.0) = -2. Ties round toward positive infinity." },
      { q: "What is the output?", code: C`
          class A { void show() { System.out.print("A"); } }
          class B extends A { void show() { System.out.print("B"); } }

          A obj = new B();
          obj.show();`,
        options: ["A", "B", "AB", "Compile error"], answer: 1,
        explain: "Instance methods are dispatched on the **runtime object type** (B). This is runtime polymorphism." },
      { q: "What is the output?", code: C`
          class A { static void hi() { System.out.print("A"); } }
          class B extends A { static void hi() { System.out.print("B"); } }

          A obj = new B();
          obj.hi();`,
        options: ["A", "B", "AB", "Compile error"], answer: 0,
        explain: "Static methods aren't overridden, they're *hidden*. The call is bound to the **reference type** (A) at compile time." },
      { q: "Average time complexity of `HashMap.get()`?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], answer: 0,
        explain: "O(1) on average. The worst case is O(log n) since Java 8 (treeified buckets) and was O(n) before." },
      { q: "You override `equals()` but not `hashCode()` and add two equal objects to a HashSet. What happens?", options: ["Compile error", "Only one is stored", "Both may be stored (duplicate)", "Runtime exception"], answer: 2,
        explain: "Different hash codes send the objects to different buckets, so `equals()` is never consulted and you get logical duplicates." },
      { q: "Which keyword prevents a method from being overridden?", options: ["static", "final", "private", "abstract"], answer: 1,
        explain: "`final` methods can't be overridden. (private and static methods aren't inherited for overriding either, but `final` is the keyword meant for this.)" }
    ]
  });
})();
