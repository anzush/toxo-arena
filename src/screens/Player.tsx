import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Ash } from "../components/Ash";
import { Confetti } from "../components/Confetti";
import { ExtraSkillPanel } from "../components/ExtraSkillPanel";
import { Hearts } from "../components/Hearts";
import { LifeEventOverlay } from "../components/LifeEventOverlay";
import { MuteButton } from "../components/MuteButton";
import { PlayerBean } from "../components/PlayerBean";
import { RoleReveal } from "../components/RoleReveal";
import { RulesExplainer } from "../components/RulesExplainer";
import { StreakBadge } from "../components/StreakBadge";
import { UrgentFlash } from "../components/UrgentFlash";
import { ROLES } from "../data/roles";
import { useCountdown } from "../hooks/useCountdown";
import { useLifeEvents } from "../hooks/useLifeEvents";
import { useLifeVibration } from "../hooks/useLifeVibration";
import { useMuted } from "../hooks/useMuted";
import { usePlayerId } from "../hooks/usePlayerId";
import { useRoom } from "../hooks/useRoom";
import { Sfx, useSfx } from "../hooks/useSfx";
import {
  eligibleTargets,
  findInfiltrado,
  getQuestionById,
  hibernateBonusMs,
  isAlive,
  isSabotaged,
  myEliminatedIndices,
  rushPenaltyMs,
} from "../lib/gameEngine";
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
  PlayerState,
  RoomState,
  TEAM_IDS,
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
  const [muted, toggleMuted] = useMuted();
  const sfx = useSfx(muted);
  useLifeVibration(myEvent);

  const [roleSeen, setRoleSeen] = useState(false);
  useEffect(() => {
    if (room?.status === "lobby") setRoleSeen(false);
  }, [room?.status]);

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
        <Header
          name={me.name}
          code={room.code}
          onLeave={leaveRoom}
          muted={muted}
          onToggleMuted={toggleMuted}
        />
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
    return (
      <FinishedPlayerView
        room={room}
        me={me}
        onLeave={leaveRoom}
        muted={muted}
        onToggleMuted={toggleMuted}
        sfx={sfx}
      />
    );
  }

  if (!me.team) {
    return <Centered>No quedaste asignado a un equipo todavía.</Centered>;
  }

  if (me.role && !roleSeen) {
    return (
      <RoleReveal
        roleId={me.role}
        secretTeamName={me.infiltradoFor ? room.teams[me.infiltradoFor].name : null}
        sfx={sfx}
        onDone={() => setRoleSeen(true)}
      />
    );
  }

  if (me.lives === 0) {
    return (
      <div
        className="page"
        style={{
          minHeight: "100vh",
          justifyContent: "center",
          background: "#2e2e36",
          filter: "grayscale(1)",
        }}
      >
        <Header
          name={me.name}
          code={room.code}
          onLeave={leaveRoom}
          muted={muted}
          onToggleMuted={toggleMuted}
        />
        <LifeEventOverlay
          key={myEvent?.key}
          event={myEvent}
          teamColor={room.teams[me.team].color}
          sfx={sfx}
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
      <Header
        name={me.name}
        code={room.code}
        onLeave={leaveRoom}
        muted={muted}
        onToggleMuted={toggleMuted}
      />
      <LifeEventOverlay
        key={myEvent?.key}
        event={myEvent}
        teamColor={room.teams[me.team].color}
        sfx={sfx}
      />
      <RoleBadge roleId={me.role} />
      <PlayerBean
        color={room.teams[me.team].color}
        alive={true}
        shielded={me.shielded}
        size={68}
      />
      <Hearts lives={me.lives} />
      <StreakBadge streak={me.roundWinStreak} size={13} />

      {!room.currentChallenge && (
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            marginTop: 8,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20 }}>
              Prepárate&hellip;
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              La próxima pregunta es para todos a la vez.
            </div>
          </div>
          <WaitingRoomPanel room={room} me={me} />
        </div>
      )}

      {room.currentChallenge && (
        <ChallengeArea
          room={room}
          playerId={playerId}
          challenge={room.currentChallenge}
          sfx={sfx}
        />
      )}
    </div>
  );
}

