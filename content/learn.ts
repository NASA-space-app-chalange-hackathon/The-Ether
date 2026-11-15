import { DEMO_PARAMETER, SOURCES } from "@/lib/engine/sources";
import type { Source } from "@/lib/engine/types";
import type { HazardId } from "./risks";

export interface Bilingual {
  en: string;
  mn: string;
}

export interface IndicatorCard {
  id: string;
  icon: string;
  title: Bilingual;
  /** Can it be measured in space, and how? */
  measure: Bilingual;
  /** Why the exam is needed. */
  why: Bilingual;
  hazards: readonly HazardId[];
  /** When it needs the crew vs. the ground. */
  escalate: Bilingual;
  sources: readonly Source[];
}

/** Plain-language explainer cards. Numbers appear only where a source in lib/engine/sources.ts supports them. */
export const INDICATOR_CARDS: readonly IndicatorCard[] = [
  {
    id: "heart",
    icon: "🫀",
    title: { en: "Resting heart rate & HRV", mn: "Тайван үеийн зүрхний цохилт ба HRV" },
    measure: { en: "Yes — a 30-second camera check (rPPG) in this app, a finger pulse count, or a chest strap.", mn: "Тийм — энэ аппын 30 секундын камерын шалгалт, судас тоолох, эсвэл цээжний бүс." },
    why: { en: "A slow, steady rise above your own normal can be an early sign of strain, illness or poor recovery.", mn: "Өөрийн хэвийн түвшнээс аажмаар тогтвортой өсөх нь ачаалал, өвчин, сэргэлт муугийн эрт дохио байж болно." },
    hazards: ["gravity", "radiation", "isolation"],
    escalate: { en: "Self-check first. If it stays above your normal for 3+ days → Crew Medical Officer. A strong, persistent change → flight surgeon.", mn: "Эхлээд өөрөө шалга. 3+ хоног хэвийнээс дээш байвал → багийн эмч. Хүчтэй, удаан өөрчлөлт → нислэгийн эмч." },
    sources: [SOURCES.riskCardio, SOURCES.verkruysse2008],
  },
  {
    id: "bp",
    icon: "🩸",
    title: { en: "Blood pressure", mn: "Цусны даралт" },
    measure: { en: "Yes — an automatic cuff from the medical kit, about one minute.", mn: "Тийм — эмнэлгийн иж бүрдлийн автомат даралтын аппарат, ойролцоогоор 1 минут." },
    why: { en: "Fluids shift toward the head in weightlessness and the cardiovascular system adapts; tracking pressure shows whether it is coping.", mn: "Жингүйдэлд шингэн толгой руу шилжиж, зүрх судасны систем дасан зохицдог; даралт нь үүнийг харуулна." },
    hazards: ["gravity"],
    escalate: { en: "Systolic ≥ 140 or diastolic ≥ 90 → watch and tell the CMO; above 180/120 → contact the ground now.", mn: "Систол ≥ 140 эсвэл диастол ≥ 90 → анхаарч багийн эмчид хэл; 180/120-аас дээш → газартай нэн даруй холбогд." },
    sources: [SOURCES.riskCardio, SOURCES.accAha2017],
  },
  {
    id: "spo2",
    icon: "🫁",
    title: { en: "Blood oxygen (SpO₂)", mn: "Цусны хүчилтөрөгч (SpO₂)" },
    measure: { en: "Yes — a finger-clip pulse oximeter, 30 seconds.", mn: "Тийм — хуруунд зүүдэг пульсоксиметр, 30 секунд." },
    why: { en: "The crew depends completely on life support. Low oxygen causes headache and poor judgement that are hard to notice in yourself.", mn: "Баг амьдрал дэмжих системээс бүрэн хамааралтай. Хүчилтөрөгч бага бол толгой өвдөж, шийдвэр гаргалт муудна." },
    hazards: ["environment"],
    escalate: { en: "≤ 94% → assess the cause promptly (CMO); < 90% is an emergency → ground immediately.", mn: "≤ 94% → шалтгааныг яаралтай тогтоо (багийн эмч); < 90% бол яаралтай → газар руу шууд." },
    sources: [SOURCES.riskHypoxia, SOURCES.whoPulseOx],
  },
  {
    id: "glucose",
    icon: "🍽",
    title: { en: "Blood glucose", mn: "Цусны сахар" },
    measure: { en: "Yes — a finger-prick glucose meter.", mn: "Тийм — хуруунаас цус авдаг сахар хэмжигч." },
    why: { en: "Space menus, workload and stress change how well you are fuelled; low sugar hurts focus and mood.", mn: "Сансрын хоол, ачаалал, стресс нь эрчим хүчийг өөрчилнө; сахар бага бол анхаарал, сэтгэл санаа муудна." },
    hazards: ["environment", "distance"],
    escalate: { en: "Below 70 mg/dL → eat fast carbohydrate and re-check; repeated or very low/high values → CMO, then ground.", mn: "70 мг/дл-ээс доош → хурдан шингэх нүүрс ус идээд дахин шалга; давтагдвал → багийн эмч, дараа нь газар." },
    sources: [SOURCES.riskNutrition, SOURCES.adaHypoglycemia],
  },
  {
    id: "temperature",
    icon: "🌡",
    title: { en: "Body temperature", mn: "Биеийн температур" },
    measure: { en: "Yes — a digital thermometer.", mn: "Тийм — дижитал термометр." },
    why: { en: "Immune responses change in spaceflight and microbes behave differently in a closed habitat; a fever can spread to the crew.", mn: "Сансарт дархлааны хариу өөрчлөгдөж, битүү орчинд бичил биетэн өөрөөр үйлчилнэ; халуурвал багт тархаж болно." },
    hazards: ["environment", "radiation"],
    escalate: { en: "≥ 38.0 °C → rest, fluids, mask; lasting 2+ days → CMO; very high → ground.", mn: "≥ 38.0 °C → амар, шингэн уу, маск зүү; 2+ хоног үргэлжилвэл → багийн эмч; маш өндөр бол → газар." },
    sources: [SOURCES.riskImmune, SOURCES.riskHostMicrobe, SOURCES.cdcFever],
  },
  {
    id: "sleep",
    icon: "🌙",
    title: { en: "Sleep", mn: "Нойр" },
    measure: { en: "Yes — self-report each morning (a wrist actigraph could automate it).", mn: "Тийм — өглөө бүр өөрөө тэмдэглэх (бугуйн төхөөрөмж автоматжуулж болно)." },
    why: { en: "Shifting schedules, noise and light make sleep hard; sleep debt builds quietly and slows reactions.", mn: "Хуваарь, дуу чимээ, гэрэл нойрыг хүндрүүлнэ; нойрны дутагдал аажмаар хуримтлагдана." },
    hazards: ["isolation", "environment"],
    escalate: { en: "Below your normal for several days → protect your sleep window; 5+ days or with slower reactions → CMO.", mn: "Хэдэн хоног хэвийнээс бага бол → унтах цагаа хамгаал; 5+ хоног эсвэл хариу үйлдэл удаашарвал → багийн эмч." },
    sources: [SOURCES.riskSleep],
  },
  {
    id: "pvt",
    icon: "⚡",
    title: { en: "Reaction time (PVT)", mn: "Хариу үйлдлийн хурд (PVT)" },
    measure: { en: "Yes — a one-minute tap test in this app; NASA uses a short vigilance self-test on missions.", mn: "Тийм — энэ аппын 1 минутын тест; NASA нислэгт богино анхаарлын тест ашигладаг." },
    why: { en: "It catches fatigue you may not feel. Lapses (≥ 500 ms) are one of the most sensitive signs of sleep loss.", mn: "Таны мэдрэхгүй ядаргааг илрүүлнэ. Тасалдал (≥ 500 мс) нь нойргүйдлийн хамгийн мэдрэг шинж." },
    hazards: ["isolation"],
    escalate: { en: "Slower than your normal → rest before critical tasks; together with short sleep while you feel 'fine' → The Ether flags possible hidden fatigue to the CMO.", mn: "Хэвийнээс удаан бол → чухал ажлын өмнө амар; богино нойртой хамт байхад 'зүгээр' гэж мэдрэгдвэл → далд ядаргааг багийн эмчид мэдэгдэнэ." },
    sources: [SOURCES.basnerPvt, SOURCES.nasaBodyInSpace],
  },
  {
    id: "mood",
    icon: "🙂",
    title: { en: "Mood & crew pulse", mn: "Сэтгэл санаа ба багийн уур амьсгал" },
    measure: { en: "Yes — two taps a day: your mood, and how well the crew is working together.", mn: "Тийм — өдөрт хоёр товшилт: сэтгэл санаа ба багийн хамтын ажиллагаа." },
    why: { en: "Isolation and confinement wear people down. Low mood or crew friction that lasts is an early signal for behavioral health and teamwork risks.", mn: "Тусгаарлалт хүнийг ядраана. Удаан үргэлжлэх муу сэтгэл санаа, багийн зөрчил нь эрт дохио." },
    hazards: ["isolation", "distance"],
    escalate: { en: "A few low days → reach out to a crewmate; lasting → private CMO check-in; severe → ground behavioral health team.", mn: "Хэдэн муу өдөр → багийн гишүүнтэй ярилц; үргэлжилвэл → багийн эмчтэй ганцаарчлан; хүнд бол → газрын сэтгэл зүйч." },
    sources: [SOURCES.riskBehavioral, SOURCES.riskTeamwork],
  },
  {
    id: "exercise",
    icon: "🏋",
    title: { en: "Exercise & bone health", mn: "Дасгал ба ясны эрүүл мэнд" },
    measure: { en: "Yes — exercise minutes are logged by the equipment or by you.", mn: "Тийм — дасгалын минутыг төхөөрөмж эсвэл та өөрөө тэмдэглэнэ." },
    why: { en: "Without gravity, weight-bearing bones lose mineral density and muscles weaken. Daily resistance exercise is the main countermeasure.", mn: "Таталцалгүй үед яс эрдэсээ алдаж, булчин суларна. Өдөр бүрийн хүчний дасгал гол хамгаалалт." },
    hazards: ["gravity"],
    escalate: { en: "Missing sessions → a resistance quest appears; a growing bone-risk score → CMO reviews the schedule. (The score is a demo model, not a bone scan.)", mn: "Дасгал алгасвал → хүчний даалгавар гарна; эрсдэлийн оноо өсвөл → багийн эмч. (Оноо нь загвар, ясны зураг биш.)" },
    sources: [SOURCES.riskBone, SOURCES.riskFitness, DEMO_PARAMETER],
  },
  {
    id: "radiation",
    icon: "☢",
    title: { en: "Radiation dose", mn: "Цацрагийн тун" },
    measure: { en: "Yes — personal and area dosimeters. On the way to Mars the cruise dose is about 1.8 mSv per day.", mn: "Тийм — хувийн ба орчны дозиметр. Ангараг руу нисэхэд өдөрт ойролцоогоор 1.8 мЗв." },
    why: { en: "Dose adds up over a career and raises long-term cancer risk; NASA keeps career dose under 600 mSv. Solar storms can add days of dose in hours.", mn: "Тун карьерын туршид хуримтлагдаж хорт хавдрын эрсдэлийг нэмнэ; NASA 600 мЗв-ээс доош байлгана. Нарны шуурга хэдэн цагт олон хоногийн тун өгч болно." },
    hazards: ["radiation"],
    escalate: { en: "Solar particle event → shelter now (self); half of the career limit → CMO plans to limit dose; most of it → ground.", mn: "Нарны бөөмийн шуурга → нэн даруй хоргод; карьерын хязгаарын тал → багийн эмч; ихэнх нь → газар." },
    sources: [SOURCES.nasaRadiationLimit, SOURCES.swriRad, SOURCES.csaRadiation],
  },
];

