
# Coding Standards

All source code must be written in English

Use camelCase for declaring methods, functions and variables, PascalCase for classes and interfaces, and kebab-case for files and directories

Avoid abbreviations, but also don't write names that are too long (more than 30 characters)

Declare constants to represent magic numbers with readability

Methods and functions should execute a clear and well-defined action, and this should be reflected in their name, which should start with a verb, never a noun

Whenever possible, avoid passing more than 3 parameters, prefer using objects when necessary

Avoid side effects, in general a method or function should either mutate or query, never allow a query to have side effects

Never nest more than two if/else statements, always prefer early returns

Avoid long methods, with more than 50 lines

Avoid long classes, with more than 300 lines

Always invert dependencies for external resources in both use cases and interface adapters using the Dependency Inversion Principle

Avoid blank lines inside methods and functions

Avoid using comments whenever possible

**NEVER** declare more than one variable on the same line

**Never use** icons anywhere

Declare variables as close as possible to where they will be used

**NEVER USE** imports inside classes and methods

**ALWAYS** place imports at the beginning of the file

Prefer composition over inheritance whenever possible