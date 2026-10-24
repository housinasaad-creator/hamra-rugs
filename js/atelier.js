/* HAMRA — the atelier: six living canvases, one per step from fleece to floor. */
import { $, mountChrome } from './shared.js';
import { wool, dye, grid, knot, wash, finish } from './scenes.js';
mountChrome('atelier');
wool($('#v1')); dye($('#v2')); grid($('#v3')); knot($('#v4')); wash($('#v5')); finish($('#v6'));
