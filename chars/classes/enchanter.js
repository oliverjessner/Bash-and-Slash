import buffer from '../bases/buffer.js';

export default class enchanter extends buffer {
    constructor() {
        super({
            name: 'enchanter',
            hp: 80,
            atk: 20,
            def: 15,
            int: 90,
            ddef: 30,
            mana: 160,
            luck: 1,
            range: 4,
            skills: ['atkBuff', 'defBuff', 'intBuff', 'ddefBuff', 'datkBuff', 'intBuff', 'luckBuff'],
        });
    }

    atkBuff() {
        return this.buff({
            type: 'atk',
        });
    }

    defBuff() {
        return this.buff({
            type: 'def',
        });
    }

    intBuff() {
        return this.buff({
            type: 'int',
        });
    }

    ddefBuff() {
        return this.buff({
            type: 'ddef',
        });
    }

    datkBuff() {
        return this.buff({
            type: 'datk',
        });
    }

    intBuff() {
        return this.buff({
            type: 'int',
        });
    }

    luckBuff() {
        return this.buff({
            type: 'luck',
            amount: 1,
        });
    }
}
