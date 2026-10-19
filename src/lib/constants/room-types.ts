export interface RoomTypeOption {
  id: string;
  label: string;
  color?: string;
  isCustom?: boolean;
}

export const DEFAULT_UNIVERSITY_ROOM_TYPES: RoomTypeOption[] = [
  { id: "lecture_hall", label: "Ma‘ruza zali", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "study_room", label: "O‘quv xonasi", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "teachers_room", label: "O‘qituvchilar xonasi", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "deans_office", label: "Dekanxona", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { id: "conference_room", label: "Konferensiya xonasi", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "lab", label: "O‘quv laboratoriyasi", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "computer_lab", label: "Kompyuter sinfi", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { id: "library", label: "O‘quv zali", color: "bg-amber-50 text-amber-700 border-amber-200" },
];

/**
 * Tashkilot uchun sozlangan xona turlarini olish
 */
export function getOrganizationRoomTypes(settings?: Record<string, unknown> | null): RoomTypeOption[] {
  if (settings && Array.isArray((settings as { roomTypes?: RoomTypeOption[] }).roomTypes) && ((settings as { roomTypes: RoomTypeOption[] }).roomTypes.length > 0)) {
    return (settings as { roomTypes: RoomTypeOption[] }).roomTypes;
  }
  return DEFAULT_UNIVERSITY_ROOM_TYPES;
}
