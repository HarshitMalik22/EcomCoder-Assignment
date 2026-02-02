"use client";

import React, { useMemo } from "react";

interface CodeDisplayProps {
    code: string;
    /**
     * Optional previous version of the code.
     * When provided, the viewer will render a simple line-based diff
     * with green (added) and red (removed) markers similar to an IDE.
     */
    previousCode?: string;
}

type DiffLine =
    | { type: "unchanged"; oldLine: string; newLine: string }
    | { type: "added"; oldLine: null; newLine: string }
    | { type: "removed"; oldLine: string; newLine: null };

function computeLineDiff(previous: string | undefined, current: string): DiffLine[] {
    const prevLines = previous ? previous.split("\n") : [];
    const currLines = current.split("\n");

    if (!previous) {
        return currLines.map(line => ({ type: "unchanged", oldLine: line, newLine: line }));
    }

    const m = prevLines.length;
    const n = currLines.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
            if (prevLines[i] === currLines[j]) {
                dp[i][j] = dp[i + 1][j + 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }
    }

    const result: DiffLine[] = [];
    let i = 0;
    let j = 0;

    while (i < m && j < n) {
        if (prevLines[i] === currLines[j]) {
            result.push({ type: "unchanged", oldLine: prevLines[i], newLine: currLines[j] });
            i++;
            j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            result.push({ type: "removed", oldLine: prevLines[i], newLine: null });
            i++;
        } else {
            result.push({ type: "added", oldLine: null, newLine: currLines[j] });
            j++;
        }
    }

    while (i < m) {
        result.push({ type: "removed", oldLine: prevLines[i], newLine: null });
        i++;
    }

    while (j < n) {
        result.push({ type: "added", oldLine: null, newLine: currLines[j] });
        j++;
    }

    return result;
}

export default function CodeDisplay({ code, previousCode }: CodeDisplayProps) {
    const diffLines = useMemo(() => computeLineDiff(previousCode, code), [previousCode, code]);

    const hasDiff = !!previousCode && previousCode.trim() !== code.trim();

    return (
        <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg h-full flex flex-col bg-zinc-950">
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/70 text-xs text-zinc-400">
                <span className="font-medium text-zinc-200">Code</span>
                {hasDiff && (
                    <span className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Added</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                            <span>Removed</span>
                        </span>
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                <pre className="text-xs md:text-sm font-mono text-zinc-100 p-3 min-w-full">
                    {diffLines.map((line, index) => {
                        const isAdded = line.type === "added";
                        const isRemoved = line.type === "removed";
                        const isUnchanged = line.type === "unchanged";

                        const bgClass = isAdded
                            ? "bg-emerald-500/10"
                            : isRemoved
                                ? "bg-red-500/10"
                                : "";
                        const borderClass = isAdded
                            ? "border-l-2 border-emerald-500"
                            : isRemoved
                                ? "border-l-2 border-red-500"
                                : "border-l border-zinc-800/60";
                        const marker = isAdded ? "+" : isRemoved ? "-" : " ";

                        const content = isRemoved ? line.oldLine : line.newLine ?? "";

                        return (
                            <div
                                key={index}
                                className={`flex items-stretch ${bgClass} ${borderClass}`}
                            >
                                <span className="w-8 shrink-0 text-right pr-1 text-[10px] leading-6 text-zinc-500 select-none">
                                    {index + 1}
                                </span>
                                <span className="w-4 shrink-0 text-center text-[10px] leading-6 select-none text-zinc-500">
                                    {marker}
                                </span>
                                <span className="whitespace-pre leading-6 flex-1">
                                    {content}
                                </span>
                            </div>
                        );
                    })}
                </pre>
            </div>
        </div>
    );
}
