# AssetAudit — Hissa Qo‘shish Qoidalari (Contributing Guidelines)

AssetAudit loyihasini rivojlantirishga hissa qo‘shish istagingiz uchun tashakkur! Ushbu hujjat kod sifati, xavfsizlik va professional Git workflow qoidalarini belgilaydi.

---

## 🌿 Git Tarmoqlanish (Branching) Strategiyasi

Loyiha **GitHub Flow** va **Conventional Commits** standartlariga amal qiladi:

- `main`: Asosiy barqaror (stable production-ready) tarmoq. To‘g‘ridan-to‘g‘ri commit yoki push qilish taqiqlanadi (Protected Branch).
- `feature/<nomi>`: Yangi funksiyalar uchun (masalan: `feature/bulk-export-pdf`).
- `fix/<nomi>`: Xatoliklarni tuzatish uchun (masalan: `fix/qr-render-padding`).
- `chore/<nomi>`: Bog'liqliklar va texnik xizmat uchun (masalan: `chore/update-drizzle`).

---

## 📝 Commit Xabarlari Standarti (Conventional Commits)

Commit xabarlari aniq, ixcham va standart formatda bo‘lishi lozim:

```text
<tur>(<soha>): <qisqa sarlavha>

[ixtiyoriy batafsil tavsif]
```

### Ruxsat etilgan turlar:
- `feat`: Yangi biznes funksional.
- `fix`: Xatolikni tuzatish.
- `docs`: Hujjatlarni yangilash.
- `test`: Yangi testlar qo‘shish yoki mavjudlarini to‘g‘rilash.
- `refactor`: Biznes mantiqni o‘zgartirmagan holda kodni optimallashtirish.
- `chore`: Konfiguratsiya va paketlarni yangilash.

*Misol:*
```text
feat(inventory): add batch soft-archive for written-off items
fix(auth): prevent session cache retention for deactivated staff
test(rbac): add cross-tenant composite FK violation verification
```

---

## 🔒 Xavfsizlik va Kod Standartlari

Har qanday Pull Request ochishdan oldin quyidagi talablar to‘liq bajarilgan bo‘lishi shart:

1. **Tiplar Tizimi:** `npx tsc --noEmit` nol xato bilan o‘tishi shart. `any` tipidan foydalanish taqiqlanadi.
2. **ESLint:** `npm run lint` 0 xato va 0 ogohlantirish qaytarishi kerak.
3. **Testlar:** Barcha unit va integratsion testlar (`npm test`) muvaffaqiyatli bajarilishi shart.
4. **Secret Scanning:** Commit ichida hech qanday maxfiy kalit, token, parol yoki server IP manzillari bo‘lmasligi lozim.
5. **Multi-Tenant Scoping:** Har bir ma'lumotlar bazasi so'rovi qat'iy ravishda `organizationId` bo'yicha cheklanishi lozim.

---

## 🚀 Pull Request (PR) Jarayoni

1. Yangi tarmoq oching: `git checkout -b feature/your-feature-name`
2. O‘zgarishlarni kiriting va testlarni tekshiring: `npm test && npm run lint`
3. O‘zgarishlarni commit qiling: `git commit -m "feat(scope): describe change"`
4. O‘z tarmog‘ingizni push qiling: `git push origin feature/your-feature-name`
5. GitHub'da `main` tarmog‘iga qaratilgan Pull Request oching.
6. CI/CD testlari (GitHub Actions) to‘liq yashil bo‘lishini kuting va kod ko‘rigi (Code Review) o‘tkazing.

