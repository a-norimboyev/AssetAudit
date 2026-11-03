export interface RoomTypeOption {
  id: string;
  label: string;
  color?: string;
  isCustom?: boolean;
}

export const DEFAULT_UNIVERSITY_ROOM_TYPES: RoomTypeOption[] = [
  { id: "lecture_hall", label: "Ma‘ruza zali", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "study_room", label: "O‘quv auditoriyasi", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "lab", label: "O‘quv laboratoriyasi", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "computer_lab", label: "Kompyuter sinfi", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { id: "department_head", label: "Kafedra mudiri xonasi", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "teachers_room", label: "O‘qituvchilar xonasi", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "deans_office", label: "Dekanat", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { id: "dorm_room", label: "Talabalar yotoqxonasi xonasi", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "dorm_study", label: "Yotoqxona dars tayyorlash xonasi", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { id: "dorm_manager", label: "Yotoqxona mudiri xonasi", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "gym_main", label: "Katta sport zali", color: "bg-lime-50 text-lime-700 border-lime-200" },
  { id: "fitness_room", label: "Trenajyor zali", color: "bg-green-50 text-green-700 border-green-200" },
  { id: "sports_equipment", label: "Sport anjomlari xonasi", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "canteen_hall", label: "Talabalar oshxonasi", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { id: "canteen_kitchen", label: "Taom tayyorlash xonasi", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "library", label: "Kutubxona o‘quv zali", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "library_archive", label: "Kitob saqlash xonasi", color: "bg-stone-50 text-stone-700 border-stone-200" },
  { id: "rector_office", label: "Rektorat", color: "bg-blue-50 text-blue-800 border-blue-300" },
  { id: "accounting", label: "Buxgalteriya", color: "bg-slate-50 text-slate-700 border-slate-200" },
  { id: "conference_room", label: "Majlislar zali", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "server_room", label: "Server xonasi", color: "bg-zinc-50 text-zinc-700 border-zinc-200" },
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
