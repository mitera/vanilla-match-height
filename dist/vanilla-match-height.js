"use strict";
/**
 * vanilla-match-height v2.0.0 by @mitera
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
     * @param {Settings} settings - An object containing configuration options for the MatchHeight instance, such as elements to select, row-type matching, and event handling.
     * @return {void} This function does not return a value; it initializes a new instance of the MatchHeight class.
     */
    function MatchHeight(wrapEl, settings) {
        this.wrapEl = wrapEl;
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
        if (!this._validateProperty(this.settings.property)) {
            this.settings.property = 'height';
        }
        if (this.settings.events) {
            const update = this._applyAll.bind(this);
            if (document.readyState !== 'loading') {
                this._applyAll();
            }
            else {
                document.addEventListener('DOMContentLoaded', update, { once: true });
            }
            if (this.settings.throttle && this.settings.throttle > 0) {
                this._bind = this._throttle(update, this.settings.throttle);
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
    };
    /**
     * Merges the specified elements' heights into a single maximum height
     * value. This method adjusts the heights of the elements it processes
     * to ensure uniformity across the group.
     *
     * @private
     * @param {HTMLElement[]} elements - An array of DOM elements whose heights are to be merged.
     * @param {number[]} heights - An array of heights corresponding to the elements.
     * @return {void}
     */
    MatchHeight.prototype._merge = function (o1, o2) {
        if (o1 != null) {
            for (let i in o1) {
                o2[i] = o1[i];
            }
        }
        return o2;
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
        let last, deferTimer;
        return function () {
            const now = Date.now();
            if (last && now < last + threshold) {
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function () {
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
            .toLowerCase()
            .match(/^([a-z-]{2,})$/);
    };
    /**
     * Parses the elements that need to be matched for height.
     * This method iterates through a collection of elements,
     * converts their relevant height-related data into an array of objects,
     * and prepares the data for further processing.
     *
     * @private
     * @param {NodeList | HTMLElement[]} elements - A collection of DOM elements whose heights need to be matched.
     * @returns {Object[]} - An array of objects where each object contains the DOM element
     *                       and its calculated height details.
     */
    MatchHeight.prototype._parse = function (value) {
        // parse value and convert NaN to 0
        return parseFloat(value) || 0;
    };
    /**
     * An internal property used to store an array of rows within the MatchHeight instance.
     * Each row is represented by a group of DOM elements that should have their heights matched.
     * This property is dynamically populated and updated based on the current layout and grouping logic.
     * It plays a critical role in determining the height adjustments applied to the elements.
     *
     * @type {Array<Array<Element>>}
     * @private
     */
    MatchHeight.prototype._rows = function (elements) {
        let tolerance = 1, lastTop = -1, listRows = [], rows = [];
        // group elements by their top position
        elements.forEach(($that) => {
            let top = $that.getBoundingClientRect().top - this._parse(window.getComputedStyle($that).getPropertyValue('margin-top'));
            // if the row top is the same, add to the row group
            if (lastTop != -1 && Math.floor(Math.abs(lastTop - top)) >= tolerance) {
                listRows.push(rows);
                rows = [];
                lastTop = -1;
            }
            rows.push($that);
            // keep track of the last row top
            lastTop = top;
        });
        listRows.push(rows);
        return listRows;
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
     * @param {String} property
     */
    MatchHeight.prototype._applyDataApi = function (property) {
        let $row = Array.from(this.wrapEl.querySelectorAll('[' + property + ']'));
        // generate groups by their groupId set by elements using data-match-height
        $row.forEach(($el) => {
            let groupId = $el.getAttribute(property);
            this.settings = this._merge({ attributeName: property, attributeValue: groupId }, this.settings);
            this._apply();
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
            if (opts.attributeName && opts.attributeValue) {
                $elements = Array.from(this.wrapEl.querySelectorAll('[' + opts.attributeName + '="' + opts.attributeValue + '"]'));
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
        let $elements = [];
        if (opts.elements && opts.elements.trim() != '') {
            $elements = Array.from(this.wrapEl.querySelectorAll(opts.elements));
        }
        else {
            if (opts.attributeName && this._validateProperty(opts.attributeName) && opts.attributeValue && opts.attributeValue.trim() != '') {
                $elements = Array.from(this.wrapEl.querySelectorAll('[' + opts.attributeName + '="' + opts.attributeValue + '"]'));
            }
        }
        let rows = [$elements];
        // get rows if using byRow, otherwise assume one row
        if (opts.byRow && !opts.target) {
            // must first force an arbitrary equal height so floating elements break evenly
            $elements.forEach(($that) => {
                let display = window.getComputedStyle($that).getPropertyValue('display');
                // temporarily force a usable display value
                if (display && (display !== 'inline-block' && display !== 'flex' && display !== 'inline-flex')) {
                    display = 'display: block; ';
                }
                // cache the original inline style
                $that.setAttribute('style-cache', $that.getAttribute('style') || '');
                // reset style
                $that.setAttribute('style', display + 'padding-top: 0; padding-bottom: 0; margin-top: 0; margin-bottom: 0; border-top-width: 0; border-bottom-width: 0; height: 100px; overflow: hidden;');
            });
            // get the array of rows (based on element top position)
            rows = this._rows($elements);
            // revert original inline styles
            $elements.forEach(($that) => {
                $that.setAttribute('style', $that.getAttribute('style-cache') || '');
                $that.removeAttribute('style-cache');
                if ($that.getAttribute('style') === '')
                    $that.removeAttribute('style');
            });
        }
        rows.forEach(($row) => {
            let targetHeight = 0;
            if (!opts.target) {
                // skip apply to rows with only one item
                if (opts.byRow && $row.length <= 1) {
                    $row.forEach(($that) => {
                        this._resetStyle($that, opts.property);
                    });
                    return;
                }
                // iterate the row and find the max height
                $row.forEach(($that) => {
                    let style = $that.getAttribute('style') || '', display = window.getComputedStyle($that).getPropertyValue('display');
                    // temporarily force a usable display value
                    if (display && (display !== 'inline-block' && display !== 'flex' && display !== 'inline-flex')) {
                        display = 'block';
                    }
                    // ensure we get the correct actual height (and not a previously set height value)
                    $that.setAttribute('style', 'display: ' + display + ';');
                    // find the max height (including padding, but not margin)
                    let isTarget = true;
                    if (opts.remove) {
                        if (opts.remove instanceof NodeList) {
                            opts.remove.forEach(($el) => {
                                if ($that === $el) {
                                    isTarget = false;
                                }
                            });
                        }
                        else {
                            if ($that === opts.remove) {
                                isTarget = false;
                            }
                        }
                    }
                    if (isTarget) {
                        if ($that.getBoundingClientRect().height > targetHeight) {
                            targetHeight = $that.getBoundingClientRect().height;
                        }
                    }
                    // revert styles
                    if (style) {
                        $that.setAttribute('style', style);
                    }
                    else {
                        $that.style.setProperty('display', '');
                    }
                    if ($that.getAttribute('style') === '')
                        $that.removeAttribute('style');
                });
            }
            else {
                // if target set, use the height of the target element
                targetHeight = opts.target.getBoundingClientRect().height;
            }
            // iterate the row and apply the height to all elements
            $row.forEach(($that) => {
                let verticalPadding = 0;
                // don't apply to a target
                if (opts.target && $that === opts.target) {
                    return;
                }
                // handle padding and border correctly (required when not using border-box)
                verticalPadding = this._parse(window.getComputedStyle($that).getPropertyValue('padding-top')) +
                    this._parse(window.getComputedStyle($that).getPropertyValue('padding-bottom')) +
                    this._parse(window.getComputedStyle($that).getPropertyValue('border-top-width')) +
                    this._parse(window.getComputedStyle($that).getPropertyValue('border-bottom-width'));
                // set the height (accounting for padding and border)
                $that.style.setProperty(opts.property, (targetHeight - verticalPadding) + 'px');
                if ($that.getBoundingClientRect().height < targetHeight) {
                    $that.style.setProperty(opts.property, targetHeight + 'px');
                }
                if (opts.remove) {
                    if (opts.remove instanceof NodeList) {
                        let removedItems = Array.from(opts.remove);
                        removedItems.forEach(($el) => {
                            if ($that === $el) {
                                this._resetStyle($el, opts.property);
                            }
                        });
                    }
                    else {
                        if ($that === opts.remove) {
                            this._resetStyle($that, opts.property);
                        }
                    }
                }
            });
        });
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
