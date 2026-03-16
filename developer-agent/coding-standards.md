# Coding Standards

## General

- **No TypeScript** — all files are `.jsx` / `.js`
- **No CSS modules / Tailwind** — plain CSS with class prefixes
- **No comments that narrate** — only comment non-obvious logic
- **Functions over classes** — all components are functional
- **Hooks only** — `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Component | PascalCase `.jsx` | `SkyTasksPanel.jsx` |
| CSS | PascalCase or kebab `.css` | `AgentConfig.css`, `SkyTasks.css` |
| Data/config | kebab `.json` | `agents.json`, `sky-tasks.json` |
| Backend | `server.js` (single file) | — |

## Component Structure

```jsx
import React, { useState, useEffect } from 'react'
import { IconName } from 'lucide-react'

// Constants at top
const MY_COLORS = { ... }

// Helper functions before component
function helperFn(x) { ... }

// Single default export
export default function MyComponent({ prop1, prop2 }) {
  // State
  const [data, setData] = useState([])

  // Effects
  useEffect(() => { ... }, [])

  // Handlers
  const handleClick = () => { ... }

  // Render
  return ( ... )
}
```

## CSS Conventions

- Prefix all classes: `ac-` (AgentConfig), `sky-` (Sky), `td2-` (TicketDetails2), `map-` (graph)
- Use shorthand properties on single line for simple rules
- Group related properties: layout, sizing, colors, typography
- No `!important` unless overriding library styles (React Flow)

```css
/* Single-line for simple rules */
.my-header { display: flex; align-items: center; gap: 12px; padding: 18px 24px; }

/* Multi-line for complex rules */
.my-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  transition: box-shadow 0.15s;
}
```

## Icons

Always use `lucide-react`. Common sizes:
- Sidebar/headers: `size={20}`
- Inline badges: `size={11-14}`
- Buttons: `size={12-13}`

## State Management

- `useState` for local component state
- `localStorage` for persistent config (via `ConfigurationPanel`)
- No Redux/Zustand — keep it simple
- Pass data down via props from `AgentConfig.jsx`

## Data Fetching

```jsx
// Always in useEffect, with .catch fallback
useEffect(() => {
  fetch('/api/endpoint')
    .then(r => r.json())
    .then(setData)
    .catch(() => {})
}, [])
```

## Color Palette (reuse these)

```
Greens:  #f0fdf4  #dcfce7  #86efac  #22c55e  #16a34a  #15803d
Blues:   #eff6ff  #dbeafe  #93c5fd  #3b82f6  #2563eb  #1d4ed8
Purples: #faf5ff  #f5f3ff  #ede9fe  #c4b5fd  #7c3aed  #6d28d9
Reds:    #fef2f2  #fecaca  #f87171  #dc2626
Ambers:  #fffbeb  #fef3c7  #fde68a  #d97706  #b45309
Grays:   #fafafa  #f8fafc  #f1f5f9  #e2e8f0  #cbd5e1  #94a3b8  #64748b  #334155  #1e293b  #0f172a
```
