import { MatchHeight as MatchHeightClass } from './core';
import type { MatchHeightSettings as Settings, MatchHeightItem as Item } from './core';

export { MatchHeight } from './core';
export type { MatchHeightSettings, MatchHeightItem } from './core';

// Global names kept for the 2.x API: `import 'vanilla-match-height'` makes them available without an import
declare global {
    interface HTMLElement {
        matchHeight(settings?: Settings | null): MatchHeightClass;
    }
    type MatchHeightSettings = Settings;
    type MatchHeightItem = Item;
    type MatchHeight = MatchHeightClass;
}

/**
 * Adds `matchHeight()` to `HTMLElement`, so that `element.matchHeight(options)`
 * returns `new MatchHeight(element, options)`.
 * Called automatically by this entry point; `vanilla-match-height/core` does not call it.
 */
export function installMatchHeight(): void {
    // Nothing to extend outside the browser (e.g. server-side rendering)
    if (typeof HTMLElement === 'undefined') return;
    // Non-enumerable, like native methods: it does not show up in `for...in` on an element.
    // Still writable and configurable, so it can be overwritten as before.
    Object.defineProperty(HTMLElement.prototype, 'matchHeight', {
        value: function (this: HTMLElement, settings?: Settings | null) {
            return new MatchHeightClass(this, settings);
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}

installMatchHeight();

export default MatchHeightClass;
