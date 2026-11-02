/*!
 * vanilla-match-height v2.3.0 by @mitera
 * Simone Miterangelis <simone@mite.it>
 * License: MIT
 */
import { MatchHeight as MatchHeightClass } from './core';
import type { MatchHeightSettings as Settings, MatchHeightItem as Item } from './core';
export { MatchHeight } from './core';
export type { MatchHeightSettings, MatchHeightItem } from './core';
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
export declare function installMatchHeight(): void;
export default MatchHeightClass;
