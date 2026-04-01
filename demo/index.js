/**
 * CodeLens AI — Demo
 * Reads agent definition (SOUL.md, RULES.md, SKILL.md) and calls Gemini API directly.
 *
 * Usage:
 *   node demo/index.js                 → interactive menu
 *   node demo/index.js explain         → explain a repo
 *   node demo/index.js interview       → generate interview questions
 *   node demo/index.js improve         → suggest improvements
 *   node demo/index.js explain-code    → explain specific code
 *
 * Requires: GOOGLE_API_KEY from https://aistudio.google.com/app/apikey
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENT_DIR  = path.resolve(__dirname, "..");
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:streamGenerateContent?alt=sse";

// Pick an available model that supports `generateContent` using ListModels
async function pickAvailableModel(apiKey) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) return null;
    const body = await res.json();
    const models = body.models || [];

    // Prefer newer Gemini models, then fall back to any model that supports generateContent
    // Prefer stable Flash models first (commonly available on free tiers), then pro/other Gemini families
    const preferredOrder = ["gemini-2.5-flash", "gemini-2.5", "gemini-flash-latest", "gemini-flash", "gemini-2.0", "gemini-pro", "gemini"];
    // Find any model whose name contains a preferred token and supports generateContent
    for (const token of preferredOrder) {
      const m = models.find(m => m.name.includes(token) && (m.supportedGenerationMethods || []).includes("generateContent"));
      if (m) return m.name;
    }

    // Otherwise return the first model that supports generateContent
    const any = models.find(m => (m.supportedGenerationMethods || []).includes("generateContent"));
    return any ? any.name : null;
  } catch {
    return null;
  }
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  cyan: "\x1b[36m", green: "\x1b[32m", yellow: "\x1b[33m",
  red: "\x1b[31m",  magenta: "\x1b[35m",
};
const log = {
  info:    (m) => console.log(`${c.cyan}${c.bold}[CodeLens]${c.reset} ${m}`),
  success: (m) => console.log(`${c.green}✓ ${m}${c.reset}`),
  warn:    (m) => console.log(`${c.yellow}⚠  ${m}${c.reset}`),
  error:   (m) => console.log(`${c.red}✗ ${m}${c.reset}`),
  divider: ()  => console.log(`${c.dim}${"─".repeat(60)}${c.reset}`),
  header:  (m) => console.log(`\n${c.magenta}${c.bold}${"═".repeat(60)}\n  ${m}\n${"═".repeat(60)}${c.reset}\n`),
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
function startSpinner(message = "Thinking") {
  const frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
  let i = 0;
  const timer = setInterval(() => {
    process.stdout.write(`\r${c.cyan}${frames[i++ % frames.length]}${c.reset} ${message}...   `);
  }, 80);
  return () => { clearInterval(timer); process.stdout.write("\r" + " ".repeat(message.length + 12) + "\r"); };
}

// ─── Ask ──────────────────────────────────────────────────────────────────────
function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(`${c.yellow}? ${q}${c.reset} `, (a) => { rl.close(); res(a.trim()); }));
}

// ─── Read agent files ─────────────────────────────────────────────────────────
function readFile(relPath) {
  const full = path.join(AGENT_DIR, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
}

function buildSystemPrompt(skillName) {
  const soul  = readFile("SOUL.md");
  const rules = readFile("RULES.md");
  const skill = readFile(`skills/${skillName}/SKILL.md`);
  return `${soul}\n\n---\n\n${rules}\n\n---\n\n## Active Skill: ${skillName}\n\n${skill}`.trim();
}

// ─── GitHub reader (public repos, no auth needed) ─────────────────────────────
async function githubFetch(owner, repo, filePath = "") {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const res  = await fetch(url, { headers: { "User-Agent": "codelens-ai", Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

async function readGithubRepo(repoUrl) {
  // Parse owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error(`Could not parse GitHub URL: ${repoUrl}`);
  const [, owner, repo] = match;

  log.info(`Fetching repo: ${c.bold}${owner}/${repo}${c.reset}`);
  const stop = startSpinner("Reading GitHub repo");

  try {
    // Get repo metadata
    const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { "User-Agent": "codelens-ai", Accept: "application/vnd.github+json" }
    });
    const meta = await metaRes.json();

    // Get file tree
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, {
      headers: { "User-Agent": "codelens-ai", Accept: "application/vnd.github+json" }
    });
    const tree = await treeRes.json();

    const files = (tree.tree || [])
      .filter(f => f.type === "blob" && f.size < 100000) // skip huge files
      .filter(f => /\.(py|js|ts|jsx|tsx|java|go|rs|rb|php|cs|cpp|c|h|md|yaml|yml|json|txt|toml|cfg|env\.example|ipynb)$/i.test(f.path))
      .slice(0, 30); // cap at 30 files for context window

    stop();
    log.info(`Found ${files.length} files to analyze`);

    // Read file contents (up to 20 files, prioritise important ones)
    const priority = ["README", "requirements", "package.json", "setup.py", "main", "app", "index", "config"];
    files.sort((a, b) => {
      const aP = priority.findIndex(p => a.path.toLowerCase().includes(p));
      const bP = priority.findIndex(p => b.path.toLowerCase().includes(p));
      return (aP === -1 ? 999 : aP) - (bP === -1 ? 999 : bP);
    });

    const readStop = startSpinner("Reading file contents");
    const fileContents = [];
    for (const file of files.slice(0, 20)) {
      try {
        const raw = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file.path}`);
        if (raw.ok) {
          const content = await raw.text();
          fileContents.push(`\n--- FILE: ${file.path} ---\n${content.slice(0, 3000)}`);
        }
      } catch { /* skip unreadable files */ }
    }
    readStop();

    return {
      summary: `Repo: ${owner}/${repo}\nDescription: ${meta.description || "N/A"}\nLanguage: ${meta.language || "N/A"}\nStars: ${meta.stargazers_count}\nTopics: ${(meta.topics || []).join(", ") || "N/A"}`,
      fileTree: files.map(f => f.path).join("\n"),
      fileContents: fileContents.join("\n"),
    };
  } catch (err) {
    stop();
    throw err;
  }
}

