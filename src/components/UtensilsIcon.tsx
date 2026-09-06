/**
 * Fork and spoon for the Menu tab and the Menu chip. The fork's head is
 * filled with three short parallel tines (a stroked U read as a trident
 * at 17px); the spoon's bowl is filled too, and smaller than its handle,
 * as on a real one.
 */
export default function UtensilsIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 17 17" fill="none" aria-hidden="true">
      <g fill="currentColor">
        <rect x="2.55" y="2" width="1" height="3.7" rx="0.5" />
        <rect x="4.5" y="2" width="1" height="3.7" rx="0.5" />
        <rect x="6.45" y="2" width="1" height="3.7" rx="0.5" />
        <path d="M2.55 5.2h4.9v.9c0 1.45-1.1 2.3-2.45 2.3S2.55 7.55 2.55 6.1z" />
      </g>
      <path d="M5 7.9V15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="12.4" cy="4.5" rx="1.8" ry="2.5" fill="currentColor" />
      <path d="M12.4 6.8V15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
