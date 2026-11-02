/*!
 * vanilla-match-height v2.3.0 by @mitera
 * Simone Miterangelis <simone@mite.it>
 * License: MIT
 */
/**
 * Options of a MatchHeight instance.
 */
export interface MatchHeightSettings {
    elements?: string | null;
    byRow?: boolean | null;
    target?: HTMLElement | null;
    attributeName?: string | null;
    attributeValue?: string | null;
    property?: string | null;
    remove?: HTMLElement | NodeList | HTMLElement[] | null;
    dataApi?: boolean | null;
    events?: boolean | null;
    throttle?: number | null;
    beforeUpdate?: (() => void) | null;
    afterUpdate?: (() => void) | null;
}
export type MatchHeightItem = {
    el: HTMLElement;
    top: number;
    height: number;
};
/**
 * Matches the height of groups of elements inside a container.
 *
 * Usable on its own (`new MatchHeight(container, options)`) or through
 * `element.matchHeight(options)`, which the default entry point adds to `HTMLElement`.
 */
export declare class MatchHeight {
    wrapEl: HTMLElement;
    settings: MatchHeightSettings & {
        property: string;
    };
    _remains: MatchHeightItem[];
    /** Unthrottled update, used for DOMContentLoaded and load */
    _handler?: () => void;
    /**
     * Update bound to resize and orientationchange (throttled when `throttle` > 0).
     * Not set with `events: false`; declared as always present to keep the 2.x type.
     */
    _bind: () => void;
    _deferTimer?: ReturnType<typeof setTimeout>;
    /**
     * @param {HTMLElement} wrapEl - The container in which the elements are searched.
     * @param {MatchHeightSettings} settings - Optional options.
     */
    constructor(wrapEl: HTMLElement, settings?: MatchHeightSettings | null);
    /**
     * Binds the resize and orientationchange listeners.
     */
    _init(): void;
    /**
     * Removes the resize/orientationchange listeners, the pending page load updates
     * and any deferred throttled update.
     */
    _unbind(): void;
    /**
     * Limits the rate at which `fn` runs: at most once every `threshold` ms,
     * with a trailing call so that the last event is always applied.
     */
    _throttle(fn: () => void, threshold: number): () => void;
    /**
     * Applies the `elements` (or `attributeName`/`attributeValue`) group and the data API groups,
     * with the beforeUpdate/afterUpdate callbacks.
     */
    _applyAll(): void;
    /**
     * Checks that a CSS property name can be used with style.setProperty().
     */
    _validateProperty(value?: string | null): RegExpMatchArray | null;
    /**
     * Validates an attribute name before it is used, unquoted, in a selector.
     * Unlike CSS property names, attribute names may contain digits and
     * underscores (e.g. `data-mh2`, `data-match_height`).
     */
    _validateAttributeName(value?: string | null): boolean;
    /**
     * Matches the elements that have the `attributeName` attribute, grouped by its value.
     */
    _applyDataApi(attributeName: string): void;
    /**
     * Resets the inline style property of the `elements` (or `attributeName`/`attributeValue`) group.
     * Groups of the data API are not reset.
     */
    _remove(): void;
    /**
     * Matches the `elements` (or `attributeName`/`attributeValue`) group.
     */
    _apply(): void;
    /**
     * Builds an attribute selector, escaping the value so that quotes or
     * backslashes cannot break the selector syntax.
     */
    _attributeSelector(attributeName: string, attributeValue: string): string;
    /**
     * Resets and matches a group of elements.
     */
    _update(elements: HTMLElement[]): void;
    /**
     * Matches `_remains` one row at a time.
     */
    _process(): void;
    /**
     * Checks whether an element is excluded through the `remove` setting.
     */
    _isRemoved(el: HTMLElement): boolean;
    /**
     * Resets the inline style property of an element, dropping an empty `style` attribute.
     */
    _resetStyle($that: HTMLElement, property: string): void;
}
export default MatchHeight;
