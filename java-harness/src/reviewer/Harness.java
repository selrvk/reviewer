package reviewer;

import com.sun.source.tree.*;
import com.sun.source.util.*;

import javax.tools.*;
import java.io.*;
import java.lang.reflect.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.Permission;
import java.util.*;

/**
 * Runs inside CheerpJ (the in-browser JVM). Compiles one Java source file in memory,
 * then runs its main() once per test case with a fresh class loader (so static fields
 * reset), redirected System.in/out/err, and a time limit.
 *
 * Because CheerpJ can't preempt a busy thread, the source is instrumented before
 * compiling: every loop body and method body gets a call to reviewer.Guard.tick().
 * Inserted text never contains newlines, and diagnostic positions are mapped back to
 * the original source, so line/column numbers shown to the user are unaffected.
 *
 * Args: <sourceFile> <testsFile> <resultFile> <mainClass> <timeoutMs>
 *   testsFile:  first line = N, then N lines of base64(stdin) ("-" = empty)
 *   resultFile: "COMPILE OK|ERR <b64 diagnostics>" then one line per test:
 *               "TEST <OK|EXCEPTION|TIMEOUT|NOMAIN> <ms> <b64 stdout> <b64 stderr>"
 *
 * Build (needs JDK 17+): java-harness/build.sh
 */
public class Harness {

    static final Base64.Encoder B64 = Base64.getEncoder();
    static final int MAX_OUT = 64 * 1024;
    static final String GUARD = "reviewer.Guard.tick();";

    public static void main(String[] args) throws Exception {
        String source = new String(Files.readAllBytes(Paths.get(args[0])), StandardCharsets.UTF_8);
        List<String> testLines = Files.readAllLines(Paths.get(args[1]), StandardCharsets.UTF_8);
        Path result = Paths.get(args[2]);
        String mainClass = args[3];
        long timeout = Long.parseLong(args[4]);
        cleanOldResults(result);

        StringBuilder out = new StringBuilder();
        Map<String, MemClass> classes = new HashMap<>();
        String diags = compile(mainClass, source, classes);
        if (diags != null) {
            out.append("COMPILE ERR ").append(b64(diags)).append('\n');
            write(result, out);
            return;
        }
        out.append("COMPILE OK -\n");
        write(result, out);

        int n = Integer.parseInt(testLines.get(0).trim());
        for (int i = 0; i < n; i++) {
            String line = testLines.get(i + 1).trim();
            byte[] input = line.equals("-") ? new byte[0] : Base64.getDecoder().decode(line);
            out.append(runTest(mainClass, classes, input, timeout)).append('\n');
            write(result, out); // after every test, so a hard exit still leaves earlier results
        }
    }

    /* ================= compilation ================= */

    static final class Src extends SimpleJavaFileObject {
        final String code;
        Src(String cls, String code) {
            super(URI.create("string:///" + cls + ".java"), Kind.SOURCE);
            this.code = code;
        }
        @Override public CharSequence getCharContent(boolean ignore) { return code; }
    }

    static final class MemClass extends SimpleJavaFileObject {
        final ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        MemClass(String name) { super(URI.create("mem:///" + name.replace('.', '/') + ".class"), Kind.CLASS); }
        @Override public OutputStream openOutputStream() { return bytes; }
    }

    /** A piece of text inserted at an offset of the ORIGINAL source. */
    static final class Insert {
        final int pos; final String text;
        Insert(int pos, String text) { this.pos = pos; this.text = text; }
    }

    static final List<String> OPTIONS = Arrays.asList("-nowarn", "-encoding", "UTF-8", "-proc:none", "-g");

    /** Returns null on success, otherwise human-readable diagnostics. */
    static String compile(String cls, String source, Map<String, MemClass> classes) throws IOException {
        JavaCompiler jc = ToolProvider.getSystemJavaCompiler();
        if (jc == null) return "Internal error: no Java compiler available in this runtime.";

        // 1) parse the original source and find where to put guards
        DiagnosticCollector<JavaFileObject> parseDiags = new DiagnosticCollector<>();
        JavacTask parseTask = (JavacTask) jc.getTask(new StringWriter(), null, parseDiags, OPTIONS, null,
                Collections.singletonList(new Src(cls, source)));
        Iterable<? extends CompilationUnitTree> units = parseTask.parse();
        if (hasErrors(parseDiags)) return format(parseDiags.getDiagnostics(), source, Collections.emptyList());

        List<Insert> inserts = new ArrayList<>();
        SourcePositions sp = Trees.instance(parseTask).getSourcePositions();
        for (CompilationUnitTree cu : units) collectGuards(cu, sp, inserts);
        inserts.sort((a, b) -> a.pos != b.pos ? Integer.compare(a.pos, b.pos)
                : Boolean.compare(!a.text.equals("}"), !b.text.equals("}")));   // closing braces first
        String instrumented = apply(source, inserts);

        // 2) compile the instrumented source into memory
        DiagnosticCollector<JavaFileObject> dc = new DiagnosticCollector<>();
        StandardJavaFileManager std = jc.getStandardFileManager(dc, Locale.ENGLISH, StandardCharsets.UTF_8);
        JavaFileManager fm = new ForwardingJavaFileManager<StandardJavaFileManager>(std) {
            @Override
            public JavaFileObject getJavaFileForOutput(Location loc, String name, JavaFileObject.Kind kind, FileObject sibling) {
                MemClass mc = new MemClass(name);
                classes.put(name, mc);
                return mc;
            }
        };
        StringWriter misc = new StringWriter();
        boolean ok = jc.getTask(misc, fm, dc, OPTIONS, null,
                Collections.singletonList(new Src(cls, instrumented))).call();
        if (ok) return null;
        String msg = format(dc.getDiagnostics(), source, inserts);
        return msg.isEmpty() ? misc.toString() : msg;
    }

