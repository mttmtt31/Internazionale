"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Papa from "papaparse";

interface LoanedPlayer {
  name: string;
  imageUrl: string;
  marketValue: number;
  gamesPlayed: number;
  minsPlayed: number;
  goals: number;
  assists: number;
  currentClub: string;
}

function formatValue(value: number): string {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value}`;
}

export default function LoanedPlayersPage() {
  const [players, setPlayers] = useState<LoanedPlayer[]>([]);
  useEffect(() => {
    fetch("/data/loaned_players.csv")
      .then((res) => res.text())
      .then((csv) => {
        // The CSV has 6 headers but 7 columns (missing market_value header).
        // Parse without headers and assign manually.
        const result = Papa.parse<string[]>(csv, {
          header: false,
          skipEmptyLines: true,
        });

        // Skip header row
        const rows = result.data.slice(1);
        const parsed: LoanedPlayer[] = rows
          .filter((row) => row.length >= 8)
          .map((row) => ({
            name: row[0],
            imageUrl: row[1],
            marketValue: parseInt(row[2]) || 0,
            gamesPlayed: parseInt(row[3]) || 0,
            minsPlayed: parseInt(row[4]) || 0,
            goals: parseInt(row[5]) || 0,
            assists: parseInt(row[6]) || 0,
            currentClub: row[7],
          }));

        setPlayers(parsed);
      });
  }, []);

  const totalGoals = players.reduce((s, p) => s + p.goals, 0);
  const totalAssists = players.reduce((s, p) => s + p.assists, 0);
  const totalValue = players.reduce((s, p) => s + p.marketValue, 0);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-inter-navy">
            Loaned Players
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of all players currently on loan — stats cover the full
            25/26 season across all clubs
          </p>
        </div>
      </div>

      <div id="loaned-content" className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard label="Players" value={String(players.length)} />
          <SummaryCard label="Total Value" value={formatValue(totalValue)} />
          <SummaryCard label="Total Goals" value={String(totalGoals)} />
          <SummaryCard label="Total Assists" value={String(totalAssists)} />
        </div>

        {/* Player cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <PlayerCard key={player.name} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-inter-navy">{value}</p>
    </div>
  );
}

function PlayerCard({ player }: { player: LoanedPlayer }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4 p-5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
          <Image
            src={player.imageUrl}
            alt={player.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-gray-900">
            {player.name}
          </h3>
          <p className="text-sm text-gray-500">
            {player.currentClub}
          </p>
          <p className="text-sm text-inter-gold font-medium">
            {formatValue(player.marketValue)}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 bg-gray-50">
        <StatCell label="Games" value={player.gamesPlayed} />
        <StatCell label="Goals" value={player.goals} />
        <StatCell label="Assists" value={player.assists} />
      </div>
      <div className="border-t border-gray-100 bg-gray-50 px-5 py-2">
        <p className="text-xs text-gray-500">
          {player.minsPlayed} minutes played
        </p>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-3 text-center">
      <p className="text-lg font-bold text-inter-navy">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
