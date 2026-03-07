import { Flame, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StockPredictionItem } from "@/app/(backoffice)/admin/reports/page";

interface StockPredictionProps {
  predictions: StockPredictionItem[];
}

const TREND_CONFIG = {
  up: { icon: TrendingUp, label: "Naik", color: "text-emerald-600" },
  down: { icon: TrendingDown, label: "Turun", color: "text-red-500" },
  stable: { icon: Minus, label: "Stabil", color: "text-muted-foreground" },
} as const;

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px]" aria-hidden>
      {data.map((v, i) => (
        <div
          key={i}
          className={`w-[6px] rounded-full transition-all ${
            i === data.length - 1
              ? "bg-gradient-to-t from-indigo-500 to-violet-400"
              : "bg-indigo-200"
          }`}
          style={{ height: `${Math.max((v / max) * 28, 3)}px` }}
        />
      ))}
    </div>
  );
}

export function StockPrediction({ predictions }: StockPredictionProps) {
  const top3 = predictions.slice(0, 3);
  const hotItems = predictions.filter((p) => p.alert === "hot");
  const restockItems = predictions.filter((p) => p.alert === "restock");

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white">
          <span className="text-sm">🔮</span>
        </div>
        <h3 className="text-sm font-bold text-foreground">Prediksi Stok</h3>
        <span className="text-xs text-muted-foreground">
          Berdasarkan data 7 hari terakhir
        </span>
      </div>

      {/* Alert Badges */}
      {(hotItems.length > 0 || restockItems.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {hotItems.map((item) => (
            <div
              key={item.menuId}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"
            >
              <Flame className="size-3.5" />
              <span>{item.menuName}</span>
              <span className="rounded-full bg-orange-200 px-1.5 py-0.5 text-[10px] text-orange-800">
                🔥 Stok Tinggi
              </span>
            </div>
          ))}
          {restockItems.map((item) => (
            <div
              key={item.menuId}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"
            >
              <AlertTriangle className="size-3.5" />
              <span>{item.menuName}</span>
              <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] text-amber-800">
                ⚠️ Perlu Restock
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Top 3 Best Sellers */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {top3.map((item, idx) => {
          const TrendIcon = TREND_CONFIG[item.trend].icon;
          const medals = ["🥇", "🥈", "🥉"];
          return (
            <div
              key={item.menuId}
              className="group relative overflow-hidden rounded-2xl border border-border/30 bg-white/80 p-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="absolute -right-3 -top-3 text-[48px] opacity-[0.07]">
                {medals[idx]}
              </div>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{medals[idx]}</span>
                    <p className="text-sm font-bold text-foreground leading-tight">
                      {item.menuName}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Rata-rata{" "}
                    <span className="font-semibold text-foreground">
                      {item.avgDaily}
                    </span>{" "}
                    porsi/hari
                  </p>
                </div>
                <MiniSparkline data={item.last7Days} />
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <TrendIcon className={`size-3.5 ${TREND_CONFIG[item.trend].color}`} />
                <span
                  className={`text-xs font-medium ${TREND_CONFIG[item.trend].color}`}
                >
                  {TREND_CONFIG[item.trend].label}
                </span>
                {item.alert === "hot" && (
                  <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600 border border-orange-200">
                    🔥 Stok Tinggi
                  </span>
                )}
                {item.alert === "restock" && (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-600 border border-amber-200">
                    ⚠️ Restock
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Menu Table */}
      {predictions.length > 3 && (
        <div className="overflow-x-auto rounded-2xl border border-border/30 bg-white/80 backdrop-blur-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                  Menu
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                  Rata-rata/hari
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                  7 Hari
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                  Tren
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {predictions.slice(3).map((item) => {
                const TrendIcon = TREND_CONFIG[item.trend].icon;
                return (
                  <tr
                    key={item.menuId}
                    className="border-b border-border/20 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-2.5 font-semibold text-foreground">
                      {item.menuName}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600 border border-indigo-200">
                        {item.avgDaily}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-center">
                        <MiniSparkline data={item.last7Days} />
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <TrendIcon
                          className={`size-3.5 ${TREND_CONFIG[item.trend].color}`}
                        />
                        <span
                          className={`text-xs font-medium ${TREND_CONFIG[item.trend].color}`}
                        >
                          {TREND_CONFIG[item.trend].label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {item.alert === "hot" && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600 border border-orange-200">
                          🔥 Stok Tinggi
                        </span>
                      )}
                      {item.alert === "restock" && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-600 border border-amber-200">
                          ⚠️ Restock
                        </span>
                      )}
                      {!item.alert && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
