# Page Detection Rules

> How to detect pages and their states for wireframe generation.

## Page Sources

### App Router (Next.js 13+)

```
app/
├── page.tsx                    → Home
├── dashboard/
│   └── page.tsx               → Dashboard
├── projects/
│   ├── page.tsx               → Projects
│   └── [id]/
│       ├── page.tsx           → Projects / [id]
│       └── config/
│           └── page.tsx       → Projects / [id] / Config
├── waterfall/
│   └── page.tsx               → Waterfall
├── settings/
│   └── page.tsx               → Settings
└── auth/
    ├── login/
    │   └── page.tsx           → Auth / Login
    └── signup/
        └── page.tsx           → Auth / Sign Up
```

### Pages Router (Legacy)

```
pages/
├── index.tsx                   → Home
├── dashboard.tsx               → Dashboard
├── projects/
│   ├── index.tsx              → Projects
│   └── [id].tsx               → Projects / [id]
└── _app.tsx                   → (excluded)
```

---

## Include/Exclude Rules

### Include

- Files matching `app/**/page.tsx` (App Router)
- Files matching `pages/**/*.tsx` (Pages Router)

### Exclude

| Pattern | Reason |
|---------|--------|
| `app/api/**` | API routes, not pages |
| `**/loading.tsx` | Loading states (detected separately) |
| `**/error.tsx` | Error boundaries |
| `**/layout.tsx` | Layout wrappers |
| `pages/_*.tsx` | Special Next.js files |

---

## Page Type Detection

Page types are inferred from path and content:

| Type | Detection |
|------|-----------|
| `auth` | Path contains `/auth/` |
| `list` | Contains `<Table` component |
| `form` | Contains `<Form` or `useForm` |
| `detail` | Dynamic route (`/[id]/`) |
| `dashboard` | Contains metrics/chart/dashboard |
| `generic` | Default fallback |

### Detection Logic

```typescript
function detectPageType(filePath: string, content: string) {
  if (/\/auth\//.test(filePath)) return 'auth';
  if (/<Table/.test(content)) return 'list';
  if (/<Form|<form|useForm/.test(content)) return 'form';
  if (/\/\[[\w.]+\]\//.test(filePath)) return 'detail';
  if (/metrics|chart|dashboard/i.test(content)) return 'dashboard';
  return 'generic';
}
```

---

## State Detection

### Tab States

Detected from `<TabsContent>` components:

```tsx
<Tabs defaultValue="summary">
  <TabsList>
    <TabsTrigger value="summary">Summary</TabsTrigger>
    <TabsTrigger value="detail">Detail</TabsTrigger>
  </TabsList>
  <TabsContent value="summary">...</TabsContent>
  <TabsContent value="detail">...</TabsContent>
</Tabs>
```

**Detection Pattern:**
```typescript
/<TabsContent\s+value=["'](\w+)["']/g
```

**Generated wireframes:**
- `Page / Summary`
- `Page / Detail`

### Loading States

Detected from conditional loading returns:

```tsx
if (loading) {
  return <LoadingSpinner />;
}

// or
if (authLoading || orgLoading) {
  return <PageLoadingState />;
}
```

**Detection Patterns:**
```typescript
/if\s*\(\s*(?:is)?[Ll]oading\s*\)\s*(?:return|{)/
/authLoading\s*\|\|\s*orgLoading/
```

**Generated wireframe:**
- `Page / Loading`

### Auth States

Detected from user/session checks:

```tsx
if (!user) {
  return <SignInPrompt />;
}

// or
if (!currentOrganization) {
  return <SelectOrgPrompt />;
}
```

**Detection Patterns:**
```typescript
/if\s*\(\s*!user\s*\)/
/if\s*\(\s*!currentOrganization\s*\)/
/if\s*\(\s*!session\s*\)/
```

**Generated wireframes:**
- `Page / Not Signed In`
- `Page / No Organization`

### Empty States

Detected from array length checks:

```tsx
if (projects.length === 0) {
  return <EmptyState />;
}

// or
if (!items || items.length === 0) {
  return <NoResults />;
}
```

**Detection Patterns:**
```typescript
/if\s*\(\s*\w+\.length\s*===?\s*0\s*\)/
/if\s*\(\s*!\w+\s*\|\|\s*\w+\.length\s*===?\s*0\s*\)/
```

**Generated wireframe:**
- `Page / Empty State`

### Error States

Detected from error checks:

```tsx
if (error) {
  return <ErrorState error={error} />;
}
```

