export const fmtOdds = (v: number | string | null | undefined) =>
  v === null || v === undefined ? '\u2014' : String(v)

export const fmtNum = (n: number | null | undefined, digits = 1) =>
  n === null || n === undefined ? '\u2014' : n.toFixed(digits)
