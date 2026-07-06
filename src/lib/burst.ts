/**
 * The streak celebration: a small radial burst of particles from the hero
 * total — fireworks in the app's own palette, over in under a second.
 */
export function celebrate(originEl: HTMLElement | null): void {
  if (!originEl) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const styles = getComputedStyle(document.documentElement);
  const colors = [
    styles.getPropertyValue("--accent").trim(),
    styles.getPropertyValue("--warn").trim(),
    styles.getPropertyValue("--ink-3").trim(),
  ];

  const COUNT = 20;
  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement("span");
    p.className = "burst-p";
    const size = 4 + Math.random() * 4;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    p.style.background = colors[i % colors.length];
    if (Math.random() < 0.4) p.style.borderRadius = "1.5px"; // a few squares
    document.body.appendChild(p);

    // Radial spread with a gentle upward bias, then gravity pulls down.
    const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 55 + Math.random() * 65;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 24;
    const fall = 30 + Math.random() * 26;
    const duration = 620 + Math.random() * 280;

    const animation = p.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.4)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`,
          opacity: 1,
          offset: 0.55,
        },
        {
          transform: `translate(calc(-50% + ${dx * 1.15}px), calc(-50% + ${dy + fall}px)) scale(0.5)`,
          opacity: 0,
        },
      ],
      { duration, easing: "cubic-bezier(0.2, 0.7, 0.35, 1)" },
    );
    animation.onfinish = () => p.remove();
  }
}

/**
 * The protein-goal moment: a handful of little fires rise from the protein
 * line, flickering out as they go. Same lifecycle as `celebrate` — pure DOM,
 * gone in about a second, skipped under reduced motion.
 */
export function emberBurst(originEl: HTMLElement | null): void {
  if (!originEl) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const rect = originEl.getBoundingClientRect();
  const COUNT = 7;
  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement("span");
    p.className = "ember-p";
    p.textContent = "🔥";
    // Scatter along the width of the line, not from a single point.
    p.style.left = `${rect.left + rect.width * (0.1 + Math.random() * 0.8)}px`;
    p.style.top = `${rect.top + rect.height * 0.5}px`;
    p.style.fontSize = `${13 + Math.random() * 8}px`;
    document.body.appendChild(p);

    const rise = 44 + Math.random() * 42;
    const sway = (Math.random() - 0.5) * 34;
    const tilt = (Math.random() - 0.5) * 28;
    const duration = 800 + Math.random() * 450;
    const delay = i * 45 + Math.random() * 120;

    const animation = p.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.2)", opacity: 0 },
        {
          transform: `translate(calc(-50% + ${sway * 0.4}px), calc(-50% - ${rise * 0.45}px)) scale(1.05) rotate(${tilt}deg)`,
          opacity: 1,
          offset: 0.35,
        },
        {
          transform: `translate(calc(-50% + ${sway}px), calc(-50% - ${rise}px)) scale(0.6) rotate(${-tilt}deg)`,
          opacity: 0,
        },
      ],
      {
        duration,
        delay,
        easing: "cubic-bezier(0.25, 0.6, 0.35, 1)",
        fill: "backwards",
      },
    );
    animation.onfinish = () => p.remove();
  }
}
