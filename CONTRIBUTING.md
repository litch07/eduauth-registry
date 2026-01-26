# Contributing to EduAuth Registry

First off, thank you for considering contributing to EduAuth Registry! 

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, Node version, browser)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case explanation**
- **Why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing style
5. Write a clear commit message

## Development Process

1. **Setup Development Environment**
```bash
   git clone https://github.com/YOUR-USERNAME/eduauth-registry.git
   cd eduauth-registry
   cd backend && npm install
   cd ../frontend && npm install
```

2. **Create a Branch**
```bash
   git checkout -b feature/your-feature-name
```

3. **Make Changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test Your Changes**
   - Test manually
   - Check for console errors
   - Verify database changes

5. **Commit**
```bash
   git add .
   git commit -m "feat: add amazing feature"
```

6. **Push and Create PR**
```bash
   git push origin feature/your-feature-name
```

## Code Style

### JavaScript
- Use ES6+ features
- Use arrow functions for components
- Use async/await (no callbacks)
- Use meaningful variable names
- Add JSDoc comments for functions

### React
- Functional components only
- Use hooks appropriately
- One component per file
- PascalCase for components

### Backend
- Always use parameterized queries
- Add try-catch blocks
- Validate all inputs
- Add error handling

### Git Commit Messages
- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Limit first line to 72 characters
- Reference issues and PRs

Examples:
```
feat: add email notification system
fix: resolve duplicate serial number bug
docs: update installation instructions
style: format code with prettier
refactor: simplify certificate controller
test: add unit tests for serial generator
```

## Project Structure

Please maintain the existing structure:
- Backend controllers in `backend/src/controllers/`
- Frontend pages in `frontend/src/pages/`
- Components in `frontend/src/components/`
- Routes in respective routes files

## Questions?

Feel free to open an issue for questions or discussion!
