// Fractional ordering for Kanban columns. A moved card takes the midpoint
// between its two neighbors, so persisting a reorder is a single-row write
// (no whole-column reindex). `position` is a Float on the server (see schema).

const GAP = 1;

// Compute a `position` for a card dropped between `prev` and `next`, where each
// arg is the neighbor's current position (or undefined when there is no
// neighbor on that side).
//   empty column        → 0
//   insert at the top    → next - 1
//   insert at the bottom → prev + 1
//   between two cards    → (prev + next) / 2
export function midpoint(prev?: number, next?: number): number {
  if (prev === undefined && next === undefined) return 0;
  if (prev === undefined) return (next as number) - GAP;
  if (next === undefined) return prev + GAP;
  return (prev + next) / 2;
}
