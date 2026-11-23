import type { ReactNode } from "react";

/** 线性图标，和 Demo Day 草稿里的钱包同一套笔画。 */
const PATHS = {
  send: <path d="M7 17 17 7M9 7h8v8" />,
  receive: <path d="M17 7 7 17M15 17H7V9" />,
  swap: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
      <circle cx="17.2" cy="7.2" r="3.2" />
      <circle cx="7.2" cy="17.2" r="3.2" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5.2c0 4.3 2.9 8 7 9.8 4.1-1.8 7-5.5 7-9.8V6l-7-3Z" />
      <path d="M12 7.6v8.8M14.3 9.7c-.5-.6-1.3-.9-2.2-.9-1.2 0-2.1.6-2.1 1.5 0 2.3 4.5 1.2 4.5 3.5 0 .9-1 1.6-2.4 1.6-1 0-1.9-.4-2.4-1" />
    </>
  ),
  back: <path d="m15 5-7 7 7 7" />,
  chev: <path d="m6 9 6 6 6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  stack: (
    <>
      <ellipse cx="12" cy="6.5" rx="7" ry="2.6" />
      <path d="M5 6.5v5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-5M5 11.5v5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  book: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <circle cx="12" cy="10" r="2.6" />
      <path d="M8 16.5c.8-1.6 2.2-2.4 4-2.4s3.2.8 4 2.4" />
    </>
  ),
  unlink: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
      <path d="M4 4l16 16" />
    </>
  ),
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  deposit: <path d="M12 4v10M7.5 9.5 12 14l4.5-4.5M5 19.5h14" />,
  withdraw: <path d="M12 14V4M7.5 8.5 12 4l4.5 4.5M5 19.5h14" />,
  external: <path d="M8 16 16 8M9.5 8H16v6.5" />,
  list: (
    <>
      <rect x="4" y="5" width="5" height="5" rx="1" />
      <rect x="4" y="14" width="5" height="5" rx="1" />
      <path d="M12 6.5h8M12 9h5M12 15.5h8M12 18h5" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
