# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Salesforce DX project** (`FigmaSalesforceTest`) that lives as a subdirectory inside a parent **Figma Sync plugin** repository. The two projects serve different purposes:

- **This directory** (`FigmaSalesforceTest/`): A Salesforce DX project with LWC components, Apex classes, Aura components, and org metadata. Connected to the `figmasync` Salesforce org.
- **Parent directory** (`../`): A Figma plugin built with TypeScript/esbuild that generates design systems from React/Next.js codebases.

## Salesforce DX Commands

```bash
# Lint LWC and Aura JavaScript
npm run lint

# Run LWC Jest tests
npm test                    # or: npm run test:unit
npm run test:unit:watch     # watch mode
npm run test:unit:debug     # debug mode
npm run test:unit:coverage  # with coverage

# Format all source files
npm run prettier
npm run prettier:verify     # check only

# Deploy to org
sf project deploy start --target-org figmasync

# Retrieve from org
sf project retrieve start --target-org figmasync

# Open the org in browser
sf org open --target-org figmasync
```

## Figma Plugin Commands (run from parent `../` directory)

```bash
# Build plugin
npm run build          # production (minified)
npm run build:dev      # development (with sourcemaps)
npm run watch          # auto-rebuild on changes

# Type check and lint
npm run typecheck
npm run lint
```

## Salesforce Project Structure

- `force-app/` — Default package directory for all Salesforce metadata (LWC, Apex, Aura, etc.)
- `manifest/package.xml` — Metadata types included in deployments (ApexClass, LWC, Aura, StaticResource, etc.)
- `config/project-scratch-def.json` — Scratch org definition (Developer edition)
- `sfdx-project.json` — Project config; API version 65.0, org alias `FigmaSalesforceTest`
- `scripts/apex/` — Anonymous Apex scripts
- `scripts/soql/` — SOQL query files

## Figma Plugin Architecture (parent `../src/`)

The plugin uses a **configuration-driven pipeline** with three generation stages:

1. **Variables** — `token-parser.ts` extracts CSS custom properties (oklch/hsl/rgb/hex) → `variable-generator.ts` creates Figma variable collections with light/dark modes
2. **Components** — `component-parser.ts` analyzes React components for CVA variants → `component-generator.ts` creates Figma component nodes
3. **Wireframes** — `page-parser.ts` defines page layouts → `wireframe-generator.ts` + `section-renderers.ts` compose pages from a registry of section renderer functions

Key patterns:
- **Registry pattern** in `section-renderers.ts`: renderers are registered by type string and looked up at render time; extend by calling `registerRenderer(type, fn)`
- **Config merging**: user config in `src/config/project.config.json` is merged over `DEFAULT_CONFIG` from `schema.ts` via `mergeConfig()`
- **No filesystem access**: CSS tokens are embedded at build time in `main.ts` since Figma plugins run sandboxed
- **Entry point**: `src/main.ts` handles 5 Figma menu commands: `syncAll`, `createVariables`, `createComponents`, `createWireframes`, `loadConfig`

## Code Quality

- **Pre-commit hook** (husky): runs `lint-staged` which applies prettier and eslint to staged files, and runs related LWC Jest tests
- **Prettier**: configured with `prettier-plugin-apex` and `@prettier/plugin-xml`; LWC HTML uses the `lwc` parser
- **ESLint**: flat config (`eslint.config.js`) with separate rule sets for Aura, LWC, LWC tests, and Jest mocks

## MCP Server

A Salesforce MCP server is configured in `.claude/claude_config.json` using `@salesforce/mcp@latest` with org alias `figmasync` and all toolsets enabled. This provides Salesforce CLI operations directly through Claude Code.
