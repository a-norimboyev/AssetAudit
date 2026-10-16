import Link from "next/link";
import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { getInventoryCyclesList, getReconciliationReport } from "@/lib/data/audit";
import { ExportReportButtons } from "./export-report-buttons";
import {
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  DoorClosed,
  ChevronDown,
} from "lucide-react";

export const metadata = {
  title: "Rekonsilyatsiya Hisoboti — AssetAudit",
  description: "Inventarizatsiya yakunlari, nomuvofiqliklar va yo‘qolganlik hisoboti",
};

export const instant = false;

interface PageProps {
  searchParams: Promise<{
    cycleId?: string;
  }>;
}

export default async function OrgReportsPage({ searchParams }: PageProps) {
  const { organization } = await requireOrganizationAdmin();
  const params = await searchParams;

  const cycles = await getInventoryCyclesList(organization.id);
  const targetCycleId = params.cycleId || cycles[0]?.id;

  const report = targetCycleId
    ? await getReconciliationReport({ organizationId: organization.id, cycleId: targetCycleId })
    : null;

  return (
    <div className="space-y-6">
      {/* Sarlavha va Sikl Selektori */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Audit Rekonsilyatsiya Hisoboti
            </h1>
            <span className="px-2.5 py-0.5 rounded-[3px] text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Rasmiy xulosa
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {organization.name} — kutilgan va amaldagi mulklar taqqoslanishi
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {cycles.length > 0 && (
            <form method="GET" action="/org/reports" className="flex items-center gap-2 print:hidden">
              <div className="relative">
                <select
                  name="cycleId"
                  defaultValue={targetCycleId}
                  className="appearance-none pl-3.5 pr-8 py-2 text-xs sm:text-sm font-semibold bg-white border border-slate-200 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900 cursor-pointer shadow-xs"
                >
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="submit"
                className="px-3 py-2 rounded-[3px] bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Ko‘rish
              </button>
            </form>
          )}

          {report && <ExportReportButtons report={report} />}
        </div>
      </div>

      {!report ? (
        <div className="bg-white p-8 sm:p-12 rounded-[4px] border border-slate-200 text-center max-w-md mx-auto">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Hisobot mavjud emas</h3>
          <p className="mt-1 text-xs text-slate-500">
            Hisobotni shakllantirish uchun avval audit siklini yaratishingiz kerak.
          </p>
          <div className="mt-4">
            <Link
              href="/org/audits"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              Auditlar bo‘limiga o‘tish
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Xolislik Qoidasi Haqida Ogohlantirish */}
          <div className="p-4 rounded-[4px] bg-blue-50/70 border border-blue-200 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950 leading-relaxed">
              <strong>Xolis inventarizatsiya qoidasi:</strong>
              <p className="mt-0.5 text-blue-800">
                Hali tekshirilmagan xonalardagi buyumlar asossiz ravishda &ldquo;yo‘qolgan&rdquo; deb hisoblanmaydi. 
                Yo‘qolganlik xulosasi faqat tekshiruvchi tomonidan xona auditi rasman yakunlangandan (completed) keyin hosil qilinadi.
              </p>
            </div>
          </div>

          {/* Rekonsilyatsiya Ko'rsatkichlari */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            <div className="p-4 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Jami kutilgan</span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {report.totalExpectedItems} <span className="text-xs font-normal text-slate-500">ta</span>
              </div>
            </div>

            <div className="p-4 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Skanerlangan</span>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
                {report.totalScannedItems} <span className="text-xs font-normal text-slate-500">ta</span>
              </div>
            </div>

            <div className="p-4 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">O‘z joyida</span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
                {report.matchedItemsCount} <span className="text-xs font-normal text-slate-500">ta</span>
              </div>
            </div>

            <div className="p-4 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Konfliktlar</span>
              <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
                {report.conflictItemsCount} <span className="text-xs font-normal text-slate-500">ta</span>
              </div>
            </div>

            <div className="p-4 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Yo‘qolgan (Yetishmaydi)</span>
              <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-1">
                {report.missingItemsCount} <span className="text-xs font-normal text-slate-500">ta</span>
              </div>
            </div>
          </div>

          {/* Joylashuv Konfliktlari Ro'yxati */}
          <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Joylashuv Konfliktlari Jurnali ({report.conflicts.length} ta)
                </h3>
              </div>
              <span className="text-xs text-slate-500">Boshqa xonada topilgan inventarlar</span>
            </div>

            {report.conflicts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Ajoyib! Ushbu siklda joylashuv bo‘yicha konfliktlar aniqlanmadi.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    <tr>
                      <th scope="col" className="px-4 py-3 sm:px-6">Inventar</th>
                      <th scope="col" className="px-4 py-3 sm:px-6">Rasmiy kutilgan joylashuv</th>
                      <th scope="col" className="px-4 py-3 sm:px-6">Amalda topilgan joy</th>
                      <th scope="col" className="px-4 py-3 sm:px-6">Skanerlagan tekshiruvchi</th>
                      <th scope="col" className="px-4 py-3 sm:px-6">Vaqti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 font-normal">
                    {report.conflicts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 sm:px-6">
                          <div className="font-semibold text-slate-900">{c.itemName}</div>
                          <div className="text-[11px] font-mono text-blue-600 font-bold">
                            {c.inventoryNumber}
                          </div>
                        </td>

                        <td className="px-4 py-3 sm:px-6">
                          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                            <DoorClosed className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.expectedRoomNumber}-xona</span>
                            <span className="text-slate-400 text-[11px]">({c.expectedBuildingName})</span>
                          </span>
                        </td>

                        <td className="px-4 py-3 sm:px-6">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[3px] border border-amber-200">
                            <DoorClosed className="w-3.5 h-3.5 text-amber-600" />
                            <span>{c.scannedRoomNumber}-xona</span>
                            <span className="font-normal text-[10px]">({c.scannedBuildingName})</span>
                          </span>
                        </td>

                        <td className="px-4 py-3 sm:px-6 text-slate-600 text-xs">
                          {c.scannerName || "Inspektor"}
                        </td>

                        <td className="px-4 py-3 sm:px-6 text-slate-500 text-xs">
                          {new Date(c.scannedAt).toLocaleDateString("uz-UZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
