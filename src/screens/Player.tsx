import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Ash } from "../components/Ash";
import { Confetti } from "../components/Confetti";
import { Hearts } from "../components/Hearts";
import { LifeEventOverlay } from "../components/LifeEventOverlay";
import { PlayerBean } from "../components/PlayerBean";
import { RulesExplainer } from "../components/RulesExplainer";
import { ROLES } from "../data/roles";
import { useLifeEvents } from "../hooks/useLifeEvents";
import { usePlayerId } from "../hooks/usePlayerId";
import { useRoom } from "../hooks/useRoom";
import { eligibleTargets, getQuestionById } from "../lib/gameEngine";
import {
  joinRoom,
  resolvePower,
  roomExists,
  submitAnswer,
  submitPowerTarget,
} from "../lib/roomService";
import {
  AnswerPayload,
  CurrentChallenge,
  MultipleChoiceQuestion,
  OrderQuestion,
  PendingPower,
  RoomState,
  TrueFalseQuestion,
} from "../types";

const ROOM_KEY = "toxo-arena-player-room";
const NAME_KEY = "toxo-arena-player-name";

export function Player({ onExit }: { onExit: () => void }) {
  const playerId = usePlayerId();
  const [roomCode, setRoomCode] = useState<string | null>(() =>
    localStorage.getItem(ROOM_KEY),
  );
  const { room, loading } = useRoom(roomCode);
  const lifeEvents = useLifeEvents(room?.players);
  const myEvent = lifeEvents[playerId] ?? null;

  if (!roomCode || (!loading && !room)) {
    return (
      <JoinForm playerId={playerId} onJoined={setRoomCode} onExit={onExit} />
    );
  }
  if (loading || !room) {
    return <Centered>Conectando con la sala&hellip;</Centered>;
  }

  const me = room.players[playerId];
  if (!me) {
    return (
      <JoinForm playerId={playerId} onJoined={setRoomCode} onExit={onExit} />
    );
  }

  function leaveRoom() {
    localStorage.removeItem(ROOM_KEY);
    setRoomCode(null);
    onExit();
  }

  if (room.status === "lobby") {
    return (
      <div
        className="page"
        style={{ minHeight: "100vh", justifyContent: "center" }}
      >
        <Header name={me.name} code={room.code} onLeave={leaveRoom} />
        <div
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 24,
            textAlign: "center",
          }}
        >
          Esperando a que el anfitrión sortee equipos y roles&hellip;
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
          {Object.keys(room.players).length} jugador(es) en la sala
        </div>
        <RulesExplainer />
      </div>
    );
  }

  if (room.status === "finished") {
    const myTeamId = me.team;
    const isWinner = room.winnerTeamId === myTeamId;
    return (
      <div
        className="page"
        style={{ minHeight: "100vh", justifyContent: "center" }}
      >
        <Header name={me.name} code={room.code} onLeave={leaveRoom} />
        <div className="victory-stage">
          {isWinner && myTeamId && <Confetti color={room.teams[myTeamId].color} />}
          {!isWinner && <Ash />}
          {isWinner ? (
            <div className="trophy-bounce" style={{ fontSize: 48 }}>
              🏆
            </div>
          ) : (
            <div className="bean-slump">
              <PlayerBean
                color={myTeamId ? room.teams[myTeamId].color : "#6b6580"}
                alive={true}
                size={52}
              />
            </div>
          )}
          <div
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 26,
              textAlign: "center",
            }}
          >
            {isWinner
              ? "¡Tu equipo ganó la partida!"
              : `Ganó ${room.winnerTeamId ? room.teams[room.winnerTeamId].name : "nadie"}`}
          </div>
        </div>
        {me.role && (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Tu rol era:{" "}
            <strong style={{ color: ROLES[me.role].color }}>
              {ROLES[me.role].name}
            </strong>
          </div>
        )}
      </div>
    );
  }

  if (!me.team) {
    return <Centered>No quedaste asignado a un equipo todavía.</Centered>;
  }

  if (me.lives === 0) {
    return (
      <div
        className="page"
        style={{ minHeight: "100vh", justifyContent: "center" }}
      >
        <Header name={me.name} code={room.code} onLeave={leaveRoom} />
        <LifeEventOverlay
          key={myEvent?.key}
          event={myEvent}
          teamColor={room.teams[me.team].color}
        />
        <PlayerBean color={room.teams[me.team].color} alive={false} size={72} />
        <div
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 26,
            color: "var(--danger)",
            textAlign: "center",
          }}
        >
          Fuiste eliminado
        </div>
        {me.role && (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Tu rol era:{" "}
            <strong style={{ color: ROLES[me.role].color }}>
              {ROLES[me.role].name}
            </strong>
          </div>
        )}
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Puedes seguir viendo cómo termina la partida.
        </div>
      </div>
    );
  }

  return (
    <div
      className="page"
      style={{ minHeight: "100vh", justifyContent: "flex-start" }}
    >
      <Header name={me.name} code={room.code} onLeave={leaveRoom} />
      <LifeEventOverlay
        key={myEvent?.key}
        event={myEvent}
        teamColor={room.teams[me.team].color}
      />
      <RoleBadge roleId={me.role} />
      <PlayerBean
        color={room.teams[me.team].color}
        alive={true}
        shielded={me.shielded}
        size={68}
      />
      <Hearts lives={me.lives} />

      {!room.currentChallenge && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20 }}>
            Prepárate&hellip;
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
            La próxima pregunta es para todos a la vez.
          </div>
        </div>
      )}

      {room.currentChallenge && (
        <ChallengeArea
          room={room}
          playerId={playerId}
          challenge={room.currentChallenge}
        />
      )}
    </div>
  );
}

