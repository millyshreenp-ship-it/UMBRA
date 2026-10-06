import { useState } from 'react'
import { NODES, PLACES, type Node } from './data'
import { NB } from './meta'
type Pos = [number, number]
export type Msg = ['u' | 'a', string]
export type Routes = { official: Pos[]; shadow: Pos[] }
export const scope = (p: string) => (p === 'All Delhi' ? NODES : NODES.filter(n => n.place === p))
export const crit = (n: Node) => n.fragility * 0.6 + n.share * 0.4
const flood = (n: Node) => n.type.includes('waterlogs')
const names = (a: Node[]) => a.map(n => n.name).join(', ')
const SC = { fire: 'Fire', flood: 'Monsoon flood', power: 'Power cut', surge: 'Crowd surge' }
export type Sc = keyof typeof SC
export const evacTimes = (pool: Node[], sc: Sc = 'fire') => {
  const base = 8 + (pool.reduce((a, n) => a + n.fragility, 0) / pool.length) * 0.18
  const off = sc === 'flood' ? base + (pool.some(flood) ? 9 : 4) : sc === 'power' ? base + 3.5 : sc === 'surge' ? base * 1.25 : base
  return { off: +off.toFixed(1), sa: +(off * (sc === 'flood' ? 0.58 : 0.62)).toFixed(1) }
}
const Sim = () => <p className="sim">Simulated demo data</p>

export function Evacuate({ place, onShow }: { place: string; onShow: (ids: number[], r: Routes | null) => void }) {
  const [sc, setSc] = useState<Sc>('fire')
  const pool = scope(place), t = evacTimes(pool, sc), by = [...pool].sort((a, b) => b.share - a.share), top = by[0], second = by[1] ?? top
  const wet = pool.filter(flood), chg = pool.filter(n => n.type === 'Charging point')
  const ids = sc === 'flood' ? wet.map(n => n.id) : sc === 'power' ? (chg.length ? chg : [top]).map(n => n.id) : [top.id]
  const c = place === 'All Delhi' ? null : PLACES[place].c
  const ex: Pos | null = c && [c[0] + 0.0013, c[1] + 0.0011]
  const routes: Routes | null = c && ex ? { official: [[c[0] - 0.0012, c[1] - 0.0008], c, ex], shadow: [[c[0] - 0.0012, c[1] - 0.0008], ...pool.filter(n => !flood(n)).sort((a, b) => a.pos[0] - b.pos[0]).slice(0, 2).map(n => n.pos), ex] } : null
  const why = { fire: `Bottleneck at ${top.name}, used by ${top.share}% of movement.`, flood: wet.length ? `Routes people through ${names(wet)}, which flood.` : 'No underpass here, but waterlogged lanes slow the exits.', power: `Dark corridors near ${top.name} slow the exits.`, surge: `${top.name} chokes at ${top.share}% of movement.` }[sc]
  return <>
    <h2>Evacuate · {place}</h2>
    <div className="row">{(Object.keys(SC) as Sc[]).map(k => <button key={k} className={k === sc ? 'btn' : 'btn g'} onClick={() => setSc(k)}>{SC[k]}</button>)}</div>
    <div className="card"><span>Official plan</span><b style={{ color: 'var(--ember)' }}>{t.off} min</b><div className="bar"><i style={{ width: Math.min(100, t.off * 3) + '%', background: 'var(--ember)' }} /></div><span>{why}</span></div>
    <div className="card" style={{ marginTop: 8 }}><span>Shadow-aware plan</span><b>{t.sa} min</b><div className="bar"><i style={{ width: Math.min(100, t.sa * 3) + '%' }} /></div><span>Reroutes through {names(pool.filter(n => !flood(n)).slice(0, 2)) || 'raised paths'}.</span></div>
    <h3 className="h">Signage suggestions</h3>
    <ol><li>Exit arrows at {top.name}.</li><li>"{sc === 'flood' ? 'Avoid underpass' : 'Alternate exit'}" sign at {second.name}.</li></ol>
    <div className="row"><button className="btn" onClick={() => onShow(ids, routes)}>Show on map</button></div>
    {!routes && <p className="sim">Pick one place chip to draw routes.</p>}<Sim />
  </>
}

