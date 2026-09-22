import useSound from "use-sound";

/**
 * Todos los efectos de sonido del juego, en un solo lugar. Si alguno no
 * encaja, basta con reemplazar el archivo en /public/sfx (mismo nombre)
 * o cambiar la ruta de abajo — nada más en el código necesita cambiar.
 *
 * El "?v=" al final de cada ruta es para que el navegador no se quede con
 * una versión vieja en caché cuando reemplazamos el archivo por otro con
 * el mismo nombre — súbelo cada vez que cambies un .ogg.
 */
const V = 2;

export function useSfx(muted: boolean) {
  const opts = { soundEnabled: !muted };

  const [playReveal] = useSound(`/sfx/reveal.ogg?v=${V}`, { volume: 0.6, ...opts });
  const [playCorrect] = useSound(`/sfx/correct.ogg?v=${V}`, { volume: 0.6, ...opts });
  const [playWrong] = useSound(`/sfx/wrong.ogg?v=${V}`, { volume: 0.6, ...opts });
  const [playHit] = useSound(`/sfx/hit.ogg?v=${V}`, { volume: 0.5, ...opts });
  const [playDeath] = useSound(`/sfx/death.ogg?v=${V}`, { volume: 0.6, ...opts });
  const [playSteal] = useSound(`/sfx/steal.ogg?v=${V}`, { volume: 0.55, ...opts });
  const [playRoundWin] = useSound(`/sfx/round-win.ogg?v=${V}`, { volume: 0.55, ...opts });
  const [playVictory] = useSound(`/sfx/victory.ogg?v=${V}`, { volume: 0.7, ...opts });
  const [playDefeat] = useSound(`/sfx/defeat.ogg?v=${V}`, { volume: 0.5, ...opts });

  return {
    playReveal,
    playCorrect,
    playWrong,
    playHit,
    playDeath,
    playSteal,
    playRoundWin,
    playVictory,
    playDefeat
  };
}

export type Sfx = ReturnType<typeof useSfx>;
