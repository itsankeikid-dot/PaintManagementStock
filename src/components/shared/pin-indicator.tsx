interface PinIndicatorProps {
  /** Number of digits currently entered. */
  length: number;
  /** Total number of PIN digits. Default 4. */
  max?: number;
  /** Color class for filled dots. Default "bg-[#0e7ad5]". */
  filledClass?: string;
}

/**
 * Visual PIN strength indicator: shows filled/unfilled bars for each digit.
 */
export function PinIndicator({
  length,
  max = 4,
  filledClass = "bg-[#0e7ad5]",
}: PinIndicatorProps) {
  return (
    <div className="flex gap-2 pt-1" aria-hidden="true">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-150 ${
            i < length ? filledClass : "bg-[#E2E8F0]"
          }`}
        />
      ))}
    </div>
  );
}
