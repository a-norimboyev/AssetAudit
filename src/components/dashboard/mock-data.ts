// ============================================================================
// ASSETAUDIT — UNIVERSITET ADMINISTRATORI MOCK MA'LUMOTLAR MODELI
// Muhammad al-Xorazmiy nomidagi Toshkent Axborot Texnologiyalari Universiteti (TATU)
// ============================================================================

// 1. Binolar
export interface MockBuilding {
  id: string;
  name: string;
  code: string;
  floorsCount: number;
  roomsCount: number;
  itemsCount: number;
  auditedPercentage: number;
  address: string;
}

// 2. Xonalar
export interface MockRoom {
  id: string;
  buildingId: string;
  buildingName: string;
  floorNumber: number;
  roomNumber: string;
  name: string;
  type: "lecture_hall" | "lab" | "computer_lab" | "classroom" | "department_head" | "teachers_room" | "dean" | "admin";
  capacity: number;
  itemsCount: number;
  responsiblePerson: string;
  isAudited: boolean;
  departmentName?: string;
}

// 3. Fakultet va Kafedralar
export interface MockDepartment {
  id: string;
  facultyName: string;
  name: string;
  type: "faculty" | "department" | "division" | "dean";
  headFullName: string;
  academicTitle: string;
  buildingName: string;
  roomNumber: string;
  phone: string;
  email: string;
  roomsCount: number;
  itemsCount: number;
  auditProgress: number;
}

// 4. Xatlov Komissiyalari va Reja
export interface MockAuditPlanSchedule {
  id: string;
  departmentOrBuilding: string;
  targetFaculty: string;
  targetBuilding: string;
  startDate: string;
  endDate: string;
  assignedAuditor: string;
  status: "completed" | "in_progress" | "pending";
  progress: number;
  totalItems: number;
  scannedItems: number;
}

export interface MockAuditCommission {
  id: string;
  orderNumber: string;
  orderDate: string;
  title: string;
  status: "active" | "draft" | "completed";
  chairperson: {
    fullName: string;
    position: string;
    academicTitle: string;
  };
  deputyChairperson: {
    fullName: string;
    position: string;
  };
  secretary: {
    fullName: string;
    position: string;
  };
  members: Array<{
    id: string;
    fullName: string;
    position: string;
    role: string;
  }>;
  schedule: MockAuditPlanSchedule[];
}

// 5. Solishtirma Hisobotlar (INV-19 / Farqlar)
export interface MockReconciliationItem {
  id: string;
  inventoryNumber: string;
  name: string;
  category: string;
  buildingName: string;
  expectedRoom: string;
  actualRoom: string;
  bookQuantity: number;
  actualQuantity: number;
  difference: number;
  unitPrice: number;
  differenceSum: number;
  discrepancyType: "matched" | "shortage" | "surplus" | "misplaced" | "damaged";
  molName: string;
  auditorName: string;
  scannedAt: string;
  resolutionNote?: string;
}

// 6. Moddiy Javobgar Shaxslar (MOL)
export interface MockMOLPerson {
  id: string;
  fullName: string;
  position: string;
  department: string;
  phone: string;
  assignedRoomsCount: number;
  totalItemsCount: number;
  totalValueSum: number;
  auditedItemsCount: number;
  auditPercentage: number;
  conflictsCount: number;
}

// 7. Mas'ul Xodimlar (Foydalanuvchilar)
export interface MockStaff {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: "head" | "registrar" | "inspector";
  isActive: boolean;
  mustChangePassword: boolean;
  assignedBuilding?: string;
  createdAt: string;
  lastLogin: string;
}

// 8. Jihozlar (Aktivlar)
export interface MockItem {
  id: string;
  name: string;
  inventoryNumber: string;
  customLabel: string;
  category: string;
  buildingName: string;
  roomNumber: string;
  status: "active" | "repair" | "written_off";
  condition: "new" | "good" | "fair" | "broken";
  price: number;
  registeredDate: string;
  qrToken: string;
  responsiblePerson: string;
}

// 9. Sozlamalar
export interface MockOrgSettings {
  name: string;
  shortName: string;
  code: string;
  inn: string;
  rectorName: string;
  rectorTitle: string;
  chiefAccountantName: string;
  commissionChairName: string;
  commissionChairTitle: string;
  address: string;
  phone: string;
  email: string;
  labelFormat: "40x25" | "50x30" | "a4";
  labelShowLogo: boolean;
  labelShowUniName: boolean;
  labelPrefix: string;
}

// 10. Jonli harakatlar
export interface MockActivityEvent {
  id: string;
  type: "scan" | "conflict" | "register" | "commission" | "complete";
  title: string;
  subtitle: string;
  timestamp: string;
  badgeText: string;
  badgeVariant: "success" | "warning" | "blue" | "neutral";
}

// ============================================================================
// BOShLANG'ICH MA'LUMOTLAR
// ============================================================================

