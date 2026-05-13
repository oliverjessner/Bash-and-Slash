import healer from '../bases/healer.js';

export default class knight extends healer {
    constructor() {
        super({
            name: 'knight',
            job: ' / Warrior',
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
        return this.heal(true, 15, 20);
    }
}
