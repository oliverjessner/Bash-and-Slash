import golem from '../bases/golem.js';

export default class plantgolem extends golem {
    constructor() {
        super({
            name: 'plantgolem',
            hp: 115,
            int: 45,
            skills: ['plantBreath', 'plantShards', 'plantBall'],
        });
    }

    plantBreath() {
        return this.breath('Plant breath! Targets get entangled.', 'entangled');
    }

    plantBall() {
        return this.ball('PlantBall! Target takes 40 damage.');
    }

    plantShards() {
        return this.shards('Plant shards! Target takes 5x 25 damage.', 5, 25);
    }
}
