type FleuronProps = {
  className?: string;
};

/**
 * A printer's leaf ornament, drawn as a pen outline so it sits in the same
 * weight as a rule. Used to close a section instead of a decorative burst.
 */
export function Fleuron({ className }: FleuronProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 1.3c4.3 2.4 6.5 5.2 6.5 8 0 2.9-2.9 5-6.5 5s-6.5-2.1-6.5-5c0-2.8 2.2-5.6 6.5-8Z" />
      <path d="M10 1.9v12.3" />
      <path d="M10 6.2 6.9 8.5m3.1-2.3 3.1 2.3M10 9.7l-3.4 2M10 9.7l3.4 2" />
    </svg>
  );
}
