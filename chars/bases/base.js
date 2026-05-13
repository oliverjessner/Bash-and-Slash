const baseLimit = 390;

export default class base {
    _nickname = '';
    _name = '';
    _hp = 0;
    _fullHP = 0;
    _atk = 0;
    _baseAtk = 0;
    _def = 0;
    _baseDef = 0;
    _int = 0;
    _baseInt = 0;
    _datk = 0;
    _baseDatk = 0;
    _ddef = 0;
    _baseDdef = 0;
    _mana = 0;
    _fullMana = 0;
    _luck = 0;
    _range = 0;
    _skills = [];
    _status = ['healthy'];
    _job = '';
    #usedLuck = 0;
    static minManaUsage = 20;
    static #id = 0;

    constructor({
        nickname = '',
        name,
        hp = 100,
        atk = 20,
        def = 10,
        int = 60,
        datk = 0,
        ddef = 10,
        mana = 0,
        luck = 1,
        range = 1,
        skills = [],
        job = 'Warrior',
    }) {
        base.#id++;
        this._nickname = nickname || `${name}_${base.#id}`;
        this._name = name;
        this._fullHP = hp;
        this._hp = hp;
        this._atk = atk;
        this._baseAtk = atk;
        this._def = def;
        this._baseDef = def;
        this._int = int;
        this._baseInt = int;
        this._datk = datk;
        this._baseDatk = datk;
        this._ddef = ddef;
        this._baseDdef = ddef;
        this._mana = mana;
        this._fullMana = mana;
        this._luck = luck;
        this._range = range;
        this._skills = skills;
        this._job = job;
        this.check();
    }

    getJob() {
        return this._job;
    }

    check() {
        const base = this._hp + this._atk + this._def + this._int + this._datk + this._ddef + this._mana;
        const secBase = this._luck + this._range;

        if (secBase > 5) {
            console.warn(
                `Warning: ${this._name} has a secondary base stat of ${secBase}, which is above the recommended limit of 5. Consider adjusting the stats to maintain game balance.`,
            );
        }
        if (base > baseLimit) {
            console.warn(
                `Warning: ${this._name} has a base stat of ${base}, which is above the recommended limit of 390. Consider adjusting the stats to maintain game balance.`,
            );
        }
    }

    welformAction(obj) {
        if (!obj.hasOwnProperty('valid')) {
            console.log(obj);
            throw new Error('Action object must have a valid property.', obj);
        }
        if (!obj.hasOwnProperty('msg')) {
            console.log(obj);
            throw new Error('Action object must have a msg property.', obj);
        }
        if (obj.hasOwnProperty('action')) {
            console.log(obj);
            throw new Error('Action object must not have an action property.', obj);
        }
        if (!obj.hasOwnProperty('emoji')) {
            console.log(obj);
            throw new Error('Action object must have an emoji property.', obj);
        }

        return {
            from: base.#id,
            ...obj,
        };
    }

    getName() {
        return {
            name: this._name,
            nickname: this._nickname,
        };
    }

    #enoughLuck() {
        const rand = Math.random() * 100;
        const luck = this._luck * 2;
        const enoughLuck = rand < luck;

        if (enoughLuck) {
            this.#usedLuck++;
        }

