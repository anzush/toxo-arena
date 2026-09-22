import { QUESTIONS } from "../data/questions";
import {
  AnswerPayload,
  ChallengeType,
  PlayerState,
  Question,
  RoomState,
  STARTING_LIVES,
  TEAM_IDS,
  TEAM_META,
  TeamId,
  TeamState
} from "../types";

/** Baraja un array sin mutar el original (Fisher-Yates). */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createEmptyTeams(): Record<TeamId, TeamState> {
  const teams = {} as Record<TeamId, TeamState>;
  for (const id of TEAM_IDS) {
    teams[id] = {
      name: TEAM_META[id].name,
      color: TEAM_META[id].color,
      lives: STARTING_LIVES,
      playerIds: []
    };
  }
  return teams;
}

/**
 * Reparte aleatoriamente los jugadores conectados entre los 3 equipos,
 * lo más parejo posible (esto es "la gracia" del sorteo).
 */
export function assignPlayersToTeams(
  players: Record<string, PlayerState>
): { teams: Record<TeamId, TeamState>; players: Record<string, PlayerState> } {
  const teams = createEmptyTeams();
  const playerIds = shuffle(Object.keys(players));

  const updatedPlayers: Record<string, PlayerState> = { ...players };

  playerIds.forEach((playerId, index) => {
    const teamId = TEAM_IDS[index % TEAM_IDS.length];
    teams[teamId].playerIds.push(playerId);
    updatedPlayers[playerId] = { ...updatedPlayers[playerId], team: teamId };
  });

  return { teams, players: updatedPlayers };
}

export function aliveTeams(teams: Record<TeamId, TeamState>): TeamId[] {
  return TEAM_IDS.filter((id) => teams[id].lives > 0);
}

/** Da el siguiente equipo vivo en el orden de turnos, empezando desde el índice dado. */
export function nextAliveTeamIndex(
  turnOrder: TeamId[],
  teams: Record<TeamId, TeamState>,
  fromIndex: number
): number {
  for (let step = 1; step <= turnOrder.length; step++) {
    const idx = (fromIndex + step) % turnOrder.length;
    if (teams[turnOrder[idx]].lives > 0) return idx;
  }
  return fromIndex;
}

/** Elige una pregunta al azar de un tipo permitido que no se haya usado todavía. */
export function pickRandomQuestion(
  usedQuestionIds: string[],
  allowedTypes: ChallengeType[]
): Question | null {
  const pool = QUESTIONS.filter(
    (q) => allowedTypes.includes(q.type) && !usedQuestionIds.includes(q.id)
  );
  if (pool.length === 0) return null;
  const shuffled = shuffle(pool);
  return shuffled[0];
}

export function getQuestionById(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

/** Compara la respuesta enviada contra la pregunta y dice si fue correcta. */
export function checkAnswer(question: Question, payload: AnswerPayload): boolean {
  if (question.type === "multiple-choice" && payload.type === "multiple-choice") {
    return payload.index === question.correctIndex;
  }
  if (question.type === "true-false" && payload.type === "true-false") {
    return payload.value === question.correctAnswer;
  }
  if (question.type === "order" && payload.type === "order") {
    if (payload.steps.length !== question.steps.length) return false;
    return payload.steps.every((step, i) => step === question.steps[i]);
  }
  return false;
}

export interface ResolveResult {
  teams: Record<TeamId, TeamState>;
  eliminatedTeamId: TeamId | null;
  winnerTeamId: TeamId | null;
  nextTurnIndex: number;
}

/**
 * Aplica el resultado de un reto: si falló, resta una vida a su equipo,
 * revisa si quedó eliminado y si ya hay un equipo ganador, y calcula
 * a quién le toca el siguiente turno.
 */
export function resolveChallenge(room: RoomState, isCorrect: boolean): ResolveResult {
  const teamId = room.currentChallenge!.teamId;
  const teams: Record<TeamId, TeamState> = {
    ...room.teams,
    [teamId]: { ...room.teams[teamId] }
  };

  if (!isCorrect) {
    teams[teamId].lives = Math.max(0, teams[teamId].lives - 1);
  }

  const eliminatedTeamId = teams[teamId].lives === 0 ? teamId : null;
  const alive = aliveTeams(teams);
  const winnerTeamId = alive.length === 1 ? alive[0] : null;

  const nextTurnIndex = winnerTeamId
    ? room.currentTurnIndex
    : nextAliveTeamIndex(room.turnOrder, teams, room.currentTurnIndex);

  return { teams, eliminatedTeamId, winnerTeamId, nextTurnIndex };
}
