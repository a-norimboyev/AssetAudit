import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const FLOOR_ROOM_NAMES: Record<number, Record<number, string>> = {
  1: {
    101: "O‘quv zali",
    102: "O‘quv auditoriyasi 102",
    103: "Ma‘ruza zali 103",
    104: "O‘quv xonasi 104",
    105: "Amaliyot xonasi 105",
    106: "Seminar xonasi 106",
    107: "Laboratoriya xonasi 107",
    108: "Kompyuter sinfi 108",
    109: "O‘quv zali 109",
    110: "Kafedra mudiri xonasi 110",
    111: "O‘qituvchilar xonasi 111",
    112: "Metodika xonasi 112",
    113: "O‘quv auditoriyasi 113",
    114: "Seminar xonasi 114",
    115: "Ma‘ruza zali 115",
    116: "Amaliy mashg‘ulot xonasi 116",
    117: "O‘quv auditoriyasi 117",
    118: "Kutubxona o‘quv zali 118",
    119: "Axborot texnologiyalari xonasi 119",
    120: "O‘quv laboratoriyasi 120",
    121: "O‘quv auditoriyasi 121",
    122: "Seminar auditoriyasi 122",
    123: "O‘quv xonasi 123",
    124: "Til o‘rganish markazi 124",
    125: "O‘quv auditoriyasi 125",
    126: "Kafedra xonasi 126",
    127: "O‘qituvchilar xonasi 127",
    128: "Ma‘ruza zali 128",
    129: "O‘quv xonasi 129",
    130: "Maslahat xonasi 130",
  },
  2: {
    201: "Dekanxona 201",
    202: "Dekan o‘rinbosari xonasi 202",
    203: "Ma‘ruza zali 203",
    204: "Katta o‘quv auditoriyasi 204",
    205: "Seminar xonasi 205",
    206: "Kompyuter laboratoriyasi 206",
    207: "O‘quv xonasi 207",
    208: "Amaliyot auditoriyasi 208",
    209: "O‘quv auditoriyasi 209",
    210: "Kafedra mudiri xonasi 210",
    211: "O‘qituvchilar xonasi 211",
    212: "Metodika xonasi 212",
    213: "O‘quv auditoriyasi 213",
    214: "Seminar xonasi 214",
    215: "Ma‘ruza zali 215",
    216: "Amaliy mashg‘ulot xonasi 216",
    217: "O‘quv auditoriyasi 217",
    218: "O‘quv laboratoriyasi 218",
    219: "Axborot-resurs markazi 219",
    220: "Ilmiy tadqiqot laboratoriyasi 220",
    221: "O‘quv auditoriyasi 221",
    222: "Seminar xonasi 222",
    223: "O‘quv xonasi 223",
    224: "Multimediya xonasi 224",
    225: "O‘quv auditoriyasi 225",
    226: "Kafedra xonasi 226",
    227: "O‘qituvchilar xonasi 227",
    228: "Ma‘ruza zali 228",
    229: "O‘quv xonasi 229",
    230: "Konferensiya zali 230",
  },
  3: {
    301: "Katta ma‘ruza zali 301",
    302: "O‘quv auditoriyasi 302",
    303: "Dasturlash laboratoriyasi 303",
    304: "Kiberxavfsizlik xonasi 304",
    305: "Sun‘iy intellekt laboratoriyasi 305",
    306: "Kompyuter sinfi 306",
    307: "O‘quv xonasi 307",
    308: "Amaliyot xonasi 308",
    309: "O‘quv auditoriyasi 309",
    310: "Kafedra mudiri xonasi 310",
    311: "O‘qituvchilar xonasi 311",
    312: "Seminar xonasi 312",
    313: "O‘quv auditoriyasi 313",
    314: "O‘quv xonasi 314",
    315: "Ma‘ruza zali 315",
    316: "Amaliy mashg‘ulot xonasi 316",
    317: "O‘quv auditoriyasi 317",
    318: "Elektronika laboratoriyasi 318",
    319: "Robototexnika laboratoriyasi 319",
    320: "Ilmiy seminar xonasi 320",
    321: "O‘quv auditoriyasi 321",
    322: "Seminar auditoriyasi 322",
    323: "O‘quv xonasi 323",
    324: "Loyihalar xonasi 324",
    325: "O‘quv auditoriyasi 325",
    326: "Kafedra xonasi 326",
    327: "O‘qituvchilar xonasi 327",
    328: "Ma‘ruza zali 328",
    329: "O‘quv xonasi 329",
    330: "Yig‘ilishlar zali 330",
  },
  4: {
    401: "Katta anjumanlar zali 401",
    402: "O‘quv auditoriyasi 402",
    403: "Ma‘ruza zali 403",
    404: "O‘quv xonasi 404",
    405: "Seminar xonasi 405",
    406: "Tarmoq laboratoriyasi 406",
    407: "Server xonasi 407",
    408: "Amaliyot xonasi 408",
    409: "O‘quv auditoriyasi 409",
    410: "Kafedra mudiri xonasi 410",
    411: "O‘qituvchilar xonasi 411",
    412: "Metodika xonasi 412",
    413: "O‘quv auditoriyasi 413",
    414: "Seminar xonasi 414",
    415: "Ma‘ruza zali 415",
    416: "Amaliy mashg‘ulot xonasi 416",
    417: "O‘quv auditoriyasi 417",
    418: "O‘quv laboratoriyasi 418",
    419: "Axborot texnologiyalari markazi 419",
    420: "Startup & Kovorking xonasi 420",
    421: "O‘quv auditoriyasi 421",
    422: "Seminar auditoriyasi 422",
    423: "O‘quv xonasi 423",
    424: "Media studiya 424",
    425: "O‘quv auditoriyasi 425",
    426: "Kafedra xonasi 426",
    427: "O‘qituvchilar xonasi 427",
    428: "Ma‘ruza zali 428",
    429: "O‘quv xonasi 429",
    430: "Kengashlar zali 430",
  },
};

