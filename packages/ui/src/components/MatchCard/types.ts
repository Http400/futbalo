export type MatchPrediction = "1" | "X" | "2" | null;
export type MatchStatus = "upcoming" | "live" | "finished";

export interface MatchTeam {
    name: string;
    code: string;
    flagUrl: string;
}
