/**
 * Micro-interaction: a small "+540" chip detaches from the tapped control and
 * flies up into the running total. Pure DOM so any component can trigger it.
 */
export function flyCalories(text: string, fromEl: HTMLElement | null): void {
  const target = document.getElementById("hero-total");
  if (!fromEl || !target) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const from = fromEl.getBoundingClientRect();
  const to = target.getBoundingClientRect();

  const chip = document.createElement("span");
  chip.className = "fly-cal";
  chip.textContent = text;
  chip.style.left = `${from.left + from.width / 2}px`;
  chip.style.top = `${from.top + from.height / 2}px`;
  document.body.appendChild(chip);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  const animation = chip.animate(
    [
      { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
      {
        transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.55}px)) scale(1.05)`,
        opacity: 1,
        offset: 0.55,
      },
      {
        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.55)`,
        opacity: 0,
      },
    ],
    { duration: 620, easing: "cubic-bezier(0.3, 0.75, 0.35, 1)" },
  );
  animation.onfinish = () => chip.remove();
}

/** A tiny haptic tick on devices that support it. */
export function haptic(ms = 10): void {
  navigator.vibrate?.(ms);
}
