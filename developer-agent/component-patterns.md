# Component Patterns Reference

## Panel Component (full-page view)

```jsx
import React, { useState, useEffect, useMemo } from 'react'
import { Search, Filter, AlertTriangle } from 'lucide-react'

export default function MyPanel() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/my-endpoint')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  const filtered = useMemo(() =>
    data.filter(d => d.name.toLowerCase().includes(search.toLowerCase())),
    [data, search]
  )

  return (
    <div className="my-panel">
      <div className="my-panel-header">
        <h2><AlertTriangle size={20} /> My Panel</h2>
        <span className="my-panel-count">{filtered.length} items</span>
      </div>
      <div className="my-panel-toolbar">
        <div className="my-panel-search">
          <Search size={15} />
          <input
            type="text" placeholder="Search..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="my-panel-body">
        {/* content */}
      </div>
    </div>
  )
}
```

## Dialog / Drawer Pattern

Used for editing (slide-in from right):

```jsx
{showDrawer && (
  <div className="my-overlay" onClick={() => setShowDrawer(false)}>
    <div className="my-drawer" onClick={e => e.stopPropagation()}>
      <div className="my-drawer-header">
        <h3>Edit Item</h3>
        <button onClick={() => setShowDrawer(false)}><X size={18} /></button>
      </div>
      <div className="my-drawer-body">
        {/* form/content */}
      </div>
    </div>
  </div>
)}
```

CSS for drawers:

```css
.my-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.25); z-index: 1000; display: flex; justify-content: flex-end; }
.my-drawer { width: 520px; max-width: 90vw; background: #fff; height: 100%; box-shadow: -8px 0 30px rgba(0,0,0,0.12); display: flex; flex-direction: column; animation: slide-in 0.2s ease; }
@keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
```

## Table Pattern

```jsx
<table className="my-table">
  <thead>
    <tr>
      <th style={{ width: 80 }}>ID</th>
      <th style={{ width: 200 }}>Name</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    {items.map(item => (
      <tr key={item.id} className="my-row" onClick={() => onSelect(item)}>
        <td>#{item.id}</td>
        <td>{item.name}</td>
        <td><span className="my-badge" style={{ background: statusBg, color: statusColor }}>{item.status}</span></td>
      </tr>
    ))}
  </tbody>
</table>
```

## Card Grid Pattern

```jsx
<div className="my-cards">
  {items.map(item => (
    <div key={item.id} className="my-card">
      <div className="my-card-header">
        <h3>{item.name}</h3>
        <span className="my-card-badge">{item.type}</span>
      </div>
      <p className="my-card-desc">{item.description}</p>
      <div className="my-card-footer">
        <span className="my-card-meta">{item.meta}</span>
      </div>
    </div>
  ))}
</div>
```

## Status Colors (reuse these)

```js
const PRIORITY_COLORS = {
  CRITICAL: { bg: '#fef2f2', color: '#dc2626' },
  HIGH:     { bg: '#fff7ed', color: '#ea580c' },
  MEDIUM:   { bg: '#fefce8', color: '#ca8a04' },
  LOW:      { bg: '#f0fdf4', color: '#16a34a' },
}

const STATUS_COLORS = {
  'IN PROGRESS': { bg: '#dbeafe', color: '#1d4ed8' },
  'OPEN':        { bg: '#f0fdf4', color: '#16a34a' },
  'DONE':        { bg: '#f1f5f9', color: '#64748b' },
}
```

## React Flow Node Pattern (TicketDetails2 style)

```jsx
import { ReactFlow, Background, MiniMap, Handle, Position, BaseEdge,
  useNodesState, useEdgesState, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

function MyNode({ data }) {
  return (
    <div className="my-flow-node">
      <Handle type="target" position={Position.Top} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const nodeTypes = { myNode: MyNode }

// In component:
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

<ReactFlow
  nodes={nodes} edges={edges}
  onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
  nodeTypes={nodeTypes}
  fitView proOptions={{ hideAttribution: true }}
  nodesDraggable={false} nodesConnectable={false}
>
  <Background color="#e2e8f0" gap={20} size={1} />
</ReactFlow>
```

## Sidebar Item Properties

```js
// Section header (not clickable)
{ icon: Bot, label: 'Section Name', highlight: true, section: true }

// Regular sub-item
{ icon: List, label: 'Page Name', view: 'view-key', sub: true }

// Sky section item (hidden when Sky is off)
{ icon: ListTodo, label: 'Sky Page', view: 'sky-page', sub: true, sky: true }

// Standalone top-level item
{ icon: Settings, label: 'Settings', view: 'settings' }
```