function answer(q: string, place: string): [string, number[]] {
  const low = q.toLowerCase(), pl = Object.keys(PLACES).find(p => low.includes(p.toLowerCase())) ?? (place === 'All Delhi' ? '' : place)
  const pool = pl ? NODES.filter(n => n.place === pl) : NODES, where = pl || 'Delhi'
  if (/flood|monsoon|rain|waterlog/.test(low)) { const w = pool.filter(flood), a = evacTimes(pool), b = evacTimes(pool, 'flood'); return w.length ? [`In a monsoon flood, ${names(w)} fail first. Evacuation in ${where} goes from ${a.off} to ${b.off} min with the official plan.`, w.map(n => n.id)] : [`No flood-prone underpass in ${where} in this demo. Evacuation still rises from ${a.off} to ${b.off} min.`, []] }
  if (/fix|first|rank|prior|critical/.test(low)) { const r = [...pool].sort((a, b) => crit(b) - crit(a)).slice(0, 3); return [`Fix order for ${where}: ` + r.map((n, i) => `${i + 1}) ${n.name} (fragility ${n.fragility}, ${n.share}% share)`).join('; ') + '.', r.map(n => n.id)] }
  if (/close|gate|shut|happen|remove/.test(low)) { const n = [...pool].sort((a, b) => b.share - a.share)[0]; return [`Closing ${n.name} in ${n.place} raises congestion by ${Math.round(n.share * 5.9)}% and walking time by ${(n.share * 0.22).toFixed(1)} min. Cascade: ${n.cascade.join(' → ')}. Knock-on: ${NB(n.id).map(x => x.name).join(', ') || 'none'}.`, [n.id]] }
  if (/hidden|depend|which|spot/.test(low)) { const r = pool.slice(0, 5); return [`${where} depends on: ` + r.map(n => `${n.name} (${n.share}%)`).join(', ') + '.', r.map(n => n.id)] }
  return ['Try: "What happens if Connaught Place closes?", "What should we fix first in Karol Bagh?", "Monsoon flood in Lajpat Nagar", "Which hidden spots does AIIMS depend on?"', []]
}
export function Ask({ place, chat, setChat, onHighlight }: { place: string; chat: Msg[]; setChat: (m: Msg[]) => void; onHighlight: (ids: number[]) => void }) {
  const [v, setV] = useState('')
  const send = () => { if (!v.trim()) return; const [t, ids] = answer(v, place); setChat([...chat, ['u', v], ['a', t]]); setV(''); onHighlight(ids) }
  return <><h2>Ask</h2>{chat.map((m, i) => <div key={i} className={m[0] === 'u' ? 'msg u' : 'msg'}>{m[1]}</div>)}
    <input className="ask" value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="What happens if Gate 2 closes at 1 PM?" aria-label="Ask UMBRA" /><p className="sim">Answers use simulator numbers. Simulated demo data</p></>
}

