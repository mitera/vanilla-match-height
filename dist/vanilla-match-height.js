"use strict";
/**
 * vanilla-match-height v2.1.0 by @mitera
 * Simone Miterangelis <simone@mite.it>
 * License: MIT
 */
(function () {
    /**
     * Extends the HTMLElement prototype with a method named `matchHeight`.
     *
     * This method adjusts the height of the element to match the height of the tallest element in a collection of associated elements.
     *
     * The elements to "match height" with are typically determined by the context in which the method is invoked,
     * such as sibling elements or elements in the same container.
     *
     * It ensures consistent heights for elements in flexible layouts, improving visual alignment and design structure.
     *
     * Note: This method does not remove or reset inline height styles. Use caution to avoid conflicts with pre-existing styles.
     */
    HTMLElement.prototype.matchHeight = function (settings) {
        // @ts-ignore
        return new MatchHeight(this, settings);
    };
    /**
     * Constructs a new MatchHeight instance.
     *
     * @param {HTMLElement} wrapEl - The parent element within which child elements will have their heights matched.
     * @param {MatchHeightSettings} settings - An object containing configuration options for the MatchHeight instance, such as elements to select, row-type matching, and event handling.
     * @return {void} This function does not return a value; it initializes a new instance of the MatchHeight class.
     */
    function MatchHeight(wrapEl, settings) {
        this.wrapEl = wrapEl;
        this._remains = [];
        // Default settings
        let default_settings = {
            elements: null,
            byRow: true,
            target: null,
            attributeName: null,
            attributeValue: null,
            property: 'height',
            remove: null,
            events: true,
            throttle: 80,
            beforeUpdate: null,
            afterUpdate: null
        };
        this.settings = Object.assign(Object.assign({}, default_settings), settings);
        // Accept camelCase property names (e.g. 'minHeight'): style.setProperty() requires kebab-case
        this.settings.property = String(this.settings.property || 'height').replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
        if (!this._validateProperty(this.settings.property)) {
            this.settings.property = 'height';
        }
        // HTML attribute names are case-insensitive
        if (this.settings.attributeName) {
            this.settings.attributeName = this.settings.attributeName.toLowerCase();
        }
        if (this.settings.events) {
            const update = this._handler = this._applyAll.bind(this);
            if (document.readyState !== 'loading') {
                this._applyAll();
            }
            else {
                document.addEventListener('DOMContentLoaded', update, { once: true });
            }
            // Images and other media may change the layout after DOMContentLoaded
            if (document.readyState !== 'complete') {
                window.addEventListener('load', update, { once: true });
            }
            if (this.settings.throttle && this.settings.throttle > 0) {
                this._bind = this._throttle(update, this.settings.throttle);
            }
            else {
                this._bind = update;
            }
            this._init();
        }
    }
    /**
     * Initializes the MatchHeight instance by setting up necessary
     * configurations or bindings to ensure the height matching functionality.
     * This method is typically used internally during the setup process.
     *
     * @private
     */
    MatchHeight.prototype._init = function () {
        window.addEventListener("resize", this._bind);
        window.addEventListener("orientationchange", this._bind);
    };
    /**
     * Unbinds all MatchHeight event listeners from the target elements.
     *
     * This method removes all associated events such as resize listeners or scroll listeners
     * that were previously bound by the MatchHeight functionality. It ensures that the
     * target elements are no longer affected by the MatchHeight behavior, preventing
     * further updates or recalculations.
     *
     * Use this method when you no longer need MatchHeight to handle the height equalization
     * of the elements, or before completely removing the associated DOM elements from the page.
     */
    MatchHeight.prototype._unbind = function () {
        window.removeEventListener("resize", this._bind);
        window.removeEventListener("orientationchange", this._bind);
        // Also drop the pending page-load updates and any deferred throttled call
        if (this._handler) {
            document.removeEventListener("DOMContentLoaded", this._handler);
            window.removeEventListener("load", this._handler);
        }
        clearTimeout(this._deferTimer);
    };
    /**
     * A utility function designed to limit the rate at which a given function is executed.
     * This method ensures that the specified function is triggered at most once within
     * a defined time period determined by the provided delay duration.
     *
     * @param {Function} callback - The function to be throttled. It will only execute
     * once per delay interval regardless of how often it is invoked.
     * @param {number} delay - The time interval, specified in milliseconds, during
     * which repeated function calls will be ignored after the initial execution.
     * @returns {Function} - A new function that wraps the original callback and enforces
     * the throttle behavior, allowing controlled execution within the given delay.
     */
    MatchHeight.prototype._throttle = function (fn, threshold) {
        let last;
        // The timer lives on the instance so that _unbind() can cancel it
        const self = this;
        return function () {
            const now = Date.now();
            if (last && now < last + threshold) {
                clearTimeout(self._deferTimer);
                self._deferTimer = setTimeout(function () {
                    last = now;
                    fn();
                }, threshold);
            }
            else {
                last = now;
                fn();
            }
        };
    };
    /**
     * Applies the height matching functionality to all elements managed by the MatchHeight instance.
     *
     * This method calculates and sets the maximum height for each group of elements
     * that share the same context, ensuring a uniform height across the group.
     *
     * The function iterates through each group of elements, computes the tallest height
     * among them, and applies that height to all elements within the group.
     *
     * It is typically invoked to synchronize the heights of elements
     * after initialization or when elements are updated dynamically.
     */
    MatchHeight.prototype._applyAll = function () {
        if (this.settings && this.settings.beforeUpdate) {
            this.settings.beforeUpdate();
        }
        this._apply();
        if (this.settings.attributeName && this._validateProperty(this.settings.attributeName)) {
            this._applyDataApi(this.settings.attributeName);
        }
        this._applyDataApi('data-match-height');
        this._applyDataApi('data-mh');
        if (this.settings && this.settings.afterUpdate) {
            this.settings.afterUpdate();
        }
    };
    /**
     * Validates the given property to ensure it exists and is valid for use
     * in the MatchHeight functionality. This method checks if the property is
     * allowed and conforms to expected types or values for processing height
     * matching.
     *
     * @private
     * @param {string} property - The property to validate.
     * @returns {boolean} True if the property is valid, otherwise false.
     */
    MatchHeight.prototype._validateProperty = function (value) {
        return String(value)
            .match(/^([a-z-]{2,})$/);
    };
    /**
     * Applies the match height functionality to all elements
     * found in the DOM that use the `data-match-height` attribute.
     * The method selects such elements and applies the match
     * height logic to ensure consistent height across groups.
     *
     * This function is intended to be triggered automatically
     * and processes elements with matching data attributes,
     * grouping them by their attribute values and applying
     * equal height adjustments.
     *
     * @param {String} attributeName
     */
    MatchHeight.prototype._applyDataApi = function (attributeName) {
        let elements = Array.from(this.wrapEl.querySelectorAll('[' + attributeName + ']'));
        elements.forEach((item) => {
            this._resetStyle(item, this.settings.property);
        });
        const groups = new Map();
        elements.forEach((el) => {
            const groupId = el.getAttribute(attributeName);
            if (groupId) {
                if (!groups.has(groupId)) {
                    groups.set(groupId, []);
                }
                groups.get(groupId).push(el);
            }
        });
        // Apply once per unique group instead of once per element
        groups.forEach((elements) => {
            this._update(elements);
        });
    };
    /**
     * Removes the match height functionality from the elements.
     *
     * This function iterates through the selected elements and resets
     * their inline styles that were applied to set equal heights.
     * It ensures that the DOM elements revert to their original height styles.
     *
     * @private
     */
    MatchHeight.prototype._remove = function () {
        let $elements = [];
        let opts = this.settings;
        if (opts.elements) {
            $elements = Array.from(this.wrapEl.querySelectorAll(opts.elements));
        }
        else {
            if (opts.attributeName && this._validateProperty(opts.attributeName) && opts.attributeValue) {
                $elements = Array.from(this.wrapEl.querySelectorAll(this._attributeSelector(opts.attributeName, opts.attributeValue)));
            }
        }
        $elements.forEach((item) => {
            item.style.setProperty(opts.property, '');
            if (item.getAttribute('style') === '')
                item.removeAttribute('style');
        });
    };
    /**
     * Applies the match height functionality to the set of elements.
     * This method calculates the maximum height among the group of elements
     * and adjusts each element's height to match the maximum. It ensures that all
     * selected elements within the context of the MatchHeight instance appear with
     * consistent height.
     *
     * This method takes into account any existing styles, box model properties,
     * such as padding and borders, to ensure accurate height calculations if needed.
     *
     * It is typically used internally to enforce height equality in the associated
     * elements.
     */
    MatchHeight.prototype._apply = function () {
        let opts = this.settings;
        let elements = [];
        if (opts.elements && opts.elements.trim() != '') {
            elements = Array.from(this.wrapEl.querySelectorAll(opts.elements));
        }
        else {
            if (opts.attributeName && this._validateProperty(opts.attributeName) && opts.attributeValue && opts.attributeValue.trim() != '') {
                elements = Array.from(this.wrapEl.querySelectorAll(this._attributeSelector(opts.attributeName, opts.attributeValue)));
            }
        }
        this._update(elements);
    };
    /**
     * Builds an attribute selector, escaping the value so that quotes or
     * backslashes cannot break the selector syntax.
     *
     * @private
     * @param {String} attributeName - A name already checked by `_validateProperty`.
     * @param {String} attributeValue - An arbitrary value.
     * @returns {String} The `[name="value"]` selector.
     */
    MatchHeight.prototype._attributeSelector = function (attributeName, attributeValue) {
        return '[' + attributeName + '="' + CSS.escape(attributeValue) + '"]';
    };
    /**
     * Updates the height of elements in the MatchHeight instance.
     * This function recalculates and applies the matching height
     * logic to the target elements based on their current visibility,
     * size, and any applied options. It ensures that the elements
     * are properly aligned and maintain consistent heights.
     *
     * This method is usually called internally when the heights need
     * to be refreshed, for example, after a window resize or content
     * change.
     *
     * The height update takes into account any groupings, overrides,
     * or custom configurations provided to the MatchHeight instance.
     */
    MatchHeight.prototype._update = function (elements) {
        if (elements.length === 0)
            return;
        this._remains = Array.prototype.map.call(elements, (el) => {
            return {
                el,
                top: 0,
                height: 0
            };
        });
        // remove all height before
        this._remains.forEach((item) => {
            this._resetStyle(item.el, this.settings.property);
        });
        // Hidden elements (display: none, also through an ancestor) have no box to match
        this._remains = this._remains.filter((item) => item.el.getClientRects().length > 0);
        if (this._remains.length === 0)
            return;
        this._process();
    };
    /**
     * Processes the elements provided to the MatchHeight instance and determines
     * the height adjustment required to make all the elements have the same height.
     * This method calculates the maximum height among a group of elements and
     * applies it uniformly to maintain consistency in their appearance.
     *
     * This method is typically used when dynamic height adjustments
     * are required to ensure a uniform layout for elements with varying heights.
     * Internal logic includes checking constraints, grouping elements, and
     * calculating corresponding height adjustments while avoiding unnecessary DOM changes.
     *
     * @private
     */
    MatchHeight.prototype._process = function () {
        const errorThreshold = 1;
        // One row per iteration: positions are measured again because matching a row can move the next ones
        while (this._remains.length > 0) {
            this._remains.forEach((item) => {
                const bb = item.el.getBoundingClientRect();
                item.top = this.settings.byRow ? bb.top : 0;
                item.height = bb.height;
            });
            this._remains.sort((a, b) => a.top - b.top);
            const processingTop = this._remains[0].top;
            const processingTargets = this._remains.filter((item) => Math.abs(item.top - processingTop) <= errorThreshold);
            this._remains.splice(0, processingTargets.length);
            // Removed elements must not contribute to the row height
            const matchingTargets = processingTargets.filter((item) => !this._isRemoved(item.el));
            // A single element has nothing to match with: keep its natural height
            if (!this.settings.target && matchingTargets.length < 2)
                continue;
            let maxHeightInRow = 0;
            if (this.settings.target)
                maxHeightInRow = this.settings.target.getBoundingClientRect().height;
            else
                maxHeightInRow = Math.max(...matchingTargets.map((item) => item.height));
            matchingTargets.forEach((item) => {
                const styles = window.getComputedStyle(item.el);
                const isBorderBox = styles.boxSizing === 'border-box';
                if (isBorderBox) {
                    if (this.settings.property)
                        item.el.style.setProperty(this.settings.property, `${maxHeightInRow}px`);
                }
                else {
                    const paddingAndBorder = (parseFloat(styles.paddingTop) || 0) +
                        (parseFloat(styles.paddingBottom) || 0) +
                        (parseFloat(styles.borderTopWidth) || 0) +
                        (parseFloat(styles.borderBottomWidth) || 0);
                    if (this.settings.property)
                        item.el.style.setProperty(this.settings.property, `${Math.max(0, maxHeightInRow - paddingAndBorder)}px`);
                }
            });
        }
    };
    /**
     * Checks whether an element is excluded through the `remove` setting.
     *
     * @private
     * @param {HTMLElement} el
     * @returns {boolean} True if the element must keep its natural height.
     */
    MatchHeight.prototype._isRemoved = function (el) {
        const remove = this.settings.remove;
        if (!remove)
            return false;
        if (remove instanceof NodeList || Array.isArray(remove))
            return Array.prototype.indexOf.call(remove, el) !== -1;
        return remove === el;
    };
    /**
     * Resets the inline styles applied to the elements previously adjusted
     * for matching height. This method ensures that the height-related
     * adjustments such as min-height, height, or padding are removed,
     * reverting the elements to their original styles.
     *
     * @param {HTMLElement} $that
     * @param {String} property
     */
    MatchHeight.prototype._resetStyle = function ($that, property) {
        if (this._validateProperty(property)) {
            $that.style.setProperty(property, '');
            if ($that.getAttribute('style') === '')
                $that.removeAttribute('style');
        }
    };
})();
