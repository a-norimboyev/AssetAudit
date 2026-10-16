import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPublicQrUrl, generateSecureQrToken, generateQrDataUrl, generateQrSvg } from "@/lib/qr";

describe("AssetAudit — Production Public QR URL & Token Canonicalization", () => {
  it("1. getPublicQrUrl respects NEXT_PUBLIC_APP_URL and eliminates trailing slashes", () => {
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    try {
      process.env.NEXT_PUBLIC_APP_URL = "https://assetaudit.uz/";
      const token = "sample_test_token_12345";
      const url = getPublicQrUrl(token);

      assert.equal(url, "https://assetaudit.uz/qr/sample_test_token_12345");
      assert.ok(!url.includes("//qr"), "URL must not contain duplicate slashes");
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }
  });

  it("2. generateSecureQrToken produces 48 hex characters (high entropy)", () => {
    const token1 = generateSecureQrToken();
    const token2 = generateSecureQrToken();

    assert.equal(token1.length, 48, "Token must be 48 hex chars (24 bytes)");
    assert.match(token1, /^[a-f0-9]{48}$/, "Token must be hexadecimal");
    assert.notEqual(token1, token2, "Consecutive tokens must be cryptographically distinct");
  });

  it("3. generateQrDataUrl and generateQrSvg generate valid graphical outputs for production domain", async () => {
    const token = generateSecureQrToken();
    const dataUrl = await generateQrDataUrl(token);
    const svg = await generateQrSvg(token);

    assert.ok(dataUrl.startsWith("data:image/png;base64,"), "Data URL must be base64 PNG");
    assert.ok(svg.includes("<svg"), "SVG output must contain svg markup");
    assert.ok(svg.includes("</svg>"), "SVG output must be closed");
  });
});
