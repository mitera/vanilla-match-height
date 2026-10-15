/**
 * vanilla-match-height v2.1.0 by @mitera
 * Simone Miterangelis <simone@mite.it>
 * License: MIT
 */
interface HTMLElement {
    matchHeight(settings?: MatchHeightSettings): MatchHeight;
}
interface MatchHeight {
    _remains: MatchHeightItem[];
    wrapEl: HTMLElement;
    settings: MatchHeightSettings;
    _handler?: () => void;
    _deferTimer?: ReturnType<typeof setTimeout>;
    _bind(): void;
    _init(): void;
    _unbind(): void;
    _throttle(fn: Function, threshold: number): () => void;
    _applyAll(): void;
    _validateProperty(value?: string | null): RegExpMatchArray | null;
    _validateAttributeName(value?: string | null): boolean;
    _applyDataApi(property: string): void;
    _remove(): void;
    _apply(): void;
    _resetStyle($that: HTMLElement, property: string): void;
    _update(elements: HTMLElement[]): void;
    _process(): void;
    _isRemoved(el: HTMLElement): boolean;
    _attributeSelector(attributeName: string, attributeValue: string): string;
}
interface MatchHeightSettings {
    elements?: string | null;
    byRow?: boolean | null;
    target?: HTMLElement | null;
    attributeName?: string | null;
    attributeValue?: string | null;
    property?: string | null;
    remove?: HTMLElement | NodeList | HTMLElement[] | null;
    events?: boolean | null;
    throttle?: number | null;
    beforeUpdate?: (() => void) | null;
    afterUpdate?: (() => void) | null;
}
type MatchHeightItem = {
    el: HTMLElement;
    top: number;
    height: number;
};
