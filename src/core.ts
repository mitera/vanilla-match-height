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
}

// Max difference in px between the tops of two elements on the same row
const ROW_ERROR_THRESHOLD = 1;

/**
 * Matches the height of groups of elements inside a container.
 *
 * Usable on its own (`new MatchHeight(container, options)`) or through
 * `element.matchHeight(options)`, which the default entry point adds to `HTMLElement`.
 */
export class MatchHeight {

    wrapEl: HTMLElement;
    settings: MatchHeightSettings & { property: string };
    _remains: MatchHeightItem[] = [];
    /** Unthrottled update, used for DOMContentLoaded and load */
    _handler?: () => void;
    /**
     * Update bound to resize and orientationchange (throttled when `throttle` > 0).
     * Not set with `events: false`; declared as always present to keep the 2.x type.
     */
    _bind!: () => void;
    _deferTimer?: ReturnType<typeof setTimeout>;

    /**
     * @param {HTMLElement} wrapEl - The container in which the elements are searched.
     * @param {MatchHeightSettings} settings - Optional options.
     */
    constructor(wrapEl: HTMLElement, settings?: MatchHeightSettings | null) {
        if (!wrapEl || typeof wrapEl.querySelectorAll !== 'function') {
            throw new TypeError('MatchHeight: wrapEl must be a DOM element');
        }
        this.wrapEl = wrapEl;

        // Default settings
        const default_settings: MatchHeightSettings = {
            elements: null,
            byRow: true,
            target: null,
            attributeName: null,
            attributeValue: null,
            property: 'height',
            remove: null,
            dataApi: true,
            events: true,
            throttle: 80,
            beforeUpdate: null,
            afterUpdate: null
        };

        const merged: MatchHeightSettings = {...default_settings, ...settings};

        // Accept camelCase property names (e.g. 'minHeight'): style.setProperty() requires kebab-case.
        // Only a lowercase-to-uppercase boundary starts a new word, so 'HEIGHT' or 'Height' become 'height'.
        let property = String(merged.property || 'height').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        if (!this._validateProperty(property)) {
            property = 'height';
        }
        // HTML attribute names are case-insensitive
        if (merged.attributeName) {
            merged.attributeName = merged.attributeName.toLowerCase();
        }
        this.settings = {...merged, property};

        if (this.settings.events) {
            const update = this._handler = this._applyAll.bind(this);
            if (document.readyState !== 'loading') {
                this._applyAll();
            } else {
                document.addEventListener('DOMContentLoaded', update, { once: true });
            }
            // Images and other media may change the layout after DOMContentLoaded
            if (document.readyState !== 'complete') {
                window.addEventListener('load', update, { once: true });
            }
            if (this.settings.throttle && this.settings.throttle > 0) {
                this._bind = this._throttle(update, this.settings.throttle);
            } else {
                this._bind = update;
            }
            this._init();
        }
    }

    /**
     * Binds the resize and orientationchange listeners.
     */
    _init(): void {
        if (!this._bind) return;

        window.addEventListener("resize", this._bind);

        window.addEventListener("orientationchange", this._bind);
    }

    /**
     * Removes the resize/orientationchange listeners, the pending page load updates
     * and any deferred throttled update.
     */
    _unbind(): void {
        if (this._bind) {
            window.removeEventListener("resize", this._bind);

            window.removeEventListener("orientationchange", this._bind);
        }

        if (this._handler) {
            document.removeEventListener("DOMContentLoaded", this._handler);
            window.removeEventListener("load", this._handler);
        }
        clearTimeout(this._deferTimer);
    }

    /**
     * Limits the rate at which `fn` runs: at most once every `threshold` ms,
     * with a trailing call so that the last event is always applied.
     */
    _throttle(fn: () => void, threshold: number): () => void {
        let last: number;
        return () => {
            const now = Date.now();
            if (last && now < last + threshold) {
                // The timer lives on the instance so that _unbind() can cancel it
                clearTimeout(this._deferTimer);
                this._deferTimer = setTimeout(() => {
                    last = now;
                    fn();
                }, threshold);
            }
            else {
                last = now;
                fn();
            }
        };
    }

