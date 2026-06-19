import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";

interface QtyStepperProps {
  label: string;
  value: number;
  /** Clamps/rounds and stores the value. Called by stepper buttons and input. */
  onChange: (value: number) => void;
  /** Sets the value directly from a quick-chip. */
  onQuickSelect: (value: number) => void;
  step: number;
  min: number;
  /** Decimal places: 0 parses input as int, >0 as float and shows step. */
  decimals: number;
  disabled?: boolean;
  /** Quick-pick values shown as chips below the stepper. */
  quickValues: number[];
  /** Suffix appended to each chip label, e.g. " kg". */
  quickSuffix?: string;
  /** Tailwind classes for the active (selected) chip. */
  activeChipClass: string;
  /** ARIA unit name, e.g. "kaleng" / "kg". */
  unitLabel: string;
  /** When set, renders this unit inside the input on the right. */
  inlineUnit?: string;
}

const stepBtn =
  "w-14 h-14 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center shrink-0 hover:bg-[#F1F5F9] active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5]";

/**
 * Quantity stepper (−/input/+) with quick-pick chips. Shared by the warehouse
 * (integer cans) and sideroom (decimal kg) operator forms.
 */
export function QtyStepper({
  label,
  value,
  onChange,
  onQuickSelect,
  step,
  min,
  decimals,
  disabled = false,
  quickValues,
  quickSuffix = "",
  activeChipClass,
  unitLabel,
  inlineUnit,
}: QtyStepperProps) {
  // Local display value — decouples the input from parent so the user can
  // freely clear the field to type a new number. Synced from `value` prop
  // whenever it changes externally (stepper buttons, quick chips, reset).
  const [display, setDisplay] = useState(String(value));

  // Sync from parent when the external value changes (stepper/chip/reset).
  // Skip while the input is focused to avoid clobbering the user's typing.
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDisplay(String(value));
  }, [value, focused]);

  const parse = (raw: string) => {
    const n = decimals > 0 ? parseFloat(raw) : parseInt(raw);
    return Number.isNaN(n) ? 0 : n;
  };

  /** On blur, clamp to min if the user left the field empty or below min. */
  const handleBlur = () => {
    setFocused(false);
    const n = parse(display);
    if (n < min) {
      setDisplay(String(min));
      onChange(min);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-[#334155]">{label}</Label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(value - step)}
          disabled={value <= min || disabled}
          aria-label={`Kurangi ${unitLabel}`}
          className={stepBtn}
        >
          <Minus className="size-5 text-[#475569]" aria-hidden="true" />
        </button>

        <div className="relative flex-1">
          <Input
            type="number"
            min={min}
            step="any"
            inputMode={decimals > 0 ? "decimal" : "numeric"}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            name="qty"
            data-form-type="other"
            value={display}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            onChange={(e) => {
              setDisplay(e.target.value);
              const n = parse(e.target.value);
              if (n >= min) onChange(n);
            }}
            className={`h-14 text-2xl font-bold text-center w-full rounded-xl border-[#CBD5E1] focus:ring-2 focus:ring-[#0e7ad5] ${inlineUnit ? "pr-10" : ""}`}
            aria-label={`Jumlah ${unitLabel}`}
          />
          {inlineUnit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#94A3B8]">
              {inlineUnit}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onChange(value + step)}
          disabled={disabled}
          aria-label={`Tambah ${unitLabel}`}
          className={stepBtn}
        >
          <Plus className="size-5 text-[#475569]" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {quickValues.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onQuickSelect(q)}
            disabled={disabled}
            aria-label={`Set ${unitLabel} ${q}`}
            className={`min-w-[52px] h-9 px-3 rounded-lg text-sm font-bold transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ${
              value === q
                ? `${activeChipClass} text-white shadow-sm`
                : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:border-[#CBD5E1] focus-visible:ring-[#0e7ad5]"
            }`}
          >
            {q}{quickSuffix}
          </button>
        ))}
      </div>
    </div>
  );
}
