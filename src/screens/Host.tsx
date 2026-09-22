import { useEffect, useState } from "react";
import { RulesExplainer } from "../components/RulesExplainer";
import { TeamRoster } from "../components/TeamRoster";
import { useRoom } from "../hooks/useRoom";
import { getQuestionById, isAlive } from "../lib/gameEngine";
import {
  createRoom,
  playAgain,
  resolvePower,
  resolveRound,
  startNextChallenge,
  startSorteoYJuego,
} from "../lib/roomService";
import { ChallengeType, RoomState, TEAM_IDS } from "../types";

const ROOM_KEY = "toxo-arena-host-room";
const ALL_TYPES: ChallengeType[] = ["multiple-choice", "true-false", "order"];

export function Host({ onExit }: { onExit: () => void }) {
  const [roomCode, setRoomCode] = useState<string | null>(() =>
    localStorage.getItem(ROOM_KEY),
  );
  const { room, loading } = useRoom(roomCode);
  const [busy, setBusy] = useState(false);

  async function handleCreateRoom() {
    setBusy(true);
    try {
      const code = await createRoom(ALL_TYPES);
      localStorage.setItem(ROOM_KEY, code);
      setRoomCode(code);
    } finally {
      setBusy(false);
    }
  }

  function closeRoom() {
    localStorage.removeItem(ROOM_KEY);
    setRoomCode(null);
    onExit();
  }

  // Auto-revela cuando se acaba el tiempo de responder.
  useEffect(() => {
    const challenge = room?.currentChallenge;
    if (!challenge || challenge.revealed) return;
    const timer = setTimeout(
      () => resolveRound(room!.code).catch(console.error),
      Math.max(0, challenge.deadline - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [
    room?.currentChallenge?.questionId,
    room?.currentChallenge?.revealed,
    room?.code,
  ]);

  // No hay que esperar el reloj si ya respondieron todos los que siguen vivos.
  useEffect(() => {
    const challenge = room?.currentChallenge;
    if (!room || !challenge || challenge.revealed) return;
    const aliveCount = Object.values(room.players).filter((p) =>
      isAlive(p),
    ).length;
    const answeredCount = Object.keys(challenge.answers ?? {}).length;
    if (aliveCount > 0 && answeredCount >= aliveCount) {
      resolveRound(room.code).catch(console.error);
    }
  }, [
    room?.currentChallenge?.answers,
    room?.currentChallenge?.revealed,
    room?.code,
  ]);

  // Auto-resuelve el poder cuando se acaba el tiempo de elegir objetivo.
  useEffect(() => {
    const power = room?.currentChallenge?.pendingPower;
    if (!power || power.resolved) return;
    const timer = setTimeout(
      () => resolvePower(room!.code).catch(console.error),
      Math.max(0, power.deadline - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [
    room?.currentChallenge?.pendingPower?.playerId,
    room?.currentChallenge?.pendingPower?.resolved,
    room?.code,
  ]);

  if (!roomCode) {
    return (
      <div
        className="page"
        style={{ minHeight: "100vh", justifyContent: "center" }}
      >
        <h1 style={{ fontSize: 28 }}>Crear partida</h1>
        <p
          style={{
            color: "var(--text-muted)",
            textAlign: "center",
            maxWidth: 420,
          }}
        >
          Se creará una sala nueva con un código para que los jugadores se unan
          desde su celular.
        </p>
        <button
          className="btn-primary"
          onClick={handleCreateRoom}
          disabled={busy}
        >
          {busy ? "Creando..." : "Crear sala"}
        </button>
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

  if (loading || !room) {
    return (
      <div
        className="page"
        style={{ minHeight: "100vh", justifyContent: "center" }}
      >
        Cargando sala&hellip;
      </div>
    );
  }

  return (
    <div
      className="page"
      style={{ minHeight: "100vh", maxWidth: 1000, margin: "0 auto" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center",
        }}
      >
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18 }}>
          TOXO ARENA · anfitrión
        </div>
        <button
          onClick={closeRoom}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          Cerrar sala
        </button>
      </div>

      {room.status === "lobby" && <LobbyView room={room} />}
      {room.status === "playing" && <PlayingView room={room} />}
      {room.status === "finished" && <FinishedView room={room} />}
    </div>
  );
}

function LobbyView({ room }: { room: RoomState }) {
  const players = Object.values(room.players ?? {});
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    setStarting(true);
    try {
      await startSorteoYJuego(room.code);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        width: "100%",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Código de la sala
        </div>
        <div
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 56,
            letterSpacing: 8,
          }}
        >
          {room.code}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Los jugadores entran a la app, eligen "Soy jugador" y escriben este
          código.
        </div>
      </div>

      <div className="card" style={{ width: "100%", maxWidth: 480 }}>
        <div
          style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}
        >
          Jugadores conectados ({players.length})
        </div>
        {players.length === 0 && (
          <div style={{ color: "var(--text-muted)" }}>
            Todavía no se ha unido nadie.
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {players.map((p, i) => (
            <div
              key={i}
              style={{
                background: "var(--surface-2)",
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 14,
              }}
            >
              {p.name}
            </div>
          ))}
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={handleStart}
        disabled={players.length < 3 || starting}
      >
        {starting ? "Sorteando..." : "Sortear equipos, roles y empezar"}
      </button>
      {players.length < 3 && (
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Se necesitan al menos 3 jugadores.
        </div>
      )}

      <RulesExplainer />
    </div>
  );
}

function PlayingView({ room }: { room: RoomState }) {
  const [busy, setBusy] = useState(false);
  const [noMoreQuestions, setNoMoreQuestions] = useState(false);
  const challenge = room.currentChallenge;
  const question = challenge ? getQuestionById(challenge.questionId) : null;
  const alivePlayerIds = Object.entries(room.players)
    .filter(([, p]) => isAlive(p))
    .map(([id]) => id);
  const answeredCount = challenge
    ? Object.keys(challenge.answers ?? {}).length
    : 0;

  async function handleNext() {
    setBusy(true);
    setNoMoreQuestions(false);
    try {
      const result = await startNextChallenge(room.code);
      if (result === "sin-preguntas") setNoMoreQuestions(true);
    } finally {
      setBusy(false);
    }
  }

  const power = challenge?.pendingPower;
  const winnerPlayer = power ? room.players[power.playerId] : null;
  const targetPlayer = power?.targetPlayerId
    ? room.players[power.targetPlayerId]
    : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        width: "100%",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0,1fr))",
          gap: 16,
        }}
      >
        {TEAM_IDS.map((id) => (
          <TeamRoster
            key={id}
            team={room.teams[id]}
            players={room.players}
            highlightPlayerId={challenge?.roundWinnerPlayerId}
          />
        ))}
      </div>

      {!challenge && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <button className="btn-primary" onClick={handleNext} disabled={busy}>
            Siguiente pregunta
          </button>
          {noMoreQuestions && (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Ya se usaron todas las preguntas disponibles de los tipos
              habilitados.
            </div>
          )}
        </div>
      )}

      {challenge && question && (
        <div
          className="card"
          style={{
            maxWidth: 640,
            margin: "0 auto",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {typeLabel(challenge.type)} · responden todos a la vez
          </div>
          <div
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 24,
              marginTop: 14,
              lineHeight: 1.4,
            }}
          >
            {question.prompt}
          </div>

          {!challenge.revealed && (
            <div
              style={{
                marginTop: 20,
                color: "var(--text-muted)",
                fontSize: 14,
              }}
            >
              {answeredCount}/{alivePlayerIds.length} ya respondieron
            </div>
          )}

          {challenge.revealed && !power && (
            <div style={{ marginTop: 20 }}>
              <ResultList room={room} />
              <div
                style={{
                  marginTop: 8,
                  color: "var(--text-muted)",
                  fontSize: 14,
                }}
              >
                Nadie ganó el poder esta ronda.
              </div>
              <button
                className="btn-primary"
                style={{ marginTop: 20 }}
                onClick={handleNext}
                disabled={busy}
              >
                Siguiente pregunta
              </button>
            </div>
          )}

          {challenge.revealed && power && winnerPlayer && (
            <div style={{ marginTop: 20 }}>
              <ResultList room={room} />
              <div
                className="pop"
                style={{
                  marginTop: 16,
                  background: "var(--surface-2)",
                  borderRadius: 16,
                  padding: 18,
                  border: "1px solid var(--gold)",
                }}
              >
                <div
                  style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18 }}
                >
                  🎉 {winnerPlayer.name} ganó la ronda y activa su poder
                  secreto
                </div>

                {!power.resolved && (
                  <div style={{ marginTop: 12, fontSize: 14 }}>
                    {power.targetPlayerId
                      ? "Aplicando el poder…"
                      : `Eligiendo objetivo desde su celular…`}
                  </div>
                )}

                {power.resolved && (
                  <div style={{ marginTop: 12, fontSize: 15 }}>
                    {targetPlayer ? (
                      <>
                        Objetivo: <strong>{targetPlayer.name}</strong>
                      </>
                    ) : (
                      "No había a quién aplicarle el poder esta vez."
                    )}
                  </div>
                )}
              </div>

              {power.resolved && (
                <button
                  className="btn-primary"
                  style={{ marginTop: 20 }}
                  onClick={handleNext}
                  disabled={busy}
                >
                  Siguiente pregunta
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultList({ room }: { room: RoomState }) {
  const challenge = room.currentChallenge;
  if (!challenge) return null;
  const entries = Object.entries(room.players).filter(
    ([, p]) => p.team !== null,
  );

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "center",
      }}
    >
      {entries.map(([id, player]) => {
        const answer = challenge.answers?.[id];
        const correct = answer?.correct;
        const icon = correct === true ? "✔" : correct === false ? "✘" : "…";
        const color =
          correct === true
            ? "var(--success)"
            : correct === false
              ? "var(--danger)"
              : "var(--text-muted)";
        return (
          <div
            key={id}
            style={{
              fontSize: 12,
              color,
              background: "var(--surface-2)",
              padding: "4px 10px",
              borderRadius: 999,
            }}
          >
            {icon} {player.name}
          </div>
        );
      })}
    </div>
  );
}

function FinishedView({ room }: { room: RoomState }) {
  const [busy, setBusy] = useState(false);
  const winner = room.winnerTeamId ? room.teams[room.winnerTeamId] : null;

  async function handleRestart() {
    setBusy(true);
    try {
      await playAgain(room.code);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div style={{ fontSize: 56 }}>🏆</div>
      <div
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 32,
          color: winner?.color,
        }}
      >
        {winner ? `¡${winner.name} gana la partida!` : "Partida terminada"}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
        Así quedaron los roles de todos:
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0,1fr))",
          gap: 16,
          width: "100%",
        }}
      >
        {TEAM_IDS.map((id) => (
          <TeamRoster
            key={id}
            team={room.teams[id]}
            players={room.players}
            revealRoles
          />
        ))}
      </div>
      <button className="btn-primary" onClick={handleRestart} disabled={busy}>
        Jugar de nuevo
      </button>
    </div>
  );
}

function typeLabel(type: ChallengeType): string {
  if (type === "multiple-choice") return "Trivia rápida";
  if (type === "true-false") return "Verdadero o falso";
  return "Ordenar el ciclo";
}
