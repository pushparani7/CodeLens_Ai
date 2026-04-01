---
name: explain-repo
description: "Reads a git repository and produces a clear, structured explanation of what it does, how it's organized, the tech stack, key design decisions, and entry points. Turns unknown repos into understood ones."
allowed-tools: Read Bash
---

# Explain Repo

## Purpose

Produce a comprehensive, human-readable explanation of a repository — suitable for a new developer joining the project, a technical interviewer preparing a review, or anyone needing to quickly understand an unfamiliar codebase.

## Process

### Step 1 — Discover the Repo Structure

Start by reading the top-level directory. List all files and folders.

Then check these files in order (if they exist):
- `README.md` — project description, setup instructions
- `package.json` / `pyproject.toml` / `Cargo.toml` / `pom.xml` — tech stack, dependencies, scripts
- `Dockerfile` or `docker-compose.yml` — deployment and environment context
- `.env.example` — configuration requirements
- Main entry files: `index.js`, `main.py`, `app.py`, `server.js`, `main.go`, `Program.cs`, etc.

### Step 2 — Map the Architecture

Walk through the folder structure and identify:
- **Source directories** (`src/`, `lib/`, `app/`, etc.)
- **Tests** (`test/`, `tests/`, `__tests__/`, `spec/`)
- **Configuration** (`config/`, `.env`, `settings/`)
- **Documentation** (`docs/`, `wiki/`)
- **Assets or static files** (`public/`, `static/`, `assets/`)

For each meaningful folder, read 1–3 key files to understand what lives there.

### Step 3 — Identify the Tech Stack

List:
- Primary language(s)
- Framework(s) (React, FastAPI, Spring, etc.)
- Key libraries and their role
- Database layer (ORM, raw SQL, NoSQL, etc.)
- Testing framework
- Build/bundler tools

### Step 4 — Trace the Main Flow

Identify the entry point and trace what happens when the application runs:
- What starts? (HTTP server, CLI tool, background worker, etc.)
- What are the main modules/components and how do they connect?
- What does a typical request/operation flow look like?

### Step 5 — Surface Key Design Decisions

Note any significant architectural or design choices:
- Patterns used (MVC, event-driven, microservices, etc.)
- State management approach
- Auth strategy (JWT, sessions, OAuth, etc.)
- Error handling patterns
- Notable abstractions or design principles

## Output Format

```
# [Project Name] — Repository Overview

## What It Does
[2–3 sentence plain-English summary]

## Tech Stack
[Bulleted list: language, framework, key libs, database, testing, tooling]

## Project Structure
[Annotated folder tree — each entry with a one-line description]

## How It Works — Main Flow
[Step-by-step trace of the primary execution path]

## Key Design Decisions
[Numbered list of notable choices with brief explanation]

## Entry Points
[Where to start reading: files, functions, or classes a new dev should read first]

## Potential Gotchas
[Non-obvious things a new developer should know before touching the code]
```

## Rules for This Skill

- Always read files before describing them. Never guess at content.
- If the repo is large, prioritize: entry points → core domain logic → API layer → tests.
- If a README exists, don't just paraphrase it — go deeper into the actual code.
- Flag if documentation is missing or misleading compared to actual code behavior.