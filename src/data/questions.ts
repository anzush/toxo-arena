import type { Question } from "../types";

// Banco de preguntas de ejemplo sobre Toxoplasma gondii.
// Son un punto de partida real y verificable, pensado para editarse:
// agrega, quita o corrige preguntas libremente, y la app las recogerá
// automáticamente (solo respeta la forma de cada tipo, ver src/types.ts).

export const QUESTIONS: Question[] = [
  {
    id: "mc-11",
    type: "multiple-choice",
    prompt: "¿Cuál es una de las principales formas de transmisión de Toxoplasma gondii?",
    options: ["Picadura de artrópodos", "Contacto directo entre animales", "Consumo de carne mal cocida", "Inhalación de aerosoles contaminados"],
    correctIndex: 2,
    explanation: "Ingerir carne con quistes tisulares mal cocida es una de las vías principales de infección, junto con el contacto con ooquistes esporulados."
  },
  {
    id: "mc-12",
    type: "multiple-choice",
    prompt: "¿Cuáles son los métodos diagnósticos mencionados para la detección de Toxoplasma gondii?",
    options: ["Hemograma y radiografía", "Cultivo bacteriano y antibiograma", "Serología (IgG/IgM) y PCR", "Coprología y biopsia hepática"],
    correctIndex: 2,
    explanation: "La serología detecta anticuerpos IgG/IgM y la PCR detecta material genético del parásito; son las herramientas diagnósticas más usadas."
  },
  {
    id: "mc-13",
    type: "multiple-choice",
    prompt: "¿En qué hospedador ocurre la fase sexual de Toxoplasma gondii?",
    options: ["Ovinos", "Aves de sangre caliente", "Gatos", "Bovinos"],
    correctIndex: 2,
    explanation: "Los félidos, principalmente el gato doméstico, son los únicos hospedadores donde el parásito completa su ciclo sexual."
  },
  {
    id: "mc-14",
    type: "multiple-choice",
    prompt: "A nivel de encéfalo, ¿cómo suelen presentarse las lesiones macroscópicas de la toxoplasmosis?",
    options: ["Hepatomegalia y congestión", "Lesiones muy evidentes con necrosis extensa", "Poco evidentes, salvo focos o hemorragia en casos graves", "Consolidación pulmonar"],
    correctIndex: 2,
    explanation: "Las lesiones cerebrales suelen ser poco visibles a simple vista, salvo focos de necrosis o hemorragia en los casos más graves."
  },
  {
    id: "mc-15",
    type: "multiple-choice",
    prompt: "¿Cuáles son las formas morfológicas de Toxoplasma gondii?",
    options: ["Ooquiste, merozoíto y esquizonte", "Macrogamonte, microgameto y taquizoíto", "Taquizoíto, bradizoíto y esporozoíto", "Trofozoíto, merozoíto y ooquiste"],
    correctIndex: 2,
    explanation: "Las tres formas morfológicas del parásito son el taquizoíto (fase aguda), el bradizoíto (quistes tisulares) y el esporozoíto (dentro del ooquiste)."
  },
  {
    id: "mc-16",
    type: "multiple-choice",
    prompt: "¿Cuánto mide aproximadamente un taquizoíto?",
    options: ["10–15 µm de largo × 5–8 µm de ancho", "2 × 6–8 µm", "5–8 µm de largo", "4–6 µm de largo × 2–3 µm de ancho"],
    correctIndex: 3,
    explanation: "El taquizoíto mide alrededor de 4–6 µm de largo por 2–3 µm de ancho."
  },
  {
    id: "mc-17",
    type: "multiple-choice",
    prompt: "¿Qué forma tiene el taquizoíto?",
    options: ["Forma esférica", "Forma fusiforme", "Forma ovalada", "Forma de media luna o arco, con un extremo puntiagudo y otro redondeado"],
    correctIndex: 3,
    explanation: "El taquizoíto tiene forma de media luna o arco, con un extremo puntiagudo y otro redondeado."
  },
  {
    id: "mc-18",
    type: "multiple-choice",
    prompt: "Los focos de necrosis y mineralización asociados a aborto y muerte fetal, especialmente en pequeños rumiantes, ¿dónde se localizan principalmente?",
    options: ["Encéfalo", "Pulmón", "Hígado", "Placenta"],
    correctIndex: 3,
    explanation: "La necrosis cotiledonaria de la placenta es la lesión clásica asociada al aborto por toxoplasmosis en ovejas y cabras."
  },
  {
    id: "mc-19",
    type: "multiple-choice",
    prompt: "¿Cuál de estas NO es una lesión macroscópica ocular descrita para la toxoplasmosis?",
    options: ["Retinitis y coriorretinitis", "Áreas blanquecinas o grisáceas en la retina", "Hemorragias y vasculitis", "Desprendimiento total de retina"],
    correctIndex: 3,
    explanation: "Se describen retinitis, coriorretinitis, focos blanquecino-grisáceos y hemorragias o vasculitis; el desprendimiento total de retina no es una lesión típica descrita."
  },
  {
    id: "mc-20",
    type: "multiple-choice",
    prompt: "¿Cuál es la forma asociada a la infección aguda?",
    options: ["Bradizoíto", "Ooquiste", "Esporozoíto", "Taquizoíto"],
    correctIndex: 3,
    explanation: "El taquizoíto es la forma de multiplicación rápida asociada a la fase aguda de la infección."
  },
  {
    id: "ord-3",
    type: "order",
    prompt: "Ordena las fases de la patogenia de Toxoplasma gondii, desde la invasión inicial hasta sus efectos en rumiantes gestantes.",
    steps: [
      "Tras la ingestión, el parásito secreta roptrias y micronemas para invadir los enterocitos",
      "Se replica por endodiogenia en la vacuola parasitófora, causando necrosis focal y vasculitis (fase aguda)",
      "Se disemina por el organismo hacia tejidos como músculo, corazón y cerebro",
      "La respuesta inmune mediada por IFN-γ, TNF-α y linfocitos CD8+ detiene la replicación rápida",
      "El parásito se diferencia a bradizoítos y persiste en quistes tisulares del tejido muscular, cardíaco y nervioso (fase crónica)",
      "En rumiantes gestantes, coloniza la placenta y provoca necrosis focal en \"granos de sal\", derivando en aborto o efectos fetales irreversibles"
    ],
    explanation: "Es la secuencia de las 3 fases del esquema de patogenia: invasión celular y diseminación (fase aguda), respuesta inmune y latencia (fase crónica), y fisiopatología reproductiva en rumiantes."
  },
  {
    // Orden reconstruido a partir de las imágenes A–D (rotuladas, no numeradas como secuencia explícita en el material) según el ciclo biológico conocido del parásito — verifícalo contra tu fuente.
    id: "ord-4",
    type: "order",
    prompt: "Ordena la secuencia del ciclo intestinal de Toxoplasma gondii en el gato, según las lesiones microscópicas descritas.",
    steps: [
      "En el intestino del gato, el parásito se multiplica de forma asexual formando esquizontes y merozoítos",
      "Se forma el microgameto, la forma masculina del parásito, que presenta dos flagelos",
      "El microgameto fecunda al macrogamonte y se forma el ooquiste en el intestino delgado",
      "En otros tejidos, como el cerebro, el parásito persiste como bradizoítos dentro de un quiste tisular, propio de la fase crónica"
    ],
    explanation: "Primero hay multiplicación asexual (esquizontes/merozoítos), luego la fase sexual forma el microgameto y fecunda al macrogamonte dando el ooquiste, mientras en otros tejidos se establece la latencia crónica en quistes con bradizoítos."
  },
  {
    id: "ord-5",
    type: "order",
    prompt: "Ordena la estructura del ooquiste esporulado de Toxoplasma gondii, de la más externa a la más interna.",
    steps: [
      "Ooquiste esférico o subesférico (10–15 µm)",
      "Esporoquiste (2 por ooquiste)",
      "Esporozoíto (4 por esporoquiste, de aproximadamente 2 × 6–8 µm)"
    ],
    explanation: "El ooquiste contiene 2 esporoquistes, y cada uno alberga 4 esporozoítos en su interior."
  },
  {
    id: "tf-3",
    type: "true-false",
    prompt: "El hospedador definitivo de Toxoplasma gondii es el gato (félidos).",
    correctAnswer: true,
    explanation: "Los félidos, principalmente el gato doméstico, son los hospedadores definitivos donde el parásito completa su ciclo sexual."
  },
  {
    id: "tf-4",
    type: "true-false",
    prompt: "La mayoría de las infecciones por Toxoplasma gondii son sintomáticas.",
    correctAnswer: false,
    explanation: "La clínica es asintomática en la mayoría de los casos; es grave sobre todo en inmunodeprimidos y fetos."
  },
  {
    id: "tf-5",
    type: "true-false",
    prompt: "El taquizoíto es la forma responsable de la infección crónica.",
    correctAnswer: false,
    explanation: "El taquizoíto corresponde a la infección aguda; el bradizoíto es la forma de la infección crónica, dentro de quistes tisulares."
  },
  {
    id: "tf-6",
    type: "true-false",
    prompt: "El bradizoíto se multiplica lentamente y persiste en la fase latente.",
    correctAnswer: true,
    explanation: "A diferencia del taquizoíto, el bradizoíto se multiplica lentamente y persiste en quistes tisulares durante la fase crónica."
  },
  {
    id: "tf-7",
    type: "true-false",
    prompt: "El ooquiste esporulado contiene 2 esporoquistes, cada uno con 4 esporozoítos.",
    correctAnswer: true,
    explanation: "Así se describe la estructura del ooquiste esporulado en el material."
  },
  {
    id: "tf-8",
    type: "true-false",
    prompt: "Las lesiones en el encéfalo por toxoplasmosis suelen ser muy evidentes macroscópicamente.",
    correctAnswer: false,
    explanation: "Las lesiones cerebrales suelen ser poco evidentes macroscópicamente, salvo focos de lesión o hemorragia en casos graves."
  },
  {
    id: "tf-9",
    type: "true-false",
    prompt: "La lesión de \"granos de sal\" se observa en la placenta.",
    correctAnswer: true,
    explanation: "Se observa necrosis focal blanquecina en los cotiledones placentarios, un hallazgo patognomónico conocido como \"granos de sal\"."
  },
  {
    id: "tf-10",
    type: "true-false",
    prompt: "Un aumento de cuatro veces en los títulos de IgG confirma una infección activa.",
    correctAnswer: true,
    explanation: "El material indica que un aumento de cuatro veces en los títulos de IgG confirma una infección activa."
  },
  {
    id: "tf-11",
    type: "true-false",
    prompt: "Neospora caninum es uno de los diagnósticos diferenciales de cuadros reproductivos similares a la toxoplasmosis.",
    correctAnswer: true,
    explanation: "El material lista a Neospora caninum, Sarcocystis spp., Chlamydia abortus, Coxiella burnetii, Brucella spp. y Campylobacter fetus como diagnósticos diferenciales."
  },
  {
    id: "tf-12",
    type: "true-false",
    prompt: "El esporozoíto se elimina en la orina de los felinos.",
    correctAnswer: false,
    explanation: "El esporozoíto, dentro del ooquiste, se elimina en las heces de los felinos, no en la orina."
  }
];
