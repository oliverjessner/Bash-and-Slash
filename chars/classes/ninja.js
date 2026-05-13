import base from '../bases/base.js';

export default class ninja extends base {
    constructor() {
        super({
            name: 'ninja',
            hp: 125,
            atk: 25,
            def: 10,
            int: 160,
            ddef: 10,
            mana: 60,
            luck: 3,
            range: 2,
            skills: ['doubleAttack'],
        });
    }

    doubleAttack() {
        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return this.welformAction({ mana: this._mana, msg: 'Not enough mana for double attack.', valid: false });
        }

        const firstAttack = this.attack('Double attack!');
        const secondAttack = this.attack('Double attack!');

        return [firstAttack, secondAttack];
    }
}
