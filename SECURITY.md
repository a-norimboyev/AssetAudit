# AssetAudit — Xavfsizlik Siyosati (Security Policy)

AssetAudit davlat muassasalari va universitetlar uchun mo‘ljallangan korporativ platforma bo‘lgani sababli, ma'lumotlar xavfsizligi va daxlsizligi eng yuqori ustuvorlikka ega.

---

## 🛡️ Asosiy Xavfsizlik Kafolatlari

1. **Multi-Tenant Izolyatsiyasi:**
   - Har bir ma'lumotlar bazasi so'rovi va server harakati faol sessiyadagi tashkilot ID si (`organizationId`) bilan qat'iy tekshiriladi.
   - Baza sxemasida 4-qatlamli kompozit cheklovlar (`fk_items_hierarchy_composite`) orqali begona tashkilot xonalariga ulanish DB yadrosida rad etiladi.

2. **Kriptografik Autentifikatsiya va Parollar:**
   - Parollar `scrypt` algoritmi (Better Auth Crypto) orqali xeshlanadi.
   - Ochiq ro'yxatdan o'tish (public signup) qat'iy o'chirilgan (`disableSignUp: true`).
   - Xodim hisobi bloklanganda (`isActive = false`) uning barcha faol sessiyalari darhol bekor qilinadi.

3. **Maxfiy Media va Fayllar:**
   - Serverdagi rasmlar katalogiga (`/uploads/`) bevosita internet orqali kirish taqiqlangan.
   - Fayllar faqat `/api/media/items/[id]/photo` orqali, ruxsati bor xodimlarga va `Content-Security-Policy: sandbox` sarlavhasi ostida uzatiladi.
   - `path.basename` filtri orqali Path Traversal (`../../`) hujumlari bartaraf etilgan.

4. **Public QR Maxfiyligi:**
   - QR kod orqali ommaviy ko'rish sahifasida (`/qr/[token]`) buxgalteriya narxi, xodim shaxsi yoki ichki audit qaydlari ommaga chiqarilmaydi.

5. **Kiritilgan Ma'lumotlar Sanitizatsiyasi:**
   - Excel / CSV import jarayonida Prototype Pollution va ReDoS xavflari fail-closed tekshiruvlar orqali bloklanadi.

---

## 🚨 Zaifliklar Haqida Xabar Berish

Agar AssetAudit tizimida xavfsizlik zaifligini aniqlasangiz, iltimos, uni **ommaviy GitHub Issues ro'yxatiga yozmang**.

Buning o'rniga:
1. Maxfiy hisobotni loyiha xavfsizlik ma'murlariga shaxsiy xabar orqali yoki [norimboyevazizjon29@gmail.com](mailto:norimboyevazizjon29@gmail.com) manziliga yuboring.
2. Xabarda zaiflik turi, qayta takrorlash (reproduction) qadamlari va potensial xavf darajasini ko'rsating.
3. Biz 24 soat ichida javob beramiz va muammoni zudlik bilan hal qilish chorasini ko'ramiz.

