import type { LiquidCoolingDesign } from "@/lib/liquid-cooling-design";

export function LoopDiagram({ diagram }: { diagram: LiquidCoolingDesign["diagram"] }) {
  return <figure className="loop-fig" data-motion={diagram.enabled ? "on" : "off"}>
    {diagram.mode === "image" && diagram.image.asset.url ? <img src={diagram.image.asset.url} alt={diagram.image.alt} width="620" height="350" /> :
      <svg viewBox="0 0 620 350" role="img" aria-label={diagram.accessibleLabel}>
        <defs><marker id="lc-flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--diagram-line)" /></marker></defs>
        <rect x="100" y="88" width="420" height="152" rx="10" fill="none" stroke="var(--diagram-line)" strokeWidth="1.4" />
        <rect x="100" y="88" width="420" height="152" rx="10" fill="none" stroke="var(--teal-hi)" strokeWidth="1.6" className="flow" />
        <g fill="var(--hero-muted)" fontFamily="var(--editorial-font)" fontSize="11.5">
          <text x="260" y="158" textAnchor="middle" fontSize="13">{diagram.loop}</text>
          <text x="260" y="180" textAnchor="middle" fontSize="10.5">{diagram.coolant}</text>
          <text x="100" y="35">{diagram.cdu}</text>
          <text x="450" y="100" textAnchor="middle" fontSize="10.5">{diagram.plates}</text>
          <text x="155" y="80" textAnchor="end" fontSize="10">{diagram.supply}</text>
          <text x="484" y="232" fontSize="10">{diagram.return}</text>
        </g>
        <line x1="118" y1="44" x2="118" y2="88" stroke="var(--diagram-line)" />
        <g stroke="var(--diagram-line)" fill="var(--ink-2)">{[108,140,172,204].map(y=><rect key={y} x="404" y={y} width="92" height="18" />)}</g>
        <line x1="220" y1="88" x2="280" y2="88" stroke="var(--diagram-line)" markerEnd="url(#lc-flow-arrow)" />
        <line x1="480" y1="240" x2="400" y2="240" stroke="var(--diagram-line)" markerEnd="url(#lc-flow-arrow)" />
        <g fontFamily="var(--editorial-font)" fontSize="11" fill="var(--hero-muted)">
          {[
            {cx:196,cy:88,n:"01",label:diagram.ph,tx:196,ty:64},
            {cx:322,cy:88,n:"02",label:diagram.conductivity,tx:322,ty:64},
            {cx:196,cy:240,n:"03",label:diagram.turbidity,tx:196,ty:270},
            {cx:322,cy:240,n:"04",label:diagram.particles,tx:322,ty:221},
          ].map(point=><g key={point.n}><circle cx={point.cx} cy={point.cy} r="15" fill="var(--ink-2)" stroke="var(--teal-hi)" strokeWidth="1.4" /><text x={point.cx} y={point.cy+4} textAnchor="middle" fill="var(--teal-hi)" fontSize="10">{point.n}</text><text x={point.tx} y={point.ty} textAnchor="middle">{point.label}</text></g>)}
        </g>
        <line x1="322" y1="255" x2="322" y2="290" stroke="var(--diagram-line)" strokeDasharray="3 4" />
        <rect x="240" y="290" width="174" height="42" fill="var(--ink-2)" stroke="var(--diagram-line)" />
        <g fontFamily="var(--editorial-font)" textAnchor="middle" fill="var(--hero-muted)"><text x="327" y="307" fontSize="11">{diagram.sampling}</text><text x="327" y="324" fontSize="9.5">{diagram.samplingNote}</text></g>
        <g stroke="var(--diagram-line)">{[117,149,181,213].map(y=><line key={y} x1="404" y1={y} x2="380" y2={y} />)}</g>
      </svg>}
    {!(diagram.mode === "image" && diagram.image.asset.url) && <div className="loop-mobile-legend">
      <ul className="loop-mobile-sensors">
        {[diagram.ph, diagram.conductivity, diagram.turbidity, diagram.particles].map((label, index) => <li key={index}><b>{String(index + 1).padStart(2, "0")}</b><span>{label}</span></li>)}
      </ul>
      <p>{diagram.cdu}</p>
      <p>{diagram.loop} · {diagram.coolant}</p>
      <p>{diagram.supply} → {diagram.plates} → {diagram.return}</p>
      <p>{diagram.sampling}<br />{diagram.samplingNote}</p>
    </div>}
    <figcaption>{diagram.caption}</figcaption>
  </figure>;
}
