import { randomRole } from "../data/roles";
import { QUESTIONS } from "../data/questions";
import {
  AnswerPayload,
  ChallengeType,
  PendingPower,
  PlayerState,
  Question,
  RoleId,
  RoomState,
  ROUND_WIN_STREAK_BONUS,
  STARTING_LIVES_PER_PLAYER,
  SubmittedAnswer,
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
    teams[id] = { name: TEAM_META[id].name, color: TEAM_META[id].color, playerIds: [] };
  }
  return teams;
}

/**
 * Reparte a los jugadores al azar entre los 3 equipos y a cada uno le
 * asigna también un rol al azar (con sus vidas propias). Esta es "la
 * gracia" del sorteo: nadie sabe qué le tocó a los demás.
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
    updatedPlayers[playerId] = {
      ...updatedPlayers[playerId],
      team: teamId,
      role: randomRole(),
      lives: STARTING_LIVES_PER_PLAYER,
      shielded: false,
      powerUsed: false,
      roundWinStreak: 0
    };
  });

  return { teams, players: updatedPlayers };
}

export function isAlive(player: PlayerState | undefined | null): boolean {
  return !!player && player.team !== null && player.lives > 0;
}

export function teamPlayers(teamId: TeamId, teams: Record<TeamId, TeamState>, players: Record<string, PlayerState>) {
  return teams[teamId].playerIds.map((id) => ({ id, player: players[id] })).filter((x) => !!x.player);
}

export function aliveTeams(teams: Record<TeamId, TeamState>, players: Record<string, PlayerState>): TeamId[] {
  return TEAM_IDS.filter((id) => teams[id].playerIds.some((pid) => isAlive(players[pid])));
}

export interface WinnerCheck {
  finished: boolean;
  winnerTeamId: TeamId | null;
}

export function checkWinner(teams: Record<TeamId, TeamState>, players: Record<string, PlayerState>): WinnerCheck {
  const alive = aliveTeams(teams, players);
  if (alive.length <= 1) {
    return { finished: true, winnerTeamId: alive[0] ?? null };
  }
  return { finished: false, winnerTeamId: null };
}

export function pickRandomQuestion(usedQuestionIds: string[], allowedTypes: ChallengeType[]): Question | null {
  const pool = QUESTIONS.filter((q) => allowedTypes.includes(q.type) && !usedQuestionIds.includes(q.id));
  if (pool.length === 0) return null;
  return shuffle(pool)[0];
}

export function getQuestionById(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

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

export interface RoundResolution {
  players: Record<string, PlayerState>;
  answers: Record<string, SubmittedAnswer>;
  pendingPower: PendingPower | null;
}

/**
 * Cierra la ronda de respuestas simultáneas: a todo el que respondió mal
 * (o no respondió a tiempo) le quita una vida propia (salvo que tenga
 * escudo), y calcula quién fue el más rápido en acertar para darle el
 * poder de su rol.
 */
export function resolveRound(room: RoomState, question: Question, now: number): RoundResolution {
  const challenge = room.currentChallenge!;
  const players: Record<string, PlayerState> = { ...room.players };
  const answers: Record<string, SubmittedAnswer> = { ...challenge.answers };

  let winnerId: string | null = null;
  let winnerAt = Infinity;

  for (const [playerId, player] of Object.entries(room.players)) {
    if (!isAlive(player)) continue; // no jugaba esta ronda

    const submitted = challenge.answers?.[playerId];
    const correct = !!submitted && checkAnswer(question, submitted.payload);

    if (submitted) {
      answers[playerId] = { ...submitted, correct };
    }

    if (correct) {
      if (submitted!.submittedAt < winnerAt) {
        winnerAt = submitted!.submittedAt;
        winnerId = playerId;
      }
    } else {
      // Falló o no respondió a tiempo: pierde una vida propia, salvo escudo.
      if (player.shielded) {
        players[playerId] = { ...player, shielded: false };
      } else {
        players[playerId] = { ...player, lives: Math.max(0, player.lives - 1) };
      }
    }
  }

  // Racha: gana la ronda = suma una; cualquier otro jugador que seguía en
  // pie pero no ganó esta ronda, rompe la que traía. Cada 3 seguidas se
  // gana una vida extra y la racha vuelve a empezar desde cero.
  for (const [playerId, player] of Object.entries(room.players)) {
    if (!isAlive(player)) continue;
    if (playerId === winnerId) {
      const streak = player.roundWinStreak + 1;
      if (streak >= ROUND_WIN_STREAK_BONUS) {
        players[playerId] = {
          ...players[playerId],
          roundWinStreak: 0,
          lives: Math.min(STARTING_LIVES_PER_PLAYER, players[playerId].lives + 1)
        };
      } else {
        players[playerId] = { ...players[playerId], roundWinStreak: streak };
      }
    } else if (player.roundWinStreak > 0) {
      players[playerId] = { ...players[playerId], roundWinStreak: 0 };
    }
  }

  let pendingPower: PendingPower | null = null;
  if (winnerId) {
    pendingPower = {
      playerId: winnerId,
      role: players[winnerId].role as RoleId,
      deadline: now + 15_000,
      targetPlayerId: null,
      resolved: false
    };
  }

  return { players, answers, pendingPower };
}

