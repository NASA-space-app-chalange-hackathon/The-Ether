import type { MissionEventKind } from "@/lib/data/dataset";

/** Mongolian labels for the Space mission's story events. */
export const EVENTS_SPACE_MN: Record<MissionEventKind, string> = {
  launch: "Ангараг руу нислэг эхэлсэн — гишүүн бүрийн хэвийн түвшинг суралцаж байна",
  solar: "Нарны бөөмийн шуурга",
  drift: "ORION-B: далд ядаргаа илэрсэн",
  cardio: "ORION-C: зүрх судасны хандлага ахисан",
  bone: "ORION-D: алгассан дасгал хуримтлагдаж байна",
  cold: "Хүйтний давалгаа",
};

/** Mongolian labels for the Steppe story events (datasets keep English as the source). */
export const EVENTS_MN: Record<MissionEventKind, string> = {
  launch: "Өвөлжөө — таны хэвийн түвшинг суралцаж байна",
  cold: "Хүйтний давалгаа — мал хамгаалах нэмэлт ажил",
  cardio: "Даралт нэмэгдэж байна — өрхийн эмчтэй холбогд",
  solar: "Нарны бөөмийн шуурга",
  drift: "Далд ядаргаа илэрсэн",
  bone: "Дасгал алгассан нь хуримтлагдаж байна",
};

export const MEMBERS_MN: Record<string, { name: string; role: string }> = {
  "herder-1": { name: "Малчин өрх", role: "Малчин, хөдөөгийн сум" },
};

export const ROLES_MN: Record<string, string> = {
  Commander: "Командлагч",
  "Flight Engineer": "Нислэгийн инженер",
  "Mission Specialist": "Номлолын мэргэжилтэн",
  "Crew Medical Officer": "Багийн эмч",
};
