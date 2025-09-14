# Code Validation Checklist

Before writing or modifying ANY code, Claude must verify:

## ✅ Pre-Code Checklist
- [ ] Read @.claude/rules/code-standards.md 
- [ ] All imports are at the beginning of the file
- [ ] No imports inside classes or methods
- [ ] Variable/function names use camelCase
- [ ] Class names use PascalCase
- [ ] Only one variable declared per line
- [ ] Methods are under 50 lines
- [ ] Classes are under 300 lines
- [ ] Use early returns instead of nested if/else
- [ ] Variables declared close to where they're used

## ✅ Post-Code Checklist
- [ ] Follow ALL steps in @.claude/rules/review.md
- [ ] Run `source venv/bin/activate && ruff check .` for linting
- [ ] Run `source venv/bin/activate && mypy .` for type checking (if applicable)
- [ ] Run `./run-local-tests.sh` to ensure tests pass
- [ ] Check code coverage is above minimum threshold (80%)
- [ ] Verify no coding standards were violated
- [ ] Remove any hardcoded values
- [ ] Clean up unused imports/variables

## 🚨 Critical Violations (Must Fix Immediately)
- Imports inside methods/classes
- Multiple variables on same line
- Methods over 50 lines without justification
- Classes over 300 lines without justification
- Icons or emojis in code (unless explicitly requested)