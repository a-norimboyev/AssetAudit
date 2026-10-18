import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { escapeCsvCell, sanitizeCsvValue, buildCsvRow } from "@/lib/utils/csv";

describe("AssetAudit — CSV Escaping & Formula Injection (CWE-1236) Protection", () => {
  it("1. RFC 4180: Qator ichidagi qo'shtirnoqlarni to'g'ri dublyaj qiladi", () => {
    const input = 'HP ProOne "24-inch" Monoblok';
    const escaped = escapeCsvCell(input);
    assert.equal(escaped, '"HP ProOne ""24-inch"" Monoblok"');
  });

  it("2. Vergul va yangi qatorlarni xavfsiz double-quote ichida saqlaydi", () => {
    const withComma = "Kompyuter, Stol va Stul";
    assert.equal(escapeCsvCell(withComma), '"Kompyuter, Stol va Stul"');

    const withNewline = "1-qator\n2-qator\r3-qator";
    assert.equal(escapeCsvCell(withNewline), '"1-qator\n2-qator\r3-qator"');
  });

  it("3. Formula Injection: = belgisi bilan boshlangan buyruqlarni zararsizlantiradi", () => {
    const dangerousPayload = "=cmd|' /C calc'!A0";
    const sanitized = sanitizeCsvValue(dangerousPayload);
    assert.ok(sanitized.startsWith("'="), "Formula prefiksi oldiga bittalik qo'shtirnoq qo'shilishi shart");

    const escaped = escapeCsvCell(dangerousPayload);
    assert.equal(escaped, "\"'=cmd|' /C calc'!A0\"");
  });

  it("4. Formula Injection: +, -, @, %, | prefikslari bilan boshlangan tahdidlarni to'xtatadi", () => {
    assert.ok(sanitizeCsvValue("+SUM(A1:A10)").startsWith("'+"));
    assert.ok(sanitizeCsvValue("-2+3+cmd|' /C calc'!A0").startsWith("'-"));
    assert.ok(sanitizeCsvValue("@org/admin").startsWith("'@"));
    assert.ok(sanitizeCsvValue("\t=1+1").startsWith("'\t"));
    assert.ok(sanitizeCsvValue("|calc.exe").startsWith("'|"));
    assert.ok(sanitizeCsvValue("%APPDATA%").startsWith("'%"));
  });

  it("5. Sof manfiy va musbat raqamlar noto'g'ri zararsizlantirilmasligi shart", () => {
    // Sof sonlar formula deb hisoblanmasligi kerak
    assert.equal(sanitizeCsvValue("-500"), "-500");
    assert.equal(sanitizeCsvValue("+25.50"), "+25.50");
    assert.equal(escapeCsvCell(-1200), "\"-1200\"");
    assert.equal(escapeCsvCell(4500000), "\"4500000\"");
  });

  it("6. Null va undefined qiymatlar bo'sh katak sifatida qaytadi", () => {
    assert.equal(escapeCsvCell(null), '""');
    assert.equal(escapeCsvCell(undefined), '""');
  });

  it("7. buildCsvRow: butun qatorni RFC 4180 formatida birlashtiradi", () => {
    const cells = [
      "INV-001",
      'Laptop "Lenovo", ThinkPad',
      "=1+1",
      1500000,
      null,
    ];
    const row = buildCsvRow(cells);
    assert.equal(
      row,
      '"INV-001","Laptop ""Lenovo"", ThinkPad","\'=1+1","1500000",""'
    );
  });
});

