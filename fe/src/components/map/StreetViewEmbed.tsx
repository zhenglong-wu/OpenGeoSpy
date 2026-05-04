import { useEffect, useMemo, useState } from 'react';

interface StreetViewEmbedProps {
  latitude: number;
  longitude: number;
}

interface MapillaryImage {
  id: string;
  image_url: string;
  thumb_url: string;
  lat: number;
  lon: number;
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function StreetViewEmbed({ latitude, longitude }: StreetViewEmbedProps) {
  const valid = useMemo(() => isValidCoordinate(latitude, longitude), [latitude, longitude]);

  const [images, setImages] = useState<MapillaryImage[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setActiveIdx(0);

    fetch(`/api/mapillary/nearby?lat=${latitude}&lon=${longitude}&radius=500&limit=8`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setImages(data.images ?? []);
      })
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, valid]);

  if (!valid) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden p-4 text-xs text-gray-500">
        Invalid coordinates — provide valid lat/lng to view street imagery.
      </div>
    );
  }

  const active = images[activeIdx];
  const distance = active ? haversineMeters(latitude, longitude, active.lat, active.lon) : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Street View Comparison</h3>
          <p className="text-[11px] text-gray-500 font-mono">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        </div>
        <a
          href={`https://www.mapillary.com/app/?lat=${latitude}&lng=${longitude}&z=17`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
        >
          Open in Mapillary →
        </a>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-xs text-gray-400">
          Loading nearby imagery…
        </div>
      )}

      {!loading && error && (
        <div className="p-4 text-xs text-red-600">Failed to load: {error}</div>
      )}

      {!loading && !error && images.length === 0 && (
        <div className="p-4 text-xs text-gray-500">
          No Mapillary imagery found within 500m of these coordinates.
        </div>
      )}

      {!loading && active && (
        <>
          <div className="relative bg-gray-900" style={{ paddingBottom: '56.25%' }}>
            <img
              src={active.image_url}
              alt={`Mapillary view at ${active.lat}, ${active.lon}`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
              {distance.toFixed(0)}m from prediction
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-1 overflow-x-auto p-2 bg-gray-50">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                    i === activeIdx ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={img.thumb_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
