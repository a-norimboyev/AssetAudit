/**
 * AssetAudit (MulkNazorat) — Superadmin Vazirlik & Platforma Boshqaruvi
 * 250 ta OTM uchun to'liq boyitilgan Mock Data (Frontend prototipi)
 */

export interface UniversityItem {
  id: string;
  name: string;
  shortName: string;
  code: string;
  region: string;
  type: "Davlat OTM" | "Xususiy OTM" | "Xorijiy filial";
  adminName: string;
  adminPhone: string;
  adminLogin: string;
  assetsCount: number;
  totalValueUzs: number; // so'mda
  assetsValueMlrd: number; // Mavjud aktivlar balansi: 100 - 500 mlrd
  assetLimitMlrd: number; // Berilgan limit: masalan 500 mlrd
  auditProgress: number; // To'lganlik foizi: (assetsValueMlrd / assetLimitMlrd) * 100
  status: "active" | "frozen";
  licenseStartsAt: string;
  licenseExpiresAt: string;
  buildingsCount: number;
  roomsCount: number;
  logoUrl?: string;
}

export const UZBEKISTAN_REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Samarqand viloyati",
  "Farg'ona viloyati",
  "Andijon viloyati",
  "Namangan viloyati",
  "Buxoro viloyati",
  "Xorazm viloyati",
  "Qashqadaryo viloyati",
  "Surxondaryo viloyati",
  "Jizzax viloyati",
  "Sirdaryo viloyati",
  "Navoiy viloyati",
  "Qoraqalpog'iston Resp.",
] as const;

export type UzbekistanRegion = (typeof UZBEKISTAN_REGIONS)[number];

