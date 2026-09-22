import { useState } from "react";
import { rivalPlayerIds, teammatePlayerIds } from "../lib/gameEngine";
import { useExtraSkill } from "../lib/roomService";
import { AnswerPayload, CurrentChallenge, ExtraSkillType, Question, RoomState } from "../types";
import { Hearts } from "./Hearts";
import { PlayerBean } from "./PlayerBean";

const META: Record<ExtraSkillType, { label: string; verb: string; color: string }> = {
  steal: { label: "Robar respuesta", verb: "Robar a", color: "var(--danger)" },
  sabotage: { label: "Sabotear", verb: "Sabotear a", color: "var(--gold)" },
  cure: { label: "Curar", verb: "Proteger a", color: "var(--success)" },
  eliminate: { label: "50/50", verb: "Usar en ti", color: "var(--accent-2)" },
  peek: { label: "Espiar respuesta", verb: "Espiar a", color: "var(--accent)" },
  rush: { label: "Apurar", verb: "Apurar a", color: "var(--danger)" },
  hibernate: { label: "Hibernar", verb: "Usar en ti", color: "var(--accent-2)" },
  immunize: { label: "Inmunizar equipo", verb: "Usar en tu equipo", color: "var(--success)" }
};

// Cada rol puede tener 1 o 2 habilidades extra; si tiene 2, elige cuál usar
// esta ronda (sigue siendo una sola vez por ronda, sin importar cuál elija).
const SKILLS_BY_ROLE: Record<string, ExtraSkillType[]> = {
  impostor: ["steal"],
  parasito: ["sabotage", "rush"],
  medico: ["cure", "immunize"],
  chaman: ["eliminate", "hibernate"],
  tripulante: ["peek"]
};

// Habilidades que se usan en uno mismo (o en todo el equipo), sin elegir objetivo.
const SELF_SKILLS: ExtraSkillType[] = ["eliminate", "hibernate", "immunize"];

function targetIdsFor(skill: ExtraSkillType, room: RoomState, playerId: string): string[] {
  switch (skill) {
    case "cure":
      return teammatePlayerIds(room, playerId);
    case "peek":
      return teammatePlayerIds(room, playerId).filter((id) => id !== playerId);
    case "steal":
    case "sabotage":
    case "rush":
      return rivalPlayerIds(room, playerId);
    default:
      return [];
  }
}

function AnswerSummary({ question, payload }: { question: Question; payload: AnswerPayload }) {
  if (question.type === "multiple-choice" && payload.type === "multiple-choice") {
    return <strong style={{ color: "var(--text)" }}>{question.options[payload.index]}</strong>;
  }
  if (question.type === "true-false" && payload.type === "true-false") {
    return <strong style={{ color: "var(--text)" }}>{payload.value ? "Verdadero" : "Falso"}</strong>;
  }
  if (question.type === "order" && payload.type === "order") {
    return <strong style={{ color: "var(--text)" }}>{payload.steps.join(" → ")}</strong>;
  }
  return null;
}

/**
 * Botón de habilidad extra de cada rol (robar, sabotear, curar, 50/50,
 * espiar, apurar, hibernar, inmunizar) — a diferencia del poder de rol, no
 * hace falta ganar la ronda anterior: se usa libremente mientras se
 * responde, una vez por ronda.
 */
