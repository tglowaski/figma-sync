# Section Renderers

> Complete reference for all available section renderers and how to create custom ones.

## Overview

Section renderers are functions that generate Figma nodes for specific content types. Pages are composed of content sections, each rendered by a registered section renderer.

```
Configuration (JSON)          →  Section Renderers (Code)  →  Generated Wireframe

{ contentSections: [              header-renderer              ┌─────────────────┐
    "header",            →        tabs-renderer         →      │ Header          │
    "tabs",                       table-renderer               │ Tabs            │
    "table"                                                    │ Data Table      │
  ]                                                            └─────────────────┘
}
```

---

## Core Section Renderers

### `header`

Page title and subtitle.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Page Title" | Main heading |
| `subtitle` | string | - | Optional subtitle |

**Example:**
```json
{
  "type": "header",
  "title": "Dashboard",
  "subtitle": "Overview of your projects and metrics"
}
```

### `header-with-action`

Header with an action button on the right.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Page Title" | Main heading |
| `subtitle` | string | - | Optional subtitle |
| `actionLabel` | string | "Action" | Button label |

**Example:**
```json
{
  "type": "header-with-action",
  "title": "Projects",
  "subtitle": "Manage your real estate projects",
  "properties": {
    "actionLabel": "New Project"
  }
}
```

### `back-header`

Header with back button and optional edit button.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Page Title" | Main heading |
| `subtitle` | string | - | Optional subtitle |
| `showEditButton` | boolean | true | Show edit button |

**Example:**
```json
{
  "type": "back-header",
  "title": "Oakwood Apartments",
  "subtitle": "Configure project details",
  "properties": {
    "showEditButton": true
  }
}
```

### `tabs`

