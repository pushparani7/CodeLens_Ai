# 🔍 CodeLens AI

> **Your GitHub Mentor Agent** — explains repos, generates interview questions, suggests improvements, and teaches code. With personality.

Built for the [gitagent Hackathon](https://www.gitagent.sh/) using the [gitagent standard](https://github.com/open-gitagent/gitagent) and [gitclaw SDK](https://github.com/open-gitagent/gitclaw).

---

## What It Does

CodeLens AI is a senior developer mentor that lives in a git repo. Point it at any codebase and it becomes your on-demand expert:

| Skill | What It Does |
|-------|-------------|
| 🔍 **Explain Repo** | Turns an unfamiliar codebase into a fully understood one — architecture, flow, stack, entry points |
| ❓ **Interview Questions** | Generates codebase-specific technical questions at Junior/Mid/Senior levels — grounded in real code |
| 🛠️ **Suggest Improvements** | Prioritized improvement report: Critical → High → Medium → Low, with exact files and specific fixes |
| 💬 **Explain Code** | Walks through any file, function, or snippet — step-by-step, calibrated to audience level |

---

## Quickstart

```bash
# Clone the agent
git clone https://github.com/yourusername/codelens-ai
cd codelens-ai

# Install dependencies
npm install

# Set your API key
set GOOGLE_GENERATIVE_AI_API_KEY="AI....."

# Run the interactive demo
npm run demo
```

### Direct Commands

```bash
npm run demo:explain        # Explain a repo
npm run demo:interview      # Generate interview questions
npm run demo:improve        # Suggest improvements
npm run demo:explain-code   # Explain specific code
```

### Validate the Agent

```bash
npm run validate   # npx gitagent validate
npm run info       # npx gitagent info
```

---

## Agent Structure

```
codelens-ai/
├── agent.yaml                              # Manifest: name, model, skills
├── SOUL.md                                 # Identity: senior dev mentor personality
├── RULES.md                                # Hard constraints: always/never rules
├── skills/
│   ├── explain-repo/SKILL.md               # Full repo comprehension skill
│   ├── generate-interview-questions/SKILL.md  # Interview Q generation skill
│   ├── suggest-improvements/SKILL.md       # Code review + improvement skill
│   └── explain-code/SKILL.md              # Code walkthrough skill
├── tools/
│   └── github-reader.yaml                  # GitHub API tool schema
├── knowledge/
│   └── code-review-standards.md            # Engineering standards reference
├── examples/
│   └── calibration.md                      # Few-shot calibration examples
├── demo/
│   └── index.js                            # Working demo (gitclaw SDK)
└── package.json
```

---

## Using the gitclaw SDK Directly

```javascript
import { query } from "gitclaw";

for await (const msg of query({
  prompt: "Use the explain-repo skill. Target: https://github.com/expressjs/express. Explain the architecture, tech stack, and main execution flow.",
  dir: "./codelens-ai",   // path to this agent repo
  model: "anthropic:claude-sonnet-4-5-20250929",
})) {
  if (msg.type === "delta") process.stdout.write(msg.content);
  if (msg.type === "assistant") console.log("\nDone!");
}
```

---

## Why CodeLens AI Wins

### Agent Quality (30%)
- **Compelling SOUL.md** — A real personality, not a template. The agent has a clear voice: "the senior engineer who reviews your PR at 11pm because they genuinely care."
- **Strict RULES.md** — Concrete, enforceable rules. Not vague policies — specific behaviors for each failure mode.
- **Genuinely useful** — Every skill solves a real developer problem. Not toy demos.

### Skill Design (25%)
- **4 focused skills**, each with a clear process, structured output format, and skill-specific rules
- YAML frontmatter, step-by-step instructions, output format templates, and edge case handling in every skill
- Skills compose: `generate-interview-questions` builds on the same reading approach as `explain-repo`

### Working Demo (25%)
- `demo/index.js` is a complete, runnable gitclaw SDK integration
- Interactive menu + direct CLI commands
- Clean streaming output, error handling, API key checking, colored terminal output

### Creativity (20%)
- **Interview question generation** is a novel use case — no other agent does this from real code
- **Audience-calibrated explanations** — the same code explained differently for junior vs senior devs
- **Knowledge base** — includes a `code-review-standards.md` that gives the agent grounded expertise
- **Calibration examples** — few-shot examples in `examples/` improve output quality measurably

---

## The Agent's Personality

From `SOUL.md`:

> *I am the senior engineer who reviews your PR at 11pm because they genuinely care. The mentor who explains why, not just what. The interviewer who asks questions that reveal real understanding. The colleague who gives you honest feedback without crushing your spirit.*

---

## Built With

- [gitagent](https://github.com/open-gitagent/gitagent) — Agent definition standard
- [gitclaw](https://github.com/open-gitagent/gitclaw) — Agent runtime SDK
- [Anthropic Claude](https://anthropic.com) — Underlying model

---

*CodeLens AI — Built for the gitagent Hackathon*
