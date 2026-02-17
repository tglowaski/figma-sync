# Figma Sync

A reusable Figma plugin framework that automatically imports Next.js/React and Salesforce Lightning codebases into Figma with design tokens, components, and wireframes.

## Features

- **Design Tokens**: Automatically parse CSS variables and create Figma variables with light/dark mode support
- **Component Library**: Generate a comprehensive UI component library (buttons, inputs, cards, etc.)
- **Page Wireframes**: Create full-page wireframe designs with navigation, forms, tables, and more
- **Salesforce Support**: Import SLDS design tokens, parse LWC and Aura components, generate SLDS base components
- **Configuration-Driven**: Easily customize for any project via JSON configuration
- **Generic Mock Data**: Intelligent mock data generation based on column headers

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/tglowaski/figma-sync.git
cd figma-sync

# Install dependencies
npm install

# Build the plugin
npm run build
```

### Load in Figma

1. Open Figma Desktop
2. Go to **Plugins** → **Development** → **Import plugin from manifest**
3. Select the `manifest.json` file from this repository
4. The plugin will appear in your Plugins menu

### Run the Plugin

1. Open any Figma file
2. Go to **Plugins** → **Figma Sync**
3. Choose a command:
   - **Sync All**: Run all generation in sequence
   - **Create Variables & Styles**: Parse tokens and create Figma variables
   - **Create Component Library**: Generate UI components
   - **Create Page Wireframes**: Generate full page designs

## Salesforce Lightning Support

The plugin supports Salesforce projects alongside React/Next.js. It extracts SLDS design tokens, parses custom LWC and Aura components, and generates SLDS base components in Figma.

### How It Works

Figma plugins run sandboxed with no filesystem access. A **prebuild script** runs at build time to read your Salesforce source files and embed them into the plugin bundle:

```
Build Time (Node.js):                    Runtime (Figma sandbox):
  prebuild-salesforce.ts                   main.ts
  ├── Reads SLDS CSS from npm package      ├── Parses embedded SLDS tokens
  ├── Scans force-app/.../lwc/             ├── Parses LWC @api → variants
  ├── Scans force-app/.../aura/            ├── Parses Aura attributes → variants
  └── Writes src/generated/*.ts            ├── Collects lightning-* base refs
                                           └── Generates Figma components
```

### Quick Start (Salesforce)

```bash
npm install

# Build for Salesforce (prebuild + bundle)
npm run build:salesforce:dev
```

The prebuild script automatically detects your Salesforce DX project if it's a sibling directory with a `sfdx-project.json` file. It uses the standard SFDX folder structure (`force-app/main/default/lwc/` and `force-app/main/default/aura/`) — no configuration required.

### What Gets Generated

**Variables (SLDS Design Tokens):**
- Color palette with light/dark modes (Salesforce brand blue, success green, error red, etc.)
- SLDS spacing scale (xxx-small through xxx-large)
- Border radius values
- Typography scale (Salesforce font sizes)
- Component sizes

**Components:**
- Custom LWC components with `@api` properties extracted as variant combinations
- Custom Aura components with `<aura:attribute>` extracted as variants
- SLDS base components (`lightning-button`, `lightning-input`, `lightning-card`, etc.) — only generated for components actually referenced by your custom code

**Not generated:** Wireframes are skipped in Salesforce mode (React-only feature).

### Salesforce Build Scripts

```bash
npm run prebuild:salesforce     # Just regenerate src/generated/ from Salesforce sources
npm run build:salesforce        # Full production build (prebuild + minified bundle)
npm run build:salesforce:dev    # Development build (prebuild + sourcemaps)
```

### Custom Configuration (Optional)

Auto-detection works for standard SFDX layouts. For non-standard setups, create `src/config/project.config.json`:

```json
{
  "salesforce": {
    "projectPath": "../MyOtherSalesforceProject",
    "packageDirectory": "force-app/main/default",
    "includeAura": true,
    "excludeComponents": ["internalDebugPanel"]
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `projectPath` | Auto-detected sibling | Path to the SFDX project root |
| `packageDirectory` | `force-app/main/default` | Package directory within the project |
| `includeAura` | `true` | Whether to include Aura components |
| `excludeComponents` | `[]` | Component names to exclude from generation |

### Switching Between React and Salesforce

The framework mode is set in `src/main.ts`:

```typescript
const USER_CONFIG: Partial<PluginConfig> = {
  framework: 'salesforce'  // or 'react' (default)
};
```

Both `npm run build` (React) and `npm run build:salesforce` (Salesforce) work independently — existing React functionality is unchanged.

### Supported SLDS Base Components

The following base components are recognized when referenced by your custom LWC/Aura code:

| Component | Variants |
|-----------|----------|
| `lightning-button` | neutral, brand, destructive, inverse, success × small, medium |
| `lightning-button-icon` | bare, container, brand, border, border-filled × 5 sizes |
| `lightning-input` | text, number, email, password, search, tel, checkbox, toggle × 4 label variants |
| `lightning-card` | base, narrow |
| `lightning-badge` | default, inverse, lightest, success, warning, error |
| `lightning-icon` | 5 sizes × default, inverse, warning, error, success |
| `lightning-datatable` | comfy, compact |
| `lightning-combobox` | standard, label-hidden, label-inline, label-stacked |
| `lightning-textarea` | standard, label-hidden |
| `lightning-tabset` | default, scoped, vertical |
| `lightning-modal` | small, medium, large, full |
| `lightning-spinner` | small, medium, large × base, brand, inverse |
| `lightning-progress-bar` | small, medium, large × base, circular |
| `lightning-accordion` | default, multiple |
| `lightning-checkbox-group` | standard, label-hidden |
| `lightning-radio-group` | standard, label-hidden |
| `lightning-breadcrumbs` | (no variants) |
| `lightning-tree` | default, bare |

---

## Configuration

The plugin is configuration-driven. Modify `src/main.ts` to customize for your project:

```typescript
const USER_CONFIG: Partial<PluginConfig> = {
  name: 'MyApp',
  prefix: 'MyApp',
  branding: {
    logoText: 'MyApp',
    tagline: 'Your app description',
  },
  navItems: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Projects', path: '/projects' },
    { label: 'Settings', path: '/settings' }
  ]
};
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | Project name (used in UI) |
| `prefix` | string | Variable prefix for Figma collections |
| `frameWidth` | number | Wireframe width (default: 1440) |
| `frameHeight` | number | Wireframe height (default: 900) |
| `spacing` | number | Grid spacing between frames (default: 100) |
| `columns` | number | Grid columns (default: 3) |
| `branding.logoText` | string | Text displayed next to logo icon |
| `branding.tagline` | string | Optional tagline |
| `navItems` | array | Navigation items for nav bar |
| `pages` | array | Custom wireframe page configurations |

### Example Configurations

See `src/parsers/page-parser.ts` for page configuration examples.

## Development

### Watch Mode

For development, use watch mode which automatically rebuilds on file changes:

```bash
npm run watch
```

Then press **Cmd+Opt+P** in Figma to rerun the plugin with your changes.

### Available Scripts

```bash
npm run watch                # Watch mode - auto-rebuild on changes
npm run build                # Production build (minified)
npm run build:dev            # Development build (with sourcemaps)
npm run build:salesforce     # Salesforce production build (prebuild + minified)
npm run build:salesforce:dev # Salesforce dev build (prebuild + sourcemaps)
npm run prebuild:salesforce  # Regenerate src/generated/ from Salesforce sources
npm run typecheck            # TypeScript type checking
npm run clean                # Remove build artifacts
```

### Project Structure

```
figma-sync/
├── manifest.json           # Figma plugin manifest
├── package.json            # Build scripts and dependencies
├── tsconfig.json           # TypeScript configuration
├── scripts/
│   ├── build.mjs           # esbuild JS API wrapper
│   └── prebuild-salesforce.ts  # Salesforce source preprocessor
├── src/
│   ├── main.ts             # Entry point with configuration
│   ├── config/
│   │   └── schema.ts       # Configuration type definitions
│   ├── parsers/
│   │   ├── token-parser.ts        # CSS variable parsing (React)
│   │   ├── slds-token-parser.ts   # SLDS token parsing (Salesforce)
│   │   ├── component-parser.ts    # React component parsing
│   │   ├── lwc-parser.ts          # LWC component parsing
│   │   ├── aura-parser.ts         # Aura component parsing
│   │   ├── slds-base-components.ts # SLDS base component catalog
│   │   └── page-parser.ts         # Page configurations
│   ├── generators/
│   │   ├── variable-generator.ts   # Figma variables
│   │   ├── component-generator.ts  # UI components (React + SLDS)
│   │   ├── wireframe-generator.ts  # Page wireframes
│   │   └── section-renderers.ts    # Section renderer registry
│   ├── generated/              # Build-time artifacts (gitignored)
│   │   ├── slds-tokens.ts     # Embedded SLDS CSS
│   │   ├── lwc-components.ts  # Embedded LWC source data
│   │   └── aura-components.ts # Embedded Aura source data
│   ├── utils/
│   │   └── figma-helpers.ts
│   ├── rules/
│   │   └── classification-rules.ts
│   └── mock-data/
│       ├── index.ts
│       ├── generator.ts    # Mock data generation
│       ├── patterns.ts     # Column type detection
│       └── samples.ts      # Sample value pools
└── dist/
    └── code.js             # Compiled plugin
```

## Configuration-Driven Wireframes

The wireframe generator uses a **section renderer registry** that allows pages to be composed via configuration instead of hardcoded functions.

### How It Works

```
Configuration (JSON)          →  Section Renderers (Code)  →  Generated Wireframe

{ contentSections: [              header-renderer              ┌─────────────────┐
    "header",            →        tabs-renderer         →      │ Header          │
    "tabs",                       table-renderer               │ Tabs            │
    "table"                                                    │ Data Table      │
  ]                                                            └─────────────────┘
}
```

### Defining Pages with Content Sections

Pages can be defined in `src/parsers/page-parser.ts` using content sections:

```typescript
{
  name: 'Orders / List',
  pagePath: 'app/orders/page.tsx',
  state: 'List',
  pageType: 'list',
  structure: {
    hasNavigation: true,
    contentSections: [
      { type: 'header', title: 'Orders', subtitle: 'Manage customer orders' },
      { type: 'tabs', properties: { tabs: ['All', 'Pending', 'Completed'], activeIndex: 0 } },
      { type: 'table', properties: { headers: ['Order ID', 'Customer', 'Status', 'Total'], rowCount: 5 } }
    ]
  }
}
```

### Available Section Renderers

| Section Type | Description | Properties |
|--------------|-------------|------------|
| `header` | Page title + subtitle | `title`, `subtitle` |
| `header-with-action` | Header with action button | `title`, `subtitle`, `actionLabel` |
| `back-header` | Header with back button | `title`, `subtitle`, `showEditButton` |
| `tabs` | Tab list component | `tabs: string[]`, `activeIndex: number` |
| `table` | Generic data table | `headers: string[]`, `rowCount: number` |
| `form-card` | Card with form fields | `title`, `fields: [{name, placeholder}]` |
| `metrics` | Row of metric cards | `metrics: [{title, value, subtitle}]` |
| `button-row` | Action buttons | `buttons: [{label, variant}]`, `alignment` |
| `loading-spinner` | Centered spinner | - |
| `empty-state` | Empty state with CTA | `title`, `message`, `actionLabel` |
| `auth-prompt` | Sign in prompt | `title`, `message`, `actionLabel` |
| `org-prompt` | Organization prompt | `title`, `message`, `actionLabel` |

**Wizard Renderers:**

| Section Type | Description | Properties |
|--------------|-------------|------------|
| `wizard-progress` | Step progress indicator | `currentStep`, `totalSteps` |
| `wizard-navigation` | Back/Skip/Continue buttons | `showBack`, `showSkip`, `nextLabel` |
| `preview-summary` | Summary card | `title`, `items: [{label, value}]` |

**Additional Renderers:**

| Section Type | Description | Properties |
|--------------|-------------|------------|
| `summary-table` | Results summary table | `title`, `headers`, `rowCount` |
| `breadcrumb` | Breadcrumb navigation | `items: string[]` |
| `avatar-header` | Header with avatar | `title`, `subtitle` |
| `chart` | Chart placeholder | `title`, `width`, `height` |
| `settings-form` | Settings card with table | `title` |
| `dashboard-content` | Metrics + table + chart | - |

You can also create domain-specific renderers for your app (see `section-renderers.ts` for examples).

### Adding Custom Renderers

Register new renderers in `src/generators/section-renderers.ts`:

```typescript
registerRenderer('my-custom-section', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Default Title';

  // Create your Figma nodes...
  const card = createCard(title, frameWidth - 160, 200, colors);
  parent.appendChild(card);
});
```

## Using as Git Submodule

To use this plugin in another project:

```bash
# Add as submodule
git submodule add git@github.com:tglowaski/figma-sync.git figma-plugin

# Clone project with submodule
git clone --recurse-submodules <your-project-repo>

# Update submodule to latest
cd figma-plugin
git pull origin main
cd ..
git add figma-plugin
git commit -m "Update figma-sync submodule"
```

## Generated Assets

### Variables & Styles

- **Color Variables**: Full color palette with light/dark modes
- **Spacing Variables**: Consistent spacing scale
- **Radius Variables**: Border radius values
- **Typography Variables**: Font sizes and line heights
- **Component Sizes**: Standard component dimensions
- **Text Styles**: Heading, body, and label styles
- **Effect Styles**: Shadow presets

### Components

- Buttons (6 variants × 4 sizes)
- Inputs (4 states)
- Badges (4 variants)
- Cards
- Checkboxes
- Switches
- Avatars (4 sizes)
- Alerts (2 variants)
- Navigation Bar

### Wireframes

Default wireframes include common page patterns:

**Auth & Core:**
- Auth / Login, Auth / Sign Up
- Dashboard
- Settings, Profile

**States:**
- Loading spinner
- Not signed in prompt
- No organization prompt
- Empty state

**Configuration Pages:**
- Tabbed config views (Details, Lists, Settings)
- Form-based configuration

**Wizard Pages:**
- Multi-step setup flows with progress indicator

Customize pages in `src/parsers/page-parser.ts` using content sections.

## Mock Data System

The plugin includes an intelligent mock data generator that automatically infers data types from column headers:

```typescript
const rows = generateMockRows(['Name', 'Status', 'Amount', 'Date']);
// Returns realistic data based on column names
```

Supported column types: name, person, email, phone, status, category, currency, percentage, date, number, and more.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run typecheck` and `npm run build`
5. Submit a pull request

## License

Private - All rights reserved.

---

## Claude Code Integration (Optional)

If you use [Claude Code](https://claude.ai/code), this plugin includes optional skills
to help with configuration and customization.

### Install Skills

```bash
cd figma-plugin
npm run setup-claude
```

This copies the `figma-sync` skill and `figma-design-system` agent to your project.
If Claude Code isn't detected, the script exits cleanly with setup instructions.

### What You Get

- **`figma-sync` skill** - Helps generate `project.config.json` by analyzing your codebase
- **`figma-design-system` agent** - Specialized assistant for design system tasks

### Usage Examples

```
# Ask Claude to generate a config
"Generate a Figma Sync config for my Next.js project"

# Get help with custom sections
"How do I create a custom section renderer for a Kanban board?"

# Debug token issues
"My colors aren't being imported correctly from globals.css"

# Add new page wireframes
"Add wireframe configurations for the new checkout flow"
```

### Skill Documentation

After installation, documentation is available at:

- `.claude/skills/figma-sync/SKILL.md` - Configuration reference
- `.claude/skills/figma-sync/AGENTS.md` - Agent integration guide
- `.claude/skills/figma-sync/rules/` - Detailed detection rules

### Manual Installation

If the setup script doesn't work, you can manually copy:

```bash
# From figma-plugin directory
cp -r .claude/skills/figma-sync ../.claude/skills/
cp -r .claude/agents ../.claude/
```
