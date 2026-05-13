import base from './base.js';

export default class golem extends base {
    constructor(obj) {
        super({
            hp: 120,
            atk: 0,
            def: 20,
            int: 40,
            ddef: 10,
            mana: 200,
            luck: 1,
            range: 4,
            ...obj,
        });
    }

    ball(msg) {
        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return this.welformAction({ mana: this._mana, msg: 'Not enough mana for ball.', valid: false });
        }

        return this.welformAction({
            msg,
            damage: 40,
            triggers: 'calcDamage',
            valid: true,
        });
    }

    shard(msg, amount, damage, extraMana = 10) {
        const attacks = [];

        for (let i = 0; i < amount; i++) {
            attacks.push(
                this.welformAction({
                    msg,
                    damage,
                    triggers: 'calcDamage',
                    valid: true,
                }),
            );
        }

        if (this._mana >= this.minManaUsage + extraMana) {
            this._mana -= this.minManaUsage + extraMana;
        } else {
            return this.welformAction({ mana: this._mana, msg: 'Not enough mana for shards.', valid: false });
        }

        return attacks;
    }

    breath(msg, status) {
        if (this._mana >= this.minManaUsage + 20) {
            this._mana -= this.minManaUsage + 20;
        } else {
            return this.welformAction({ mana: this._mana, msg: 'Not enough mana for breath.', valid: false });
        }

        return this.welformAction({
            msg,
            status,
            triggers: 'changeStatus',
            valid: true,
        });
    }
}