// ─── Gemini streaming call ────────────────────────────────────────────────────
async function callGemini(systemPrompt, userPrompt) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  });
  // Choose an available model and use non-streaming generateContent (safer across API versions)
  const modelName = await pickAvailableModel(apiKey);
  if (!modelName) throw new Error("Could not find any available model that supports generateContent for your API key.");

  const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 404) {
      try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listText = await listRes.text();
        throw new Error(`Gemini API error ${res.status}: ${err}\n\nListModels response:\n${listText}`);
      } catch (listErr) {
        throw new Error(`Gemini API error ${res.status}: ${err}\nAdditionally, failed to list models: ${listErr.message}`);
      }
    }
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  // Non-streaming response: parse JSON and print the candidate text
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) process.stdout.write(text);
}

// ─── Main runner ──────────────────────────────────────────────────────────────
async function runSkill(skillName, label, buildUserPrompt) {
  log.header(`CodeLens AI — ${label}`);
  log.divider();
  console.log();

  const systemPrompt = buildSystemPrompt(skillName);
  const userPrompt   = await buildUserPrompt();

  if (!userPrompt) { log.error("Cancelled."); return; }

  const stop = startSpinner("Thinking");

  try {
    // Stream starts — clear spinner on first output
    let started = false;
    const origWrite = process.stdout.write.bind(process.stdout);

    // Patch stdout to detect first write
    process.stdout.write = function(chunk, ...args) {
      if (!started) { started = true; stop(); process.stdout.write = origWrite; }
      return origWrite(chunk, ...args);
    };

    await callGemini(systemPrompt, userPrompt);

    if (!started) stop();
    process.stdout.write = origWrite;
    console.log("\n");
    log.divider();
    log.success("Done.\n");
  } catch (err) {
    stop();
    process.stdout.write("\n");
    log.error(`${err.message}`);
    if (err.message.includes("API_KEY_INVALID") || err.message.includes("403")) {
      log.warn("Your GOOGLE_API_KEY might be invalid. Check: https://aistudio.google.com/app/apikey");
    }
    process.exit(1);
  }
}

// ─── Skill handlers ───────────────────────────────────────────────────────────

async function explainRepo() {
  await runSkill("explain-repo", "Explain Repo", async () => {
    const target = await ask("GitHub repo URL or local path to explain:");
    if (!target) return null;

    let repoContext = `Target to analyze: ${target}\n`;
    if (target.includes("github.com")) {
      try {
        const { summary, fileTree, fileContents } = await readGithubRepo(target);
        repoContext += `\n## Repository Info\n${summary}\n\n## File Tree\n${fileTree}\n\n## File Contents\n${fileContents}`;
      } catch (e) {
        log.warn(`Could not fetch GitHub data: ${e.message}`);
        repoContext += "\n(Could not fetch files — provide analysis based on repo URL context)";
      }
    }
    return `${repoContext}\n\nPlease provide a complete repository explanation following your explain-repo skill instructions.`;
  });
}

