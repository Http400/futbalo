/**
 * Parses a coordinate string into decimal lat/lng.
 * Supports two formats:
 *   - DMS:     `19°18'11"N 99°09'02"W`
 *   - Decimal: `42.091°N 71.264°W`
 * Returns null if the string is absent or doesn't match either format.
 */
export function parseDmsCoords(coords: string | undefined | null): { lat: number; lng: number } | null {
  if (!coords) return null;

  // DMS format: 19°18'11"N 99°09'02"W  (seconds may be decimal)
  const dmsMatch = coords.match(
    /(\d+)°(\d+)'(\d+(?:\.\d+)?)"([NS])\s+(\d+)°(\d+)'(\d+(?:\.\d+)?)"([EW])/
  );
  if (dmsMatch) {
    const [, latD, latM, latS, latDir, lngD, lngM, lngS, lngDir] = dmsMatch;
    if (!latD || !latM || !latS || !latDir || !lngD || !lngM || !lngS || !lngDir) return null;
    const lat =
      (parseInt(latD) + parseInt(latM) / 60 + parseFloat(latS) / 3600) *
      (latDir === 'S' ? -1 : 1);
    const lng =
      (parseInt(lngD) + parseInt(lngM) / 60 + parseFloat(lngS) / 3600) *
      (lngDir === 'W' ? -1 : 1);
    return { lat, lng };
  }

  // Decimal degree format: 42.091°N 71.264°W
  const decMatch = coords.match(
    /(\d+(?:\.\d+)?)°([NS])\s+(\d+(?:\.\d+)?)°([EW])/
  );
  if (decMatch) {
    const [, latVal, latDir, lngVal, lngDir] = decMatch;
    if (!latVal || !latDir || !lngVal || !lngDir) return null;
    const lat = parseFloat(latVal) * (latDir === 'S' ? -1 : 1);
    const lng = parseFloat(lngVal) * (lngDir === 'W' ? -1 : 1);
    return { lat, lng };
  }

  return null;
}
