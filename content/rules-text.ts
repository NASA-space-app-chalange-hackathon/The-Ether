import { RULES, type RuleId } from "@/lib/engine/escalation";
import type { Locale } from "@/lib/i18n";
import type { Mode } from "@/lib/state/store";
import { RULES_MN, type RuleTextMn } from "./rules-mn";

/**
 * Alert text for every (mode, language) pair. Language and mode are independent:
 * Space mode talks about the crew doctor and Earth, Steppe mode about the family
 * doctor and the soum hospital — in English or Mongolian.
 *   space · en  → the engine's own English (lib/engine/escalation.ts)
 *   space · mn  → RULES_SPACE_MN (below)
 *   steppe · en → RULES_STEPPE_EN (below)
 *   steppe · mn → RULES_MN (content/rules-mn.ts)
 * Every set has the same number of steps as the engine rule (unit-tested), so steps map by index.
 */
export type RuleText = RuleTextMn;

export const RULES_SPACE_MN: Record<RuleId, RuleText> = {
  cardiovascular: {
    title: "Зүрх, даралтын өөрчлөлт",
    why: "Жингүйдэлд биеийн шингэн толгой руу шилжиж, зүрх судас дасан зохицдог. Тайван үеийн зүрхний цохилт, даралт аажмаар өсөх нь систем ачаалалтай байгаагийн эрт дохио байж болох тул NASA үүнийг эрсдэл гэж хянадаг.",
    steps: [
      "5 минут тайван суугаад зүрхний цохилт, даралтаа дахин хэмж.",
      "Сүүлийн 24 цагт кофе, дасгал, стресс, муу нойр байсан эсэхээ тэмдэглэ.",
      "Багийн эмч: эмнэлгийн иж бүрдлийн даралтын аппаратаар дахин хэмжиж, 14 хоногийн хандлагыг хян.",
      "Хандлагын тоймыг нислэгийн эмч рүү илгээж, нууц эмнэлгийн зөвлөгөө ав.",
    ],
  },
  hypoxia: {
    title: "Цусны хүчилтөрөгч бага",
    why: "Цусны хүчилтөрөгч бага байх нь бүхээгийн агаарын өөрчлөлт, өвчин, ачааллаас үүдэж болно. NASA гипоксийг сансрын нислэгийн эрсдэлд тооцдог; толгой өвдөх, шийдвэр гаргалт муудахыг өөртөө анзаарахад хэцүү.",
    steps: [
      "Хүнд ажлаа зогсоож, суугаад гараа дулаацуулан SpO₂-оо дахин хэмж.",
      "Биеийн байдлаа багийн гишүүнд хэл (толгой өвдөх, амьсгаадах, будилах).",
      "Багийн эмч: бүхээгийн агаарын үзүүлэлт болон гишүүний шинж тэмдгийг шалга.",
      "Нислэгийн эмч болон амьдрал дэмжих системийн багт нэн даруй мэдэгд.",
    ],
  },
  glucose: {
    title: "Цусны сахар хэвийн бус",
    why: "Сансрын хоол, хөдөлгөөний өөрчлөлт, стресс цусны сахарыг өөрчилж болно. Хоол тэжээлийн дутагдал эрчим хүч, сэтгэл санаа, урт хугацааны эрүүл мэндэд нөлөөлдөг тул NASA үүнийг эрсдэл гэж хянадаг.",
    steps: [
      "Бага бол: хурдан шингэх нүүрс устай хөнгөн хоол идээд 15 минутын дараа дахин хэмж.",
      "Өндөр бол: ус ууж, сүүлийн хоолоо тэмдэглээд дараагийн хоолны өмнө дахин хэмж.",
      "Багийн эмч: гишүүнтэй хамт хоолны бүртгэл, сахарын хандлагыг хян.",
      "Нислэгийн эмч, хоол тэжээлийн багаар цэсийн төлөвлөгөөг хянуул.",
    ],
  },
  fever: {
    title: "Биеийн температур өндөр",
    why: "Сансарт дархлааны хариу өөрчлөгдөж, битүү орчинд бичил биетэн өөрөөр үйлчилдэг. Халуурах нь халдварын шинж байж болох бөгөөд битүү хөлөгт бүх багт нөлөөлж болно.",
    steps: [
      "30 минутын дараа температураа дахин хэмж; амарч, шингэн уу.",
      "Багаа хамгаалахын тулд маск зүүж, гараа угаа.",
      "Багийн эмч: шинж тэмдгийг үнэлж, багийн өрөөнд тусгаарлах эсэхийг шийд.",
      "Нислэгийн эмч: халдвар байж болзошгүйг хянаж, иж бүрдлийн эмийг зөвлө.",
    ],
  },
  sleep: {
    title: "Нойр хэвийнээс бага",
    why: "Сансарт хуваарь өөрчлөгдөх, дуу чимээ, гэрэл нойрыг хүндрүүлдэг. Ядаргаа хариу үйлдлийг аажмаар удаашруулж, алдааны эрсдэлийг нэмдэг тул NASA нойрны дутагдлыг эрсдэлд тооцдог.",
    steps: [
      "Өнөө шөнө төлөвлөсөн унтах цагаа бүрэн хамгаал; унтахын өмнө дэлгэцийн гэрлийг бүдгэрүүл.",
      "Ажлын өдрийн хоёрдугаар хагаст кофеин бүү хэрэглэ.",
      "Багийн эмч: гишүүнтэй ажлын хуваарь, гэрэлтүүлгийн төлөвлөгөөг хян.",
    ],
  },
  vigilance: {
    title: "Хариу үйлдэл хэвийнээс удаан",
    why: "Богино хариу үйлдлийн тест бол ядаргааг илрүүлэх хамгийн мэдрэг аргуудын нэг. Хариу удаашрах, тасалдал ихсэх нь чухал ажлын үеийн алдааны эрсдэлийг нэмнэ.",
    steps: [
      "Чухал ажлын өмнө 20 минут амар.",
      "Амарсны дараа хариу үйлдлийн тестээ дахин хий.",
      "Багийн эмч: өнөөдрийн аюулгүй байдлын чухал ажлыг өөр хүнд шилжүүлэх эсэхийг шийд.",
    ],
  },
  mood: {
    title: "Сэтгэл санаа хэвийнээс доогуур",
    why: "Тусгаарлалт ба хязгаарлагдмал орчин бол NASA-гийн таван аюулын нэг. Удаан үргэлжлэх муу сэтгэл санаа аюулгүй байдал, багт нөлөөлөх сэтгэцийн эрүүл мэндийн асуудал болж болно.",
    steps: [
      "Дуртай зүйлдээ цаг гаргаж, гэр рүүгээ залгах эсвэл мессеж бич.",
      "Өнөөдөр багийн гишүүнтэйгээ хамт хооллох эсвэл ямар нэг зүйл хий.",
      "Багийн эмч: ганцаарчилсан яриа хий.",
      "Газрын сэтгэл зүйн багтай ганцаарчилсан уулзалт товло.",
    ],
  },
  teamwork: {
    title: "Багийн уур амьсгал муудаж байна",
    why: "Олон сар хамт амьдардаг жижиг багт зөрчил, харилцааны доголдол гардаг. Багийн эв нэгдэл нислэгийн аюулгүй байдалд шууд нөлөөлдөг тул NASA үүнийг эрсдэлд тооцдог.",
    steps: ["Өнөөдрийн багийн хамтын даалгавар эсвэл хоолонд нэгд.", "Командлагч / багийн эмч: ачаалал, зөрчлийн талаар богино ярилцлага хий."],
  },
  nutrition: {
    title: "Биеийн жин буурч байна",
    why: "Сансрын нисгэгчид сансарт шаардлагатайгаасаа бага иддэг нь элбэг. Тогтвортой жин алдах нь булчин, яс, эрчим хүч алдаж байгааг илтгэдэг тул NASA хоол тэжээлийн дутагдлыг хянадаг.",
    steps: ["Өнөөдөр нэмэлт хөнгөн хоол идэж, бүх хоолоо тэмдэглэ.", "Багийн эмч: хэрэглээг цэсийн төлөвлөгөөтэй харьцуулж хян."],
  },
  fitness: {
    title: "Дасгал алгасаж байна",
    why: "Таталцалгүй үед булчин, зүрх чийрэгжилтээ алддаг. Өдөр бүрийн дасгал бол NASA-гийн хэрэглэдэг гол хамгаалалт.",
    steps: ["Өнөөдрийн хүчний болон кардио дасгалаа хий.", "Багийн эмч: дасгалд саад болж буй гэмтэл, хуваарийн зөрчлийг шалга."],
  },
  "behavioral-drift": {
    title: "Далд ядаргаа байж магадгүй",
    why: "Нойр, хариу үйлдэл тань хэвийнээс муудсан ч сэтгэл санааны тэмдэглэл 'зүгээр' гэж байна. Тусгаарлагдмал үед хүмүүс ядаргаагаа бага хэлэх нь элбэг; бодит үзүүлэлт эрт илрүүлдэг. NASA нойрны дутагдал ба зан төлөвийн өөрчлөлтийг хоёуланг нь эрсдэлд тооцдог.",
    steps: [
      "Өнөө оройн шалгалтандаа үнэнээр хариул: үнэхээр хэр ядарсан бэ?",
      "Бүтэн унтах цагаа хамгаалж, чухал ажлын өмнө амар.",
      "Багийн эмч: ганцаарчилсан яриа хийж, хуваарийг хянан 48 цаг ачааллыг багасгах эсэхийг шийд.",
      "Газрын сэтгэл зүйн баг: гишүүнтэй ганцаарчилсан уулзалт.",
    ],
  },
  "radiation-event": {
    title: "Нарны бөөмийн шуурга — одоо хоргод",
    why: "Сансрын цацраг бол NASA-гийн таван аюулын нэг. Нарны бөөмийн шуурга хэдхэн цагт олон хоногийн тун өгч болно; зузаан хамгаалалт шингээх тунг ихээхэн бууруулна.",
    steps: [
      "Хамгийн сайн хамгаалалттай хоргодох хэсэгт одоо ор, зөвшөөрөл гартал бүү гар.",
      "Хувийн дозиметрээ биедээ байлга.",
      "Багийн эмч: гишүүн бүрийн дозиметрийн заалтыг шалгаж, тунг бүртгэ.",
    ],
  },
  "radiation-cumulative": {
    title: "Карьерын цацрагийн тун өсөж байна",
    why: "Цацрагийн тун карьерын туршид хуримтлагдаж хорт хавдрын эрсдэлийг нэмнэ. NASA карьерын тунг 600 мЗв-ээс доош байлгана.",
    steps: [
      "Хамгийн сайн хамгаалалттай багийн өрөөнд унт.",
      "Багийн эмч: тунг хязгаарлахаар хөлгөөс гадуур ажиллах болон ажлын байрлалын төлөвлөгөөг хян.",
      "Нислэгийн эмч: үлдсэн нислэгийн тунгийн тооцоог хян.",
    ],
  },
  "bone-loss": {
    title: "Яс сийрэгжих эрсдэл нэмэгдэж байна",
    why: "Таталцал ясанд ачаалал өгөхгүй тул сансарт жин даах яс эрдэсээ алддаг. Хүчний дасгал гол хамгаалалт; алгассан дасгал хуримтлагдана.",
    steps: ["Өнөөдрийн хүчний дасгалаа хий (суулт, татлага, өсгий дээр өргөгдөх).", "Багийн эмч: дасгалын бүртгэлийг хянаж, хуваарийн зөрчлийг засварла."],
  },
  cold: RULES_MN.cold,
};

