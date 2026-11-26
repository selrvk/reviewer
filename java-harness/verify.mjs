// Checks that every Java practice problem's reference solution passes all of its tests,
// using the same harness the browser uses (but on your local JVM).
//   node java-harness/verify.mjs            (needs `java` 17+ on PATH, or set JAVA=/path/to/java)
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { window: {} };
vm.runInNewContext(readFileSync(join(root, "js/data/practice-java.js"), "utf8"), ctx);
const problems = ctx.window.PRACTICE.java;

const dedent = (s) => {
  s = s.replace(/^\s*\n/, "").replace(/\s+$/, "");
  const lines = s.split("\n");
  const min = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(min)).join("\n");
};
const norm = (s) => s.replace(/\r\n/g, "\n").split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n+$/, "");
const b64 = (s) => (s === "" ? "-" : Buffer.from(s, "utf8").toString("base64"));
const unb64 = (s) => (s === "-" ? "" : Buffer.from(s, "base64").toString("utf8"));

const dir = mkdtempSync(join(tmpdir(), "verify-"));
const java = process.env.JAVA || "java";
let failures = 0, total = 0;
const ids = new Set();

for (const p of problems) {
  if (ids.has(p.id)) { console.log(`DUPLICATE id ${p.id}`); failures++; }
  ids.add(p.id);
  if (!p.tests.some((t) => t.sample)) { console.log(`${p.id}: no sample test`); failures++; }
  writeFileSync(join(dir, "src.java"), dedent(p.solution));
  writeFileSync(join(dir, "tests.txt"), p.tests.length + "\n" + p.tests.map((t) => b64(t.in)).join("\n") + "\n");
  execFileSync(java, ["-cp", join(root, "cheerpj/harness.jar"), "reviewer.Harness",
    join(dir, "src.java"), join(dir, "tests.txt"), join(dir, "out.txt"), "Main", "5000"], { stdio: ["ignore", "ignore", "ignore"] });
  const lines = readFileSync(join(dir, "out.txt"), "utf8").trim().split("\n");
  const [, cstatus, cmsg] = lines[0].split(" ");
  if (cstatus !== "OK") { console.log(`✗ ${p.id}: COMPILE ERROR\n${unb64(cmsg)}`); failures++; continue; }
  const bad = [];
  p.tests.forEach((t, i) => {
    total++;
    const [, status, , out, err] = (lines[i + 1] || "TEST MISSING 0 - -").split(" ");
    if (status !== "OK" || norm(unb64(out)) !== norm(t.out)) {
      bad.push(`  test ${i + 1}: ${status}\n    input:    ${JSON.stringify(t.in)}\n    expected: ${JSON.stringify(norm(t.out))}\n    got:      ${JSON.stringify(norm(unb64(out)))}${err !== "-" ? "\n    stderr:   " + unb64(err) : ""}`);
    }
  });
  if (bad.length) { failures += bad.length; console.log(`✗ ${p.id}\n${bad.join("\n")}`); }
  else console.log(`✓ ${p.id} (${p.tests.length} tests)`);
}
rmSync(dir, { recursive: true, force: true });
console.log(`\n${problems.length} problems, ${total} tests, ${failures} failure(s)`);
process.exit(failures ? 1 : 0);