    /**
     * Applies the `elements` (or `attributeName`/`attributeValue`) group and the data API groups,
     * with the beforeUpdate/afterUpdate callbacks.
     */
    _applyAll(): void {
        if (this.settings.beforeUpdate) {
            this.settings.beforeUpdate();
        }

        this._apply();
        if (this.settings.attributeName && this._validateAttributeName(this.settings.attributeName)) {
            this._applyDataApi(this.settings.attributeName);
        }
        // Disable on all but one of the instances sharing a container, so the default groups are matched only once
        if (this.settings.dataApi) {
            this._applyDataApi('data-match-height');
            this._applyDataApi('data-mh');
        }

        if (this.settings.afterUpdate) {
            this.settings.afterUpdate();
        }
    }

    /**
     * Checks that a CSS property name can be used with style.setProperty().
     */
    _validateProperty(value?: string | null): RegExpMatchArray | null {
        return String(value)
            .match(
                /^([a-z-]{2,})$/
            );
    }

    /**
     * Validates an attribute name before it is used, unquoted, in a selector.
     * Unlike CSS property names, attribute names may contain digits and
     * underscores (e.g. `data-mh2`, `data-match_height`).
     */
    _validateAttributeName(value?: string | null): boolean {
        return /^[a-z_][a-z0-9_-]*$/i.test(String(value));
    }

    /**
     * Matches the elements that have the `attributeName` attribute, grouped by its value.
     */
    _applyDataApi(attributeName: string): void {
        const elements: HTMLElement[] = Array.from(this.wrapEl.querySelectorAll<HTMLElement>('[' + attributeName + ']'));
        elements.forEach((item) => {
            this._resetStyle(item, this.settings.property);
        });

        const groups: Map<string, HTMLElement[]> = new Map();
        elements.forEach((el) => {
            const groupId = el.getAttribute(attributeName);
            if (groupId) {
                if (!groups.has(groupId)) {
                    groups.set(groupId, []);
                }
                groups.get(groupId)!.push(el);
            }
        });

        // Apply once per unique group instead of once per element
        groups.forEach((elements) => {
            this._update(elements);
        });
    }

    /**
     * Resets the inline style property of the `elements` (or `attributeName`/`attributeValue`) group.
     * Groups of the data API are not reset.
     */
    _remove(): void {
        let $elements: HTMLElement[] = [];
        const opts = this.settings;
        if (opts.elements && opts.elements.trim() != '') {
            $elements = Array.from(this.wrapEl.querySelectorAll<HTMLElement>(opts.elements));
        } else {
            if (opts.attributeName && this._validateAttributeName(opts.attributeName) && opts.attributeValue) {
                $elements = Array.from(this.wrapEl.querySelectorAll<HTMLElement>(this._attributeSelector(opts.attributeName, opts.attributeValue)));
            }
        }
        $elements.forEach((item) => {
            item.style.setProperty(opts.property, '');
            if (item.getAttribute('style') === '') item.removeAttribute('style');
        });
    }

    /**
     * Matches the `elements` (or `attributeName`/`attributeValue`) group.
     */
    _apply(): void {
        const opts = this.settings;
        let elements: HTMLElement[] = [];
        if (opts.elements && opts.elements.trim() != '') {
            elements = Array.from(this.wrapEl.querySelectorAll<HTMLElement>(opts.elements));
        } else {
            if (opts.attributeName && this._validateAttributeName(opts.attributeName) && opts.attributeValue && opts.attributeValue.trim() != '') {
                elements = Array.from(this.wrapEl.querySelectorAll<HTMLElement>(this._attributeSelector(opts.attributeName, opts.attributeValue)));
            }
        }
        this._update(elements);
    }