**Detection Patterns:**
```typescript
/if\s*\(\s*error\s*\)/
/if\s*\(\s*isError\s*\)/
/<PageErrorState/
```

**Note:** Error states are detected but excluded from wireframe generation by default (can be enabled in config).

### Wizard Steps

Detected from STEPS constant:

```tsx
const STEPS = [
  { id: 'sale_proceeds', label: 'Sale Proceeds' },
  { id: 'contributions', label: 'Contributions' },
  { id: 'review_entities', label: 'Review Entities' },
  { id: 'waterfall_rules', label: 'Waterfall Rules' },
];
```

**Detection Pattern:**
```typescript
/const\s+STEPS?\s*[=:]\s*\[([\s\S]*?)\]/i
```

**Generated wireframes:**
- `Page / Step 1 - Sale Proceeds`
- `Page / Step 2 - Contributions`
- `Page / Step 3 - Review Entities`
- `Page / Step 4 - Waterfall Rules`

---

## Wireframe Name Generation

### From File Path

```typescript
function generateWireframeName(filePath: string, state?: string): string {
  // app/projects/[id]/config/page.tsx
  // → "Projects / [id] / Config"

  const segments = filePath
    .replace(/^.*\/app\//, '')      // Remove prefix
    .replace(/\/page\.tsx$/, '')    // Remove suffix
    .split('/')
    .filter(Boolean)
    .map(segment => {
      if (/^\[[\w.]+\]$/.test(segment)) {
        return segment;  // Keep [id] as-is
      }
      return capitalize(segment.replace(/-/g, ' '));
    });

  let name = segments.join(' / ');
  if (name === '') name = 'Home';
  if (state) name += ' / ' + state;

  return name;
}
```

### Examples

| File Path | Generated Name |
|-----------|----------------|
| `app/page.tsx` | Home |
| `app/dashboard/page.tsx` | Dashboard |
| `app/projects/page.tsx` | Projects |
| `app/projects/[id]/page.tsx` | Projects / [id] |
| `app/projects/[id]/config/page.tsx` | Projects / [id] / Config |
| `app/auth/login/page.tsx` | Auth / Login |
| `app/waterfall/page.tsx` + state "Summary" | Waterfall / Summary |

---

## Structure Detection

### Navigation

```typescript
const hasNavigation = /NavigationBar|<nav|Navbar/.test(content);
```

### Tabs

```typescript
const hasTabs = /<Tabs|TabsContent|TabsList/.test(content);
```

### Table

```typescript
const hasTable = /<Table|TableBody|TableRow/.test(content);
```

### Form

```typescript
const hasForm = /<Form|<form|useForm/.test(content);
```

### Cards

```typescript
const hasCards = /<Card|CardContent|CardHeader/.test(content);
```

### Dynamic Route

```typescript
const isDynamic = /\[[\w.]+\]/.test(filePath);
const routeParams = [...filePath.matchAll(/\[([\w.]+)\]/g)].map(m => m[1]);
```

---

## Content Section Mapping

Based on detected structure, pages are mapped to content sections:

| Structure | Content Sections |
|-----------|------------------|
| Dashboard with metrics | `['header', 'metrics', 'dashboard-content']` |
| List page with tabs | `['header', 'tabs', 'table']` |
| Form page | `['header', 'form-card', 'button-row']` |
| Wizard page | `['wizard-progress', 'header', 'form-card', 'wizard-navigation']` |
| Auth page | `[]` (uses legacy generator) |
| Loading state | `['loading-spinner']` |
| Empty state | `['empty-state']` |
| Auth prompt | `['auth-prompt']` |

---

## Troubleshooting

### Page Not Detected

1. **Check file name**
   - Must be `page.tsx` (App Router)
   - Must be `.tsx` file (Pages Router)

2. **Check location**
   - Must be in `app/` or `pages/` directory
   - Not in `api/` subdirectory

3. **Check exclusions**
   - Not a loading/error file
   - Not a layout file

### States Not Detected

1. **Tab states**
   - Check `<TabsContent value="...">` format
   - Value must be in quotes
   - Must be lowercase identifier

2. **Loading states**
   - Check conditional format
   - Must be early return pattern

3. **Auth states**
   - Check variable names (`user`, `session`, `currentOrganization`)
   - Must be negation check (`!user`)

### Wrong Page Type

Page type is inferred from content. If incorrect:
1. Add explicit page configuration in `page-parser.ts`
2. Or modify content to match expected patterns