// 1. Binolar (Jami 7 ta)
export const INITIAL_BUILDINGS: MockBuilding[] = [
  {
    id: "bld-1",
    name: "Bosh o'quv binosi (A korpus)",
    code: "A-BOSH",
    floorsCount: 5,
    roomsCount: 96,
    itemsCount: 22400,
    auditedPercentage: 86.5,
    address: "Amir Temur ko'chasi, 108",
  },
  {
    id: "bld-2",
    name: "Axborot texnologiyalari binosi (B korpus)",
    code: "B-IT",
    floorsCount: 4,
    roomsCount: 78,
    itemsCount: 18500,
    auditedPercentage: 92.0,
    address: "Amir Temur ko'chasi, 108A",
  },
  {
    id: "bld-3",
    name: "Telekommunikatsiya binosi (C korpus)",
    code: "C-TELECOM",
    floorsCount: 4,
    roomsCount: 68,
    itemsCount: 14200,
    auditedPercentage: 74.0,
    address: "Amir Temur ko'chasi, 108B",
  },
  {
    id: "bld-4",
    name: "Kompyuter injiniringi binosi (D korpus)",
    code: "D-ENG",
    floorsCount: 4,
    roomsCount: 62,
    itemsCount: 12600,
    auditedPercentage: 81.2,
    address: "Bog'ishamol ko'chasi, 12",
  },
  {
    id: "bld-5",
    name: "Axborot-resurs markazi (Kutubxona)",
    code: "ARM-KUTUB",
    floorsCount: 3,
    roomsCount: 38,
    itemsCount: 8400,
    auditedPercentage: 90.0,
    address: "Amir Temur ko'chasi, 108E",
  },
  {
    id: "bld-6",
    name: "1-sonli Talabalar turar joyi",
    code: "TTJ-1",
    floorsCount: 5,
    roomsCount: 52,
    itemsCount: 5100,
    auditedPercentage: 42.0,
    address: "Bog'ishamol ko'chasi, 14",
  },
  {
    id: "bld-7",
    name: "Universitet sport majmuasi",
    code: "SPORT-MAJM",
    floorsCount: 2,
    roomsCount: 26,
    itemsCount: 3800,
    auditedPercentage: 65.5,
    address: "Amir Temur ko'chasi, 108-Sport",
  },
];

// 2. Xonalar (Daraxtmonand tree view va batafsil tahlil uchun)
export const INITIAL_ROOMS: MockRoom[] = [
  // Bosh bino (A korpus)
  {
    id: "rm-101",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A korpus)",
    floorNumber: 1,
    roomNumber: "101",
    name: "Katta Ma'ruza Zali",
    type: "lecture_hall",
    capacity: 150,
    itemsCount: 145,
    responsiblePerson: "Prof. O. Xolov",
    isAudited: true,
    departmentName: "Umumiy o'quv zallari",
  },
  {
    id: "rm-102",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A korpus)",
    floorNumber: 1,
    roomNumber: "102",
    name: "Axborot Texnologiyalari O'quv Zali",
    type: "classroom",
    capacity: 45,
    itemsCount: 52,
    responsiblePerson: "Dots. N. Saidov",
    isAudited: true,
    departmentName: "Dasturiy injiniring",
  },
  {
    id: "rm-201",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A korpus)",
    floorNumber: 2,
    roomNumber: "201",
    name: "Dasturiy Ta'minot Laboratoriyasi",
    type: "lab",
    capacity: 35,
    itemsCount: 68,
    responsiblePerson: "A. Karimova",
    isAudited: true,
    departmentName: "Dasturiy injiniring",
  },
  {
    id: "rm-205",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A korpus)",
    floorNumber: 2,
    roomNumber: "205",
    name: "Kiberxavfsizlik O'quv Xonasi",
    type: "computer_lab",
    capacity: 30,
    itemsCount: 48,
    responsiblePerson: "Dots. U. Yusupov",
    isAudited: false,
    departmentName: "Kiberxavfsizlik kafedrasi",
  },
  {
    id: "rm-301",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A korpus)",
    floorNumber: 3,
    roomNumber: "301",
    name: "Dasturiy Injiniring Fakulteti Dekanati",
    type: "dean",
    capacity: 12,
    itemsCount: 34,
    responsiblePerson: "Dots. M. To'rayev",
    isAudited: true,
    departmentName: "Dasturiy injiniring fakulteti dekanati",
  },
  {
    id: "rm-304",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A korpus)",
    floorNumber: 3,
    roomNumber: "304",
    name: "Sun'iy Intellekt va Neyron To'rlar Laboratoriyasi",
    type: "lab",
    capacity: 40,
    itemsCount: 82,
    responsiblePerson: "Prof. S. Boboyev",
    isAudited: true,
    departmentName: "Sun'iy intellekt kafedrasi",
  },
  {
    id: "rm-305",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A korpus)",
    floorNumber: 3,
    roomNumber: "305",
    name: "Dasturiy Injiniring Kafedrasi Mudir Xonasi",
    type: "department_head",
    capacity: 15,
    itemsCount: 28,
    responsiblePerson: "Dots. N. Saidov",
    isAudited: true,
    departmentName: "Dasturiy injiniring kafedrasi",
  },
  {
    id: "rm-401",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A korpus)",
    floorNumber: 4,
    roomNumber: "401",
    name: "Rektorat Majlislar Zali",
    type: "admin",
    capacity: 80,
    itemsCount: 110,
    responsiblePerson: "B. Ergashev",
    isAudited: true,
    departmentName: "Rektorat",
  },
  // B korpus (Axborot texnologiyalari)
  {
    id: "rm-b101",
    buildingId: "bld-2",
    buildingName: "Axborot texnologiyalari binosi (B korpus)",
    floorNumber: 1,
    roomNumber: "B-101",
    name: "Bulutli Texnologiyalar O'quv Markazi",
    type: "computer_lab",
    capacity: 35,
    itemsCount: 74,
    responsiblePerson: "Sh. Yusupov",
    isAudited: true,
    departmentName: "Kompyuter tizimlari kafedrasi",
  },
  {
    id: "rm-b204",
    buildingId: "bld-2",
    buildingName: "Axborot texnologiyalari binosi (B korpus)",
    floorNumber: 2,
    roomNumber: "B-204",
    name: "Kiberxavfsizlik va Kriptologiya Markazi",
    type: "lab",
    capacity: 30,
    itemsCount: 55,
    responsiblePerson: "Dots. U. Yusupov",
    isAudited: false,
    departmentName: "Kiberxavfsizlik kafedrasi",
  },
  {
    id: "rm-b302",
    buildingId: "bld-2",
    buildingName: "Axborot texnologiyalari binosi (B korpus)",
    floorNumber: 3,
    roomNumber: "B-302",
    name: "Kiberxavfsizlik Fakulteti Dekanati",
    type: "dean",
    capacity: 10,
    itemsCount: 26,
    responsiblePerson: "Prof. E. Ziyodullayev",
    isAudited: false,
    departmentName: "Kiberxavfsizlik fakulteti",
  },
  // C korpus (Telekommunikatsiya)
  {
    id: "rm-c201",
    buildingId: "bld-3",
    buildingName: "Telekommunikatsiya binosi (C korpus)",
    floorNumber: 2,
    roomNumber: "C-201",
    name: "Optik Tolali Aloqa Laboratoriyasi",
    type: "lab",
    capacity: 25,
    itemsCount: 62,
    responsiblePerson: "F. Umarova",
    isAudited: true,
    departmentName: "Mobil aloqa kafedrasi",
  },
  {
    id: "rm-c305",
    buildingId: "bld-3",
    buildingName: "Telekommunikatsiya binosi (C korpus)",
    floorNumber: 3,
    roomNumber: "C-305",
    name: "5G va Simsiz Tarmoqlar Laboratoriyasi",
    type: "lab",
    capacity: 30,
    itemsCount: 58,
    responsiblePerson: "F. Umarova",
    isAudited: false,
    departmentName: "Telekommunikatsiya kafedrasi",
  },
  // ARM (Kutubxona)
  {
    id: "rm-arm101",
    buildingId: "bld-5",
    buildingName: "Axborot-resurs markazi (Kutubxona)",
    floorNumber: 1,
    roomNumber: "ARM-101",
    name: "Elektron Kutubxona va Server Zali",
    type: "computer_lab",
    capacity: 60,
    itemsCount: 95,
    responsiblePerson: "G. Qosimova",
    isAudited: true,
    departmentName: "Axborot-resurs markazi",
  },
];

