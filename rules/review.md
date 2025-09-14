
# Code Review Checklist

## Testing Requirements
- [ ] After executing each task, run tests and ensure they work
  - Commands: `./run-local-tests.sh` or `source venv/bin/activate && pytest`
- [ ] Check code coverage, it must comply with what is determined (minimum 80%)
  - Coverage report is generated automatically by pytest

## Code Quality
- [ ] Check code formatting, if it's following the project rules
  - Verify camelCase for functions/variables, PascalCase for classes
- [ ] Run the linter to check if it's breaking any defined rules
  - Command: `source venv/bin/activate && ruff check .`
- [ ] Run type checker if applicable
  - Command: `source venv/bin/activate && mypy .`

## Code Standards Review
- [ ] Check if any part of the code is breaking any determined best practices
- [ ] Check if there are any orphaned comments left
- [ ] Check if any values are hardcoded (should use environment variables or constants)
- [ ] Check if there are unused imports
- [ ] Check if there are unused variables
- [ ] Look for opportunities to make the code clearer and more objective

## Critical Checks
- [ ] No imports inside classes or methods
- [ ] All imports are at the beginning of the file
- [ ] Methods are under 50 lines
- [ ] Classes are under 300 lines
- [ ] No more than one variable declared per line
- [ ] Prefer early returns over nested if/else

## Final Verification
- [ ] Code follows hexagonal architecture (domain, adapters, routers, services)
- [ ] Business logic stays in domain layer only
- [ ] External dependencies are properly injected
- [ ] Tests cover the new/modified functionality