/**
 * CodeLens AI — gitagent-compatible runner
 *
 * Replicates gitclaw's core behavior:
 *   1. Reads agent.yaml  → metadata
 *   2. Reads SOUL.md     → identity/personality (system prompt layer 1)
 *   3. Reads RULES.md    → constraints (system prompt layer 2)
 *   4. Reads skills/<name>/SKILL.md → active skill instructions (system prompt layer 3)
 *   5. Calls Gemini with the composed system prompt
 *   6. Streams the response
 *
 * This is exactly what gitclaw does internally — we just use Gemini as the model.
 *
 * Usage:
 *   node demo/index.js                  → interactive menu
 *   node demo/index.js explain          → explain a repo
 *   node demo/index.js interview        → generate interview questions
 *   node demo/index.js improve          → suggest improvements
 *   node demo/index.js explain-code     → explain specific code
 *
 * Requires: GOOGLE_API_KEY from https://aistudio.google.com/app/apikey
 */

import fs   from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const AGENT_DIR  = path.resolve(__dirname, "..");
// Models to try in order — auto-detects which one your API key supports
const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-001",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-pro",
  "gemini-1.0-pro",
];

async function detectModel(apiKey) {
  log.info("Detecting available Gemini model for your API key...");
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    const available = (data.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map(m => m.name.replace("models/", ""));
    log.agent(`Available models: ${available.join(", ")}`);

    // Pick first match from our preferred list
    for (const preferred of GEMINI_MODELS) {
      if (available.includes(preferred)) {
        log.success(`Using model: ${preferred}\n`);
        return preferred;
      }
    }
    // Fallback: just use first available that has "gemini" in name
    const fallback = available.find(m => m.includes("gemini")) || available[0];
    log.warn(`Using fallback model: ${fallback}`);
    return fallback;
  } catch (e) {
    log.warn(`Model detection failed: ${e.message}. Defaulting to gemini-1.5-flash.`);
    return "gemini-1.5-flash";
  }
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  cyan: "\x1b[36m", green: "\x1b[32m", yellow: "\x1b[33m",
  red: "\x1b[31m",  magenta: "\x1b[35m", blue: "\x1b[34m",
};
const log = {
  info:    (m) => console.log(`${c.cyan}${c.bold}[CodeLens]${c.reset} ${m}`),
  success: (m) => console.log(`${c.green}✓ ${m}${c.reset}`),
  warn:    (m) => console.log(`${c.yellow}⚠  ${m}${c.reset}`),
  error:   (m) => console.log(`${c.red}✗ ${m}${c.reset}`),
  divider: ()  => console.log(`${c.dim}${"─".repeat(60)}${c.reset}`),
  header:  (m) => console.log(`\n${c.magenta}${c.bold}${"═".repeat(60)}\n  ${m}\n${"═".repeat(60)}${c.reset}\n`),
  agent:   (m) => console.log(`${c.blue}${c.bold}[agent]${c.reset} ${c.dim}${m}${c.reset}`),
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
function startSpinner(msg = "Thinking") {
  const f = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
  let i = 0;
  const t = setInterval(() => process.stdout.write(`\r${c.cyan}${f[i++%f.length]}${c.reset} ${msg}...   `), 80);
  return () => { clearInterval(t); process.stdout.write("\r" + " ".repeat(msg.length + 12) + "\r"); };
}

// ─── Ask ──────────────────────────────────────────────────────────────────────
function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(`${c.yellow}? ${q}${c.reset} `, a => { rl.close(); res(a.trim()); }));
}

