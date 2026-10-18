
import { Select } from "@base-ui/react/select";
import { cn } from "cn";

export type EditionSelectItem = {
  label: string;
  value: string;
};

type EditionSelectProps = {
  name?: string;
  label: string;
  value: string;
  items: EditionSelectItem[];
  placeholder?: string;
  required?: boolean;
  triggerVariant?: "hairline" | "boxed";
  labelVariant?: "filter" | "form";
  onValueChange?: (value: string) => void;
};

const popupClassName =
  "z-50 min-w-[var(--anchor-width)] origin-[var(--transform-origin)] rounded-lg border border-edition-hairline surface-board on-board p-1 text-edition-ink outline-none transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0";

function SelectChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-4 shrink-0 text-edition-muted"
      aria-hidden="true"
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
    </svg>
  );
}

export function EditionSelect({
  name,
  label,
  value,
  items,
  placeholder = "Any",
  required,
  triggerVariant = "hairline",
  labelVariant = "filter",
  onValueChange,
}: EditionSelectProps) {
  const labelId = name ? `${name}-label` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <span
        id={labelId}
        className={cn(
          labelVariant === "form"
            ? "text-sm font-semibold text-edition-ink"
            : "type-label",
        )}
      >
        {label}
      </span>
      <Select.Root
        name={name}
        required={required}
        items={items}
        value={value}
        onValueChange={(nextValue) => {
          onValueChange?.(nextValue ?? "");
        }}
      >
        <Select.Trigger
          aria-labelledby={labelId}
          className={cn(
            "flex w-full items-center justify-between gap-2 text-left text-sm text-edition-ink edition-interactive-transition outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring",
            triggerVariant === "hairline"
              ? "min-h-11 border-0 border-b border-edition-field-border bg-transparent px-0 py-2 focus-visible:border-edition-field-border"
              : "min-h-11 rounded-md border border-edition-field-border bg-edition-canvas/50 px-3 py-2 focus-visible:border-edition-gilt",
            value !== "" && triggerVariant === "hairline" && "seal-live border-b-edition-rubric",
            value !== "" && triggerVariant === "boxed" && "seal-live",
          )}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon>
            <SelectChevronIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={4} align="start">
            <Select.Popup className={popupClassName}>
              <Select.List className="max-h-[min(var(--available-height),16rem)] overflow-y-auto py-1">
                {items.map((item) => (
                  <Select.Item
                    key={item.value === "" ? "__any__" : item.value}
                    value={item.value}
                    className={cn(
                      "flex cursor-default items-center rounded-lg px-3 py-2 text-sm outline-none select-none data-highlighted:bg-edition-hover",
                      item.value === value
                        ? "font-medium text-edition-ink"
                        : "font-normal text-edition-muted",
                    )}
                  >
                    <Select.ItemText>{item.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
