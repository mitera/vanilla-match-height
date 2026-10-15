// Adds a license banner built from package.json to the tsc output and minifies it.
import { readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const banner = `/*!
 * ${pkg.name} v${pkg.version} by @mitera
 * ${pkg.author}
 * License: ${pkg.license}
 */`;

// tsc --build is incremental and may leave the files untouched, so drop any previous banner first.
for (const file of ['dist/vanilla-match-height.js', 'dist/vanilla-match-height.d.ts']) {
    const code = readFileSync(file, 'utf8').replace(/^\/\*![\s\S]*?\*\/\n/, '');
    writeFileSync(file, `${banner}\n${code}`);
}

await build({
    entryPoints: ['dist/vanilla-match-height.js'],
    outfile: 'dist/vanilla-match-height.min.js',
    minify: true,
    legalComments: 'none',
    banner: { js: banner },
    logLevel: 'info',
});
