"use strict";
/**
 * vanilla-match-height v1.2.1 by @mitera
 * Simone Miterangelis <simone@mite.it>
 * License: MIT
 */
(function () {
    // Extend the element method
    HTMLElement.prototype.matchHeight = function (settings) {
        // @ts-ignore
        return new MatchHeight(this, settings);
    };
    /**
     * matchHeight
     *
     * @param {HTMLElement} wrapEl
     * @param {Settings} settings
     * constructor
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
            throttle: 80
        };
        this.settings = Object.assign(Object.assign({}, default_settings), settings);
        if (!this._validateProperty(this.settings.property)) {
            this.settings.property = 'height';
        }
        if (this.settings.events) {
            var $this = this;
            this._bind = function () { $this._applyAll($this); };
            if (document.readyState !== 'loading') {
                this._bind();
                console.log("a");
            }
            else {
                document.addEventListener('DOMContentLoaded', this._bind, { once: true });
                console.log("b");
            }
            if (this.settings.throttle > 0)
                this._bind = this._throttle(this._bind, this.settings.throttle);
            this._init();
        }
    }
    /**
     * Initialize the application
     */
    MatchHeight.prototype._init = function () {
        window.addEventListener("resize", this._bind);
        window.addEventListener("orientationchange", this._bind);
    };
    /**
     * Unbind events
     */
    MatchHeight.prototype._unbind = function () {
        window.removeEventListener("resize", this._bind);
        window.removeEventListener("orientationchange", this._bind);
    };
    /**
     * Merge two objects
     *
     * @param {Settings} o1 Object 1
     * @param {Settings} o2 Object 2
     * @return {Settings}
     */
    MatchHeight.prototype._merge = function (o1, o2) {
        if (o1 != null) {
            for (var i in o1) {
                o2[i] = o1[i];
            }
        }
        return o2;
    };
    /**
     * _throttle
     * Throttle updates
     * @param {function} fn
     * @param {int} threshold
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
     * _applyAll
     * Initialize the common events
     * @param {MatchHeight} $this
     */
    MatchHeight.prototype._applyAll = function ($this) {
        if ($this == null) {
            $this = this;
        }
        $this._apply();
        if ($this.settings.attributeName && $this._validateProperty($this.settings.attributeName)) {
            $this._applyDataApi($this.settings.attributeName);
        }
        $this._applyDataApi('data-match-height');
        $this._applyDataApi('data-mh');
    };
    /**
     * _validateProperty
     * handle plugin options
     * @param {String} value
     */
    MatchHeight.prototype._validateProperty = function (value) {
        return String(value)
            .toLowerCase()
            .match(/^([a-z-]{2,})$/);
    };
    /**
     * _parse
     * handle plugin options
     * @param {String} value
     */
    MatchHeight.prototype._parse = function (value) {
        // parse value and convert NaN to 0
        return parseFloat(value) || 0;
    };
    /**
     * _rows
     * utility function returns array of selections representing each row
     * (as displayed after float wrapping applied by browser)
     * @param {Array} elements
     */
    MatchHeight.prototype._rows = function (elements) {
        var $this = this;
        var tolerance = 1, lastTop = -1, listRows = [], rows = [];
        // group elements by their top position
        elements.forEach(($that) => {
            var top = $that.getBoundingClientRect().top - $this._parse(window.getComputedStyle($that).getPropertyValue('margin-top'));
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
     * _applyDataApi
     * applies matchHeight to all elements with a data-match-height attribute
     * @param {String} property
     */
    MatchHeight.prototype._applyDataApi = function (property) {
        var $this = this;
        var $row = this.wrapEl.querySelectorAll('[' + property + ']');
        // generate groups by their groupId set by elements using data-match-height
        $row.forEach(($el) => {
            var groupId = $el.getAttribute(property);
            $this.settings = $this._merge({ attributeName: property, attributeValue: groupId }, $this.settings);
            $this._apply();
        });
    };
    /**
     *  _remove
     *  remove matchHeight to given elements
     */
    MatchHeight.prototype._remove = function () {
        var $elements = [];
        var opts = this.settings;
        if (opts.elements) {
            $elements = this.wrapEl.querySelectorAll(opts.elements);
        }
        else {
            if (opts.attributeName && opts.attributeValue) {
                $elements = this.wrapEl.querySelectorAll('[' + opts.attributeName + '="' + opts.attributeValue + '"]');
            }
        }
        $elements.forEach((item) => {
            item.style.setProperty(opts.property, '');
            if (item.getAttribute('style') === '')
                item.removeAttribute('style');
        });
    };
    /**
     *  _apply
     *  apply matchHeight to given elements
     */
    MatchHeight.prototype._apply = function () {
        var $this = this;
        var opts = $this.settings;
        var $elements = [];
        if (opts.elements && opts.elements.trim() != '') {
            $elements = this.wrapEl.querySelectorAll(opts.elements);
        }
        else {
            if (opts.attributeName && $this._validateProperty(opts.attributeName) && opts.attributeValue && opts.attributeValue.trim() != '') {
                $elements = this.wrapEl.querySelectorAll('[' + opts.attributeName + '="' + opts.attributeValue + '"]');
            }
        }
        var rows = [$elements];
        // get rows if using byRow, otherwise assume one row
        if (opts.byRow && !opts.target) {
            // must first force an arbitrary equal height so floating elements break evenly
            $elements.forEach(($that) => {
                var display = window.getComputedStyle($that).getPropertyValue('display');
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
            var targetHeight = 0;
            if (!opts.target) {
                // skip apply to rows with only one item
                if (opts.byRow && $row.length <= 1) {
                    $row.forEach(($that) => {
                        $this._resetStyle($that, opts.property);
                    });
                    return;
                }
                // iterate the row and find the max height
                $row.forEach(($that) => {
                    var style = $that.getAttribute('style') || '', display = window.getComputedStyle($that).getPropertyValue('display');
                    // temporarily force a usable display value
                    if (display && (display !== 'inline-block' && display !== 'flex' && display !== 'inline-flex')) {
                        display = 'block';
                    }
                    // ensure we get the correct actual height (and not a previously set height value)
                    $that.setAttribute('style', 'display: ' + display + ';');
                    // find the max height (including padding, but not margin)
                    var isTarget = true;
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
                var verticalPadding = 0;
                // don't apply to a target
                if (opts.target && $that === opts.target) {
                    return;
                }
                // handle padding and border correctly (required when not using border-box)
                verticalPadding = $this._parse(window.getComputedStyle($that).getPropertyValue('padding-top')) +
                    $this._parse(window.getComputedStyle($that).getPropertyValue('padding-bottom')) +
                    $this._parse(window.getComputedStyle($that).getPropertyValue('border-top-width')) +
                    $this._parse(window.getComputedStyle($that).getPropertyValue('border-bottom-width'));
                // set the height (accounting for padding and border)
                $that.style.setProperty(opts.property, (targetHeight - verticalPadding) + 'px');
                if ($that.getBoundingClientRect().height < targetHeight) {
                    $that.style.setProperty(opts.property, targetHeight + 'px');
                }
                if (opts.remove) {
                    if (opts.remove instanceof NodeList) {
                        opts.remove.forEach(($el) => {
                            if ($that === $el) {
                                $this._resetStyle($el, opts.property);
                            }
                        });
                    }
                    else {
                        if ($that === opts.remove) {
                            $this._resetStyle($that, opts.property);
                        }
                    }
                }
            });
        });
    };
    /**
     *  _resetStyle
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