const KINDS = ['Tap is dry', 'Crowd building', 'Path blocked', 'Shortcut in use']
const KW: [RegExp, string][] = [[/tap|water|cooler/, 'tap'], [/charg|socket|plug/, 'charging'], [/chai|tea/, 'chai'], [/auto|rickshaw/, 'auto'], [/metro|gate/, 'metro'], [/cross|road|median/, 'median'], [/under|subway|flood|logging/, 'underpass'], [/vendor|market|lane|stall/, 'vendor'], [/bridge|skywalk|foot/, 'footbridge']]
function parse(text: string, place: string) {
  const low = text.toLowerCase(), pool = scope(place), words = low.split(/\W+/).filter(w => w.length > 3)
  const kws = KW.filter(([r]) => r.test(low)).map(k => k[1])
  const sc = (n: Node) => { const s = (n.name + ' ' + n.type).toLowerCase(); return words.filter(w => s.includes(w)).length * 2 + kws.filter(k => n.type.toLowerCase().includes(k)).length * 3 }
  const from = [...pool].sort((a, b) => sc(b) - sc(a))[0]
  if (!from || sc(from) === 0) return null
  const to = [...pool].filter(n => n.id !== from.id).sort((a, b) => (+(b.type === from.type) * 10 + b.share) - (+(a.type === from.type) * 10 + a.share))[0]
  return to ? { from, to, sev: /dry|broken|closed|not working|blocked/.test(low) ? 'High' : /crowd|queue|jam/.test(low) ? 'Medium' : 'Low' } : null
}
export function Report({ count, edges, place, onReport, onEdge, onClear }: { count: number; edges: number; place: string; onReport: (k: string) => void; onEdge: (a: Node, b: Node) => void; onClear: () => void }) {
  const [v, setV] = useState(''), [res, setRes] = useState<string>('')
  const send = () => { const r = parse(v, place); if (!r) { setRes(`Couldn't match a node in ${place}. Pick a place chip first.`); return } onEdge(r.from, r.to); setRes(`Parsed: ${r.from.name} → ${r.to.name}. Severity ${r.sev}, confidence 74%. Added to the shadow map.`); setV('') }
  return <><h2>Report</h2><p style={{ fontSize: 14 }}>One tap adds a dot at the map centre. Or describe it and the parser turns it into a dependency.</p>
    <div className="row">{KINDS.map(k => <button key={k} className="btn" onClick={() => onReport(k)}>{k}</button>)}</div>
    <input className="ask" value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="2nd floor tap is always dry, we use the one by Block C" aria-label="Describe a problem" />
    <div className="row"><button className="btn g" onClick={send}>Parse report</button>{(count > 0 || edges > 0) && <button className="btn g" onClick={onClear}>Clear reports</button>}</div>
    {res && <div className="msg">{res}</div>}<p>{count} dots · {edges} parsed dependencies</p><Sim /></>
}

const REC: Record<string, [string, number, number]> = { 'Median-gap crossing': ['Add a signalled zebra crossing', 4, 38], 'Metro gate shortcut': ['Formalize the shortcut with a gate and signage', 6, 34], 'Chai stall hub': ['Mark a vending zone and widen the footpath', 2, 22], 'Shared auto stand': ['Create a designated pick-up bay', 3, 27], 'Shared tap': ['Add a second tap and a cooler nearby', 1, 31], 'Charging point': ['Add a charging bench with 8 sockets', 1.5, 24], 'Underpass, waterlogs in monsoon': ['Install a pump and drain before monsoon', 12, 46], 'Vendor information hub': ['Add map boards and an info kiosk', 2.5, 29], 'Informal footbridge shortcut': ['Widen the stairs and add a crowd marshal point', 9, 41] }
export function Insights({ place, warn, rejected, onRestore }: { place: string; warn: number; rejected: number; onRestore: () => void }) {
  const pool = scope(place), w = NODES[warn - 1], next = [...NODES].filter(n => n.id !== warn).sort((a, b) => b.fragility - a.fragility).slice(0, 3)
  const r = [...pool].sort((a, b) => crit(b) - crit(a)).slice(0, 12).map(n => ({ n, rec: REC[n.type], v: (REC[n.type][2] * n.fragility) / 100 / REC[n.type][1] })).sort((a, b) => b.v - a.v).slice(0, 8)
  return <div className="print">
    <h2>UMBRA brief · {place}</h2><p className="sim">For facility managers · {new Date().toLocaleDateString('en-IN')}</p>
    <div className="card bad"><span>Early warning</span><b>{w.name}</b><span>Queue growing {12 + w.id * 3}%, {3 + (w.id % 4)} repeated "broken" reports, {w.place}. Likely to degrade within {20 + w.id * 4} min. Next likely to fail: {next.map(n => n.name).join(', ')}.</span></div>
    <h3 className="h" style={{ marginTop: 10 }}>Interventions, best value first</h3>
    {r.map(({ n, rec, v }, i) => <div className="rank" key={n.id}><b>{n.fragility}</b><div><strong>{i + 1}. {rec[0]}</strong> <span className="tag">{n.place}</span><br /><small>{n.name} · ₹{rec[1]} lakh · cuts fragility about {rec[2]}% · impact per lakh {v.toFixed(1)}</small></div></div>)}
    <div className="row"><button className="btn" onClick={() => window.print()}>Export PDF brief</button>{rejected > 0 && <button className="btn g" onClick={onRestore}>Restore {rejected} rejected</button>}</div>
    <p className="sim">Ranked by cost versus impact. Costs and impact are simulated demo data.</p>
  </div>
}
