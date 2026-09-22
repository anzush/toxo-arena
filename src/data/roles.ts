import { RoleId } from "../types";

export interface RoleMeta {
  id: RoleId;
  name: string;
  tagline: string;
  color: string;
  emoji: string;
}

// "emoji" es solo un glifo de respaldo por si algún día quieres mostrar algo
// rápido sin ícono SVG; la UI actual usa íconos propios, no estos glifos.
export const ROLES: Record<RoleId, RoleMeta> = {
  tripulante: {
    id: "tripulante",
    name: "Hospedador",
    tagline: "El hospedador intermediario más común, de sangre caliente. Si ganas la ronda, le quitas 1 vida a un rival.",
    color: "#A79FC2",
    emoji: "🐾"
  },
  impostor: {
    id: "impostor",
    name: "Gato",
    tagline: "El hospedador definitivo: por fuera juega en tu equipo, por dentro gana para otro. Nadie lo sabe hasta el final.",
    color: "#FF5A6E",
    emoji: "🐱"
  },
  medico: {
    id: "medico",
    name: "Linfocito",
    tagline: "La respuesta inmune que frena al parásito. Si ganas la ronda, puedes escudar a un compañero (una vez por partida).",
    color: "#52D68A",
    emoji: "🛡️"
  },
  chaman: {
    id: "chaman",
    name: "Bradizoíto",
    tagline: "La forma latente que persiste dormida y puede reactivarse. Si ganas la ronda, puedes revivir a un compañero eliminado (una vez por partida).",
    color: "#A78BFA",
    emoji: "💤"
  },
  parasito: {
    id: "parasito",
    name: "Taquizoíto",
    tagline: "La forma que se multiplica rápido y se disemina. Si ganas la ronda, le robas 1 vida a un rival: él la pierde y tú la ganas.",
    color: "#FFC857",
    emoji: "🦠"
  }
};

// Hospedador es el rol "normal" y más común; los demás son especiales y
// escasos, como en el reparto real de formas del parásito.
const ROLE_WEIGHTS: [RoleId, number][] = [
  ["tripulante", 55],
  ["impostor", 15],
  ["medico", 10],
  ["chaman", 10],
  ["parasito", 10]
];

export function randomRole(): RoleId {
  const total = ROLE_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [id, weight] of ROLE_WEIGHTS) {
    if (roll < weight) return id;
    roll -= weight;
  }
  return "tripulante";
}
