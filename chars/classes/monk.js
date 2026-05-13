import healer from '../bases/healer.js';

export default class monk extends healer {
    constructor() {
        super({
            name: 'monk',
            job: ' / Warrior',
            hp: 130,
            atk: 25,
            def: 15,
            int: 105,
            ddef: 20,
            mana: 80,
            luck: 1,
            skills: [],
        });
    }
}
