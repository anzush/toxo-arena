import { get, onValue, ref, runTransaction, set, update } from "firebase/database";
import { db } from "../firebase";
import {
  AnswerPayload,
  ChallengeType,
  RoomState,
  TEAM_IDS,
  TeamId
} from "../types";
import {
  assignPlayersToTeams,
  checkAnswer,
  createEmptyTeams,
  getQuestionById,
  pickRandomQuestion,
  resolveChallenge,
  shuffle
} from "./gameEngine";
import { generateRoomCode } from "./roomCode";

function roomRef(code: string) {
  return ref(db, `rooms/${code}`);
}

/** Crea una sala nueva con un código corto y devuelve ese código. */
export async function createRoom(
  allowedTypes: ChallengeType[]
): Promise<string> {
  // Reintenta si por casualidad el código ya existe.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const snapshot = await get(roomRef(code));
    if (snapshot.exists()) continue;

    const room: RoomState = {
      code,
      createdAt: Date.now(),
      status: "lobby",
      allowedTypes,
      teams: createEmptyTeams(),
      players: {},
      turnOrder: shuffle(TEAM_IDS),
      currentTurnIndex: 0,
      currentChallenge: null,
      usedQuestionIds: [],
      winnerTeamId: null
    };
    await set(roomRef(code), room);
    return code;
  }
  throw new Error("No se pudo crear la sala, intenta de nuevo.");
}

export function subscribeToRoom(
  code: string,
  callback: (room: RoomState | null) => void
): () => void {
  const unsubscribe = onValue(roomRef(code), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as RoomState) : null);
  });
  return unsubscribe;
}

export async function roomExists(code: string): Promise<boolean> {
  const snapshot = await get(roomRef(code));
  return snapshot.exists();
}

/** Un jugador entra a la sala con su nombre. Falla si la sala ya empezó. */
export async function joinRoom(code: string, playerId: string, name: string): Promise<void> {
  const snapshot = await get(roomRef(code));
  if (!snapshot.exists()) throw new Error("Esa sala no existe.");
  const room = snapshot.val() as RoomState;
  if (room.status !== "lobby") {
    throw new Error("Esta partida ya empezó, pídele al anfitrión que cree una nueva sala.");
  }
  await set(ref(db, `rooms/${code}/players/${playerId}`), {
    name,
    joinedAt: Date.now(),
    team: null
  });
}

/** El anfitrión hace el sorteo aleatorio y arranca la partida. */
export async function startSorteoYJuego(code: string): Promise<void> {
  const snapshot = await get(roomRef(code));
  if (!snapshot.exists()) return;
  const room = snapshot.val() as RoomState;

  const { teams, players } = assignPlayersToTeams(room.players ?? {});

  await update(roomRef(code), {
    teams,
    players,
    status: "playing",
    currentTurnIndex: 0
  });
}

/** El anfitrión lanza el siguiente reto para el equipo al que le toca. */
export async function startNextChallenge(code: string): Promise<"ok" | "sin-preguntas"> {
  const snapshot = await get(roomRef(code));
  if (!snapshot.exists()) return "ok";
  const room = snapshot.val() as RoomState;

  const teamId: TeamId = room.turnOrder[room.currentTurnIndex];
  const question = pickRandomQuestion(room.usedQuestionIds ?? [], room.allowedTypes);
  if (!question) return "sin-preguntas";

  await update(roomRef(code), {
    currentChallenge: {
      questionId: question.id,
      type: question.type,
      teamId,
      startedAt: Date.now(),
      answeredBy: null,
      answerPayload: null,
      isCorrect: null,
      revealed: false
    },
    usedQuestionIds: [...(room.usedQuestionIds ?? []), question.id]
  });
  return "ok";
}

/**
 * Un jugador del equipo en turno envía una respuesta. Usa una transacción
 * para que, si dos compañeros responden casi a la vez, solo la primera
 * respuesta cuente como la oficial del equipo.
 */
export async function submitAnswer(
  code: string,
  playerId: string,
  payload: AnswerPayload
): Promise<void> {
  const challengeRef = ref(db, `rooms/${code}/currentChallenge`);
  await runTransaction(challengeRef, (current) => {
    if (!current) return current;
    if (current.answeredBy) return current; // ya respondió alguien más, no tocar
    current.answeredBy = playerId;
    current.answerPayload = payload;
    return current;
  });
}

/**
 * El anfitrión revela el resultado del reto actual: si nadie respondió a
 * tiempo cuenta como incorrecto, aplica el efecto en las vidas del equipo
 * y avanza el turno (o cierra la partida si ya hay un ganador).
 */
export async function revealAndResolve(code: string): Promise<void> {
  const snapshot = await get(roomRef(code));
  if (!snapshot.exists()) return;
  const room = snapshot.val() as RoomState;
  const challenge = room.currentChallenge;
  if (!challenge || challenge.revealed) return;

  const question = getQuestionById(challenge.questionId);
  const isCorrect =
    !!question && !!challenge.answerPayload && checkAnswer(question, challenge.answerPayload);

  const { teams, winnerTeamId, nextTurnIndex } = resolveChallenge(room, isCorrect);

  await update(roomRef(code), {
    teams,
    "currentChallenge/isCorrect": isCorrect,
    "currentChallenge/revealed": true,
    winnerTeamId: winnerTeamId,
    status: winnerTeamId ? "finished" : room.status,
    currentTurnIndex: nextTurnIndex
  });
}

/** Reinicia la sala a un lobby limpio conservando a los jugadores conectados. */
export async function playAgain(code: string): Promise<void> {
  const snapshot = await get(roomRef(code));
  if (!snapshot.exists()) return;
  const room = snapshot.val() as RoomState;

  const resetPlayers = Object.fromEntries(
    Object.entries(room.players ?? {}).map(([id, p]) => [id, { ...p, team: null }])
  );

  await update(roomRef(code), {
    status: "lobby",
    teams: createEmptyTeams(),
    players: resetPlayers,
    turnOrder: shuffle(TEAM_IDS),
    currentTurnIndex: 0,
    currentChallenge: null,
    usedQuestionIds: [],
    winnerTeamId: null
  });
}
