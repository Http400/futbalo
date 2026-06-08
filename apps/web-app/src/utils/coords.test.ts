import { describe, it, expect } from 'vitest';
import { parseDmsCoords } from './coords';

describe('parseDmsCoords', () => {
  describe('null / empty inputs', () => {
    it('returns null for null', () => {
      expect(parseDmsCoords(null)).toBeNull();
    });

    it('returns null for undefined', () => {
      expect(parseDmsCoords(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseDmsCoords('')).toBeNull();
    });

    it('returns null for an unrecognised format', () => {
      expect(parseDmsCoords('not a coordinate')).toBeNull();
    });
  });

  describe('DMS format (degrees°minutes\'seconds"direction)', () => {
    it('parses a standard N/W DMS coord (Estadio Azteca)', () => {
      const result = parseDmsCoords('19°18\'11"N 99°09\'02"W');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(19.303, 2);
      expect(result!.lng).toBeCloseTo(-99.150, 2);
    });

    it('parses DMS with single-digit minutes and seconds (Arrowhead)', () => {
      const result = parseDmsCoords('39°2\'56"N 94°29\'2"W');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(39.049, 2);
      expect(result!.lng).toBeCloseTo(-94.484, 2);
    });

    it('parses DMS with decimal seconds (MetLife Stadium)', () => {
      const result = parseDmsCoords('40°48\'48.7"N 74°4\'27.7"W');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(40.813, 2);
      expect(result!.lng).toBeCloseTo(-74.074, 2);
    });

    it('returns negative lat for S hemisphere', () => {
      const result = parseDmsCoords('33°52\'0"S 151°12\'36"E');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeLessThan(0);
      expect(result!.lng).toBeGreaterThan(0);
    });

    it('returns positive lng for E hemisphere', () => {
      const result = parseDmsCoords('51°33\'21"N 0°6\'45"E');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(51.556, 2);
      expect(result!.lng).toBeCloseTo(0.113, 2);
    });

    it('parses zero-minute / zero-second coord (BMO Field)', () => {
      const result = parseDmsCoords('43°38\'0"N 79°25\'07"W');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(43.633, 2);
      expect(result!.lng).toBeCloseTo(-79.419, 2);
    });
  });

  describe('decimal degree format (degrees°direction)', () => {
    it('parses decimal N/W (Gillette Stadium / Boston)', () => {
      const result = parseDmsCoords('42.091°N 71.264°W');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(42.091, 3);
      expect(result!.lng).toBeCloseTo(-71.264, 3);
    });

    it('parses decimal N/W (Levi\'s Stadium / San Francisco)', () => {
      const result = parseDmsCoords('37.403°N 121.970°W');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(37.403, 3);
      expect(result!.lng).toBeCloseTo(-121.970, 3);
    });

    it('parses decimal N/W (SoFi Stadium / Los Angeles)', () => {
      const result = parseDmsCoords('33.953°N 118.339°W');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(33.953, 3);
      expect(result!.lng).toBeCloseTo(-118.339, 3);
    });

    it('returns negative lat for S hemisphere', () => {
      const result = parseDmsCoords('33.868°S 151.207°E');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(-33.868, 3);
      expect(result!.lng).toBeCloseTo(151.207, 3);
    });
  });
});