// 3. Fakultet va Kafedralar (TATU to'liq tuzilmasi)
export const INITIAL_DEPARTMENTS: MockDepartment[] = [
  {
    id: "dep-1",
    facultyName: "Dasturiy injiniring fakulteti",
    name: "Dasturiy injiniring kafedrasi",
    type: "department",
    headFullName: "Dots. Nodir Saidov",
    academicTitle: "Texnika fanlari nomzodi, dotsent",
    buildingName: "Bosh o'quv binosi (A korpus)",
    roomNumber: "305-xona",
    phone: "+998 71 238 64 21",
    email: "dasturiy@tatu.uz",
    roomsCount: 16,
    itemsCount: 4500,
    auditProgress: 95.0,
  },
  {
    id: "dep-2",
    facultyName: "Dasturiy injiniring fakulteti",
    name: "Sun'iy intellekt va neyron tarmoqlar kafedrasi",
    type: "department",
    headFullName: "Prof. Sirojiddin Boboyev",
    academicTitle: "Texnika fanlari doktori, professor",
    buildingName: "Bosh o'quv binosi (A korpus)",
    roomNumber: "304-xona",
    phone: "+998 71 238 64 35",
    email: "ai@tatu.uz",
    roomsCount: 12,
    itemsCount: 3000,
    auditProgress: 88.0,
  },
  {
    id: "dep-3",
    facultyName: "Kiberxavfsizlik fakulteti",
    name: "Kiberxavfsizlik va axborot himoyasi kafedrasi",
    type: "department",
    headFullName: "Dots. Ulug'bek Yusupov",
    academicTitle: "Texnika fanlari nomzodi, dotsent",
    buildingName: "Axborot texnologiyalari binosi (B korpus)",
    roomNumber: "B-204",
    phone: "+998 71 238 65 10",
    email: "cyber@tatu.uz",
    roomsCount: 14,
    itemsCount: 1900,
    auditProgress: 20.0,
  },
  {
    id: "dep-4",
    facultyName: "Kiberxavfsizlik fakulteti",
    name: "Kriptologiya va diskret matematika kafedrasi",
    type: "department",
    headFullName: "Prof. Elyor Ziyodullayev",
    academicTitle: "Fizika-matematika fanlari doktori",
    buildingName: "Axborot texnologiyalari binosi (B korpus)",
    roomNumber: "B-210",
    phone: "+998 71 238 65 14",
    email: "crypto@tatu.uz",
    roomsCount: 10,
    itemsCount: 1400,
    auditProgress: 25.0,
  },
  {
    id: "dep-5",
    facultyName: "Telekommunikatsiya texnologiyalari fakulteti",
    name: "Mobil aloqa va simsiz texnologiyalar kafedrasi",
    type: "department",
    headFullName: "Dots. Feruza Umarova",
    academicTitle: "Texnika fanlari nomzodi, dotsent",
    buildingName: "Telekommunikatsiya binosi (C korpus)",
    roomNumber: "C-201",
    phone: "+998 71 238 66 12",
    email: "telecom@tatu.uz",
    roomsCount: 18,
    itemsCount: 4200,
    auditProgress: 84.0,
  },
  {
    id: "dep-6",
    facultyName: "Kompyuter injiniringi fakulteti",
    name: "Kompyuter tizimlari va tarmoqlari kafedrasi",
    type: "department",
    headFullName: "Dots. Jamshid Normatov",
    academicTitle: "Texnika fanlari nomzodi",
    buildingName: "Kompyuter injiniringi binosi (D korpus)",
    roomNumber: "D-104",
    phone: "+998 71 238 67 05",
    email: "hardware@tatu.uz",
    roomsCount: 15,
    itemsCount: 3600,
    auditProgress: 72.0,
  },
  {
    id: "dep-7",
    facultyName: "Ma'muriyat va Boshqarma",
    name: "Axborot-resurs markazi (Kutubxona)",
    type: "division",
    headFullName: "Gulchehra Qosimova",
    academicTitle: "Bosh kutubxonachi",
    buildingName: "Axborot-resurs markazi (Kutubxona)",
    roomNumber: "ARM-101",
    phone: "+998 71 238 68 01",
    email: "arm@tatu.uz",
    roomsCount: 8,
    itemsCount: 8400,
    auditProgress: 90.0,
  },
  {
    id: "dep-8",
    facultyName: "Ma'muriyat va Boshqarma",
    name: "Bosh buxgalteriya va Moliya-iqtisodiyot bo'limi",
    type: "division",
    headFullName: "Munira Zokirova",
    academicTitle: "Bosh hisobchi",
    buildingName: "Bosh o'quv binosi (A korpus)",
    roomNumber: "215-xona",
    phone: "+998 71 238 64 08",
    email: "buxgalter@tatu.uz",
    roomsCount: 6,
    itemsCount: 950,
    auditProgress: 100.0,
  },
];

