"use client";

import { useEffect, useState, useTransition } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatUsd, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const tickDateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

type Timeframe = "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL";
const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "24H", label: "24H" },
  { value: "7D", label: "7D" },
  { value: "30D", label: "30D" },
  { value: "90D", label: "90D" },
  { value: "1Y", label: "1Y" },
  { value: "ALL", label: "Since inception" },
];

interface Point {
  timestamp: string;
  valueUsd: number;
}

export function PerformanceChart({ initialData }: { initialData: Point[] }) {
  const [timeframe, setTimeframe] = useState<Timeframe>("30D");
  const [data, setData] = useState<Point[]>(initialData);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (timeframe === "30D") return;
    let cancelled = false;
    startTransition(() => {
      fetch(`/api/portfolio?timeframe=${timeframe}`)
        .then((res) => res.json())
        .then((json) => {
          if (!cancelled) setData(json.performance ?? []);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">Portfolio performance</h2>
        <div role="group" aria-label="Select timeframe" className="flex gap-1 rounded-lg border border-border p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              type="button"
              aria-pressed={timeframe === tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                timeframe === tf.value ? "bg-brand text-white" : "text-muted hover:bg-surface"
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("mt-4 h-64 transition-opacity", isPending && "opacity-60")} aria-live="polite">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No portfolio history yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(v) => tickDateFormatter.format(new Date(v))}
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={(v) => formatUsd(v, { maximumFractionDigits: 0 })}
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip
                formatter={(value: number) => formatUsd(value)}
                labelFormatter={(label) => formatDate(label)}
                contentStyle={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="valueUsd" stroke="var(--brand)" strokeWidth={2} fill="url(#valueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
