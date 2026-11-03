export interface MockBuilding {
  id: string;
  name: string;
  code: string;
  address: string;
  floorsCount: number;
  roomsCount: number;
  itemsCount: number;
  iconType: "main" | "tech" | "dorm" | "sport" | "library";
}

export interface MockFloor {
  id: string;
  buildingId: string;
  floorNumber: number;
  name: string;
  roomsCount: number;
}

export interface MockRoom {
  id: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  floorNumber: number;
  roomNumber: string;
  name: string;
  type: string;
  capacity: number;
  itemsCount: number;
}

export interface MockItem {
  id: string;
  name: string;
  inventoryNumber: string;
  categoryName: string;
  description: string;
  status: "active" | "repair" | "written_off";
  condition: "new" | "good" | "fair" | "poor";
  photoUrl: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  roomId: string;
  roomNumber: string;
  roomName: string;
  responsiblePerson: string;
}

export const MOCK_BUILDINGS: MockBuilding[] = [
  {
    id: "bld-1",
    name: "Bosh o'quv binosi (A bino)",
    code: "B1",
    address: "Amir Temur shoh ko'chasi, 108-uy",
    floorsCount: 4,
    roomsCount: 28,
    itemsCount: 342,
    iconType: "main",
  },
  {
    id: "bld-2",
    name: "Axborot texnologiyalari binosi (B bino)",
    code: "B2",
    address: "Universitet xiyoboni, 4-bino",
    floorsCount: 3,
    roomsCount: 18,
    itemsCount: 265,
    iconType: "tech",
  },
  {
    id: "bld-3",
    name: "Talabalar turar joyi (Yotoqxona №1)",
    code: "Y1",
    address: "Talabalar shaharchasi, 12-bino",
    floorsCount: 5,
    roomsCount: 45,
    itemsCount: 410,
    iconType: "dorm",
  },
  {
    id: "bld-4",
    name: "Sport majmuasi va gimnastika zali",
    code: "S1",
    address: "Sport majmuasi xiyoboni",
    floorsCount: 2,
    roomsCount: 10,
    itemsCount: 98,
    iconType: "sport",
  },
  {
    id: "bld-5",
    name: "Axborot-resurs markazi (Kutubxona)",
    code: "K1",
    address: "Markaziy kutubxona xiyoboni",
    floorsCount: 3,
    roomsCount: 14,
    itemsCount: 195,
    iconType: "library",
  },
];

export const MOCK_FLOORS: MockFloor[] = [
  // Bosh o'quv binosi (B1)
  { id: "fl-1-1", buildingId: "bld-1", floorNumber: 1, name: "1-qavat", roomsCount: 7 },
  { id: "fl-1-2", buildingId: "bld-1", floorNumber: 2, name: "2-qavat", roomsCount: 8 },
  { id: "fl-1-3", buildingId: "bld-1", floorNumber: 3, name: "3-qavat", roomsCount: 7 },
  { id: "fl-1-4", buildingId: "bld-1", floorNumber: 4, name: "4-qavat", roomsCount: 6 },

  // Axborot texnologiyalari binosi (B2)
  { id: "fl-2-1", buildingId: "bld-2", floorNumber: 1, name: "1-qavat", roomsCount: 6 },
  { id: "fl-2-2", buildingId: "bld-2", floorNumber: 2, name: "2-qavat", roomsCount: 6 },
  { id: "fl-2-3", buildingId: "bld-2", floorNumber: 3, name: "3-qavat", roomsCount: 6 },

  // Yotoqxona (Y1)
  { id: "fl-3-1", buildingId: "bld-3", floorNumber: 1, name: "1-qavat (Ma'muriyat)", roomsCount: 9 },
  { id: "fl-3-2", buildingId: "bld-3", floorNumber: 2, name: "2-qavat (Yashash xonalari)", roomsCount: 12 },
  { id: "fl-3-3", buildingId: "bld-3", floorNumber: 3, name: "3-qavat (Yashash xonalari)", roomsCount: 12 },
  { id: "fl-3-4", buildingId: "bld-3", floorNumber: 4, name: "4-qavat", roomsCount: 6 },
  { id: "fl-3-5", buildingId: "bld-3", floorNumber: 5, name: "5-qavat", roomsCount: 6 },

  // Sport majmuasi (S1)
  { id: "fl-4-1", buildingId: "bld-4", floorNumber: 1, name: "1-qavat (Katta zal)", roomsCount: 5 },
  { id: "fl-4-2", buildingId: "bld-4", floorNumber: 2, name: "2-qavat (Trenajyor)", roomsCount: 5 },

  // Kutubxona (K1)
  { id: "fl-5-1", buildingId: "bld-5", floorNumber: 1, name: "1-qavat (O'quv zali)", roomsCount: 5 },
  { id: "fl-5-2", buildingId: "bld-5", floorNumber: 2, name: "2-qavat (Elektron kutubxona)", roomsCount: 5 },
  { id: "fl-5-3", buildingId: "bld-5", floorNumber: 3, name: "3-qavat (Arxiv)", roomsCount: 4 },
];