    static boolean hasErrors(DiagnosticCollector<JavaFileObject> dc) {
        for (Diagnostic<?> d : dc.getDiagnostics()) if (d.getKind() == Diagnostic.Kind.ERROR) return true;
        return false;
    }

    static void collectGuards(CompilationUnitTree cu, SourcePositions sp, List<Insert> out) {
        new TreeScanner<Void, Void>() {
            void guardBody(StatementTree body) {
                if (body == null) return;
                long s = sp.getStartPosition(cu, body), e = sp.getEndPosition(cu, body);
                if (s < 0) return;
                if (body instanceof BlockTree) {
                    out.add(new Insert((int) s + 1, GUARD));
                } else if (e >= 0) {
                    out.add(new Insert((int) s, "{" + GUARD));
                    out.add(new Insert((int) e, "}"));
                }
            }
            @Override public Void visitWhileLoop(WhileLoopTree t, Void v) { guardBody(t.getStatement()); return super.visitWhileLoop(t, v); }
            @Override public Void visitDoWhileLoop(DoWhileLoopTree t, Void v) { guardBody(t.getStatement()); return super.visitDoWhileLoop(t, v); }
            @Override public Void visitForLoop(ForLoopTree t, Void v) { guardBody(t.getStatement()); return super.visitForLoop(t, v); }
            @Override public Void visitEnhancedForLoop(EnhancedForLoopTree t, Void v) { guardBody(t.getStatement()); return super.visitEnhancedForLoop(t, v); }
            @Override public Void visitMethod(MethodTree m, Void v) {
                // constructors may need super()/this() first, so only guard regular methods (catches runaway recursion loops)
                if (m.getBody() != null && !m.getName().contentEquals("<init>")) {
                    long s = sp.getStartPosition(cu, m.getBody());
                    if (s >= 0) out.add(new Insert((int) s + 1, GUARD));
                }
                return super.visitMethod(m, v);
            }
        }.scan(cu, null);
    }

    static String apply(String src, List<Insert> inserts) {
        StringBuilder sb = new StringBuilder(src.length() + inserts.size() * GUARD.length());
        int last = 0;
        for (Insert in : inserts) {
            int p = Math.max(last, Math.min(in.pos, src.length()));
            sb.append(src, last, p).append(in.text);
            last = p;
        }
        return sb.append(src.substring(last)).toString();
    }

    /** Maps an offset in the instrumented source back to the original source. */
    static long toOriginal(long pos, List<Insert> inserts) {
        long shift = 0;
        for (Insert in : inserts) {
            long at = in.pos + shift;                 // where this insert starts in instrumented text
            if (pos < at) break;
            if (pos < at + in.text.length()) return in.pos;
            shift += in.text.length();
        }
        return pos - shift;
    }

    static String format(List<Diagnostic<? extends JavaFileObject>> diags, String source, List<Insert> inserts) {
        String[] lines = source.split("\n", -1);
        int[] lineStart = new int[lines.length];
        for (int i = 1; i < lines.length; i++) lineStart[i] = lineStart[i - 1] + lines[i - 1].length() + 1;

        StringBuilder sb = new StringBuilder();
        for (Diagnostic<? extends JavaFileObject> d : diags) {
            if (d.getKind() != Diagnostic.Kind.ERROR) continue;
            String message = d.getMessage(Locale.ENGLISH).replace("reviewer.Guard.tick();", "");
            if (d.getPosition() == Diagnostic.NOPOS) { sb.append(message).append('\n'); continue; }
            long off = toOriginal(d.getPosition(), inserts);
            int ln = 0;
            while (ln + 1 < lines.length && lineStart[ln + 1] <= off) ln++;
            int col = (int) (off - lineStart[ln]);
            sb.append("Line ").append(ln + 1).append(": ").append(message).append('\n');
            String text = lines[ln].replace("\r", "");
            sb.append("    ").append(text.replace('\t', ' ')).append('\n');
            sb.append("    ").append(" ".repeat(Math.max(0, Math.min(col, text.length())))).append("^\n");
        }
        return sb.toString();
    }

    /* ================= execution ================= */

