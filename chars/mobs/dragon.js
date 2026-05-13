import mob from '../bases/mob.js';

export default class dragon extends mob {
    constructor() {
        super({
            name: 'dragon',
            hp: 1000,
            atk: 30,
            def: 15,
            int: 30,
            datk: 30,
            ddef: 50,
            mana: 100,
            luck: 5,
            skills: ['dragonFireBall', 'dragonHeal'],
        });
    }

    dragonHeal() {
        const healAmount = 25;

        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return { mana: this._mana, msg: 'Not enough mana for dragon heal.', valid: false };
        }

        return this.welformAction({
            msg: `heal! ${healAmount} HP.`,
            emoji: '🏥',
            heal: healAmount,
            mana: this._mana,
            selfAction: true,
            triggers: 'reciveHealing',
            valid: true,
        });
    }

    dragonFireBall() {
        if (this._mana >= this.minManaUsage + 20) {
            this._mana -= this.minManaUsage + 20;
        } else {
            return this.welformAction({
                emoji: '🔥',
                mana: this._mana,
                msg: 'Not enough mana for dragonFireBall.',
                valid: false,
            });
        }

        return this.welformAction({
            msg: `Fire ball attack - Damage: 80`,
            emoji: '🔥',
            damage: 80,
            triggers: 'calcDamage',
            valid: true,
        });
    }
}
