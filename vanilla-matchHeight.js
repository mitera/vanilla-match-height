/**
 * vanilla-match-height master by @mitera
 * Simone Miterangelis <simone@mite.it>
 * License: MIT
 */

(function(){
    'use strict';

    // Extend the element method
    Element.prototype.matchHeight = function(settings) {
        return new MatchHeight(this, settings);
    }

    /**
     * Merge two objects
     *
     * @param {Object} o1 Object 1
     * @param {Object} o2 Object 2
     * @return {Object}
     */
    if (typeof Object.merge != 'function') {
        Object.merge = function(o1, o2) {
            for (var i in o1) {
                o2[i] = o1[i];
            }
            return o2;
        }
    }

    /**
     * matchHeight
     *
     * @param {Elements} elements
     * @param {Array} settings
     * constructor
     */
    function MatchHeight(wrapEl, settings) {
        this.wrapEl = wrapEl;

        // Default settings
        let default_settings = {
            elements: '',
            byRow: true,
            target: null,
            attributeName: null,
            attributeValue: null,
            property: 'height',
            remove: null
        }

        if (settings != null)
            settings = Object.merge(settings, default_settings);
        else
            settings = default_settings;

        settings.property = this._dashToCamel(settings.property);

        this._init(settings);
    }

    /**
     * Initialize the application
     */
    MatchHeight.prototype._init = function(settings) {

        var $this = this;

        document.addEventListener("DOMContentLoaded", function(event) {
            $this._apply(settings);
            $this._applyDataApi('data-match-height', settings);
            $this._applyDataApi('data-mh', settings);
        });

        window.addEventListener("resize", function(event) {
            $this._apply(settings);
            $this._applyDataApi('data-match-height', settings);
            $this._applyDataApi('data-mh', settings);
        });
    }

    MatchHeight.prototype._parse = function(value) {
        // parse value and convert NaN to 0
        return parseFloat(value) || 0;
    }


    /*
    *  _rows
    *  utility function returns array of selections representing each row
    *  (as displayed after float wrapping applied by browser)
    */
    MatchHeight.prototype._rows = function(elements) {
        var $this = this;
        var tolerance = 1,
            $elements = elements,
            lastTop = null,
            listRows = [],
            rows = [];

        // group elements by their top position
        $elements.forEach(($that) => {

            var top = $that.getBoundingClientRect().top - $this._parse($that.style.marginTop);

            // if the row top is the same, add to the row group
            if (lastTop != null && Math.floor(Math.abs(lastTop - top)) >= tolerance) {
                listRows.push(rows);
                rows = [];
                lastTop = null;
                rows.push($that);
            } else {
                rows.push($that);
            }

            // keep track of the last row top
            lastTop = top;
        });
        listRows.push(rows);

        return listRows;
    }

    MatchHeight.prototype._dashToCamel = function(input) {
        return input.toLowerCase().replace(/-(.)/g, function(match, group1) {
            return group1.toUpperCase();
        });
    }

    /*
      *  matchHeight._applyDataApi
      *  applies matchHeight to all elements with a data-match-height attribute
      */

    MatchHeight.prototype._applyDataApi = function(property, settings) {
        var groups = [];
        var $this = this;

        var $row = this.wrapEl.querySelectorAll('[' + property + ']');
        // generate groups by their groupId set by elements using data-match-height
        $row.forEach(($el) => {
            var groupId = $el.getAttribute(property);
            settings = Object.merge({attributeName: property, attributeValue: groupId}, settings);
            $this._apply(settings);
        });
    };

    /*
    *  matchHeight._apply
    *  apply matchHeight to given elements
    */
    MatchHeight.prototype._apply = function(opts) {

        var $this = this;
        var $elements = []
        if (opts.elements) {
            $elements = this.wrapEl.querySelectorAll(opts.elements);
        } else {
            if (opts.attributeName && opts.attributeValue) {
                $elements = this.wrapEl.querySelectorAll('[' + opts.attributeName + '="' + opts.attributeValue + '"]');
            }
        }
        var rows = [$elements];

        // get rows if using byRow, otherwise assume one row
        if (opts.byRow && !opts.target) {

            // must first force an arbitrary equal height so floating elements break evenly
            $elements.forEach(($that) => {
                var display = $that.style.display;

                // temporarily force a usable display value
                if (display !== 'inline-block' && display !== 'flex' && display !== 'inline-flex') {
                    display = 'block';
                }

                // cache the original inline style
                $that.setAttribute('style-cache', $that.getAttribute('style') || '');
                // reset style
                $that.setAttribute('style', 'display: display; padding-top: 0; padding-bottom: 0; margin-top: 0; margin-bottom: 0; border-top-width: 0; border-bottom-width: 0; height: 100px; overflow: hidden;');
            });

            // get the array of rows (based on element top position)
            rows = this._rows($elements);

            // revert original inline styles
            $elements.forEach(($that) => {
                $that.setAttribute('style', $that.getAttribute('style-cache') || '');
                $that.removeAttribute('style-cache');
            });
        }

        rows.forEach(($row) => {
            var targetHeight = 0;

            if (!opts.target) {
                // skip apply to rows with only one item
                if (opts.byRow && $row.length <= 1) {
                    $row.forEach(($that) => {
                        if (opts.property != 'height') {
                            eval('$that.style.' + opts.property + ' = \'\';');
                        } else {
                            $that.style.height = '';
                        }
                    })
                    return;
                }

                // iterate the row and find the max height
                $row.forEach(($that) => {
                    var style = $that.getAttribute('style') || '',
                        display = $that.style.display;

                    // temporarily force a usable display value
                    if (display !== 'inline-block' && display !== 'flex' && display !== 'inline-flex') {
                        display = 'block';
                    }

                    // ensure we get the correct actual height (and not a previously set height value)
                    $that.setAttribute('style', 'display:' + display + ';');

                    // find the max height (including padding, but not margin)
                    var isTarget = true;
                    if (opts.remove) {
                        if (opts.remove instanceof NodeList) {
                            opts.remove.forEach(($el) => {
                                if ($that === $el) {
                                    isTarget = false;
                                }
                            });
                        } else {
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
                    } else {
                        $that.style.display = '';
                    }
                });

            } else {
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
                verticalPadding += $this._parse($that.style.borderTopWidth) + $this._parse($that.style.borderBottomWidth);
                verticalPadding += $this._parse($that.style.paddingTop) + $this._parse($that.style.paddingBottom);

                // set the height (accounting for padding and border)
                if (opts.property != 'height') {
                    eval('$that.style.' + opts.property + ' = \'' + (targetHeight - verticalPadding) + 'px\'');
                } else {
                    $that.style.height = (targetHeight - verticalPadding) + 'px';
                }

                if ($that.getBoundingClientRect().height < targetHeight) {
                    if (opts.property != 'height') {
                        eval('$that.style.' + opts.property + ' = \'' + targetHeight + 'px\'');
                    } else {
                        $that.style.height = targetHeight + 'px';
                    }
                }

                if (opts.remove) {
                    if (opts.remove instanceof NodeList) {
                        opts.remove.forEach(($el) => {
                            if ($that === $el) {
                                if (opts.property != 'height') {
                                    eval('$el.style.' + opts.property + ' = \'\';');
                                } else {
                                    $el.style.height = '';
                                }
                            }
                        });
                    } else {
                        if ($that === opts.remove) {
                            if (opts.property != 'height') {
                                eval('$that.style.' + opts.property + ' = \'\';');
                            } else {
                                $that.style.height = '';
                            }
                        }
                    }
                }
            });

        });

        return this;
    };

})();	