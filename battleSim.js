function attackPhase(attacker, defender) {
    const atts = attacker.attack();
    const def = defender.defend();

    atts.forEach(a => defender.calcDamage(a, def));
}

function battle(char1, char2) {
    while (!char1.isDead() && !char2.isDead()) {
        const atts1 = char1.attack();
        const def1 = char1.defend();

        const atts2 = char2.attack();
        const def2 = char2.defend();

        const status1 = char1.activateStatusOnChar();
        const status2 = char2.activateStatusOnChar();

        if (char1.isDead()) {
            return char2;
        }
        if (char2.isDead()) {
            return char1;
        }

        if (char1.getInt().int > char2.getInt().int) {
            const result1 = atts1.forEach(a => char2.calcDamage(a, def2));

            if (char2.isDead()) {
                return char1;
            }

            const result2 = atts2.forEach(a => char1.calcDamage(a, def1));

            if (char1.isDead()) {
                return char2;
            }
        } else {
            const result1 = atts2.forEach(a => char1.calcDamage(a, def1));

            if (char1.isDead()) {
                return char2;
            }

            const result2 = atts1.forEach(a => char2.calcDamage(a, def2));

            if (char2.isDead()) {
                return char1;
            }
        }

        char1.activateStatusOnChar();
        char2.activateStatusOnChar();
    }
}

function generateReport(char1, char2, winner, amount) {
    const name1 = char1.getName().name;
    const name2 = char2.getName().name;
    const title = `${name1} vs ${name2}`;
    const winnsChar1 = winner.filter(w => w === char1).length;
    const winnsChar2 = winner.filter(w => w === char2).length;

    return {
        title,
        winner: winnsChar1 > winnsChar2 ? name1 : name2,
        [name1]: winnsChar1,
        [name2]: winnsChar2,
    };
}

export default function battleSim(char1, char2, amount = 10) {
    const winner = [];

    for (let i = 0; i < amount; i++) {
        winner.push(battle(char1, char2));
        char1.reset();
        char2.reset();
    }

    return generateReport(char1, char2, winner, amount);
}
