import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Hearts } from "../components/Hearts";
import { TeamPill } from "../components/TeamPill";
import { usePlayerId } from "../hooks/usePlayerId";
import { useRoom } from "../hooks/useRoom";
import { getQuestionById } from "../lib/gameEngine";
import { joinRoom, roomExists, submitAnswer } from "../lib/roomService";
import { AnswerPayload, MultipleChoiceQuestion, OrderQuestion, TrueFalseQuestion } from "../types";

const ROOM_KEY = "toxo-arena-player-room";
const NAME_KEY = "toxo-arena-player-name";

export function Player({ onExit }: { onExit: () => void }) {
  const playerId = usePlayerId();
  const [roomCode, setRoomCode] = useState<string | null>(() => localStorage.getItem(ROOM_KEY));
  const { room, loading } = useRoom(roomCode);

  if (!roomCode || (!loading && !room)) {
    return <JoinForm playerId={playerId} onJoined={setRoomCode} onExit={onExit} />;
  }

  if (loading || !room) {
    return <Centered>Conectando con la sala&hellip;</Centered>;
  }

  const me = room.players[playerId];
  if (!me) {
    // Nuestro id no está en esta sala (sala nueva, u otro navegador). Volver a unirse.
    return <JoinForm playerId={playerId} onJoined={setRoomCode} onExit={onExit} />;
  }

  function leaveRoom() {
    localStorage.removeItem(ROOM_KEY);
    setRoomCode(null);
    onExit();
  }

  if (room.status === "lobby") {
    return (
      <div className="page" style={{ minHeight: "100vh", justifyContent: "center" }}>
        <Header name={me.name} code={room.code} onLeave={leaveRoom} />
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, textAlign: "center" }}>
          Esperando a que el anfitrión sortee los equipos&hellip;
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
          {Object.keys(room.players).length} jugador(es) en la sala
        </div>
      </div>
    );
  }

  const myTeamId = me.team;
  const myTeam = myTeamId ? room.teams[myTeamId] : null;

  if (room.status === "finished") {
    const isWinner = room.winnerTeamId === myTeamId;
    return (
      <div className="page" style={{ minHeight: "100vh", justifyContent: "center" }}>
        <Header name={me.name} code={room.code} onLeave={leaveRoom} />
        <div style={{ fontSize: 48 }}>{isWinner ? "🏆" : "🎮"}</div>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, textAlign: "center" }}>
          {isWinner
            ? "¡Tu equipo ganó la partida!"
            : `Ganó ${room.winnerTeamId ? room.teams[room.winnerTeamId].name : "otro equipo"}`}
        </div>
      </div>
    );
  }

  if (!myTeam) {
    return <Centered>No quedaste asignado a un equipo todavía.</Centered>;
  }

  if (myTeam.lives === 0) {
    return (
      <div className="page" style={{ minHeight: "100vh", justifyContent: "center" }}>
        <Header name={me.name} code={room.code} onLeave={leaveRoom} />
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, color: "var(--danger)", textAlign: "center" }}>
          {myTeam.name} fue eliminado
        </div>
        <Hearts lives={0} />
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Puedes seguir viendo cómo termina la partida.</div>
      </div>
    );
  }

  const challenge = room.currentChallenge;
  const isMyTurn = !!challenge && challenge.teamId === myTeamId;
  const turnTeamId = room.turnOrder[room.currentTurnIndex];

  return (
    <div className="page" style={{ minHeight: "100vh", justifyContent: "flex-start" }}>
      <Header name={me.name} code={room.code} onLeave={leaveRoom} />
      <TeamPill team={myTeam} highlighted />

      {!challenge && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22 }}>
            {isMyTurn
              ? "¡Prepárate! El siguiente reto es para tu equipo."
              : `Le toca a ${room.teams[turnTeamId].name}. Espera tu turno.`}
          </div>
        </div>
      )}

      {challenge && (
        <ChallengeArea
          roomCode={room.code}
          playerId={playerId}
          isMyTurn={isMyTurn}
          answeredByMe={challenge.answeredBy === playerId}
          challenge={challenge}
        />
      )}
    </div>
  );
}

function Header({ name, code, onLeave }: { name: string; code: string; onLeave: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 480 }}>
      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
        {name} · sala {code}
      </div>
      <button onClick={onLeave} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13 }}>
        Salir
      </button>
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="page" style={{ minHeight: "100vh", justifyContent: "center", textAlign: "center" }}>
      {children}
    </div>
  );
}

