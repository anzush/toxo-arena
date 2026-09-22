/** Pulso rojo en toda la pantalla cuando quedan los últimos segundos del reloj. */
export function UrgentFlash({ active }: { active: boolean }) {
  if (!active) return null;
  return <div className="urgent-flash-backdrop" aria-hidden="true" />;
}