export const MOCK_ROOMS: MockRoom[] = [
  // Bosh o'quv binosi (A bino) - 1-qavat
  {
    id: "rm-101",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-1",
    floorName: "1-qavat",
    floorNumber: 1,
    roomNumber: "101",
    name: "Katta Ma'ruzalar Zali (Amfiteatr)",
    type: "lecture_hall",
    capacity: 120,
    itemsCount: 42,
  },
  {
    id: "rm-102",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-1",
    floorName: "1-qavat",
    floorNumber: 1,
    roomNumber: "102",
    name: "Fakultet Dekanati",
    type: "deans_office",
    capacity: 12,
    itemsCount: 19,
  },
  {
    id: "rm-105",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-1",
    floorName: "1-qavat",
    floorNumber: 1,
    roomNumber: "105",
    name: "Fizika va Optika Laboratoriyasi",
    type: "lab",
    capacity: 30,
    itemsCount: 34,
  },

  // Bosh o'quv binosi (A bino) - 2-qavat
  {
    id: "rm-204",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-2",
    floorName: "2-qavat",
    floorNumber: 2,
    roomNumber: "204",
    name: "Dasturiy Muhandislik Laboratoriyasi",
    type: "computer_lab",
    capacity: 32,
    itemsCount: 38,
  },
  {
    id: "rm-210",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-2",
    floorName: "2-qavat",
    floorNumber: 2,
    roomNumber: "210",
    name: "Kompyuter Grafikasi va Multimediya Auditoriyasi",
    type: "classroom",
    capacity: 36,
    itemsCount: 28,
  },
  {
    id: "rm-215",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-2",
    floorName: "2-qavat",
    floorNumber: 2,
    roomNumber: "215",
    name: "Kafedra Mudiri Xonasi",
    type: "department_head",
    capacity: 6,
    itemsCount: 14,
  },

  // Bosh o'quv binosi (A bino) - 3-qavat
  {
    id: "rm-301",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-3",
    floorName: "3-qavat",
    floorNumber: 3,
    roomNumber: "301",
    name: "Kiberxavfsizlik O'quv Markazi",
    type: "computer_lab",
    capacity: 28,
    itemsCount: 32,
  },
  {
    id: "rm-308",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-3",
    floorName: "3-qavat",
    floorNumber: 3,
    roomNumber: "308",
    name: "Professor-O'qituvchilar Xonasi",
    type: "teachers_room",
    capacity: 15,
    itemsCount: 22,
  },

  // B bino (IT binosi)
  {
    id: "rm-it-101",
    buildingId: "bld-2",
    buildingName: "Axborot texnologiyalari binosi (B bino)",
    floorId: "fl-2-1",
    floorName: "1-qavat",
    floorNumber: 1,
    roomNumber: "101-B",
    name: "Sun'iy Intellekt va Katta Ma'lumotlar Zali",
    type: "computer_lab",
    capacity: 40,
    itemsCount: 45,
  },
  {
    id: "rm-it-201",
    buildingId: "bld-2",
    buildingName: "Axborot texnologiyalari binosi (B bino)",
    floorId: "fl-2-2",
    floorName: "2-qavat",
    floorNumber: 2,
    roomNumber: "201-B",
    name: "Mobil Ilovalar Ishlab Chiqish Studiyasi",
    type: "classroom",
    capacity: 30,
    itemsCount: 31,
  },

  // Yotoqxona
  {
    id: "rm-dorm-101",
    buildingId: "bld-3",
    buildingName: "Talabalar turar joyi (Yotoqxona №1)",
    floorId: "fl-3-1",
    floorName: "1-qavat (Ma'muriyat)",
    floorNumber: 1,
    roomNumber: "101-Y",
    name: "Yotoqxona Komendanti Xonasi",
    type: "dorm_manager",
    capacity: 4,
    itemsCount: 16,
  },
  {
    id: "rm-dorm-205",
    buildingId: "bld-3",
    buildingName: "Talabalar turar joyi (Yotoqxona №1)",
    floorId: "fl-3-2",
    floorName: "2-qavat (Yashash xonalari)",
    floorNumber: 2,
    roomNumber: "205-Y",
    name: "Talabalar Xonasi (4 kishilik)",
    type: "dorm_room",
    capacity: 4,
    itemsCount: 12,
  },

  // Sport majmuasi
  {
    id: "rm-sport-101",
    buildingId: "bld-4",
    buildingName: "Sport majmuasi va gimnastika zali",
    floorId: "fl-4-1",
    floorName: "1-qavat (Katta zal)",
    floorNumber: 1,
    roomNumber: "101-S",
    name: "Asosiy Gimnastika va Basketbol Zali",
    type: "gym_main",
    capacity: 80,
    itemsCount: 35,
  },

  // Kutubxona
  {
    id: "rm-lib-101",
    buildingId: "bld-5",
    buildingName: "Axborot-resurs markazi (Kutubxona)",
    floorId: "fl-5-1",
    floorName: "1-qavat (O'quv zali)",
    floorNumber: 1,
    roomNumber: "101-K",
    name: "Bosh Elektron O'quv Zali",
    type: "library",
    capacity: 60,
    itemsCount: 52,
  },
];

