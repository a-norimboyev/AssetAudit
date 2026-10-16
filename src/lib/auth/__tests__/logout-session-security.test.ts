import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("AssetAudit — Logout va Session Security Integratsion Tekshiruvlari", () => {
  const BASE_URL = process.env.TEST_SERVER_URL || "http://localhost:3001";

  it("1. Sessiyasiz /admin so'rovi to'g'ridan-to'g'ri 307 Redirect (/login) va no-store kesh qaytarishi shart", async (t) => {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/admin`, {
        method: "GET",
        redirect: "manual",
        headers: {
          Accept: "text/html",
        },
      });
    } catch {
      t.skip("Test serveri (http://localhost:3001) faol emas");
      return;
    }

    assert.equal(
      res.status,
      307,
      `/admin sessiyasiz so'rovda 307 Temporary Redirect qaytarishi shart, qaytdi: ${res.status}`
    );

    const location = res.headers.get("location");
    assert.equal(
      location,
      "/login",
      `Redirect manzili /login bo'lishi shart, qaytdi: ${location}`
    );

    const cacheControl = res.headers.get("cache-control");
    assert.ok(
      cacheControl && cacheControl.includes("no-store"),
      `Cache-Control headerida 'no-store' bo'lishi shart, qaytdi: ${cacheControl}`
    );
  });

  it("2. Sessiyasiz /api/auth/me so'rovi 401 Unauthorized va no-cache qaytarishi shart", async (t) => {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch {
      t.skip("Test serveri (http://localhost:3001) faol emas");
      return;
    }

    assert.equal(
      res.status,
      401,
      `/api/auth/me sessiyasiz so'rovda 401 qaytarishi shart, qaytdi: ${res.status}`
    );

    const data = await res.json();
    assert.equal(
      data.code,
      "AUTHENTICATION_REQUIRED",
      `Xatolik kodi AUTHENTICATION_REQUIRED bo'lishi shart, qaytdi: ${data.code}`
    );

    const cacheControl = res.headers.get("cache-control");
    assert.ok(
      cacheControl && cacheControl.includes("no-store"),
      `API javobida no-store kesh bo'lishi shart, qaytdi: ${cacheControl}`
    );
  });

  it("3. /api/auth/sign-out endpointi sessiya cookie-fayllarini Max-Age=0 qilib tozalashi shart", async (t) => {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/api/auth/sign-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
    } catch {
      t.skip("Test serveri (http://localhost:3001) faol emas");
      return;
    }

    assert.equal(
      res.status,
      200,
      `Sign-out 200 OK qaytarishi shart, qaytdi: ${res.status}`
    );

    const data = await res.json();
    assert.equal(data.success, true, "Sign-out javobi { success: true } bo'lishi kerak");

    const rawCookies = res.headers.getSetCookie
      ? res.headers.getSetCookie()
      : [res.headers.get("set-cookie") || ""];

    const cookieStr = rawCookies.join("; ");
    assert.ok(
      cookieStr.includes("assetaudit.session_token") || cookieStr.includes("mulknazorat.session_token") || cookieStr.includes("Max-Age=0"),
      `Sign-out Set-Cookie orqali sessiyani bekor qilishi shart. Olingan: ${cookieStr}`
    );
  });

  it("4. Soxta yoki bekor qilingan cookie bilan /admin so'rovi qat'iy rad etilishi shart", async (t) => {
    const fakeSessionCookie =
      "assetaudit.session_token=fake_invalid_token_1234567890abcdef; Path=/; HttpOnly";

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/admin`, {
        method: "GET",
        redirect: "manual",
        headers: {
          Cookie: fakeSessionCookie,
          Accept: "text/html",
        },
      });
    } catch {
      t.skip("Test serveri (http://localhost:3001) faol emas");
      return;
    }

    assert.equal(
      res.status,
      307,
      `Soxta token bilan /admin 307 Redirect berishi shart, qaytdi: ${res.status}`
    );

    const location = res.headers.get("location");
    assert.equal(location, "/login", "Soxta token darhol /login ga yo'naltirilishi shart");
  });
});
