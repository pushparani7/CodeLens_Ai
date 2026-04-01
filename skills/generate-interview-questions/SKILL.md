---
name: generate-interview-questions
description: "Analyzes a repository and generates targeted, codebase-specific technical interview questions across multiple difficulty levels and roles. Every question is grounded in real code found in the repo — no generic LeetCode questions."
allowed-tools: Read
---

# Generate Interview Questions

## Purpose

Create a tailored interview question bank from a real codebase. Questions test understanding of what's *actually in this repo* — the architecture, patterns, trade-offs, and specific implementation choices — not generic computer science trivia.

These questions are useful for:
- Technical interviewers preparing to assess candidates on this codebase
- Developers preparing for interviews where this stack is used
- Code review preparation and team knowledge-sharing

## Process

### Step 1 — Read and Understand the Repo

Before generating any questions:
1. Run the `explain-repo` skill mentally — understand the architecture, tech stack, and main flows.
2. Identify the 5–8 most important files or modules in the codebase.
3. Note specific patterns, decisions, or code that could be probed in an interview.

### Step 2 — Identify Question-Worthy Areas

Look for:
- **Architecture decisions** — why was this structure chosen?
- **Design patterns** — where are they used, and are they used correctly?
- **Performance considerations** — bottlenecks, N+1 queries, caching
- **Security** — auth, input validation, secret handling
- **Error handling** — how does the app handle failures?
- **Testing strategy** — what's tested, what isn't, and why
- **Tech stack choices** — why this framework, this ORM, this approach?
- **Code quality** — naming, abstractions, DRY violations, complexity
- **Scalability** — would this design handle 10x load?

### Step 3 — Generate Questions by Level

Produce questions at three levels:

**Junior (L1)** — Tests baseline understanding. Can they read and explain this code?
**Mid-level (L2)** — Tests working knowledge. Can they modify and reason about this code?
**Senior (L3)** — Tests design thinking. Can they critique, improve, and own this code?

### Step 4 — Add Ideal Answer Hints

For each question, add a brief "What a good answer looks like" note — this helps the interviewer evaluate responses and helps candidates know what depth is expected.

## Output Format

```
# Interview Question Bank — [Project Name]

## Context
[Brief description of the codebase for interviewer framing]

---

## Junior-Level Questions (L1)

**Q1: [Question grounded in specific code/file]**
📁 Related to: `[filename or module]`
💡 Good answer looks like: [key points to listen for]

[Repeat for 3–5 questions]

---

## Mid-Level Questions (L2)

**Q1: [Question about design/modification/trade-offs]**
📁 Related to: `[filename or module]`
💡 Good answer looks like: [key points to listen for]

[Repeat for 3–5 questions]

---

## Senior-Level Questions (L3)

**Q1: [Question about architecture, ownership, critique]**
📁 Related to: `[filename or module]`
💡 Good answer looks like: [key points to listen for]

[Repeat for 3–5 questions]

---

## Bonus: Scenario Questions
[1–2 open-ended "what would you do if..." questions based on real pain points in this repo]
```

## Rules for This Skill

- Every question MUST reference a real file, function, class, or pattern found in the repo.
- Zero generic questions. "What is a REST API?" is banned. "Why did this project choose REST over GraphQL given its data shape?" is allowed.
- Questions must be open-ended — not trivia. They should require explanation, not just a yes/no answer.
- The ideal answer hints should be 2–4 bullet points, not full paragraphs.
- Flag any areas of the codebase that are particularly question-rich (e.g., complex auth flows, intricate state management).