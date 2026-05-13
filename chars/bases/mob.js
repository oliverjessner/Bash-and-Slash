import base from './base.js';

export default class mob extends base {
    constructor(obj) {
        super({
            ...obj,
            job: 'Mob' + (obj.job || ''),
        });
    }

    check() {}
}
