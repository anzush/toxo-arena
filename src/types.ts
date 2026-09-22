export type TeamId = "rojo" | "azul" | "verde";

export type RoleId = "tripulante" | "impostor" | "medico" | "chaman" | "saboteador";

export interface PlayerState {
  name: string;
  joinedAt: number;
  team: TeamId | null;
  role: RoleId | null;
  lives: number; // 0..STARTING_LIVES_PER_PLAYER
  shielded: boolean; // protege la próxima vez que este jugador iba a perder una vida
  powerUsed: boolean; // solo importa para médico/chamán: ya gastaron su poder de un solo uso
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

export interface CurrentChallenge {
  questionId: string;
  type: ChallengeType;
  startedAt: number;
  deadline: number;
  answers: Record<string, SubmittedAnswer>;
  revealed: boolean;
  roundWinnerPlayerId: string | null;
  pendingPower: PendingPower | null;
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
export const CHALLENGE_SECONDS = 20;
export const POWER_SECONDS = 15;