async function main() {
  const client = await pool.connect();
  try {
    const floorsRes = await client.query(
      `SELECT f.id, f.building_id, f.organization_id, f.floor_number, f.name, b.name as building_name
       FROM floors f
       JOIN buildings b ON b.id = f.building_id
       ORDER BY f.floor_number`
    );

    console.log(`Topilgan qavatlar soni: ${floorsRes.rows.length}`);

    for (const floor of floorsRes.rows) {
      const floorNum = floor.floor_number;
      console.log(`\n=== Qavat: ${floorNum} (${floor.name}) tekshirilmoqda ===`);

      // Mavjud xonalarni olish
      const existingRoomsRes = await client.query(
        `SELECT room_number FROM rooms WHERE floor_id = $1`,
        [floor.id]
      );
      const existingSet = new Set(existingRoomsRes.rows.map((r) => r.room_number.trim().toUpperCase()));

      let insertedCount = 0;
      for (let i = 1; i <= 30; i++) {
        const roomNum = `${floorNum * 100 + i}`;
        if (existingSet.has(roomNum.toUpperCase())) {
          console.log(`  - Xona ${roomNum} allaqachon mavjud, o'tkazib yuborildi.`);
          continue;
        }

        const roomName = FLOOR_ROOM_NAMES[floorNum]?.[floorNum * 100 + i] || `${roomNum}-xona`;

        await client.query(
          `INSERT INTO rooms (
            organization_id, building_id, floor_id, room_number, name, type, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [
            floor.organization_id,
            floor.building_id,
            floor.id,
            roomNum,
            roomName,
            "lecture_hall",
            true,
          ]
        );
        insertedCount++;
      }

      console.log(`  -> ${floorNum}-qavatga ${insertedCount} ta yangi xona qo'shildi.`);
    }

    // Yakuniy statistikani ko'rsatish
    const summaryRes = await client.query(
      `SELECT f.floor_number, f.name as floor_name, COUNT(r.id) as total_rooms
       FROM floors f
       LEFT JOIN rooms r ON r.floor_id = f.id
       GROUP BY f.id, f.floor_number, f.name
       ORDER BY f.floor_number`
    );

    console.log("\n=== Yakuniy hisobot ===");
    console.table(summaryRes.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
