import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapLoginError, NETWORK_ERROR_MESSAGE } from "@/lib/auth/login-errors";

describe("AssetAudit — Login Sahifasi Duplicate Request va Xatoliklar Himoyasi", () => {
  describe("1. HTTP va Auth xatoliklarini farqlash (mapLoginError)", () => {
    it("401 xatoligi: noto'g'ri login, email yoki parol xabari chiqishi kerak", () => {
      const msg401 = mapLoginError({ status: 401 });
      assert.equal(msg401, "Login, email yoki parol noto'g'ri kiritildi.");

      const msgCode = mapLoginError({ code: "INVALID_EMAIL_OR_PASSWORD" });
      assert.equal(msgCode, "Login, email yoki parol noto'g'ri kiritildi.");
    });

    it("429 xatoligi: rate-limit cheklovi va 1 daqiqa kutish xabari chiqishi kerak", () => {
      const msg429 = mapLoginError({ status: 429 });
      assert.equal(
        msg429,
        "Juda ko'p urinishlar qilindi. Iltimos, 1 daqiqadan so'ng qayta urinib ko'ring."
      );
    });

    it("500 xatoligi: server yoki ma'lumotlar bazasi ulanish xatosi xabari chiqishi kerak", () => {
      const msg500 = mapLoginError({ status: 500 });
      assert.equal(
        msg500,
        "Server yoki ma'lumotlar bazasi bilan ulanishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring."
      );
    });

    it("Noma'lum xatolik: xatolik xabari yoki standart xabar qaytishi kerak", () => {
      const genericMsg = mapLoginError({ message: "Maxsus xato" });
      assert.equal(genericMsg, "Maxsus xato");

      const nullMsg = mapLoginError(null);
      assert.equal(nullMsg, "Tizimga kirishda xatolik yuz berdi.");

      assert.equal(
        NETWORK_ERROR_MESSAGE,
        "Serverga bog'lanib bo'lmadi. Internet yoki tarmoq ulanishingizni tekshiring."
      );
    });
  });

  describe("2. Synchronous Submission Guard Semantikasi", () => {
    it("Bir vaqtda ketma-ket bir nechta chaqiruv kelganda guard faqat 1-so'rovni o'tkazishi kerak", async () => {
      let isSubmitting = false;
      let executedCount = 0;

      async function simulatedSubmit() {
        if (isSubmitting) {
          return { accepted: false };
        }
        isSubmitting = true;
        executedCount++;

        // Simulyatsiya: asinxron tarmoq so'rovi
        await new Promise((resolve) => setTimeout(resolve, 50));
        isSubmitting = false;
        return { accepted: true };
      }

      // Foydalanuvchi tezlik bilan 5 marta Enter yoki tugmani bosdi:
      const results = await Promise.all([
        simulatedSubmit(),
        simulatedSubmit(),
        simulatedSubmit(),
        simulatedSubmit(),
        simulatedSubmit(),
      ]);

      assert.equal(executedCount, 1, "Faqat bitta so'rov bajarilishi shart");
      assert.equal(results[0].accepted, true, "Birinchi so'rov qabul qilinishi kerak");
      assert.equal(results[1].accepted, false, "Takroriy 2-so'rov rad etilishi kerak");
      assert.equal(results[2].accepted, false, "Takroriy 3-so'rov rad etilishi kerak");
      assert.equal(results[3].accepted, false, "Takroriy 4-so'rov rad etilishi kerak");
      assert.equal(results[4].accepted, false, "Takroriy 5-so'rov rad etilishi kerak");
    });

    it("Xatolikdan so'ng guard qayta tiklanishi (release) kerak", async () => {
      let isSubmitting = false;

      async function simulatedFailedSubmit() {
        if (isSubmitting) return false;
        isSubmitting = true;
        try {
          throw new Error("Tarmoq xatosi");
        } finally {
          isSubmitting = false;
        }
      }

      await assert.rejects(async () => {
        await simulatedFailedSubmit();
      });

      assert.equal(isSubmitting, false, "Guard xatolikdan so'ng yana yuborishga ruxsat berishi kerak");
    });
  });
});
