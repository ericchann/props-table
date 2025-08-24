// Shared
export type GameId = string
export type PlayerId = string
export type TeamAbbr = string
export type StatKey =
  | 'points' | 'rebounds' | 'assists'
  | 'fg3PtMade' | 'pointsReboundsAssists'
  | 'pointsRebounds' | 'pointsAssists'
  | 'reboundsAssists' | 'fantasyPts'
  // CSGO props
  | 'map12Kills' | 'map3Kills' | 'map12Headshots' | 'map3Headshots' | 'map1Kills' | 'map1Headshots'

// /schedule
export type ScheduleGame = {
  id: GameId
  date: string
  time: string
  home: TeamAbbr
  away: TeamAbbr
}

// /injuries
export type InjuryRow = {
  id: PlayerId
  name: string
  team: TeamAbbr
  position: string
  status: 'OUT' | 'GTD' | 'OFS' | string
  isOut: boolean
}

// /alt-lines
export type AltLinesRow = {
  prop: StatKey
  player: string
  team: TeamAbbr
  opponent: TeamAbbr
  id: PlayerId
  gameId: GameId
  markets: [number, number][]
}

// /projections
export type ProjectionsRow = {
  id: PlayerId
  name: string
  team: TeamAbbr
  gameId: GameId
  lines: Partial<Record<StatKey, number | null>>
  projections: Partial<Record<StatKey, number | null>>
}

// /prop-trends
export type TrendsBucket = {
  line?: number | null
  rate?: number | null
  over?: number | string | null
  under?: number | string | null
  oppDef?: number | null
  l20Rate?: number | string | null
  l10Rate?: number | null
  l5Rate?: number | null
  currentSeason?: number | null
  lastSeason?: number | null
  all?: number | null
  streak?: number | null
  l10Avg?: number | null
  vsOpp?: number | null
  vsOppGames?: number | null
}

export type TrendsRowBase = {
  id: PlayerId;
  name: string;
  team: TeamAbbr;
  position: string;
  gameId: GameId;
};

export type TrendsRowDynamic = {
  [key in StatKey]?: TrendsBucket | null;
};

// Combined type for TrendsRow
export type TrendsRow = TrendsRowBase & TrendsRowDynamic;

// Utility type to safely index TrendsRow with StatKey
export type TrendsRowSafe = Omit<TrendsRow, keyof Record<StatKey, unknown>> & {
  [key in StatKey]?: TrendsBucket | null;
};

// /lines
export type LinesBook = { book: string; value?: number | null; overPrice?: number | string | null; underPrice?: number | string | null }
export type LinesSummary = { manualOU: number | null; overPrice: number | string | null; underPrice: number | string | null }
export type LinesProp = { summary: LinesSummary; altLines: Record<string, never>; books: LinesBook[] }
export type LinesProjection = Partial<Record<StatKey, LinesProp>>

export type LinesRow = {
  id: PlayerId
  name: string
  team: TeamAbbr
  position: string
  gameId: GameId
  projection: LinesProjection
  homeTeam: TeamAbbr
  awayTeam: TeamAbbr
  gameStart: string
}

// Unified row that powers the table
export type TableRow = {
  id: PlayerId
  player: string
  team: TeamAbbr
  position: string
  gameId: GameId
  opponent: TeamAbbr
  stat: StatKey

  line: number | null      // L
  over: number | string | null // O
  under: number | string | null // U
  stk: number

  pctSeason: number | null // 24/25
  pctH2H: number | null
  pctL5: number | null
  pctL10: number | null
  pctL20: number | null
  pctPrev: number | null   // 23/24

  proj: number | null
  diff: number | null
  dvp: number | null

  inj?: 'OUT' | 'GTD' | 'OFS' | string | null
  hasAlt?: boolean
  gameTime: string | null
}
