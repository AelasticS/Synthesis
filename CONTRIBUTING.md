# Contributing to Synthesis

Thank you for your interest in contributing to Synthesis! This document provides guidelines for contributing to the project.

## Ways to Contribute

- Report bugs
- Suggest new features or improvements
- Improve documentation
- Add tests
- Submit code contributions
- Create examples
- Improve code quality

## Branch Strategy

| Branch type | Format | Example | Purpose | Lifetime |
|---|---|---|---|---|
| Main | `main` | `main` | Production-ready code | Permanent |
| Develop | `develop` | `develop` | Integration branch | Permanent |
| Feature | `feature/<description>` | `feature/billing-api` | New capabilities | Until merged |
| Bugfix | `bugfix/<description>` | `bugfix/login-timeout` | Non-urgent bug fixes | Until merged |
| Hotfix | `hotfix/<description>` | `hotfix/security-patch` | Production emergencies | Until merged |
| Release | `release/<version>` | `release/v1.2.0` | Release preparation | Until tagged |
| Experimental | `experimental/<description>` | `experimental/new-arch` | Prototypes | Variable |

**Quick decision guide:**
- Fixing a production bug urgently? → `hotfix/`
- Fixing a non-urgent bug? → `bugfix/`
- New feature or enhancement? → `feature/`
- Preparing a release? → `release/`
- Experimental / prototype work? → `experimental/`

**Flow:** `feature/*` → `develop` → `main`

Protected branches (`main` and `develop`) require a Pull Request with at least one review before merging.

## Getting Started

1. **Fork the repository** on [GitHub](https://github.com/AelasticS/Synthesis)
2. **Clone your fork** (replace `YOUR_USERNAME` with your GitHub username):
   ```bash
   git clone https://github.com/YOUR_USERNAME/Synthesis.git
   cd Synthesis
   ```
3. **Install Rush** globally (if not already installed):
   ```bash
   npm install -g @microsoft/rush
   ```
4. **Install dependencies**:
   ```bash
   rush install
   ```
5. **Create a branch** for your changes from `develop`:
   ```bash
   git checkout develop
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Node.js >= 18
- pnpm 10.30.3 (managed by Rush automatically)
- Git
- A code editor (VS Code recommended)

### Building

```bash
# Build all packages
rush build

# Build a specific package
cd libraries/aelastics-result
rushx build
```

### Running Tests

```bash
# Test all packages
rush test

# Test a specific package
cd libraries/aelastics-result
rushx test
```

### Linting

```bash
# Lint all packages
rush lint

# Lint a specific package
cd libraries/aelastics-result
rushx lint
```

## Repository Structure

```
Synthesis/
├── libraries/
│   ├── aelastics-result/   # Result/error handling utilities
│   ├── aelastics-types/    # Type system library
│   └── aelastics-store/    # Observable store (MobX-based)
├── apps/
│   ├── docs/               # Documentation site
│   └── cli/                # CLI application
├── common/                 # Rush shared configuration
└── rush.json               # Rush workspace definition
```

## Code Guidelines

### Style

- Follow the [TypeScript coding guidelines](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines)
- Use ESLint (`@rushstack/eslint-config`) — enforced automatically on build
- Keep functions small and focused
- Write self-documenting code with clear names

### Documentation

- All exported types, functions, and classes must have JSDoc comments
- Comments should clearly describe purpose and usage
- Provide usage examples in JSDoc when appropriate
- Update relevant `README.md` files if adding new features

### Testing

- Write tests for all new code using Jest
- Maintain or improve code coverage
- Tests should be clear and well-named
- Use descriptive `describe`/`it` blocks

Example test structure:

```ts
describe('ServiceResult', () => {
  it('should return success result', () => {
    // Setup
    const result = success(42)

    // Assert
    expect(result.isSuccess).toBe(true)
    expect(result.value).toBe(42)
  })
})
```

## Submitting Changes

### Pull Request Process

1. **Update your branch** with the latest main:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Build and test** to ensure everything passes:
   ```bash
   rush build
   rush test
   ```

3. **Commit your changes** with clear messages (see format below):
   ```bash
   git commit -m "feat(aelastics-types): add functional type support"
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** with:
   - Clear title describing the change
   - Description of what changed and why
   - Reference to related issues (if any)

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Scope should be the package name, e.g. `aelastics-result`, `aelastics-types`, `aelastics-store`.

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `build`: Build system or toolchain changes
- `chore`: Maintenance tasks

Examples:
```
feat(aelastics-store): add undo/redo support
fix(aelastics-types): correct union type inference
docs(aelastics-result): update README with examples
test(aelastics-store): add tests for event log replay
build(aelastics-types): upgrade TypeScript to 5.9
```

## Reporting Issues

### Bug Reports

Include:
- Node.js version (`node --version`)
- Operating system
- Minimal code to reproduce the issue
- Expected behavior
- Actual behavior
- Error messages or stack traces

### Feature Requests

Include:
- Clear description of the feature
- Use case / motivation
- Example of how it would be used
- Any alternative solutions considered

## Questions?

- Open an issue on [GitHub](https://github.com/AelasticS/Synthesis/issues)
- Check existing issues for similar questions

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions
- Keep discussions on-topic

## License

By contributing to Synthesis, you agree that your contributions will be licensed under the Apache License 2.0.

Thank you for contributing!
