export type Node = { id: number; place: string; name: string; type: string; pos: [number, number]; share: number; conf: number; fragility: number; cascade: string[] }
// Positions are approximate and all numbers are simulated demo data.
const T: Record<string, [string, string[]]> = {
 crossing: ['Median-gap crossing', ['Crossing blocked', 'Pedestrians spill onto carriageway', 'Vehicle queue builds', 'Late arrivals rise']],
 metro: ['Metro gate shortcut', ['Shortcut shut', 'Detour to main gate', 'Gate crowding', 'Corridor jam at peak hour']],
 chai: ['Chai stall hub', ['Stall closes', 'Meeting point lost', 'Footpath crowds', 'Nearby queues grow']],
 auto: ['Shared auto stand', ['Stand cleared', 'Riders walk to main road', 'Wait times rise']],
 tap: ['Shared tap', ['Tap dry', 'Long detour for water', 'Crowding at next source', 'Queues grow']],
 charge: ['Charging point', ['Socket fails', 'People move to nearby cafes', 'Seats fill up']],
 under: ['Underpass, waterlogs in monsoon', ['Underpass floods', 'Foot traffic moves to road', 'Vehicles stall', 'Evacuation route cut off']],
 vendor: ['Vendor information hub', ['Vendor leaves', 'People lose directions', 'Lane crowds', 'Crush risk rises']],
 bridge: ['Informal footbridge shortcut', ['Shortcut blocked', 'Crowd moves to main stairs', 'Platform crowding', 'Crush risk rises']],
}
export type Place = { c: [number, number]; z: number; nodes: [string, string, number, number, number, number, number][] }
// [name, type, dx, dy (1e-4 deg), share %, confidence %, fragility]
export const PLACES: Record<string, Place> = {
 'IIT Delhi': { c: [77.1926, 28.5450], z: 16, nodes: [['Aurobindo Marg median gap', 'crossing', 74, -20, 31, 87, 82], ['Hauz Khas metro gate shortcut', 'metro', 140, -16, 24, 91, 74], ['Chai hub behind the library', 'chai', -6, 5, 18, 83, 61], ['Shared auto stand, Gate 4', 'auto', 64, 25, 15, 78, 58], ['Shared tap, Block C', 'tap', -31, -10, 9, 88, 67], ['Charging point, reading room', 'charge', 9, -10, 11, 72, 49], ['Ring Road underpass', 'under', 84, -50, 27, 79, 88]] },
 'DU North Campus': { c: [77.2090, 28.6900], z: 16, nodes: [['Vishwavidyalaya metro exit shortcut', 'metro', 20, -30, 29, 90, 76], ['Chai stalls outside Arts Faculty', 'chai', -30, 10, 22, 85, 63], ['Shared e-rickshaw stand, Mall Road', 'auto', 40, 25, 17, 80, 59]] },
 'AIIMS': { c: [77.2090, 28.5672], z: 16, nodes: [['Ring Road median gap, AIIMS flyover', 'crossing', 15, -25, 33, 88, 85], ['Dharamshala tap outside Gate 1', 'tap', -20, 15, 14, 76, 66], ['Safdarjung subway', 'under', 30, -40, 26, 81, 84], ['Attendant charging point, emergency block', 'charge', 10, 10, 12, 70, 52]] },
 'JNU': { c: [77.1670, 28.5402], z: 16, nodes: [['Ber Sarai ring road crossing', 'crossing', 40, -20, 28, 84, 78], ['Dhaba hub near the main road', 'chai', -10, 15, 21, 82, 60], ['Shared auto stand, Munirka', 'auto', 55, 20, 16, 79, 57]] },
 'Connaught Place': { c: [77.2167, 28.6315], z: 16, nodes: [['Rajiv Chowk gate 7 shortcut', 'metro', 0, 0, 34, 92, 86], ['Palika Bazaar vendor hub', 'vendor', 15, -20, 25, 83, 70], ['Inner circle median gap', 'crossing', -25, 15, 22, 80, 72]] },
 'Chandni Chowk': { c: [77.2300, 28.6506], z: 16, nodes: [['Lane vendor information hub', 'vendor', 0, 0, 30, 86, 81], ['Metro gate shortcut', 'metro', -20, 10, 23, 89, 74], ['Fatehpuri chai hub', 'chai', 25, -15, 16, 78, 62]] },
 'New Delhi Station': { c: [77.2194, 28.6428], z: 16, nodes: [['Ajmeri Gate footbridge shortcut', 'bridge', 20, 10, 32, 87, 85], ['Paharganj auto stand', 'auto', -25, 10, 19, 81, 64], ['Platform 1 charging point', 'charge', 0, -10, 13, 74, 55]] },
 'Kashmere Gate': { c: [77.2288, 28.6675], z: 16, nodes: [['ISBT subway to metro', 'under', 0, 0, 31, 84, 83], ['Median gap near ISBT gate', 'crossing', 25, -15, 24, 80, 73], ['Chai hub at bus bay', 'chai', -20, 10, 15, 76, 58]] },
 'Sarojini Nagar': { c: [77.1985, 28.5755], z: 16, nodes: [['Market lane vendor hub', 'vendor', 0, 0, 29, 85, 79], ['Shared auto stand, Gate 2', 'auto', 25, -10, 18, 80, 60], ['Ring Road median gap', 'crossing', -20, 15, 21, 77, 70]] },
 'Lajpat Nagar': { c: [77.2430, 28.5677], z: 16, nodes: [['Central Market vendor hub', 'vendor', 0, 0, 28, 86, 77], ['Metro gate shortcut', 'metro', 20, 10, 25, 89, 72], ['Ring Road underpass', 'under', -25, -20, 27, 80, 86]] },
 'Karol Bagh': { c: [77.1900, 28.6519], z: 16, nodes: [['Ajmal Khan Road vendor hub', 'vendor', 0, 0, 30, 87, 80], ['Metro gate shortcut', 'metro', 20, -10, 22, 88, 70], ['Flyover median gap', 'crossing', -25, 10, 19, 78, 68]] },
 'Nehru Place': { c: [77.2510, 28.5491], z: 16, nodes: [['Computer market tap', 'tap', 0, 0, 12, 75, 63], ['Metro gate shortcut', 'metro', 25, 10, 27, 90, 75], ['Shared auto stand, Kalkaji', 'auto', -25, -10, 17, 79, 60], ['Chai hub near the market', 'chai', 10, -25, 14, 74, 56]] },
 'Anand Vihar': { c: [77.3150, 28.6469], z: 16, nodes: [['Skywalk to ISBT shortcut', 'bridge', 0, 0, 35, 88, 87], ['Shared e-rickshaw stand', 'auto', 25, -10, 20, 80, 65], ['Chai hub, rail side', 'chai', -20, 15, 14, 77, 59]] },
}
let id = 0
export const NODES: Node[] = Object.entries(PLACES).flatMap(([place, p]) => p.nodes.map(([name, k, dx, dy, share, conf, fragility]) => ({
 id: ++id, place, name, type: T[k][0], pos: [p.c[0] + dx * 1e-4, p.c[1] + dy * 1e-4] as [number, number], share, conf, fragility, cascade: T[k][1] })))
export const ARCS: [Node, Node][] = Object.keys(PLACES).flatMap(pl => { const g = NODES.filter(n => n.place === pl); return g.slice(1).map((n, i) => [g[i], n] as [Node, Node]) })
export const DELHI_VIEWBOX = '76.84,28.88,77.35,28.40'
export const CITY: { c: [number, number]; z: number } = { c: [77.22, 28.61], z: 10.6 }
