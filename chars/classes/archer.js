import base from '../bases/base.js';

export default class archer extends base {
    constructor() {
        super({
            name: 'archer',
            hp: 90,
            atk: 50,
            def: 10,
            dakt: 10,
            ddef: 20,
            int: 150,
            mana: 60,
            luck: 0,
            range: 5,
            skills: ['poisonArrow'],
        });
    }

    poisonArrow() {
        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return this.welformAction({ mana: this._mana, msg: 'Not enough mana for poison arrow.', valid: false });
        }

        return this.welformAction({
            msg: 'Poison arrow! 5 hp down every turn',
            status: 'poisoned',
            triggers: 'changeStatus',
            valid: true,
        });
    }
}
