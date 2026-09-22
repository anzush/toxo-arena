export type TeamId = "rojo" | "azul" | "verde";

export type RoleId = "tripulante" | "impostor" | "medico" | "chaman" | "parasito";

export interface PlayerState {
  name: string;
  joinedAt: number;
  team: TeamId | null;
  role: RoleId | null;
  lives: number; // 0..STARTING_LIVES_PER_PLAYER
  shielded: boolean; // protege la próxima vez que este jugador iba a perder una vida
  powerUsed: boolean; // solo importa para médico/chamán: ya gastaron su poder de un solo uso
  roundWinStreak: number; // rondas seguidas ganadas (más rápido en acertar); se rompe si no ganas la ronda
  infiltradoFor: TeamId | null; // si no es null, juega visiblemente en `team` pero gana para este equipo en secreto
  groupShieldUsed: boolean; // solo importa para el Linfocito: ya gastó su inmunización grupal (una vez por partida)
}

export interface TeamState {
  name: string;
  color: string;
  playerIds: string[];
}

export type ChallengeType = "multiple-choice" | "true-false" | "order";

interface BaseQuestion {
  id: string;
  type: ChallengeType;
  prompt: string;
  explanation: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple-choice";
  options: string[];
  correctIndex: number;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: "true-false";
  correctAnswer: boolean;
}

export interface OrderQuestion extends BaseQuestion {
  type: "order";
  steps: string[];
}

export type Question = MultipleChoiceQuestion | TrueFalseQuestion | OrderQuestion;

export type AnswerPayload =
  | { type: "multiple-choice"; index: number }
  | { type: "true-false"; value: boolean }
  | { type: "order"; steps: string[] };

export interface SubmittedAnswer {
  payload: AnswerPayload;
  submittedAt: number;
  correct: boolean | null; // se calcula al revelar; null mientras se está jugando la ronda
}

/**
 * El "poder" que gana quien responda primero y bien. Se resuelve en dos
 * pasos: primero se sabe quién ganó (y con qué rol), y luego esa persona
 * (o el sistema, si se le acaba el tiempo) elige el objetivo.
 */
export interface PendingPower {
  playerId: string;
  role: RoleId;
  deadline: number;
  targetPlayerId: string | null;
  resolved: boolean;
}

/**
 * Habilidades "extra" de cada rol: a diferencia del poder de rol normal,
 * no hace falta ganar la ronda anterior — se usan libremente mientras se
 * está respondiendo, una vez por ronda. Se guardan por el id de quien la
 * usa (no de a quién le pasa).
 */
export type ExtraSkillType = "steal" | "sabotage" | "cure" | "eliminate" | "peek" | "rush" | "hibernate" | "immunize";

export interface ExtraSkillUse {
  type: ExtraSkillType;
  targetId: string;
  success?: boolean; // "steal": se define al revelar la ronda. "peek": se define al usarla.
  eliminatedIndices?: number[]; // solo "eliminate": opciones incorrectas ocultas
}

export interface CurrentChallenge {
  questionId: string;
  type: ChallengeType;
  startedAt: number;
  deadline: number;
  answers: Record<string, SubmittedAnswer>;
  revealed: boolean;
  roundWinnerPlayerId: string | null;
  pendingPower: PendingPower | null;
  extraSkills: Record<string, ExtraSkillUse>;
}

export type RoomStatus = "lobby" | "playing" | "finished";

export interface RoomState {
  code: string;
  createdAt: number;
  status: RoomStatus;
  allowedTypes: ChallengeType[];
  teams: Record<TeamId, TeamState>;
  players: Record<string, PlayerState>;
  currentChallenge: CurrentChallenge | null;
  usedQuestionIds: string[];
  winnerTeamId: TeamId | null;
}

export const TEAM_IDS: TeamId[] = ["rojo", "azul", "verde"];

export const TEAM_META: Record<TeamId, { name: string; color: string }> = {
  rojo: { name: "Equipo Rojo", color: "#FF5A6E" },
  azul: { name: "Equipo Azul", color: "#45C7F0" },
  verde: { name: "Equipo Verde", color: "#52D68A" }
};

export const STARTING_LIVES_PER_PLAYER = 3;
export const CHALLENGE_SECONDS = 30;
export const POWER_SECONDS = 15;
export const ROUND_WIN_STREAK_BONUS = 3; // rondas seguidas ganadas que dan una vida extra
export const STEAL_SUCCESS_CHANCE = 0.2; // probabilidad de que el robo de respuesta del Gato funcione
export const PEEK_SUCCESS_CHANCE = 0.5; // probabilidad de que el espionaje de respuesta del Hospedador funcione
export const RUSH_CUT_MS = 6000; // cuánto tiempo le recorta el Taquizoíto al cronómetro visible de un rival
export const HIBERNATE_BONUS_MS = 5000; // cuánto tiempo extra se da a sí mismo el Bradizoíto al hibernar
