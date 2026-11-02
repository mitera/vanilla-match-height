// Automatic checks for test.html, started by the "run all checks" button.
// Loaded before the library, so that errors thrown while it loads are collected too.
(function () {
    'use strict';

    // Max difference in px, the same tolerance the library uses for rows
    var TOLERANCE = 1;
    // Longer than the default throttle (80 ms), so that a deferred update has already run
    var SETTLE_MS = 250;

    var pageErrors = [];
    var running = false;
    var bound = true;
    var resizeTimer;

    window.addEventListener('error', function (event) {
        pageErrors.push(event.message);
    });
    window.addEventListener('unhandledrejection', function (event) {
        pageErrors.push(String(event.reason));
    });

    function wait(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function all(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function click(id) {
        document.getElementById(id).click();
    }

    function height(el) {
        return el.getBoundingClientRect().height;
    }

    function isEqual(a, b) {
        return Math.abs(a - b) <= TOLERANCE;
    }

    // Groups the visible elements by row, like the library does
    function toRows(items) {
        var rows = [];
        items.filter(function (el) {
            return el.getClientRects().length > 0;
        }).map(function (el) {
            return { el: el, top: el.getBoundingClientRect().top };
        }).sort(function (a, b) {
            return a.top - b.top;
        }).forEach(function (item) {
            var row = rows[rows.length - 1];
            if (row && isEqual(row.top, item.top)) {
                row.items.push(item.el);
            } else {
                rows.push({ top: item.top, items: [item.el] });
            }
        });
        return rows;
    }

    // Returns a description of the rows whose elements do not have the same height
    function unequalRows(label, items) {
        var problems = [];
        toRows(items).forEach(function (row) {
            var heights = row.items.map(height);
            if (!heights.every(function (h) { return isEqual(h, heights[0]); })) {
                problems.push(label + ': ' + heights.map(Math.round).join(' / '));
            }
        });
        return problems;
    }

    // What the page is expected to show in each section, per row
    function layoutProblems() {
        var problems = [];
        [
            '.simple-items', '.image-items', '.nested-items-parent', '.nested-items', '.fixed-items',
            '.inline-block-items', '.inline-flex-items', '.hidden-items', '.items-with-float',
            '.property-items', '.inline-style-items'
        ].forEach(function (section) {
            problems = problems.concat(unequalRows(section, all(section + ' > .item')));
        });
        problems = problems.concat(
            unequalRows('.remove-items', all('.remove-items > .item:not(#remove-item-0)')),
            unequalRows('.remove-items2', all('.remove-items2 > .item:not(.remove-item)')),
            dataApiProblems(),
            classProblems(),
            dataApiFalseProblems()
        );

        // With a target there are no rows: all the elements take the height of the target
        var target = document.getElementById('target-item-1');
        all('.target-items > .item').forEach(function (el) {
            if (!isEqual(height(el), height(target))) {
                problems.push('.target-items: ' + Math.round(height(el)) + ' / target ' + Math.round(height(target)));
            }
        });
        return problems;
    }

    function defaultDataApiProblems() {
        return [].concat(
            unequalRows('data-match-height', all('.data-api-items [data-match-height="items-a"]')),
            unequalRows('data-mh', all('.data-api-items [data-mh="items-b"]'))
        );
    }

    function dataApiProblems() {
        return defaultDataApiProblems().concat(
            unequalRows('data-same-height a', all('.data-api-items2 [data-same-height="items-a"]')),
            unequalRows('data-same-height b', all('.data-api-items2 [data-same-height="items-b"]'))
        );
    }

    function classProblems() {
        return unequalRows('.class-items', all('.class-items > .item'));
    }

    function dataApiFalseProblems() {
        return [].concat(
            unequalRows('data-mh group', all('.data-api-false-items [data-mh="items-a"]')),
            unequalRows('dataApi: false group', all('.data-api-false-items > .item-2, .data-api-false-items > .item-3'))
        );
    }

    // Elements of the `elements` option of the page instances that still have the inline property
    function appliedElements() {
        var applied = [];
        window.elements.forEach(function (instance) {
            if (!instance.settings.elements) return;
            all(instance.settings.elements, instance.wrapEl).forEach(function (el) {
                if (el.style.getPropertyValue(instance.settings.property) !== '') {
                    applied.push(el);
                }
            });
        });
        return applied;
    }

    // Isolated elements for the options that the page sections do not use. Outside the
    // .container, so that the instances of the page never touch them.
    function fixture(heights, itemStyle, attributes) {
        var box = document.createElement('div');
        box.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px';
        heights.forEach(function (h, i) {
            var item = document.createElement('div');
            item.className = 'fx';
            item.style.cssText = itemStyle || 'float:left;width:25%';
            if (attributes && attributes[i]) item.setAttribute(attributes[i][0], attributes[i][1]);
            var inner = document.createElement('div');
            inner.style.height = h + 'px';
            item.appendChild(inner);
            box.appendChild(item);
        });
        document.body.appendChild(box);
        return box;
    }

    function fixtureHeights(box) {
        return all('.fx', box).map(function (el) {
            return Math.round(height(el));
        });
    }

    function sameValues(actual, expected) {
        return JSON.stringify(actual) === JSON.stringify(expected);
    }

    function optionChecks(add) {
        var MatchHeightClass = window.MatchHeight;
        var box;

        function run(id, label, fn) {
            var detail = '';
            var pass = false;
            try {
                detail = fn();
                pass = detail === '';
            } catch (error) {
                detail = String(error);
            }
            add(id, label, pass, detail);
            if (box) {
                box.remove();
                box = null;
            }
        }

        function expect(actual, expected) {
            return sameValues(actual, expected) ? '' : 'got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected);
        }

        run('A', 'window.MatchHeight and element.matchHeight() return an instance', function () {
            if (typeof MatchHeightClass !== 'function') return 'window.MatchHeight is missing';
            box = fixture([10, 20]);
            var instance = box.matchHeight({ elements: '.fx', events: false });
            return instance instanceof MatchHeightClass ? '' : 'not a MatchHeight instance';
        });

        run('B', 'new MatchHeight(null) throws a TypeError', function () {
            try {
                new MatchHeightClass(null);
            } catch (error) {
                return error instanceof TypeError ? '' : 'threw ' + error;
            }
            return 'nothing thrown';
        });

        run('C', '_remove() with a blank elements value does not throw', function () {
            box = fixture([10, 20]);
            new MatchHeightClass(box, { elements: '  ', events: false })._remove();
            return '';
        });

        run('D', 'property: minHeight sets min-height, not height', function () {
            box = fixture([10, 20]);
            new MatchHeightClass(box, { elements: '.fx', property: 'minHeight', events: false })._applyAll();
            var first = box.querySelector('.fx');
            return expect([first.style.minHeight, first.style.height], ['20px', '']);
        });

        run('E', 'byRow: stacked elements match only with byRow: false', function () {
            box = fixture([10, 20], 'width:100%');
            var instance = new MatchHeightClass(box, { elements: '.fx', events: false });
            instance._applyAll();
            var byRow = fixtureHeights(box);
            new MatchHeightClass(box, { elements: '.fx', byRow: false, events: false })._applyAll();
            return expect([byRow, fixtureHeights(box)], [[10, 20], [20, 20]]);
        });

        run('F', 'attributeName + attributeValue match only that group', function () {
            box = fixture([10, 20, 30], null, [['data-g', 'a'], ['data-g', 'a'], ['data-g', 'b']]);
            new MatchHeightClass(box, { attributeName: 'data-g', attributeValue: 'a', dataApi: false, events: false })._apply();
            return expect(fixtureHeights(box), [20, 20, 30]);
        });

        run('G', 'events: false applies nothing until it is called', function () {
            box = fixture([10, 20]);
            var instance = new MatchHeightClass(box, { elements: '.fx', events: false });
            var before = fixtureHeights(box);
            instance._applyAll();
            return expect([before, fixtureHeights(box)], [[10, 20], [20, 20]]);
        });

        run('H', 'throttle: 0 updates during the resize event', function () {
            box = fixture([10, 20]);
            var instance = new MatchHeightClass(box, { elements: '.fx', throttle: 0 });
            box.querySelector('.fx > div').style.height = '50px';
            window.dispatchEvent(new Event('resize'));
            var heights = fixtureHeights(box);
            instance._unbind();
            return expect(heights, [50, 50]);
        });

        run('I', 'beforeUpdate runs before afterUpdate, once per update', function () {
            box = fixture([10, 20]);
            var calls = [];
            new MatchHeightClass(box, {
                elements: '.fx',
                events: false,
                beforeUpdate: function () { calls.push('before'); },
                afterUpdate: function () { calls.push('after'); }
            })._applyAll();
            return expect(calls, ['before', 'after']);
        });

        run('J', 'a hidden container is skipped without errors', function () {
            box = fixture([10, 20]);
            box.style.display = 'none';
            new MatchHeightClass(box, { elements: '.fx', events: false })._applyAll();
            return expect(box.querySelector('.fx').style.height, '');
        });
    }

    async function runChecks() {
        var results = document.getElementById('check-results');
        var summary = document.getElementById('check-summary');
        var passed = 0;
        var total = 0;

        function add(id, label, pass, detail) {
            total++;
            if (pass) passed++;
            var row = document.createElement('li');
            row.className = pass ? 'check-pass' : 'check-fail';
            row.textContent = (pass ? 'PASS ' : 'FAIL ') + id + ' ' + label + (!pass && detail ? ' -> ' + detail : '');
            results.appendChild(row);
        }

        function addProblems(id, label, problems) {
            add(id, label, problems.length === 0, problems.join('; '));
        }

        running = true;
        clearTimeout(resizeTimer);
        results.textContent = '';
        summary.textContent = 'Running...';

        // Whatever the buttons did before, start from applied and bound
        click('init-mh');
        await wait(SETTLE_MS);

        addProblems('1.1', 'Rows have equal heights in every section', layoutProblems());
        addProblems('1.1', 'No uncaught errors since the page was loaded', pageErrors);

        click('remove-mh');
        add('1.3', 'remove: the elements option groups have no inline height', appliedElements().length === 0,
            appliedElements().length + ' elements still applied');
        // .data-api-items2 is left out: it also has an instance with elements: '.item', whose _remove() resets it
        addProblems('1.3', 'remove: the data API groups stay matched, as documented', defaultDataApiProblems());

        click('add-mh');
        addProblems('1.4', 'add: rows have equal heights again', layoutProblems());

        click('unbind-mh');
        click('remove-mh');
        window.dispatchEvent(new Event('resize'));
        await wait(SETTLE_MS);
        add('1.5', 'unbind: a resize event no longer updates the heights', appliedElements().length === 0,
            appliedElements().length + ' elements updated');

        click('init-mh');
        click('remove-mh');
        window.dispatchEvent(new Event('resize'));
        await wait(SETTLE_MS);
        addProblems('1.6', 'init: a resize event updates the heights again', appliedElements().length === 0
            ? ['nothing was applied']
            : layoutProblems());

        click('remove-mh');
        window.dispatchEvent(new Event('orientationchange'));
        await wait(SETTLE_MS);
        addProblems('1.7', 'orientationchange event updates the heights (simulated)', appliedElements().length === 0
            ? ['nothing was applied']
            : layoutProblems());

        addProblems('1.8', 'new MatchHeight() section: rows have equal heights', classProblems());
        addProblems('1.9', 'data-mh / dataApi: false section: each group matched per row', dataApiFalseProblems());

        var descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'matchHeight');
        var enumerated = false;
        for (var key in document.body) {
            if (key === 'matchHeight') enumerated = true;
        }
        add('1.10', 'matchHeight is non-enumerable, writable and configurable',
            !!descriptor && !descriptor.enumerable && descriptor.writable && descriptor.configurable && !enumerated,
            descriptor ? JSON.stringify({ enumerable: descriptor.enumerable, writable: descriptor.writable, configurable: descriptor.configurable, inForIn: enumerated }) : 'missing');

        optionChecks(add);

        summary.textContent = passed + '/' + total + ' passed, width ' + window.innerWidth + 'px, ' + navigator.userAgent;
        summary.className = passed === total ? 'check-pass' : 'check-fail';
        running = false;
    }

    // Test 1.2 and the real rotation of 1.7: repeats the layout check after each real resize
    function afterResize() {
        if (running) return;
        var line = document.getElementById('check-resize');
        var problems = layoutProblems();
        if (!bound) {
            line.textContent = 'Width ' + window.innerWidth + 'px: matchHeight is unbound, layout not checked';
            line.className = '';
            return;
        }
        line.textContent = (problems.length ? 'FAIL' : 'PASS') + ' 1.2 after resize, width ' + window.innerWidth + 'px'
            + (problems.length ? ' -> ' + problems.join('; ') : '');
        line.className = problems.length ? 'check-fail' : 'check-pass';
    }

    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(afterResize, SETTLE_MS);
    });

    document.addEventListener('DOMContentLoaded', function () {
        document.getElementById('unbind-mh').addEventListener('click', function () { bound = false; });
        document.getElementById('init-mh').addEventListener('click', function () { bound = true; });
        var button = document.getElementById('run-checks');
        button.addEventListener('click', function () {
            if (running) return;
            button.disabled = true;
            runChecks().catch(function (error) {
                running = false;
                document.getElementById('check-summary').textContent = 'The checks stopped: ' + error;
                document.getElementById('check-summary').className = 'check-fail';
            }).then(function () {
                button.disabled = false;
            });
        });
    });
})();
