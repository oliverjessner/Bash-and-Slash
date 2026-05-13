import base from '../bases/base.js';

export default class knight extends base {
    constructor() {
        super({
            name: 'knight',
            hp: 235,
            atk: 40,
            def: 20,
            int: 65,
            ddef: 10,
            mana: 20,
            luck: 4,
            skills: ['selfHeal'],
        });
    }

    selfHeal() {
        const selfHealAmount = 10;

        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return this.welformAction({ mana: this._mana, msg: 'Not enough mana for self heal.', valid: false });
        }

        return this.welformAction({
            msg: `Self heal! Restored ${selfHealAmount} HP.`,
            heal: selfHealAmount,
            mana: this._mana,
            triggers: 'reciveHealing',
            selfAction: true,

            valid: true,
        });
    }
}
