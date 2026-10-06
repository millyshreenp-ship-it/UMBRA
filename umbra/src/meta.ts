import { ARCS, type Node } from './data'
const PEAK: Record<string, [number, number]> = { 'Median-gap crossing': [8, 10], 'Metro gate shortcut': [8, 10], 'Chai stall hub': [12, 15], 'Shared auto stand': [7, 10], 'Shared tap': [11, 16], 'Charging point': [10, 18], 'Underpass, waterlogs in monsoon': [7, 20], 'Vendor information hub': [10, 20], 'Informal footbridge shortcut': [17, 21] }
export const peak = (n: Node) => PEAK[n.type]
export const activity = (n: Node, h: number) => { const [a, b] = peak(n); return h >= a && h <= b ? 1 : 0.25 }
export const mix = (n: Node): [string, number][] => { const w = 40 + (n.id * 7) % 25, r = 20 + (n.id * 5) % 20; return [['Wi-Fi footfall', w], ['Crowd reports', r], ['OpenStreetMap', 100 - w - r]] }
export const why = (n: Node) => `Observed flow here is ${n.share}% above what the official map predicts, with a visit spike from ${peak(n)[0]}:00 to ${peak(n)[1]}:00 that no database explains.`
export const NB = (id: number) => ARCS.flatMap(([a, b]) => (a.id === id ? [b] : b.id === id ? [a] : []))
export const effF = (n: Node, closed: Set<number>) => Math.min(100, n.fragility + (!closed.has(n.id) && NB(n.id).some(x => closed.has(x.id)) ? 10 : 0))
export const combined = (a: Node[]) => { const s = a.reduce((x, n) => x + n.share, 0); return { cong: Math.round(s * 5.9 * 0.85), walk: +(s * 0.22 * 0.85).toFixed(1), size: new Set(a.flatMap(n => n.cascade)).size, frag: a.reduce((x, n) => x + n.fragility, 0) } }
