import type { Bilingual } from "./learn";

export type GlossaryId = "sans" | "pvt" | "msv" | "cmo" | "flightSurgeon" | "xp" | "signal" | "hrv" | "spo2" | "normal" | "sep" | "soum" | "family" | "e103";

export interface GlossaryEntry {
  id: GlossaryId;
  term: Bilingual;
  /** One plain sentence, shown in the tooltip and the Learn glossary. */
  short: Bilingual;
  /** Which mode the word appears in. */
  modes: readonly ("space" | "steppe")[];
}

/** Plain explanations for the few technical words the app keeps. */
export const GLOSSARY: readonly GlossaryEntry[] = [
  {
    id: "normal",
    term: { en: "Your normal / usual range", mn: "Таны хэвийн / ердийн хүрээ" },
    short: {
      en: "What is typical for this person, learned from their first 14 days. Changes are judged against it, not against population averages.",
      mn: "Тухайн хүний эхний 14 хоногоос суралцсан ердийн түвшин. Өөрчлөлтийг хүн амын дунджаар биш, үүнтэй харьцуулж үнэлнэ.",
    },
    modes: ["space", "steppe"],
  },
  {
    id: "signal",
    term: { en: "Signal to Earth", mn: "Дэлхий рүү дохио" },
    short: {
      en: "How long a message takes to reach Earth, one way. On the way to Mars it is minutes, so the crew must act first.",
      mn: "Мессеж Дэлхийд нэг чиглэлд хүрэх хугацаа. Ангараг руу явахад хэдэн минут болдог тул баг эхэлж арга хэмжээ авна.",
    },
    modes: ["space"],
  },
  {
    id: "cmo",
    term: { en: "CMO (crew doctor)", mn: "Багийн эмч (CMO)" },
    short: {
      en: "Crew Medical Officer: the crewmate trained to give medical care on board.",
      mn: "Багийн эмнэлгийн ажилтан: хөлөг дээр эмнэлгийн тусламж үзүүлэх бэлтгэлтэй багийн гишүүн.",
    },
    modes: ["space"],
  },
  {
    id: "flightSurgeon",
    term: { en: "Flight surgeon (doctors on Earth)", mn: "Нислэгийн эмч (Дэлхий дээрх эмч)" },
    short: {
      en: "The mission's doctors in Mission Control. They answer when a message arrives.",
      mn: "Нислэгийн удирдлагын төв дэх эмч нар. Мессеж очмогц хариулна.",
    },
    modes: ["space"],
  },
  {
    id: "pvt",
    term: { en: "PVT (reaction-time test)", mn: "PVT (хариу үйлдлийн тест)" },
    short: {
      en: "A short test: tap as soon as a counter appears. Slower taps and missed ones (lapses) are an early sign of tiredness.",
      mn: "Богино тест: тоолуур гармагц товш. Удаан эсвэл алгассан товшилт (тасалдал) ядаргааны эрт шинж.",
    },
    modes: ["space", "steppe"],
  },
  {
    id: "sans",
    term: { en: "SANS (eye changes in space)", mn: "SANS (сансар дахь нүдний өөрчлөлт)" },
    short: {
      en: "Spaceflight Associated Neuro-ocular Syndrome: swelling at the back of the eye and vision changes linked to fluids shifting toward the head.",
      mn: "Сансрын нислэгийн мэдрэл-нүдний хам шинж: шингэн толгой руу шилжсэнтэй холбоотой нүдний ар талын хаван, хараа өөрчлөгдөх.",
    },
    modes: ["space"],
  },
  {
    id: "msv",
    term: { en: "mSv (radiation dose)", mn: "мЗв (цацрагийн тун)" },
    short: {
      en: "Millisievert, the unit of radiation dose. On the way to Mars a crew gets about 1.8 mSv a day; NASA's career limit is 600 mSv.",
      mn: "Миллизиверт — цацрагийн тунгийн нэгж. Ангараг руу явахад баг өдөрт ойролцоогоор 1.8 мЗв авна; NASA-гийн карьерын хязгаар 600 мЗв.",
    },
    modes: ["space"],
  },
  {
    id: "sep",
    term: { en: "Solar particle event (solar storm)", mn: "Нарны бөөмийн шуурга" },
    short: {
      en: "A burst of fast particles from the Sun that can deliver days of radiation dose in hours. The crew shelters in the most shielded area.",
      mn: "Нарнаас ирэх хурдан бөөмийн урсгал; хэдхэн цагт олон хоногийн тун өгч болно. Баг хамгийн сайн хамгаалалттай хэсэгт хоргодно.",
    },
    modes: ["space"],
  },
  {
    id: "hrv",
    term: { en: "Heart rate variability (HRV)", mn: "Зүрхний цохилтын хэлбэлзэл (HRV)" },
    short: {
      en: "How much the time between heartbeats varies. Lower than your normal can mean stress, poor recovery or illness.",
      mn: "Зүрхний цохилт хоорондын хугацааны хэлбэлзэл. Хэвийнээс бага бол стресс, сэргэлт муу, өвчний шинж байж болно.",
    },
    modes: ["space"],
  },
  {
    id: "spo2",
    term: { en: "SpO₂ (blood oxygen)", mn: "SpO₂ (цусны хүчилтөрөгч)" },
    short: {
      en: "The share of your blood that carries oxygen, measured with a finger clip. 95% or more is normal.",
      mn: "Цусны хэдэн хувь хүчилтөрөгч зөөж байгааг хуруунд зүүдэг аппаратаар хэмжинэ. 95% ба түүнээс дээш бол хэвийн.",
    },
    modes: ["space", "steppe"],
  },
  {
    id: "xp",
    term: { en: "XP (points)", mn: "XP (оноо)" },
    short: { en: "Points for healthy habits, earned by completing daily quests.", mn: "Өдрийн даалгавар биелүүлж цуглуулах эрүүл зуршлын оноо." },
    modes: ["space", "steppe"],
  },
  {
    id: "soum",
    term: { en: "Soum hospital", mn: "Сумын эмнэлэг" },
    short: {
      en: "The small hospital of a soum (rural district) in Mongolia — often the nearest one for a herder family.",
      mn: "Сумын төвийн эмнэлэг — малчин өрхөд ихэвчлэн хамгийн ойрын эмнэлэг.",
    },
    modes: ["steppe"],
  },
  {
    id: "family",
    term: { en: "Family doctor", mn: "Өрхийн эмч" },
    short: { en: "The household's own doctor, who can often advise by phone.", mn: "Өрхийн харьяа эмч; ихэвчлэн утсаар зөвлөгөө өгч чадна." },
    modes: ["steppe"],
  },
  {
    id: "e103",
    term: { en: "103", mn: "103" },
    short: { en: "Mongolia's emergency medical phone number.", mn: "Монгол Улсын түргэн тусламжийн утасны дугаар." },
    modes: ["steppe"],
  },
];

export const GLOSSARY_BY_ID = Object.fromEntries(GLOSSARY.map((g) => [g.id, g])) as Record<GlossaryId, GlossaryEntry>;