// 4. Xatlov Komissiyalari va Reja
export const INITIAL_COMMISSION: MockAuditCommission = {
  id: "com-2026",
  orderNumber: "№ 412-F",
  orderDate: "2026-09-15",
  title: "Muhammad al-Xorazmiy nomidagi TATU moddiy boyliklarini 2026-yilgi yalpi xatlovdan o'tkazish to'g'risida",
  status: "active",
  chairperson: {
    fullName: "Prof. Doniyor Olimov",
    position: "Moliya va iqtisodiy ishlar bo'yicha prorektor",
    academicTitle: "Iqtisodiyot fanlari doktori, professor",
  },
  deputyChairperson: {
    fullName: "Munira Zokirova",
    position: "Universitet bosh hisobchisi",
  },
  secretary: {
    fullName: "Shavkat Yusupov",
    position: "Bosh moddiy hisobchi",
  },
  members: [
    {
      id: "mem-1",
      fullName: "Jasur Qodirov",
      position: "Ichki audit va komplayens xizmati boshlig'i",
      role: "Auditorlar guruhi rahbari",
    },
    {
      id: "mem-2",
      fullName: "Bahodir Mahmudov",
      position: "Xodimlar boshqarmasi boshlig'i",
      role: "Komissiya a'zosi",
    },
    {
      id: "mem-3",
      fullName: "Anvar Rahmonov",
      position: "Talabalar kasaba uyushmasi qo'mitasi raisi",
      role: "Jamoatchilik nazorati",
    },
    {
      id: "mem-4",
      fullName: "Azizbek Normatov",
      position: "Axborot xavfsizligi bo'yicha mas'ul muhandis",
      role: "IT-aktivlar bo'yicha ekspert",
    },
  ],
  schedule: [
    {
      id: "sch-1",
      departmentOrBuilding: "Dasturiy injiniring kafedrasi va laboratoriyalari",
      targetFaculty: "Dasturiy injiniring fakulteti",
      targetBuilding: "Bosh o'quv binosi (A korpus)",
      startDate: "2026-09-20",
      endDate: "2026-10-10",
      assignedAuditor: "Jasur Qodirov",
      status: "completed",
      progress: 95,
      totalItems: 4500,
      scannedItems: 4280,
    },
    {
      id: "sch-2",
      departmentOrBuilding: "Sun'iy intellekt va neyron tarmoqlar kafedrasi",
      targetFaculty: "Dasturiy injiniring fakulteti",
      targetBuilding: "Bosh o'quv binosi (A korpus)",
      startDate: "2026-09-25",
      endDate: "2026-10-15",
      assignedAuditor: "Akmal Saidov",
      status: "completed",
      progress: 88,
      totalItems: 3000,
      scannedItems: 2640,
    },
    {
      id: "sch-3",
      departmentOrBuilding: "Mobil aloqa va simsiz tarmoqlar kafedrasi",
      targetFaculty: "Telekommunikatsiya fakulteti",
      targetBuilding: "Telekommunikatsiya binosi (C korpus)",
      startDate: "2026-10-01",
      endDate: "2026-10-25",
      assignedAuditor: "Jasur Qodirov",
      status: "in_progress",
      progress: 84,
      totalItems: 4200,
      scannedItems: 3528,
    },
    {
      id: "sch-4",
      departmentOrBuilding: "Kompyuter tizimlari va tarmoqlari kafedrasi",
      targetFaculty: "Kompyuter injiniringi fakulteti",
      targetBuilding: "Kompyuter injiniringi binosi (D korpus)",
      startDate: "2026-10-05",
      endDate: "2026-10-28",
      assignedAuditor: "Feruza Umarova",
      status: "in_progress",
      progress: 72,
      totalItems: 3600,
      scannedItems: 2592,
    },
    {
      id: "sch-5",
      departmentOrBuilding: "Kiberxavfsizlik va axborot himoyasi kafedrasi",
      targetFaculty: "Kiberxavfsizlik fakulteti",
      targetBuilding: "Axborot texnologiyalari binosi (B korpus)",
      startDate: "2026-10-10",
      endDate: "2026-11-05",
      assignedAuditor: "Akmal Saidov",
      status: "in_progress",
      progress: 20,
      totalItems: 1900,
      scannedItems: 380,
    },
    {
      id: "sch-6",
      departmentOrBuilding: "1-sonli Talabalar turar joyi barcha xonalari",
      targetFaculty: "Ma'muriyat",
      targetBuilding: "1-sonli Talabalar turar joyi",
      startDate: "2026-10-20",
      endDate: "2026-11-20",
      assignedAuditor: "Jasur Qodirov",
      status: "in_progress",
      progress: 42,
      totalItems: 5100,
      scannedItems: 2142,
    },
    {
      id: "sch-7",
      departmentOrBuilding: "Universitet sport majmuasi zallari",
      targetFaculty: "Ma'muriyat",
      targetBuilding: "Universitet sport majmuasi",
      startDate: "2026-10-25",
      endDate: "2026-11-25",
      assignedAuditor: "Feruza Umarova",
      status: "pending",
      progress: 0,
      totalItems: 3800,
      scannedItems: 0,
    },
  ],
};

