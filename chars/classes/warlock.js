import buffer from '../bases/buffer.js';

export default class warlock extends buffer {
    constructor() {
        super({
            name: 'warlock',
            hp: 115,
            atk: 25,
            def: 10,
            int: 50,
            ddef: 20,
            datk: 20,
            mana: 140,
            luck: 1,
            range: 4,
            skills: ['atkDebuff', 'defDebuff', 'intDebuff', 'ddefDebuff', 'datkDebuff', 'intDebuff', 'luckDebuff'],
        });
    }

    atkDebuff() {
        return this.debuff({
            type: 'atk',
        });
    }

    defDebuff() {
        return this.debuff({
            type: 'def',
        });
    }

    intDebuff() {
        return this.debuff({
            type: 'int',
        });
    }

    ddefDebuff() {
        return this.debuff({
            type: 'ddef',
        });
    }

    datkDebuff() {
        return this.debuff({
            type: 'datk',
        });
    }

    intDebuff() {
        return this.debuff({
            type: 'int',
        });
    }

    luckDebuff() {
        return this.debuff({
            type: 'luck',
            amount: 1,
        });
    }
}
