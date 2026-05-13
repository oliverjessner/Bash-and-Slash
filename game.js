import battle from './battleSim.js';
import knight from './chars/classes/knight.js';
import ninja from './chars/classes/ninja.js';
import spartan from './chars/classes/spartan.js';
import monk from './chars/classes/monk.js';
import archer from './chars/classes/archer.js';
import shaman from './chars/classes/shaman.js';
import enchanter from './chars/classes/enchanter.js';
import wizzard from './chars/classes/wizzard.js';
import warlock from './chars/classes/warlock.js';
import berserker from './chars/classes/berserker.js';
import icegolem from './chars/classes/icegolem.js';
import firegolem from './chars/classes/firegolem.js';

const knight1 = new knight();
const spartan1 = new spartan();
const ninja1 = new ninja();
const monk1 = new monk();

const winner1 = battle(knight1, spartan1, 10);
const winner2 = battle(knight1, ninja1, 10);
const winner3 = battle(knight1, monk1, 10);

const winner4 = battle(spartan1, ninja1, 10);
const winner5 = battle(spartan1, monk1, 10);

console.log(winner1);
console.log(winner2);
console.log(winner3);
console.log(winner4);
console.log(winner5);