// 5. Solishtirma Hisobotlar (Buxgalteriya vs Dala INV-19)
export const INITIAL_RECONCILIATION: MockReconciliationItem[] = [
  {
    id: "rec-1",
    inventoryNumber: "TATU-KOMP-00412",
    name: "HP ProDesk 400 G7 Ishchi Stansiyasi (i7/16GB/512GB)",
    category: "Kompyuter texnikasi",
    buildingName: "Bosh o'quv binosi (A korpus)",
    expectedRoom: "305-xona",
    actualRoom: "201-lab",
    bookQuantity: 1,
    actualQuantity: 1,
    difference: 0,
    unitPrice: 8500000,
    differenceSum: 0,
    discrepancyType: "misplaced",
    molName: "Dots. Nodir Saidov",
    auditorName: "Jasur Qodirov",
    scannedAt: "2026-10-30 11:24",
    resolutionNote: "Xonalararo ko'chirish hujjatsiz amalga oshirilgan",
  },
  {
    id: "rec-2",
    inventoryNumber: "TATU-PROJ-00109",
    name: "Epson EB-2250U Interaktiv Multimedia Proyektori",
    category: "Multimedia jihozlari",
    buildingName: "Bosh o'quv binosi (A korpus)",
    expectedRoom: "101-zal",
    actualRoom: "Topilmadi",
    bookQuantity: 1,
    actualQuantity: 0,
    difference: -1,
    unitPrice: 12000000,
    differenceSum: -12000000,
    discrepancyType: "shortage",
    molName: "Prof. O. Xolov",
    auditorName: "Akmal Saidov",
    scannedAt: "2026-10-29 15:40",
    resolutionNote: "Dala auditida xonada topilmadi, xatlov komissiyasiga akt yo'llandi",
  },
  {
    id: "rec-3",
    inventoryNumber: "TATU-SURPLUS-0001",
    name: "Lenovo ThinkVision T24i-20 Monitor (Buxgalteriyada ro'yxatsiz)",
    category: "Kompyuter texnikasi",
    buildingName: "Axborot texnologiyalari binosi (B korpus)",
    expectedRoom: "Ro'yxatda yo'q",
    actualRoom: "B-204",
    bookQuantity: 0,
    actualQuantity: 1,
    difference: 1,
    unitPrice: 2200000,
    differenceSum: 2200000,
    discrepancyType: "surplus",
    molName: "Dots. Ulug'bek Yusupov",
    auditorName: "Akmal Saidov",
    scannedAt: "2026-10-30 09:12",
    resolutionNote: "Homiy tashkilot tomonidan berilgan, kirim qilinishi lozim",
  },
  {
    id: "rec-4",
    inventoryNumber: "TATU-NET-00215",
    name: "Cisco Catalyst 2960-X 48-Port Switch",
    category: "Tarmoq uskunalari",
    buildingName: "Telekommunikatsiya binosi (C korpus)",
    expectedRoom: "C-201",
    actualRoom: "C-201",
    bookQuantity: 1,
    actualQuantity: 1,
    difference: 0,
    unitPrice: 16500000,
    differenceSum: 0,
    discrepancyType: "damaged",
    molName: "Dots. Feruza Umarova",
    auditorName: "Jasur Qodirov",
    scannedAt: "2026-10-28 16:30",
    resolutionNote: "Portlarida nosozlik aniqlandi, ta'mirga jo'natish tavsiya etildi",
  },
  {
    id: "rec-5",
    inventoryNumber: "TATU-MEB-00840",
    name: "Ergonomik Kafedra Konferentsiya Kreslosi",
    category: "Mebel jihozlari",
    buildingName: "Bosh o'quv binosi (A korpus)",
    expectedRoom: "305-xona",
    actualRoom: "304-lab",
    bookQuantity: 4,
    actualQuantity: 4,
    difference: 0,
    unitPrice: 1400000,
    differenceSum: 0,
    discrepancyType: "misplaced",
    molName: "Dots. Nodir Saidov",
    auditorName: "Jasur Qodirov",
    scannedAt: "2026-10-30 14:10",
    resolutionNote: "Qo'shni laboratoriyaga vaqtincha olib chiqilgan",
  },
];

