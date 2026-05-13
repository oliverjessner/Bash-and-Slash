import golem from '../bases/golem.js';

export default class firegolem extends golem {
    constructor() {
        super({
            name: 'firegolem',
            skills: ['fireBreath', 'fireShards', 'fireBall'],
        });
    }

    fireBreath() {
        return this.breath('Fire breath! Target gets burned!', 'burned');
    }

    fireBall() {
        return this.ball('Fireball! Target takes 40 damage.');
    }

    fireShards() {
        return this.shards('Ice shards! Target takes 3x 30 damage.', 3, 30, 20);
    }
}
