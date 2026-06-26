import { Label } from "@/lib/api/labels";
import { cn } from "@/lib/cn";

// Small colored tag chips shown on task cards/rows. Color comes from the label;
// the chip uses it for a tinted background, border, and dot.
export default function LabelChips({
  labels,
  className,
}: {
  labels?: Label[];
  className?: string;
}) {
  if (!labels || labels.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {labels.map((label) => (
        <span
          key={label.id}
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
          style={{
            color: label.color,
            borderColor: `${label.color}55`,
            backgroundColor: `${label.color}14`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: label.color }}
            aria-hidden
          />
          {label.name}
        </span>
      ))}
    </div>
  );
}