/** Mongolian names and summaries for the five hazards (English lives in content/risks.ts). */
export const HAZARDS_MN: Record<HazardId, { name: string; summary: string }> = {
  radiation: { name: "Сансрын цацраг", summary: "Дэлхийн соронзон орноос гадна сансрын туяа, нарны шуурга хорт хавдрын эрсдэлийг нэмнэ." },
  isolation: { name: "Тусгаарлалт ба хязгаарлагдмал орчин", summary: "Олон сар цөөн хүнтэй жижиг орон зайд байх нь нойр, сэтгэл санаа, багийн ажилд нөлөөлнө." },
  distance: { name: "Дэлхийгээс хол", summary: "Ангарагт мессеж нэг тийш 20 хүртэл минут явна — баг асуудлаа өөрсдөө шийднэ." },
  gravity: { name: "Таталцлын орон", summary: "Жингүйдэл шингэнийг толгой руу шилжүүлж, яс булчинг сулруулна." },
  environment: { name: "Битүү, хүнд орчин", summary: "Агаар, температур, дуу чимээ, бичил биетэн бүгдэд нөлөөлнө." },
};

export const HOW_IT_WORKS: Bilingual = {
  en: "The Ether learns each person's normal from the first 14 days (median and spread), compares every new reading with it, and only raises an alert when a change lasts (3 of the last 5 days) or crosses a safety threshold. Each alert says what changed, why it matters, what to do now, and who should act.",
  mn: "The Ether эхний 14 хоногоос хүн бүрийн хэвийн түвшинг суралцаж, шинэ хэмжилт бүрийг түүнтэй харьцуулна. Өөрчлөлт удаан үргэлжилбэл (сүүлийн 5 хоногийн 3) эсвэл аюулгүйн босгыг давбал л сэрэмжлүүлнэ. Сэрэмжлүүлэг бүр юу өөрчлөгдсөн, яагаад чухал, юу хийх, хэн хариуцахыг хэлнэ.",
};

