"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { importInventoryAction, type ImportResult } from "@/lib/actions/import";

export default function InventoryImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.match(/\.(xlsx|xls|csv)$/i)) {
      setErrorMsg("Faqat .xlsx, .xls yoki .csv formatidagi fayllar qabul qilinadi.");
      setFile(null);
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMsg("Fayl hajmi 5 MB dan oshmasligi kerak.");
      setFile(null);
      return;
    }

    setErrorMsg(null);
    setFile(selected);
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await importInventoryAction(formData);
      setResult(res);
      if (!res.success && res.errors.length === 0) {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Faylni yuklashda xatolik.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function downloadTemplate() {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      encodeURIComponent(
        "Inventar raqami,Nomi,Bino,Xona,Kategoriya,Holati (Sifat),Narxi,Tavsif\n" +
          "TATU-INV-001,Monoblok HP ProOne 440,BOSH,101,computer_equipment,good,8500000,O'quv xonasi kompyuteri\n" +
          "TATU-INV-002,Ofis stoli yog'och,BOSH,101,furniture,good,1200000,O'qituvchi stoli\n" +
          "TATU-INV-003,Konditsioner Artel 18,BOSH,102,appliances,new,6200000,Konditsioner invertor\n"
      );
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "assetaudit_shablon.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadErrorsCsv() {
    if (!result || result.errors.length === 0) return;

    let csv = "Qator,Inventar raqami,Nomi,Xatolik sababi\n";
    for (const err of result.errors) {
      csv += `${err.row},"${err.inventoryNumber || ""}",${err.name ? `"${err.name}"` : ""},"${err.reason}"\n`;
    }

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "import_xatolari.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Orqaga qaytish */}
      <div>
        <Link
          href="/org/inventory"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Inventarlar ro‘yxatiga qaytish</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Excel va CSV orqali Ommaviy Import
            </h1>
          </div>

          <button
            onClick={downloadTemplate}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Namuna shablonni yuklab olish</span>
          </button>
        </div>
      </div>

      {/* Yo'riqnoma */}
      <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 space-y-2.5 shadow-2xs">
        <div className="flex items-center gap-2 font-bold text-blue-950 text-sm">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Import qilish talablari va ustunlar:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-blue-800 text-xs leading-relaxed pl-1">
          <li><strong>Inventar raqami</strong> — unikal bo&apos;lishi shart (takroriylar o&apos;tkazib yuboriladi).</li>
          <li><strong>Nomi</strong> — buyumning to&apos;liq rasmiy nomi.</li>
          <li><strong>Bino</strong> — tizimdagi bino kodi (masalan: BOSH, A, 1) yoki bino nomi.</li>
          <li><strong>Xona</strong> — bino ichidagi xona raqami (masalan: 101, 204).</li>
          <li><strong>Kategoriya, Sifat va Narx</strong> — ixtiyoriy maydonlar.</li>
          <li><strong>Cheklovlar</strong> — fayl hajmi maksimum 5 MB, qatorlar soni maksimum 3000 ta.</li>
        </ul>
      </div>

      {/* Fayl Yuklash Formasi */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
        {errorMsg && (
          <div className="p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            file ? "border-blue-500 bg-blue-50/20" : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-2xs">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            {file ? (
              <div>
                <p className="text-base font-bold text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB — Boshqa fayl tanlash uchun bosing</p>
              </div>
            ) : (
              <div>
                <p className="text-sm sm:text-base font-semibold text-slate-800">
                  Excel (.xlsx, .xls) yoki CSV faylni shu yerga tortib keling yoki tanlang
                </p>
                <p className="text-xs text-slate-400 mt-1">Maksimal hajm: 5 MB gacha</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 font-medium">
            {file ? "Fayl tayyor, import qilish tugmasini bosing" : "Fayl tanlanmagan"}
          </span>

          <button
            type="submit"
            disabled={!file || isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Import qilinmoqda (Chunked)...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Inventarlarni import qilish</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Import Natijasi */}
      {result && (
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Import Natijalari Xulosasi</span>
            </h3>
            <span className="text-xs text-slate-500">
              Jami: <strong>{result.totalRows}</strong> ta qator
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
              <div className="text-3xl font-bold text-emerald-700">{result.importedCount}</div>
              <div className="text-xs font-semibold text-emerald-800 mt-1">Muvaffaqiyatli kiritildi</div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
              <div className="text-3xl font-bold text-slate-700">{result.skippedCount}</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">O&apos;tkazib yuborildi / Xato</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Xatolik tufayli kiritilmagan qatorlar ({result.errors.length} ta):</span>
                </span>
                <button
                  type="button"
                  onClick={downloadErrorsCsv}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xatolarni CSV formatda yuklab olish</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="px-3.5 py-2.5">Qator</th>
                      <th className="px-3.5 py-2.5">Inv №</th>
                      <th className="px-3.5 py-2.5">Nomi</th>
                      <th className="px-3.5 py-2.5">Sabab</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.errors.slice(0, 50).map((err, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3.5 py-2 font-mono text-slate-500">{err.row}</td>
                        <td className="px-3.5 py-2 font-mono font-medium text-slate-800">{err.inventoryNumber || "—"}</td>
                        <td className="px-3.5 py-2 text-slate-700 truncate max-w-xs">{err.name || "—"}</td>
                        <td className="px-3.5 py-2 text-rose-600">{err.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/org/inventory"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>Inventarlar ro&apos;yxatini ochish</span>
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
