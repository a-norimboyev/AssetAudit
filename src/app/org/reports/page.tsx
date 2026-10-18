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
  SearchX,
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Audit Rekonsilyatsiya Hisoboti
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {cycles.length > 0 && (
            <form method="GET" action="/org/reports" className="flex items-center gap-2 print:hidden">
              <div className="relative">
                <select
                  name="cycleId"
                  defaultValue={targetCycleId}
                  className="appearance-none pl-3.5 pr-8 py-2 text-xs sm:text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 cursor-pointer shadow-2xs"
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
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                Ko‘rish
              </button>
            </form>
          )}

          {report && <ExportReportButtons report={report} />}
        </div>
      </div>

      {!report ? (
        <div className="bg-white p-10 sm:p-16 rounded-2xl border border-slate-200/80 shadow-2xs text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Hisobot mavjud emas</h3>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Hisobotni shakllantirish uchun avval audit siklini yaratishingiz kerak.
          </p>
          <div className="mt-6">
            <Link
              href="/org/audits"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all"
            >
              Auditlar bo‘limiga o‘tish
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Xolislik Qoidasi Haqida Ogohlantirish */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3.5 shadow-2xs">
            <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950 leading-relaxed">
              <strong className="text-sm">Xolis inventarizatsiya qoidasi:</strong>
              <p className="mt-1 text-blue-800">
                Hali tekshirilmagan xonalardagi buyumlar asossiz ravishda &ldquo;yo‘qolgan&rdquo; deb hisoblanmaydi. 
                Yo‘qolganlik xulosasi faqat tekshiruvchi tomonidan xona auditi rasman yakunlangandan (completed) keyin hosil qilinadi.
              </p>
            </div>
          </div>

          {/* Rekonsilyatsiya Ko'rsatkichlari */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-xs text-slate-400 font-semibold">Jami kutilgan</span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight">
                {report.totalExpectedItems} <span className="text-xs font-normal text-slate-400">ta</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-xs text-slate-400 font-semibold">Skanerlangan</span>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2 tracking-tight">
                {report.totalScannedItems} <span className="text-xs font-normal text-slate-400">ta</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-xs text-slate-400 font-semibold">O‘z joyida</span>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2 tracking-tight">
                {report.matchedItemsCount} <span className="text-xs font-normal text-slate-400">ta</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-xs text-slate-400 font-semibold">Konfliktlar</span>
              <div className="text-2xl sm:text-3xl font-bold text-amber-600 mt-2 tracking-tight">
                {report.conflictItemsCount} <span className="text-xs font-normal text-slate-400">ta</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-xs text-slate-400 font-semibold">Yo‘qolgan (Yetishmaydi)</span>
              <div className="text-2xl sm:text-3xl font-bold text-rose-600 mt-2 tracking-tight">
                {report.missingItemsCount} <span className="text-xs font-normal text-slate-400">ta</span>
              </div>
            </div>
          </div>

          {/* Joylashuv Konfliktlari Ro'yxati */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-4">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Joylashuv Konfliktlari Jurnali ({report.conflicts.length} ta)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Boshqa xonada topilgan inventarlar</span>
            </div>

            {report.conflicts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Ajoyib! Ushbu siklda joylashuv bo‘yicha konfliktlar aniqlanmadi.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    <tr>
                      <th scope="col" className="px-5 py-3.5">Inventar</th>
                      <th scope="col" className="px-5 py-3.5">Rasmiy kutilgan joylashuv</th>
                      <th scope="col" className="px-5 py-3.5">Amalda topilgan joy</th>
                      <th scope="col" className="px-5 py-3.5">Skanerlagan tekshiruvchi</th>
                      <th scope="col" className="px-5 py-3.5">Vaqti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {report.conflicts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{c.itemName}</div>
                          <div className="text-[11px] font-mono text-blue-700 font-bold">
                            {c.inventoryNumber}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                            <DoorClosed className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.expectedRoomNumber}-xona</span>
                            <span className="text-slate-400 text-xs">({c.expectedBuildingName})</span>
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <DoorClosed className="w-3.5 h-3.5 text-amber-600" />
                            <span>{c.scannedRoomNumber}-xona</span>
                            <span className="font-normal text-[11px]">({c.scannedBuildingName})</span>
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-slate-600 text-xs">
                          {c.scannerName || "Inspektor"}
                        </td>

                        <td className="px-5 py-3.5 text-slate-500 text-xs">
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

          {/* Topilmagan (Yetishmayotgan) Mulklar Ro'yxati */}
          {report.missingItems.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-4">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <SearchX className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Tekshirilgan Xonalarda Topilmagan Mulklar ({report.missingItems.length} ta)
                  </h3>
                </div>
                <span className="text-xs text-rose-600 font-semibold">Yetishmovchilik ro‘yxati</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    <tr>
                      <th scope="col" className="px-5 py-3.5">Inventar</th>
                      <th scope="col" className="px-5 py-3.5">Kutilgan joylashuv</th>
                      <th scope="col" className="px-5 py-3.5">Holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {report.missingItems.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{m.name}</div>
                          <div className="text-[11px] font-mono text-rose-600 font-bold">
                            {m.inventoryNumber}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                            <DoorClosed className="w-3.5 h-3.5 text-slate-400" />
                            <span>{m.roomNumber}-xona</span>
                            <span className="text-slate-400 text-xs">({m.buildingName})</span>
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                            <span>Topilmadi (Xona auditi yakunlangan)</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
