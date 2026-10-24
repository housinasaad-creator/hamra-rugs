/* HAMRA — about us: the story in four chapters, each with a living canvas, plus numbers and values. */
import { $, mountChrome } from './shared.js';
import { knot, dye, grid, finish } from './scenes.js';
mountChrome('about');
knot($('#v1'), 'kilim'); dye($('#v2')); grid($('#v3')); finish($('#v4'));
