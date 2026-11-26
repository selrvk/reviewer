(function () {
  const C = String.raw;
  window.PRACTICE = window.PRACTICE || {};

  // Every problem reads from standard input (Scanner / BufferedReader) and prints to standard output,
  // exactly like CodeChum / HackerRank-style judges. Output is compared line by line,
  // ignoring trailing spaces and trailing blank lines.
  window.PRACTICE.java = [
    /* ===================== EASY ===================== */
    {
      id: "sum-of-two",
      title: "Sum of Two Numbers",
      difficulty: "Easy",
      tags: ["Scanner", "basics"],
      body: [{ p: "Read two integers and print their sum. This is the warm-up: get comfortable with `Scanner` and `System.out.println`." }],
      input: "Two integers `a` and `b` separated by a space.",
      output: "A single integer: `a + b`.",
      tests: [
        { in: "3 5", out: "8", sample: true },
        { in: "-4 10", out: "6", sample: true },
        { in: "1000000 2000000", out: "3000000" },
        { in: "0 0", out: "0" },
        { in: "-7 -8", out: "-15" }
      ],
      hint: "`int a = sc.nextInt(); int b = sc.nextInt();` then print `a + b`.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                int a = sc.nextInt();
                int b = sc.nextInt();
                System.out.println(a + b);
            }
        }`
    },
    {
      id: "even-or-odd",
      title: "Even or Odd",
      difficulty: "Easy",
      tags: ["conditionals", "modulo"],
      body: [{ p: "Read an integer `n` and print `Even` if it is even, otherwise `Odd`. Watch out for negative numbers." }],
      input: "One integer `n`.",
      output: "`Even` or `Odd`.",
      tests: [
        { in: "4", out: "Even", sample: true },
        { in: "7", out: "Odd", sample: true },
        { in: "0", out: "Even" },
        { in: "-3", out: "Odd" },
        { in: "-10", out: "Even" }
      ],
      hint: "In Java, `-3 % 2` is `-1`, not `1`. Test `n % 2 == 0` instead of `n % 2 == 1`.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                int n = sc.nextInt();
                System.out.println(n % 2 == 0 ? "Even" : "Odd");
            }
        }`
    },
    {
      id: "reverse-string",
      title: "Reverse a String",
      difficulty: "Easy",
      tags: ["strings", "loops"],
      body: [
        { p: "Read a full line of text and print it reversed. Try it **two ways**: with `StringBuilder.reverse()`, and with a manual loop (interviewers often ask for the loop)." }
      ],
      input: "One line of text (may contain spaces).",
      output: "The line reversed.",
      tests: [
        { in: "amdocs", out: "scodma", sample: true },
        { in: "Hello World", out: "dlroW olleH", sample: true },
        { in: "a", out: "a" },
        { in: "racecar", out: "racecar" },
        { in: "Java 17!", out: "!71 avaJ" }
      ],
      hint: "Use `sc.nextLine()` (not `next()`) so spaces are kept. Loop from `s.length() - 1` down to `0`.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                String s = sc.nextLine();
                StringBuilder sb = new StringBuilder();
                for (int i = s.length() - 1; i >= 0; i--) {
                    sb.append(s.charAt(i));
                }
                System.out.println(sb);
            }
        }`
    },
    {
      id: "palindrome",
      title: "Palindrome Check",
      difficulty: "Easy",
      tags: ["strings", "two pointers"],
      body: [{ p: "Read a single word and print `Palindrome` if it reads the same forwards and backwards (**ignoring upper/lower case**), otherwise `Not Palindrome`." }],
      input: "One word (letters only).",
      output: "`Palindrome` or `Not Palindrome`.",
      tests: [
        { in: "Madam", out: "Palindrome", sample: true },
        { in: "java", out: "Not Palindrome", sample: true },
        { in: "Level", out: "Palindrome" },
        { in: "A", out: "Palindrome" },
        { in: "abBA", out: "Palindrome" },
        { in: "ab", out: "Not Palindrome" }
      ],
      hint: "Lower-case the word first, then compare `s.charAt(i)` with `s.charAt(s.length() - 1 - i)` moving inward.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                String s = sc.next().toLowerCase();
                int i = 0, j = s.length() - 1;
                boolean ok = true;
                while (i < j) {
                    if (s.charAt(i++) != s.charAt(j--)) { ok = false; break; }
                }
                System.out.println(ok ? "Palindrome" : "Not Palindrome");
            }
        }`
    },
    {
      id: "count-vowels",
      title: "Vowels and Consonants",
      difficulty: "Easy",
      tags: ["strings", "characters"],
      body: [{ p: "Read a line of text and count the vowels (`a e i o u`, any case) and the consonants (all **other letters**). Ignore digits, spaces and punctuation." }],
      input: "One line of text.",
      output: "Two lines: `Vowels: X` and `Consonants: Y`.",
      tests: [
        { in: "Hello World", out: "Vowels: 3\nConsonants: 7", sample: true },
        { in: "rhythm", out: "Vowels: 0\nConsonants: 6", sample: true },
        { in: "Amdocs Philippines", out: "Vowels: 6\nConsonants: 11" },
        { in: "AEIOU xyz 123", out: "Vowels: 5\nConsonants: 3" },
        { in: "!!!", out: "Vowels: 0\nConsonants: 0" }
      ],
      hint: "`Character.isLetter(c)` tells you if it's a letter; `\"aeiou\".indexOf(Character.toLowerCase(c)) >= 0` tells you if it's a vowel.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                String s = sc.hasNextLine() ? sc.nextLine() : "";
                int vowels = 0, consonants = 0;
                for (char c : s.toCharArray()) {
                    if (!Character.isLetter(c)) continue;
                    if ("aeiou".indexOf(Character.toLowerCase(c)) >= 0) vowels++;
                    else consonants++;
                }
                System.out.println("Vowels: " + vowels);
                System.out.println("Consonants: " + consonants);
            }
        }`
    },
    {
      id: "factorial",
      title: "Factorial",
      difficulty: "Easy",
      tags: ["loops", "long", "recursion"],
      body: [
        { p: "Read `n` (0 ≤ n ≤ 20) and print `n!`. Remember `0! = 1`." },
        { tip: "`20!` is about 2.4 × 10¹⁸. That overflows `int`, but fits in `long`." }
      ],
      input: "One integer `n` (0 ≤ n ≤ 20).",
      output: "`n!`",
      tests: [
        { in: "5", out: "120", sample: true },
        { in: "0", out: "1", sample: true },
        { in: "1", out: "1" },
        { in: "10", out: "3628800" },
        { in: "20", out: "2432902008176640000" }
      ],
      hint: "Start with `long result = 1;` and multiply by `2, 3, …, n`.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                int n = sc.nextInt();
                long result = 1;
                for (int i = 2; i <= n; i++) result *= i;
                System.out.println(result);
            }
        }`
    },
    {
      id: "fizzbuzz",
      title: "FizzBuzz",
      difficulty: "Easy",
      tags: ["loops", "conditionals"],
      body: [{ p: "Print the numbers `1` to `n`, one per line, but print `Fizz` for multiples of 3, `Buzz` for multiples of 5, and `FizzBuzz` for multiples of both." }],
      input: "One integer `n` (1 ≤ n ≤ 100).",
      output: "`n` lines.",
      tests: [
        { in: "5", out: "1\n2\nFizz\n4\nBuzz", sample: true },
        { in: "15", out: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", sample: true },
        { in: "1", out: "1" },
        { in: "3", out: "1\n2\nFizz" }
      ],
      hint: "Check `i % 15 == 0` **first**, otherwise multiples of 15 get caught by the `% 3` branch.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                int n = sc.nextInt();
                for (int i = 1; i <= n; i++) {
                    if (i % 15 == 0) System.out.println("FizzBuzz");
                    else if (i % 3 == 0) System.out.println("Fizz");
                    else if (i % 5 == 0) System.out.println("Buzz");
                    else System.out.println(i);
                }
            }
        }`
    },
    {
      id: "fibonacci",
      title: "Fibonacci Series",
      difficulty: "Easy",
      tags: ["loops", "sequences"],
      body: [{ p: "Print the first `n` Fibonacci numbers separated by single spaces. The series starts `0 1 1 2 3 5 …` where each term is the sum of the previous two." }],
      input: "One integer `n` (1 ≤ n ≤ 40).",
      output: "The first `n` terms on one line, separated by spaces.",
      tests: [
        { in: "7", out: "0 1 1 2 3 5 8", sample: true },
        { in: "1", out: "0", sample: true },
        { in: "2", out: "0 1" },
        { in: "10", out: "0 1 1 2 3 5 8 13 21 34" },
        { in: "40", out: "0 1 1 2 3 5 8 13 21 34 55 89 144 233 377 610 987 1597 2584 4181 6765 10946 17711 28657 46368 75025 121393 196418 317811 514229 832040 1346269 2178309 3524578 5702887 9227465 14930352 24157817 39088169 63245986" }
      ],
      hint: "Keep two variables `a = 0, b = 1`. Each step print `a`, then `next = a + b; a = b; b = next;`. A `StringJoiner(\" \")` avoids a trailing space.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                int n = sc.nextInt();
                long a = 0, b = 1;
                StringJoiner sj = new StringJoiner(" ");
                for (int i = 0; i < n; i++) {
                    sj.add(String.valueOf(a));
                    long next = a + b;
                    a = b;
                    b = next;
                }
                System.out.println(sj);
            }
        }`
    },
    {
      id: "prime-check",
      title: "Prime Number",
      difficulty: "Easy",
      tags: ["loops", "math"],
      body: [{ p: "Read `n` and print `Prime` if it is a prime number, otherwise `Not Prime`. (0 and 1 are not prime.)" }],
      input: "One integer `n` (0 ≤ n ≤ 1,000,000,000).",
      output: "`Prime` or `Not Prime`.",
      tests: [
        { in: "17", out: "Prime", sample: true },
        { in: "21", out: "Not Prime", sample: true },
        { in: "2", out: "Prime" },
        { in: "1", out: "Not Prime" },
        { in: "0", out: "Not Prime" },
        { in: "7919", out: "Prime" },
        { in: "999999937", out: "Prime" }
      ],
      hint: "Only test divisors up to `√n` (`i * i <= n`). Checking all the way to `n` is too slow for the large test. Use `long` for `i * i` to be safe.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                long n = sc.nextLong();
                boolean prime = n >= 2;
                for (long i = 2; i * i <= n; i++) {
                    if (n % i == 0) { prime = false; break; }
                }
                System.out.println(prime ? "Prime" : "Not Prime");
            }
        }`
    },
    {
      id: "sum-of-digits",
      title: "Sum of Digits",
      difficulty: "Easy",
      tags: ["math", "loops"],
      body: [{ p: "Read a non-negative integer and print the sum of its digits. Do it **arithmetically** with `% 10` and `/ 10` rather than converting to a String." }],
      input: "One non-negative integer (fits in a `long`).",
      output: "The sum of its digits.",
      tests: [
        { in: "12345", out: "15", sample: true },
        { in: "0", out: "0", sample: true },
        { in: "9999", out: "36" },
        { in: "1002", out: "3" },
        { in: "9223372036854775807", out: "88" }
      ],
      hint: "`while (n > 0) { sum += n % 10; n /= 10; }`",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                long n = sc.nextLong();
                int sum = 0;
                while (n > 0) {
                    sum += n % 10;
                    n /= 10;
                }
                System.out.println(sum);
            }
        }`
    },
    {
      id: "star-pyramid",
      title: "Star Pyramid",
      difficulty: "Easy",
      tags: ["nested loops", "patterns"],
      body: [
        { p: "Print a centered pyramid of `*` with `n` rows. Row `i` (1-based) has `n - i` leading spaces followed by `2i - 1` stars. Don't print spaces after the stars." },
        { code: C`
            n = 4

               *
              ***
             *****
            *******`, lang: "plaintext" }
      ],
      input: "One integer `n` (1 ≤ n ≤ 20).",
      output: "`n` lines forming the pyramid.",
      tests: [
        { in: "3", out: "  *\n ***\n*****", sample: true },
        { in: "1", out: "*", sample: true },
        { in: "4", out: "   *\n  ***\n *****\n*******" },
        { in: "6", out: "     *\n    ***\n   *****\n  *******\n *********\n***********" }
      ],
      hint: "Two inner loops per row: one printing `n - i` spaces, one printing `2 * i - 1` stars. Or use `\" \".repeat(n - i) + \"*\".repeat(2 * i - 1)`.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                int n = sc.nextInt();
                for (int i = 1; i <= n; i++) {
                    StringBuilder row = new StringBuilder();
                    for (int s = 0; s < n - i; s++) row.append(' ');
                    for (int k = 0; k < 2 * i - 1; k++) row.append('*');
                    System.out.println(row);
                }
            }
        }`
    },
    {
      id: "min-max",
      title: "Largest and Smallest",
      difficulty: "Easy",
      tags: ["arrays", "loops"],
      body: [{ p: "Read `n` integers and print the largest and smallest, without sorting." }],
      input: "First line: `n` (1 ≤ n ≤ 1000). Second line: `n` integers.",
      output: "Two lines: `Max: X` and `Min: Y`.",
      tests: [
        { in: "5\n3 9 -2 7 4", out: "Max: 9\nMin: -2", sample: true },
        { in: "1\n42", out: "Max: 42\nMin: 42", sample: true },
        { in: "4\n-5 -1 -9 -3", out: "Max: -1\nMin: -9" },
        { in: "6\n100 100 100 100 100 100", out: "Max: 100\nMin: 100" }
      ],
      hint: "Initialise `max` and `min` with the **first** element (not 0), then update them in a loop.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                int n = sc.nextInt();
                int first = sc.nextInt();
                int max = first, min = first;
                for (int i = 1; i < n; i++) {
                    int x = sc.nextInt();
                    if (x > max) max = x;
                    if (x < min) min = x;
                }
                System.out.println("Max: " + max);
                System.out.println("Min: " + min);
            }
        }`
    },

    /* ===================== MEDIUM ===================== */
    {
      id: "second-largest",
      title: "Second Largest Number",
      difficulty: "Medium",
      tags: ["arrays", "edge cases"],
      body: [{ p: "Read `n` integers and print the **second largest distinct** value. If there is no such value (all numbers are equal), print `None`. Solve it in one pass, without sorting." }],
      input: "First line: `n` (1 ≤ n ≤ 1000). Second line: `n` integers.",
      output: "The second largest distinct value, or `None`.",
      tests: [
        { in: "5\n5 1 9 3 9", out: "5", sample: true },
        { in: "3\n4 4 4", out: "None", sample: true },
        { in: "2\n10 20", out: "10" },
        { in: "3\n-1 -5 -3", out: "-3" },
        { in: "1\n7", out: "None" },
        { in: "6\n1 2 3 4 5 6", out: "5" }
      ],
      hint: "Track `first` and `second` (start both at `Long.MIN_VALUE`). If `x > first`: shift first into second. Else if `x != first && x > second`: update second.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                int n = sc.nextInt();
                long first = Long.MIN_VALUE, second = Long.MIN_VALUE;
                for (int i = 0; i < n; i++) {
                    long x = sc.nextLong();
                    if (x > first) { second = first; first = x; }
                    else if (x != first && x > second) second = x;
                }
                System.out.println(second == Long.MIN_VALUE ? "None" : String.valueOf(second));
            }
        }`
    },
    {
      id: "char-frequency",
      title: "Character Frequency",
      difficulty: "Medium",
      tags: ["HashMap", "LinkedHashMap", "strings"],
      body: [{ p: "Read a lowercase word and print how many times each character appears, in the order the characters **first appear**." }],
      input: "One lowercase word.",
      output: "One line per distinct character: `<char> <count>`.",
      tests: [
        { in: "banana", out: "b 1\na 3\nn 2", sample: true },
        { in: "aabbc", out: "a 2\nb 2\nc 1", sample: true },
        { in: "z", out: "z 1" },
        { in: "mississippi", out: "m 1\ni 4\ns 4\np 2" }
      ],
      hint: "A `LinkedHashMap<Character, Integer>` remembers insertion order. `map.merge(c, 1, Integer::sum)` increments a count in one line.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                String s = sc.next();
                Map<Character, Integer> freq = new LinkedHashMap<>();
                for (char c : s.toCharArray()) freq.merge(c, 1, Integer::sum);
                for (Map.Entry<Character, Integer> e : freq.entrySet()) {
                    System.out.println(e.getKey() + " " + e.getValue());
                }
            }
        }`
    },
    {
      id: "remove-duplicates",
      title: "Remove Duplicates",
      difficulty: "Medium",
      tags: ["Set", "LinkedHashSet", "arrays"],
      body: [{ p: "Read `n` integers and print them with duplicates removed, keeping the **first occurrence** of each value in its original order." }],
      input: "First line: `n`. Second line: `n` integers.",
      output: "The unique values on one line, separated by spaces.",
      tests: [
        { in: "6\n1 2 2 3 1 4", out: "1 2 3 4", sample: true },
        { in: "3\n5 5 5", out: "5", sample: true },
        { in: "3\n3 1 2", out: "3 1 2" },
        { in: "8\n-1 0 -1 0 7 7 8 -1", out: "-1 0 7 8" }
      ],
      hint: "`LinkedHashSet` = no duplicates **and** insertion order. `set.add(x)` returns `false` if `x` was already there.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                int n = sc.nextInt();
                Set<Integer> seen = new LinkedHashSet<>();
                for (int i = 0; i < n; i++) seen.add(sc.nextInt());
                StringJoiner sj = new StringJoiner(" ");
                for (int x : seen) sj.add(String.valueOf(x));
                System.out.println(sj);
            }
        }`
    },
    {
      id: "anagram",
      title: "Anagram Check",
      difficulty: "Medium",
      tags: ["strings", "sorting", "arrays"],
      body: [{ p: "Read two words on separate lines. Print `Anagram` if they contain exactly the same letters with the same counts (**ignoring case**), otherwise `Not Anagram`." }],
      input: "Two lines, one word each.",
      output: "`Anagram` or `Not Anagram`.",
      tests: [
        { in: "listen\nsilent", out: "Anagram", sample: true },
        { in: "rat\ncar", out: "Not Anagram", sample: true },
        { in: "Triangle\nIntegral", out: "Anagram" },
        { in: "apple\npaple", out: "Anagram" },
        { in: "abc\nabcd", out: "Not Anagram" },
        { in: "aab\nabb", out: "Not Anagram" }
      ],
      hint: "Lower-case both, convert to `char[]`, `Arrays.sort` each, then `Arrays.equals`. Or count letters with an `int[26]`.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                char[] a = sc.next().toLowerCase().toCharArray();
                char[] b = sc.next().toLowerCase().toCharArray();
                Arrays.sort(a);
                Arrays.sort(b);
                System.out.println(Arrays.equals(a, b) ? "Anagram" : "Not Anagram");
            }
        }`
    },
    {
      id: "reverse-words",
      title: "Reverse the Words",
      difficulty: "Medium",
      tags: ["strings", "split"],
      body: [{ p: "Read a sentence and print its words in reverse order, separated by **single** spaces. The input may have extra spaces at the start, end, or between words." }],
      input: "One line of text containing at least one word.",
      output: "The words in reverse order, single-spaced.",
      tests: [
        { in: "I love Java", out: "Java love I", sample: true },
        { in: "Amdocs", out: "Amdocs", sample: true },
        { in: "  extra   spaces here ", out: "here spaces extra" },
        { in: "one two three four five", out: "five four three two one" }
      ],
      hint: "`line.trim().split(\"\\\\s+\")` splits on runs of whitespace. Then loop backwards, or use `Collections.reverse` and `String.join(\" \", list)`.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                String[] words = sc.nextLine().trim().split("\\s+");
                StringBuilder sb = new StringBuilder();
                for (int i = words.length - 1; i >= 0; i--) {
                    sb.append(words[i]);
                    if (i > 0) sb.append(' ');
                }
                System.out.println(sb);
            }
        }`
    },
    {
      id: "balanced-brackets",
      title: "Balanced Brackets",
      difficulty: "Medium",
      tags: ["Stack", "Deque"],
      body: [{ p: "Read a string made only of the characters `()[]{}`. Print `Balanced` if every bracket is closed by the matching type in the correct order, otherwise `Not Balanced`." }],
      input: "One non-empty string of brackets.",
      output: "`Balanced` or `Not Balanced`.",
      tests: [
        { in: "{[()]}", out: "Balanced", sample: true },
        { in: "([)]", out: "Not Balanced", sample: true },
        { in: "()[]{}", out: "Balanced" },
        { in: "((", out: "Not Balanced" },
        { in: "}", out: "Not Balanced" },
        { in: "{{[[(())]]}}()", out: "Balanced" }
      ],
      hint: "Push opening brackets onto a `Deque<Character>`. On a closing bracket, the stack must be non-empty and its top must be the matching opener. At the end, the stack must be empty.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                String s = sc.next();
                Deque<Character> stack = new ArrayDeque<>();
                boolean ok = true;
                for (char c : s.toCharArray()) {
                    if (c == '(' || c == '[' || c == '{') {
                        stack.push(c);
                    } else {
                        if (stack.isEmpty()) { ok = false; break; }
                        char open = stack.pop();
                        if ((c == ')' && open != '(') || (c == ']' && open != '[') || (c == '}' && open != '{')) {
                            ok = false;
                            break;
                        }
                    }
                }
                System.out.println(ok && stack.isEmpty() ? "Balanced" : "Not Balanced");
            }
        }`
    },
    {
      id: "missing-number",
      title: "Find the Missing Number",
      difficulty: "Medium",
      tags: ["math", "arrays"],
      body: [{ p: "The numbers `1` to `n` were shuffled and **one** was removed. Read the remaining `n - 1` numbers and print the missing one." }],
      input: "First line: `n` (2 ≤ n ≤ 100000). Second line: `n - 1` distinct integers from 1 to n.",
      output: "The missing number.",
      tests: [
        { in: "5\n1 2 4 5", out: "3", sample: true },
        { in: "2\n2", out: "1", sample: true },
        { in: "8\n1 2 3 4 5 6 7", out: "8" },
        { in: "6\n6 1 5 2 3", out: "4" }
      ],
      hint: "The sum of 1..n is `n * (n + 1) / 2`. Subtract what you read (use `long` to be safe).",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                long n = sc.nextLong();
                long expected = n * (n + 1) / 2, sum = 0;
                for (int i = 0; i < n - 1; i++) sum += sc.nextLong();
                System.out.println(expected - sum);
            }
        }`
    },
    {
      id: "word-count",
      title: "Word Count (Sorted)",
      difficulty: "Medium",
      tags: ["TreeMap", "strings"],
      body: [{ p: "Read a line of lowercase words separated by spaces. Print each distinct word with how many times it appears, in **alphabetical** order." }],
      input: "One line of lowercase words.",
      output: "One line per distinct word: `<word> <count>`, sorted alphabetically.",
      tests: [
        { in: "the cat and the hat", out: "and 1\ncat 1\nhat 1\nthe 2", sample: true },
        { in: "b a b a c", out: "a 2\nb 2\nc 1", sample: true },
        { in: "java", out: "java 1" },
        { in: "sql unix java sql java sql", out: "java 2\nsql 3\nunix 1" }
      ],
      hint: "A `TreeMap<String, Integer>` keeps keys sorted automatically.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                Map<String, Integer> counts = new TreeMap<>();
                for (String w : sc.nextLine().trim().split("\\s+")) counts.merge(w, 1, Integer::sum);
                counts.forEach((w, c) -> System.out.println(w + " " + c));
            }
        }`
    },
    {
      id: "matrix-diagonals",
      title: "Matrix Diagonals",
      difficulty: "Medium",
      tags: ["2D arrays"],
      body: [{ p: "Read an `n × n` matrix and print the sum of its primary diagonal (top-left to bottom-right) and its secondary diagonal (top-right to bottom-left)." }],
      input: "First line: `n` (1 ≤ n ≤ 50). Then `n` lines of `n` integers.",
      output: "Two lines: `Primary: X` and `Secondary: Y`.",
      tests: [
        { in: "3\n1 2 3\n4 5 6\n7 8 9", out: "Primary: 15\nSecondary: 15", sample: true },
        { in: "2\n1 2\n3 4", out: "Primary: 5\nSecondary: 5", sample: true },
        { in: "3\n2 0 1\n0 3 0\n4 0 5", out: "Primary: 10\nSecondary: 8" },
        { in: "1\n-7", out: "Primary: -7\nSecondary: -7" }
      ],
      hint: "Primary uses `m[i][i]`; secondary uses `m[i][n - 1 - i]`.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                int n = sc.nextInt();
                int[][] m = new int[n][n];
                for (int i = 0; i < n; i++)
                    for (int j = 0; j < n; j++) m[i][j] = sc.nextInt();
                int primary = 0, secondary = 0;
                for (int i = 0; i < n; i++) {
                    primary += m[i][i];
                    secondary += m[i][n - 1 - i];
                }
                System.out.println("Primary: " + primary);
                System.out.println("Secondary: " + secondary);
            }
        }`
    },
    {
      id: "binary-search",
      title: "Binary Search",
      difficulty: "Medium",
      tags: ["searching", "arrays"],
      body: [{ p: "Given a sorted array of distinct integers and a target, print the target's **0-based index**, or `-1` if it isn't present. Implement binary search yourself (don't use `Arrays.binarySearch`)." }],
      input: "Line 1: `n`. Line 2: `n` sorted distinct integers. Line 3: the target.",
      output: "The index, or `-1`.",
      tests: [
        { in: "6\n1 3 5 7 9 11\n7", out: "3", sample: true },
        { in: "6\n1 3 5 7 9 11\n4", out: "-1", sample: true },
        { in: "6\n1 3 5 7 9 11\n1", out: "0" },
        { in: "6\n1 3 5 7 9 11\n11", out: "5" },
        { in: "1\n2\n2", out: "0" }
      ],
      hint: "`lo = 0, hi = n - 1`; while `lo <= hi`: `mid = lo + (hi - lo) / 2`; compare and move `lo = mid + 1` or `hi = mid - 1`.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                int n = sc.nextInt();
                int[] a = new int[n];
                for (int i = 0; i < n; i++) a[i] = sc.nextInt();
                int target = sc.nextInt();
                int lo = 0, hi = n - 1, ans = -1;
                while (lo <= hi) {
                    int mid = lo + (hi - lo) / 2;
                    if (a[mid] == target) { ans = mid; break; }
                    if (a[mid] < target) lo = mid + 1; else hi = mid - 1;
                }
                System.out.println(ans);
            }
        }`
    },
    {
      id: "two-sum",
      title: "Two Sum",
      difficulty: "Medium",
      tags: ["HashMap", "arrays"],
      body: [
        { p: "Find two **different** positions `i < j` whose values add up to the target, and print `i j` (0-based). Exactly one valid pair exists." },
        { tip: "The brute-force double loop is O(n²). Interviewers usually want the O(n) HashMap version: for each `x`, check whether `target - x` has been seen." }
      ],
      input: "Line 1: `n`. Line 2: `n` integers. Line 3: the target.",
      output: "Two indices `i j` with `i < j`.",
      tests: [
        { in: "4\n2 7 11 15\n9", out: "0 1", sample: true },
        { in: "3\n3 2 4\n6", out: "1 2", sample: true },
        { in: "2\n3 3\n6", out: "0 1" },
        { in: "5\n1 5 3 8 2\n10", out: "3 4" },
        { in: "6\n-3 4 3 90 0 7\n0", out: "0 2" }
      ],
      hint: "`Map<Integer, Integer> seen` maps value → index. For index `j`, if `seen` contains `target - a[j]`, print `seen.get(...) + \" \" + j`.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                int n = sc.nextInt();
                int[] a = new int[n];
                for (int i = 0; i < n; i++) a[i] = sc.nextInt();
                int target = sc.nextInt();
                Map<Integer, Integer> seen = new HashMap<>();
                for (int j = 0; j < n; j++) {
                    Integer i = seen.get(target - a[j]);
                    if (i != null) {
                        System.out.println(i + " " + j);
                        return;
                    }
                    seen.putIfAbsent(a[j], j);
                }
            }
        }`
    },
    {
      id: "bank-account",
      title: "Bank Account (OOP)",
      difficulty: "Medium",
      tags: ["OOP", "classes", "exceptions"],
      body: [
        { p: "Process a list of bank commands on one account that starts at balance `0`. Model it with a `BankAccount` class that has `deposit`, `withdraw` and `getBalance` methods. Bonus: throw and catch a custom `InsufficientBalanceException`." },
        { ul: [
          "`DEPOSIT x`: add `x`. If `x <= 0`, print `Invalid amount`.",
          "`WITHDRAW x`: subtract `x`. If `x <= 0`, print `Invalid amount`. If `x` is more than the balance, print `Insufficient balance` and leave the balance unchanged.",
          "`BALANCE`: print `Balance: <balance>`."
        ]},
        { p: "Successful deposits and withdrawals print nothing." }
      ],
      input: "First line: `n`, the number of commands. Then `n` lines, one command each. Amounts are integers.",
      output: "Only the lines described above.",
      tests: [
        { in: "5\nDEPOSIT 1000\nWITHDRAW 300\nBALANCE\nWITHDRAW 800\nBALANCE", out: "Balance: 700\nInsufficient balance\nBalance: 700", sample: true },
        { in: "3\nDEPOSIT 50\nDEPOSIT 25\nBALANCE", out: "Balance: 75", sample: true },
        { in: "4\nWITHDRAW 10\nDEPOSIT -5\nBALANCE\nDEPOSIT 5", out: "Insufficient balance\nInvalid amount\nBalance: 0" },
        { in: "6\nDEPOSIT 100\nWITHDRAW 100\nBALANCE\nWITHDRAW 0\nDEPOSIT 1\nBALANCE", out: "Balance: 0\nInvalid amount\nBalance: 1" }
      ],
      hint: "Read `n`, then loop: `String cmd = sc.next();` and only read an amount with `sc.nextLong()` when the command isn't `BALANCE`. Only one class can be `public` in the file, so declare `BankAccount` without `public`.",
      solution: C`
        import java.util.*;

        class InsufficientBalanceException extends Exception {
            InsufficientBalanceException(String msg) { super(msg); }
        }

        class BankAccount {
            private long balance;

            void deposit(long amount) {
                if (amount <= 0) throw new IllegalArgumentException("Invalid amount");
                balance += amount;
            }

            void withdraw(long amount) throws InsufficientBalanceException {
                if (amount <= 0) throw new IllegalArgumentException("Invalid amount");
                if (amount > balance) throw new InsufficientBalanceException("Insufficient balance");
                balance -= amount;
            }

            long getBalance() { return balance; }
        }

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                BankAccount acct = new BankAccount();
                int n = sc.nextInt();
                for (int i = 0; i < n; i++) {
                    String cmd = sc.next();
                    try {
                        switch (cmd) {
                            case "DEPOSIT":  acct.deposit(sc.nextLong()); break;
                            case "WITHDRAW": acct.withdraw(sc.nextLong()); break;
                            case "BALANCE":  System.out.println("Balance: " + acct.getBalance()); break;
                        }
                    } catch (IllegalArgumentException | InsufficientBalanceException e) {
                        System.out.println(e.getMessage());
                    }
                }
            }
        }`
    },

    /* ===================== HARD / DOMAIN ===================== */
    {
      id: "mobile-bill",
      title: "Mobile Bill Calculator",
      difficulty: "Hard",
      tags: ["telecom", "rating", "String.format"],
      body: [
        { p: "Telecom billing in miniature. This is the kind of **rating** logic Amdocs systems run for millions of subscribers. A postpaid plan costs **₱599.00/month** and includes:" },
        { table: { head: ["Usage", "Included", "Overage rate"], rows: [
          ["Calls", "300 minutes", "₱2.50 per extra minute"],
          ["SMS", "100 messages", "₱1.00 per extra SMS"],
          ["Data", "5120 MB", "₱0.50 per extra MB"]
        ]}},
        { p: "Given a subscriber's usage, print the overage charge for each type and the total bill. Format every amount with **exactly 2 decimal places**." }
      ],
      input: "Three integers: `minutes sms dataMB`.",
      output: "Four lines: `Calls: X`, `SMS: X`, `Data: X`, `Total: X`. Amounts use 2 decimals, no currency symbol.",
      tests: [
        { in: "250 80 4000", out: "Calls: 0.00\nSMS: 0.00\nData: 0.00\nTotal: 599.00", sample: true },
        { in: "320 100 5120", out: "Calls: 50.00\nSMS: 0.00\nData: 0.00\nTotal: 649.00", sample: true },
        { in: "400 150 6144", out: "Calls: 250.00\nSMS: 50.00\nData: 512.00\nTotal: 1411.00" },
        { in: "0 0 0", out: "Calls: 0.00\nSMS: 0.00\nData: 0.00\nTotal: 599.00" },
        { in: "301 101 5121", out: "Calls: 2.50\nSMS: 1.00\nData: 0.50\nTotal: 603.00" }
      ],
      hint: "Overage = `Math.max(0, used - included) * rate`. Print with `System.out.printf(\"Calls: %.2f%n\", calls);`. (In production you'd use `BigDecimal` for money. Mention that in an interview!)",
      solution: C`
        import java.util.*;

        public class Main {
            static final double FEE = 599.00;

            static double overage(long used, long included, double rate) {
                return Math.max(0, used - included) * rate;
            }

            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                long minutes = sc.nextLong(), sms = sc.nextLong(), data = sc.nextLong();
                double calls = overage(minutes, 300, 2.50);
                double texts = overage(sms, 100, 1.00);
                double mb = overage(data, 5120, 0.50);
                System.out.printf("Calls: %.2f%n", calls);
                System.out.printf("SMS: %.2f%n", texts);
                System.out.printf("Data: %.2f%n", mb);
                System.out.printf("Total: %.2f%n", FEE + calls + texts + mb);
            }
        }`
    },
    {
      id: "log-summary",
      title: "Log File Summary",
      difficulty: "Hard",
      tags: ["parsing", "HashMap", "support"],
      body: [
        { p: "Production support engineers live in log files. Each log line looks like:" },
        { code: "2026-11-26 10:00:05 ERROR DB connection failed", lang: "plaintext" },
        { p: "That's a date, a time, a level (`INFO`, `WARN` or `ERROR`), then a free-text message that may contain spaces. Count the lines per level, and find the **most frequent ERROR message**. On a tie, pick the message that appeared **first**. If there are no errors, print `none`." }
      ],
      input: "First line: `n`. Then `n` log lines.",
      output: "Four lines: `INFO: a`, `WARN: b`, `ERROR: c`, `Most frequent error: <message>`.",
      tests: [
        { in: "5\n2026-11-26 10:00:01 INFO Service started\n2026-11-26 10:00:05 ERROR DB connection failed\n2026-11-26 10:00:09 WARN Slow response\n2026-11-26 10:01:00 ERROR Payment timeout\n2026-11-26 10:02:00 ERROR DB connection failed",
          out: "INFO: 1\nWARN: 1\nERROR: 3\nMost frequent error: DB connection failed", sample: true },
        { in: "2\n2026-11-26 09:00:00 INFO Job started\n2026-11-26 09:05:00 INFO Job finished",
          out: "INFO: 2\nWARN: 0\nERROR: 0\nMost frequent error: none", sample: true },
        { in: "4\n2026-11-26 11:00:00 ERROR Timeout\n2026-11-26 11:00:01 ERROR Disk full\n2026-11-26 11:00:02 ERROR Disk full\n2026-11-26 11:00:03 ERROR Timeout",
          out: "INFO: 0\nWARN: 0\nERROR: 4\nMost frequent error: Timeout" },
        { in: "3\n2026-11-26 12:00:00 WARN Cache miss rate high\n2026-11-26 12:00:01 WARN Cache miss rate high\n2026-11-26 12:00:02 ERROR ORA-00060 deadlock detected while waiting for resource",
          out: "INFO: 0\nWARN: 2\nERROR: 1\nMost frequent error: ORA-00060 deadlock detected while waiting for resource" }
      ],
      hint: "After reading `n` with `nextInt()`, call `sc.nextLine()` once to consume the rest of that line. Then `line.split(\" \", 4)` gives `[date, time, level, message]`. A `LinkedHashMap` keeps first-appearance order for the tie-break. Only replace the best when a count is strictly greater.",
      solution: C`
        import java.util.*;

        public class Main {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                int n = Integer.parseInt(sc.nextLine().trim());
                Map<String, Integer> levels = new HashMap<>();
                Map<String, Integer> errors = new LinkedHashMap<>();
                for (int i = 0; i < n; i++) {
                    String[] p = sc.nextLine().split(" ", 4);
                    String level = p[2];
                    levels.merge(level, 1, Integer::sum);
                    if (level.equals("ERROR")) errors.merge(p.length > 3 ? p[3] : "", 1, Integer::sum);
                }
                String best = "none";
                int bestCount = 0;
                for (Map.Entry<String, Integer> e : errors.entrySet()) {
                    if (e.getValue() > bestCount) { best = e.getKey(); bestCount = e.getValue(); }
                }
                System.out.println("INFO: " + levels.getOrDefault("INFO", 0));
                System.out.println("WARN: " + levels.getOrDefault("WARN", 0));
                System.out.println("ERROR: " + levels.getOrDefault("ERROR", 0));
                System.out.println("Most frequent error: " + best);
            }
        }`
    },
    {
      id: "employee-sort",
      title: "Sort Employees",
      difficulty: "Hard",
      tags: ["Comparator", "OOP", "streams"],
      body: [
        { p: "Read a list of employees (name, department, salary) and print them sorted by **salary descending**. Break ties by **name ascending**. Then print the average salary per department in alphabetical order of department, with 2 decimals." },
        { tip: "This is how interviewers combine OOP, `Comparator` chaining and `Collectors.groupingBy` in one question. Try writing it with a `record` or a small class." }
      ],
      input: "First line: `n`. Then `n` lines: `name department salary` (names and departments have no spaces).",
      output: "First the `n` employees as `name department salary`, sorted. Then a line `---`. Then one line per department: `department average` (2 decimals), sorted by department.",
      tests: [
        { in: "4\nAna Engineering 90000\nBen Engineering 60000\nCarlo Billing 75000\nDana Billing 75000",
          out: "Ana Engineering 90000\nCarlo Billing 75000\nDana Billing 75000\nBen Engineering 60000\n---\nBilling 75000.00\nEngineering 75000.00", sample: true },
        { in: "1\nEd Support 50000", out: "Ed Support 50000\n---\nSupport 50000.00", sample: true },
        { in: "5\nZed Ops 40000\nAmy Ops 40000\nBob Dev 55000\nCy Dev 50001\nDee QA 47000",
          out: "Bob Dev 55000\nCy Dev 50001\nDee QA 47000\nAmy Ops 40000\nZed Ops 40000\n---\nDev 52500.50\nOps 40000.00\nQA 47000.00" }
      ],
      hint: "`list.sort(Comparator.comparingLong(Emp::salary).reversed().thenComparing(Emp::name))`. Then use `new TreeMap<>(... Collectors.groupingBy(Emp::dept, Collectors.averagingLong(Emp::salary)))` for sorted department averages.",
      solution: C`
        import java.util.*;
        import java.util.stream.*;

        public class Main {
            record Emp(String name, String dept, long salary) { }

            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);
                int n = sc.nextInt();
                List<Emp> list = new ArrayList<>();
                for (int i = 0; i < n; i++) list.add(new Emp(sc.next(), sc.next(), sc.nextLong()));

                list.sort(Comparator.comparingLong(Emp::salary).reversed().thenComparing(Emp::name));
                for (Emp e : list) System.out.println(e.name() + " " + e.dept() + " " + e.salary());

                System.out.println("---");
                Map<String, Double> avg = new TreeMap<>(list.stream()
                        .collect(Collectors.groupingBy(Emp::dept, Collectors.averagingLong(Emp::salary))));
                avg.forEach((d, a) -> System.out.printf("%s %.2f%n", d, a));
            }
        }`
    }
  ];
})();
