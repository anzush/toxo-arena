/** Silueta encapuchada que viene a cobrarse una vida. Solo decorativa. */
export function Reaper({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 32 38"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M16 2C9 2 4 9 4 18c0 8 3 14 3 16h18c0-2 3-8 3-16C28 9 23 2 16 2z"
        fill="#1a1830"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1"
      />
      <path
        d="M16 6.5c-4.5 0-8 4.5-8 11 0 4 1 7 1.5 9h13c.5-2 1.5-5 1.5-9 0-6.5-3.5-11-8-11z"
        fill="#0b0916"
      />
      <circle cx="12.5" cy="16.5" r="1.6" fill="#ff5a6e" />
      <circle cx="19.5" cy="16.5" r="1.6" fill="#ff5a6e" />
    </svg>
  );
}
