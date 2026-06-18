"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loginWithPin } from "@/actions/auth";
import { toast } from "sonner";

/**
 * PIN Login page component.
 * Renders a full-screen kiosk-style PIN entry with a numeric keypad.
 * Auto-submits when 4 digits are entered — no login button needed.
 */
export default function LoginPageClient() {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  // Guards against the auto-submit effect firing more than once per filled PIN.
  const submittingRef = useRef(false);

  const maxPinLength = 4;

  const handleLogin = useCallback(async (currentPin: string) => {
    setIsLoading(true);
    try {
      const result = await loginWithPin(currentPin);
      if (result.success && result.redirectTo) {
        toast.success("Login berhasil!");
        router.push(result.redirectTo);
      } else {
        toast.error(result.error || "PIN salah, coba lagi");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin("");
        submittingRef.current = false;
      }
    } catch {
      toast.error("Terjadi kesalahan, coba lagi");
      setPin("");
      submittingRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Auto-submit when 4 digits are entered (only once per filled PIN)
  useEffect(() => {
    if (pin.length === maxPinLength && !submittingRef.current) {
      submittingRef.current = true;
      handleLogin(pin);
    }
  }, [pin, handleLogin]);

  const handleDigit = (digit: string) => {
    if (pin.length < maxPinLength && !isLoading) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (!isLoading) setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (!isLoading) setPin("");
  };

  // Physical keyboard support (top-row digits and numpad).
  // e.key is "0"-"9" for both Digit* and Numpad* codes, so no need to inspect e.code.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setPin((prev) => (prev.length < maxPinLength ? prev + e.key : prev));
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setPin((prev) => prev.slice(0, -1));
      } else if (e.key === "Delete" || e.key === "Escape") {
        e.preventDefault();
        setPin("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading]);

  const keypadDigits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-6 py-4 bg-white border-b border-[#E2E8F0]">
        {/* Factory / paint bucket icon */}
        <div className="w-9 h-9 rounded-lg bg-[#0e7ad5] flex items-center justify-center flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-white"
            aria-hidden="true"
          >
            <path d="M19 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
            <path d="M10 13H4" />
            <path d="M10 17H4" />
            <path d="M14 13h.01" />
            <path d="M19 13c0 3-3 5-3 5s-3-2-3-5a3 3 0 0 1 6 0Z" />
          </svg>
        </div>
        <span className="text-[#1e344a] font-semibold text-base tracking-tight">
          Paint Stock Manager
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#1e344a] tracking-tight">
              Masukkan PIN Anda
            </h1>
            <p className="text-sm text-[#64748B] mt-1.5">
              Tekan tombol di bawah untuk login
            </p>
          </div>

          {/* PIN dots */}
          <div
            className={`flex justify-center gap-4 mb-8 transition-all ${
              shake ? "animate-[shake_0.4s_ease-in-out]" : ""
            }`}
            aria-live="polite"
            aria-label={`${pin.length} dari ${maxPinLength} digit dimasukkan`}
          >
            {Array.from({ length: maxPinLength }).map((_, i) => {
              const filled = i < pin.length;
              const active = i === pin.length;
              return (
                <div
                  key={i}
                  className={`
                    w-14 h-14 rounded-2xl border-2 flex items-center justify-center
                    transition-all duration-150
                    ${filled
                      ? "border-[#0e7ad5] bg-[#0e7ad5]"
                      : active
                        ? "border-[#0e7ad5] bg-white shadow-sm shadow-[#0e7ad5]/20"
                        : "border-[#CBD5E1] bg-white"
                    }
                    ${isLoading ? "opacity-60" : ""}
                  `}
                >
                  {filled && (
                    <div className="w-3 h-3 rounded-full bg-white" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Loading state */}
          {isLoading && (
            <p className="text-center text-sm text-[#64748B] mb-6 animate-pulse">
              Memverifikasi PIN...
            </p>
          )}

          {/* Hidden accessible input */}
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            value={pin}
            readOnly
            className="sr-only"
            aria-label="PIN input"
          />

          {/* Keypad grid */}
          <div className="grid grid-cols-3 gap-3">
            {keypadDigits.map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigit(digit)}
                disabled={isLoading}
                aria-label={`Digit ${digit}`}
                className="
                  h-16 rounded-2xl border border-[#E2E8F0] bg-white
                  text-2xl font-bold text-[#1e344a]
                  shadow-sm hover:shadow-md
                  hover:bg-[#F1F5F9] hover:border-[#CBD5E1]
                  active:scale-95 active:bg-[#E2E8F0]
                  transition-all duration-150 cursor-pointer
                  disabled:opacity-40 disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5] focus-visible:ring-offset-2
                "
              >
                {digit}
              </button>
            ))}

            {/* Clear */}
            <button
              onClick={handleClear}
              disabled={isLoading || pin.length === 0 ? true : false}
              aria-label="Hapus semua"
              className="
                h-16 rounded-2xl border border-[#E2E8F0] bg-white
                text-sm font-semibold text-[#64748B]
                shadow-sm hover:shadow-md
                hover:bg-[#FEF2F2] hover:border-[#FECACA] hover:text-[#DC2626]
                active:scale-95
                transition-all duration-150 cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5] focus-visible:ring-offset-2
              "
            >
              Hapus
            </button>

            {/* 0 */}
            <button
              onClick={() => handleDigit("0")}
              disabled={isLoading}
              aria-label="Digit 0"
              className="
                h-16 rounded-2xl border border-[#E2E8F0] bg-white
                text-2xl font-bold text-[#1e344a]
                shadow-sm hover:shadow-md
                hover:bg-[#F1F5F9] hover:border-[#CBD5E1]
                active:scale-95 active:bg-[#E2E8F0]
                transition-all duration-150 cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5] focus-visible:ring-offset-2
              "
            >
              0
            </button>

            {/* Backspace */}
            <button
              onClick={handleBackspace}
              disabled={isLoading || pin.length === 0 ? true : false}
              aria-label="Hapus satu digit"
              className="
                h-16 rounded-2xl border border-[#E2E8F0] bg-white
                flex items-center justify-center
                shadow-sm hover:shadow-md
                hover:bg-[#F1F5F9] hover:border-[#CBD5E1]
                active:scale-95
                transition-all duration-150 cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5] focus-visible:ring-offset-2
              "
            >
              {/* Backspace SVG icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-[#64748B]"
                aria-hidden="true"
              >
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="18" y2="15" />
              </svg>
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-[#94A3B8]">
        Paint Stock Manager &copy; {new Date().getFullYear()}
      </footer>

      {/* Shake keyframe */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