export const MOCK_ITEMS: MockItem[] = [
  // 210-auditoriya (Kompyuter grafikasi va multimediya) jihozlari:
  {
    id: "it-210-1",
    name: "Multimedia Proyektori Epson EB-X41",
    inventoryNumber: "B1-210-0001",
    categoryName: "Kompyuter va orgtexnika",
    description: "3600 ANSI lumen, HDMI/VGA ulanishli shiftdagi multimedia proyektori",
    status: "active",
    condition: "good",
    photoUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-2",
    floorName: "2-qavat",
    roomId: "rm-210",
    roomNumber: "210",
    roomName: "Kompyuter Grafikasi va Multimediya Auditoriyasi",
    responsiblePerson: "I. O. Rahimov",
  },
  {
    id: "it-210-2",
    name: "Samsung 75\" Flip Pro Interaktiv Sensorli Doska",
    inventoryNumber: "B1-210-0002",
    categoryName: "Kompyuter va orgtexnika",
    description: "4K UHD sensorli smart doska, devorga o'rnatilgan kronshteyn bilan",
    status: "active",
    condition: "new",
    photoUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-2",
    floorName: "2-qavat",
    roomId: "rm-210",
    roomNumber: "210",
    roomName: "Kompyuter Grafikasi va Multimediya Auditoriyasi",
    responsiblePerson: "I. O. Rahimov",
  },
  {
    id: "it-210-3",
    name: "HP ProBook 450 G8 O'qituvchi Monoblok Kompyuteri",
    inventoryNumber: "B1-210-0003",
    categoryName: "Kompyuter va orgtexnika",
    description: "Core i7 11-avlod, 16GB RAM, 512GB SSD, 24 dyuym IPS monitor",
    status: "active",
    condition: "good",
    photoUrl: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-2",
    floorName: "2-qavat",
    roomId: "rm-210",
    roomNumber: "210",
    roomName: "Kompyuter Grafikasi va Multimediya Auditoriyasi",
    responsiblePerson: "I. O. Rahimov",
  },
  {
    id: "it-210-4",
    name: "Artel Inverter 24 Iqlim Konditsioneri",
    inventoryNumber: "B1-210-0004",
    categoryName: "Maishiy va iqlim texnikasi",
    description: "24000 BTU sovutish va isitish quvvati, pult bilan",
    status: "active",
    condition: "good",
    photoUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-2",
    floorName: "2-qavat",
    roomId: "rm-210",
    roomNumber: "210",
    roomName: "Kompyuter Grafikasi va Multimediya Auditoriyasi",
    responsiblePerson: "I. O. Rahimov",
  },
  {
    id: "it-210-5",
    name: "Ikki Kishi Uchun O'quv Partasi (Metall karkas)",
    inventoryNumber: "B1-210-0005",
    categoryName: "Mebel va jihozlar",
    description: "120x50 sm o'lchamdagi laminatlangan yog'och parta (jami 16 dona)",
    status: "active",
    condition: "good",
    photoUrl: "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-2",
    floorName: "2-qavat",
    roomId: "rm-210",
    roomNumber: "210",
    roomName: "Kompyuter Grafikasi va Multimediya Auditoriyasi",
    responsiblePerson: "I. O. Rahimov",
  },
  {
    id: "it-210-6",
    name: "Yumshoq O'rindiqli Talabalar Stuli (Iso)",
    inventoryNumber: "B1-210-0006",
    categoryName: "Mebel va jihozlar",
    description: "Qora matoli metall oyoqli qulay stul (jami 32 dona)",
    status: "active",
    condition: "good",
    photoUrl: "https://images.unsplash.com/photo-1580481077195-c9a92a5d2b78?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-2",
    floorName: "2-qavat",
    roomId: "rm-210",
    roomNumber: "210",
    roomName: "Kompyuter Grafikasi va Multimediya Auditoriyasi",
    responsiblePerson: "I. O. Rahimov",
  },
  {
    id: "it-210-7",
    name: "Canon i-SENSYS LBP223dw Lazer Printer",
    inventoryNumber: "B1-210-0007",
    categoryName: "Kompyuter va orgtexnika",
    description: "Wi-Fi va ikki tomonlama avtomatik bosmaga ega printer",
    status: "repair",
    condition: "poor",
    photoUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-2",
    floorName: "2-qavat",
    roomId: "rm-210",
    roomNumber: "210",
    roomName: "Kompyuter Grafikasi va Multimediya Auditoriyasi",
    responsiblePerson: "I. O. Rahimov",
  },
  {
    id: "it-210-8",
    name: "Cisco Catalyst 2960-X 24-Port Tarmoq Switchi",
    inventoryNumber: "B1-210-0008",
    categoryName: "Tarmoq uskunalari",
    description: "Gigabit kommutator, devordagi telekommunikatsiya shkafida o'rnatilgan",
    status: "active",
    condition: "good",
    photoUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-2",
    floorName: "2-qavat",
    roomId: "rm-210",
    roomNumber: "210",
    roomName: "Kompyuter Grafikasi va Multimediya Auditoriyasi",
    responsiblePerson: "I. O. Rahimov",
  },

  // 101-auditoriya (Amfiteatr) jihozlari:
  {
    id: "it-101-1",
    name: "Yuqori Quvvatli Lazer Proyektor Panasonic PT-MZ780",
    inventoryNumber: "B1-101-0001",
    categoryName: "Kompyuter va orgtexnika",
    description: "7000 ANSI lumen katta zal lazerli multimedia proyektori",
    status: "active",
    condition: "new",
    photoUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-1",
    floorName: "1-qavat",
    roomId: "rm-101",
    roomNumber: "101",
    roomName: "Katta Ma'ruzalar Zali (Amfiteatr)",
    responsiblePerson: "M. S. Jalilov",
  },
  {
    id: "it-101-2",
    name: "Motorli Katta Proyektor Ekrani (3x2 metr)",
    inventoryNumber: "B1-101-0002",
    categoryName: "Mebel va jihozlar",
    description: "Masofadan boshqarish pulti bilan tushib-ko'tariluvchi oq ekran",
    status: "active",
    condition: "good",
    photoUrl: "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-1",
    floorName: "1-qavat",
    roomId: "rm-101",
    roomNumber: "101",
    roomName: "Katta Ma'ruzalar Zali (Amfiteatr)",
    responsiblePerson: "M. S. Jalilov",
  },
  {
    id: "it-101-3",
    name: "Yamaha Akustik Ovoz Kuchaytirgich Tizimi va Mikrofonlar",
    inventoryNumber: "B1-101-0003",
    categoryName: "Kompyuter va orgtexnika",
    description: "2 ta simsiz mikrofon, 4 ta devor karnayi va miksher pulti",
    status: "active",
    condition: "good",
    photoUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-1",
    floorName: "1-qavat",
    roomId: "rm-101",
    roomNumber: "101",
    roomName: "Katta Ma'ruzalar Zali (Amfiteatr)",
    responsiblePerson: "M. S. Jalilov",
  },

  // 204-kompyuter laboratoriyasi:
  {
    id: "it-204-1",
    name: "Dell OptiPlex 7090 Monoblok Kompyuterlar Jamlanmasi",
    inventoryNumber: "B1-204-0001",
    categoryName: "Kompyuter va orgtexnika",
    description: "Core i7, 32GB RAM, 1TB SSD, 27 dyuym 4K ekran (25 dona)",
    status: "active",
    condition: "new",
    photoUrl: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-2",
    floorName: "2-qavat",
    roomId: "rm-204",
    roomNumber: "204",
    roomName: "Dasturiy Muhandislik Laboratoriyasi",
    responsiblePerson: "Q. T. Ergashev",
  },
  {
    id: "it-204-2",
    name: "BenQ 4K Qisqa Fokusli O'quv Proyektori",
    inventoryNumber: "B1-204-0002",
    categoryName: "Kompyuter va orgtexnika",
    description: "Devorga yaqin masofadan katta tasvir beruvchi lazer proyektor",
    status: "active",
    condition: "good",
    photoUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-1",
    buildingName: "Bosh o'quv binosi (A bino)",
    floorId: "fl-1-2",
    floorName: "2-qavat",
    roomId: "rm-204",
    roomNumber: "204",
    roomName: "Dasturiy Muhandislik Laboratoriyasi",
    responsiblePerson: "Q. T. Ergashev",
  },

  // B bino (IT binosi) - 101-B
  {
    id: "it-it-1",
    name: "NVIDIA DGX A100 AI Server va Hisoblash Stansiyasi",
    inventoryNumber: "B2-101-0001",
    categoryName: "Tarmoq uskunalari",
    description: "Sun'iy intellekt va neyron to'rlarini o'qitish stansiyasi",
    status: "active",
    condition: "new",
    photoUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-2",
    buildingName: "Axborot texnologiyalari binosi (B bino)",
    floorId: "fl-2-1",
    floorName: "1-qavat",
    roomId: "rm-it-101",
    roomNumber: "101-B",
    roomName: "Sun'iy Intellekt va Katta Ma'lumotlar Zali",
    responsiblePerson: "D. R. Vohidov",
  },
  {
    id: "it-it-2",
    name: "ViewSonic 86\" 4K Interaktiv Doska",
    inventoryNumber: "B2-101-0002",
    categoryName: "Kompyuter va orgtexnika",
    description: "20 nuqtali ko'p tegishli sensor ekran",
    status: "active",
    condition: "good",
    photoUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
    buildingId: "bld-2",
    buildingName: "Axborot texnologiyalari binosi (B bino)",
    floorId: "fl-2-1",
    floorName: "1-qavat",
    roomId: "rm-it-101",
    roomNumber: "101-B",
    roomName: "Sun'iy Intellekt va Katta Ma'lumotlar Zali",
    responsiblePerson: "D. R. Vohidov",
  },
];
