/**
 * vanilla-match-height v2.1.0 by @mitera
 * Simone Miterangelis <simone@mite.it>
 * License: MIT
 */
interface HTMLElement {
    matchHeight(settings?: Settings): MatchHeight;
}
interface MatchHeight {
    _remains: Item[];
    wrapEl: HTMLElement;
    settings: Settings;
    _bind(): void;
    _merge(o1: Settings, o2: Settings): Settings;
    _init(): void;
    _unbind(): void;
    _throttle(fn: Function, threshold: number): () => void;
    _applyAll(): void;
    _validateProperty(value?: string | null): RegExpMatchArray | null;
    _parse(value: string): number;
    _rows(elements: HTMLElement[]): HTMLElement[][];
    _applyDataApi(property: string): void;
    _remove(): void;
    _apply(): void;
    _resetStyle($that: HTMLElement, property: string): void;
}
interface Settings {
    elements?: string | null;
    byRow?: boolean | null;
    target?: HTMLElement | null;
    attributeName?: string | null;
    attributeValue?: string | null;
    property: string;
    remove?: HTMLElement | null;
    events?: boolean | null;
    throttle?: number | null;
    beforeUpdate?: any | null;
    afterUpdate?: any | null;
}
type Item = {
    el: HTMLElement;
    top: number;
    height: number;
    attribute: string;
};
