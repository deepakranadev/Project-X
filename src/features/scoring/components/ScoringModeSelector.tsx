"use client";

import React from "react";
import type { ScoringPresetSelection } from "@/features/scoring/scoringConfigDraft";

interface ScoringModeSelectorProps {
  readonly preset: ScoringPresetSelection;
  readonly onSelectStandard: () => void;
  readonly onSelectCustom: () => void;
}

export function ScoringModeSelector({
  preset,
  onSelectStandard,
  onSelectCustom,
}: ScoringModeSelectorProps) {
  const isStandard = preset === "BGMI_STANDARD";
  const isCustom = preset === "CUSTOM";

  return (
    <>
      {/* Mobile Segmented Control (< md) */}
      <section className="md:hidden space-y-1.5" data-purpose="preset-segmented-control">
        <div className="p-1 bg-slate-200/75 rounded-xl flex items-center gap-1 shadow-inner border border-slate-300/40" role="group" aria-label="Scoring preset">
          {/* Active / Inactive Standard */}
          <button
            className={`flex-1 h-9 py-1.5 px-2 sm:px-3 font-semibold text-xs sm:text-[13px] rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap select-none ${
              isStandard
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 font-medium"
            }`}
            type="button"
            aria-pressed={isStandard}
            aria-label="BGMI Standard"
            onClick={onSelectStandard}
          >
            {isStandard && <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] shrink-0"></span>}
            <span className="whitespace-nowrap truncate">BGMI 2026 Standard</span>
          </button>
          {/* Active / Inactive Custom */}
          <button
            className={`flex-1 h-9 py-1.5 px-2 sm:px-3 font-semibold text-xs sm:text-[13px] rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap select-none ${
              isCustom
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 font-medium"
            }`}
            type="button"
            aria-pressed={isCustom}
            aria-label="Custom"
            onClick={onSelectCustom}
          >
            {isCustom && <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] shrink-0"></span>}
            <span className="whitespace-nowrap">Custom</span>
          </button>
        </div>
        {/* Info pill bar */}
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            {isStandard
              ? "Preset Active • Standard placement and finish scoring"
              : "Custom Scoring Active • Edit placement and finish values"}
          </span>
        </div>
      </section>

      {/* Desktop Mode Selector (md+) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200/80 p-5 space-y-3 shadow-sm" data-purpose="desktop-preset-selector">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Scoring Mode</div>
        <div className="grid grid-cols-2 gap-3" role="group" aria-label="Scoring preset">
          {/* Preset 1: Standard */}
          <button
            type="button"
            aria-pressed={isStandard}
            aria-label="BGMI Standard"
            onClick={onSelectStandard}
            className={`relative flex flex-col p-4 rounded-lg text-left cursor-pointer transition-all select-none border-2 ${
              isStandard
                ? "border-[#ea580c] bg-orange-50/40"
                : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${isStandard ? "text-slate-900" : "text-slate-700"}`}>
                BGMI 2026 Standard
              </span>
              {isStandard ? (
                <div className="w-4 h-4 rounded-full bg-[#ea580c] flex items-center justify-center text-white">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300"></div>
              )}
            </div>
            <span className="text-xs text-slate-500 mt-1">Official tournament rule preset</span>
          </button>

          {/* Preset 2: Custom */}
          <button
            type="button"
            aria-pressed={isCustom}
            aria-label="Custom"
            onClick={onSelectCustom}
            className={`relative flex flex-col p-4 rounded-lg text-left cursor-pointer transition-all select-none border-2 ${
              isCustom
                ? "border-[#ea580c] bg-orange-50/40"
                : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${isCustom ? "text-slate-900" : "text-slate-700"}`}>
                Custom
              </span>
              {isCustom ? (
                <div className="w-4 h-4 rounded-full bg-[#ea580c] flex items-center justify-center text-white">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300"></div>
              )}
            </div>
            <span className="text-xs text-slate-500 mt-1">Directly edit points &amp; decimals</span>
          </button>
        </div>
      </div>
    </>
  );
}