export const RULES_STEPPE_EN: Record<RuleId, RuleText> = {
  cardiovascular: {
    title: "Heart & blood pressure trend",
    why: "Cold, heavy work, salty food and alcohol can raise blood pressure. A slow, steady rise above your own normal is an early warning.",
    steps: [
      "Sit quietly for 5 minutes, then measure heart rate and blood pressure again.",
      "Note tea, salt, alcohol, tiredness or long hours in the cold in the last 24 hours.",
      "Phone the family doctor and share your 14-day trend.",
      "Go to the soum hospital; for chest pain or a severe headache, call 103.",
    ],
  },
  hypoxia: {
    title: "Blood oxygen low",
    why: "High altitude, stove smoke and lung illness can lower oxygen. Low oxygen causes headaches and poor judgement.",
    steps: [
      "Stop heavy work, warm your hands and measure SpO₂ again.",
      "Tell your family how you feel (headache, breathlessness).",
      "Call the family doctor; check the ger's ventilation and stove smoke.",
      "If breathing is hard, call 103 or go to the soum hospital urgently.",
    ],
  },
  glucose: {
    title: "Blood sugar out of range",
    why: "Seasonal food, workload and stress change blood sugar. Low sugar causes dizziness and poor focus.",
    steps: [
      "If low: have a sweet drink or fast-acting food and re-check in 15 minutes.",
      "If high: drink water, note what you ate and re-check before the next meal.",
      "Talk with the family doctor about your meals and sugar trend.",
      "If it keeps happening, get a blood test at the soum hospital.",
    ],
  },
  fever: {
    title: "Body temperature raised",
    why: "A fever can be a sign of infection. The hospital is far away, so noticing it early matters.",
    steps: [
      "Re-check your temperature in 30 minutes; rest and drink plenty of fluids.",
      "Wear a mask and wash your hands to protect your family.",
      "If it lasts more than 2 days, tell the family doctor.",
      "Very high fever or breathlessness → soum hospital / 103.",
    ],
  },
  sleep: {
    title: "Sleep below your normal",
    why: "Cold nights and night herding break up sleep. Sleep debt builds quietly and raises the risk of accidents and mistakes.",
    steps: [
      "Make time for a full night's sleep tonight; put your phone away before bed.",
      "Have less tea and coffee in the afternoon.",
      "If sleep stays poor, talk with the family doctor.",
    ],
  },
  vigilance: {
    title: "Reaction time slower than your normal",
    why: "A short test catches tiredness you may not feel. Slow reactions raise the risk of accidents and mistakes.",
    steps: ["Rest 20 minutes before riding a motorbike or doing heavy work.", "Repeat the test after resting.", "If the tiredness continues, talk with the family doctor."],
  },
  mood: {
    title: "Mood lower than your normal",
    why: "Loneliness and isolation affect mood. If it lasts, it can affect health and safety.",
    steps: [
      "Do something you enjoy and phone someone close to you.",
      "Share a meal with your family today.",
      "Talk privately with the family doctor.",
      "If it lasts, go to the soum hospital (urgent: call 103).",
    ],
  },
  teamwork: {
    title: "Household mood getting worse",
    why: "Living closely and in isolation for a long time can lead to conflict that affects safety and health.",
    steps: ["Work or eat together as a family today.", "Talk as a family about workload and worries."],
  },
  nutrition: {
    title: "Body weight dropping",
    why: "Steady weight loss means losing muscle and energy.",
    steps: ["Add a light extra meal today and note everything you eat.", "If your weight keeps dropping, tell the family doctor."],
  },
  fitness: {
    title: "Missing exercise",
    why: "Less movement weakens muscles and bones.",
    steps: ["Do today's exercise.", "If an injury or workload gets in the way, tell the family doctor."],
  },
  "behavioral-drift": {
    title: "Possible hidden fatigue",
    why: "Your sleep and reaction time got worse, but your mood was recorded as 'fine'. People often under-report tiredness; objective signs catch it early.",
    steps: [
      "Answer today's check honestly: how tired are you?",
      "Sleep fully and rest before heavy work.",
      "Talk privately with the family doctor; lighten your workload for 48 hours.",
      "Contact the soum hospital's psychologist.",
    ],
  },
  "radiation-event": {
    title: "Solar particle event — shelter",
    why: "Space radiation is one of NASA's five hazards. A solar storm can deliver days of dose in hours.",
    steps: ["Go to the shielded area now and stay until the all-clear.", "Keep your personal dosimeter on you.", "Crew doctor: check each person's dosimeter reading and log the dose."],
  },
  "radiation-cumulative": {
    title: "Career radiation dose rising",
    why: "Radiation dose adds up over a career and raises cancer risk. NASA keeps career dose below 600 mSv.",
    steps: ["Sleep in the best-shielded area.", "Plan work locations to reduce dose.", "Have a doctor estimate the dose for the rest of the mission."],
  },
  "bone-loss": {
    title: "Bone-loss risk building",
    why: "With little movement, bones lose minerals; strength exercise is the main protection.",
    steps: ["Do a strength exercise today.", "Talk with the family doctor about an exercise plan."],
  },
  cold: {
    title: RULES.cold.title,
    why: RULES.cold.whyItMatters,
    steps: RULES.cold.steps.map((s) => s.text),
  },
};

