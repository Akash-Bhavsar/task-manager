# Task Manager — Roadmap

Product + engineering roadmap for evolving the task manager beyond the current
single **list view**. Phased and dependency-ordered: each phase unblocks the next.

Current state (baseline):

- One **list view** only — client-side filter (status), search (title), pagination (5/page).
- `Task.status` is a free-form `String` with inconsistent values in the wild
  (`"Draft"`, `"in-progress"`, `"completed"`, plus `"pending"` in tests).
- No ordering, due dates, priority, labels, or timestamps on tasks.
- Inline delete has no confirmation/undo and is **ADMIN-only** (USER gets 403).
- All task fetching pulls the full set, then filters/paginates in the browser.

---

## Foundation cracks (must fix before new views)

These block a correct Kanban/board and are addressed in Phase 0:

- **Status not normalized.** Mixed casing ⇒ board columns mis-bucket tasks. Fix:
  canonical set, shared client+server, validated on write. (DB-level `enum`
  deferred until the repo adopts real Prisma migrations — `db push` + dirty data
  makes an in-place `String→enum` conversion fragile.)
- **Filter dropdown missing `draft`.** Draft tasks are unfilterable.
- **No `position` field.** Kanban drag-reorder can't persist order.
- **No `createdAt`/`updatedAt`.** Can't sort by recent or show relative times.
- **Client-side everything.** Won't scale; every view re-implements slicing.

---

## Phases

### Phase 0 — Foundation `[in progress]`
- Extend `Task`: `status` (default), `priority`, `dueDate?`, `position`,
  `createdAt`, `updatedAt`.
- Canonical **status** (`draft | in-progress | completed`) and **priority**
  (`low | medium | high`) constants, shared client + server, with label maps.
- Server-side validation of `status`/`priority` on create/update (400 on bad).
- One-time **backfill** script to normalize legacy casing + set `position`.
- Fix client: `Task` modal casing, dashboard filter includes `draft`,
  `Badge` mapping uses canonical set.
- Update tests to canonical status values.

### Phase 1 — UX safety + polish `[planned]`
- Delete **confirmation / undo** (current inline delete is instant, no recovery).
- Loading **skeletons** per view.
- **Keyboard shortcuts**: `c` create, `/` focus search, `esc` close modal.
- **Priority** colored left-border on cards.
- **Due date** UI + overdue highlight.
- (Independent of Phase 0 plumbing — can ship in parallel.)

### Phase 2 — Server-side data layer `[planned]`
- `GET /api/tasks?status=&q=&sort=&page=&pageSize=` → paginated envelope
  (`{ items, total, page, pageSize, totalPages }`).
- Client `fetchTasks(params)` + a `useTasks` hook = single data source all views share.
- Debounced search, sort control (updated / due / title / priority).

### Phase 3 — Kanban board
- Columns = status set; drag between columns = status change, drag within = reorder.
- Lib: `@dnd-kit/core` (React 19 friendly).
- **Optimistic** drag (update local state instantly, rollback on API error).
- **Fractional `position`** writes — moving a card writes only that card
  (midpoint between neighbors), not the whole column.
- Per-column task counts.

### Phase 4 — More views + switcher `[done]`
- **Table view**: sortable dense columns (Title / Due / Updated headers; reuses
  Phase 2 server sort). Priority/status column sorting deferred — see
  Cross-cutting (needs DB enums).
- View switcher (List / Board / Table), persisted in `localStorage`.

### Phase 5 — Calendar, labels, bulk `[in progress]`
- **Calendar view** keyed off `dueDate` `[done]` — month grid, prev/next/today,
  tasks as day chips (priority dot, overdue/done styling), click chip to edit,
  click a day to create with that date pre-filled (`Task` `defaultDueDate`).
- **Labels/tags** (many-to-many) — colored chips + filter.
- **Bulk actions**: multi-select → delete / move / set status.

---

## Cross-cutting / tech debt

- Adopt real **Prisma migrations** (`migrate deploy`) — replace `db push`; then
  promote `status`/`priority` to true DB enums.
- DELETE is ADMIN-only — decide intended policy (owner-can-delete vs admin-only).
- Move Terraform state to a remote backend (see `CLAUDE.md` known gaps).
