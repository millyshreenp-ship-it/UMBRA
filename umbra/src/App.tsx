import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { ColumnLayer, ArcLayer, ScatterplotLayer, TextLayer, PathLayer } from '@deck.gl/layers'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import { Evacuate, Ask, Report, Insights, type Msg, type Routes } from './Screens'
import { NodePanel, Compare } from './Panels'
import { NODES, ARCS, PLACES, CITY, DELHI_VIEWBOX, type Node } from './data'
import { activity, effF } from './meta'

type Pos = [number, number]
const AMBER: [number, number, number] = [255, 178, 62], EMBER: [number, number, number] = [229, 67, 43]
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

export default function App() {
  const box = useRef<HTMLDivElement>(null), map = useRef<maplibregl.Map>(), overlay = useRef<MapboxOverlay>()
  const [shadow, setShadow] = useState(false), [sel, setSel] = useState<Node | null>(null), [closed, setClosed] = useState<Set<number>>(new Set())
  const [place, setPlace] = useState('IIT Delhi'), [q, setQ] = useState(''), [t, setT] = useState(0), [lens, setLens] = useState({ x: -999, y: -999 }), [zoom, setZoom] = useState(16)
  const [tab, setTab] = useState('map'), [hi, setHi] = useState<Set<number>>(new Set()), [hour, setHour] = useState(9), [heat, setHeat] = useState(false)
  const [reports, setReports] = useState<{ pos: Pos }[]>([]), [extra, setExtra] = useState<[Node, Node][]>([]), [routes, setRoutes] = useState<Routes | null>(null)
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set()), [rejected, setRejected] = useState<Set<number>>(new Set()), [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const [chat, setChat] = useState<Msg[]>([['a', 'Ask about any of the 13 places. I answer with simulator numbers and highlight the nodes on the map.']])
  const warn = NODES[(Math.floor(t / 30) * 5 + 3) % NODES.length].id

  useEffect(() => {
    const m = new maplibregl.Map({ container: box.current!, style: 'https://tiles.openfreemap.org/styles/liberty', center: PLACES['IIT Delhi'].c, zoom: 16, pitch: 60, bearing: -20, maxBounds: [[76.7, 28.3], [77.5, 29.0]] })
    m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right')
    const o = new MapboxOverlay({ interleaved: false, layers: [] }); m.addControl(o as any)
    m.on('zoom', () => setZoom(m.getZoom())); map.current = m; overlay.current = o
    return () => m.remove()
  }, [])
  useEffect(() => {
    if (reduced) return
    let id = 0, last = 0
    const tick = (ts: number) => { if (ts - last > 33) { setT((ts / 1000) % 1e4); last = ts } id = requestAnimationFrame(tick) }
    id = requestAnimationFrame(tick); return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    box.current?.classList.toggle('dim', shadow)
    const sc = Math.min(40, Math.max(1, 2 ** (16 - zoom))), vis = NODES.filter(n => !rejected.has(n.id))
    const arcs = [...ARCS, ...extra].filter(([a, b]) => !rejected.has(a.id) && !rejected.has(b.id)) as [Node, Node][]
    const dmg = (n: Node) => closed.has(n.id) || warn === n.id, col = (n: Node) => (dmg(n) ? EMBER : AMBER)
    const ph = (n: Node) => (t * 0.5 + n.id * 0.13) % 1
    const L: any[] = []
    if (shadow) {
      if (heat) L.push(new HeatmapLayer<Node>({ id: 'heat', data: vis, getPosition: n => n.pos, getWeight: n => n.share * activity(n, hour), radiusPixels: 70, intensity: 1.2, colorRange: [[255, 178, 62, 0], [255, 178, 62, 110], [255, 140, 40, 180], [255, 90, 40, 230], [255, 60, 40, 255]], updateTriggers: { getWeight: hour } }))
      L.push(new ArcLayer<[Node, Node]>({ id: 'arcs', data: arcs, getSourcePosition: d => d[0].pos, getTargetPosition: d => d[1].pos, getSourceColor: d => (closed.has(d[0].id) || closed.has(d[1].id) ? EMBER : AMBER) as any, getTargetColor: [255, 240, 200], getWidth: 3, getHeight: 0.6, updateTriggers: { getSourceColor: [...closed] } }))
      if (!reduced) L.push(new ScatterplotLayer<{ pos: Pos; w: number }>({ id: 'flow', data: arcs.flatMap(([a, b], i) => [0, 1, 2].map(k => { const f = (t * 0.25 + k / 3 + i * 0.11) % 1; return { pos: [a.pos[0] + (b.pos[0] - a.pos[0]) * f, a.pos[1] + (b.pos[1] - a.pos[1]) * f] as Pos, w: (activity(a, hour) + activity(b, hour)) / 2 } })), getPosition: d => d.pos, radiusUnits: 'pixels', getRadius: d => 1.5 + d.w * 2.5, getFillColor: [255, 255, 255, 230], updateTriggers: { getPosition: t, getRadius: hour } }))
      L.push(new ColumnLayer<Node>({ id: 'cols', data: vis, diskResolution: 12, radius: 7 * sc, extruded: true, elevationScale: sc, getPosition: n => n.pos, getFillColor: n => [...col(n), 230] as any, getElevation: n => (20 + n.share * 3) * (0.4 + 0.6 * activity(n, hour)), pickable: true, onClick: i => { if (i.object) { setSel(i.object); setTab('map') } }, updateTriggers: { getFillColor: [...closed, warn], getElevation: hour } }),
        new ScatterplotLayer<Node>({ id: 'rings', data: vis, stroked: true, filled: false, radiusUnits: 'meters', lineWidthUnits: 'pixels', getLineWidth: n => (hi.has(n.id) ? 6 : 2), getPosition: n => n.pos, getRadius: n => (8 + ph(n) * 55) * sc, getLineColor: n => [...col(n), Math.round(255 * (1 - ph(n)))] as any, updateTriggers: { getRadius: [t, sc], getLineColor: [t, warn, ...closed], getLineWidth: [...hi] } }),
        new TextLayer<Node>({ id: 'tags', data: vis, getPosition: n => [n.pos[0], n.pos[1], ((20 + n.share * 3) * (0.4 + 0.6 * activity(n, hour)) + 6) * sc], getText: n => (closed.has(n.id) ? 'closed' : String(effF(n, closed))), getSize: 13, getColor: n => (closed.has(n.id) ? [255, 255, 255, 255] : [20, 18, 58, 255]) as any, background: true, getBackgroundColor: n => (closed.has(n.id) ? [...EMBER, 255] : [241, 235, 220, 255]) as any, backgroundPadding: [6, 3], fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600, getPixelOffset: [0, -10], updateTriggers: { getText: [...closed], getColor: [...closed], getBackgroundColor: [...closed], getPosition: hour } }),
        new TextLayer<[Node, Node]>({ id: 'dep', data: arcs, getPosition: d => [(d[0].pos[0] + d[1].pos[0]) / 2, (d[0].pos[1] + d[1].pos[1]) / 2, 30 * sc], getText: d => Math.round((d[0].share + d[1].share) / 2) + '%', getSize: 11, getColor: [255, 178, 62, 255], background: true, getBackgroundColor: [20, 18, 58, 230], backgroundPadding: [4, 2], fontFamily: 'Instrument Sans, sans-serif' }),
        new ScatterplotLayer<{ pos: Pos }>({ id: 'reports', data: reports, getPosition: d => d.pos, radiusUnits: 'pixels', getRadius: 6, getFillColor: [...AMBER, 255] as any, stroked: true, getLineColor: [255, 255, 255, 255], lineWidthUnits: 'pixels', getLineWidth: 1.5 }))
    }
    if (routes) L.push(new PathLayer<{ p: Pos[]; c: number[] }>({ id: 'routes', data: [{ p: routes.official, c: [241, 235, 220] }, ...(shadow ? [{ p: routes.shadow, c: AMBER }] : [])], getPath: d => d.p, getColor: d => [...d.c, 255] as any, getWidth: 6, widthUnits: 'pixels', capRounded: true }))
    overlay.current?.setProps({ layers: L })
  }, [shadow, closed, t, zoom, hi, reports, extra, routes, hour, heat, rejected, warn])

  const fly = (c: Pos, z = 16) => map.current?.flyTo({ center: c, zoom: z, pitch: z > 13 ? 60 : 40 })
  const search = async (e: React.FormEvent) => { e.preventDefault(); if (!q.trim()) return; const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&bounded=1&viewbox=${DELHI_VIEWBOX}&q=${encodeURIComponent(q)}`).then(r => r.json()); if (r[0]) fly([+r[0].lon, +r[0].lat]); else alert('Nothing found inside Delhi.') }
  const toggle = (id: number, on: boolean) => setClosed(s => { const c = new Set(s); on ? c.add(id) : c.delete(id); return c })
  const showClosed = (ids: number[], r: Routes | null) => { setClosed(new Set(ids)); setRoutes(r); setShadow(true); setTab('map'); setSel(null); if (ids[0]) fly(NODES[ids[0] - 1].pos, 15) }
  const highlight = (ids: number[]) => { setHi(new Set(ids)); if (ids.length) { setShadow(true); fly(NODES[ids[0] - 1].pos, 15) } }
  const addReport = () => { const c = map.current!.getCenter(); setReports(r => [...r, { pos: [c.lng + (Math.random() - 0.5) * 6e-4, c.lat + (Math.random() - 0.5) * 6e-4] }]); setShadow(true) }
  const reject = (n: Node) => { setRejected(s => new Set(s).add(n.id)); setSel(null); setToast({ id: n.id, text: `Rejected ${n.name}. The model will down-weight similar nodes.` }); setTimeout(() => setToast(null), 6000) }
  const undo = () => { if (!toast) return; setRejected(s => { const c = new Set(s); c.delete(toast.id); return c }); setToast(null) }
  const reset = () => { setClosed(new Set()); setRoutes(null); setTab('map') }
  const chip = (p: string, c: Pos, z: number) => <button key={p} className={p === place ? 'chip on' : 'chip'} onClick={() => { setPlace(p); fly(c, z) }}>{p}</button>

  return (
    <div className={shadow ? 'app sh' : 'app'} onPointerMove={e => setLens({ x: e.clientX, y: e.clientY })}>
      <div ref={box} className="map" />
      {shadow && <div className="lens" style={{ left: lens.x - 80, top: lens.y - 80 }} />}
      <header><b className="logo">umbra<i>.</i>delhi</b><form onSubmit={search}><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search places in Delhi" aria-label="Search Delhi" /></form></header>
      <div className="chips">{chip('All Delhi', CITY.c, CITY.z)}{Object.entries(PLACES).map(([p, v]) => chip(p, v.c, v.z))}</div>
      <div className="state" role="status">{shadow ? `Shadow map · ${NODES.length - rejected.size} hidden nodes in ${Object.keys(PLACES).length} places` : 'Official map · lights on'}</div>
      {shadow && <div className="time"><label>Time of day {String(hour).padStart(2, '0')}:00<input type="range" min={0} max={23} value={hour} onChange={e => setHour(+e.target.value)} aria-label="Time of day" /></label><label><input type="checkbox" checked={heat} onChange={e => setHeat(e.target.checked)} /> Heatmap</label></div>}
      {tab === 'map' && closed.size > 0 && <div className="pill2"><button onClick={() => { setTab('compare'); setSel(null) }}>{closed.size} closed · Before and after</button><button onClick={reset}>Reset all</button></div>}
      <button className="lamp" role="switch" aria-checked={shadow} aria-label="Lights. On shows the official map, off shows the shadow map" onClick={() => setShadow(s => !s)}><span className="sw"><span className="kn" /></span><span>Lights</span></button>
      {toast && <div className="toast" role="status">{toast.text} <button onClick={undo}>Undo</button></div>}
      {tab === 'map' && sel && shadow && <section className="sheet" aria-live="polite"><NodePanel n={sel} closed={closed} hour={hour} confirmed={confirmed.has(sel.id)} onClose={() => toggle(sel.id, true)} onReopen={() => toggle(sel.id, false)} onDismiss={() => setSel(null)} onConfirm={() => setConfirmed(s => new Set(s).add(sel.id))} onReject={() => reject(sel)} /></section>}
      {tab !== 'map' && <section className="sheet" aria-live="polite">
        {tab === 'evac' && <Evacuate place={place} onShow={showClosed} />}
        {tab === 'ask' && <Ask place={place} chat={chat} setChat={setChat} onHighlight={highlight} />}
        {tab === 'report' && <Report count={reports.length} edges={extra.length} place={place} onReport={addReport} onEdge={(a, b) => { setExtra(x => [...x, [a, b]]); setShadow(true) }} onClear={() => { setReports([]); setExtra([]) }} />}
        {tab === 'insights' && <Insights place={place} warn={warn} rejected={rejected.size} onRestore={() => setRejected(new Set())} />}
        {tab === 'compare' && <Compare closed={closed} onReset={reset} />}
      </section>}
      <nav className="dock">{[['map', 'Map'], ['evac', 'Evacuate'], ['ask', 'Ask'], ['report', 'Report'], ['insights', 'Insights']].map(([k, l]) => <button key={k} aria-current={tab === k} onClick={() => { setTab(k); if (k !== 'map') setSel(null); else setHi(new Set()) }}>{l}{k === 'insights' && <span className="dot" title="Early warning active" />}</button>)}</nav>
    </div>
  )
}