export function ExtraSkillPanel({
  room,
  playerId,
  challenge,
  question
}: {
  room: RoomState;
  playerId: string;
  challenge: CurrentChallenge;
  question: Question;
}) {
  const [pendingSkill, setPendingSkill] = useState<ExtraSkillType | null>(null);
  const [open, setOpen] = useState(false);
  const me = room.players[playerId];
  const roleSkills = me.role ? (SKILLS_BY_ROLE[me.role] ?? []) : [];

  const availableSkills = roleSkills.filter((skill) => {
    if (skill === "eliminate" && question.type !== "multiple-choice") return false;
    if (skill === "immunize" && me.groupShieldUsed) return false;
    return true;
  });

  if (availableSkills.length === 0 || challenge.revealed) return null;

  const already = challenge.extraSkills?.[playerId];

  async function use(skillType: ExtraSkillType, targetId: string) {
    setOpen(false);
    setPendingSkill(null);
    await useExtraSkill(room.code, playerId, skillType, targetId);
  }

  if (already) {
    if (already.type === "eliminate") {
      return (
        <div className="glass-alert" style={{ fontSize: 13, color: "var(--text-muted)", padding: 14 }}>
          🎯 Usaste tu 50/50: se eliminaron 2 opciones incorrectas.
        </div>
      );
    }

    if (already.type === "hibernate") {
      return (
        <div className="glass-alert" style={{ fontSize: 13, color: "var(--text-muted)", padding: 14 }}>
          💤 Usaste tu hibernación: ganaste un poco más de tiempo para responder esta ronda.
        </div>
      );
    }

    if (already.type === "immunize") {
      return (
        <div className="glass-alert gold" style={{ fontSize: 13, padding: 14 }}>
          🛡️ Usaste tu inmunización grupal: tu equipo queda protegido de robos, sabotajes y apuros
          esta ronda (una sola vez por partida).
        </div>
      );
    }

    const target = room.players[already.targetId];

    if (already.type === "peek") {
      if (already.success === false) {
        return (
          <div className="glass-alert" style={{ fontSize: 13, color: "var(--text-muted)", padding: 14 }}>
            👀 Intentaste espiar a <strong style={{ color: "var(--text)" }}>{target?.name ?? "alguien"}</strong>,
            pero no lo lograste.
          </div>
        );
      }
      const theirAnswer = challenge.answers?.[already.targetId];
      return (
        <div className="glass-alert gold" style={{ fontSize: 13, padding: 14 }}>
          👀 Ves la respuesta de <strong style={{ color: "var(--text)" }}>{target?.name ?? "alguien"}</strong>:{" "}
          {theirAnswer ? <AnswerSummary question={question} payload={theirAnswer.payload} /> : "todavía no responde"}
        </div>
      );
    }

    const meta = META[already.type];
    return (
      <div
        className="glass-alert"
        style={{ fontSize: 13, color: "var(--text-muted)", padding: 14 }}
      >
        Ya usaste tu habilidad esta ronda: {meta.verb.toLowerCase()}{" "}
        <strong style={{ color: "var(--text)" }}>{target?.name ?? "alguien"}</strong>.
      </div>
    );
  }

  const activeSkill = availableSkills.length === 1 ? availableSkills[0] : pendingSkill;

  if (!activeSkill) {
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {availableSkills.map((skill) => {
          const meta = META[skill];
          const disabled = !SELF_SKILLS.includes(skill) && targetIdsFor(skill, room, playerId).length === 0;
          return (
            <button
              key={skill}
              className="btn-secondary"
              onClick={() => (SELF_SKILLS.includes(skill) ? use(skill, playerId) : setPendingSkill(skill))}
              disabled={disabled}
              style={{ borderColor: `${meta.color}66`, color: meta.color }}
            >
              {meta.label}
            </button>
          );
        })}
      </div>
    );
  }

  const meta = META[activeSkill];
  const targetIds = targetIdsFor(activeSkill, room, playerId);

  if (!open) {
    return (
      <button
        className="btn-secondary"
        onClick={() => (SELF_SKILLS.includes(activeSkill) ? use(activeSkill, playerId) : setOpen(true))}
        disabled={SELF_SKILLS.includes(activeSkill) ? false : targetIds.length === 0}
        style={{ borderColor: `${meta.color}66`, color: meta.color }}
      >
        {meta.label}
      </button>
    );
  }

  return (
    <div className="glass-alert" style={{ padding: 14 }}>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
        {meta.verb} quién&hellip;
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {targetIds.map((targetId) => {
          const t = room.players[targetId];
          const team = t.team ? room.teams[t.team] : null;
          return (
            <button
              key={targetId}
              className="btn-secondary"
              onClick={() => use(activeSkill, targetId)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {team && <PlayerBean color={team.color} alive={t.lives > 0} size={26} />}
                {t.name}
              </span>
              <Hearts lives={t.lives} size={12} />
            </button>
          );
        })}
      </div>
      <button
        onClick={() => {
          setOpen(false);
          setPendingSkill(null);
        }}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: 12,
          marginTop: 10
        }}
      >
        Cancelar
      </button>
    </div>
  );
}
