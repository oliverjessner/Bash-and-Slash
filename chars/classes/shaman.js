import healer from '../bases/healer.js';

export default class shaman extends healer {
    constructor() {
        super({
            name: 'shaman',
            hp: 95,
            atk: 20,
            def: 10,
            int: 80,
            ddef: 25,
            mana: 160,
            luck: 2,
            range: 3,
            skills: ['vitality', 'manaHeal'],
        });
    }

    vitality() {
        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return { mana: this._mana, msg: 'Not enough mana for vitality.', valid: false };
        }

        return {
            msg: 'Vitality! for one character.',
            triggers: 'triggerVitality',
            valid: true,
        };
    }

    manaHeal() {
        const manaHealAmount = 25;

        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return this.welformAction({ mana: this._mana, msg: 'Not enough mana for mana heal.', valid: false });
        }

        return this.welformAction({
            msg: `Mana heal! Restored ${manaHealAmount} mana.`,
            manaHeal: manaHealAmount,
            mana: this._mana,
            triggers: 'manaHeal',
            valid: true,
        });
    }
}
