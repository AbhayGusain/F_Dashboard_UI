# Finance Dashboard

I built this responsive finance dashboard with React, Vite, Tailwind CSS, and Recharts. It includes role-based access control, transaction filtering, export actions, theme switching, and summary analytics.

## Features

- support role-based UI for `Admin` and `Viewer`
- provide an add-transaction action for admins
- include transaction search, filtering, and grouping
- support CSV and JSON export of visible records
- include a light/dark theme toggle
- show summary cards for balance, income, and expenses
- include a trend chart and spending breakdown chart
- handle loading and empty states
- persist preferences in `localStorage`

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Recharts
- Lucide React

## Project Structure

- `src/App.jsx` - main dashboard UI and app logic
- `src/index.css` - global styles and Tailwind directives
- `src/main.jsx` - React entry point
- `src/api/mockApi.js` - mock transaction data source

## Approach

### State Management

use local React state with `useState`, derived values with `useMemo`, and persistence through `localStorage`. This keeps the app simple while still preserving user preferences like role, search, filters, grouping, theme, and stored transactions.

### RBAC

handle RBAC at the UI level:

- `Admin` can add transactions and use edit actions
- `Viewer` can only view and export data

### Data Flow

load transaction data from a mock API first. If stored data exists in `localStorage`, I restore that data instead. I compute filtered and grouped views from active state so the table and charts stay in sync.

## Notes

- Tailwind directives in `src/index.css` require Tailwind/PostCSS to be configured correctly.
- I designed this app as a dashboard demo.
