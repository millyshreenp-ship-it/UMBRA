# UMBRA

**Find the infrastructure a place depends on but never planned.**

Every city runs on unofficial infrastructure: the median gap everyone crosses, the metro gate shortcut, the chai stall that works as an information desk, the shared tap, the underpass that floods every monsoon. None of it is on a map or in an evacuation plan. UMBRA shows these hidden nodes as a glowing **shadow map** over a normal 3D map, measures how much each one is depended on, and simulates what breaks when one disappears.

Live demo: `https://umbra-one-olive.vercel.app/`

The demo covers 13 crowded places in Delhi. More Indian and global cities are planned.

> **Note:** all numbers in this demo (traffic share, confidence, fragility, costs, evacuation times) are simulated demo data, and node coordinates are approximate. Every number is labelled "Simulated demo data" in the app.

## What it does

- **Official and Shadow modes.** A physical lamp switch flips between an ordinary map and the hidden city. In shadow mode the base map dims and amber columns, arcs and sonar rings rise above the real buildings. A flashlight lens follows your cursor or finger.
- **Delhi hidden nodes.** Median-gap crossings, metro gate shortcuts, chai stall hubs, shared auto stands, shared taps, charging points, informal footbridges and monsoon underpasses.
- **Node panel.** Traffic share, confidence, fragility score out of 100, why the node was discovered, source mix, and a 24-hour activity chart.
- **Counterfactual simulation.** Close one or many nodes. Nodes turn ember red, with congestion change, walking time, evacuation status, cascade size, a cascade tree and knock-on effects on neighbouring nodes. A before and after view plays the change side by side.
- **Time of day.** A slider changes node activity, plus an optional heatmap and moving flow particles along the dependency arcs.
- **Evacuate.** Fire, monsoon flood, power cut and crowd surge. Compares the official plan with the shadow-aware plan, draws both routes on the map and suggests signage.
- **Ask.** Type a question such as "What happens if Connaught Place closes?" and get simulator numbers, with the nodes highlighted on the map.
- **Report.** One-tap crowd reports appear as dots in shadow mode. Free-text reports are parsed into dependency arcs.
- **Insights.** Early warning for a degrading node, interventions ranked by cost against impact, and a printable brief for facility managers (Export PDF).
- **Trust controls.** Confirm or reject each discovered node, with undo.

## Places covered

IIT Delhi, DU North Campus, AIIMS, JNU, Connaught Place, Chandni Chowk, New Delhi Station, Kashmere Gate, Sarojini Nagar, Lajpat Nagar, Karol Bagh, Nehru Place, Anand Vihar. An **All Delhi** chip zooms out to see every node at once, and the search bar is bounded to Delhi.

## Tech stack

- React 18, TypeScript, Vite
- MapLibre GL with OpenFreeMap vector tiles and 3D buildings
- Deck.gl for the shadow layer (columns, arcs, rings, heatmap, paths, text)
- Nominatim for search, bounded to Delhi
- Fonts: Bricolage Grotesque and Instrument Sans

## Run locally

```bash
npm install
npm run dev
```

Open the address Vite prints in the terminal (usually `http://localhost:5173`). If another dev server already uses that port, Vite picks the next free one, so use the address it shows.

Build for production with `npm run build`. The output goes to `dist`. Map tiles and search need an internet connection.

## Project structure

```
src/
  App.tsx       Map, Deck.gl layers, lamp switch, search, dock
  Screens.tsx   Evacuate, Ask, Report and Insights screens
  Panels.tsx    Node panel and the before and after view
  data.ts       13 places and 43 hidden nodes (simulated)
  meta.ts       Activity by hour, source mix, knock-on logic
  styles.css    Theme and layout
```

## Design

Ink indigo, bone-paper panels, lamp amber for hidden nodes, and ember red only for damage. The interface is mobile-first, the lamp switch is keyboard accessible, reduced motion is respected, and the Official or Shadow state is always visible.

## Limitations

- The hidden nodes are hard-coded demo data, not discovered from real movement or OpenStreetMap queries yet.
- Simulation, cascades, early warnings and costs are rule-based and simulated. There is no live sensor feed and no backend.
- Ask and the report parser match keywords. They do not use a language model yet.
- Evacuation routes are straight lines between points, not snapped to real roads.
- Coordinates are approximate and should be checked on the real map.

## Roadmap

- **Next:** discovery engine on real footfall and OpenStreetMap data, Claude tool-calling for Ask and report parsing, live sensor integration, a mobile crowdsourcing app.
- **Later:** more cities, a hospital pilot, an API for municipal planners, BIM and GIS integration.

## Privacy by design

UMBRA is designed around aggregated counts only: no individual tracking, no face or device IDs. The real pipeline is intended to add minimum cell sizes (k-anonymity) and differential-privacy noise to all outputs. The demo uses no personal data.
