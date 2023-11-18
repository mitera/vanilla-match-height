# vanilla.matchHeight.js #
## *Inspireb by:* jquery-match-height
> *matchHeight:* makes the height of all selected elements exactly equal

[Demo](#demo) - [Features](#features) - [Install](#install) - [Usage](#usage) - [Options](#options) - [Data API](#data-api)  
[Advanced Usage](#advanced-usage) - [Changelog](#changelog) - [License](#license)

### Demo

See the [vanilla.matchHeight.js demo](https://github.com/mitera/vanilla-matchHeight/archive/refs/heads/master.zip).

[![jquery.matchHeight.js screenshot](https://github.com/mitera/vanilla-matchHeight/blob/master/vanilla-matchHeight.jpg)](https://github.com/mitera/vanilla-matchHeight/archive/refs/heads/master.zip)

### Modern browsers

In the years since this library was originally developed there have been updates to CSS that can now achieve equal heights in many situations. If you only need to support modern browsers then consider using [CSS Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) and [CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/) instead.

### Features

- match the heights for groups of elements automatically
- use the maximum height or define a specific target element
- anywhere on the page and anywhere in the DOM
- responsive (updates on window resize)
- row aware (handles floating elements and wrapping)
- accounts for `box-sizing` and mixed `padding`, `margin`, `border` values
- handles images and other media (updates after loading)
- easily removed when needed
- data attributes API
- tested in Edge, Chrome, Firefox

### Install

Download [vanilla.matchHeight.js](https://github.com/mitera/vanilla-matchHeight/blob/master/vanilla-matchHeight.js) and include the script in your HTML file:

	<script src="vanilla.matchHeight.js" type="text/javascript"></script>

You can also install using the package managers [NPM](https://www.npmjs.com/package/vanilla-match-height).

    npm install vanilla-match-height

### Usage

    document.body.matchHeight({elements: '.item'});

	const containers = document.querySelectorAll(".items-container");
    containers.forEach((container) => {			
        container.matchHeight({elements: '.item'});
    });

Where `options` is an optional parameter.   
See below for a description of the available options and defaults.

The above example will set all selected elements with the class `item` to the height of the tallest.  
If the items are on multiple rows, the items of each row will be set to the tallest of that row (see `byRow` option).

Call this on the event (the plugin will automatically update on window load).   
See the included [test.html](https://github.com/mitera/vanilla-matchHeight/blob/master/test/test.html) for many working examples.

Also see the [Data API](#data-api) below for a simple, alternative inline usage.

### Options

The default `options` are:

    {
        byRow: true,
        property: 'height',
        target: null,
        remove: null,
        attributeName: null
    }

Where:

- `byRow` is `true` or `false` to enable row detection
- `property` is the CSS property name to set (e.g. `'height'` or `'min-height'`)
- `target` is an optional element to use instead of the element with maximum height
- `remove` is an optional element/s to excluded
- `attributeName` is an optional for use custom attribute

### Data API

Use the data attribute `data-mh="group-name"` or `data-match-height="group-name"` where `group-name` is an arbitrary string to identify which elements should be considered as a group.

	<div data-mh="my-group">My text</div>
	<div data-mh="my-group">Some other text</div>
	<div data-mh="my-other-group">Even more text</div>
	<div data-mh="my-other-group">The last bit of text</div>

All elements with the same group name will be set to the same height when the page is loaded, regardless of their position in the DOM, without any extra code required.

It's possible to use custom data attribute `data-same-height="group-name"`

    <div data-same-height="my-group">My text</div>
	<div data-same-height="my-group">Some other text</div>
	<div data-same-height="my-other-group">Even more text</div>
	<div data-same-height="my-other-group">The last bit of text</div>

    const containers = document.querySelectorAll(".data-api-items");
    containers.forEach((container) => {
        container.matchHeight({attributeName: 'data-same-height'});
    });

Note that `byRow` will be enabled when using the data API, if you don't want this (or require other options) then use the alternative method above.

### Advanced Usage

There are some additional functions and properties you should know about:

#### Manually trigger an update

	window.dispatchEvent(new Event('resize'));

If you need to manually trigger an update of all currently set groups, for example if you've modified some content.

#### Row detection

You can toggle row detection by setting the `byRow` option, which defaults to `true`.  
It's also possible to use the row detection function at any time:

#### Custom target element

	const containers = document.querySelectorAll(".target-items");
    containers.forEach((container) => {			
        container.matchHeight({elements: '.item-0, .item-2, .item-3', target: document.getElementById("target-item-1")});
    });

Will set all selected elements to the height of the first item with class `sidebar`.

#### Custom property

	const containers = document.querySelectorAll(".property-items");
    containers.forEach((container) => {			
        container.matchHeight({elements: '.item', property: 'min-height'});
    });

This will set the `min-height` property instead of the `height` property.

Where `event` a event object (e.g. `load`, `resize`, `orientationchange`).

#### Manually apply match height

	document.body.matchHeight({elements: '.item'})._apply();

Use the apply function directly if you wish to avoid the automatic update functionality.

### Known limitations

#### CSS transitions and animations are not supported

You should ensure that there are no transitions or other animations that will delay the height changes of the elements you are matching, including any `transition: all` rules. Otherwise the plugin will produce unexpected results, as animations can't be accounted for.

### Changelog

To see what's new or changed in the latest version, see the [changelog](https://github.com/mitera/vanilla-matchHeight/blob/master/CHANGELOG.md)

### License

vanilla.matchHeight.js is licensed under [The MIT License (MIT)](http://opensource.org/licenses/MIT)
<br/>Copyright (c) 2023 Simone Miterangelis

This license is also supplied with the release and source code.
<br/>As stated in the license, absolutely no warranty is provided.