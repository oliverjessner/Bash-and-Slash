import base from '../bases/base.js';

export default class knight extends base {
    constructor() {
        super({
            name: 'spartan',
            hp: 165,
            atk: 60,
            def: 15,
            int: 115,
            ddef: 15,
            mana: 20,
            luck: 4,
            skills: ['defdebuff'],
        });
    }

    defdebuff() {
        const debuffAmount = 5;

        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return { mana: this._mana, msg: 'Not enough mana for defdebuff.', valid: false };
        }

        return this.welformAction({
            msg: `Defensive debuff! Enemy defense reduced by ${debuffAmount} for the next attack.`,
            emoji: '📉',
            debuff: {
                type: 'def',
                amount: debuffAmount,
            },
            mana: this._mana,
            triggers: 'debuff',
            valid: true,
        });
    }
}