// 6. Moddiy Javobgar Shaxslar (MOL Ro'yxati)
export const INITIAL_MOL_LIST: MockMOLPerson[] = [
  {
    id: "mol-1",
    fullName: "Dots. Nodir Saidov",
    position: "Dasturiy injiniring kafedrasi mudiri",
    department: "Dasturiy injiniring",
    phone: "+998 90 123 45 67",
    assignedRoomsCount: 16,
    totalItemsCount: 4500,
    totalValueSum: 7850000000,
    auditedItemsCount: 4280,
    auditPercentage: 95.0,
    conflictsCount: 3,
  },
  {
    id: "mol-2",
    fullName: "Prof. Sirojiddin Boboyev",
    position: "Sun'iy intellekt kafedrasi mudiri",
    department: "Sun'iy intellekt",
    phone: "+998 90 234 56 78",
    assignedRoomsCount: 12,
    totalItemsCount: 3000,
    totalValueSum: 5600000000,
    auditedItemsCount: 2640,
    auditPercentage: 88.0,
    conflictsCount: 1,
  },
  {
    id: "mol-3",
    fullName: "Dots. Ulug'bek Yusupov",
    position: "Kiberxavfsizlik kafedrasi mudiri",
    department: "Kiberxavfsizlik",
    phone: "+998 90 345 67 89",
    assignedRoomsCount: 14,
    totalItemsCount: 1900,
    totalValueSum: 4200000000,
    auditedItemsCount: 380,
    auditPercentage: 20.0,
    conflictsCount: 4,
  },
  {
    id: "mol-4",
    fullName: "Dots. Feruza Umarova",
    position: "Mobil aloqa kafedrasi mudiri",
    department: "Telekommunikatsiya",
    phone: "+998 90 456 78 90",
    assignedRoomsCount: 18,
    totalItemsCount: 4200,
    totalValueSum: 8900000000,
    auditedItemsCount: 3528,
    auditPercentage: 84.0,
    conflictsCount: 2,
  },
  {
    id: "mol-5",
    fullName: "Gulchehra Qosimova",
    position: "Axborot-resurs markazi direktori",
    department: "Kutubxona",
    phone: "+998 90 567 89 01",
    assignedRoomsCount: 8,
    totalItemsCount: 8400,
    totalValueSum: 14200000000,
    auditedItemsCount: 7560,
    auditPercentage: 90.0,
    conflictsCount: 0,
  },
  {
    id: "mol-6",
    fullName: "Salohiddin Rahimov",
    position: "Bosh o'quv binosi komendanti",
    department: "Xo'jalik bo'limi",
    phone: "+998 90 678 90 12",
    assignedRoomsCount: 32,
    totalItemsCount: 12800,
    totalValueSum: 18500000000,
    auditedItemsCount: 11000,
    auditPercentage: 85.9,
    conflictsCount: 6,
  },
];

