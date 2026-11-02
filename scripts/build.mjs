// Builds all the dist files with a license banner taken from package.json.
// Type declarations are emitted by tsc (see the "build" script).
import { readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const banner = `/*!
 * ${pkg.name} v${pkg.version} by @mitera
 * ${pkg.author}
 * License: ${pkg.license}
 */`;

const common = {
    bundle: true,
    target: 'es2017',
    legalComments: 'none',
    banner: { js: banner },
    logLevel: 'info',
};

// CommonJS output wrapped in a function: with require() it fills the real `module`,
// as a plain <script> it gets a throwaway one and only window.MatchHeight is set.
// A global `module` alone (e.g. page script, element with id="module") is not CommonJS: it may be
// frozen or hold other data, so it is used only together with the matching `exports`.
const umd = {
    ...common,
    entryPoints: ['src/browser.ts'],
    format: 'cjs',
    banner: { js: `${banner}\n(function (module) {` },
    footer: { js: `})(typeof module === "object" && module && typeof exports === "object" && module.exports === exports ? module : { exports: {} });` },
};

await Promise.all([
    // <script> and require(): same paths as 2.x, adds HTMLElement.prototype.matchHeight
    build({ ...umd, outfile: 'dist/vanilla-match-height.js' }),
    build({ ...umd, outfile: 'dist/vanilla-match-height.min.js', minify: true }),
    // import 'vanilla-match-height': adds the prototype method and exports the class
    build({ ...common, entryPoints: ['src/vanilla-match-height.ts'], outfile: 'dist/vanilla-match-height.mjs', format: 'esm' }),
    // import 'vanilla-match-height/core': class only, no side effects
    build({ ...common, entryPoints: ['src/core.ts'], outfile: 'dist/core.mjs', format: 'esm' }),
    build({ ...common, entryPoints: ['src/core.ts'], outfile: 'dist/core.cjs', format: 'cjs' }),
]);

// tsc --build is incremental and may leave the declarations untouched, so drop any previous banner first.
for (const file of ['dist/vanilla-match-height.d.ts', 'dist/core.d.ts']) {
    const code = readFileSync(file, 'utf8').replace(/^\/\*![\s\S]*?\*\/\n/, '');
    writeFileSync(file, `${banner}\n${code}`);
}
