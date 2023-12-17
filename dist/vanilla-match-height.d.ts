/**
 * vanilla-match-height v1.1.2 by @mitera
 * Simone Miterangelis <simone@mite.it>
 * License: MIT
 */
interface HTMLElement {
    matchHeight(arg0: Settings): MatchHeight;
}
interface MatchHeight {
    wrapEl: HTMLElement;
    settings: Settings;
    _bind(): void;
    _merge(o1: Settings, o2: Settings): Settings;
    _init(): void;
    _unbind(): void;
    _throttle(fn: Function, threshold: number): () => void;
    _applyAll($this: MatchHeight): void;
    _validateProperty(value: string): RegExpMatchArray | null;
    _parse(value: string): number;
    _rows(elements: [HTMLElement]): HTMLElement[][];
    _applyDataApi(property: string): void;
    _remove(): void;
    _apply(): void;
    _resetStyle($that: HTMLElement, property: string): void;
}
interface Settings {
    elements?: string;
    byRow: boolean;
    target?: HTMLElement;
    attributeName?: string;
    attributeValue?: string;
    property?: string;
    remove?: HTMLElement;
    events: boolean;
    throttle: number;
}