function FinishedPlayerView({
  room,
  me,
  onLeave,
  muted,
  onToggleMuted,
  sfx,
}: {
  room: RoomState;
  me: PlayerState;
  onLeave: () => void;
  muted: boolean;
  onToggleMuted: () => void;
  sfx: Sfx;
}) {
  const myTeamId = me.team;
  const isWinner =
    room.winnerTeamId === myTeamId || room.winnerTeamId === me.infiltradoFor;
  const infiltrado = findInfiltrado(room.players);
  const { playVictory, playDefeat } = sfx;

  useEffect(() => {
    if (isWinner) {
      playVictory();
    } else {
      playDefeat();
    }
    // Solo al entrar a esta pantalla, no en cada re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="page"
      style={{ minHeight: "100vh", justifyContent: "center" }}
    >
      <Header
        name={me.name}
        code={room.code}
        onLeave={onLeave}
        muted={muted}
        onToggleMuted={onToggleMuted}
      />
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
      {infiltrado && (
        <div
          className="glass-alert gold"
          style={{ fontSize: 13, textAlign: "center", maxWidth: 380 }}
        >
          🕵️ <strong>{infiltrado.player.name}</strong> era un infiltrado: jugaba
          en{" "}
          {infiltrado.player.team ? room.teams[infiltrado.player.team].name : "?"}
          , pero en secreto ganaba para{" "}
          {infiltrado.player.infiltradoFor
            ? room.teams[infiltrado.player.infiltradoFor].name
            : "?"}
          .
        </div>
      )}
    </div>
  );
}

function Header({
  name,
  code,
  onLeave,
  muted,
  onToggleMuted,
}: {
  name: string;
  code: string;
  onLeave: () => void;
  muted: boolean;
  onToggleMuted: () => void;
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
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <MuteButton muted={muted} onToggle={onToggleMuted} />
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
  const seconds = useCountdown(deadline);
  const urgent = seconds > 0 && seconds <= 5;
  return (
    <span
      className={urgent ? "countdown-urgent" : undefined}
      style={urgent ? { color: "var(--danger)", fontWeight: 700 } : undefined}
    >
      {seconds}s
    </span>
  );
}

/** true en los últimos 5 segundos (pero no cuando ya se acabó del todo). */
function useUrgent(deadline: number): boolean {
  const seconds = useCountdown(deadline);
  return seconds > 0 && seconds <= 5;
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

/** Mientras se espera la próxima pregunta: tu equipo (roles ocultos) y el ranking de los 3 equipos. */
function WaitingRoomPanel({ room, me }: { room: RoomState; me: PlayerState }) {
  if (!me.team) return null;
  const myTeam = room.teams[me.team];
  const teammates = myTeam.playerIds
    .map((id) => ({ id, player: room.players[id] }))
    .filter((x) => !!x.player);

  const ranking = TEAM_IDS.map((id) => {
    const team = room.teams[id];
    const playerStates = team.playerIds.map((pid) => room.players[pid]).filter(Boolean);
    const totalLives = playerStates.reduce((sum, p) => sum + p.lives, 0);
    const aliveCount = playerStates.filter((p) => isAlive(p)).length;
    return { id, team, totalLives, aliveCount };
  }).sort((a, b) => b.totalLives - a.totalLives);

  return (
    <div
      className="card"
      style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
          Tu equipo
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {teammates.map(({ id, player }) => (
            <div
              key={id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                width: 64,
              }}
            >
              <PlayerBean color={myTeam.color} alive={player.lives > 0} size={34} />
              <div
                style={{
                  fontSize: 11,
                  textAlign: "center",
                  maxWidth: 64,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {player.name}
              </div>
              <Hearts lives={player.lives} size={9} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
          Ranking de equipos
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ranking.map((r, index) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--surface-2)",
                borderRadius: 10,
                padding: "6px 12px",
                fontSize: 13,
                border: r.id === me.team ? `1px solid ${r.team.color}88` : undefined,
              }}
            >
              <span>
                {index + 1}. {r.team.name}
              </span>
              <span style={{ color: "var(--text-muted)" }}>
                {r.aliveCount === 0 ? "eliminado" : `${r.totalLives} vidas`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChallengeArea({
  room,
  playerId,
  challenge,
  sfx,
}: {
  room: RoomState;
  playerId: string;
  challenge: CurrentChallenge;
  sfx: Sfx;
}) {
  const question = useMemo(
    () => getQuestionById(challenge.questionId),
    [challenge.questionId],
  );
  const { playCorrect, playWrong } = sfx;

  useEffect(() => {
    if (!challenge.revealed) return;
    const correct = challenge.answers?.[playerId]?.correct ?? false;
    // Solo si de verdad va a sonar "ganaste la ronda" (PowerPhase no se
    // monta si esta ronda terminó la partida) evitamos duplicar el sonido.
    const willHearRoundWin =
      challenge.roundWinnerPlayerId === playerId && !!challenge.pendingPower;
    if (!correct) {
      playWrong();
    } else if (!willHearRoundWin) {
      playCorrect();
    }
    // Solo al revelarse esta ronda, no en cada re-render mientras sigue revelada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.revealed, challenge.questionId]);

  // El Taquizoíto puede apurar (recorta el cronómetro visible) y el
  // Bradizoíto puede hibernar (lo estira) — solo mientras se responde, no
  // afecta el momento real en que el anfitrión cierra la ronda.
  const effectiveDeadline =
    challenge.deadline - rushPenaltyMs(room, challenge, playerId) + hibernateBonusMs(challenge, playerId);
  const urgent = useUrgent(effectiveDeadline);

  if (!question) return null;

  const myAnswer = challenge.answers?.[playerId];

  async function send(payload: AnswerPayload) {
    await submitAnswer(room.code, playerId, payload);
  }

  const sabotaged = isSabotaged(room, challenge, playerId);

  if (!challenge.revealed) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 12,
        }}
      >
        <ExtraSkillPanel room={room} playerId={playerId} challenge={challenge} question={question} />
        {myAnswer ? (
          <div
            className={`glass-alert card-settle${urgent ? " card-dim-urgent" : ""}`}
            style={{ textAlign: "center" }}
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
        ) : (
          <>
            <UrgentFlash active={urgent} />
            {question.type === "multiple-choice" && (
              <MultipleChoiceForm
                key={question.id}
                question={question}
                deadline={effectiveDeadline}
                urgent={urgent}
                sabotaged={sabotaged}
                eliminatedIndices={myEliminatedIndices(challenge, playerId)}
                onSubmit={(index) => send({ type: "multiple-choice", index })}
              />
            )}
            {question.type === "true-false" && (
              <TrueFalseForm
                key={question.id}
                question={question}
                deadline={effectiveDeadline}
                urgent={urgent}
                sabotaged={sabotaged}
                onSubmit={(value) => send({ type: "true-false", value })}
              />
            )}
            {question.type === "order" && (
              <OrderForm
                key={question.id}
                question={question}
                deadline={effectiveDeadline}
                urgent={urgent}
                sabotaged={sabotaged}
                onSubmit={(steps) => send({ type: "order", steps })}
              />
            )}
          </>
        )}
      </div>
    );
  }

  // Ya se reveló el resultado de la ronda.
  const correct = myAnswer?.correct ?? false;
  const myExtraSkill = challenge.extraSkills?.[playerId];
  const wasRobbed = Object.values(challenge.extraSkills ?? {}).some(
    (use) => use.type === "steal" && use.success && use.targetId === playerId,
  );

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
            : wasRobbed
              ? "Te robaron la respuesta"
              : myAnswer
                ? "Incorrecto"
                : "No respondiste a tiempo"}
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 8 }}>
          {wasRobbed
            ? "Un rival te robó la respuesta esta ronda — para efectos de la ronda, cuenta como si no hubieras respondido."
            : question.explanation}
        </div>
      </div>

      {myExtraSkill?.type === "steal" && (
        <div
          className={`glass-alert ${myExtraSkill.success ? "good card-punch" : "card-settle"}`}
          style={{ textAlign: "center", fontSize: 14 }}
        >
          {myExtraSkill.success
            ? <>Le robaste la respuesta a <strong>{room.players[myExtraSkill.targetId]?.name}</strong>.</>
            : <>Intentaste robarle la respuesta a <strong>{room.players[myExtraSkill.targetId]?.name}</strong>, pero no funcionó.</>}
        </div>
      )}

      {challenge.pendingPower && (
        <PowerPhase
          room={room}
          playerId={playerId}
          power={challenge.pendingPower}
          sfx={sfx}
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

      <WaitingRoomPanel room={room} me={room.players[playerId]} />
    </div>
  );
}

function PowerPhase({
  room,
  playerId,
  power,
  sfx,
}: {
  room: RoomState;
  playerId: string;
  power: PendingPower;
  sfx: Sfx;
}) {
  const winner = room.players[power.playerId];
  const isWinnerMe = power.playerId === playerId;
  const { effectiveRole, targets } = useMemo(
    () => eligibleTargets(room, power),
    [room, power],
  );
  const roleMeta = ROLES[effectiveRole];
  const { playRoundWin } = sfx;
  const urgent = useUrgent(power.deadline);

  useEffect(() => {
    if (isWinnerMe) {
      playRoundWin();
    }
    // Solo al ganar la ronda, no en cada re-render mientras se elige objetivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [power.playerId]);

  if (!power.resolved && isWinnerMe && !power.targetPlayerId) {
    return (
      <div
        className={`glass-alert card-punch ${urgent ? "card-dim-urgent" : "gold"}`}
        style={{ textAlign: "center" }}
      >
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
        {effectiveRole === "parasito" && target && (
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
  urgent,
  sabotaged,
  eliminatedIndices,
  onSubmit,
}: {
  question: MultipleChoiceQuestion;
  deadline: number;
  urgent: boolean;
  sabotaged: boolean;
  eliminatedIndices: number[];
  onSubmit: (index: number) => void;
}) {
  return (
    <div
      className={`card card-settle${urgent ? " card-heartbeat" : ""}`}
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
      {sabotaged && (
        <div className="sabotage-banner">🦠 ¡Te sabotearon! Cuesta más leer.</div>
      )}
      <div
        className={sabotaged ? "sabotaged" : undefined}
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 19,
          lineHeight: 1.4,
        }}
      >
        {question.prompt}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((option, index) => {
          const eliminated = eliminatedIndices.includes(index);
          return (
            <button
              key={index}
              onClick={() => !eliminated && onSubmit(index)}
              disabled={eliminated}
              style={{
                background: "var(--surface-2)",
                border: "2px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: 16,
                color: "var(--text)",
                fontSize: 16,
                fontWeight: 600,
                textAlign: "left",
                opacity: eliminated ? 0.35 : 1,
              }}
            >
              <span
                className={sabotaged ? "sabotaged" : undefined}
                style={eliminated ? { textDecoration: "line-through" } : undefined}
              >
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TrueFalseForm({
  question,
  deadline,
  urgent,
  sabotaged,
  onSubmit,
}: {
  question: TrueFalseQuestion;
  deadline: number;
  urgent: boolean;
  sabotaged: boolean;
  onSubmit: (value: boolean) => void;
}) {
  return (
    <div
      className={`card card-settle${urgent ? " card-heartbeat" : ""}`}
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
      {sabotaged && (
        <div className="sabotage-banner">🦠 ¡Te sabotearon! Cuesta más leer.</div>
      )}
      <div
        className={sabotaged ? "sabotaged" : undefined}
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
  urgent,
  sabotaged,
  onSubmit,
}: {
  question: OrderQuestion;
  deadline: number;
  urgent: boolean;
  sabotaged: boolean;
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
      className={`card card-settle${urgent ? " card-heartbeat" : ""}`}
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
      {sabotaged && (
        <div className="sabotage-banner">🦠 ¡Te sabotearon! Cuesta más leer.</div>
      )}
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
            <div
              className={sabotaged ? "sabotaged" : undefined}
              style={{ flex: 1, fontSize: 14 }}
            >
              {step}
            </div>
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