export interface EligibleTargets {
  effectiveRole: RoleId;
  targets: string[];
}

/**
 * Según el rol de quien ganó la ronda (y si ya gastó su poder de un solo
 * uso), calcula a quién puede apuntar. Médico y Chamán, si ya no tienen
 * su poder especial disponible, caen de vuelta al ataque simple de
 * Tripulante para que su turno nunca se desperdicie.
 */
export function eligibleTargets(room: RoomState, pendingPower: PendingPower): EligibleTargets {
  const winner = room.players[pendingPower.playerId];
  const winnerTeam = winner.team as TeamId;
  const rivals = TEAM_IDS.filter((id) => id !== winnerTeam).flatMap((id) =>
    teamPlayers(id, room.teams, room.players)
      .filter((x) => isAlive(x.player))
      .map((x) => x.id)
  );

  if (pendingPower.role === "medico" && !winner.powerUsed) {
    const teammates = teamPlayers(winnerTeam, room.teams, room.players)
      .filter((x) => isAlive(x.player))
      .map((x) => x.id);
    return { effectiveRole: "medico", targets: teammates };
  }

  if (pendingPower.role === "chaman" && !winner.powerUsed) {
    const eliminatedTeammates = teamPlayers(winnerTeam, room.teams, room.players)
      .filter((x) => x.player.team !== null && x.player.lives === 0)
      .map((x) => x.id);
    if (eliminatedTeammates.length > 0) {
      return { effectiveRole: "chaman", targets: eliminatedTeammates };
    }
  }

  return { effectiveRole: pendingPower.role === "impostor" || pendingPower.role === "parasito" ? pendingPower.role : "tripulante", targets: rivals };
}

/** Aplica el efecto del poder ya con un objetivo elegido (o autoasignado). */
export function applyPower(
  room: RoomState,
  pendingPower: PendingPower,
  targetId: string
): Record<string, PlayerState> {
  const { effectiveRole } = eligibleTargets(room, pendingPower);
  const players: Record<string, PlayerState> = { ...room.players };
  const winner = players[pendingPower.playerId];
  const target = players[targetId];
  if (!target) return players;

  switch (effectiveRole) {
    case "medico": {
      players[targetId] = { ...target, shielded: true };
      players[pendingPower.playerId] = { ...winner, powerUsed: true };
      break;
    }
    case "chaman": {
      players[targetId] = { ...target, lives: 1 };
      players[pendingPower.playerId] = { ...winner, powerUsed: true };
      break;
    }
    case "impostor": {
      if (target.shielded) {
        players[targetId] = { ...target, shielded: false };
      } else {
        players[targetId] = { ...target, lives: Math.max(0, target.lives - 2) };
      }
      break;
    }
    case "parasito": {
      if (target.shielded) {
        players[targetId] = { ...target, shielded: false };
      } else {
        players[targetId] = { ...target, lives: Math.max(0, target.lives - 1) };
        players[pendingPower.playerId] = {
          ...winner,
          lives: Math.min(STARTING_LIVES_PER_PLAYER, winner.lives + 1)
        };
      }
      break;
    }
    default: {
      // tripulante
      if (target.shielded) {
        players[targetId] = { ...target, shielded: false };
      } else {
        players[targetId] = { ...target, lives: Math.max(0, target.lives - 1) };
      }
    }
  }

  return players;
}