async function generateInterviewQuestions() {
  await runSkill("generate-interview-questions", "Generate Interview Questions", async () => {
    const target = await ask("GitHub repo URL or local path:");
    const role   = await ask("Target role? (junior / mid-level / senior / all):");
    if (!target) return null;

    let repoContext = `Target: ${target}\nRole focus: ${role || "all levels"}\n`;
    if (target.includes("github.com")) {
      try {
        const { summary, fileTree, fileContents } = await readGithubRepo(target);
        repoContext += `\n## Repository Info\n${summary}\n\n## File Tree\n${fileTree}\n\n## File Contents\n${fileContents}`;
      } catch (e) { log.warn(`Could not fetch GitHub data: ${e.message}`); }
    }
    return `${repoContext}\n\nGenerate codebase-specific interview questions grounded in the actual code above. Follow your generate-interview-questions skill instructions.`;
  });
}

async function suggestImprovements() {
  await runSkill("suggest-improvements", "Suggest Improvements", async () => {
    const target = await ask("GitHub repo URL or local path:");
    const focus  = await ask("Focus area? (security / performance / all):");
    if (!target) return null;

    let repoContext = `Target: ${target}\nFocus: ${focus || "all"}\n`;
    if (target.includes("github.com")) {
      try {
        const { summary, fileTree, fileContents } = await readGithubRepo(target);
        repoContext += `\n## Repository Info\n${summary}\n\n## File Tree\n${fileTree}\n\n## File Contents\n${fileContents}`;
      } catch (e) { log.warn(`Could not fetch GitHub data: ${e.message}`); }
    }
    return `${repoContext}\n\nProvide a prioritized improvement report. Follow your suggest-improvements skill instructions.`;
  });
}

async function explainCode() {
  await runSkill("explain-code", "Explain Code", async () => {
    const target = await ask("GitHub repo URL or local path:");
    const file   = await ask("Specific file to explain (e.g. src/app.py):");
    const level  = await ask("Audience level? (beginner / mid / senior):");
    if (!target) return null;

    let repoContext = `Target: ${target}\nFile to explain: ${file || "main entry file"}\nAudience: ${level || "mid-level"}\n`;
    if (target.includes("github.com") && file) {
      try {
        const match = target.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (match) {
          const raw = await fetch(`https://raw.githubusercontent.com/${match[1]}/${match[2]}/HEAD/${file}`);
          if (raw.ok) repoContext += `\n## File Content\n${await raw.text()}`;
        }
      } catch (e) { log.warn(`Could not fetch file: ${e.message}`); }
    }
    return `${repoContext}\n\nExplain this code following your explain-code skill instructions.`;
  });
}

// ─── Menu ─────────────────────────────────────────────────────────────────────
async function showMenu() {
  console.log(`\n${c.magenta}${c.bold}
   ██████╗ ██████╗ ██████╗ ███████╗██╗     ███████╗███╗   ██╗███████╗
  ██╔════╝██╔═══██╗██╔══██╗██╔════╝██║     ██╔════╝████╗  ██║██╔════╝
  ██║     ██║   ██║██║  ██║█████╗  ██║     █████╗  ██╔██╗ ██║███████╗
  ██║     ██║   ██║██║  ██║██╔══╝  ██║     ██╔══╝  ██║╚██╗██║╚════██║
  ╚██████╗╚██████╔╝██████╔╝███████╗███████╗███████╗██║ ╚████║███████║
   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝
${c.reset}${c.cyan}${c.bold}                    Your GitHub Mentor Agent${c.reset}\n`);

  log.divider();
  console.log(`  ${c.bold}1.${c.reset} 🔍  Explain a repo`);
  console.log(`  ${c.bold}2.${c.reset} ❓  Generate interview questions`);
  console.log(`  ${c.bold}3.${c.reset} 🛠️   Suggest improvements`);
  console.log(`  ${c.bold}4.${c.reset} 💬  Explain specific code`);
  console.log(`  ${c.bold}5.${c.reset} 🚪  Exit`);
  log.divider();

  const choice = await ask("Choose (1-5):");
  switch (choice) {
    case "1": await explainRepo(); break;
    case "2": await generateInterviewQuestions(); break;
    case "3": await suggestImprovements(); break;
    case "4": await explainCode(); break;
    case "5": console.log(`\n${c.cyan}Goodbye! 👋${c.reset}\n`); process.exit(0);
    default:  log.warn("Invalid choice.\n"); await showMenu();
  }
}

// ─── Entry ────────────────────────────────────────────────────────────────────
if (process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_API_KEY;
}

if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  log.warn("No API key found. Run:");
  log.warn("  Windows PowerShell : $env:GOOGLE_API_KEY='AIza...'");
  log.warn("  Mac/Linux          : export GOOGLE_API_KEY=AIza...");
  log.warn("  Get key            : https://aistudio.google.com/app/apikey\n");
  process.exit(1);
}

const args = process.argv.slice(2);
switch (args[0]) {
  case "explain":       await explainRepo(); break;
  case "interview":     await generateInterviewQuestions(); break;
  case "improve":       await suggestImprovements(); break;
  case "explain-code":  await explainCode(); break;
  default:              await showMenu();
}