# ProjectDesk

A standalone, browser-based project management mockup built from the visual
language of the exported DocRouter Power Apps app. It has **no Power Apps
runtime dependency, authentication, or production integrations**.

The app is plain HTML, CSS, and vanilla ES modules, served by a tiny
dependency-free Node static server. ProjectDesk projects and tasks are saved in
browser storage. The Pipeline view optionally reads sample data from the local
TigerTurf SQLite API; it does not send records to an external service.

## Run it

```powershell
npm start
```

Open <http://127.0.0.1:4173>.

Useful checks:

```powershell
npm test        # repository, storage, and domain tests with node:test
npm run check   # syntax-check every JavaScript file
```

Node 18+ is required for the ProjectDesk mockup; the project was verified with
Node 24. There are no package dependencies to install.

The Opportunity Pipeline reads `v_opportunity_pipeline` from the TigerTurf
SQLite API. Start that API with `DataModel\Open Database.bat` before opening
`#/pipeline`, or use the VS Code **ProjectDesk with TigerTurf data** debug
configuration. The rest of ProjectDesk continues to run without the data API.
The TigerTurf API uses Node's built-in SQLite support and requires Node 22.5+.

## What is included

| Route | View |
| --- | --- |
| `#/dashboard` | Greeting, personal KPIs, attention banner, priority tasks, project health, portfolio mix, recent activity |
| `#/tasks` | My Tasks with KPI row, tabs, search, priority/project filters, quick complete, reroute, edit/delete dialogs |
| `#/projects` | Portfolio table and card views with search, status/type filters, health and progress |
| `#/projects/:id` | Project detail with progress, overview/tasks/activity tabs, facts, team, tags, quick actions |
| `#/projects/new` | Create project form with validation, owner, dates, budget, team, and tags |
| `#/projects/:id/edit` | Edit project form |
| `#/pipeline` | Opportunity pipeline from the TigerTurf SQLite data model |
| `#/data` | TigerTurf table browser, record editor, reports and read-only SQL |
| `#/requests` | DocRouter local request list, search and status filters |
| `#/requests/new` | Request intake with category-based workflow setup |
| `#/requests/:id` | Request details, workflow editor, assignments, rerouting, comments, and audit history |
| `#/request-tasks` | Request workflow assignments |
| `#/reports` | Status donut, type breakdown, workload, upcoming deadlines, performance table, CSV export |
| `#/settings` | Theme, default view, compact table preference, notification switches, reset demo data |
| `#/help` | Guide, FAQ, and an explanation of the mockup |

The fictional signed-in user is **Jordan Mitchell** (`jordan.mitchell@contoso.com`).

## Project structure

```
index.html                 App shell and DOM roots
styles.css                 Light/dark design system and responsive layout
server.mjs                 Dependency-free static server (127.0.0.1:4173)
js/
  app.js                   Hash router, shell refresh, global interactions
  domain.js                Vocabulary, date/formatting helpers, derived values
  repository.js            Project/task repository backed by local storage
  docrouter-repository.js  Separate local request/workflow repository
  storage.js               Versioned localStorage adapter (swappable for an API)
  shell.js                 Sidebar, top bar, breadcrumbs, mobile navigation
  overlays.js              Modal, confirm, and toast managers
  data/seed.js             Fictional projects, tasks, and activity
  components/
    icons.js               Inline stroke icon set
    ui.js                  Badges, avatars, KPIs, task/project fragments
    task-modal.js          Shared create/edit task dialog
    reroute-modal.js      Single/bulk temporary or permanent task reroute
  views/                  ProjectDesk, TigerTurf, and DocRouter local workflow views
tests/repository.test.mjs  Repository behaviour tests
scripts/check.mjs          Syntax check for all app JavaScript
```

## Data model

- **Project** — id, name, description, status, priority, type, owner, start and
  target dates, budget, team, tags, timestamps.
- **Task** — id, project id, title, description, assignee, status, priority,
  due date, created/updated/completed timestamps, and reroute history.
- **Activity** — id, project id, type (`created`, `updated`, `status`, `task`,
  `comment`), message, actor, timestamp.
- **Settings** — theme, default view, notification preferences, compact tables.

The repository in `js/repository.js` is the only mutable store. It returns
clones on every read, validates writes, cascades project deletion to tasks and
activity, and records activity for changes. Writes are saved through
`js/storage.js`, a small async adapter currently backed by `localStorage`.
Replacing the adapter with an IndexedDB or API-backed implementation — or
replacing the repository internals with real API calls — should not require
changes to the views.

Seed dates are generated relative to the day the demo is first seeded. Because
the seed data is saved after that first load, use **Reset demo data** in
Settings to regenerate dates relative to today.

Tasks can be rerouted individually or in bulk. Temporary reroutes preserve the
original assignee and return the task to them when it is completed; permanent
transfers do not. Each reroute requires a reason and is added to project
activity.

DocRouter-style requests are a separate local domain stored under
`projectdesk.docrouter.v1`; they do not share records with ProjectDesk tasks or
TigerTurf. The local workflow supports request intake, ordered phases,
assignment completion, temporary delegation, permanent transfer, comments,
workflow editing, suspend/resume/restart, and audit history. Its directory and
workflow actions are a browser-only equivalent: no Power Apps, SharePoint,
Power Automate, email, or authentication integration is configured.

## Deliberate limitations

- Data is saved in this browser only and survives refreshes. Clearing site data
  or using **Reset demo data** removes it.
- No production backend, sign-in, or permissions for the ProjectDesk mockup.
- The Pipeline route reads only from the optional local TigerTurf DataModel API;
  its records are not sent to an external service.
- No cookies, service worker, or external API. ProjectDesk data uses browser
  storage; TigerTurf data remains in its local SQLite database.
- CSV export is a client-side download of the current demo project list.
- The exported Power Apps source (`Src/`, `Components/`, `Controls/`,
  `References/`, `Resources/`, JSON metadata) remains a behavioral reference
  and is not loaded by the mockup.

## Design provenance

The palette, spacing, 12px radii, Segoe UI type stack, sidebar/top bar
structure, KPI cards, project tables, task rows, detail layout, report cards,
and create-form patterns were adapted from the DocRouter Power Apps export.
The mockup reinterprets those patterns for projects, tasks, and reporting rather
than requests and records.
