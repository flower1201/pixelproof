export { compareImages, comparePrepared } from './core/compare.js';
export { runCompare } from './app/run-compare.js';
export { capturePage, closeSharedBrowser } from './capture/chromium.js';
export { renderHtmlReport } from './report/render-html.js';
export { renderFixInstructions } from './report/render-markdown.js';
export type {
  CompareOptions,
  CompareResult,
  DifferenceRegion,
  InputSource,
  Size,
} from './core/types.js';
export { ENGINE_VERSION } from './version.js';
export {
  EXIT,
  PixelProofError,
  formatError,
  type ExitCode,
  type PixelProofErrorCode,
} from './shared/errors.js';
