"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  prevValue?: string | number;
  unit?: string;
  trend: number;
  icon?: React.ReactNode;
  colorScheme: "indigo" | "emerald" | "rose" | "blue" | "amber" | "purple" | "cyan" | "orange" | "slate";
}

export function MetricCard({ title, value, prevValue, unit, trend, icon, colorScheme }: MetricCardProps) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  const isNeutral = trend === 0;

  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    cyan: "bg-cyan-50 text-cyan-600",
    orange: "bg-orange-50 text-orange-600",
    slate: "bg-slate-50 text-slate-600",
  };

  const iconBg = colorClasses[colorScheme] || colorClasses.slate;

  return (
    <Card className="h-full border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2 pt-5 px-5 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</CardTitle>
        {icon && (
          <div className={`p-2 rounded-xl ${iconBg}`}>
            {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex flex-col gap-1">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {unit && <span className="text-base font-semibold text-slate-400 ml-1">{unit}</span>}
          </div>
          
          <div className="flex items-center flex-wrap gap-2 mt-1">
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold ${isPositive ? 'bg-emerald-100 text-emerald-700' : isNegative ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {isNeutral && <Minus className="w-3 h-3" />}
              <span>{Math.abs(trend)}%</span>
            </div>
            <span className="text-slate-400 text-xs font-medium truncate">
              {prevValue !== undefined ? (
                <>Было: <span className="font-semibold text-slate-500">{typeof prevValue === 'number' ? prevValue.toLocaleString() : prevValue} {unit}</span></>
              ) : (
                "к прошлому периоду"
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