function Header({
  name,
  code,
  onLeave,
}: {
  name: string;
  code: string;
  onLeave: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: 480,
      }}
    >
      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
        {name} · sala {code}
      </div>
      <button
        onClick={onLeave}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: 13,
        }}
      >
        Salir
      </button>
    </div>
  );
}

function RoleBadge({ roleId }: { roleId: import("../types").RoleId | null }) {
  if (!roleId) return null;
  const role = ROLES[roleId];
  return (
    <div
      className="card"
      style={{
        width: "100%",
        maxWidth: 420,
        padding: "12px 16px",
        border: `1px solid ${role.color}55`,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Tu rol secreto
      </div>
      <div
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 18,
          color: role.color,
        }}
      >
        {role.name}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
        {role.tagline}
      </div>
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div
      className="page"
      style={{
        minHeight: "100vh",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

function Countdown({ deadline }: { deadline: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  return <span>{seconds}s</span>;
}

function JoinForm({
  playerId,
  onJoined,
  onExit,
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
    if (trimmedCode.length < 3)
      return setError("Escribe el código de la sala.");
    if (!trimmedName) return setError("Escribe tu nombre.");

    setBusy(true);
    try {
      const exists = await roomExists(trimmedCode);
      if (!exists)
        throw new Error("No encontramos esa sala. Revisa el código.");
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
    <div
      className="page"
      style={{ minHeight: "100vh", justifyContent: "center" }}
    >
      <h1 style={{ fontSize: 26 }}>Unirse a la partida</h1>
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 380,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
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
        {error && (
          <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>
        )}
        <button className="btn-primary" onClick={handleJoin} disabled={busy}>
          {busy ? "Uniendo..." : "Unirme"}
        </button>
      </div>
      <button
        onClick={onExit}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: 13,
        }}
      >
        &larr; Volver
      </button>
    </div>
  );
}

function ChallengeArea({
  room,
  playerId,
  challenge,
}: {
  room: RoomState;
  playerId: string;
  challenge: CurrentChallenge;
}) {
  const question = useMemo(
    () => getQuestionById(challenge.questionId),
    [challenge.questionId],
  );
  if (!question) return null;

  const myAnswer = challenge.answers?.[playerId];

  async function send(payload: AnswerPayload) {
    await submitAnswer(room.code, playerId, payload);
  }

  if (!challenge.revealed) {
    if (myAnswer) {
      return (
        <div
          className="glass-alert card-settle"
          style={{
            width: "100%",
            maxWidth: 480,
            marginTop: 12,
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20 }}>
            Respuesta enviada
          </div>
          <div
            style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 8 }}
          >
            Esperando a los demás&hellip;{" "}
            <Countdown deadline={challenge.deadline} />
          </div>
        </div>
      );
    }
    if (question.type === "multiple-choice") {
      return (
        <MultipleChoiceForm
          key={question.id}
          question={question}
          deadline={challenge.deadline}
          onSubmit={(index) => send({ type: "multiple-choice", index })}
        />
      );
    }
    if (question.type === "true-false") {
      return (
        <TrueFalseForm
          key={question.id}
          question={question}
          deadline={challenge.deadline}
          onSubmit={(value) => send({ type: "true-false", value })}
        />
      );
    }
    return (
      <OrderForm
        key={question.id}
        question={question}
        deadline={challenge.deadline}
        onSubmit={(steps) => send({ type: "order", steps })}
      />
    );
  }

  // Ya se reveló el resultado de la ronda.
  const correct = myAnswer?.correct ?? false;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 480,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        marginTop: 12,
      }}
    >
      <div
        className={`glass-alert ${correct ? "good card-punch" : "bad card-impact"}`}
        style={{ textAlign: "center" }}
      >
        <div
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 24,
            color: correct ? "var(--success)" : "var(--danger)",
          }}
        >
          {correct
            ? "¡Correcto!"
            : myAnswer
              ? "Incorrecto"
              : "No respondiste a tiempo"}
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 8 }}>
          {question.explanation}
        </div>
      </div>

      {challenge.pendingPower && (
        <PowerPhase
          room={room}
          playerId={playerId}
          power={challenge.pendingPower}
        />
      )}
      {!challenge.pendingPower && (
        <div
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          Nadie ganó el poder esta ronda. Espera la siguiente pregunta.
        </div>
      )}
    </div>
  );
}

