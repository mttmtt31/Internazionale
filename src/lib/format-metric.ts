/**
 * Converts a z-score column name into a human-readable metric label.
 *
 * e.g. "z_score_team_nb_aerial_duels_won_for" → "Aerial Duels Won"
 */
export function formatMetricName(column: string): string {
  // Strip z_score_team_ prefix
  let name = column.replace(/^z_score_team_/, "");
  // Strip _for or _against suffix
  name = name.replace(/_(for|against)$/, "");

  // Expand common abbreviations
  const abbreviations: Record<string, string> = {
    nb: "",
    pct: "%",
    xg: "xG",
    np_xg: "Non-Penalty xG",
    np_psxg: "NP Post-Shot xG",
    xt: "xT",
    avg: "Avg",
    bdp: "Build-Up Disruption",
    gpe: "Goalkeeping Post-Shot Efficiency",
    ppda: "PPDA",
    psxg: "Post-Shot xG",
    np_goals: "Non-Penalty Goals",
    np_shots: "Non-Penalty Shots",
  };

  // Replace known multi-word abbreviations first
  for (const [abbr, full] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${abbr}\\b`, "g");
    name = name.replace(regex, full);
  }

  // Replace underscores with spaces
  name = name.replace(/_/g, " ").trim();

  // Remove double spaces
  name = name.replace(/\s+/g, " ");

  // Title case
  name = name
    .split(" ")
    .map((word) => {
      // Keep special tokens as-is
      if (["xG", "xT", "PPDA", "%", "NP"].includes(word)) return word;
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  // Clean up edge cases
  name = name.replace(/^\s+|\s+$/g, "");
  if (name.startsWith("% ")) name = name.slice(2) + " %";

  return name;
}
