#!/usr/bin/env node
/**
 * Rolldown/Nitro can emit a circular `_ssr/ssr.mjs` ↔ `_ssr/ssr2.mjs` pair:
 * ssr2 imports `__exportAll` from ssr, while ssr imports the server entry from
 * ssr2. Node then 500s every HTML route (`ssr_exports is not defined` /
 * `__exportAll$1 is not a function` / `mod.fetch is not a function`).
 *
 * Nitro's renderer does `import("./ssr.mjs").then((n) => n.s)` and then calls
 * `.fetch`. Bind `s` to the real server entry and inline `__exportAll` so the
 * cycle never loads.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ssrDir = join(process.cwd(), ".vercel/output/functions/__server.func/_ssr");

const EXPORT_ALL = `var __exportAll$1 = (all, no_symbols) => {
  const target = {};
  for (const name in all) Object.defineProperty(target, name, { get: all[name], enumerable: true });
  if (!no_symbols) Object.defineProperty(target, Symbol.toStringTag, { value: "Module" });
  return target;
};
`;

async function main() {
  let entries;
  try {
    entries = await readdir(ssrDir);
  } catch {
    console.log("[fix-ssr] no nitro ssr output — skip");
    return;
  }

  let patched = 0;
  for (const name of entries) {
    if (!name.endsWith(".mjs")) continue;
    const path = join(ssrDir, name);
    let next = await readFile(path, "utf8");
    const original = next;

    if (name.startsWith("ssr.") && next.includes("ssr_exports as s") && next.includes("server_default")) {
      if (next.includes("var ssr_exports = {}")) {
        next = next.replace("var ssr_exports = {}", "var ssr_exports = server_default");
      } else if (!next.includes("var ssr_exports")) {
        next = next.replace(/export \{/, "var ssr_exports = server_default;\nexport {");
      } else if (next.includes("var ssr_exports = {};") && !next.includes("var ssr_exports = server_default")) {
        next = next.replace("var ssr_exports = {};", "var ssr_exports = server_default;");
      }
    }

    if (name.startsWith("ssr2") && /from "\.\/ssr\.mjs"/.test(next)) {
      next = next.replace(
        /import \{ c as __exportAll\$1 \} from "\.\/ssr\.mjs";\n/,
        EXPORT_ALL,
      );
      // Rolldown may emit a different binding name for __exportAll.
      next = next.replace(
        /import \{ ([^}]+) \} from "\.\/ssr\.mjs";\n/,
        (full, bindings) => {
          if (!String(bindings).includes("__exportAll")) return full;
          return EXPORT_ALL;
        },
      );
    }

    if (next === original) continue;
    await writeFile(path, next);
    patched += 1;
    console.log(`[fix-ssr] patched ${name}`);
  }

  const ssr = await readFile(join(ssrDir, "ssr.mjs"), "utf8").catch(() => "");
  const ssr2Name = entries.find((name) => name.startsWith("ssr2") && name.endsWith(".mjs"));
  const ssr2 = ssr2Name ? await readFile(join(ssrDir, ssr2Name), "utf8") : "";

  const ssrOk =
    !ssr.includes("ssr_exports as s") || ssr.includes("var ssr_exports = server_default");
  const ssr2Ok = !/from "\.\/ssr\.mjs"/.test(ssr2);
  if (!ssrOk || !ssr2Ok) {
    console.error("[fix-ssr] verification failed — SSR cycle still present.");
    if (!ssrOk) console.error("[fix-ssr] ssr.mjs did not bind ssr_exports to server_default");
    if (!ssr2Ok) console.error("[fix-ssr] ssr2 still imports from ssr.mjs");
    process.exit(1);
  }

  console.log(
    patched
      ? `[fix-ssr] done — ${patched} file(s). SSR cycle broken.`
      : "[fix-ssr] nothing to patch — SSR cycle already clear.",
  );
}

main().catch((err) => {
  console.error("[fix-ssr] failed:", err);
  process.exit(1);
});
