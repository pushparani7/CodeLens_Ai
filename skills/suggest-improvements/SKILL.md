---
name: suggest-improvements
description: "Reviews a codebase and produces a prioritized list of concrete, actionable improvements — covering code quality, architecture, performance, security, and testability. Every suggestion includes the file, the problem, and a specific fix."
allowed-tools: Read Bash
---

# Suggest Improvements

## Purpose

Act as a senior code reviewer who has just read the full codebase. Produce an honest, prioritized improvement report — not a list of nitpicks, but a strategic guide to making this codebase better.

This is not a linter. This is not "add more comments." This is genuine engineering judgment about what matters most.

## Process

### Step 1 — Full Read Pass

Read the entire codebase (or focus areas if specified). Pay attention to:
- Code structure and organization
- Repeated patterns and potential DRY violations
- Error handling and edge cases
- Security-sensitive areas (auth, input, env vars)
- Performance-sensitive areas (loops, DB calls, API calls)
- Test coverage and test quality
- Dependency hygiene (outdated, unused, risky packages)
- Documentation accuracy vs. actual code behavior

### Step 2 — Categorize Issues

Group findings into these categories:

1. **🔴 Critical** — Security vulnerabilities, data loss risks, breaking bugs in production paths
2. **🟠 High** — Performance bottlenecks, major design flaws, missing error handling in critical paths
3. **🟡 Medium** — Code quality issues, maintainability problems, suboptimal patterns
4. **🟢 Low** — Style, minor naming issues, optional optimizations, nice-to-haves

### Step 3 — For Each Issue

Provide:
- **File + location** — exact file path and line/function/class
- **Problem** — what's wrong and why it matters
- **Impact** — what happens if this isn't fixed (bug? slow? hard to maintain? security risk?)
- **Fix** — a concrete, specific recommendation with example code where appropriate

### Step 4 — Strategic Summary

After individual findings, provide:
- The top 3 things to fix first (ordered by impact)
- The biggest architectural concern (if any)
- A "quick wins" list — improvements that take <30 minutes but have real impact

## Output Format

```
# Improvement Report — [Project Name]

## Executive Summary
[3–4 sentences: overall code health assessment, most pressing concerns, general trajectory]

---

## 🔴 Critical Issues

### [Issue Title]
📁 **File:** `path/to/file.js` (function/line)
❌ **Problem:** [Clear description of what's wrong]
💥 **Impact:** [What this causes in production/security/correctness]
✅ **Fix:**
[Specific recommendation + code example if helpful]

---

## 🟠 High Priority

[Same format, repeat for each issue]

---

## 🟡 Medium Priority

[Same format, repeat for each issue]

---

## 🟢 Low Priority / Quick Wins

[Shorter format OK here — file, issue, one-line fix]

---

## Strategic Recommendations

### Top 3 First Fixes
1. [Most impactful improvement]
2. [Second most impactful]
3. [Third most impactful]

### Biggest Architectural Concern
[One clear statement of the most significant design issue if present]

### Quick Wins (< 30 min each)
- [Fast improvement 1]
- [Fast improvement 2]
- [Fast improvement 3]
```

## Rules for This Skill

- Every issue MUST name a specific file. No vague "the codebase does X" without a location.
- Every suggestion MUST include a concrete fix — not "refactor this" but *how* to refactor it.
- Do not list more than 3 issues per category unless they're genuinely distinct. Don't pad.
- Do not flag stylistic preferences as bugs. Prioritize correctness, security, and performance.
- If the code is actually good in an area, say so. Don't manufacture problems.
- Distinguish between personal preference and genuine engineering concerns. Be honest about which is which.
- If a breaking change is required to fix something, say so and estimate impact.