/** A font-independent eight-spoke mark; phones cannot substitute an emoji. */
export default function SpiceMark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 32 32" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="M16 2v28M2 16h28M6 6l20 20M6 26 26 6" /></svg>;
}
