import type { ReactNode } from "react";
import { Fleuron } from "@/components/ui/fleuron";
import { cn } from "cn";

type PlateEdge = "gilt" | "rubric" | "none";

type PlateProps = {
  children: ReactNode;
  className?: string;
  /** The top edge: brass by default (the game's gilt rule), rubric for danger. */
  edge?: PlateEdge;
  /** Lift the leaf off the page with the warm offset shadow. Default true. */
  raised?: boolean;
};

const edgeClassName: Record<PlateEdge, string> = {
  gilt: "rule-gilt h-[3px]",
  rubric: "h-[3px] bg-edition-rubric",
  none: "",
};

/**
 * A hide panel stamped onto the map-paper floor: the catalogue's plate. Every
 * plate in the app is cut from this one block — the public contents list, the
 * admin sections and forms, the empty states — so the chrome is ink-dark on
 * aged paper rather than a pale card, which is the game's value structure.
 * `on-board` rides along so anything written for paper drops in unchanged.
 */
export function Plate({
  children,
  className,
  edge = "gilt",
  raised = true,
}: PlateProps) {
  return (
    <div
      className={cn(
        "surface-board on-board overflow-hidden rounded-lg border border-edition-hairline",
        raised && "shadow-plate",
        className,
      )}
    >
      {edge !== "none" ? (
        <div aria-hidden className={edgeClassName[edge]} />
      ) : null}
      {children}
    </div>
  );
}

type PlateHeadProps = {
  label: string;
  /** Technical right-hand mark, e.g. an extent count. */
  meta?: ReactNode;
  description?: string;
  /** A trailing control (a text link or button) on the running-head line. */
  action?: ReactNode;
  /** Render the label as a section heading where it heads a real section. */
  labelAs?: "span" | "h2";
  className?: string;
};

/**
 * The printed running head at the top of a plate: slab caps ruled off from the
 * body with a hairline, exactly as the public "Contents" head is set. The label
 * is a span by default and an h2 when it truly names a section.
 */
export function PlateHead({
  label,
  meta,
  description,
  action,
  labelAs = "span",
  className,
}: PlateHeadProps) {
  const labelNode =
    labelAs === "h2" ? (
      <h2 className="type-running-head">{label}</h2>
    ) : (
      <span className="type-running-head">{label}</span>
    );

  return (
    <div className={cn("rule-printed px-4 py-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {labelNode}
        {meta || action ? (
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {meta ? <span className="type-running-head">{meta}</span> : null}
            {action}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-1.5 type-body-sm text-edition-muted text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** The closing mark: a four-point brass star between two rules at the foot. */
export function PlateFoot({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex items-center justify-center gap-3 px-4 py-5 text-edition-gilt",
        className,
      )}
    >
      <span className="h-px w-10 bg-edition-hairline-strong" />
      <Fleuron className="w-5" />
      <span className="h-px w-10 bg-edition-hairline-strong" />
    </div>
  );
}
