import { DEMO_PARAMETER, SOURCES } from "@/lib/engine/sources";
import type { RegionId } from "@/lib/engine/regions";
import type { Source } from "@/lib/engine/types";
import type { Bilingual } from "./learn";

/** Earth twin of the space hazards: what a herder household far from care faces. General guidance, not cited figures. */
export interface SteppeRisk {
  id: "cold" | "altitude" | "isolation" | "distance";
  icon: string;
  title: Bilingual;
  summary: Bilingual;
  /** The space hazard it mirrors (for the "same problem" story). */
  mirrors: Bilingual;
  sources: readonly Source[];
}

export const STEPPE_RISKS: readonly SteppeRisk[] = [
  {
    id: "cold",
    icon: "❄️",
    title: { en: "Cold exposure", mn: "Хүйтний нөлөө" },
    summary: { en: "Long, deep winters tighten blood vessels, raise blood pressure, and risk frostbite during herd work.", mn: "Урт, хүйтэн өвөл судсыг агшааж, даралтыг нэмж, мал маллах үед хөлдөлтийн эрсдэлтэй." },
    mirrors: { en: "Hostile environment", mn: "Хүнд орчин" },
    sources: [DEMO_PARAMETER],
  },
  {
    id: "altitude",
    icon: "⛰",
    title: { en: "High altitude", mn: "Өндөрлөг газар" },
    summary: { en: "Thinner air means a little less oxygen; smoke from the stove inside the ger makes it worse.", mn: "Агаар сийрэг тул хүчилтөрөгч бага; гэрийн зуухны утаа үүнийг улам дордуулна." },
    mirrors: { en: "Closed environment", mn: "Битүү орчин" },
    sources: [DEMO_PARAMETER],
  },
  {
    id: "isolation",
    icon: "🏕",
    title: { en: "Isolation", mn: "Тусгаарлалт" },
    summary: { en: "Months at a remote winter camp with the same few people wear down sleep, mood, and relationships.", mn: "Алслагдсан өвөлжөөнд цөөн хүнтэй олон сар байх нь нойр, сэтгэл санаа, харилцаанд нөлөөлнө." },
    mirrors: { en: "Isolation and confinement", mn: "Тусгаарлалт ба хязгаарлагдмал орчин" },
    sources: [DEMO_PARAMETER],
  },
  {
    id: "distance",
    icon: "🏥",
    title: { en: "Distance to the soum hospital", mn: "Сумын эмнэлэг хүртэлх зай" },
    summary: { en: "The nearest doctor can be hours away and the phone signal unreliable — so, like astronauts, herders must judge their own health first.", mn: "Ойрын эмч хэдэн цагийн зайтай, утасны сүлжээ тогтворгүй — сансрын нисгэгчдийн адил малчид эрүүл мэндээ эхлээд өөрсдөө үнэлэх хэрэгтэй." },
    mirrors: { en: "Distance from Earth", mn: "Дэлхийгээс хол" },
    sources: [SOURCES.csaScience],
  },
];

/** Fictional persona's access to care — demo values for the story, not real geography. */
export const STEPPE_CARE = {
  hospitalKm: 38,
  travel: { en: "about 1 h 30 min by motorbike", mn: "мотоциклоор ойролцоогоор 1 цаг 30 мин" } as Bilingual,
};

/** Body-region text for the herder context (replaces the spaceflight text in Steppe mode). */
export const REGION_STEPPE: Record<RegionId, { function: Bilingual; effect: Bilingual }> = {
  brain: {
    function: { en: "Attention, sleep, mood, and how the household gets along.", mn: "Анхаарал, нойр, сэтгэл санаа, гэр бүлийн харилцаа." },
    effect: { en: "Long winter nights, isolation and heavy herd work wear down sleep and mood.", mn: "Өвлийн урт шөнө, тусгаарлалт, малын хүнд ажил нойр, сэтгэл санааг элэгдүүлнэ." },
  },
  eyes: {
    function: { en: "Vision.", mn: "Хараа." },
    effect: { en: "Bright snow and wind strain the eyes; this prototype has no eye check yet.", mn: "Цасны гялбаа, салхи нүдийг ядраана; энэ загварт нүдний шалгалт хараахан алга." },
  },
  heart: {
    function: { en: "Pumps blood and keeps blood pressure steady.", mn: "Цус шахаж, даралтыг тогтвортой барина." },
    effect: { en: "Cold tightens blood vessels, and salty food and heavy work raise blood pressure.", mn: "Хүйтэнд судас агшиж, давслаг хоол, хүнд ажил даралтыг нэмэгдүүлнэ." },
  },
  lungs: {
    function: { en: "Brings oxygen into the blood.", mn: "Цусанд хүчилтөрөгч нийлүүлнэ." },
    effect: { en: "Altitude, stove smoke inside the ger, and winter infections can lower oxygen.", mn: "Өндөрлөг газар, гэрийн зуухны утаа, өвлийн халдвар хүчилтөрөгчийг бууруулна." },
  },
  bones: {
    function: { en: "Support your weight.", mn: "Биеийн жинг даана." },
    effect: { en: "Falls on ice and heavy lifting are common injuries.", mn: "Мөсөн дээр унах, хүнд юм өргөх нь түгээмэл гэмтэл." },
  },
  muscles: {
    function: { en: "Movement and strength.", mn: "Хөдөлгөөн ба хүч." },
    effect: { en: "Herding is hard physical work; strains and cold injuries need rest.", mn: "Мал маллах хүнд хөдөлмөр; булчин чангарах, хөлдөлтөд амралт хэрэгтэй." },
  },
  immune: {
    function: { en: "Defends against infection; skin protects from the cold.", mn: "Халдвараас хамгаална; арьс хүйтнээс хамгаална." },
    effect: { en: "Frostbite, winter flu and animal-borne infections are risky far from a clinic.", mn: "Хөлдөлт, өвлийн томуу, малаас дамжих халдвар эмнэлгээс хол үед эрсдэлтэй." },
  },
  gut: {
    function: { en: "Turns food into energy and keeps blood sugar steady.", mn: "Хоолыг эрчим хүч болгож, цусны сахарыг тогтвортой барина." },
    effect: { en: "A winter diet heavy in meat and salt, with few vegetables, affects blood pressure and sugar.", mn: "Мах, давс ихтэй, ногоо багатай өвлийн хоол даралт, сахарт нөлөөлнө." },
  },
  radiation: {
    function: { en: "Not tracked on Earth in this mode.", mn: "Энэ горимд цацраг хэмжихгүй." },
    effect: { en: "The same app in space tracks radiation dose.", mn: "Сансрын горимд цацрагийн тунг хянана." },
  },
};
