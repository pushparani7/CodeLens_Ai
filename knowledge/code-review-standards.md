# Code Review Standards Reference

This knowledge file gives CodeLens AI a grounding in what "good code" looks like across common stacks.

## Universal Standards

### Naming
- Variables, functions, and classes should reveal intent. `getUserById` is good. `gub` is not.
- Booleans should read as questions: `isAuthenticated`, `hasPermission`, `canDelete`.
- Avoid mental mapping: `x`, `temp`, `data` force the reader to remember context. Use specific names.

### Functions
- A function should do one thing. If you need "and" to describe it, split it.
- Ideal length: 10–20 lines. Over 50 lines is a warning sign.
- Fewer than 3 parameters is ideal. Over 5 is a problem — use an options object.
- Side effects should be obvious or eliminated.

### Error Handling
- Never swallow errors silently (`catch (e) {}`). Always log or rethrow.
- Fail fast. Validate inputs at the boundary, not deep in the logic.
- Error messages should include context: what happened, where, and with what input.
- User-facing errors must never expose stack traces, SQL, or internal identifiers.

### Security (Top Issues)
- SQL injection: use parameterized queries, never string concatenation.
- XSS: sanitize all user input before rendering. Escape HTML. Use CSP headers.
- Auth: never store plain-text passwords. Use bcrypt, argon2, or scrypt.
- Secrets: never hardcode API keys. Use environment variables. Check `.gitignore`.
- IDOR: always verify the authenticated user owns the resource being accessed.
- Rate limiting: any public endpoint that mutates state needs rate limiting.

### Performance (Common Bottlenecks)
- N+1 queries: fetching related data in a loop. Use eager loading (ORM joins).
- Missing indexes: columns used in WHERE, JOIN, or ORDER BY should be indexed.
- Synchronous I/O in async context: blocking calls in async code kill concurrency.
- Memory leaks: event listeners not removed, closures holding large references.
- Unnecessary re-renders (React/UI): memoize or restructure component tree.

### Testing
- Unit tests: test one unit, one behavior, no external dependencies.
- Integration tests: test that components work together (DB queries, API calls).
- Coverage % is a vanity metric. Test the critical paths, the edge cases, the failure modes.
- Tests should be fast (< 1s each), isolated, and deterministic.

## Language-Specific Notes

### JavaScript / TypeScript
- Prefer `const` over `let`, avoid `var`.
- Use async/await over raw Promises for readability.
- TypeScript: avoid `any`. If you need `any`, you need to think harder.
- Handle Promise rejection. Unhandled rejections crash Node processes.
- Use ESLint + Prettier. Consistent formatting is not optional on a team.

### Python
- Follow PEP 8. Use `black` for formatting.
- Type hints in Python 3.9+: use them. `def get_user(user_id: int) -> User:`
- Use `dataclasses` or `pydantic` for structured data, not plain dicts.
- Context managers (`with`) for resource management — files, DB connections.
- Avoid mutable default arguments: `def func(items=[])` is a classic bug.

### Go
- Errors are values. Always handle them. `if err != nil { return err }` everywhere.
- Goroutines are cheap but leaks are real. Always have an exit path.
- Use the `context` package for cancellation and timeouts.
- `defer` for cleanup. Don't forget it for mutexes and connections.

### Java / Kotlin
- Prefer immutability. `final` fields, value objects.
- Use Optional to signal nullable return values (Java 8+).
- Stream API is powerful but chaining 8 operations is unreadable — break it up.
- JPA lazy loading + serialization = `LazyInitializationException`. Learn it, avoid it.

## Architecture Patterns — When They're Appropriate

| Pattern | Use When | Avoid When |
|---------|----------|------------|
| MVC | Web apps with clear view/data separation | APIs with no UI layer |
| Repository | Multiple data sources, testability needed | Simple CRUD with one DB |
| Service Layer | Complex business logic | Thin CRUD APIs |
| Event-Driven | Decoupled systems, async workflows | Simple request-response |
| Microservices | Scale, team autonomy, isolated deployments | Small teams, early stage |
| Monolith | Speed, simplicity, small teams | High-scale, multiple teams |