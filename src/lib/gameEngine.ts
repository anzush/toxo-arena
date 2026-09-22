import { randomRole } from "../data/roles";
import { QUESTIONS } from "../data/questions";
import {
  AnswerPayload,
  ChallengeType,
  CurrentChallenge,
  ExtraSkillUse,
  HIBERNATE_BONUS_MS,
  MultipleChoiceQuestion,
  PEEK_SUCCESS_CHANCE,
  PendingPower,
  PlayerState,
  Question,
  RoleId,
  RoomState,
  ROUND_WIN_STREAK_BONUS,
  RUSH_CUT_MS,
  STARTING_LIVES_PER_PLAYER,
  STEAL_SUCCESS_CHANCE,
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
      roundWinStreak: 0,
      infiltradoFor: null,
      groupShieldUsed: false
    };
  });

  // Todo Gato (id interno "impostor") juega visiblemente en su equipo pero
  // en secreto gana para otro — nadie lo sabe hasta el final.
  for (const id of playerIds) {
    if (updatedPlayers[id].role !== "impostor") continue;
    const visibleTeam = updatedPlayers[id].team as TeamId;
    const otherTeams = TEAM_IDS.filter((t) => t !== visibleTeam);
    const secretTeam = otherTeams[Math.floor(Math.random() * otherTeams.length)];
    updatedPlayers[id] = { ...updatedPlayers[id], infiltradoFor: secretTeam };
  }

  return { teams, players: updatedPlayers };
}

/**
 * Si el equipo que acaba de ganar tiene entre sus filas a un infiltrado
 * que sigue vivo, el crédito de la victoria es para el equipo secreto de
 * ese infiltrado, no para el equipo visible.
 */
export function resolveActualWinner(
  players: Record<string, PlayerState>,
  visibleWinnerTeamId: TeamId | null
): TeamId | null {
  if (!visibleWinnerTeamId) return visibleWinnerTeamId;
  const livingInfiltrado = Object.values(players).find(
    (p) => p.infiltradoFor !== null && isAlive(p)
  );
  return livingInfiltrado?.infiltradoFor ?? visibleWinnerTeamId;
}