// ─── Read agent file ──────────────────────────────────────────────────────────
function readAgentFile(relPath) {
  const full = path.join(AGENT_DIR, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8");
}

// ─── Parse agent.yaml (simple, no deps) ──────────────────────────────────────
function parseAgentYaml() {
  const raw = readAgentFile("agent.yaml") || "";
  const name    = (raw.match(/^name:\s*(.+)$/m)    || [])[1]?.trim() || "codelens-ai";
  const desc    = (raw.match(/^description:\s*"?(.+?)"?$/m) || [])[1]?.trim() || "";
  const version = (raw.match(/^version:\s*(.+)$/m)  || [])[1]?.trim() || "1.0.0";
  const skills  = [...raw.matchAll(/^  - (.+)$/gm)].map(m => m[1].trim());
  return { name, desc, version, skills };
}

// ─── BUILD SYSTEM PROMPT (exactly what gitclaw does) ──────────────────────────
function buildSystemPrompt(skillName) {
  const agent = parseAgentYaml();
  const soul  = readAgentFile("SOUL.md")  || "";
  const rules = readAgentFile("RULES.md") || "";
  const skill = readAgentFile(`skills/${skillName}/SKILL.md`) || "";

  // Log what we're loading — proves agent files are being used
  log.agent(`Loading agent: ${agent.name} v${agent.version}`);
  log.agent(`Reading SOUL.md     (${soul.length} chars)`);
  log.agent(`Reading RULES.md    (${rules.length} chars)`);
  log.agent(`Reading skills/${skillName}/SKILL.md (${skill.length} chars)`);

  // Extract key sections only to save tokens
  const soulSummary  = soul.slice(0, 800);
  const rulesSummary = rules.slice(0, 600);
  const skillFull    = skill.slice(0, 1500);

  const systemPrompt = `You are ${agent.name} — ${agent.desc}

IDENTITY (from SOUL.md):
${soulSummary}

RULES (from RULES.md):
${rulesSummary}

ACTIVE SKILL: ${skillName} (from skills/${skillName}/SKILL.md):
${skillFull}

Always be specific. Read actual repo content. Never hallucinate files or code.`;

  log.agent(`System prompt built: ${systemPrompt.length} chars\n`);
  return systemPrompt;
}

// ─── Fetch GitHub repo content ────────────────────────────────────────────────
async function fetchGithubRepo(repoUrl) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return `Target: ${repoUrl}`;
  const [, owner, repo] = match;

  log.info(`Fetching ${c.bold}${owner}/${repo}${c.reset} from GitHub...`);
  const stop = startSpinner("Reading repository files");

  try {
    const [metaRes, treeRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`,
        { headers: { "User-Agent": "codelens-ai/1.0" } }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
        { headers: { "User-Agent": "codelens-ai/1.0" } }),
    ]);

    const meta = await metaRes.json();
    const tree = await treeRes.json();

    const files = (tree.tree || [])
      .filter(f => f.type === "blob" && f.size < 80000)
      .filter(f => /\.(py|js|ts|md|yaml|yml|json|ipynb|java|go|rb|txt|toml|cfg|env\.example)$/i.test(f.path))
      .slice(0, 30);

    // Prioritise important files
    const priority = ["README","requirements","package.json","setup.py","main","app","index","config"];
    files.sort((a, b) => {
      const aP = priority.findIndex(p => a.path.toLowerCase().includes(p));
      const bP = priority.findIndex(p => b.path.toLowerCase().includes(p));
      return (aP === -1 ? 999 : aP) - (bP === -1 ? 999 : bP);
    });

    stop();
    log.success(`Found ${files.length} files`);

    const readStop = startSpinner("Reading file contents");
    const contents = [];
    for (const f of files.slice(0, 10)) {
      try {
        const r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${f.path}`);
        if (r.ok) contents.push(`\n=== FILE: ${f.path} ===\n${(await r.text()).slice(0, 1500)}`);
      } catch {}
    }
    readStop();

    return `REPOSITORY: ${owner}/${repo}
Description: ${meta.description || "N/A"}
Primary Language: ${meta.language || "N/A"}
Stars: ${meta.stargazers_count || 0}
Topics: ${(meta.topics || []).join(", ") || "N/A"}

FILE TREE:
${files.map(f => f.path).join("\n")}

FILE CONTENTS:
${contents.join("\n")}`;

  } catch (err) {
    stop();
    log.warn(`GitHub fetch failed: ${err.message}`);
    return `Target repository: ${repoUrl} (could not fetch files: ${err.message})`;
  }
}

