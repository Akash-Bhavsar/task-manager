// Labels API. User-scoped tags, many-to-many with tasks (see server/routes/labels.ts).

export interface Label {
  id: number;
  name: string;
  color: string;
}

const base = () => `${process.env.NEXT_PUBLIC_API_URL}/api/labels`;

export async function fetchLabels(): Promise<Label[]> {
  const res = await fetch(base(), { method: "GET", credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch labels: ${res.status}`);
  return res.json();
}

export async function createLabel(name: string, color: string): Promise<Label> {
  const res = await fetch(base(), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) {
    // Surface the server's message (e.g. duplicate name 409) when present.
    const msg = await res.json().catch(() => null);
    throw new Error(msg?.error ?? `Failed to create label: ${res.status}`);
  }
  return res.json();
}

export async function deleteLabel(id: number): Promise<void> {
  const res = await fetch(`${base()}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete label: ${res.status}`);
  }
}
