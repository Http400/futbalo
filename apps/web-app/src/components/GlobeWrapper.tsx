import { Globe } from '@futbalo/ui';
import type { GlobePoint } from '@futbalo/ui';
import type { Stadium } from '@futbalo/types';
import { useGetStadiumsQuery } from '../store/api/catalogApi';
import { parseDmsCoords } from '../utils/coords';

const GLOBE_SIZE = 1500;

function stadiumToGlobePoint(stadium: Stadium): GlobePoint | null {
  const coords = parseDmsCoords(stadium.coords);
  if (!coords) return null;
  return { id: stadium.id, label: stadium.city, lat: coords.lat, lng: coords.lng };
}

interface GlobeWrapperProps {
  externalFocusPoint?: { lat: number; lng: number } | null;
}

export const GlobeWrapper = ({ externalFocusPoint }: GlobeWrapperProps) => {
  const { data: stadiums = [] } = useGetStadiumsQuery();

  const points: GlobePoint[] = stadiums.flatMap((s) => {
    const point = stadiumToGlobePoint(s);
    return point ? [point] : [];
  });

  const focusPoint = externalFocusPoint
    ? { lat: externalFocusPoint.lat - 20, lng: externalFocusPoint.lng + 30 }
    : null;

  return (
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
        allowManualRotation={false}
        initialView={{ lat: 10, lng: -72 }}
      />
    </div>
  );
};