// 7. Mas'ul Xodimlar (Faqat 3 ta rol!)
export const INITIAL_STAFF: MockStaff[] = [
  // A) Boshliq (100% Read-Only)
  {
    id: "st-1",
    fullName: "Prof. Baxtiyor Ergashev",
    username: "tatu.rector",
    email: "rector@tatu.uz",
    role: "head",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-09-01",
    lastLogin: "2026-10-31 09:15",
  },
  {
    id: "st-2",
    fullName: "Prof. Doniyor Olimov",
    username: "tatu.prorector_finance",
    email: "finance@tatu.uz",
    role: "head",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-09-05",
    lastLogin: "2026-10-31 16:40",
  },
  {
    id: "st-3",
    fullName: "Munira Zokirova",
    username: "tatu.chief_accountant",
    email: "buxgalter@tatu.uz",
    role: "head",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-09-10",
    lastLogin: "2026-10-31 11:05",
  },
  // B) Ro'yxatga Oluvchi (Moddiy hisobchi)
  {
    id: "st-4",
    fullName: "Shavkat Yusupov",
    username: "tatu.registrar_main",
    email: "yusupov@tatu.uz",
    role: "registrar",
    isActive: true,
    mustChangePassword: false,
    assignedBuilding: "Bosh o'quv binosi (A korpus)",
    createdAt: "2026-09-12",
    lastLogin: "2026-10-31 10:20",
  },
  {
    id: "st-5",
    fullName: "Azizbek Normatov",
    username: "tatu.registrar_tech",
    email: "normatov@tatu.uz",
    role: "registrar",
    isActive: true,
    mustChangePassword: false,
    assignedBuilding: "Axborot texnologiyalari binosi (B korpus)",
    createdAt: "2026-09-15",
    lastLogin: "2026-10-30 18:00",
  },
  {
    id: "st-6",
    fullName: "Dilnoza Rahimova",
    username: "tatu.registrar_telecom",
    email: "rahimova@tatu.uz",
    role: "registrar",
    isActive: true,
    mustChangePassword: false,
    assignedBuilding: "Telekommunikatsiya binosi (C korpus)",
    createdAt: "2026-09-20",
    lastLogin: "2026-10-31 14:30",
  },
  // C) Tekshiruvchi (Auditor)
  {
    id: "st-7",
    fullName: "Jasur Qodirov",
    username: "tatu.auditor_lead",
    email: "qodirov@tatu.uz",
    role: "inspector",
    isActive: true,
    mustChangePassword: false,
    assignedBuilding: "Bosh o'quv binosi (A korpus)",
    createdAt: "2026-09-22",
    lastLogin: "2026-10-31 12:10",
  },
  {
    id: "st-8",
    fullName: "Akmal Saidov",
    username: "tatu.auditor_it",
    email: "saidov.audit@tatu.uz",
    role: "inspector",
    isActive: true,
    mustChangePassword: false,
    assignedBuilding: "Axborot texnologiyalari binosi (B korpus)",
    createdAt: "2026-09-25",
    lastLogin: "2026-10-31 11:45",
  },
  {
    id: "st-9",
    fullName: "Feruza Umarova",
    username: "tatu.auditor_telecom",
    email: "umarova.audit@tatu.uz",
    role: "inspector",
    isActive: true,
    mustChangePassword: false,
    assignedBuilding: "Telekommunikatsiya binosi (C korpus)",
    createdAt: "2026-09-28",
    lastLogin: "2026-10-30 17:30",
  },
];

// 8. Jihozlar (Namuna aktivlar)
export const INITIAL_ITEMS: MockItem[] = [
  {
    id: "it-1",
    name: "HP ProDesk 400 G7 Ishchi Stansiyasi (Core i7 / 16GB)",
    inventoryNumber: "TATU-KOMP-00412",
    customLabel: "Dasturiy-01",
    category: "Kompyuter texnikasi",
    buildingName: "Bosh o'quv binosi (A korpus)",
    roomNumber: "305",
    status: "active",
    condition: "new",
    price: 8500000,
    registeredDate: "2026-09-18",
    qrToken: "qr_tatu_00412_hp_i7",
    responsiblePerson: "Dots. Nodir Saidov",
  },
  {
    id: "it-2",
    name: "Dell UltraSharp 27 dyuymli 4K Professional Monitor",
    inventoryNumber: "TATU-MON-00891",
    customLabel: "Dasturiy-Mon-01",
    category: "Kompyuter texnikasi",
    buildingName: "Bosh o'quv binosi (A korpus)",
    roomNumber: "305",
    status: "active",
    condition: "new",
    price: 4200000,
    registeredDate: "2026-09-18",
    qrToken: "qr_tatu_00891_dell_27",
    responsiblePerson: "Dots. Nodir Saidov",
  },
  {
    id: "it-3",
    name: "Epson EB-2250U Interaktiv Multimedia Proyektori",
    inventoryNumber: "TATU-PROJ-00109",
    customLabel: "Zal-Proyektor-01",
    category: "Multimedia jihozlari",
    buildingName: "Bosh o'quv binosi (A korpus)",
    roomNumber: "101",
    status: "active",
    condition: "good",
    price: 12000000,
    registeredDate: "2026-09-15",
    qrToken: "qr_tatu_00109_epson",
    responsiblePerson: "Prof. O. Xolov",
  },
  {
    id: "it-4",
    name: "Cisco Catalyst 2960-X 48-Port Gigabit Switch",
    inventoryNumber: "TATU-NET-00215",
    customLabel: "Telecom-Switch-01",
    category: "Tarmoq uskunalari",
    buildingName: "Telekommunikatsiya binosi (C korpus)",
    roomNumber: "C-201",
    status: "repair",
    condition: "fair",
    price: 16500000,
    registeredDate: "2026-09-20",
    qrToken: "qr_tatu_00215_cisco",
    responsiblePerson: "Dots. Feruza Umarova",
  },
  {
    id: "it-5",
    name: "Ergonomik Kafedra Konferentsiya Kreslosi",
    inventoryNumber: "TATU-MEB-00840",
    customLabel: "Kafedra-Mebel-01",
    category: "Mebel jihozlari",
    buildingName: "Bosh o'quv binosi (A korpus)",
    roomNumber: "305",
    status: "active",
    condition: "good",
    price: 1400000,
    registeredDate: "2026-09-19",
    qrToken: "qr_tatu_00840_chair",
    responsiblePerson: "Dots. Nodir Saidov",
  },
  {
    id: "it-6",
    name: "NVIDIA RTX A5000 24GB AI Server Tezlatkichi",
    inventoryNumber: "TATU-AI-00054",
    customLabel: "AI-Lab-GPU-01",
    category: "Kompyuter texnikasi",
    buildingName: "Bosh o'quv binosi (A korpus)",
    roomNumber: "304",
    status: "active",
    condition: "new",
    price: 32000000,
    registeredDate: "2026-09-22",
    qrToken: "qr_tatu_00054_rtx_a5000",
    responsiblePerson: "Prof. Sirojiddin Boboyev",
  },
];

