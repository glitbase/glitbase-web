import type { CSSProperties } from 'react';

/**
 * Shared responsive shell + type scale (aligned with `onboarding/register`).
 * Use `min-h-[100dvh]` so mobile browser chrome doesn’t clip content.
 */
export const AUTH = {
  main: 'min-h-[100dvh] min-h-screen w-full !bg-white',
  mainScroll:
    'min-h-[100dvh] min-h-screen w-full !bg-white overflow-y-auto flex flex-col',
  topLink:
    'absolute top-6 sm:top-8 right-4 md:right-12 z-10 text-[14px] md:text-base font-medium text-[#6C6C6C]',
  topLinkAccent: 'text-[#CC5A88] font-semibold cursor-pointer',
  center:
    'min-h-[100dvh] w-full flex flex-1 justify-center items-center p-4 sm:p-6',
  centerTop:
    'min-h-[100dvh] w-full flex flex-1 justify-center items-start sm:items-center p-4 sm:p-6 py-8 sm:py-6',
  column: 'w-full max-w-[440px]',
  columnWide: 'w-full max-w-[440px] sm:max-w-[470px] mx-auto',
  columnInterests: 'w-full max-w-[440px] sm:max-w-[500px] mx-auto',
  title:
    'text-left !text-[1.2rem] md:!text-[1.7rem] font-bold font-[lora] text-[#0A0A0A] tracking-tight',
  titleCenter:
    'text-center !text-[1.25rem] sm:!text-[1.5rem] md:!text-[2rem] font-medium font-[lora] text-[#0A0A0A] tracking-tight',
  titleCenterBold:
    'text-center !text-[1.25rem] sm:!text-[1.65rem] md:!text-[2rem] font-bold font-[lora] text-[#0A0A0A] tracking-tight',
  subtitle:
    'text-left font-medium text-[0.95rem] md:text-[1rem] text-[#6C6C6C] !mt-1 md:!mt-2',
  subtitleCenter:
    'text-center font-medium text-[0.95rem] md:text-[1rem] text-[#6C6C6C] !mt-2',
  formPad: 'w-full py-5 md:py-8 xl:py-10',
  /** Onboarding header: back + “already have account” */
  headerBar:
    'flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center py-6 sm:py-8 px-4 sm:px-8 md:px-12',
  cardShell:
    'rounded-sm py-5 px-4 sm:px-8 md:px-12 w-full max-w-[510px] sm:max-w-[540px] mx-auto !shadow-none',
} as const;

/** OTP cells: smaller on narrow screens so 6 digits fit without horizontal scroll */
export function authOtpInputStyle(opts: {
  hasError: boolean;
  compact: boolean;
}): CSSProperties {
  const { hasError, compact } = opts;
  const w = compact ? 42 : 56;
  const h = compact ? 48 : 60;
  const m = compact ? 3 : 6;
  const fs = compact ? 17 : 22;
  return {
    width: `${w}px`,
    height: `${h}px`,
    marginLeft: `${m}px`,
    marginRight: `${m}px`,
    color: '#1c1a3a',
    fontSize: `${fs}px`,
    fontWeight: 600,
    background: '#F5F5F5',
    borderRadius: '8px',
    border: hasError ? '1px solid #FF2F2F' : '1px solid transparent',
    boxSizing: 'border-box',
  };
}

export function authOtpFocusStyle(hasError: boolean): CSSProperties {
  return {
    outline: 'none',
    border: hasError ? '1px solid #FF2F2F' : '1px solid #CC5A88',
  };
}
