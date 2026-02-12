"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import { formatMetricName } from "@/lib/format-metric";

interface ZScoreEntry {
  column: string;
  label: string;
  value: number;
}

const SWOT_COUNT = 5;

export default function PreGamePage() {
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [allData, setAllData] = useState<Record<string, string>[]>([]);
  const [swot, setSwot] = useState<{
    strengths: ZScoreEntry[];
    weaknesses: ZScoreEntry[];
    opportunities: ZScoreEntry[];
    threats: ZScoreEntry[];
  } | null>(null);
  // Load CSV on mount
  useEffect(() => {
    fetch("/data/team_z-scores.csv")
      .then((res) => res.text())
      .then((csv) => {
        const result = Papa.parse<Record<string, string>>(csv, {
          header: true,
          skipEmptyLines: true,
        });
        setAllData(result.data);
        const teamNames = result.data
          .map((row) => row.team_name)
          .filter(Boolean)
          .sort();
        setTeams(teamNames);
      });
  }, []);

  // Compute SWOT when team changes
  useEffect(() => {
    if (!selectedTeam || allData.length === 0) {
      setSwot(null);
      return;
    }

    const row = allData.find((r) => r.team_name === selectedTeam);
    if (!row) return;

    const forMetrics: ZScoreEntry[] = [];
    const againstMetrics: ZScoreEntry[] = [];

    for (const col of Object.keys(row)) {
      if (!col.startsWith("z_score_")) continue;

      const value = parseFloat(row[col]);
      if (isNaN(value)) continue;

      const entry: ZScoreEntry = {
        column: col,
        label: formatMetricName(col),
        value,
      };

      if (col.endsWith("_for")) {
        forMetrics.push(entry);
      } else if (col.endsWith("_against")) {
        againstMetrics.push(entry);
      }
    }

    // Sort descending by value
    const forSorted = [...forMetrics].sort((a, b) => b.value - a.value);
    const againstSorted = [...againstMetrics].sort(
      (a, b) => b.value - a.value
    );

    setSwot({
      strengths: forSorted.slice(0, SWOT_COUNT),
      weaknesses: forSorted.slice(-SWOT_COUNT).reverse(),
      opportunities: againstSorted.slice(0, SWOT_COUNT),
      // Threats = lowest _against z-scores (opponents are strong against you in these areas)
      threats: againstSorted.slice(-SWOT_COUNT).reverse(),
    });
  }, [selectedTeam, allData]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-inter-navy">
            Pre-Game Analysis
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            SWOT analysis based on team z-scores
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="no-print rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-inter-navy focus:border-inter-navy focus:ring-2 focus:ring-inter-navy/20 focus:outline-none"
          >
            <option value="">Select a team...</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedTeam && (
        <div className="flex h-96 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-500">
              Select a team to generate the SWOT analysis
            </p>
          </div>
        </div>
      )}

      {swot && (
        <div id="swot-content" className="space-y-6">
          <div className="rounded-xl bg-inter-navy px-6 py-4 text-white">
            <h2 className="text-xl font-bold">{selectedTeam}</h2>
            <p className="text-sm text-white/70">
              SWOT Analysis — Top {SWOT_COUNT} metrics per quadrant
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SwotCard
              title="Strengths"
              subtitle="Highest z-scores (own performance)"
              items={swot.strengths}
              color="green"
              letter="S"
            />
            <SwotCard
              title="Weaknesses"
              subtitle="Lowest z-scores (own performance)"
              items={swot.weaknesses}
              color="red"
              letter="W"
            />
            <SwotCard
              title="Opportunities"
              subtitle="Highest z-scores (opponent metrics)"
              items={swot.opportunities}
              color="blue"
              letter="O"
            />
            <SwotCard
              title="Threats"
              subtitle="Lowest z-scores (opponent metrics)"
              items={swot.threats}
              color="amber"
              letter="T"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SwotCard({
  title,
  subtitle,
  items,
  color,
  letter,
}: {
  title: string;
  subtitle: string;
  items: ZScoreEntry[];
  color: "green" | "red" | "blue" | "amber";
  letter: string;
}) {
  const colorMap = {
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      badge: "bg-green-600",
      bar: "bg-green-500",
      text: "text-green-700",
      barBg: "bg-green-100",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-600",
      bar: "bg-red-500",
      text: "text-red-700",
      barBg: "bg-red-100",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      badge: "bg-blue-600",
      bar: "bg-blue-500",
      text: "text-blue-700",
      barBg: "bg-blue-100",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      badge: "bg-amber-600",
      bar: "bg-amber-500",
      text: "text-amber-700",
      barBg: "bg-amber-100",
    },
  };

  const c = colorMap[color];

  // Normalize bars: find the max absolute value for scaling
  const maxAbs = Math.max(...items.map((i) => Math.abs(i.value)), 0.01);

  return (
    <div
      className={`rounded-xl border ${c.border} ${c.bg} overflow-hidden shadow-sm`}
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.badge} text-lg font-bold text-white`}
        >
          {letter}
        </div>
        <div>
          <h3 className={`font-semibold ${c.text}`}>{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-1 px-5 pb-5">
        {items.map((item) => (
          <div key={item.column} className="flex items-center gap-3">
            <div className="w-48 min-w-0 shrink-0">
              <p className="truncate text-sm font-medium text-gray-700" title={item.label}>
                {item.label}
              </p>
            </div>
            <div className={`h-5 flex-1 rounded-full ${c.barBg} overflow-hidden`}>
              <div
                className={`h-full rounded-full ${c.bar} transition-all duration-500`}
                style={{
                  width: `${(Math.abs(item.value) / maxAbs) * 100}%`,
                }}
              />
            </div>
            <span className="w-14 text-right text-xs font-mono font-semibold text-gray-600">
              {item.value >= 0 ? "+" : ""}
              {item.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
