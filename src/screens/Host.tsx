import { useEffect, useState } from "react";
import { TeamPill } from "../components/TeamPill";
import { useRoom } from "../hooks/useRoom";
import { getQuestionById } from "../lib/gameEngine";
import { createRoom, playAgain, revealAndResolve, startNextChallenge, startSorteoYJuego } from "../lib/roomService";
import { CHALLENGE_SECONDS, ChallengeType, TEAM_IDS } from "../types";

const ROOM_KEY = "toxo-arena-host-room";
const ALL_TYPES: ChallengeType[] = ["multiple-choice", "true-false", "order"];

export function Host({ onExit }: { onExit: () => void }) {
  const [roomCode, setRoomCode] = useState<string | null>(() => localStorage.getItem(ROOM_KEY));
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

  // Revela el resultado automáticamente cuando se acaba el tiempo del reto.
  useEffect(() => {
    if (!room?.currentChallenge || room.currentChallenge.revealed) return;
    const elapsed = Date.now() - room.currentChallenge.startedAt;
    const remaining = CHALLENGE_SECONDS * 1000 - elapsed;
    const timer = setTimeout(() => {
      revealAndResolve(room.code).catch(() => {});
    }, Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [room?.currentChallenge?.questionId, room?.currentChallenge?.startedAt, room?.currentChallenge?.revealed, room?.code]);

  if (!roomCode) {
    return (
      <div className="page" style={{ minHeight: "100vh", justifyContent: "center" }}>
        <h1 style={{ fontSize: 28 }}>Crear partida</h1>
        <p style={{ color: "var(--text-muted)", textAlign: "center", maxWidth: 420 }}>
          Se creará una sala nueva con un código para que los jugadores se unan desde su celular.
        </p>
        <button className="btn-primary" onClick={handleCreateRoom} disabled={busy}>
          {busy ? "Creando..." : "Crear sala"}
        </button>
        <button onClick={onExit} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13 }}>
          &larr; Volver
        </button>
      </div>
    );
  }

  if (loading || !room) {
    return (
      <div className="page" style={{ minHeight: "100vh", justifyContent: "center" }}>
        Cargando sala&hellip;
      </div>
    );
  }

  return (
    <div className="page" style={{ minHeight: "100vh", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18 }}>TOXO ARENA · anfitrión</div>
        <button onClick={closeRoom} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13 }}>
          Cerrar sala
        </button>
      </div>

      {room.status === "lobby" && <LobbyView room={room} />}
      {room.status === "playing" && <PlayingView room={room} />}
      {room.status === "finished" && <FinishedView room={room} />}
    </div>
  );
}

function LobbyView({ room: initialRoom }: { room: NonNullable<ReturnType<typeof useRoom>["room"]> }) {
  const room = initialRoom;
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, width: "100%" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Código de la sala</div>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 56, letterSpacing: 8 }}>{room.code}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Los jugadores entran a la app, eligen "Soy jugador" y escriben este código.
        </div>
      </div>

      <div className="card" style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
          Jugadores conectados ({players.length})
        </div>
        {players.length === 0 && <div style={{ color: "var(--text-muted)" }}>Todavía no se ha unido nadie.</div>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {players.map((p, i) => (
            <div key={i} style={{ background: "var(--surface-2)", borderRadius: 999, padding: "6px 14px", fontSize: 14 }}>
              {p.name}
            </div>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={handleStart} disabled={players.length < 3 || starting}>
        {starting ? "Sorteando..." : "Sortear equipos y empezar"}
      </button>
      {players.length < 3 && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Se necesitan al menos 3 jugadores.</div>}
    </div>
  );
}

function PlayingView({ room }: { room: NonNullable<ReturnType<typeof useRoom>["room"]> }) {
  const [busy, setBusy] = useState(false);
  const [noMoreQuestions, setNoMoreQuestions] = useState(false);
  const challenge = room.currentChallenge;
  const question = challenge ? getQuestionById(challenge.questionId) : null;
  const turnTeamId = room.turnOrder[room.currentTurnIndex];

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

  async function handleReveal() {
    setBusy(true);
    try {
      await revealAndResolve(room.code);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {TEAM_IDS.map((id) => (
          <TeamPill key={id} team={room.teams[id]} highlighted={id === turnTeamId} />
        ))}
      </div>

      {!challenge && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20 }}>Turno de {room.teams[turnTeamId].name}</div>
          <button className="btn-primary" onClick={handleNext} disabled={busy}>
            Siguiente reto
          </button>
          {noMoreQuestions && (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Ya se usaron todas las preguntas disponibles de los tipos habilitados.
            </div>
          )}
        </div>
      )}

      {challenge && question && (
        <div className="card" style={{ maxWidth: 640, margin: "0 auto", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Reto para {room.teams[challenge.teamId].name} · {typeLabel(challenge.type)}
          </div>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, marginTop: 14, lineHeight: 1.4 }}>
            {question.prompt}
          </div>

          {!challenge.revealed && (
            <div style={{ marginTop: 20, color: "var(--text-muted)", fontSize: 14 }}>
              {challenge.answeredBy ? "Ya respondieron. Puedes revelar el resultado." : "Esperando respuesta del equipo…"}
            </div>
          )}

          {!challenge.revealed && (
            <button className="btn-secondary" style={{ marginTop: 20 }} onClick={handleReveal} disabled={busy}>
              Revelar resultado
            </button>
          )}

          {challenge.revealed && (
            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 26,
                  color: challenge.isCorrect ? "var(--success)" : "var(--danger)"
                }}
              >
                {challenge.isCorrect ? "¡Correcto!" : "Incorrecto"}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 10 }}>{question.explanation}</div>
              <button className="btn-primary" style={{ marginTop: 20 }} onClick={handleNext} disabled={busy}>
                Siguiente reto
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FinishedView({ room }: { room: NonNullable<ReturnType<typeof useRoom>["room"]> }) {
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ fontSize: 56 }}>🏆</div>
      <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 32, color: winner?.color }}>
        {winner ? `¡${winner.name} gana la partida!` : "Partida terminada"}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {TEAM_IDS.map((id) => (
          <TeamPill key={id} team={room.teams[id]} highlighted={id === room.winnerTeamId} />
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