    /**
     * Builds an attribute selector, escaping the value so that quotes or
     * backslashes cannot break the selector syntax.
     */
    _attributeSelector(attributeName: string, attributeValue: string): string {
        // CSS.escape() is missing in some environments (e.g. jsdom): escaping quotes,
        // backslashes and line breaks is enough inside a quoted string
        const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
            ? CSS.escape(attributeValue)
            : String(attributeValue)
                .replace(/["\\]/g, '\\$&')
                .replace(/[\n\r\f]/g, (c) => '\\' + c.charCodeAt(0).toString(16) + ' ');
        return '[' + attributeName + '="' + escaped + '"]';
    }

    /**
     * Resets and matches a group of elements.
     */
    _update(elements: HTMLElement[]): void {
        if (elements.length === 0) return;

        this._remains = elements.map((el): MatchHeightItem => ({ el, top: 0, height: 0 }));
        // remove all height before
        this._remains.forEach((item) => {
            this._resetStyle(item.el, this.settings.property);
        });

        // Hidden elements (display: none, also through an ancestor) have no box to match
        this._remains = this._remains.filter((item) => item.el.getClientRects().length > 0);
        if (this._remains.length === 0) return;

        this._process();
    }

    /**
     * Matches `_remains` one row at a time.
     */
    _process(): void {

        // One row per iteration: positions are measured again because matching a row can move the next ones
        while (this._remains.length > 0) {

            this._remains.forEach((item) => {

                const bb = item.el.getBoundingClientRect();

                item.top    = this.settings.byRow ? bb.top : 0;
                item.height = bb.height;

            });

            this._remains.sort((a, b) => a.top - b.top);

            const processingTop = this._remains[0].top;
            const processingTargets = this._remains.filter((item) => Math.abs(item.top - processingTop) <= ROW_ERROR_THRESHOLD);
            this._remains.splice(0, processingTargets.length);

            // Removed elements must not contribute to the row height
            const matchingTargets = processingTargets.filter((item) => !this._isRemoved(item.el));

            // A single element has nothing to match with: keep its natural height
            if (!this.settings.target && matchingTargets.length < 2) continue;

            let maxHeightInRow = 0;
            if (this.settings.target) maxHeightInRow = this.settings.target.getBoundingClientRect().height;
            else maxHeightInRow = Math.max(...matchingTargets.map((item) => item.height));

            matchingTargets.forEach((item) => {

                const styles = window.getComputedStyle(item.el);
                const isBorderBox = styles.boxSizing === 'border-box';

                if (isBorderBox) {

                    item.el.style.setProperty(this.settings.property, `${maxHeightInRow}px`);

                } else {
                    const paddingAndBorder =
                        (parseFloat(styles.paddingTop) || 0) +
                        (parseFloat(styles.paddingBottom) || 0) +
                        (parseFloat(styles.borderTopWidth) || 0) +
                        (parseFloat(styles.borderBottomWidth) || 0);
                    item.el.style.setProperty(this.settings.property, `${Math.max(0, maxHeightInRow - paddingAndBorder)}px`);
                }
            });

        }
    }

    /**
     * Checks whether an element is excluded through the `remove` setting.
     */
    _isRemoved(el: HTMLElement): boolean {
        const remove = this.settings.remove;
        if (!remove) return false;
        if (remove instanceof NodeList || Array.isArray(remove)) return Array.prototype.indexOf.call(remove, el) !== -1;
        return remove === el;
    }

    /**
     * Resets the inline style property of an element, dropping an empty `style` attribute.
     */
    _resetStyle($that: HTMLElement, property: string): void {
        if (this._validateProperty(property)) {
            $that.style.setProperty(property, '');
            if ($that.getAttribute('style') === '') $that.removeAttribute('style');
        }
    }
}

export default MatchHeight;