/** Si hubo un infiltrado esta partida, lo encuentra — para revelarlo al terminar. */
export function findInfiltrado(
  players: Record<string, PlayerState>
): { id: string; player: PlayerState } | null {
  const entry = Object.entries(players).find(([, p]) => p.infiltradoFor !== null);
  return entry ? { id: entry[0], player: entry[1] } : null;
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

/** Rivales vivos (de cualquier otro equipo) para las habilidades extra. */
export function rivalPlayerIds(room: RoomState, playerId: string): string[] {
  const player = room.players[playerId];
  if (!player?.team) return [];
  return TEAM_IDS.filter((id) => id !== player.team).flatMap((id) =>
    teamPlayers(id, room.teams, room.players)
      .filter((x) => isAlive(x.player))
      .map((x) => x.id)
  );
}

/** Compañeros de equipo vivos, incluyéndose a uno mismo, para la cura del Linfocito. */
export function teammatePlayerIds(room: RoomState, playerId: string): string[] {
  const player = room.players[playerId];
  if (!player?.team) return [];
  return teamPlayers(player.team, room.teams, room.players)
    .filter((x) => isAlive(x.player))
    .map((x) => x.id);
}

/**
 * true si esta ronda el Linfocito protegió a este jugador — ya sea con una
 * cura directa, o porque inmunizó a todo el equipo (una vez por partida).
 * Cubre robo, sabotaje y apuro por igual.
 */
export function isProtected(
  room: RoomState,
  challenge: CurrentChallenge | null | undefined,
  playerId: string
): boolean {
  if (!challenge) return false;
  const team = room.players[playerId]?.team;
  for (const [healerId, use] of Object.entries(challenge.extraSkills ?? {})) {
    if (use.type === "cure" && use.targetId === playerId) return true;
    if (use.type === "immunize" && team && room.players[healerId]?.team === team) return true;
  }
  return false;
}

/** true si a este jugador lo sabotearon esta ronda y no está protegido. */
export function isSabotaged(
  room: RoomState,
  challenge: CurrentChallenge | null | undefined,
  playerId: string
): boolean {
  if (!challenge) return false;
  if (isProtected(room, challenge, playerId)) return false;
  return Object.values(challenge.extraSkills ?? {}).some((u) => u.type === "sabotage" && u.targetId === playerId);
}

/** Cuántos ms le recorta el Taquizoíto al cronómetro visible de este jugador, si lo apuraron y no está protegido. */
export function rushPenaltyMs(
  room: RoomState,
  challenge: CurrentChallenge | null | undefined,
  playerId: string
): number {
  if (!challenge) return 0;
  if (isProtected(room, challenge, playerId)) return 0;
  const rushed = Object.values(challenge.extraSkills ?? {}).some(
    (u) => u.type === "rush" && u.targetId === playerId
  );
  return rushed ? RUSH_CUT_MS : 0;
}

/** Cuántos ms extra se dio a sí mismo este jugador al hibernar (Bradizoíto), si usó esa habilidad. */
export function hibernateBonusMs(challenge: CurrentChallenge | null | undefined, playerId: string): number {
  const use = challenge?.extraSkills?.[playerId];
  return use?.type === "hibernate" ? HIBERNATE_BONUS_MS : 0;
}

/** Elige 2 opciones incorrectas al azar para el 50/50 del Bradizoíto. */
export function pickWrongOptionsToEliminate(question: MultipleChoiceQuestion): number[] {
  const wrongIndices = question.options.map((_, i) => i).filter((i) => i !== question.correctIndex);
  return shuffle(wrongIndices).slice(0, 2);
}

/** Sortea si el espionaje de respuesta del Hospedador funciona. */
export function rollPeekSuccess(): boolean {
  return Math.random() < PEEK_SUCCESS_CHANCE;
}

/** Índices que este jugador se eliminó a sí mismo con su 50/50 (si usó esa habilidad). */
export function myEliminatedIndices(challenge: CurrentChallenge | null | undefined, playerId: string): number[] {
  const use = challenge?.extraSkills?.[playerId];
  return use?.type === "eliminate" ? (use.eliminatedIndices ?? []) : [];
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
  extraSkills: Record<string, ExtraSkillUse>;
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

  // Robo de respuesta (Gato): si el Linfocito no protegió al objetivo (cura
  // directa o inmunización de todo su equipo) y el robo tiene éxito (según
  // su probabilidad), el ladrón juzga su ronda con la respuesta del
  // objetivo, y el objetivo cuenta como que no respondió — sin importar lo
  // que de verdad haya puesto.
  const effectiveAnswers: Record<string, SubmittedAnswer | undefined> = { ...challenge.answers };
  const robbedIds = new Set<string>();
  const extraSkills: Record<string, ExtraSkillUse> = {};
  for (const [userId, use] of Object.entries(challenge.extraSkills ?? {})) {
    extraSkills[userId] = { ...use };
  }

  for (const [thiefId, use] of Object.entries(challenge.extraSkills ?? {})) {
    if (use.type !== "steal") continue;
    if (isProtected(room, challenge, use.targetId)) {
      extraSkills[thiefId].success = false;
      continue;
    }
    if (robbedIds.has(use.targetId)) {
      extraSkills[thiefId].success = false;
      continue; // no se roba dos veces la misma respuesta
    }
    const stolenAnswer = challenge.answers?.[use.targetId];
    if (!stolenAnswer || Math.random() >= STEAL_SUCCESS_CHANCE) {
      extraSkills[thiefId].success = false;
      continue;
    }

    effectiveAnswers[thiefId] = stolenAnswer;
    robbedIds.add(use.targetId);
    extraSkills[thiefId].success = true;
  }

  let winnerId: string | null = null;
  let winnerAt = Infinity;

  for (const [playerId, player] of Object.entries(room.players)) {
    if (!isAlive(player)) continue; // no jugaba esta ronda

    const submitted = robbedIds.has(playerId) ? undefined : effectiveAnswers[playerId];
    const correct = !!submitted && checkAnswer(question, submitted.payload);

    if (submitted) {
      // Si el jugador no tenía su propia respuesta guardada (ganó la ronda
      // solo con la robada), adopta esa respuesta; si sí tenía la suya,
      // conserva lo que puso pero con el resultado ya corregido.
      answers[playerId] = { ...(challenge.answers?.[playerId] ?? submitted), ...submitted, correct };
    } else if (robbedIds.has(playerId) && challenge.answers?.[playerId]) {
      answers[playerId] = { ...challenge.answers[playerId], correct: false };
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

  return { players, answers, pendingPower, extraSkills };
}

export interface EligibleTargets {
  effectiveRole: RoleId;
  targets: string[];
}

/**
 * Según el rol de quien ganó la ronda (y si ya gastó su poder de un solo
 * uso), calcula a quién puede apuntar. Linfocito y Bradizoíto, si ya no
 * tienen su poder especial disponible, caen de vuelta al ataque simple de
 * Hospedador para que su turno nunca se desperdicie.
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

  return { effectiveRole: pendingPower.role === "parasito" ? "parasito" : "tripulante", targets: rivals };
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