        return enoughLuck;
    }

    getInt() {
        if (this.#enoughLuck()) {
            return this.welformAction({ emoji: '👟', msg: 'Luck is on your side!', int: this._int + 5, valid: true });
        }

        return this.welformAction({ emoji: '👟', msg: 'No luck this time.', int: this._int, valid: true });
    }

    darkAttack(alternativeMsg = 'Dark attack!') {
        return this.attack(alternativeMsg, '_datk');
    }

    attack(alternativeMsg = 'Attack', damageType = '_atk') {
        if (this.#enoughLuck()) {
            return [
                this.welformAction({
                    msg: `${alternativeMsg} - Critical hit! - Damage: ${this[damageType] * 2}`,
                    emoji: '⚔️',
                    damage: this[damageType] * 2,
                    triggers: 'calcDamage',
                    valid: true,
                }),
            ];
        }

        return [
            this.welformAction({
                msg: alternativeMsg + ` - Damage: ${this[damageType]}`,
                emoji: '⚔️',
                damage: this[damageType],
                triggers: 'calcDamage',
                valid: true,
            }),
        ];
    }

    darkDefend(alternativeMsg = 'Dark defense!') {
        return this.defend(alternativeMsg, '_ddef');
    }

    defend(alternativeMsg = 'Defense.', damageType = '_def') {
        if (this.#enoughLuck()) {
            return this.welformAction({
                msg: `${alternativeMsg} Critical defense! - Defense: ${this[damageType] * 2}`,
                emoji: '🛡️',
                damage: this[damageType] * 2,
                triggers: 'calcDamage',
                valid: true,
            });
        }

        return this.welformAction({
            msg: alternativeMsg + ` - Defense:  ${this[damageType]}`,
            emoji: '🛡️',
            damage: this[damageType],
            triggers: 'calcDamage',
            valid: true,
        });
    }

    calcDamage(attack, defense) {
        const damage = Math.floor(attack.damage - defense.damage);

        if (this._status.includes('invulnerable')) {
            return this.welformAction({
                msg: `${this._name} is invulnerable!`,
                emoji: '🧮',
                damage: 0,
                valid: true,
            });
        }

        if (damage < 0) {
            return this.welformAction({
                msg: `${this._name} takes no damage.`,
                emoji: '🧮',
                hp: this._hp,
                valid: true,
            });
        }

        this._hp -= damage;

        if (this._hp <= 0) {
            return this.welformAction({
                msg: `${this._name} has been defeated!`,
                emoji: '🧮',
                hp: 0,
                valid: true,
            });
        }

        return this.welformAction({
            msg: `${this._name} takes ${damage} damage.`,
            emoji: '🧮',
            hp: this._hp,
            valid: true,
        });
    }

    isDead() {
        return this._hp <= 0;
    }

    buff({ buff: { type, amount, selfBuff }, from }) {
        if (selfBuff && from !== base.#id) {
            return this.welformAction({
                msg: `Buff failed. ${this._name} can only buff itself.`,
                emoji: '📈',
                valid: false,
            });
        }

        if (this.hasOwnProperty(`_${type}`)) {
            this[`_${type}`] += amount;

            return this.welformAction({
                msg: `${this._name}'s ${type} has been increased by ${amount}.`,
                emoji: '📈',
                valid: true,
            });
        }
    }

    defbuff({ buff: { type, amount } }) {
        if (this.hasOwnProperty(`_${type}`)) {
            this[`_${type}`] -= amount;

            if (this[`_${type}`] < 0) {
                this[`_${type}`] = 0;
            }

            return this.welformAction({
                msg: `${this._name}'s ${type} has been decreased by ${amount}.`,
                emoji: '📉',
                valid: true,
            });
        }
    }

    isAbleToUseSkill() {
        return this._mana >= this.minManaUsage;
    }

    getSkills() {
        return {
            skills: this._skills,
            isAbleToUseSkill: this.isAbleToUseSkill(),
        };
    }

    activateStatusOnChar() {
        if (this._status.includes('invulnerable')) {
            return this.welformAction({
                msg: `${this._name} is invulnerable.`,
                emoji: '🧬',
                status: this._status,
                valid: true,
            });
        }

        this._status.forEach(element => {
            if (element === 'poisoned' && !this._status.includes('invulnerable')) {
                this._hp -= 5;
            }
            if (element === 'invulnerable') {
                this._status = this._status.filter(status => status !== 'invulnerable');
            }
            if (element === 'asleep') {
                this._status = this._status.filter(status => status !== 'asleep');
            }
            if (element === 'frozen' && this._int > this._baseInt / 2) {
                this._int = this._int / 2;
            }
            if (element === 'burned' && this._def > this._baseDef - this._baseDef / 3) {
                this._def = Math.floor(this._def - this._def / 3);
            }
            if (element === 'entangled' && this._atk > this._baseAtk - this._baseAtk / 4) {
                this._atk = Math.floor(this._atk - this._atk / 4);
            }
        });

        if (this.isDead()) {
            return this.welformAction({
                msg: `${this._name} has been defeated by status effects!`,
                emoji: '🥚',
                hp: 0,
                status: this._status,
                valid: true,
            });
        }

        return this.welformAction({
            msg: `${this._name} is ${this._status.join(', ')}.`,
            emoji: '🥚',
            status: this._status,
            valid: true,
        });
    }

    isAbleToDoAction() {
        if (this._status.includes('asleep')) {
            return this.welformAction({
                msg: `${this._name} is asleep and misses the turn!`,
                emoji: '💤',
                valid: false,
            });
        }

        return this.welformAction({
            msg: `${this._name} is able to act.`,
            emoji: '🏁',
            valid: true,
        });
    }

    changeStatus(newStatus) {
        const isAlreadyStatus = this._status.includes(newStatus);

        if (isAlreadyStatus) {
            return this.welformAction({
                msg: `${this._name} is already ${newStatus}.`,
                emoji: '🚫',
                status: this._status,
                valid: false,
            });
        }

        this._status.push(newStatus);

        if (newStatus !== 'invulnerable') {
            this._status = this._status.filter(status => status !== 'healthy');
        }

        return this.welformAction({
            msg: `${this._name} is now ${newStatus}.`,
            emoji: '↔️',
            status: this._status,
            valid: true,
        });
    }

    reciveHealing({ heal, selfAction, from }) {
        this._hp += heal;

        if (selfAction && base.#id !== from) {
            return this.welformAction({
                msg: `Healing failed. ${this._name} can only heal itself.`,
                emoji: '❤️‍🩹',
                hp: this._hp,
                valid: false,
            });
        }
        if (this._hp > this._fullHP) {
            this._hp = this._fullHP;
        }

        return this.welformAction({
            msg: `${this._name} heals for ${heal} HP.`,
            emoji: '💊',
            hp: this._hp,
            valid: true,
        });
    }

    reciveMana({ mana, selfAction, from }) {
        this._mana += mana;

        if (selfAction && base.#id !== from) {
            return this.welformAction({
                msg: `Mana healing failed. ${this._name} can only heal itself.`,
                emoji: '🪄',
                hp: this._hp,
                valid: false,
            });
        }
        if (this._mana > this._fullMana) {
            this._mana = this._fullMana;
        }

        return this.welformAction({
            msg: `${this._name} recovers ${mana} mana.`,
            emoji: '🪄',
            mana: this._mana,
            valid: true,
        });
    }

    drainMana({ mana }) {
        this._mana -= mana;

        if (this._mana < 0) {
            this._mana = 0;
        }

        return this.welformAction({
            msg: `${this._name} loses ${mana} mana.`,
            emoji: '🧙🏻‍♀️',
            mana: this._mana,
            valid: true,
        });
    }

    triggerVitality() {
        this._status = ['healthy'];
    }

    reset() {
        this._hp = this._fullHP;
        this.triggerVitality();
        this.#usedLuck = 0;
    }

    toString() {
        const BASE = this._fullHP + this._atk + this._def + this._int + this._datk + this._ddef + this._mana;

        return {
            name: this._name,
            stylizedHP: this._hp + '/' + this._fullHP,
            hp: this._hp,
            fullHP: this._fullHP,
            atk: this._atk,
            baseAtk: this._baseAtk,
            DEF: this._def,
            baseDef: this._baseDef,
            INT: this._int,
            baseInt: this._baseInt,
            DATK: this._datk,
            baseDATK: this._baseDatk,
            DDEF: this._ddef,
            baseDdef: this._baseDdef,
            MANA: this._mana,
            fullMana: this._fullMana,
            LUCK: this._luck,
            RANGE: this._range,
            UsedLuck: this.#usedLuck,
            ID: base.#id,
            skills: this._skills,
            BASE,
        };
    }
}
