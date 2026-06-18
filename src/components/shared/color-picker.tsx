"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Ensure valid hex format
  const normalizedValue = value.startsWith("#") ? value : `#${value}`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Color preview button that opens the picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          className="w-11 h-11 rounded-xl border-2 border-[#E2E8F0] shrink-0 overflow-hidden cursor-pointer hover:border-[#94A3B8] transition-colors"
          style={{ backgroundColor: normalizedValue }}
          aria-label="Select color"
        />
        <PopoverContent align="start" className="w-[280px] p-4">
          <div className="space-y-3">
            <HexColorPicker
              color={normalizedValue}
              onChange={onChange}
              className="w-full !h-[180px]"
            />
            
            {/* Hex input field */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border border-[#E2E8F0] shrink-0"
                style={{ backgroundColor: normalizedValue }}
              />
              <Input
                value={normalizedValue}
                onChange={(e) => {
                  let newValue = e.target.value;
                  // Add # if missing
                  if (!newValue.startsWith("#")) {
                    newValue = `#${newValue}`;
                  }
                  // Validate hex format
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(newValue)) {
                    onChange(newValue);
                  }
                }}
                className="h-9 rounded-lg border-[#CBD5E1] font-mono text-sm"
                maxLength={7}
                placeholder="#000000"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Text input for hex value */}
      <Input
        value={normalizedValue}
        onChange={(e) => {
          let newValue = e.target.value;
          if (!newValue.startsWith("#")) {
            newValue = `#${newValue}`;
          }
          if (/^#[0-9A-Fa-f]{0,6}$/.test(newValue)) {
            onChange(newValue);
          }
        }}
        className="h-11 rounded-xl border-[#CBD5E1] font-mono text-sm"
        maxLength={7}
      />
    </div>
  );
}
