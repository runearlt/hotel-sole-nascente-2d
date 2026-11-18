import {build} from 'esbuild';
import {copyFile} from 'node:fs/promises';
await build({entryPoints:['scripts/three-entry.js'],bundle:true,format:'esm',minify:true,legalComments:'eof',outfile:'public/vendor/three-bundle.js'});
await copyFile('node_modules/three/LICENSE','public/vendor/THREE-LICENSE.txt');