    static final class MemLoader extends ClassLoader {
        final Map<String, MemClass> classes;
        MemLoader(ClassLoader parent, Map<String, MemClass> classes) { super(parent); this.classes = classes; }
        @Override protected Class<?> findClass(String name) throws ClassNotFoundException {
            MemClass mc = classes.get(name);
            if (mc == null) throw new ClassNotFoundException(name);
            byte[] b = mc.bytes.toByteArray();
            return defineClass(name, b, 0, b.length);
        }
    }

    static final class ExitCalled extends SecurityException {
        ExitCalled() { super("System.exit"); }
    }

    /** Output stream that stops recording after MAX_OUT bytes. */
    static final class Capped extends OutputStream {
        final ByteArrayOutputStream buf = new ByteArrayOutputStream();
        boolean truncated;
        @Override public synchronized void write(int b) {
            if (buf.size() < MAX_OUT) buf.write(b); else truncated = true;
        }
        @Override public synchronized void write(byte[] b, int off, int len) {
            int room = MAX_OUT - buf.size();
            if (room <= 0) { truncated = true; return; }
            if (len > room) { truncated = true; len = room; }
            buf.write(b, off, len);
        }
        String text() { return buf.toString(StandardCharsets.UTF_8) + (truncated ? "\n[output truncated]" : ""); }
    }

    @SuppressWarnings({"removal", "deprecation"})
    static String runTest(String mainClass, Map<String, MemClass> classes, byte[] input, long timeout) {
        PrintStream oldOut = System.out, oldErr = System.err;
        InputStream oldIn = System.in;
        Capped cout = new Capped(), cerr = new Capped();
        String status = "OK";

        SecurityManager oldSm = System.getSecurityManager();
        boolean smInstalled = false;
        try {
            System.setSecurityManager(new SecurityManager() {
                @Override public void checkPermission(Permission p) { }
                @Override public void checkPermission(Permission p, Object ctx) { }
                @Override public void checkExit(int code) { throw new ExitCalled(); }
            });
            smInstalled = true;
        } catch (Throwable ignore) { /* no SecurityManager: System.exit would end the whole run */ }

        PrintStream pout = new PrintStream(cout, true, StandardCharsets.UTF_8);
        PrintStream perr = new PrintStream(cerr, true, StandardCharsets.UTF_8);
        long start = System.currentTimeMillis();
        try {
            System.setIn(new ByteArrayInputStream(input));
            System.setOut(pout);
            System.setErr(perr);
            Method main = null;
            try {
                Class<?> c = Class.forName(mainClass, true, new MemLoader(Harness.class.getClassLoader(), classes));
                main = c.getMethod("main", String[].class);
                if (!Modifier.isStatic(main.getModifiers())) main = null;
            } catch (Throwable t) {
                main = null;
            }
            if (main == null) {
                status = "NOMAIN";
                perr.print("Could not find 'public static void main(String[] args)' in class " + mainClass + ".");
            } else {
                Guard.deadline = System.currentTimeMillis() + timeout;
                try {
                    main.invoke(null, (Object) new String[0]);
                } catch (InvocationTargetException e) {
                    Throwable cause = e.getCause();
                    if (cause instanceof Guard.TimeLimitExceeded) status = "TIMEOUT";
                    else if (!(cause instanceof ExitCalled)) { status = "EXCEPTION"; perr.println(describe(cause)); }
                }
            }
        } catch (Throwable t) {
            status = "EXCEPTION";
            perr.println(describe(t));
        } finally {
            Guard.deadline = Long.MAX_VALUE;
            pout.flush();
            perr.flush();
            System.setOut(oldOut);
            System.setErr(oldErr);
            System.setIn(oldIn);
            if (smInstalled) {
                try { System.setSecurityManager(oldSm); } catch (Throwable ignore) { }
            }
        }
        long ms = System.currentTimeMillis() - start;
        return "TEST " + status + " " + ms + " " + b64(cout.text()) + " " + b64(cerr.text());
    }

    /** Exception summary showing only the user's stack frames. */
    static String describe(Throwable t) {
        StringBuilder sb = new StringBuilder("Exception in thread \"main\" ").append(t);
        for (StackTraceElement e : t.getStackTrace()) {
            String c = e.getClassName();
            if (c.startsWith("reviewer.") || c.startsWith("java.") || c.startsWith("jdk.") || c.startsWith("sun.")) continue;
            sb.append("\n\tat ").append(e);
        }
        return sb.toString();
    }

    static String b64(String s) { return s.isEmpty() ? "-" : B64.encodeToString(s.getBytes(StandardCharsets.UTF_8)); }

    /** Result files live in browser storage (IndexedDB) under CheerpJ, so delete earlier ones. */
    static void cleanOldResults(Path result) {
        Path dir = result.getParent();
        if (dir == null || !Files.isDirectory(dir)) return;
        try (java.util.stream.Stream<Path> files = Files.list(dir)) {
            files.filter(p -> !p.equals(result)).forEach(p -> {
                try { Files.deleteIfExists(p); } catch (IOException ignore) { }
            });
        } catch (Throwable ignore) { }
    }

    static void write(Path p, CharSequence s) throws IOException {
        if (p.getParent() != null) Files.createDirectories(p.getParent());
        Files.write(p, s.toString().getBytes(StandardCharsets.UTF_8));
    }
}
