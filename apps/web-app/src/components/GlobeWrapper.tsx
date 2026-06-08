import { Globe, GlobePoint } from '@futbalo/ui';
import { useState } from 'react';

const GLOBE_SIZE = 1500;

const SEED_POINTS: GlobePoint[] = [
  { id: 'vancouver', label: 'Vancouver', lat: 49.2767, lng: -123.1119 },
  { id: 'seattle', label: 'Seattle', lat: 47.5953, lng: -122.3317 },
  { id: 'san-francisco-bay-area', label: 'San Francisco Bay Area', lat: 37.4030, lng: -121.9700 },
  { id: 'los-angeles', label: 'Los Angeles', lat: 33.9530, lng: -118.3390 },
  { id: 'guadalajara', label: 'Guadalajara', lat: 20.6817, lng: -103.4628 },
  { id: 'mexico-city', label: 'Mexico City', lat: 19.3031, lng: -99.1506 },
  { id: 'monterrey', label: 'Monterrey', lat: 25.6692, lng: -100.2444 },
  { id: 'houston', label: 'Houston', lat: 29.6847, lng: -95.4108 },
  { id: 'dallas', label: 'Dallas', lat: 32.7478, lng: -97.0928 },
  { id: 'kansas-city', label: 'Kansas City', lat: 39.0489, lng: -94.4839 },
  { id: 'atlanta', label: 'Atlanta', lat: 33.7556, lng: -84.4000 },
  { id: 'miami', label: 'Miami', lat: 25.9581, lng: -80.2389 },
  { id: 'toronto', label: 'Toronto', lat: 43.6333, lng: -79.4186 },
  { id: 'boston', label: 'Boston', lat: 42.0910, lng: -71.2640 },
  { id: 'philadelphia', label: 'Philadelphia', lat: 39.9008, lng: -75.1675 },
  { id: 'new-york-new-jersey', label: 'New York/New Jersey', lat: 40.8135, lng: -74.0744 },
];

const getFocusPoint = (id: string | null): GlobePoint | null => {
  if (!id) return null
  const point = SEED_POINTS.find(p => p.id === id) ?? null
  if (!point) return null
  return {
    ...point,
    lat: point.lat - 20,
    lng: point.lng + 30,
  }
}

export const GlobeWrapper= () => {

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const focusPoint = getFocusPoint(selectedId)
  const points = SEED_POINTS.map(p => ({ ...p, size: p.id === selectedId ? 2 : 1 }))

  return (
    <>
    {/* {SEED_POINTS.map(point => {
          const isSelected = point.id === selectedId
          return (
            <div
              key={point.id}
              onClick={() => setSelectedId(isSelected ? null : point.id)}
              style={{
                color: isSelected ? '#0a4a8a' : '#1a3a5a',
                fontSize: '0.8rem',
                padding: '0.3rem 0.65rem',
                background: isSelected ? 'rgba(80,160,255,0.18)' : 'rgba(80,160,255,0.07)',
                border: isSelected ? '1px solid rgba(80,160,255,0.6)' : '1px solid rgba(80,160,255,0.2)',
                borderRadius: 5,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {point.label}
            </div>
          )
        })} */}
    <div style={{
        position: 'absolute',
        right: `-${GLOBE_SIZE * 0.45}px`,
        bottom: `-${GLOBE_SIZE * 0.55}px`,
    }}>
      
        <Globe
          points={points}
          width={GLOBE_SIZE}
          height={GLOBE_SIZE}
          focusPoint={focusPoint}
          fadeSpeed={0}
          autoRotate={false}
          initialView={{ lat: 10, lng: -72 }}
          />
      </div>
          </>
  );
};