/** The challenge's official Resources tab, and how The Ether uses each one. */
export const CHALLENGE_RESOURCES: readonly { source: Source; use: Bilingual }[] = [
  {
    source: SOURCES.hrpHazards,
    use: {
      en: "Our hazard model: the five hazards (radiation, isolation and confinement, distance, gravity, hostile/closed environments) are named exactly as NASA lists them and tagged on every indicator card.",
      mn: "Аюулын загвар: таван аюулыг NASA-гийн нэрээр нь авч, үзүүлэлт бүрт холбосон.",
    },
  },
  {
    source: SOURCES.hrpRisks,
    use: {
      en: "Every body region, alert and Learn card links to the matching HRP risk page — 13 risks from immune response to inadequate teamwork.",
      mn: "Биеийн хэсэг, сэрэмжлүүлэг бүр харгалзах HRP эрсдэлийн хуудастай холбогдсон — нийт 13 эрсдэл.",
    },
  },
  {
    source: SOURCES.hrpResearch,
    use: {
      en: "Shows which countermeasures NASA is studying today; it guided our focus on sleep, vigilance testing, exercise and crew behavioral health.",
      mn: "NASA-гийн одоогийн судалгааг харуулна; нойр, анхаарлын тест, дасгал, багийн сэтгэл зүйд анхаарахад чиглүүлсэн.",
    },
  },
  {
    source: SOURCES.csaRadiation,
    use: {
      en: "Background for the radiation meter and solar-storm alert: why dose is monitored continuously and why neutrons matter on the station.",
      mn: "Цацрагийн хэмжүүр ба нарны шуурганы сэрэмжлүүлгийн суурь мэдээлэл.",
    },
  },
  {
    source: SOURCES.csaScience,
    use: {
      en: "Spaceflight changes resemble accelerated aging and a sedentary life on Earth — the reason the same engine can serve people far from care in Steppe mode.",
      mn: "Сансрын өөрчлөлт дэлхий дээрх хөгшрөлт, хөдөлгөөний дутагдалтай төстэй — тиймээс ижил систем малчдад тусална.",
    },
  },
];
