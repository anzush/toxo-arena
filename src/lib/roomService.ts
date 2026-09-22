import { get, onValue, ref, runTransaction, set, update } from "firebase/database";
import { db } from "../firebase";
import { AnswerPayload, ChallengeType, RoomState } from "../types";
import {
  applyPower,
  assignPlayersToTeams,
  checkWinner,
  createEmptyTeams,
  eligibleTargets,
  getQuestionById,
  pickRandomQuestion,
  resolveRound as resolveRoundPure,
  shuffle
} from "./gameEngine";
import { generateRoomCode } from "./roomCode";

function roomRef(code: string) {
  return ref(db, `rooms/${code}`);
}

export async function createRoom(allowedTypes: ChallengeType[]): Promise<string> {
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
      currentChallenge: null,
      usedQuestionIds: [],
      winnerTeamId: null
    };
    await set(roomRef(code), room);
    return code;
  }
  throw new Error("No se pudo crear la sala, intenta de nuevo.");
}

export function subscribeToRoom(code: string, callback: (room: RoomState | null) => void): () => void {
  return onValue(roomRef(code), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as RoomState) : null);
  });
}

export async function roomExists(code: string): Promise<boolean> {
  const snapshot = await get(roomRef(code));
  return snapshot.exists();
}

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
    team: null,
    role: null,
    lives: 0,
    shielded: false,
    powerUsed: false
  });
}

/** El anfitrión sortea equipos Y roles al mismo tiempo, y arranca la partida. */
export async function startSorteoYJuego(code: string): Promise<void> {
  const snapshot = await get(roomRef(code));
  if (!snapshot.exists()) return;
  const room = snapshot.val() as RoomState;

  const { teams, players } = assignPlayersToTeams(room.players ?? {});

  await update(roomRef(code), { teams, players, status: "playing" });
}

/** Lanza una pregunta para TODOS los jugadores vivos al mismo tiempo. */
export async function startNextChallenge(code: string): Promise<"ok" | "sin-preguntas"> {
  const snapshot = await get(roomRef(code));
  if (!snapshot.exists()) return "ok";
  const room = snapshot.val() as RoomState;

  const question = pickRandomQuestion(room.usedQuestionIds ?? [], room.allowedTypes);
  if (!question) return "sin-preguntas";

  const now = Date.now();
  await update(roomRef(code), {
    currentChallenge: {
      questionId: question.id,
      type: question.type,
      startedAt: now,
      deadline: now + 20_000,
      answers: {},
      revealed: false,
      roundWinnerPlayerId: null,
      pendingPower: null
    },
    usedQuestionIds: [...(room.usedQuestionIds ?? []), question.id]
  });
  return "ok";
}

/** Cada jugador manda su propia respuesta (todos responden la misma pregunta a la vez). */
export async function submitAnswer(code: string, playerId: string, payload: AnswerPayload): Promise<void> {
  const answerRef = ref(db, `rooms/${code}/currentChallenge/answers/${playerId}`);
  await runTransaction(answerRef, (current) => {
    if (current) return current; // ya había respuesta, no se pisa
    return { payload, submittedAt: Date.now(), correct: null };
  });
}

/**
 * Cierra la ronda: a quien falló o no respondió le quita una vida (o le
 * consume el escudo), y calcula quién ganó el poder de esta ronda.
 */
export async function resolveRound(code: string): Promise<void> {
  const snapshot = await get(roomRef(code));
  if (!snapshot.exists()) return;
  const room = snapshot.val() as RoomState;
  const challenge = room.currentChallenge;
  if (!challenge || challenge.revealed) return;

  const question = getQuestionById(challenge.questionId);
  if (!question) return;

  const { players, answers, pendingPower } = resolveRoundPure(room, question, Date.now());
  const winner = checkWinner(room.teams, players);

  await update(roomRef(code), {
    players,
    "currentChallenge/answers": answers,
    "currentChallenge/revealed": true,
    "currentChallenge/roundWinnerPlayerId": pendingPower?.playerId ?? null,
    "currentChallenge/pendingPower": winner.finished ? null : pendingPower,
    status: winner.finished ? "finished" : room.status,
    winnerTeamId: winner.finished ? winner.winnerTeamId : (room.winnerTeamId ?? null)
  });
}

/** Quien ganó la ronda elige a quién le aplica su poder. */
export async function submitPowerTarget(code: string, playerId: string, targetId: string): Promise<void> {
  const powerRef = ref(db, `rooms/${code}/currentChallenge/pendingPower`);
  await runTransaction(powerRef, (current) => {
    if (!current) return current;
    if (current.resolved || current.targetPlayerId) return current;
    if (current.playerId !== playerId) return current;
    current.targetPlayerId = targetId;
    return current;
  });
}

/** Aplica el efecto del poder (con el objetivo elegido, o uno al azar si se acabó el tiempo). */
export async function resolvePower(code: string): Promise<void> {
  const snapshot = await get(roomRef(code));
  if (!snapshot.exists()) return;
  const room = snapshot.val() as RoomState;
  const pendingPower = room.currentChallenge?.pendingPower;
  if (!pendingPower || pendingPower.resolved) return;

  const { targets } = eligibleTargets(room, pendingPower);
  const targetId = pendingPower.targetPlayerId ?? (targets.length > 0 ? shuffle(targets)[0] : null);

  const players = targetId ? applyPower(room, pendingPower, targetId) : room.players;
  const winner = checkWinner(room.teams, players);

  await update(roomRef(code), {
    players,
    "currentChallenge/pendingPower/resolved": true,
    "currentChallenge/pendingPower/targetPlayerId": targetId,
    status: winner.finished ? "finished" : room.status,
    winnerTeamId: winner.finished ? winner.winnerTeamId : (room.winnerTeamId ?? null)
  });
}

/** Reinicia la sala a un lobby limpio conservando a los jugadores conectados. */
export async function playAgain(code: string): Promise<void> {
  const snapshot = await get(roomRef(code));
  if (!snapshot.exists()) return;
  const room = snapshot.val() as RoomState;

  const resetPlayers = Object.fromEntries(
    Object.entries(room.players ?? {}).map(([id, p]) => [
      id,
      { ...p, team: null, role: null, lives: 0, shielded: false, powerUsed: false }
    ])
  );

  await update(roomRef(code), {
    status: "lobby",
    teams: createEmptyTeams(),
    players: resetPlayers,
    currentChallenge: null,
    usedQuestionIds: [],
    winnerTeamId: null
  });
}
