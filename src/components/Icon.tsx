import type { ReactNode } from "react";

export default function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    arrow: <path d="m7 17 10-10M7 7h10v10" />,
    right: <path d="m9 5 7 7-7 7" />,
    back: <path d="m15 5-7 7 7 7M8 12h12" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    lock: (
      <>
        <rect x="6" y="10" width="12" height="10" rx="3" />
        <path d="M9 10V7a3 3 0 0 1 6 0v3" />
      </>
    ),
    hide: (
      <>
        <path d="m3 3 18 18M10.5 5.2 12 5c6 0 10 7 10 7a19 19 0 0 1-3 3.7M6.5 6.5A22 22 0 0 0 2 12s4 7 10 7a12 12 0 0 0 5.5-1.5" />
        <path d="M10 10a3 3 0 0 0 4 4" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <path d="m12 12 9-9M17 3h4v4" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="3" />
        <path d="M3 9h18M16 14h2" />
      </>
    ),
    logout: <path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h12" />,
    file: (
      <>
        <path d="M14 3H5v18h14V8ZM14 3v5h5M8 12h8M8 16h6" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4M18 4h4" />
      </>
    ),
    send: (
      <>
        <path d="m3 3 18 9-18 9 4-9-4-9ZM7 12h14" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    chat: (
      <path d="M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-.9L3 21l1.9-5A10 10 0 0 1 4 12a9 9 0 1 1 17-1Z" />
    ),
    photo: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8" cy="8" r="2" />
        <path d="m3 17 5-5 4 4 4-6 5 7" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.target}
    </svg>
  );
}
