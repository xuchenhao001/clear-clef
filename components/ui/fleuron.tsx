type FleuronProps = {
  className?: string;
};

/**
 * A printer's star, the period close-mark set between two rules at the foot of
 * a plate. Drawn as a filled four-point star so it holds the same weight as the
 * gilt it sits in.
 */
export function Fleuron({ className }: FleuronProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="M8 0.6 9.7 6.3 15.4 8 9.7 9.7 8 15.4 6.3 9.7 0.6 8 6.3 6.3Z" />
    </svg>
  );
}