const REAL_UNIVERSITIES_SEED: Array<{
  name: string;
  short: string;
  code: string;
  region: UzbekistanRegion;
  type: "Davlat OTM" | "Xususiy OTM" | "Xorijiy filial";
}> = [
  // 1-50: Davlat Universitetlari va Akademiyalari
  { name: "O'zbekiston Milliy Universiteti", short: "O'zMU", code: "NUU", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Toshkent Axborot Texnologiyalari Universiteti", short: "TATU", code: "TATU", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Toshkent Davlat Texnika Universiteti", short: "TDTU", code: "TDTU", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Samarqand Davlat Universiteti", short: "SamDU", code: "SAMDU", region: "Samarqand viloyati", type: "Davlat OTM" },
  { name: "Toshkent Davlat Iqtisodiyot Universiteti", short: "TDIU", code: "TSUE", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Farg'ona Davlat Universiteti", short: "FarDU", code: "FARDU", region: "Farg'ona viloyati", type: "Davlat OTM" },
  { name: "Andijon Davlat Universiteti", short: "ADU", code: "ANDU", region: "Andijon viloyati", type: "Davlat OTM" },
  { name: "Namangan Davlat Universiteti", short: "NamDU", code: "NAMDU", region: "Namangan viloyati", type: "Davlat OTM" },
  { name: "Buxoro Davlat Universiteti", short: "BuxDU", code: "BUXDU", region: "Buxoro viloyati", type: "Davlat OTM" },
  { name: "Urganch Davlat Universiteti", short: "UrDU", code: "URDU", region: "Xorazm viloyati", type: "Davlat OTM" },
  { name: "Qarshi Davlat Universiteti", short: "QarDU", code: "QARDU", region: "Qashqadaryo viloyati", type: "Davlat OTM" },
  { name: "Termiz Davlat Universiteti", short: "TerDU", code: "TERDU", region: "Surxondaryo viloyati", type: "Davlat OTM" },
  { name: "Qoraqalpoq Davlat Universiteti", short: "QDU", code: "KSU", region: "Qoraqalpog'iston Resp.", type: "Davlat OTM" },
  { name: "Toshkent Tibbiyot Akademiyasi", short: "TMA", code: "TMA", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Jahon Iqtisodiyoti va Diplomatiya Universiteti", short: "JIDU", code: "UWED", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "O'zbekiston Davlat Jahon Tillari Universiteti", short: "O'zDJTU", code: "UZSWLU", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Yangi O'zbekiston Universiteti", short: "YOU", code: "NEWUZ", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Toshkent Davlat Yuridik Universiteti", short: "TDYU", code: "TSUL", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Toshkent Davlat Pedagogika Universiteti", short: "TDPU", code: "TSPU", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Jizzax Politexnika Instituti", short: "JizPI", code: "JIZPI", region: "Jizzax viloyati", type: "Davlat OTM" },
  { name: "Guliston Davlat Universiteti", short: "GulDU", code: "GULDU", region: "Sirdaryo viloyati", type: "Davlat OTM" },
  { name: "Navoiy Davlat Konchilik va Texnologiyalar Universiteti", short: "NDKTU", code: "NMDTI", region: "Navoiy viloyati", type: "Davlat OTM" },
  { name: "Chirchiq Davlat Pedagogika Universiteti", short: "ChDPU", code: "CSPI", region: "Toshkent viloyati", type: "Davlat OTM" },
  { name: "Samarqand Davlat Tibbiyot Universiteti", short: "SamDTU", code: "SAMDTI", region: "Samarqand viloyati", type: "Davlat OTM" },
  { name: "Buxoro Davlat Tibbiyot Instituti", short: "BuxDTI", code: "BUXDTI", region: "Buxoro viloyati", type: "Davlat OTM" },
  { name: "Andijon Davlat Tibbiyot Instituti", short: "ADTI", code: "ANDTI", region: "Andijon viloyati", type: "Davlat OTM" },
  { name: "Farg'ona Jamoat Salomatligi Tibbiyot Instituti", short: "FJSTI", code: "FJSTI", region: "Farg'ona viloyati", type: "Davlat OTM" },
  { name: "Toshkent Davlat Stomatologiya Instituti", short: "TDSI", code: "TDSI", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Toshkent Farmatsevtika Instituti", short: "ToshFARMI", code: "TPHARM", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Samarqand Davlat Chet Tillar Instituti", short: "SamDChTI", code: "SAMSIFL", region: "Samarqand viloyati", type: "Davlat OTM" },
  { name: "Toshkent Davlat Sharqshunoslik Universiteti", short: "TDSHU", code: "TSUOS", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Samarqand Iqtisodiyot va Servis Instituti", short: "SamISI", code: "SIES", region: "Samarqand viloyati", type: "Davlat OTM" },
  { name: "Toshkent Moliya Instituti", short: "TMI", code: "TFI", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Toshkent Kimyo-Texnologiya Instituti", short: "TKTI", code: "TKTI", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Toshkent To'qimachilik va Yengil Sanoat Instituti", short: "TTESI", code: "TITLI", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Toshkent Arxitektura-Qurilish Universiteti", short: "TAQU", code: "TACI", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Samarqand Davlat Arxitektura-Qurilish Universiteti", short: "SamDAQU", code: "SAMACI", region: "Samarqand viloyati", type: "Davlat OTM" },
  { name: "Toshkent Davlat Transport Universiteti", short: "TDTU Trans", code: "TSTU", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Farg'ona Politexnika Instituti", short: "FarPI", code: "FERPI", region: "Farg'ona viloyati", type: "Davlat OTM" },
  { name: "Namangan Muhandislik-Qurilish Instituti", short: "NamMQI", code: "NAMIEC", region: "Namangan viloyati", type: "Davlat OTM" },
  { name: "Namangan Muhandislik-Texnologiya Instituti", short: "NamMTI", code: "NAMETI", region: "Namangan viloyati", type: "Davlat OTM" },
  { name: "Qarshi Muhandislik-Iqtisodiyot Instituti", short: "QMII", code: "KIEE", region: "Qashqadaryo viloyati", type: "Davlat OTM" },
  { name: "Toshkent Davlat Agrar Universiteti", short: "TDAU", code: "TSAU", region: "Toshkent viloyati", type: "Davlat OTM" },
  { name: "Andijon Qishloq Xo'jaligi va Agrotexnologiyalar Instituti", short: "AQXAI", code: "AAI", region: "Andijon viloyati", type: "Davlat OTM" },
  { name: "Samarqand Davlat Veterinariya Meditsinasi Universiteti", short: "SamDVM", code: "SAMVET", region: "Samarqand viloyati", type: "Davlat OTM" },
  { name: "TIIAME Milliy Tadqiqot Universiteti", short: "TIIAME", code: "NRU_TIIAME", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "O'zbekiston Davlat Konservatoriyasi", short: "O'zDK", code: "STATCONS", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "O'zbekiston Davlat San'at va Madaniyat Instituti", short: "O'zDSMI", code: "UZDSMI", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Kamoliddin Behzod nomidagi Milliy Rassomlik va Dizayn Instituti", short: "MRDI", code: "MRDI", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "O'zbekiston Milliy Musiqa San'ati Instituti", short: "O'zMMSI", code: "MMSI", region: "Toshkent shahri", type: "Davlat OTM" },

  // 51-100: Mintaqaviy Institutlar va Davlat Filiallari
  { name: "O'zbekiston Davlat Xoreografiya Akademiyasi", short: "O'zDXA", code: "CHOREO", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "O'zbekiston Davlat Jismoniy Tarbiya va Sport Universiteti", short: "O'zDJTSU", code: "UZSPORTS", region: "Toshkent viloyati", type: "Davlat OTM" },
  { name: "Navoiy Davlat Pedagogika Instituti", short: "NDPI", code: "NDPI", region: "Navoiy viloyati", type: "Davlat OTM" },
  { name: "Jizzax Davlat Pedagogika Universiteti", short: "JDPU", code: "JDPU", region: "Jizzax viloyati", type: "Davlat OTM" },
  { name: "Qo'qon Davlat Pedagogika Instituti", short: "QDPI", code: "KSPU", region: "Farg'ona viloyati", type: "Davlat OTM" },
  { name: "Nukus Davlat Pedagogika Instituti", short: "NukDPI", code: "NDPI_KSU", region: "Qoraqalpog'iston Resp.", type: "Davlat OTM" },
  { name: "Shahrisabz Davlat Pedagogika Instituti", short: "ShDPI", code: "SHDPI", region: "Qashqadaryo viloyati", type: "Davlat OTM" },
  { name: "Denov Tadbirkorlik va Pedagogika Instituti", short: "DTPI", code: "DTPI", region: "Surxondaryo viloyati", type: "Davlat OTM" },
  { name: "Ipak Yo'li Turizm va Madaniy Meros Xalqaro Universiteti", short: "IpakYo'li", code: "SILKWAY", region: "Samarqand viloyati", type: "Davlat OTM" },
  { name: "Bank-Moliya Akademiyasi", short: "BMA", code: "BFA", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Davlat Boshqaruvi Akademiyasi", short: "DBA", code: "APA", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Jamoat Xavfsizligi Universiteti", short: "JXU", code: "JXU", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Bojxona Instituti", short: "BojInst", code: "CUSTOMS", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Huquqni Muhofaza Qilish Akademiyasi", short: "HMQA", code: "LEA", region: "Toshkent shahri", type: "Davlat OTM" },
  { name: "Buxoro Muhandislik-Texnologiya Instituti", short: "BuxMTI", code: "BUXMTI", region: "Buxoro viloyati", type: "Davlat OTM" },
  { name: "Termiz Muhandislik-Texnologiya Instituti", short: "TerMTI", code: "TMTI", region: "Surxondaryo viloyati", type: "Davlat OTM" },
  { name: "Termiz Agrotexnologiyalar va Innovatsion Rivojlanish Instituti", short: "TerAIRI", code: "TAIRI", region: "Surxondaryo viloyati", type: "Davlat OTM" },
  { name: "Koson Muhandislik-Iqtisodiyot Instituti", short: "KMII", code: "KMII", region: "Qashqadaryo viloyati", type: "Davlat OTM" },
  { name: "Zarafshon Davlat Texnika Instituti", short: "ZDTI", code: "ZDTI", region: "Navoiy viloyati", type: "Davlat OTM" },
  { name: "Olmaliq Davlat Texnika Universiteti", short: "ODTU", code: "ODTU", region: "Toshkent viloyati", type: "Davlat OTM" },
  { name: "TATU Samarqand filiali", short: "TATU SF", code: "TATU_SF", region: "Samarqand viloyati", type: "Davlat OTM" },
  { name: "TATU Farg'ona filiali", short: "TATU FF", code: "TATU_FF", region: "Farg'ona viloyati", type: "Davlat OTM" },
  { name: "TATU Qarshi filiali", short: "TATU QF", code: "TATU_QF", region: "Qashqadaryo viloyati", type: "Davlat OTM" },
  { name: "TATU Urganch filiali", short: "TATU UF", code: "TATU_UF", region: "Xorazm viloyati", type: "Davlat OTM" },
  { name: "TATU Nukus filiali", short: "TATU NF", code: "TATU_NF", region: "Qoraqalpog'iston Resp.", type: "Davlat OTM" },
  { name: "TATU Nurafshon filiali", short: "TATU NurF", code: "TATU_NURF", region: "Toshkent viloyati", type: "Davlat OTM" },
  { name: "O'zMU Jizzax filiali", short: "O'zMU JF", code: "NUU_JF", region: "Jizzax viloyati", type: "Davlat OTM" },
  { name: "SamDU Urgut filiali", short: "SamDU UF", code: "SAMDU_UF", region: "Samarqand viloyati", type: "Davlat OTM" },
  { name: "SamDU Kattaqo'rg'on filiali", short: "SamDU KF", code: "SAMDU_KF", region: "Samarqand viloyati", type: "Davlat OTM" },
  { name: "SamDU O'zbekiston-Finlyandiya Pedagogika Instituti", short: "SamDU OFPI", code: "FIN_INST", region: "Samarqand viloyati", type: "Davlat OTM" },
  { name: "TerDU Pedagogika Instituti", short: "TerDU PI", code: "TERDU_PI", region: "Surxondaryo viloyati", type: "Davlat OTM" },
  { name: "TDAU Samarqand filiali", short: "TDAU SF", code: "TSAU_SF", region: "Samarqand viloyati", type: "Davlat OTM" },
  { name: "TDAU Nukus filiali", short: "TDAU NF", code: "TSAU_NF", region: "Qoraqalpog'iston Resp.", type: "Davlat OTM" },
  { name: "TDAU Termiz filiali", short: "TDAU TF", code: "TSAU_TF", region: "Surxondaryo viloyati", type: "Davlat OTM" },
  { name: "TDTU Olmaliq filiali", short: "TDTU OF", code: "TSTU_OF", region: "Toshkent viloyati", type: "Davlat OTM" },
  { name: "TDTU Qo'qon filiali", short: "TDTU QF", code: "TSTU_QF", region: "Farg'ona viloyati", type: "Davlat OTM" },
  { name: "TKTI Yangiyer filiali", short: "TKTI YF", code: "TKTI_YF", region: "Sirdaryo viloyati", type: "Davlat OTM" },
  { name: "TKTI Shahrisabz filiali", short: "TKTI SF", code: "TKTI_SF", region: "Qashqadaryo viloyati", type: "Davlat OTM" },
  { name: "TIIAME Buxoro Tabiiy Resurslarni Boshqarish Instituti", short: "TIIAME BF", code: "TIIAME_BF", region: "Buxoro viloyati", type: "Davlat OTM" },
  { name: "TIIAME Qarshi Irrigatsiya va Agrotexnologiyalar Instituti", short: "TIIAME QF", code: "TIIAME_QF", region: "Qashqadaryo viloyati", type: "Davlat OTM" },
  { name: "TMA Farg'ona filiali", short: "TMA FF", code: "TMA_FF", region: "Farg'ona viloyati", type: "Davlat OTM" },
  { name: "TMA Urganch filiali", short: "TMA UF", code: "TMA_UF", region: "Xorazm viloyati", type: "Davlat OTM" },
  { name: "TMA Termiz filiali", short: "TMA TF", code: "TMA_TF", region: "Surxondaryo viloyati", type: "Davlat OTM" },
  { name: "O'zDSMI Farg'ona mintaqaviy filiali", short: "O'zDSMI FF", code: "UZDSMI_FF", region: "Farg'ona viloyati", type: "Davlat OTM" },
  { name: "SamDVM Toshkent filiali", short: "SamDVM TF", code: "SAMVET_TF", region: "Toshkent viloyati", type: "Davlat OTM" },
  { name: "SamDVM Nukus filiali", short: "SamDVM NF", code: "SAMVET_NF", region: "Qoraqalpog'iston Resp.", type: "Davlat OTM" },
  { name: "O'zDJTSU Farg'ona filiali", short: "O'zDJTSU FF", code: "UZSPORTS_FF", region: "Farg'ona viloyati", type: "Davlat OTM" },
  { name: "O'zDJTSU Samarqand filiali", short: "O'zDJTSU SF", code: "UZSPORTS_SF", region: "Samarqand viloyati", type: "Davlat OTM" },
  { name: "TDPU Shahrisabz filiali", short: "TDPU SF", code: "TSPU_SF", region: "Qashqadaryo viloyati", type: "Davlat OTM" },
  { name: "FarDU Qo'qon filiali", short: "FarDU QF", code: "FARDU_QF", region: "Farg'ona viloyati", type: "Davlat OTM" },

  // 101-140: Xorijiy OTMlar va Ularning Filiallari
  { name: "Vestminster Xalqaro Universiteti", short: "WIUT", code: "WIUT", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Toshkentdagi Inha Universiteti", short: "IUT", code: "INHA", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Toshkent Singapur Menejmentni Rivojlantirish Instituti", short: "MDIST", code: "MDIST", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Toshkentdagi Turin Politexnika Universiteti", short: "TTPU", code: "TURIN", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Toshkentdagi Puchon Universiteti", short: "BUT", code: "PUCHON", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Toshkentdagi Amiti Universiteti", short: "AMITY", code: "AMITY", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Webster Universiteti Toshkent", short: "WUT", code: "WEBSTER", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Webster Universiteti Samarqand filiali", short: "WUT Sam", code: "WEBSTER_SAM", region: "Samarqand viloyati", type: "Xorijiy filial" },
  { name: "Webster Universiteti Buxoro filiali", short: "WUT Bux", code: "WEBSTER_BUX", region: "Buxoro viloyati", type: "Xorijiy filial" },
  { name: "Central Asian University", short: "CAU", code: "CAU_UZ", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "British Management University", short: "BMU", code: "BMU_UZ", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Turkiya Iqtisodiyot va Texnologiya Universiteti", short: "TOBB ETU", code: "TOBB", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Rossiya Davlat Neft va Gaz Universiteti Toshkent filiali", short: "Gubkin", code: "GUBKIN", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "M.V. Lomonosov nomidagi MDU Toshkent filiali", short: "MDU", code: "MSU_TASH", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "G.V. Plexanov nomidagi RITU Toshkent filiali", short: "RITU", code: "REU_TASH", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "D.I. Mendeleyev nomidagi RKTU Toshkent filiali", short: "RKTU", code: "MUCTR", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "MIFI Milliy Tadqiqot Yadro Universiteti Toshkent filiali", short: "MIFI", code: "MEPHI", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "MGIMO Toshkent filiali", short: "MGIMO", code: "MGIMO_UZ", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "MISIS Texnologik Universiteti Olmaliq filiali", short: "MISIS", code: "MISIS_OLM", region: "Toshkent viloyati", type: "Xorijiy filial" },
  { name: "Sankt-Peterburg Davlat Universiteti Toshkent filiali", short: "SPbDU", code: "SPBSU", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Gertsena nomidagi Pedagogika Universiteti Toshkent filiali", short: "RGPU", code: "HERZEN", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Qozon Federal Universiteti Jizzax filiali", short: "QFU", code: "KFU_JIZ", region: "Jizzax viloyati", type: "Xorijiy filial" },
  { name: "ISMA Axborot Tizimlari Menejmenti Universiteti Farg'ona filiali", short: "ISMA", code: "ISMA_FER", region: "Farg'ona viloyati", type: "Xorijiy filial" },
  { name: "Toshkent Xalqaro Ta'lim Universiteti", short: "TIUE", code: "TIUE", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Sharda Universiteti O'zbekiston", short: "Sharda", code: "SHARDA", region: "Andijon viloyati", type: "Xorijiy filial" },
  { name: "Sambhram Universiteti Jizzax", short: "Sambhram", code: "SAMBHRAM", region: "Jizzax viloyati", type: "Xorijiy filial" },
  { name: "Silk Road Xalqaro Akademiyasi", short: "SRIA", code: "SRIA", region: "Samarqand viloyati", type: "Xorijiy filial" },
  { name: "Cambridge Markaziy Osiyo Universiteti", short: "CCAU", code: "CCAU", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Seul Milliy Universiteti Samarqand markazi", short: "SNU", code: "SNU_SAM", region: "Samarqand viloyati", type: "Xorijiy filial" },
  { name: "Belorussiya-O'zbekiston Qo'shma Instituti", short: "BUJI", code: "BUJI", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Yaponiya Raqamli Universiteti", short: "JDU", code: "JDU", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Janubiy Koreya Xalqaro Universiteti Farg'ona", short: "KIUF", code: "KIUF", region: "Farg'ona viloyati", type: "Xorijiy filial" },
  { name: "Coventry Universiteti Toshkent filiali", short: "CUT", code: "COVENTRY", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Toshkentdagi London Iqtisodiyot Maktabi Markazi", short: "LSE", code: "LSE_TASH", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Shimoliy Kipr Sharqiy O'rtayer Universiteti filiali", short: "EMU Kipr", code: "EMU_CYPRUS", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Pekin Xorijiy Tillar Universiteti Toshkent filiali", short: "BFSU", code: "BFSU_TASH", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Shanxay Xalqaro Tadqiqotlar Universiteti filiali", short: "SISU", code: "SISU_UZ", region: "Samarqand viloyati", type: "Xorijiy filial" },
  { name: "Seul Politexnika Instituti Toshkent filiali", short: "SPI", code: "SPI_TASH", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Hindiston Amrita Universiteti Toshkent filiali", short: "Amrita", code: "AMRITA", region: "Toshkent shahri", type: "Xorijiy filial" },
  { name: "Koreya Ilm va Texnologiya Instituti filiali", short: "KAIST", code: "KAIST_UZ", region: "Toshkent shahri", type: "Xorijiy filial" },

  // 141-250: Xususiy va Nodavlat OTMlar hamda Hududiy Institutlar
  { name: "Toshkent Kimyo Xalqaro Universiteti", short: "KIUT", code: "KIUT", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Toshkent Kimyo Xalqaro Universiteti Samarqand filiali", short: "KIUT Sam", code: "KIUT_SAM", region: "Samarqand viloyati", type: "Xususiy OTM" },
  { name: "Toshkent Kimyo Xalqaro Universiteti Namangan filiali", short: "KIUT Nam", code: "KIUT_NAM", region: "Namangan viloyati", type: "Xususiy OTM" },
  { name: "TEAM Universiteti", short: "TEAM", code: "TEAM", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Alfraganus Universiteti", short: "AFU", code: "ALFRAG", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "STARS International University", short: "STARS", code: "STARS_UZ", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "EMU Universiteti", short: "EMU", code: "EMU_UNIV", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "IT Park University", short: "ITPU", code: "ITPU", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "PDP University", short: "PDPU", code: "PDP_UNIV", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Renaissance Universiteti", short: "RU", code: "REN_UNIV", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Profi Universiteti", short: "Profi", code: "PROFI", region: "Toshkent viloyati", type: "Xususiy OTM" },
  { name: "Profi Universiteti Samarqand filiali", short: "Profi Sam", code: "PROFI_SAM", region: "Samarqand viloyati", type: "Xususiy OTM" },
  { name: "Profi Universiteti Farg'ona filiali", short: "Profi Far", code: "PROFI_FAR", region: "Farg'ona viloyati", type: "Xususiy OTM" },
  { name: "Orient Universiteti", short: "Orient", code: "ORIENT", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Nordic International University", short: "NIU", code: "NORDIC", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Diplomat Universiteti", short: "DU", code: "DIPLOMAT", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "TMC Instituti", short: "TMC", code: "TMC_INST", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "IMPULS Tibbiyot Instituti", short: "Impuls", code: "IMPULS", region: "Namangan viloyati", type: "Xususiy OTM" },
  { name: "Turon Universiteti", short: "Turon", code: "TURON", region: "Qashqadaryo viloyati", type: "Xususiy OTM" },
  { name: "Asia Xalqaro Universiteti", short: "AIU", code: "ASIA_INT", region: "Buxoro viloyati", type: "Xususiy OTM" },
  { name: "Ma'mun Universiteti", short: "MU", code: "MAMUN", region: "Xorazm viloyati", type: "Xususiy OTM" },
  { name: "Hayot Universiteti", short: "HU", code: "HAYOT", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Al-Xorazmiy Universiteti", short: "AKHU", code: "AL_KHOR", region: "Xorazm viloyati", type: "Xususiy OTM" },
  { name: "Leaders Universiteti", short: "LU", code: "LEADERS", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Cambridge International University", short: "CIU", code: "CIU_UZ", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Perfect University", short: "PU", code: "PERFECT", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Anor Universiteti", short: "AU", code: "ANOR_U", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Millat Umidi Universiteti", short: "MUU", code: "MILLAT", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Innovatsion Rivojlanish Universiteti", short: "IRU", code: "INNOV_U", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Smart Universiteti", short: "Smart", code: "SMART_U", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Yangi Asr Universiteti", short: "YAU", code: "YANGI_ASR", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Ziyo Universiteti", short: "ZU", code: "ZIYO_U", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Farabi Universiteti", short: "Farabi", code: "FARABI_U", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Evroosiyo Xalqaro Universiteti", short: "EXU", code: "EUROASIA", region: "Samarqand viloyati", type: "Xususiy OTM" },
  { name: "Oazis Universiteti", short: "Oazis", code: "OASIS_U", region: "Navoiy viloyati", type: "Xususiy OTM" },
  { name: "Buxoro Innovatsiyalar Universiteti", short: "BIU", code: "BUX_INNOV", region: "Buxoro viloyati", type: "Xususiy OTM" },
  { name: "Samarqand Xalqaro Texnologiya Universiteti", short: "SIUT", code: "SIUT", region: "Samarqand viloyati", type: "Xususiy OTM" },
  { name: "Farg'ona Xalqaro Universiteti", short: "FXU", code: "FER_INT", region: "Farg'ona viloyati", type: "Xususiy OTM" },
  { name: "Andijon Xalqaro Universiteti", short: "AXU", code: "AND_INT", region: "Andijon viloyati", type: "Xususiy OTM" },
  { name: "Namangan Xalqaro Universiteti", short: "NXU", code: "NAM_INT", region: "Namangan viloyati", type: "Xususiy OTM" },
  { name: "Xorazm Ma'mun Akademiyasi Universiteti", short: "XMAU", code: "XMA_U", region: "Xorazm viloyati", type: "Xususiy OTM" },
  { name: "Toshkent Gumanitar Fanlar Universiteti", short: "TGFU", code: "TASH_HUM", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Fan va Texnologiyalar Universiteti", short: "FTU", code: "SCITECH", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Toshkent Ijtimoiy-Iqtisodiy Universiteti", short: "TIIU", code: "SOC_ECON", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Toshkent Menejment va Iqtisodiyot Instituti", short: "TMII", code: "TMII_UZ", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Toshkent Biznes va Fan Universiteti", short: "TBFU", code: "TASH_BUS", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Global Universiteti", short: "GU", code: "GLOBAL_U", region: "Toshkent shahri", type: "Xususiy OTM" },
  { name: "Qarshi Xalqaro Universiteti", short: "QXU", code: "QAR_INT", region: "Qashqadaryo viloyati", type: "Xususiy OTM" },
  { name: "Termiz Xalqaro Universiteti", short: "TXU", code: "TER_INT", region: "Surxondaryo viloyati", type: "Xususiy OTM" },
  { name: "Navoiy Innovatsiyalar Universiteti", short: "NIU", code: "NAV_INNOV", region: "Navoiy viloyati", type: "Xususiy OTM" },
  { name: "Jizzax Xalqaro Universiteti", short: "JXU", code: "JIZ_INT", region: "Jizzax viloyati", type: "Xususiy OTM" },
  { name: "Guliston Xalqaro Instituti", short: "GXI", code: "GUL_INT", region: "Sirdaryo viloyati", type: "Xususiy OTM" },
  { name: "Chirchiq Innovatsiya Instituti", short: "ChII", code: "CHIR_INNOV", region: "Toshkent viloyati", type: "Xususiy OTM" },
  { name: "Angren Universiteti", short: "AngrenU", code: "ANGREN_U", region: "Toshkent viloyati", type: "Xususiy OTM" },
  { name: "Qo'qon Universiteti", short: "QU", code: "QOQON_U", region: "Farg'ona viloyati", type: "Xususiy OTM" },
  { name: "Marg'ilon Texnologiya Instituti", short: "MTI", code: "MARG_TECH", region: "Farg'ona viloyati", type: "Xususiy OTM" },
  { name: "Rishton San'at va Hunarmandchilik Instituti", short: "RSHI", code: "RISHTON_CRAFT", region: "Farg'ona viloyati", type: "Xususiy OTM" },
  { name: "Chust Muhandislik Instituti", short: "ChMI", code: "CHUST_ENG", region: "Namangan viloyati", type: "Xususiy OTM" },
  { name: "Asaka Avtomobilsozlik Instituti", short: "AAI", code: "ASAKA_AUTO", region: "Andijon viloyati", type: "Xususiy OTM" },
  { name: "Shahrixon Agrosanoat Instituti", short: "SHAI", code: "SHAHRIXON", region: "Andijon viloyati", type: "Xususiy OTM" },
  { name: "Shahrisabz Turizm Instituti", short: "ShTI", code: "SHAH_TOUR", region: "Qashqadaryo viloyati", type: "Xususiy OTM" },
  { name: "Kitob Geologiya va Konchilik Instituti", short: "KGKI", code: "KITOB_GEO", region: "Qashqadaryo viloyati", type: "Xususiy OTM" },
  { name: "Dehqonobod Kimyo Instituti", short: "DKI", code: "DEHQONOBOD", region: "Qashqadaryo viloyati", type: "Xususiy OTM" },
  { name: "Boysun Etnomadaniyat Instituti", short: "BEI", code: "BOYSUN_ETNO", region: "Surxondaryo viloyati", type: "Xususiy OTM" },
  { name: "Sho'rchi Agrobiznes Instituti", short: "SHAgro", code: "SHORCHI_AGRO", region: "Surxondaryo viloyati", type: "Xususiy OTM" },
  { name: "Paxtakor Agrotexnologiya Instituti", short: "PAI", code: "PAXTAKOR", region: "Jizzax viloyati", type: "Xususiy OTM" },
  { name: "Zomin Ekologiya va Turizm Instituti", short: "ZETI", code: "ZOMIN_ECO", region: "Jizzax viloyati", type: "Xususiy OTM" },
  { name: "Sirdaryo Muhandislik Instituti", short: "SMI", code: "SIRDARYO_ENG", region: "Sirdaryo viloyati", type: "Xususiy OTM" },
  { name: "Yangiyer Texnologiya Instituti", short: "YTI", code: "YANGIYER_TECH", region: "Sirdaryo viloyati", type: "Xususiy OTM" },
  { name: "Zarafshon Muhandislik Instituti", short: "ZMI", code: "ZARAF_ENG", region: "Navoiy viloyati", type: "Xususiy OTM" },
  { name: "Karmana Tarix va Madaniyat Instituti", short: "KTMI", code: "KARMANA", region: "Navoiy viloyati", type: "Xususiy OTM" },
  { name: "Xiva Xalqaro Turizm Instituti", short: "XXTI", code: "XIVA_TOUR", region: "Xorazm viloyati", type: "Xususiy OTM" },
  { name: "Gurlan Agrotexnologiyalar Instituti", short: "GAI", code: "GURLAN_AGRO", region: "Xorazm viloyati", type: "Xususiy OTM" },
  { name: "Xonqa Gidromelioratsiya Instituti", short: "XGI", code: "XONQA_HYDRO", region: "Xorazm viloyati", type: "Xususiy OTM" },
  { name: "Mo'ynoq Ekologiya Instituti", short: "MEI", code: "MOYNOQ_ECO", region: "Qoraqalpog'iston Resp.", type: "Xususiy OTM" },
  { name: "Qo'ng'irot Sanoat Instituti", short: "QSI", code: "QONGIROT_IND", region: "Qoraqalpog'iston Resp.", type: "Xususiy OTM" },
  { name: "Beruniy Davlat Instituti", short: "BDI", code: "BERUNIY_INST", region: "Qoraqalpog'iston Resp.", type: "Xususiy OTM" },
  { name: "To'rtko'l Agrosanoat Instituti", short: "TAI", code: "TORTKOL_AGRO", region: "Qoraqalpog'iston Resp.", type: "Xususiy OTM" },
  { name: "Chimboy Qishloq Xo'jaligi Instituti", short: "CQXI", code: "CHIMBOY_AGRI", region: "Qoraqalpog'iston Resp.", type: "Xususiy OTM" },
  { name: "Taxtako'pir Chorvachilik Instituti", short: "TCI", code: "TAXTAKOPIR", region: "Qoraqalpog'iston Resp.", type: "Xususiy OTM" },
  { name: "Qonliko'l Amaliy Fanlar Instituti", short: "QAFI", code: "QONLIKOL", region: "Qoraqalpog'iston Resp.", type: "Xususiy OTM" },
  { name: "Shumanay Ijtimoiy Instituti", short: "SII", code: "SHUMANAY", region: "Qoraqalpog'iston Resp.", type: "Xususiy OTM" },
  { name: "Bo'ston Agrobiznes Instituti", short: "BAI", code: "BOSTON_AGRO", region: "Qoraqalpog'iston Resp.", type: "Xususiy OTM" },
  { name: "Amudaryo Muhandislik Instituti", short: "AMI", code: "AMUDARYO_ENG", region: "Qoraqalpog'iston Resp.", type: "Xususiy OTM" },
  { name: "Nukus Innovatsiyalar Universiteti", short: "NIU", code: "NUKUS_INNOV", region: "Qoraqalpog'iston Resp.", type: "Xususiy OTM" },
  { name: "Urganch Innovatsion Texnologiyalar Universiteti", short: "UITU", code: "URGENCH_TECH", region: "Xorazm viloyati", type: "Xususiy OTM" },
  { name: "Buxoro Xalqaro Universiteti", short: "BXU", code: "BUX_INT_U", region: "Buxoro viloyati", type: "Xususiy OTM" },
  { name: "G'ijduvon Hunarmandchilik Instituti", short: "GHI", code: "GIJDUVON", region: "Buxoro viloyati", type: "Xususiy OTM" },
  { name: "Vobkent To'qimachilik Instituti", short: "VTI", code: "VOBKENT", region: "Buxoro viloyati", type: "Xususiy OTM" },
  { name: "Samarqand Iqtisodiyot Universiteti", short: "SIU", code: "SAM_ECON", region: "Samarqand viloyati", type: "Xususiy OTM" },
  { name: "Samarqand Agrobiotexnologiyalar Instituti", short: "SABI", code: "SAM_AGROBIO", region: "Samarqand viloyati", type: "Xususiy OTM" },
  { name: "Samarqand Muhandislik-Texnologiya Universiteti", short: "SMTU", code: "SAM_ENG_TECH", region: "Samarqand viloyati", type: "Xususiy OTM" },
  { name: "Ishtixon Pedagogika Instituti", short: "IPI", code: "ISHTIXON_PED", region: "Samarqand viloyati", type: "Xususiy OTM" },
  { name: "Payariq Qishloq Xo'jaligi Instituti", short: "PQXI", code: "PAYARIQ", region: "Samarqand viloyati", type: "Xususiy OTM" },
  { name: "Narpay Agrosanoat Instituti", short: "NAI", code: "NARPAY_AGRO", region: "Samarqand viloyati", type: "Xususiy OTM" },
  { name: "Kattaqo'rg'on Muhandislik Instituti", short: "KMI", code: "KATTAQ_ENG", region: "Samarqand viloyati", type: "Xususiy OTM" },
  { name: "Toyloq Agrobiznes Instituti", short: "ToyloqAI", code: "TOYLOQ", region: "Samarqand viloyati", type: "Xususiy OTM" },
  { name: "Farg'ona Axborot Texnologiyalari Instituti", short: "FATI", code: "FER_IT_INST", region: "Farg'ona viloyati", type: "Xususiy OTM" },
  { name: "Farg'ona Menejment Instituti", short: "FMI", code: "FER_MGMT", region: "Farg'ona viloyati", type: "Xususiy OTM" },
  { name: "Quva Bog'dorchilik Instituti", short: "QBI", code: "QUVA_HORTI", region: "Farg'ona viloyati", type: "Xususiy OTM" },
  { name: "Oltiariq Uzumchilik Instituti", short: "OUI", code: "OLTIARIQ", region: "Farg'ona viloyati", type: "Xususiy OTM" },
  { name: "Bag'dod Qishloq Xo'jaligi Instituti", short: "BQXI", code: "BAGDOD", region: "Farg'ona viloyati", type: "Xususiy OTM" },
  { name: "Beshariq Agrotexnologiyalar Instituti", short: "BeshAgro", code: "BESHARIQ", region: "Farg'ona viloyati", type: "Xususiy OTM" },
  { name: "Uchko'prik To'qimachilik Instituti", short: "UTI", code: "UCHKOPRIK", region: "Farg'ona viloyati", type: "Xususiy OTM" },
  { name: "Andijon Muhandislik-Iqtisodiyot Universiteti", short: "AMIU", code: "AND_ENG_ECON", region: "Andijon viloyati", type: "Xususiy OTM" },
  { name: "Andijon Axborot Texnologiyalari Instituti", short: "AATI", code: "AND_IT_INST", region: "Andijon viloyati", type: "Xususiy OTM" },
  { name: "Xo'jaobod Agrosanoat Instituti", short: "XAI", code: "XOJAOBOD", region: "Andijon viloyati", type: "Xususiy OTM" },
  { name: "Marhamat Ipakchilik Instituti", short: "MII", code: "MARHAMAT_SILK", region: "Andijon viloyati", type: "Xususiy OTM" },
  { name: "Bo'z To'qimachilik Instituti", short: "BTI", code: "BOZ_TEXTILE", region: "Andijon viloyati", type: "Xususiy OTM" },
  { name: "Izboskan Agrotexnologiyalar Instituti", short: "IAI", code: "IZBOSKAN", region: "Andijon viloyati", type: "Xususiy OTM" },
  { name: "Namangan To'qimachilik va Dizayn Instituti", short: "NTDI", code: "NAM_DESIGN", region: "Namangan viloyati", type: "Xususiy OTM" },
  { name: "Namangan Axborot Texnologiyalari Universiteti", short: "NATU", code: "NAM_IT_UNIV", region: "Namangan viloyati", type: "Xususiy OTM" },
  { name: "Kosonsoy Hunarmandchilik Instituti", short: "KHI", code: "KOSONSOY_CRAFT", region: "Namangan viloyati", type: "Xususiy OTM" },
  { name: "Chortoq Salomatlik Instituti", short: "CSI", code: "CHORTOQ_HEALTH", region: "Namangan viloyati", type: "Xususiy OTM" },
  { name: "Uchqo'rg'on Gidroenergetika Instituti", short: "UGI", code: "UCHQORGON_HYDRO", region: "Namangan viloyati", type: "Xususiy OTM" },
  { name: "Qarshi Axborot Texnologiyalari Instituti", short: "QATI", code: "QAR_IT_INST", region: "Qashqadaryo viloyati", type: "Xususiy OTM" },
  { name: "Qarshi Iqtisodiyot va Pedagogika Universiteti", short: "QIPU", code: "QAR_ECON_PED", region: "Qashqadaryo viloyati", type: "Xususiy OTM" },
  { name: "Nishon Neft-Gaz Instituti", short: "NNGI", code: "NISHON_GAS", region: "Qashqadaryo viloyati", type: "Xususiy OTM" },
  { name: "Kasbi Agrotexnologiyalar Instituti", short: "KAI", code: "KASBI_AGRO", region: "Qashqadaryo viloyati", type: "Xususiy OTM" },
  { name: "Mirishkor Paxtachilik Instituti", short: "MPI", code: "MIRISHKOR", region: "Qashqadaryo viloyati", type: "Xususiy OTM" },
  { name: "Termiz Axborot Texnologiyalari Instituti", short: "TATI", code: "TER_IT_INST", region: "Surxondaryo viloyati", type: "Xususiy OTM" },
  { name: "Termiz Agrobiznes va Innovatsiyalar Universiteti", short: "TAIU", code: "TER_AGROBIZ", region: "Surxondaryo viloyati", type: "Xususiy OTM" },
  { name: "Angor Qishloq Xo'jaligi Instituti", short: "AQXI", code: "ANGOR_AGRI", region: "Surxondaryo viloyati", type: "Xususiy OTM" },
  { name: "Jarqo'rg'on Qurilish Materiallari Instituti", short: "JQMI", code: "JARQORGON", region: "Surxondaryo viloyati", type: "Xususiy OTM" },
  { name: "Sariosiyo Tog' Melioratsiyasi Instituti", short: "STMI", code: "SARIOSIYO", region: "Surxondaryo viloyati", type: "Xususiy OTM" },
];

const ADMIN_NAMES_SEED = [
  "Abdullayev Jamshid Rustamovich",
  "Karimov Sherzod Alisherovich",
  "Xolmatov Bekzod Ikromovich",
  "Raximov Anvar Baxtiyorovich",
  "Tursunov Jasur Farxodovich",
  "Yo'ldoshev Otabek Shavkatovich",
  "Qodirov Aziz Ulug'bekovich",
  "Mirzayev Sardor Mansurovich",
  "Ergashev Ulug'bek Dilshodovich",
  "Sobirov Farruh Nodirovich",
  "Nazarov Elyor Zokirovich",
  "G'aniyev Doniyor Ravshanovich",
  "Usmonov Bobur Bahromovich",
  "Mamatqulov Sanjar Shuxratovich",
];

// 250 ta OTMni to'liq generatsiya qilish (korpus yoki sun'iy qo'shimchalarsiz)
function generate250Universities(): UniversityItem[] {
  const result: UniversityItem[] = [];

  for (let i = 0; i < 250; i++) {
    const seed = REAL_UNIVERSITIES_SEED[i] || REAL_UNIVERSITIES_SEED[i % REAL_UNIVERSITIES_SEED.length];
    const region = seed.region;
    const name = seed.name;
    const shortName = seed.short;
    const code = seed.code;

    // 100 milliarddan 500 milliardgacha real taqsimot
    const predefinedMlrd = [480, 360, 420, 270, 310, 220, 195, 180, 210, 175, 190, 165, 240, 380, 290];
    const assetsValueMlrd = i < predefinedMlrd.length 
      ? predefinedMlrd[i] 
      : 100 + ((i * 23) % 390); // 100 dan 490 mlrd gacha
    const totalValueUzs = assetsValueMlrd * 1000000000;
    const assetsCount = Math.floor(3200 + ((i * 179) % 18500));

    // Standart berilgan limit 500 mlrd
    const assetLimitMlrd = 500;
    // To'lganlik foizi: berilgan limitning qancha qismi to'lgani (assetsValueMlrd / assetLimitMlrd * 100)
    const progress = Math.min(100, Math.round((assetsValueMlrd / assetLimitMlrd) * 100));
    
    // Status: 95% faol, 5% muzlatilgan
    const isFrozen = i % 19 === 0;

    const adminName = ADMIN_NAMES_SEED[i % ADMIN_NAMES_SEED.length];
    const phoneSuffix = String(1000 + (i * 37) % 8999);
    const adminPhone = `+998 90 ${phoneSuffix.slice(0, 3)} ${phoneSuffix.slice(3)}0`;
    const adminLogin = `${code.toLowerCase()}.admin`;

    let licenseExpiresAt: string;
    if (isFrozen) {
      licenseExpiresAt = "2026-09-30";
    } else {
      const variant = i % 8;
      if (variant === 0) {
        licenseExpiresAt = "2026-11-18";
      } else if (variant === 1) {
        licenseExpiresAt = "2026-12-25";
      } else if (variant === 2 || variant === 3) {
        licenseExpiresAt = "2027-01-01";
      } else if (variant === 4) {
        licenseExpiresAt = "2027-05-15";
      } else if (variant === 5) {
        licenseExpiresAt = "2027-09-30";
      } else if (variant === 6) {
        licenseExpiresAt = "2028-01-01";
      } else {
        licenseExpiresAt = "2028-06-15";
      }
    }

    result.push({
      id: `otm-${i + 1}`,
      name,
      shortName,
      code,
      region,
      type: seed.type,
      adminName,
      adminPhone,
      adminLogin,
      assetsCount,
      totalValueUzs,
      assetsValueMlrd,
      assetLimitMlrd,
      auditProgress: progress,
      status: isFrozen ? "frozen" : "active",
      licenseStartsAt: "2026-01-01",
      licenseExpiresAt,
      buildingsCount: Math.floor(2 + (i % 8)),
      roomsCount: Math.floor(40 + (i * 7) % 240),
    });
  }

  return result;
}

export const MOCK_UNIVERSITIES: UniversityItem[] = generate250Universities();

export interface LicenseRemainingInfo {
  text: string;
  isExpired: boolean;
  isUrgent: boolean;
}

export function formatLicenseRemainingTime(expiresAt: string): LicenseRemainingInfo {
  const [y, m, d] = expiresAt.split("-").map(Number);
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const curD = now.getDate();

  const targetDate = new Date(y, m - 1, d);
  const curDate = new Date(curY, curM - 1, curD);
  const diffDays = Math.round((targetDate.getTime() - curDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      text: `${Math.abs(diffDays)} kun oldin tugagan`,
      isExpired: true,
      isUrgent: true,
    };
  }
  if (diffDays === 0) {
    return {
      text: "Bugun tugaydi",
      isExpired: false,
      isUrgent: true,
    };
  }

  let years = y - curY;
  let months = m - curM;
  let days = d - curD;

  if (days < 0) {
    months -= 1;
    const prevMonthDays = new Date(y, m - 1, 0).getDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yil`);
  if (months > 0) parts.push(`${months} oy`);
  if (days > 0) parts.push(`${days} kun`);

  return {
    text: parts.length > 0 ? `${parts.join(" ")} qoldi` : `${diffDays} kun qoldi`,
    isExpired: false,
    isUrgent: diffDays <= 30,
  };
}

// Respublika Global KPI ko'rsatkichlari
export const MOCK_REPUBLIC_KPI = {
  totalUniversities: 250,
  activeUniversities: MOCK_UNIVERSITIES.filter((u) => u.status === "active").length,
  frozenUniversities: MOCK_UNIVERSITIES.filter((u) => u.status === "frozen").length,
  totalAssetsCount: MOCK_UNIVERSITIES.reduce((acc, u) => acc + u.assetsCount, 0),
  totalValueUzs: MOCK_UNIVERSITIES.reduce((acc, u) => acc + u.totalValueUzs, 0),
  overallAuditProgressPercent: Math.round(
    MOCK_UNIVERSITIES.reduce((acc, u) => acc + u.auditProgress, 0) / MOCK_UNIVERSITIES.length
  ),
  activeAuditSeason: {
    title: "2026-yilgi Davlat Yalpi Xatlovi (Kuzgi Mavsum)",
    orderNumber: "Vazirlik 412-sonli Hay'at Qarori",
    startDate: "2026-09-01",
    endDate: "2026-11-30",
    daysRemaining: 31,
  },
};

// 14 ta viloyat bo'yicha tahliliy taqsimot
export interface RegionStat {
  region: string;
  otmCount: number;
  assetsCount: number;
  totalValueUzs: number;
  avgProgress: number;
}

export const MOCK_REGIONAL_STATS: RegionStat[] = UZBEKISTAN_REGIONS.map((region) => {
  const filtered = MOCK_UNIVERSITIES.filter((u) => u.region === region);
  const otmCount = filtered.length;
  const assetsCount = filtered.reduce((acc, u) => acc + u.assetsCount, 0);
  const totalValueUzs = filtered.reduce((acc, u) => acc + u.totalValueUzs, 0);
  const avgProgress = otmCount > 0 ? Math.round(filtered.reduce((acc, u) => acc + u.auditProgress, 0) / otmCount) : 0;

  return {
    region,
    otmCount,
    assetsCount,
    totalValueUzs,
    avgProgress,
  };
}).sort((a, b) => b.assetsCount - a.assetsCount);

// Xatlov oylik dinamikasi (2026-yil)
export const MOCK_MONTHLY_DYNAMICS = [
  { month: "May", percent: 18, scannedCount: 320000 },
  { month: "Iyun", percent: 34, scannedCount: 610000 },
  { month: "Iyul", percent: 48, scannedCount: 880000 },
  { month: "Avgust", percent: 62, scannedCount: 1140000 },
  { month: "Sentabr", percent: 74, scannedCount: 1390000 },
  { month: "Oktabr - Joriy", percent: MOCK_REPUBLIC_KPI.overallAuditProgressPercent, scannedCount: 1540000 },
];

// O'zgarmas Tizim Xavfsizlik Jurnali (Audit Trail Mock)
export interface MockAuditTrailLog {
  id: string;
  event: string;
  title: string;
  actor: string;
  targetOrg: string;
  timestamp: string;
  level: "info" | "warning" | "success" | "danger";
}

export const MOCK_AUDIT_TRAIL_LOGS: MockAuditTrailLog[] = [
  {
    id: "log-1",
    event: "AUDIT_CYCLE_COMPLETED",
    title: "Yalpi xatlov 100 foiz muvaffaqiyatli yakunlandi",
    actor: "Toshkent Axborot Texnologiyalari Universiteti TATU",
    targetOrg: "TATU Bosh korpus",
    timestamp: "Bugun, 11:42",
    level: "success",
  },
  {
    id: "log-2",
    event: "NEW_ORGANIZATION_ENROLLED",
    title: "Yangi OTM litsenziya bilan platformaga ulandi",
    actor: "Superadmin - Vazirlik Boshqaruvchisi",
    targetOrg: "Yangi O'zbekiston Universiteti",
    timestamp: "Bugun, 09:15",
    level: "info",
  },
  {
    id: "log-3",
    event: "ADMIN_PASSWORD_RESET",
    title: "Universitet administratori paroli xavfsiz yangilandi",
    actor: "Superadmin",
    targetOrg: "Samarqand Davlat Universiteti SamDU",
    timestamp: "Kecha, 18:30",
    level: "warning",
  },
  {
    id: "log-4",
    event: "LICENSE_AUTO_FROZEN",
    title: "Shartnoma muddati tugaganligi sababli kirish vaqtincha to'xtatildi",
    actor: "Tizim - Avtomatik Nazorat",
    targetOrg: "Jizzax Politexnika Instituti filiali",
    timestamp: "28-Oktabr, 00:01",
    level: "danger",
  },
  {
    id: "log-5",
    event: "MASS_EXPORT_GENERATED",
    title: "Respublika OTMlari umumiy balansi Excel shaklida eksport qilindi",
    actor: "Vazirlik Nazorat Departamenti",
    targetOrg: "Respublika 250 ta OTM",
    timestamp: "27-Oktabr, 16:45",
    level: "info",
  },
  {
    id: "log-6",
    event: "NATIONAL_AUDIT_SEASON_UPDATED",
    title: "2026-yilgi Yalpi Xatlov muddati e'lon qilindi",
    actor: "Superadmin - Vazirlik",
    targetOrg: "Barcha OTMlar",
    timestamp: "25-Oktabr, 10:00",
    level: "info",
  },
];
