import base from './base.js';

export default class healer extends base {
    constructor(obj) {
        if (!obj.skills.includes('selfHeal')) {
            obj.skills.push('heal');
        }

        super({
            ...obj,
            job: 'Healer' + (obj.job || ''),
        });
    }

    heal(selfAction = false, healAmount = 10, manaUsage = this.minManaUsage) {
        if (this._mana >= manaUsage) {
            this._mana -= manaUsage;
        } else {
            return { mana: this._mana, msg: 'Not enough mana for heal.', valid: false };
        }

        return this.welformAction({
            msg: `heal! ${healAmount} HP.`,
            emoji: '🏥',
            heal: healAmount,
            mana: this._mana,
            selfAction,
            triggers: 'reciveHealing',
            valid: true,
        });
    }
}
