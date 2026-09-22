import type { Question } from "../types";

// Banco de preguntas de ejemplo sobre Toxoplasma gondii.
// Son un punto de partida real y verificable, pensado para editarse:
// agrega, quita o corrige preguntas libremente, y la app las recogerá
// automáticamente (solo respeta la forma de cada tipo, ver src/types.ts).

export const QUESTIONS: Question[] = [
  {
    id: "mc-1",
    type: "multiple-choice",
    prompt: "¿Cuál es el hospedador definitivo de Toxoplasma gondii?",
    options: ["Perro", "Gato", "Cerdo", "Vaca"],
    correctIndex: 1,
    explanation:
      "Solo en el intestino de los félidos (principalmente el gato doméstico) el parásito completa su ciclo sexual y forma ooquistes."
  },
  {
    id: "mc-2",
    type: "multiple-choice",
    prompt: "¿Qué forma parasitaria se encuentra dentro de los quistes tisulares?",
    options: ["Taquizoíto", "Bradizoíto", "Ooquiste", "Merozoíto"],
    correctIndex: 1,
    explanation: "Los bradizoítos son la forma de multiplicación lenta que persiste en quistes tisulares (músculo, SNC, retina)."
  },
  {
    id: "mc-3",
    type: "multiple-choice",
    prompt: "¿Qué forma es responsable de la multiplicación rápida en la fase aguda de la infección?",
    options: ["Bradizoíto", "Taquizoíto", "Ooquiste", "Esporozoíto"],
    correctIndex: 1,
    explanation: "El taquizoíto se replica rápido y es el que disemina la infección por el organismo en la fase aguda."
  },
  {
    id: "mc-4",
    type: "multiple-choice",
    prompt: "¿Cuál es el tratamiento de elección en un caso de toxoplasmosis clínica?",
    options: ["Pirimetamina + sulfadiazina", "Amoxicilina", "Ivermectina", "Metronidazol solo"],
    correctIndex: 0,
    explanation: "La combinación pirimetamina + sulfadiazina (más ácido folínico) es el esquema clásico de tratamiento."
  },
  {
    id: "mc-5",
    type: "multiple-choice",
    prompt: "¿En qué órgano del gato ocurre la reproducción sexual del parásito?",
    options: ["Hígado", "Intestino delgado", "Riñón", "Bazo"],
    correctIndex: 1,
    explanation: "El ciclo sexual (formación de ooquistes) sucede en el epitelio del intestino delgado del gato."
  },
  {
    id: "mc-6",
    type: "multiple-choice",
    prompt: "¿Cuánto tiempo tardan los ooquistes en esporular y volverse infectantes en el ambiente?",
    options: ["Unas horas", "1 a 5 días", "3 semanas", "No esporulan"],
    correctIndex: 1,
    explanation: "Fuera del gato, los ooquistes esporulan en 1 a 5 días según la temperatura y humedad."
  },
  {
    id: "mc-7",
    type: "multiple-choice",
    prompt: "¿Cuál es una consecuencia grave de la toxoplasmosis congénita?",
    options: ["Fractura ósea", "Coriorretinitis y daño neurológico", "Dermatitis alérgica", "Anemia hemolítica"],
    correctIndex: 1,
    explanation: "La infección congénita puede causar coriorretinitis, calcificaciones intracraneales e hidrocefalia, entre otros."
  },
  {
    id: "mc-8",
    type: "multiple-choice",
    prompt: "¿Qué método diagnóstico detecta anticuerpos IgG/IgM frente a Toxoplasma?",
    options: ["Serología", "Radiografía", "Ecografía", "Hemograma"],
    correctIndex: 0,
    explanation: "Las pruebas serológicas (IgG/IgM) son el método más usado para el diagnóstico indirecto."
  },
  {
    id: "mc-9",
    type: "multiple-choice",
    prompt: "¿Cuál de estas NO es una vía de transmisión de Toxoplasma gondii?",
    options: ["Ingestión de carne mal cocida", "Contacto con heces de gato", "Transmisión transplacentaria", "Picadura de mosquito"],
    correctIndex: 3,
    explanation: "A diferencia de otras parasitosis, Toxoplasma no se transmite por vectores como el mosquito."
  },
  {
    id: "mc-10",
    type: "multiple-choice",
    prompt: "¿Qué recomendación de prevención es correcta para una mujer embarazada con gato en casa?",
    options: [
      "Evitar limpiar el arenero o usar guantes y lavarse las manos",
      "Regalar al gato de inmediato",
      "Vacunar al gato contra Toxoplasma",
      "No es necesario tomar ninguna precaución"
    ],
    correctIndex: 0,
    explanation: "No es necesario deshacerse del gato: basta con evitar el contacto directo con las heces o usar guantes y lavarse las manos."
  },
  {
    id: "tf-1",
    type: "true-false",
    prompt: "Toxoplasma gondii solo puede transmitirse por contacto directo con gatos.",
    correctAnswer: false,
    explanation: "También se transmite por carne mal cocida con quistes tisulares y por vía transplacentaria."
  },
  {
    id: "tf-2",
    type: "true-false",
    prompt: "La mayoría de los gatos infectados no muestran signos clínicos evidentes.",
    correctAnswer: true,
    explanation: "La infección felina suele cursar de forma subclínica, sobre todo en gatos adultos inmunocompetentes."
  },
  {
    id: "tf-3",
    type: "true-false",
    prompt: "Los ooquistes recién eliminados en las heces del gato ya son infectantes de inmediato.",
    correctAnswer: false,
    explanation: "Necesitan esporular en el ambiente (1 a 5 días) antes de volverse infectantes."
  },
  {
    id: "tf-4",
    type: "true-false",
    prompt: "Prácticamente todos los animales de sangre caliente pueden actuar como hospedadores intermediarios.",
    correctAnswer: true,
    explanation: "Toxoplasma gondii tiene un rango de hospedadores intermediarios inusualmente amplio."
  },
  {
    id: "ord-1",
    type: "order",
    prompt: "Ordena las etapas del ciclo biológico de Toxoplasma gondii, desde el inicio.",
    steps: [
      "El gato ingiere carne con quistes tisulares u ooquistes esporulados",
      "El parásito se reproduce sexualmente en el intestino del gato",
      "El gato elimina ooquistes no esporulados en las heces",
      "Los ooquistes esporulan en el ambiente y se vuelven infectantes",
      "Un hospedador intermediario ingiere los ooquistes y desarrolla quistes tisulares"
    ],
    explanation: "Este es el ciclo heteroxeno clásico: hospedador definitivo (gato) → ambiente → hospedador intermediario."
  },
  {
    id: "ord-2",
    type: "order",
    prompt: "Ordena los pasos correctos para limpiar el arenero del gato de forma segura.",
    steps: [
      "Ponerse guantes desechables",
      "Retirar los sólidos y las heces",
      "Lavar el arenero con agua caliente",
      "Lavarse las manos con agua y jabón al terminar"
    ],
    explanation: "Cambiar el arenero a diario (antes de que esporulen los ooquistes) y usar guantes reduce el riesgo de exposición."
  }
];