function JoinForm({
  playerId,
  onJoined,
  onExit
}: {
  playerId: string;
  onJoined: (code: string) => void;
  onExit: () => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleJoin() {
    setError(null);
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    if (trimmedCode.length < 3) return setError("Escribe el código de la sala.");
    if (!trimmedName) return setError("Escribe tu nombre.");

    setBusy(true);
    try {
      const exists = await roomExists(trimmedCode);
      if (!exists) throw new Error("No encontramos esa sala. Revisa el código.");
      await joinRoom(trimmedCode, playerId, trimmedName);
      localStorage.setItem(ROOM_KEY, trimmedCode);
      localStorage.setItem(NAME_KEY, trimmedName);
      onJoined(trimmedCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo unir a la sala.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page" style={{ minHeight: "100vh", justifyContent: "center" }}>
      <h1 style={{ fontSize: 26 }}>Unirse a la partida</h1>
      <div className="card" style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 18 }}>
        <label style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Código de sala
          <input
            className="text-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej. R7K2Q"
            maxLength={6}
            autoCapitalize="characters"
          />
        </label>
        <label style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Tu nombre
          <input
            className="text-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Andrés"
            maxLength={24}
          />
        </label>
        {error && <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>}
        <button className="btn-primary" onClick={handleJoin} disabled={busy}>
          {busy ? "Uniendo..." : "Unirme"}
        </button>
      </div>
      <button onClick={onExit} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13 }}>
        &larr; Volver
      </button>
    </div>
  );
}

function ChallengeArea({
  roomCode,
  playerId,
  isMyTurn,
  answeredByMe,
  challenge
}: {
  roomCode: string;
  playerId: string;
  isMyTurn: boolean;
  answeredByMe: boolean;
  challenge: NonNullable<import("../types").RoomState["currentChallenge"]>;
}) {
  const question = useMemo(() => getQuestionById(challenge.questionId), [challenge.questionId]);
  if (!question) return null;

  async function send(payload: AnswerPayload) {
    await submitAnswer(roomCode, playerId, payload);
  }

  if (challenge.revealed) {
    return (
      <div className="card" style={{ width: "100%", maxWidth: 480, marginTop: 24, textAlign: "center" }}>
        <div
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 26,
            color: challenge.isCorrect ? "var(--success)" : "var(--danger)",
            marginBottom: 10
          }}
        >
          {challenge.isCorrect ? "¡Correcto!" : "Incorrecto"}
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 15 }}>{question.explanation}</div>
      </div>
    );
  }

  if (!isMyTurn) {
    return (
      <div className="card" style={{ width: "100%", maxWidth: 480, marginTop: 24 }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>Reto en curso para otro equipo</div>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18 }}>{question.prompt}</div>
      </div>
    );
  }

  if (answeredByMe || challenge.answeredBy) {
    return (
      <div className="card" style={{ width: "100%", maxWidth: 480, marginTop: 24, textAlign: "center" }}>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20 }}>Respuesta enviada</div>
        <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 8 }}>
          Esperando a que el anfitrión revele el resultado&hellip;
        </div>
      </div>
    );
  }

  if (question.type === "multiple-choice") {
    return <MultipleChoiceForm question={question} onSubmit={(index) => send({ type: "multiple-choice", index })} />;
  }
  if (question.type === "true-false") {
    return <TrueFalseForm question={question} onSubmit={(value) => send({ type: "true-false", value })} />;
  }
  return <OrderForm question={question} onSubmit={(steps) => send({ type: "order", steps })} />;
}

function MultipleChoiceForm({
  question,
  onSubmit
}: {
  question: MultipleChoiceQuestion;
  onSubmit: (index: number) => void;
}) {
  return (
    <div className="card" style={{ width: "100%", maxWidth: 480, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 19, lineHeight: 1.4 }}>{question.prompt}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSubmit(index)}
            style={{
              background: "var(--surface-2)",
              border: "2px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              padding: 16,
              color: "var(--text)",
              fontSize: 16,
              fontWeight: 600,
              textAlign: "left"
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function TrueFalseForm({ question, onSubmit }: { question: TrueFalseQuestion; onSubmit: (value: boolean) => void }) {
  return (
    <div className="card" style={{ width: "100%", maxWidth: 480, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 19, lineHeight: 1.4 }}>{question.prompt}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button
          onClick={() => onSubmit(true)}
          style={{ background: "var(--surface-2)", border: "2px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 18, color: "var(--text)", fontSize: 16, fontWeight: 700 }}
        >
          Verdadero
        </button>
        <button
          onClick={() => onSubmit(false)}
          style={{ background: "var(--surface-2)", border: "2px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 18, color: "var(--text)", fontSize: 16, fontWeight: 700 }}
        >
          Falso
        </button>
      </div>
    </div>
  );
}

function OrderForm({ question, onSubmit }: { question: OrderQuestion; onSubmit: (steps: string[]) => void }) {
  const [steps, setSteps] = useState<string[]>(() => shuffleOnce(question.steps));

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next);
  }

  return (
    <div className="card" style={{ width: "100%", maxWidth: 480, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, lineHeight: 1.4 }}>{question.prompt}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Usa las flechas para poner los pasos en el orden correcto.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((step, index) => (
          <div
            key={step}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "var(--surface-2)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              padding: 12
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                flex: "none"
              }}
            >
              {index + 1}
            </div>
            <div style={{ flex: 1, fontSize: 14 }}>{step}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <button onClick={() => move(index, -1)} disabled={index === 0} style={arrowBtnStyle}>
                ▲
              </button>
              <button onClick={() => move(index, 1)} disabled={index === steps.length - 1} style={arrowBtnStyle}>
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={() => onSubmit(steps)}>
        Enviar orden
      </button>
    </div>
  );
}

const arrowBtnStyle: CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "none",
  color: "var(--text)",
  width: 26,
  height: 20,
  borderRadius: 6,
  fontSize: 10
};

function shuffleOnce<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
