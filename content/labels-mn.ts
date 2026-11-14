import type { MissionEventKind } from "@/lib/data/dataset";

/** Mongolian labels for dataset-provided names (datasets keep English as the source). */
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
