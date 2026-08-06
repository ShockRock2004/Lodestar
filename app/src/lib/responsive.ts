import { useWindowDimensions } from 'react-native';

// Single source of truth for phone-vs-tablet layout.
// Pixel 7A ~ 411dp wide (phone) → single column, full width.
// Tab S9 FE+ landscape ~ 1536dp wide (tablet) → centered content, multi-column.
export type Responsive = {
  width: number;
  height: number;
  isTablet: boolean;
  isWide: boolean; // room for 3 columns
  cols: 1 | 2 | 3;
  contentW: number; // max centered content width
  gridCols: number; // day-tile grid columns
};

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 720;
  const isWide = width >= 1080;
  const cols: 1 | 2 | 3 = isWide ? 3 : isTablet ? 2 : 1;
  // On tablet keep content in a readable centered band rather than full-bleed.
  const contentW = isTablet ? Math.min(width - 48, 1180) : width;
  const gridCols = isWide ? 7 : isTablet ? 5 : 3;
  return { width, height, isTablet, isWide, cols, contentW, gridCols };
}