function PowerPhase({
  room,
  playerId,
  power,
}: {
  room: RoomState;
  playerId: string;
  power: PendingPower;
}) {
  const winner = room.players[power.playerId];
  const isWinnerMe = power.playerId === playerId;
  const { effectiveRole, targets } = useMemo(
    () => eligibleTargets(room, power),
    [room, power],
  );
  const roleMeta = ROLES[effectiveRole];

  if (!power.resolved && isWinnerMe && !power.targetPlayerId) {
    return (
      <div className="glass-alert gold card-punch" style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20 }}>
          🎉 ¡Ganaste la ronda! Eres {roleMeta.name}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          {roleMeta.tagline}
        </div>
        <div
          style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}
        >
          Elige objetivo &middot; <Countdown deadline={power.deadline} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 14,
          }}
        >
          {targets.length === 0 && (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              No hay a quién elegir.
            </div>
          )}
          {targets.map((targetId) => {
            const t = room.players[targetId];
            const team = t.team ? room.teams[t.team] : null;
            return (
              <button
                key={targetId}
                className="btn-secondary"
                onClick={() =>
                  submitPowerTarget(room.code, playerId, targetId)
                    .then(() => resolvePower(room.code))
                    .catch(() => {})
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {team && (
                    <PlayerBean
                      color={team.color}
                      alive={t.lives > 0}
                      size={26}
                    />
                  )}
                  {t.name}
                </span>
                <Hearts lives={t.lives} size={12} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!power.resolved) {
    return (
      <div className="glass-alert gold card-settle" style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 17 }}>
          {winner?.name} ganó la ronda y activa su poder secreto
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
          Está eligiendo a quién le toca&hellip;
        </div>
      </div>
    );
  }

  const target = power.targetPlayerId
    ? room.players[power.targetPlayerId]
    : null;
  const iWasTarget = power.targetPlayerId === playerId;

  return (
    <div
      className={`glass-alert ${iWasTarget ? "bad card-impact" : "gold card-punch"}`}
      style={{ textAlign: "center" }}
    >
      <div
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 17,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <span>
          {winner?.name} usó su poder en{" "}
          {target ? target.name : "nadie"}
        </span>
        {effectiveRole === "saboteador" && target && (
          <span className="steal-heart">💛</span>
        )}
      </div>
      {iWasTarget && (
        <div style={{ fontSize: 13, color: "var(--danger)", marginTop: 6 }}>
          ¡Fuiste tú!
        </div>
      )}
    </div>
  );
}

function MultipleChoiceForm({
  question,
  deadline,
  onSubmit,
}: {
  question: MultipleChoiceQuestion;
  deadline: number;
  onSubmit: (index: number) => void;
}) {
  return (
    <div
      className="card card-settle"
      style={{
        width: "100%",
        maxWidth: 480,
        marginTop: 12,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        <span>Trivia rápida</span>
        <Countdown deadline={deadline} />
      </div>
      <div
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 19,
          lineHeight: 1.4,
        }}
      >
        {question.prompt}
      </div>
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
              textAlign: "left",
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function TrueFalseForm({
  question,
  deadline,
  onSubmit,
}: {
  question: TrueFalseQuestion;
  deadline: number;
  onSubmit: (value: boolean) => void;
}) {
  return (
    <div
      className="card card-settle"
      style={{
        width: "100%",
        maxWidth: 480,
        marginTop: 12,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        <span>Verdadero o falso</span>
        <Countdown deadline={deadline} />
      </div>
      <div
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 19,
          lineHeight: 1.4,
        }}
      >
        {question.prompt}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button
          onClick={() => onSubmit(true)}
          style={{
            background: "var(--surface-2)",
            border: "2px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            padding: 18,
            color: "var(--text)",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Verdadero
        </button>
        <button
          onClick={() => onSubmit(false)}
          style={{
            background: "var(--surface-2)",
            border: "2px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            padding: 18,
            color: "var(--text)",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Falso
        </button>
      </div>
    </div>
  );
}

function OrderForm({
  question,
  deadline,
  onSubmit,
}: {
  question: OrderQuestion;
  deadline: number;
  onSubmit: (steps: string[]) => void;
}) {
  const [steps, setSteps] = useState<string[]>(() =>
    shuffleOnce(question.steps),
  );

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next);
  }

  return (
    <div
      className="card card-settle"
      style={{
        width: "100%",
        maxWidth: 480,
        marginTop: 12,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        <span>Ordenar el ciclo</span>
        <Countdown deadline={deadline} />
      </div>
      <div
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 18,
          lineHeight: 1.4,
        }}
      >
        {question.prompt}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
        Usa las flechas para poner los pasos en el orden correcto.
      </div>
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
              padding: 12,
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
                flex: "none",
              }}
            >
              {index + 1}
            </div>
            <div style={{ flex: 1, fontSize: 14 }}>{step}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                style={arrowBtnStyle}
              >
                ▲
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === steps.length - 1}
                style={arrowBtnStyle}
              >
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
  fontSize: 10,
};

function shuffleOnce<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
