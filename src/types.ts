export type TeamId = "rojo" | "azul" | "verde";

export interface TeamState {
  name: string;
  color: string;
  lives: number;
  playerIds: string[];
}

export interface PlayerState {
  name: string;
  joinedAt: number;
  team: TeamId | null;
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
  // steps en el orden correcto; al jugador se le muestran mezclados
  steps: string[];
}

export type Question = MultipleChoiceQuestion | TrueFalseQuestion | OrderQuestion;

// Lo que el jugador manda al responder, según el tipo de reto
export type AnswerPayload =
  | { type: "multiple-choice"; index: number }
  | { type: "true-false"; value: boolean }
  | { type: "order"; steps: string[] };

export type RoomStatus = "lobby" | "playing" | "finished";

export interface CurrentChallenge {
  questionId: string;
  type: ChallengeType;
  teamId: TeamId;
  startedAt: number;
  answeredBy: string | null;
  answerPayload: AnswerPayload | null;
  isCorrect: boolean | null;
  revealed: boolean;
}

export interface RoomState {
  code: string;
  createdAt: number;
  status: RoomStatus;
  allowedTypes: ChallengeType[];
  teams: Record<TeamId, TeamState>;
  players: Record<string, PlayerState>;
  turnOrder: TeamId[];
  currentTurnIndex: number;
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

export const STARTING_LIVES = 5;
export const CHALLENGE_SECONDS = 20;
