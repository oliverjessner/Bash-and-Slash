import base from './base.js';

export default class buffer extends base {
    constructor(obj) {
        super({
            ...obj,
            job: 'Buffer' + (obj.job || ''),
        });
    }

    debuff({ type, amount = 5 }) {
        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return this.welformAction({
                mana: this._mana,
                msg: `Not enough mana for ${type} debuff.`,
                emoji: '🧙🏻‍♀️',
                valid: false,
            });
        }

        return this.welformAction({
            msg: `${type} debuff! ${amount} .`,
            buff: { type, amount },
            emoji: '🧙🏻‍♀️',
            mana: this._mana,
            triggers: 'debuff',
            valid: true,
        });
    }

    buff({ type, amount = 5, selfBuf }) {
        if (this._mana >= this.minManaUsage) {
            this._mana -= this.minManaUsage;
        } else {
            return this.welformAction({
                emoji: '🪄',
                mana: this._mana,
                msg: `Not enough mana for ${type} buff.`,
                valid: false,
            });
        }

        return this.welformAction({
            msg: `${type} buff! ${amount} .`,
            buff: { type, amount, selfBuf },
            emoji: '🪄',
            mana: this._mana,
            triggers: 'buff',
            valid: true,
        });
    }
}
