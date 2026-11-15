import { DEMO_PARAMETER, SOURCES } from "@/lib/engine/sources";
import type { Source } from "@/lib/engine/types";
import type { HazardId } from "./risks";

export interface Bilingual {
  en: string;
  mn: string;
}

export interface IndicatorCard {
  id: string;
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
    title: { en: "Resting heart rate & HRV", mn: "Тайван үеийн зүрхний цохилт ба HRV" },
    measure: { en: "Yes — a 30-second camera check (rPPG) in this app, a finger pulse count, or a chest strap.", mn: "Тийм — энэ аппын 30 секундын камерын шалгалт, судас тоолох, эсвэл цээжний бүс." },
    why: { en: "A slow, steady rise above your own normal can be an early sign of strain, illness or poor recovery.", mn: "Өөрийн хэвийн түвшнээс аажмаар тогтвортой өсөх нь ачаалал, өвчин, сэргэлт муугийн эрт дохио байж болно." },
    hazards: ["gravity", "radiation", "isolation"],
    escalate: { en: "Self-check first. If it stays above your normal for 3+ days → Crew Medical Officer. A strong, persistent change → flight surgeon.", mn: "Эхлээд өөрөө шалга. 3+ хоног хэвийнээс дээш байвал → багийн эмч. Хүчтэй, удаан өөрчлөлт → нислэгийн эмч." },
    sources: [SOURCES.riskCardio, SOURCES.verkruysse2008],
  },
  {
    id: "bp",
    title: { en: "Blood pressure", mn: "Цусны даралт" },
    measure: { en: "Yes — an automatic cuff from the medical kit, about one minute.", mn: "Тийм — эмнэлгийн иж бүрдлийн автомат даралтын аппарат, ойролцоогоор 1 минут." },
    why: { en: "Fluids shift toward the head in weightlessness and the cardiovascular system adapts; tracking pressure shows whether it is coping.", mn: "Жингүйдэлд шингэн толгой руу шилжиж, зүрх судасны систем дасан зохицдог; даралт нь үүнийг харуулна." },
    hazards: ["gravity"],
    escalate: { en: "Systolic ≥ 140 or diastolic ≥ 90 → watch and tell the CMO; above 180/120 → contact the ground now.", mn: "Систол ≥ 140 эсвэл диастол ≥ 90 → анхаарч багийн эмчид хэл; 180/120-аас дээш → газартай нэн даруй холбогд." },
    sources: [SOURCES.riskCardio, SOURCES.accAha2017],
  },
  {
    id: "spo2",
    title: { en: "Blood oxygen (SpO₂)", mn: "Цусны хүчилтөрөгч (SpO₂)" },
    measure: { en: "Yes — a finger-clip pulse oximeter, 30 seconds.", mn: "Тийм — хуруунд зүүдэг пульсоксиметр, 30 секунд." },
    why: { en: "The crew depends completely on life support. Low oxygen causes headache and poor judgement that are hard to notice in yourself.", mn: "Баг амьдрал дэмжих системээс бүрэн хамааралтай. Хүчилтөрөгч бага бол толгой өвдөж, шийдвэр гаргалт муудна." },
    hazards: ["environment"],
    escalate: { en: "≤ 94% → assess the cause promptly (CMO); < 90% is an emergency → ground immediately.", mn: "≤ 94% → шалтгааныг яаралтай тогтоо (багийн эмч); < 90% бол яаралтай → газар руу шууд." },
    sources: [SOURCES.riskHypoxia, SOURCES.whoPulseOx],
  },
  {
    id: "glucose",
    title: { en: "Blood glucose", mn: "Цусны сахар" },
    measure: { en: "Yes — a finger-prick glucose meter.", mn: "Тийм — хуруунаас цус авдаг сахар хэмжигч." },
    why: { en: "Space menus, workload and stress change how well you are fuelled; low sugar hurts focus and mood.", mn: "Сансрын хоол, ачаалал, стресс нь эрчим хүчийг өөрчилнө; сахар бага бол анхаарал, сэтгэл санаа муудна." },
    hazards: ["environment", "distance"],
    escalate: { en: "Below 70 mg/dL → eat fast carbohydrate and re-check; repeated or very low/high values → CMO, then ground.", mn: "70 мг/дл-ээс доош → хурдан шингэх нүүрс ус идээд дахин шалга; давтагдвал → багийн эмч, дараа нь газар." },
    sources: [SOURCES.riskNutrition, SOURCES.adaHypoglycemia],
  },
  {
    id: "temperature",
    title: { en: "Body temperature", mn: "Биеийн температур" },
    measure: { en: "Yes — a digital thermometer.", mn: "Тийм — дижитал термометр." },
    why: { en: "Immune responses change in spaceflight and microbes behave differently in a closed habitat; a fever can spread to the crew.", mn: "Сансарт дархлааны хариу өөрчлөгдөж, битүү орчинд бичил биетэн өөрөөр үйлчилнэ; халуурвал багт тархаж болно." },
    hazards: ["environment", "radiation"],
    escalate: { en: "≥ 38.0 °C → rest, fluids, mask; lasting 2+ days → CMO; very high → ground.", mn: "≥ 38.0 °C → амар, шингэн уу, маск зүү; 2+ хоног үргэлжилвэл → багийн эмч; маш өндөр бол → газар." },
    sources: [SOURCES.riskImmune, SOURCES.riskHostMicrobe, SOURCES.cdcFever],
  },
  {
    id: "sleep",
    title: { en: "Sleep", mn: "Нойр" },
    measure: { en: "Yes — self-report each morning (a wrist actigraph could automate it).", mn: "Тийм — өглөө бүр өөрөө тэмдэглэх (бугуйн төхөөрөмж автоматжуулж болно)." },
    why: { en: "Shifting schedules, noise and light make sleep hard; sleep debt builds quietly and slows reactions.", mn: "Хуваарь, дуу чимээ, гэрэл нойрыг хүндрүүлнэ; нойрны дутагдал аажмаар хуримтлагдана." },
    hazards: ["isolation", "environment"],
    escalate: { en: "Below your normal for several days → protect your sleep window; 5+ days or with slower reactions → CMO.", mn: "Хэдэн хоног хэвийнээс бага бол → унтах цагаа хамгаал; 5+ хоног эсвэл хариу үйлдэл удаашарвал → багийн эмч." },
    sources: [SOURCES.riskSleep],
  },
  {
    id: "pvt",
    title: { en: "Reaction time (PVT)", mn: "Хариу үйлдлийн хурд (PVT)" },
    measure: { en: "Yes — a one-minute tap test in this app; NASA uses a short vigilance self-test on missions.", mn: "Тийм — энэ аппын 1 минутын тест; NASA нислэгт богино анхаарлын тест ашигладаг." },
    why: { en: "It catches fatigue you may not feel. Lapses (≥ 500 ms) are one of the most sensitive signs of sleep loss.", mn: "Таны мэдрэхгүй ядаргааг илрүүлнэ. Тасалдал (≥ 500 мс) нь нойргүйдлийн хамгийн мэдрэг шинж." },
    hazards: ["isolation"],
    escalate: { en: "Slower than your normal → rest before critical tasks; together with short sleep while you feel 'fine' → The Ether flags possible hidden fatigue to the CMO.", mn: "Хэвийнээс удаан бол → чухал ажлын өмнө амар; богино нойртой хамт байхад 'зүгээр' гэж мэдрэгдвэл → далд ядаргааг багийн эмчид мэдэгдэнэ." },
    sources: [SOURCES.basnerPvt, SOURCES.nasaBodyInSpace],
  },
  {
    id: "mood",
    title: { en: "Mood & crew pulse", mn: "Сэтгэл санаа ба багийн уур амьсгал" },
    measure: { en: "Yes — two taps a day: your mood, and how well the crew is working together.", mn: "Тийм — өдөрт хоёр товшилт: сэтгэл санаа ба багийн хамтын ажиллагаа." },
    why: { en: "Isolation and confinement wear people down. Low mood or crew friction that lasts is an early signal for behavioral health and teamwork risks.", mn: "Тусгаарлалт хүнийг ядраана. Удаан үргэлжлэх муу сэтгэл санаа, багийн зөрчил нь эрт дохио." },
    hazards: ["isolation", "distance"],
    escalate: { en: "A few low days → reach out to a crewmate; lasting → private CMO check-in; severe → ground behavioral health team.", mn: "Хэдэн муу өдөр → багийн гишүүнтэй ярилц; үргэлжилвэл → багийн эмчтэй ганцаарчлан; хүнд бол → газрын сэтгэл зүйч." },
    sources: [SOURCES.riskBehavioral, SOURCES.riskTeamwork],
  },
  {
    id: "exercise",
    title: { en: "Exercise & bone health", mn: "Дасгал ба ясны эрүүл мэнд" },
    measure: { en: "Yes — exercise minutes are logged by the equipment or by you.", mn: "Тийм — дасгалын минутыг төхөөрөмж эсвэл та өөрөө тэмдэглэнэ." },
    why: { en: "Without gravity, weight-bearing bones lose mineral density and muscles weaken. Daily resistance exercise is the main countermeasure.", mn: "Таталцалгүй үед яс эрдэсээ алдаж, булчин суларна. Өдөр бүрийн хүчний дасгал гол хамгаалалт." },
    hazards: ["gravity"],
    escalate: { en: "Missing sessions → a resistance quest appears; a growing bone-risk score → CMO reviews the schedule. (The score is a demo model, not a bone scan.)", mn: "Дасгал алгасвал → хүчний даалгавар гарна; эрсдэлийн оноо өсвөл → багийн эмч. (Оноо нь загвар, ясны зураг биш.)" },
    sources: [SOURCES.riskBone, SOURCES.riskFitness, DEMO_PARAMETER],
  },
  {
    id: "radiation",
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

/**
 * Plain-language summary of the CSA article "Monitoring radiation for astronaut health"
 * (26 Feb 2026). Every point paraphrases the article; nothing is added.
 */
export const CSA_RADIATION: readonly Bilingual[] = [
  {
    en: "Radiation is one of the main challenges for astronauts who live and work beyond the protection of Earth's atmosphere.",
    mn: "Дэлхийн агаар мандлын хамгаалалтаас гадна амьдарч, ажилладаг сансрын нисгэгчдэд цацраг бол гол бэрхшээлүүдийн нэг.",
  },
  {
    en: "On the International Space Station, neutron radiation makes up about 30% of all radiation. The CSA calls it especially harmful: it can seriously damage the body, so it needs special protection.",
    mn: "Олон улсын сансрын станцад нийт цацрагийн 30 орчим хувийг нейтроны цацраг эзэлдэг. Канадын сансрын агентлаг үүнийг онцгой хортой гэж үздэг: биед ноцтой гэмтэл учруулж болох тул тусгай хамгаалалт шаарддаг.",
  },
  {
    en: "Canada has measured radiation on the ISS for years — for example bubble detectors (used by astronaut David Saint-Jacques), MOSFET, EVARM, and Radi-N / Radi-N2.",
    mn: "Канад олон жил ОУСС-д цацраг хэмжиж ирсэн — жишээ нь бөмбөлөгт мэдрэгч (сансрын нисгэгч Давид Сен-Жак ашигласан), MOSFET, EVARM, Radi-N / Radi-N2.",
  },
  {
    en: "Next comes CANS, the Canadian Active Neutron Spectrometer: a compact instrument that measures neutron exposure continuously and on its own. The CSA gave Bubble Technology Industries a $5.5 million contract to keep developing it.",
    mn: "Дараагийнх нь CANS буюу Канадын идэвхтэй нейтроны спектрометр: нейтроны цацрагийг тасралтгүй, бие даан хэмждэг авсаархан багаж. Агентлаг үүнийг үргэлжлүүлэн хөгжүүлэхээр Bubble Technology Industries компанитай 5.5 сая долларын гэрээ байгуулсан.",
  },
  {
    en: "Better measurements help design better ways to lower the risk to astronauts' health. The CSA adds that the same data could help on Earth too — for example in cancer therapy and in radiation protection for aircrews.",
    mn: "Илүү сайн хэмжилт нь сансрын нисгэгчдийн эрүүл мэндийн эрсдэлийг бууруулах арга боловсруулахад тусална. Мөн энэ мэдээлэл дэлхий дээр ч хэрэгтэй — жишээ нь хорт хавдрын эмчилгээ, нисэх багийн цацрагийн хамгаалалтад.",
  },
];

/** How The Ether uses the radiation explainer (our own statement, not the CSA's). */
export const CSA_RADIATION_IN_APP: Bilingual = {
  en: "In The Ether, each crewmember's dose is tracked against NASA's career limit, and real solar particle events from NASA DONKI become shelter alerts. The dosimeter numbers are simulated; an instrument like CANS is what would feed this screen on a real mission.",
  mn: "The Ether-д багийн гишүүн бүрийн тунг NASA-гийн карьерын хязгаартай харьцуулж, NASA DONKI-гийн бодит нарны бөөмийн шуургыг хоргодох сэрэмжлүүлэг болгоно. Дозиметрийн тоо загварчилсан; бодит нислэгт CANS шиг багаж энэ дэлгэцэд мэдээлэл өгнө.",
};

/**
 * Why space research helps people on Earth — paraphrased from the CSA page
 * "Why do we conduct science experiments in space?". The last point is our own link to Steppe mode.
 */
export const EARTH_BENEFITS: readonly Bilingual[] = [
  {
    en: "Studying how the body changes in space shows what happens with less physical activity: the effects seen in astronauts resemble accelerated aging and the health problems of a sedentary lifestyle.",
    mn: "Сансарт бие хэрхэн өөрчлөгдөхийг судлах нь хөдөлгөөн багассан үед юу болдгийг харуулдаг: сансрын нисгэгчдэд ажиглагддаг өөрчлөлт нь хурдасгасан хөгшрөлт, суугаа амьдралын хэв маягийн эрүүл мэндийн асуудалтай төстэй.",
  },
  {
    en: "Six months in space produce data that would take years to gather on Earth.",
    mn: "Сансарт зургаан сар байхад дэлхий дээр олон жил цуглуулах мэдээлэл гардаг.",
  },
  {
    en: "The findings can help people with balance problems (such as seniors), osteoporosis, cardiovascular disorders and type 2 diabetes.",
    mn: "Судалгааны үр дүн тэнцвэрийн асуудалтай хүмүүс (жишээ нь ахмад настан), ясны сийрэгжилт, зүрх судасны эмгэг, 2-р хэлбэрийн чихрийн шижинтэй хүмүүст тусалж болно.",
  },
];

export const EARTH_BENEFITS_OURS: Bilingual = {
  en: "That is the idea behind Steppe mode: a herder far from the soum hospital faces the same problem as a crew far from Earth — notice changes early and act before help can arrive.",
  mn: "Тал нутгийн горимын санаа үүнд оршино: сумын эмнэлгээс хол байгаа малчин, дэлхийгээс хол байгаа багийн адил асуудалтай тулгардаг — өөрчлөлтийг эрт анзаарч, тусламж ирэхээс өмнө арга хэмжээ авах.",
};

export type DataSourceKind = "official" | "api";
export type DataFeedKey = "spaceWeather" | "lightTime" | "weather";

export interface DataSourceEntry {
  id: string;
  kind: DataSourceKind;
  /** Proper name, kept in English. */
  name: string;
  url: string;
  /** What it powers in the app. */
  powers: Bilingual;
  /** For APIs: the server route that calls it, and which feed holds its data. */
  route?: string;
  feed?: DataFeedKey;
  hazard?: HazardId;
}

/** Every official challenge resource and NASA API The Ether uses, and what each one powers. */
export const DATA_SOURCES: readonly DataSourceEntry[] = [
  {
    id: "hrpHazards",
    kind: "official",
    name: "NASA HRP — 5 Hazards of Human Spaceflight",
    url: SOURCES.hrpHazards.url!,
    powers: {
      en: "The five hazard names. Every alert, indicator and body system is tagged with its hazard(s), and Learn groups content by hazard.",
      mn: "Таван аюулын нэр. Сэрэмжлүүлэг, үзүүлэлт, биеийн систем бүрийг аюултай нь холбож, Мэдлэг хэсэг аюулаар бүлэглэнэ.",
    },
  },
  {
    id: "hrpRisks",
    kind: "official",
    name: "NASA HRP — Risks of Human Spaceflight",
    url: SOURCES.hrpRisks.url!,
    powers: {
      en: "13 of the 17 listed risks. Each alert and body system links to its own NASA risk page.",
      mn: "Жагсаасан 17 эрсдэлийн 13. Сэрэмжлүүлэг, биеийн систем бүр NASA-гийн өөрийн эрсдэлийн хуудас руу холбогдоно.",
    },
  },
  {
    id: "hrpResearch",
    kind: "official",
    name: "NASA HRP — Ongoing HRP Research",
    url: SOURCES.hrpResearch.url!,
    powers: {
      en: "Background for the Learn cards: HRP studies how to protect astronauts' health and performance, across behavioral performance, health countermeasures and space radiation.",
      mn: "Мэдлэг картын суурь: HRP сансрын нисгэгчдийн эрүүл мэнд, гүйцэтгэлийг хамгаалах аргыг зан төлөв, эрүүл мэндийн хамгаалалт, сансрын цацрагийн чиглэлээр судалдаг.",
    },
  },
  {
    id: "csaRadiation",
    kind: "official",
    name: "Canadian Space Agency — Monitoring radiation for astronaut health",
    url: SOURCES.csaRadiation.url!,
    powers: {
      en: "The radiation explainer (neutron radiation, Canadian ISS instruments, CANS) and a source on every solar particle event alert.",
      mn: "Цацрагийн тайлбар (нейтроны цацраг, Канадын ОУСС дахь багаж, CANS), нарны бөөмийн шуурганы сэрэмжлүүлэг бүрийн эх сурвалж.",
    },
  },
  {
    id: "csaScience",
    kind: "official",
    name: "Canadian Space Agency — Why do we conduct science experiments in space?",
    url: SOURCES.csaScience.url!,
    powers: {
      en: "The \"why space research helps Earth\" note, which is the reason Steppe mode exists.",
      mn: "\"Сансрын судалгаа дэлхийд хэрхэн тусалдаг\" тэмдэглэл — Тал нутгийн горимын үндэслэл.",
    },
  },
  {
    id: "donki",
    kind: "api",
    name: "NASA DONKI — Solar Energetic Particle events (api.nasa.gov, backup: CCMC kauai)",
    url: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
    route: "/api/nasa/space-weather",
    feed: "spaceWeather",
    hazard: "radiation",
    powers: {
      en: "Space weather replay: real 2024 solar particle events seen by GOES are mapped onto mission days — markers on the Mission Clock and Trends, and a shelter alert where the Crew Medical Officer checks everyone's dose.",
      mn: "Сансрын цаг агаарын давталт: GOES бүртгэсэн 2024 оны бодит нарны бөөмийн шуургыг нислэгийн өдрүүдэд буулгана — Цагийн шугам, Чиг хандлага дээрх тэмдэг, багийн эмч хүн бүрийн тунг шалгах хоргодох сэрэмжлүүлэг.",
    },
  },
  {
    id: "horizons",
    kind: "api",
    name: "NASA JPL Horizons — Earth–Mars one-way light time",
    url: "https://ssd.jpl.nasa.gov/horizons/",
    route: "/api/nasa/light-time",
    feed: "lightTime",
    hazard: "distance",
    powers: {
      en: "\"Signal to Earth\" for Mars base and rover (real light time on each mission date) and Mars transit (approximate, scaled toward Mars). Long delays make Earth-level alerts say the Crew Medical Officer acts first; the Message to Ground countdown uses the same number.",
      mn: "Ангараг дахь бааз, роверын \"Дэлхий хүртэлх дохио\" (өдөр бүрийн бодит гэрлийн хугацаа), Ангараг руу нисэх үе (ойролцоо). Саатал урт бол дэлхийн түвшний сэрэмжлүүлэгт багийн эмч эхэлж арга хэмжээ авна гэж заана.",
    },
  },
  {
    id: "power",
    kind: "api",
    name: "NASA POWER — daily weather (temperature, wind)",
    url: "https://power.larc.nasa.gov/",
    route: "/api/nasa/weather",
    feed: "weather",
    hazard: "environment",
    powers: {
      en: "Steppe mode: real February 2024 weather near Uliastai, Zavkhan aimag — today's weather card, the temperature chart on Trends, and the cold-snap marker.",
      mn: "Тал нутгийн горим: Завхан аймгийн Улиастайн орчмын 2024 оны 2-р сарын бодит цаг агаар — өнөөдрийн цаг агаарын карт, Чиг хандлага дахь температурын график, хүйтний давалгааны тэмдэг.",
    },
  },
];

/** What is simulated (shown on Data & sources). */
export const SIMULATED_NOTE: Bilingual = {
  en: "Simulated: every crew and herder health reading (heart rate, blood pressure, sleep, mood, reaction time, exercise, dosimeter). They come from a seeded generator so the demo story is repeatable. The dosimeter spikes are timed to the real DONKI events, but their size is simulated.",
  mn: "Загварчилсан: багийн гишүүд ба малчны эрүүл мэндийн бүх хэмжилт (зүрхний цохилт, даралт, нойр, сэтгэл санаа, хариу үйлдэл, дасгал, дозиметр). Үзүүлэнг давтагдахуйц болгохын тулд тогтмол үүсгэгчээр гаргасан. Дозиметрийн өсөлт DONKI-гийн бодит үйл явдалтай давхцах боловч хэмжээ нь загварчилсан.",
};
