import base from './base.js';

export default class healer extends base {
    constructor(obj) {
        obj.skills.push('heal');
        super(obj);
    }

    heal() {
        const healAmount = 10;

        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return { mana: this._mana, msg: 'Not enough mana for heal.', valid: false };
        }

        return this.welformAction({
            msg: `heal! ${healAmount} HP.`,
            heal: healAmount,
            mana: this._mana,
            triggers: 'reciveHealing',
            valid: true,
        });
    }
}