const engineText = (id: RuleId): RuleText => ({ title: RULES[id].title, why: RULES[id].whyItMatters, steps: RULES[id].steps.map((s) => s.text) });

export function ruleText(id: RuleId, mode: Mode, locale: Locale): RuleText {
  if (mode === "space") return locale === "en" ? engineText(id) : RULES_SPACE_MN[id];
  return locale === "en" ? RULES_STEPPE_EN[id] : RULES_MN[id];
}

/** One short, plain headline per rule: what is going on, in everyday words. */
export const HEADLINES: Record<RuleId, { en: string; mn: string; steppe?: { en: string; mn: string } }> = {
  cardiovascular: { en: "Heart rate and blood pressure are above your normal", mn: "Зүрхний цохилт, даралт хэвийнээс өндөр байна" },
  hypoxia: { en: "Blood oxygen is lower than it should be", mn: "Цусны хүчилтөрөгч байх ёстойгоосоо бага байна" },
  glucose: { en: "Blood sugar is out of the safe range", mn: "Цусны сахар аюулгүй хэмжээнээс гарсан" },
  fever: { en: "Your temperature is raised", mn: "Биеийн температур өндөр байна" },
  sleep: { en: "You are sleeping less than usual", mn: "Ердийнхөөсөө бага унтаж байна" },
  vigilance: { en: "Your reactions are slower than usual", mn: "Хариу үйлдэл ердийнхөөсөө удаан байна" },
  mood: { en: "Your mood has been lower than usual", mn: "Сэтгэл санаа ердийнхөөсөө доогуур байна" },
  teamwork: {
    en: "The crew is getting along less well",
    mn: "Багийн уур амьсгал муудаж байна",
    steppe: { en: "The household is getting along less well", mn: "Гэр бүлийн уур амьсгал муудаж байна" },
  },
  nutrition: { en: "You are losing weight", mn: "Жин буурч байна" },
  fitness: { en: "You are missing exercise sessions", mn: "Дасгал алгасаж байна" },
  "behavioral-drift": { en: "You may be more tired than you feel", mn: "Мэдрэгдэхээсээ илүү ядарсан байж магадгүй" },
  "radiation-event": { en: "Solar storm: go to the shelter now", mn: "Нарны шуурга: одоо хоргодох хэсэгт ор" },
  "radiation-cumulative": { en: "Your total radiation dose is getting high", mn: "Нийт цацрагийн тун өндөр болж байна" },
  "bone-loss": { en: "Bone-loss risk is building up", mn: "Яс сийрэгжих эрсдэл нэмэгдэж байна" },
  cold: { en: "You are spending long hours in deep cold", mn: "Тэс хүйтэнд удаан байж байна" },
};

export function headline(id: RuleId, mode: Mode, locale: Locale): string {
  const h = HEADLINES[id];
  return (mode === "steppe" && h.steppe ? h.steppe : h)[locale];
}
