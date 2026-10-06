import { useState } from 'react'
import { NODES, type Node } from './data'
import { activity, combined, effF, mix, NB, peak, why } from './meta'
import { evacTimes, scope } from './Screens'
const Sim = () => <p className="sim">Simulated demo data</p>

export function NodePanel(p: { n: Node; closed: Set<number>; hour: number; confirmed: boolean; onClose: () => void; onReopen: () => void; onDismiss: () => void; onConfirm: () => void; onReject: () => void }) {
  const { n } = p, cl = p.closed.has(n.id), conf = Math.min(99, n.conf + (p.confirmed ? 5 : 0)), f = effF(n, p.closed), s = combined([n]), [a, b] = peak(n)
  return <>
    <span className="tag">{n.type}</span><span className="tag">{n.place}</span><span className="tag">Simulated</span>{p.confirmed && <span className="tag">Confirmed by staff</span>}
    <h2>{n.name}</h2>
    <small>Traffic share {n.share}%</small><div className="bar"><i style={{ width: n.share * 2 + '%' }} /></div>
    <small>Confidence {conf}%</small><div className="bar"><i style={{ width: conf + '%' }} /></div>
    <small>Fragility {f}/100</small><div className="bar"><i style={{ width: f + '%', background: f > 75 ? 'var(--ember)' : undefined }} /></div>
    <p style={{ fontSize: 13 }}><b>Why we think this exists.</b> {why(n)}</p>
    <small>Source mix: {mix(n).map(([k, v]) => `${k} ${v}%`).join(' · ')}</small>
    <svg viewBox="0 0 240 36" width="100%" role="img" aria-label={`Busy from ${a}:00 to ${b}:00`} style={{ marginTop: 6 }}>{Array.from({ length: 24 }, (_, h) => <rect key={h} x={h * 10} width={8} y={36 - 30 * activity(n, h)} height={30 * activity(n, h)} fill={activity(n, h) === 1 ? '#ffb23e' : '#cfc6ad'} stroke={h === p.hour ? '#14123a' : 'none'} strokeWidth={2} />)}</svg>
    <small>Temporal fingerprint: matters most {a}:00 to {b}:00. Outlined bar is the time on the slider.</small>
    {cl ? <>
      <div className="cards">{[['+' + s.cong + '%', 'Congestion change'], ['+' + s.walk + ' min', 'Walking time'], [f > 75 ? 'Delayed' : 'Holds', 'Evacuation status'], [s.size + ' steps', 'Cascade size']].map(([v, l]) => <div className="card bad" key={l}><b>{v}</b><span>{l}</span></div>)}</div>
      <ol>{n.cascade.map(c => <li key={c}>{c}</li>)}</ol>
      {NB(n.id).map(x => <small key={x.id} style={{ display: 'block' }}>Knock-on: {x.name} fragility {x.fragility} → {effF(x, p.closed)}</small>)}
      <div className="row"><button className="btn g" onClick={p.onReopen}>Reopen node</button></div>
    </> : <div className="row"><button className="btn r" onClick={p.onClose}>Close this node</button><button className="btn g" onClick={p.onDismiss}>Dismiss</button></div>}
    <div className="row"><button className="btn g" onClick={p.onConfirm}>Confirm node</button><button className="btn g" onClick={p.onReject}>Reject node</button></div>
    <Sim />
  </>
}

export function Compare({ closed, onReset }: { closed: Set<number>; onReset: () => void }) {
  const cn = NODES.filter(n => closed.has(n.id)), c = combined(cn), [p, setP] = useState(1)
  const places = [...new Set(cn.map(n => n.place))], pool = NODES.filter(n => places.includes(n.place)), ev = evacTimes(pool.length ? pool : NODES), after = +(ev.off + c.frag * 0.06).toFixed(1)
  const play = () => { const s = performance.now(), f = (x: number) => { const k = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : Math.min(1, (x - s) / 1600); setP(k); if (k < 1) requestAnimationFrame(f) }; setP(0); requestAnimationFrame(f) }
  const v = (x: number, d = 0) => (x * p).toFixed(d)
  return <>
    <h2>Before and after · {cn.length} closed</h2>
    <div className="row"><button className="btn" onClick={play}>Play</button><button className="btn g" onClick={onReset}>Reset all</button></div>
    <div className="cols2">
      <div className="card"><span>Before</span><b>+0%</b><span>Congestion</span><b>0 min</b><span>Extra walk</span><b>{ev.off} min</b><span>Evacuation</span><b>0</b><span>Cascade steps</span></div>
      <div className="card bad"><span>After</span><b>+{v(c.cong)}%</b><span>Congestion</span><b>+{v(c.walk, 1)} min</b><span>Extra walk</span><b>{(ev.off + (after - ev.off) * p).toFixed(1)} min</b><span>Evacuation</span><b>{v(c.size)}</b><span>Cascade steps</span></div>
    </div>
    <h3 className="h">Cascade tree</h3>
    <ul className="tree">{cn.map(n => <li key={n.id}><b>{n.name}</b><ul>{n.cascade.map(s => <li key={s}>{s}</li>)}{NB(n.id).filter(x => !closed.has(x.id)).map(x => <li key={x.id}><em>Knock-on: {x.name}, fragility {x.fragility} → {effF(x, closed)}</em></li>)}</ul></li>)}</ul>
    <Sim />
  </>
}
