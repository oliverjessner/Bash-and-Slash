import golem from '../bases/golem.js';

export default class icegolem extends golem {
    constructor() {
        super({
            name: 'icegolem',
            hp: 125,
            int: 35,
            skills: ['icebreath', 'iceShards', 'snowball'],
        });
    }

    iceBreath() {
        return this.breath('Frozen breath! Targets get frozen.', 'frozen');
    }

    snowball() {
        return this.ball('Snowball! Target takes 40 damage.', 2, 35, 15);
    }

    iceShards() {
        return this.shards('Ice shards! Target takes 3x 20 damage.');
    }
}
