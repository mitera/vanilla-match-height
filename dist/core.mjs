/*!
 * vanilla-match-height v2.3.0 by @mitera
 * Simone Miterangelis <simone@mite.it>
 * License: MIT
 */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// src/core.ts
var ROW_ERROR_THRESHOLD = 1;
var MatchHeight = class {
  /**
   * @param {HTMLElement} wrapEl - The container in which the elements are searched.
   * @param {MatchHeightSettings} settings - Optional options.
   */
  constructor(wrapEl, settings) {
    this._remains = [];
    if (!wrapEl || typeof wrapEl.querySelectorAll !== "function") {
      throw new TypeError("MatchHeight: wrapEl must be a DOM element");
    }
    this.wrapEl = wrapEl;
    const default_settings = {
      elements: null,
      byRow: true,
      target: null,
      attributeName: null,
      attributeValue: null,
      property: "height",
      remove: null,
      dataApi: true,
      events: true,
      throttle: 80,
      beforeUpdate: null,
      afterUpdate: null
    };
    const merged = __spreadValues(__spreadValues({}, default_settings), settings);
    let property = String(merged.property || "height").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    if (!this._validateProperty(property)) {
      property = "height";
    }
    if (merged.attributeName) {
      merged.attributeName = merged.attributeName.toLowerCase();
    }
    this.settings = __spreadProps(__spreadValues({}, merged), { property });
    if (this.settings.events) {
      const update = this._handler = this._applyAll.bind(this);
      if (document.readyState !== "loading") {
        this._applyAll();
      } else {
        document.addEventListener("DOMContentLoaded", update, { once: true });
      }
      if (document.readyState !== "complete") {
        window.addEventListener("load", update, { once: true });
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
  _init() {
    if (!this._bind) return;
    window.addEventListener("resize", this._bind);
    window.addEventListener("orientationchange", this._bind);
  }
  /**
   * Removes the resize/orientationchange listeners, the pending page load updates
   * and any deferred throttled update.
   */
  _unbind() {
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
  _throttle(fn, threshold) {
    let last;
    return () => {
      const now = Date.now();
      if (last && now < last + threshold) {
        clearTimeout(this._deferTimer);
        this._deferTimer = setTimeout(() => {
          last = now;
          fn();
        }, threshold);
      } else {
        last = now;
        fn();
      }
    };
  }
  /**
   * Applies the `elements` (or `attributeName`/`attributeValue`) group and the data API groups,
   * with the beforeUpdate/afterUpdate callbacks.
   */
  _applyAll() {
    if (this.settings.beforeUpdate) {
      this.settings.beforeUpdate();
    }
    this._apply();
    if (this.settings.attributeName && this._validateAttributeName(this.settings.attributeName)) {
      this._applyDataApi(this.settings.attributeName);
    }
    if (this.settings.dataApi) {
      this._applyDataApi("data-match-height");
      this._applyDataApi("data-mh");
    }
    if (this.settings.afterUpdate) {
      this.settings.afterUpdate();
    }
  }
  /**
   * Checks that a CSS property name can be used with style.setProperty().
   */
  _validateProperty(value) {
    return String(value).match(
      /^([a-z-]{2,})$/
    );
  }
  /**
   * Validates an attribute name before it is used, unquoted, in a selector.
   * Unlike CSS property names, attribute names may contain digits and
   * underscores (e.g. `data-mh2`, `data-match_height`).
   */
  _validateAttributeName(value) {
    return /^[a-z_][a-z0-9_-]*$/i.test(String(value));
  }
  /**
   * Matches the elements that have the `attributeName` attribute, grouped by its value.
   */
  _applyDataApi(attributeName) {
    const elements = Array.from(this.wrapEl.querySelectorAll("[" + attributeName + "]"));
    elements.forEach((item) => {
      this._resetStyle(item, this.settings.property);
    });
    const groups = /* @__PURE__ */ new Map();
    elements.forEach((el) => {
      const groupId = el.getAttribute(attributeName);
      if (groupId) {
        if (!groups.has(groupId)) {
          groups.set(groupId, []);
        }
        groups.get(groupId).push(el);
      }
    });
    groups.forEach((elements2) => {
      this._update(elements2);
    });
  }
  /**
   * Resets the inline style property of the `elements` (or `attributeName`/`attributeValue`) group.
   * Groups of the data API are not reset.
   */
  _remove() {
    let $elements = [];
    const opts = this.settings;
    if (opts.elements && opts.elements.trim() != "") {
      $elements = Array.from(this.wrapEl.querySelectorAll(opts.elements));
    } else {
      if (opts.attributeName && this._validateAttributeName(opts.attributeName) && opts.attributeValue) {
        $elements = Array.from(this.wrapEl.querySelectorAll(this._attributeSelector(opts.attributeName, opts.attributeValue)));
      }
    }
    $elements.forEach((item) => {
      item.style.setProperty(opts.property, "");
      if (item.getAttribute("style") === "") item.removeAttribute("style");
    });
  }
  /**
   * Matches the `elements` (or `attributeName`/`attributeValue`) group.
   */
  _apply() {
    const opts = this.settings;
    let elements = [];
    if (opts.elements && opts.elements.trim() != "") {
      elements = Array.from(this.wrapEl.querySelectorAll(opts.elements));
    } else {
      if (opts.attributeName && this._validateAttributeName(opts.attributeName) && opts.attributeValue && opts.attributeValue.trim() != "") {
        elements = Array.from(this.wrapEl.querySelectorAll(this._attributeSelector(opts.attributeName, opts.attributeValue)));
      }
    }
    this._update(elements);
  }
  /**
   * Builds an attribute selector, escaping the value so that quotes or
   * backslashes cannot break the selector syntax.
   */
  _attributeSelector(attributeName, attributeValue) {
    const escaped = typeof CSS !== "undefined" && typeof CSS.escape === "function" ? CSS.escape(attributeValue) : String(attributeValue).replace(/["\\]/g, "\\$&").replace(/[\n\r\f]/g, (c) => "\\" + c.charCodeAt(0).toString(16) + " ");
    return "[" + attributeName + '="' + escaped + '"]';
  }
  /**
   * Resets and matches a group of elements.
   */
  _update(elements) {
    if (elements.length === 0) return;
    this._remains = elements.map((el) => ({ el, top: 0, height: 0 }));
    this._remains.forEach((item) => {
      this._resetStyle(item.el, this.settings.property);
    });
    this._remains = this._remains.filter((item) => item.el.getClientRects().length > 0);
    if (this._remains.length === 0) return;
    this._process();
  }
  /**
   * Matches `_remains` one row at a time.
   */
  _process() {
    while (this._remains.length > 0) {
      this._remains.forEach((item) => {
        const bb = item.el.getBoundingClientRect();
        item.top = this.settings.byRow ? bb.top : 0;
        item.height = bb.height;
      });
      this._remains.sort((a, b) => a.top - b.top);
      const processingTop = this._remains[0].top;
      const processingTargets = this._remains.filter((item) => Math.abs(item.top - processingTop) <= ROW_ERROR_THRESHOLD);
      this._remains.splice(0, processingTargets.length);
      const matchingTargets = processingTargets.filter((item) => !this._isRemoved(item.el));
      if (!this.settings.target && matchingTargets.length < 2) continue;
      let maxHeightInRow = 0;
      if (this.settings.target) maxHeightInRow = this.settings.target.getBoundingClientRect().height;
      else maxHeightInRow = Math.max(...matchingTargets.map((item) => item.height));
      matchingTargets.forEach((item) => {
        const styles = window.getComputedStyle(item.el);
        const isBorderBox = styles.boxSizing === "border-box";
        if (isBorderBox) {
          item.el.style.setProperty(this.settings.property, `${maxHeightInRow}px`);
        } else {
          const paddingAndBorder = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0) + (parseFloat(styles.borderTopWidth) || 0) + (parseFloat(styles.borderBottomWidth) || 0);
          item.el.style.setProperty(this.settings.property, `${Math.max(0, maxHeightInRow - paddingAndBorder)}px`);
        }
      });
    }
  }
  /**
   * Checks whether an element is excluded through the `remove` setting.
   */
  _isRemoved(el) {
    const remove = this.settings.remove;
    if (!remove) return false;
    if (remove instanceof NodeList || Array.isArray(remove)) return Array.prototype.indexOf.call(remove, el) !== -1;
    return remove === el;
  }
  /**
   * Resets the inline style property of an element, dropping an empty `style` attribute.
   */
  _resetStyle($that, property) {
    if (this._validateProperty(property)) {
      $that.style.setProperty(property, "");
      if ($that.getAttribute("style") === "") $that.removeAttribute("style");
    }
  }
};
var core_default = MatchHeight;
export {
  MatchHeight,
  core_default as default
};