Tab navigation component.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tabs` | string[] | ["Tab 1", "Tab 2"] | Tab labels |
| `activeIndex` | number | 0 | Active tab index |

**Example:**
```json
{
  "type": "tabs",
  "properties": {
    "tabs": ["Summary", "Detail", "History"],
    "activeIndex": 0
  }
}
```

### `table`

Generic data table with auto-generated mock data.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `headers` | string[] | ["Column 1", "Column 2", "Column 3"] | Column headers |
| `rowCount` | number | 4 | Number of rows |

**Example:**
```json
{
  "type": "table",
  "properties": {
    "headers": ["Name", "Status", "Amount", "Date"],
    "rowCount": 5
  }
}
```

### `form-card`

Card containing form input fields.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | null | Card title |
| `fields` | array | [...] | Field definitions |

**Field Definition:**
```typescript
{
  name: string;        // Field label
  placeholder?: string; // Placeholder text
  type?: string;       // Field type hint
}
```

**Example:**
```json
{
  "type": "form-card",
  "title": "Project Details",
  "properties": {
    "fields": [
      { "name": "Project Name", "placeholder": "Enter name..." },
      { "name": "Start Date", "placeholder": "Select date...", "type": "date" },
      { "name": "Budget", "placeholder": "$0.00", "type": "currency" }
    ]
  }
}
```

### `metrics`

Row of metric cards.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `metrics` | array | [...] | Metric definitions |

**Metric Definition:**
```typescript
{
  title: string;     // Metric label
  value: string;     // Metric value
  subtitle?: string; // Optional context
}
```

**Example:**
```json
{
  "type": "metrics",
  "properties": {
    "metrics": [
      { "title": "Total Projects", "value": "12", "subtitle": "+2 this month" },
      { "title": "Total Investment", "value": "$4.2M", "subtitle": "Across all projects" },
      { "title": "Average IRR", "value": "18.5%", "subtitle": "Portfolio average" }
    ]
  }
}
```

### `button-row`

Row of action buttons.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `buttons` | array | [...] | Button definitions |
| `alignment` | string | "right" | left, center, right |

**Button Definition:**
```typescript
{
  label: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
}
```

**Example:**
```json
{
  "type": "button-row",
  "properties": {
    "buttons": [
      { "label": "Cancel", "variant": "outline" },
      { "label": "Save Changes", "variant": "default" }
    ],
    "alignment": "right"
  }
}
```

---

## State Section Renderers

### `loading-spinner`

Centered loading spinner with text.

**Properties:** None

**Example:**
```json
{ "type": "loading-spinner" }
```

### `empty-state`

Empty state with icon, message, and CTA button.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "No Items Found" | Heading |
| `message` | string | "Create an item..." | Description |
| `actionLabel` | string | "Create" | Button label |

**Example:**
```json
{
  "type": "empty-state",
  "title": "No Projects Found",
  "properties": {
    "message": "Create a project to get started with waterfall calculations.",
    "actionLabel": "Create Project"
  }
}
```

### `auth-prompt`

Sign in required prompt.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Sign In Required" | Heading |
| `message` | string | "Please sign in..." | Description |
| `actionLabel` | string | "Sign In" | Button label |

**Example:**
```json
{
  "type": "auth-prompt",
  "title": "Authentication Required",
  "properties": {
    "message": "Please sign in to access your projects.",
    "actionLabel": "Sign In"
  }
}
```

### `org-prompt`

Organization selection prompt.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "No Organization" | Heading |
| `message` | string | "Please select..." | Description |
| `actionLabel` | string | "Select Organization" | Button label |

**Example:**
```json
{
  "type": "org-prompt",
  "title": "Select Organization",
  "properties": {
    "message": "Choose an organization to view its projects.",
    "actionLabel": "Select"
  }
}
```

---

## Wizard Section Renderers

### `wizard-progress`

Step progress indicator with circles and lines.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `currentStep` | number | 1 | Current step (1-indexed) |
| `totalSteps` | number | 4 | Total number of steps |
| `stepNames` | string[] | [] | Optional step labels |

**Example:**
```json
{
  "type": "wizard-progress",
  "properties": {
    "currentStep": 2,
    "totalSteps": 4
  }
}
```

### `wizard-navigation`

Back/Skip/Continue button row.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `showBack` | boolean | true | Show back button |
| `showSkip` | boolean | false | Show skip button |
| `nextLabel` | string | "Continue" | Next button label |

**Example:**
```json
{
  "type": "wizard-navigation",
  "properties": {
    "showBack": true,
    "showSkip": false,
    "nextLabel": "Save & Continue"
  }
}
```

### `preview-summary`

Summary card showing key-value pairs.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Preview" | Card title |
| `items` | array | [...] | Summary items |

**Item Definition:**
```typescript
{
  label: string;
  value: string;
}
```

**Example:**
```json
{
  "type": "preview-summary",
  "title": "Review",
  "properties": {
    "items": [
      { "label": "Sale Proceeds", "value": "$5,000,000" },
      { "label": "Sale Date", "value": "Dec 31, 2026" },
      { "label": "Total Entities", "value": "4" }
    ]
  }
}
```

---

## Domain-Specific Renderers

### `project-selector`

Project dropdown with configure button.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `projectName` | string | "Oakwood Apartments" | Selected project |
| `showConfigureButton` | boolean | true | Show configure button |

### `sales-input-card`

Sale proceeds and date input card.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Sale Proceeds" | Card title |

### `contributions-table`

Entity contributions grid.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Capital Contributions" | Card title |
| `headers` | string[] | [...] | Column headers |
| `rowCount` | number | 4 | Number of rows |

### `distributions-table`

Tier distribution breakdown.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Distributions by Tier" | Card title |
| `headers` | string[] | [...] | Column headers |
| `rowCount` | number | 6 | Number of rows |

### `entity-table`

Entity management table with add button.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Entities" | Card title |
| `headers` | string[] | [...] | Column headers |
| `rowCount` | number | 4 | Number of rows |

### `waterfall-tiers-table`

Waterfall tier configuration table.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Waterfall Tiers" | Card title |
| `headers` | string[] | [...] | Column headers |
| `rowCount` | number | 4 | Number of rows |

### `summary-table`

Distribution summary table.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Distribution Summary" | Card title |
| `headers` | string[] | [...] | Column headers |
| `rowCount` | number | 5 | Number of rows |

---

## Additional Renderers

### `breadcrumb`

Breadcrumb navigation.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | string[] | ["Dashboard", "Current"] | Path items |

### `avatar-header`

Header with large avatar.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Profile Settings" | Heading |
| `subtitle` | string | "Manage your account" | Subtitle |

### `chart`

Chart placeholder.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Chart" | Card title |
| `width` | number | 340 | Chart width |
| `height` | number | 280 | Chart height |

### `settings-form`

Settings card with team member table.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Settings" | Card title |

### `dashboard-content`

Combined metrics, table, and chart layout.

**Properties:** None (uses defaults)

---

## Creating Custom Renderers

### Basic Structure

```typescript
// In src/generators/section-renderers.ts

