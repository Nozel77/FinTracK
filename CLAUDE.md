@AGENTS.md
# RTK & Development Guidelines

This file provides instructions for AI agents operating in this repository.

## Terminal & Token Optimization
- **Mandatory RTK Usage**: Always prefix terminal commands with `rtk` to filter output and save context tokens.
  - Good: `rtk git status`, `rtk cargo test`, `rtk npm test`, `rtk pytest`
  - Bad: `git status`, `npm test`
- **File Reading**: Use `rtk read <file_path>` for large files to get a compressed, context-efficient version of the code.
- **Project Structure**: Use `rtk ls -R` to understand the directory tree efficiently.

## Technical Stack & Environment
- **OS**: Windows (PowerShell/CMD).
- **Backend**: Python (FastAPI), MongoDB.
- **Frontend**: Next.js, Tailwind CSS, TypeScript.
- **Editor**: Zed Editor (High-performance mode).

## Code Style & Standards
- Follow PEP 8 for Python code.
- Use functional components and hooks for React/Next.js.
- Ensure Tailwind CSS classes follow a logical order.
- Maintain consistency with existing naming conventions in the project.

## Workflow Commands
- **Check Status**: `rtk git status`
- **Install Deps**: `rtk deps`
- **View Savings**: `rtk gain`
- **Project Context**: Use Context7 MCP to locate specific files before performing edits.

---
*Note: This project uses RTK (Rust Token Killer) to maximize AI reasoning efficiency by reducing CLI noise.*