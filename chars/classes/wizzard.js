import base from '../bases/base.js';

export default class wizzard extends base {
    constructor() {
        super({
            name: 'wizzard',
            hp: 130,
            atk: 35,
            def: 10,
            int: 75,
            ddef: 20,
            mana: 100,
            luck: 2,
            range: 3,
            skills: ['sleep', 'manaDrain', 'invulnerability'],
        });
    }

    sleep() {
        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return this.welformAction({ mana: this._mana, msg: 'Not enough mana for sleep.', valid: false });
        }

        return this.welformAction({
            msg: 'Sleep! Target falls asleep.',
            status: 'asleep',
            triggers: 'changeStatus',
            valid: true,
        });
    }

    manaDrain() {
        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return this.welformAction({ mana: this._mana, msg: 'Not enough mana for mana drain.', valid: false });
        }

        return this.welformAction({
            msg: 'Mana drain! Target loses 20 mana.',
            mana: 20,
            triggers: 'manaDrain',
            valid: true,
        });
    }

    invulnerability() {
        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return this.welformAction({ mana: this._mana, msg: 'Not enough mana for invulnerability.', valid: false });
        }

        return this.welformAction({
            msg: 'Invulnerability! Target becomes invulnerable for 1 turn.',
            status: 'invulnerable',
            triggers: 'changeStatus',
            valid: true,
        });
    }
}