registerRenderer('my-custom-section', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Default Title';
  const customProp = section.properties?.customProp as string || 'default';

  // Create container
  const container = createAutoLayoutFrame('MySection', 'VERTICAL', 24, 16);
  container.resize(frameWidth - 160, 200);
  container.fills = [{ type: 'SOLID', color: colors.card }];
  setStroke(container, colors.border);
  container.cornerRadius = 12;

  // Add title
  if (title) {
    const titleText = createText(title, 18, 'Semi Bold', colors.foreground);
    container.appendChild(titleText);
  }

  // Add custom content
  // ...

  parent.appendChild(container);
});
```

### Helper Functions Available

```typescript
// Frame with auto-layout
createAutoLayoutFrame(name, direction, padding, gap)

// Rectangle with fill and corner radius
createRect(width, height, fill, cornerRadius)

// Text node
createText(content, size, weight, color)

// Card component
createCard(title, width, height, colors)

// Button component
createButton(label, variant, colors)

// Input field with label
createInputField(label, placeholder, width, colors)

// Data table
createTable(headers, rows, width, colors)

// Tab list
createTabs(tabNames, activeIndex, colors)

// Metric card
createMetricCard(title, value, subtitle, colors)

// Add stroke to node
setStroke(node, color, weight)

// Add shadow effect
setShadow(node, type) // 'xs' | 'sm' | 'md' | 'lg'
```

### Example: Kanban Board Section

```typescript
registerRenderer('kanban-board', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Kanban Board';
  const columns = section.properties?.columns as string[] || ['To Do', 'In Progress', 'Done'];

  // Main container
  const board = createAutoLayoutFrame('KanbanBoard', 'VERTICAL', 24, 16);
  board.resize(frameWidth - 160, 400);
  board.fills = [{ type: 'SOLID', color: colors.card }];
  setStroke(board, colors.border);
  board.cornerRadius = 12;

  // Title
  const titleText = createText(title, 18, 'Semi Bold', colors.foreground);
  board.appendChild(titleText);

  // Columns container
  const columnsRow = createAutoLayoutFrame('Columns', 'HORIZONTAL', 0, 16);

  for (const colName of columns) {
    // Column
    const column = createAutoLayoutFrame('Column', 'VERTICAL', 12, 8);
    column.resize(250, 300);
    column.fills = [{ type: 'SOLID', color: colors.muted }];
    column.cornerRadius = 8;

    // Column header
    const colHeader = createText(colName, 14, 'Semi Bold', colors.foreground);
    column.appendChild(colHeader);

    // Sample cards
    for (let i = 0; i < 3; i++) {
      const card = createAutoLayoutFrame('Card', 'VERTICAL', 12, 4);
      card.resize(226, 60);
      card.fills = [{ type: 'SOLID', color: colors.background }];
      card.cornerRadius = 6;
      setShadow(card, 'xs');

      const cardText = createText(`Task ${i + 1}`, 14, 'Regular', colors.foreground);
      card.appendChild(cardText);
      column.appendChild(card);
    }

    columnsRow.appendChild(column);
  }

  board.appendChild(columnsRow);
  parent.appendChild(board);
});
```

### Using Custom Renderer

```json
{
  "name": "Projects / Board View",
  "pagePath": "app/projects/board/page.tsx",
  "pageType": "list",
  "structure": {
    "hasNavigation": true,
    "contentSections": [
      { "type": "header", "title": "Project Board" },
      {
        "type": "kanban-board",
        "title": "Sprint Board",
        "properties": {
          "columns": ["Backlog", "In Progress", "Review", "Done"]
        }
      }
    ]
  }
}
```
