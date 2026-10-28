import { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import world from "world-atlas/countries-110m.json";
import "./components-feature.css";

type VisitorLocation = {
  coordinates: [number, number];
  city: string | null;
  country: string | null;
};

const GRENADA: [number, number] = [-61.68, 12.12];

function parseLocation(value: unknown): VisitorLocation | null {
  if (!value || typeof value !== "object") return null;
  const location = value as Record<string, unknown>;
  const point = location.coordinates;
  if (
    location.available === false ||
    !Array.isArray(point) ||
    point.length !== 2 ||
    !point.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate)) ||
    Math.abs(point[0]) > 180 ||
    Math.abs(point[1]) > 90
  ) return null;

  return {
    coordinates: [point[0], point[1]],
    city: typeof location.city === "string" ? location.city : null,
    country: typeof location.country === "string" ? location.country : null,
  };
}

export default function FanMap() {
  const [visitor, setVisitor] = useState<VisitorLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 6000);

    fetch("/api/location", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((location) => { if (active) setVisitor(parseLocation(location)); })
      .catch(() => {})
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const visitorName = visitor
    ? [visitor.city, visitor.country].filter(Boolean).join(", ") || "Your corner of the world"
    : null;

  return (
    <div className="fan-map">
      <div className="fan-map__surface">
        <ComposableMap
          width={800}
          height={380}
          projection="geoEqualEarth"
          projectionConfig={{ scale: 145, center: [0, 8] }}
          role="img"
          aria-label={`World map showing JXXMAL's home in Grenada${visitorName ? ` and your approximate location: ${visitorName}` : ""}.`}
          className="fan-map__svg"
        >
          <Geographies geography={world}>
            {({ geographies }: { geographies: Array<{ rsmKey: string; properties: Record<string, unknown> }> }) =>
              geographies.map((geography) => (
                <Geography
                  key={geography.rsmKey}
                  geography={geography}
                  fill="#252825"
                  stroke="#0b0c0c"
                  strokeWidth={0.7}
                  tabIndex={-1}
                  style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }}
                />
              ))
            }
          </Geographies>
          <Marker coordinates={GRENADA}>
            <circle r={11} fill="#d7ff3f" opacity={0.12} />
            <circle r={4} fill="#d7ff3f" stroke="#0b0c0c" strokeWidth={1.5} />
            <text x={10} y={-11} className="fan-map__origin-label">GRENADA</text>
          </Marker>
          {visitor && (
            <Marker coordinates={visitor.coordinates}>
              <circle r={12} className="fan-map__pulse" fill="none" stroke="#f4f2ea" strokeWidth={1} />
              <circle r={4} fill="#f4f2ea" stroke="#0b0c0c" strokeWidth={1.5} />
            </Marker>
          )}
        </ComposableMap>
      </div>
      <div className="fan-map__caption">
        <div className="fan-map__legend">
          <span><i className="fan-map__key fan-map__key--home" /> Artist's home</span>
          {visitor && <span><i className="fan-map__key fan-map__key--visitor" /> You're here, approximately</span>}
        </div>
        <p aria-live="polite">
          {loading
            ? "Finding your corner of the world…"
            : visitorName
              ? `You're visiting from ${visitorName}. Approximate location, shown only for this visit.`
              : "From Grenada to the world. Your approximate location isn't available for this visit."}
        </p>
      </div>
    </div>
  );
}
