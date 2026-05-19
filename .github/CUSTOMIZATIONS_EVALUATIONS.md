# Chat Customizations Evaluations Guide

This repository uses three customization file types.

| Pattern | Type |
|---|---|
| `*.prompt.md` | Prompt |
| `*.agent.md` | Agent |
| `*.instructions.md` | Instructions |

## Recommended locations

- Prompt files: `.github/prompts/`
- Agent files: `.github/agents/`
- Instructions files: `.github/instructions/`

## Local validation

- List and classify files:

```bash
pnpm customizations:list
```

- Enforce strict checks (non-zero exit code on issues):

```bash
pnpm customizations:check
```

Strict checks include:

- File location matches type (`prompts`, `agents`, `instructions`)
- Suspicious markdown file names that look like customization files but do not use the required suffix

## Best-use workflow

1. Create customization files with the exact suffix for their type.
2. Place files in the matching `.github/` folder.
3. Run `pnpm customizations:check` before opening a PR.
4. Use VS Code Problems panel with Chat Customizations Evaluations extension enabled for in-editor diagnostics.