// ─── Call Gemini (streaming) ──────────────────────────────────────────────────
async function callGemini(systemPrompt, userMessage) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const model  = await detectModel(apiKey);
  const url    = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const stop   = startSpinner("Agent thinking");
  let   firstToken = false;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) {
    stop();
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error ${res.status}`);
  }

  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          if (!firstToken) { stop(); firstToken = true; console.log(); }
          process.stdout.write(text);
        }
      } catch {}
    }
  }

  if (!firstToken) stop();
  console.log("\n");
}

// ─── Run a skill ──────────────────────────────────────────────────────────────
async function runSkill(skillName, label, userMessage) {
  log.header(`CodeLens AI — ${label}`);
  log.divider();
  console.log();

  const systemPrompt = buildSystemPrompt(skillName);
  log.divider();

  try {
    await callGemini(systemPrompt, userMessage);
    log.divider();
    log.success("Done.\n");
  } catch (err) {
    log.error(`${err.message}`);
    if (err.message.includes("not found")) {
      log.warn("Model not available. Try setting a different model in GEMINI_URL.");
    }
    if (err.message.includes("quota") || err.message.includes("429")) {
      log.warn("Quota exceeded. Wait 1 minute and try again.");
    }
    process.exit(1);
  }
}

// ─── Skills ───────────────────────────────────────────────────────────────────

async function explainRepo() {
  const target = await ask("GitHub repo URL or local path:");
  if (!target) return;
  const repoData = target.includes("github.com") ? await fetchGithubRepo(target) : `Local path: ${target}`;
  await runSkill(
    "explain-repo",
    "Explain Repo",
    `Please explain this repository using your explain-repo skill.\n\n${repoData}`
  );
}

async function generateInterviewQuestions() {
  const target = await ask("GitHub repo URL:");
  const role   = await ask("Target level? (junior / mid-level / senior / all):");
  if (!target) return;
  const repoData = target.includes("github.com") ? await fetchGithubRepo(target) : `Local path: ${target}`;
  await runSkill(
    "generate-interview-questions",
    "Generate Interview Questions",
    `Generate interview questions for this repository.\nLevel: ${role || "all"}\n\n${repoData}`
  );
}

async function suggestImprovements() {
  const target = await ask("GitHub repo URL:");
  const focus  = await ask("Focus area? (security / performance / all):");
  if (!target) return;
  const repoData = target.includes("github.com") ? await fetchGithubRepo(target) : `Local path: ${target}`;
  await runSkill(
    "suggest-improvements",
    "Suggest Improvements",
    `Provide a prioritized improvement report for this repository.\nFocus: ${focus || "all"}\n\n${repoData}`
  );
}

async function explainCode() {
  const target = await ask("GitHub repo URL:");
  const file   = await ask("Specific file to explain (e.g. src/app.py):");
  const level  = await ask("Audience level? (beginner / mid / senior):");
  if (!target) return;

  let repoData = `Target: ${target}\nFile: ${file}`;
  if (target.includes("github.com") && file) {
    const match = target.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      try {
        const r = await fetch(`https://raw.githubusercontent.com/${match[1]}/${match[2]}/HEAD/${file}`);
        if (r.ok) repoData += `\n\n=== ${file} ===\n${await r.text()}`;
      } catch {}
    }
  }

  await runSkill(
    "explain-code",
    "Explain Code",
    `Explain the specified file.\nAudience: ${level || "mid-level"}\n\n${repoData}`
  );
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
  log.warn("No API key found.");
  log.warn("  Windows: $env:GOOGLE_API_KEY='AIza...'");
  log.warn("  Mac/Linux: export GOOGLE_API_KEY=AIza...");
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