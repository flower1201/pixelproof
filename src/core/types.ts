export type InputSource =
  | { kind: 'url'; url: string }
  | { kind: 'image'; path: string };

export type Size = { width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };

export type DifferenceRegion = {
  id: string;
  bounds: Rect;
  mismatchedPixels: number;
  areaPixels: number;
  mismatchDensity: number;
};

export type CompareOptions = {
  targetPath: string;
  actual: InputSource;
  outputDir: string;
  viewport?: Size;
  threshold: number;
  includeAA: boolean;
  failAbove?: number;
};

export type NormalizedImage = {
  width: number;
  height: number;
  /** RGBA 8-bit, length = width * height * 4 */
  data: Uint8ClampedArray;
};

export type PixelDiffResult = {
  mismatchedPixels: number;
  /** 1 byte per pixel: 1 = mismatch, 0 = match */
  mask: Uint8Array;
  /** RGBA PNG buffer for visual diff */
  diffPng: Buffer;
};

export type CompareMetrics = {
  totalPixels: number;
  mismatchedPixels: number;
  mismatchRatio: number;
  pixelMatchRatio: number;
};

export type CompareResult = {
  schemaVersion: '1.0';
  engineVersion: string;
  source: { kind: 'url' | 'image'; displayValue: string };
  image: Size;
  capture?: {
    browser: 'chromium';
    viewport: Size;
    dpr: 1;
  };
  metrics: CompareMetrics;
  config: {
    threshold: number;
    includeAA: boolean;
    failAbove?: number;
  };
  regions: DifferenceRegion[];
  warnings: string[];
  artifacts: {
    target: string;
    actual: string;
    diff: string;
    html: string;
    markdown: string;
  };
};
