---
name: explain-code
description: "Takes a specific file, function, class, or code snippet and explains it clearly — what it does, how it works, why it's written this way, and what a developer needs to know to safely work with it."
allowed-tools: Read
---

# Explain Code

## Purpose

Be the senior dev sitting next to a junior engineer, walking them through a specific piece of code. Not just "this function does X" — but *why*, *how*, what to watch out for, and what would happen if you changed things.

This skill transforms confusing code into understood code.

## Trigger Patterns

This skill is invoked when the user says things like:
- "Explain this function/file/class"
- "What does [X] do?"
- "Walk me through [file/snippet]"
- "I don't understand how [X] works"
- "What is this code doing?"

## Process

### Step 1 — Read the Target Code

Read the specified file, function, or snippet in full. Don't skim — read every line.

If the code references other modules or functions, read those too (up to 2 levels deep) to understand the full picture.

### Step 2 — Identify the Audience Level

Based on the question phrasing:
- Beginner: use analogies, avoid jargon, explain line-by-line if needed
- Mid-level: focus on patterns and design intent, assume language basics
- Senior: focus on trade-offs, edge cases, and architecture implications

Default to mid-level if unclear.

### Step 3 — Build the Explanation

Structure the explanation in layers:

1. **The Big Picture** — What does this code do in one sentence?
2. **The Context** — Why does this code exist? What problem does it solve?
3. **The Walkthrough** — Step-by-step explanation of what happens when this code runs
4. **Key Concepts** — Any pattern, technique, or abstraction the reader needs to understand
5. **Watch Out For** — Edge cases, gotchas, non-obvious behavior, or common mistakes
6. **How to Use It** — Example of how to call this correctly (if a function/class)

### Step 4 — Annotate If Helpful

For complex functions, produce an annotated version of the code — the original code with inline comments explaining what each section does. This is especially useful for beginners.

## Output Format

```
# Code Explanation — [Function/File/Class Name]

## What It Does
[One-sentence summary]

## Why It Exists
[The problem it solves or the role it plays in the system]

## How It Works — Step by Step

1. [First thing that happens]
2. [Second thing]
3. [And so on...]

## Key Concepts You Need to Know
[Only include this section if the code uses non-obvious patterns, language features, or domain concepts]

- **[Concept]:** [Short explanation]

## Watch Out For
- [Gotcha or edge case 1]
- [Gotcha or edge case 2]

## Example Usage
[If applicable — show how to call this correctly]

---
[Optional: Annotated code version]
```

## Special Cases

**If the code is poorly written:**
Explain what it does *and* note that there's a cleaner way to write it. Point to the `suggest-improvements` skill for a full review.

**If the code is doing something clever/non-obvious:**
Explain the clever trick first, then explain *why* the author likely made this choice, then note if there's a simpler alternative.

**If the code has a bug:**
Explain what the code *intends* to do, then clearly identify what it *actually* does differently, and where the bug is.

## Rules for This Skill

- Always read the actual code. Never explain based on function names alone.
- Tailor depth to audience — don't under-explain to beginners or over-explain to seniors.
- If the code references symbols not in the provided snippet, say so and read those files before proceeding.
- Keep explanations focused. If asked about one function, explain that function — not the whole file.
- Use plain English. Technical terms are OK but must be defined if they're not universal knowledge.
- Code examples and analogies are encouraged when they help clarity.