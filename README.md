# Figma Sync

A reusable Figma plugin framework that automatically imports Next.js/React codebases into Figma with design tokens, components, and wireframes.

## Features

- **Design Tokens**: Automatically parse CSS variables and create Figma variables with light/dark mode support
- **Component Library**: Generate a comprehensive UI component library (buttons, inputs, cards, etc.)
- **Page Wireframes**: Create full-page wireframe designs with navigation, forms, tables, and more
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

See `examples/dealapp.config.json` for a complete example.

## Development

### Available Scripts

```bash
npm run build      # Production build (minified)
npm run build:dev  # Development build (with sourcemaps)
npm run watch      # Watch mode for development
npm run typecheck  # TypeScript type checking
npm run clean      # Remove build artifacts
```

### Project Structure

```
figma-sync/
├── manifest.json           # Figma plugin manifest
├── package.json            # Build scripts and dependencies
├── tsconfig.json           # TypeScript configuration
├── src/
│   ├── main.ts             # Entry point with configuration
│   ├── config/
│   │   ├── schema.ts       # Configuration type definitions
│   │   ├── default.config.json
│   │   └── project.config.json
│   ├── parsers/
│   │   ├── token-parser.ts    # CSS variable parsing
│   │   ├── component-parser.ts
│   │   └── page-parser.ts
│   ├── generators/
│   │   ├── variable-generator.ts   # Figma variables
│   │   ├── component-generator.ts  # UI components
│   │   └── wireframe-generator.ts  # Page wireframes
│   ├── utils/
│   │   └── figma-helpers.ts
│   ├── rules/
│   │   └── classification-rules.ts
│   └── mock-data/
│       ├── index.ts
│       ├── generator.ts    # Mock data generation
│       ├── patterns.ts     # Column type detection
│       └── samples.ts      # Sample value pools
├── examples/
│   └── dealapp.config.json # DealApp-specific config
└── dist/
    └── code.js             # Compiled plugin
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

- Auth pages (Login, Sign Up)
- Dashboard
- Loading states
- Empty states
- Settings page
- Profile page
- And more...

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
