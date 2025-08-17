export const fmtOdds = (v: number | string | null | undefined) =>
  v === null || v === undefined ? '—' : String(v)

export const fmtNum = (n: number | null | undefined, digits = 1) =>
  n === null || n === undefined ? '—' : n.toFixed(digits)
