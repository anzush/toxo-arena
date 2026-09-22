# Toxo Arena

Juego de trivia por equipos sobre *Toxoplasma gondii*, estilo "3 equipos, 5 vidas,
gana el último en pie". Cada jugador entra desde su propio celular con un código
de sala; el anfitrión ve un tablero central y controla el ritmo de la partida.

Hecho con **React + TypeScript + Vite**, sincronizado en tiempo real entre
dispositivos con **Firebase Realtime Database** (sin necesidad de programar ni
mantener un servidor propio).

## 1. Configurar Firebase (una sola vez)

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) y crea
   un proyecto nuevo (es gratis, plan Spark).
2. Dentro del proyecto, entra a **Build → Realtime Database** y créala (elige
   "Start in test mode" para poder probar rápido).
3. En **Configuración del proyecto → Tus apps**, agrega una app web (ícono `</>`)
   y copia el objeto `firebaseConfig` que te muestra.
4. Copia `.env.example` a un archivo nuevo llamado `.env.local` y pega ahí cada
   valor (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_DATABASE_URL`, etc.).

**Importante sobre seguridad:** el modo de prueba deja la base de datos abierta
a lectura/escritura para cualquiera con la URL. Está bien para jugar con amigos
o en clase, pero si vas a dejarlo público conviene luego restringir las reglas
(por ejemplo, exigir que solo se pueda escribir en una sala si ya existe, o
agregar Firebase Auth anónimo). Esto no está implementado todavía.

## 2. Correr el proyecto

```bash
npm install
npm run dev
```

Esto abre el anfitrión en tu computador (o celular) en `http://localhost:5173`.
Para que los demás jugadores se conecten desde sus celulares **en la misma
red wifi**, usa la URL de red que Vite imprime en la terminal (algo como
`http://192.168.1.23:5173`) — ábrela en cada celular.

Si quieres jugar con gente que no está en la misma red (por ejemplo cada quien
desde su casa), necesitas publicar el proyecto en algún hosting (Vercel,
Netlify, Firebase Hosting, etc. — todos tienen plan gratis). El build de
producción se genera con `npm run build`.

## 3. Cómo se juega

1. En un dispositivo (el que va a ser la pantalla principal) entra y elige
   **"Soy el anfitrión"** → **Crear sala**. Aparece un código de 5 letras.
2. Cada jugador entra desde su celular, elige **"Soy jugador"**, escribe el
   código y su nombre.
3. Cuando haya al menos 3 jugadores conectados, el anfitrión toca **"Sortear
   equipos y empezar"**: los jugadores quedan repartidos al azar entre Equipo
   Rojo, Azul y Verde (5 vidas cada uno).
4. El anfitrión va tocando **"Siguiente reto"**: le toca el turno a un equipo,
   sale una pregunta (trivia, verdadero/falso, u ordenar el ciclo de vida) y
   solo los jugadores de ese equipo pueden responder desde su celular. Cuenta
   la primera respuesta que envíe cualquiera del equipo.
5. Hay 20 segundos por reto (se puede cambiar en `src/types.ts`,
   `CHALLENGE_SECONDS`). Si nadie responde a tiempo, cuenta como incorrecta.
6. Si el equipo falla, pierde una vida. Al llegar a 0 vidas queda eliminado.
   Cuando solo queda un equipo con vidas, gana la partida.
7. Desde la pantalla final, el anfitrión puede tocar **"Jugar de nuevo"** para
   resetear la misma sala (mismo código, mismos jugadores) y volver a sortear.

## 4. Editar o agregar preguntas

Todo el banco de preguntas está en `src/data/questions.ts`. Hay tres formas
(mira `src/types.ts` para la forma exacta de cada una):

- `multiple-choice`: `prompt`, `options` (4 opciones) y `correctIndex`.
- `true-false`: `prompt` y `correctAnswer` (`true`/`false`).
- `order`: `prompt` y `steps` en el orden correcto (se mezclan al mostrarse).

Todas llevan además `id` (único) y `explanation` (se muestra al revelar el
resultado). Agrega, edita o borra las que quieras: la app las toma
automáticamente. Ahora mismo se habilitan los tres tipos por defecto en
`Host.tsx` (constante `ALL_TYPES`); si quieres jugar solo con un tipo, edita
esa lista.

## 5. Estructura del proyecto

```
src/
  types.ts              Tipos y constantes del juego (equipos, vidas, etc.)
  data/questions.ts      Banco de preguntas
  lib/gameEngine.ts       Lógica pura: sorteo, turnos, corrección de respuestas
  lib/roomService.ts      Lecturas/escrituras a Firebase (crear sala, unirse, etc.)
  lib/roomCode.ts         Generador de código de sala y de id de jugador
  hooks/useRoom.ts        Suscripción en tiempo real al estado de una sala
  hooks/usePlayerId.ts    Id estable del jugador guardado en el celular
  components/            Piezas visuales reutilizables (corazones, chip de equipo)
  screens/Host.tsx        Pantalla del anfitrión (lobby, tablero, resultado, final)
  screens/Player.tsx      Pantalla del jugador (unirse, responder, resultado)
```

`gameEngine.ts` no depende de Firebase — son funciones puras, así que se
pueden probar o reutilizar aparte si más adelante quieres, por ejemplo,
guardar el historial de partidas en otro lado.

## 6. Ideas para seguir construyendo

- Reglas de seguridad de Firebase más estrictas para producción.
- Un "capitán" por equipo en vez de que cualquiera pueda responder primero.
- Marcador histórico entre partidas (guardar resultados en otra tabla).
- Sonidos y animaciones de vidas perdidas/ganadas.
- El reto de "identificar imagen" que quedó pendiente del diseño original.
