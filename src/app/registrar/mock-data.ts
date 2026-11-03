/**
 * RÖYXATGA OLUVÇI (Registrar / Moddiy Hisobçi) Moduli
 * Toza, boy va 100% interaktiv Mock Data
 */

export interface MockBuilding {
  id: string;
  name: string;
  code: string;
  type: "academic" | "dormitory" | "sports" | "library" | "admin";
  floorsCount: number;
}

export interface MockRoom {
  id: string;
  buildingId: string;
  floorNumber: number;
  roomNumber: string;
  name: string;
  type: string;
  capacityTarget: number; // Kutilayotgan jihozlar möljali (progress bar uçun)
}

export interface MockItem {
  id: string;
  buildingId: string;
  roomId: string;
  inventoryNumber: string; // Masalan: B1-210-0001
  name: string;
  model: string;
  price: number;
  condition: "new" | "good" | "fair" | "poor";
  status: "active" | "repair";
  photoUrl?: string;
  qrToken: string;
  createdAt: string;
}

export const INITIAL_BUILDINGS: MockBuilding[] = [
  {
    id: "bld-1",
    name: "1-Öquv binosi",
    code: "B1",
    type: "academic",
    floorsCount: 4,
  },
  {
    id: "bld-2",
    name: "Talabalar turar joyi №2",
    code: "YOT2",
    type: "dormitory",
    floorsCount: 5,
  },
  {
    id: "bld-3",
    name: "Sport majmuasi",
    code: "SPORT1",
    type: "sports",
    floorsCount: 2,
  },
  {
    id: "bld-4",
    name: "Axborot-resurs markazi (Kutubxona)",
    code: "KUTUB1",
    type: "library",
    floorsCount: 3,
  },
];

export const INITIAL_ROOMS: MockRoom[] = [
  {
    id: "room-210",
    buildingId: "bld-1",
    floorNumber: 2,
    roomNumber: "210",
    name: "210-Ma’ruzalar zali",
    type: "Auditoriya",
    capacityTarget: 25,
  },
  {
    id: "room-101",
    buildingId: "bld-1",
    floorNumber: 1,
    roomNumber: "101",
    name: "101-Kompyuter laboratoriyasi",
    type: "Laboratoriya",
    capacityTarget: 20,
  },
  {
    id: "room-304",
    buildingId: "bld-1",
    floorNumber: 3,
    roomNumber: "304",
    name: "Dasturiy injiniring kafedrasi",
    type: "Kafedra / Ofis",
    capacityTarget: 10,
  },
  {
    id: "room-yot-105",
    buildingId: "bld-2",
    floorNumber: 1,
    roomNumber: "105",
    name: "105-Yaşaş xonasi",
    type: "Yotoqxona",
    capacityTarget: 8,
  },
];

export const INITIAL_ITEMS: MockItem[] = [
  {
    id: "item-1",
    buildingId: "bld-1",
    roomId: "room-210",
    inventoryNumber: "B1-210-0001",
    name: "Öquvçi partasi (ikki örinli)",
    model: "Maktab-Mebel Ergonomik 2026",
    price: 450000,
    condition: "new",
    status: "active",
    photoUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&auto=format&fit=crop&q=60",
    qrToken: "tok_b1_210_0001_mock",
    createdAt: "2026-10-30T10:15:00Z",
  },
  {
    id: "item-2",
    buildingId: "bld-1",
    roomId: "room-210",
    inventoryNumber: "B1-210-0002",
    name: "Öquvçi partasi (ikki örinli)",
    model: "Maktab-Mebel Ergonomik 2026",
    price: 450000,
    condition: "new",
    status: "active",
    qrToken: "tok_b1_210_0002_mock",
    createdAt: "2026-10-30T10:15:01Z",
  },
  {
    id: "item-3",
    buildingId: "bld-1",
    roomId: "room-210",
    inventoryNumber: "B1-210-0003",
    name: "Öquvçi partasi (ikki örinli)",
    model: "Maktab-Mebel Ergonomik 2026",
    price: 450000,
    condition: "new",
    status: "active",
    qrToken: "tok_b1_210_0003_mock",
    createdAt: "2026-10-30T10:15:02Z",
  },
  {
    id: "item-4",
    buildingId: "bld-1",
    roomId: "room-210",
    inventoryNumber: "B1-210-0004",
    name: "Öqituvçi kafedrasi va stoli",
    model: "Classic Wood 140",
    price: 1200000,
    condition: "good",
    status: "active",
    photoUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&auto=format&fit=crop&q=60",
    qrToken: "tok_b1_210_0004_mock",
    createdAt: "2026-10-30T10:20:00Z",
  },
  {
    id: "item-5",
    buildingId: "bld-1",
    roomId: "room-210",
    inventoryNumber: "B1-210-0005",
    name: "Interaktiv Proyektor Epson",
    model: "Epson EB-735Fi",
    price: 18500000,
    condition: "new",
    status: "active",
    photoUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=60",
    qrToken: "tok_b1_210_0005_mock",
    createdAt: "2026-10-30T10:25:00Z",
  },
  {
    id: "item-6",
    buildingId: "bld-1",
    roomId: "room-101",
    inventoryNumber: "B1-101-0001",
    name: "Monoblok HP 24",
    model: "HP ProDesk 400 G6",
    price: 9200000,
    condition: "new",
    status: "active",
    photoUrl: "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&auto=format&fit=crop&q=60",
    qrToken: "tok_b1_101_0001_mock",
    createdAt: "2026-10-30T09:00:00Z",
  },
];
