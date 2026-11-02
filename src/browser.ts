// Entry point of the <script> / require() build (dist/vanilla-match-height.js): adds
// HTMLElement.prototype.matchHeight, as in 2.x, and exposes the class as `window.MatchHeight`.
// scripts/build.mjs wraps the CommonJS output so that it also runs as a plain <script>.
import { MatchHeight } from './vanilla-match-height';

export { MatchHeight, installMatchHeight } from './vanilla-match-height';
export default MatchHeight;

// Do not overwrite an existing global (e.g. module-match-height on the same page)
if (typeof window !== 'undefined' && !('MatchHeight' in window)) {
    (window as unknown as { MatchHeight: typeof MatchHeight }).MatchHeight = MatchHeight;
}