// 9. Universitet Sozlamalari
export const INITIAL_ORG_SETTINGS: MockOrgSettings = {
  name: "Muhammad al-Xorazmiy nomidagi Toshkent Axborot Texnologiyalari Universiteti",
  shortName: "TATU",
  code: "TATU-MAIN",
  inn: "201122934",
  rectorName: "Prof. Baxtiyor Ergashev",
  rectorTitle: "Universitet rektori",
  chiefAccountantName: "Munira Zokirova",
  commissionChairName: "Prof. Doniyor Olimov",
  commissionChairTitle: "Moliya-iqtisodiy ishlar bo'yicha prorektor, Xatlov komissiyasi raisi",
  address: "Toshkent shahri, Yunusobod tumani, Amir Temur ko'chasi, 108-uy",
  phone: "+998 71 238 64 00",
  email: "info@tatu.uz",
  labelFormat: "40x25",
  labelShowLogo: true,
  labelShowUniName: true,
  labelPrefix: "TATU-2026-",
};

// 10. Jonli harakatlar vidjeti
export const INITIAL_ACTIVITY_LOG: MockActivityEvent[] = [
  {
    id: "act-1",
    type: "scan",
    title: "HP ProDesk 400 G7 kompyuteri skanerlandi",
    subtitle: "Jasur Qodirov &bull; 305-xona (Dasturiy injiniring)",
    timestamp: "2 daqiqa oldin",
    badgeText: "Tasdiqlandi",
    badgeVariant: "success",
  },
  {
    id: "act-2",
    type: "conflict",
    title: "Joylashuv nomuvofiqligi aniqlandi",
    subtitle: "Lenovo ThinkVision monitori 304-lab da topildi (asli 305)",
    timestamp: "8 daqiqa oldin",
    badgeText: "Nomuvofiq",
    badgeVariant: "warning",
  },
  {
    id: "act-3",
    type: "commission",
    title: "Xatlov komissiyasi oraliq hisoboti tasdiqlandi",
    subtitle: "Dasturiy injiniring kafedrasi 95% ga yakunlandi",
    timestamp: "24 daqiqa oldin",
    badgeText: "Komissiya",
    badgeVariant: "blue",
  },
  {
    id: "act-4",
    type: "scan",
    title: "NVIDIA RTX AI Serveri skanerlandi",
    subtitle: "Akmal Saidov &bull; 304-xona (Sun'iy intellekt)",
    timestamp: "45 daqiqa oldin",
    badgeText: "Tasdiqlandi",
    badgeVariant: "success",
  },
  {
    id: "act-5",
    type: "register",
    title: "5 ta yangi laboratoriya mebeli ro'yxatga olindi",
    subtitle: "Shavkat Yusupov (Ro'yxatga oluvchi) &bull; A korpus",
    timestamp: "1 soat oldin",
    badgeText: "Yangi aktiv",
    badgeVariant: "neutral",
  },
];

// Rollar ta'rifi
export const MOCK_ROLE_DETAILS = {
  head: {
    label: "Boshliq",
    badge: "Boshliq",
    color: "purple",
    description: "Rektorat va buxgalteriya — xatlov hisobotlari va aktivlar balansini ko'rish huquqi.",
    icon: "Eye",
  },
  registrar: {
    label: "Ro'yxatga oluvchi",
    badge: "Ro'yxatga oluvchi",
    color: "blue",
    description: "Moddiy hisobchi — bino, xona va yangi aktivlarni ro'yxatga olish hamda QR stiker chiqarish.",
    icon: "Tag",
  },
  inspector: {
    label: "Tekshiruvchi",
    badge: "Tekshiruvchi",
    color: "emerald",
    description: "Auditor — joylarda mobil ilovada QR kodlarni skanerlash va holatni tasdiqlash.",
    icon: "ScanLine",
  },
} as const;

// Parol generatori
export function generateMockPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  let pass = "TATU#";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}
