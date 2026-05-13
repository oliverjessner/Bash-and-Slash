import base from '../bases/base.js';

export default class berserker extends base {
    constructor() {
        super({
            name: 'berserker',
            hp: 80,
            atk: 75,
            def: 10,
            int: 135,
            ddef: 15,
            dakt: 25,
            mana: 20,
            luck: 4,
            skills: ['atkBuff'],
        });
    }

    atkBuff() {
        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return { mana: this._mana, msg: 'Not enough mana for atkbuff.', valid: false };
        }

        return this.welformAction({
            msg: `atk buff! 5.`,
            debuff: {
                type: 'atk',
                amount: 5,
            },
            selfBuff: true,
            mana: this._mana,
            triggers: 'buff',
            valid: true,
        });
    }
}
