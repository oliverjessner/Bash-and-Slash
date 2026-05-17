import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import chalk from 'chalk';

import Base from './chars/bases/base.js';
import classesData from './chars/classesdata.js';

const PLAYER = 'player';
const ENEMY = 'enemy';
const DEFAULT_TEAM_NAMES = {
    [PLAYER]: 'Spieler',
    [ENEMY]: 'CPU',
};
const DEFAULT_MIN_MANA_USAGE = 20;
const NAME_COLUMN_WIDTH = 28;
const VALUE_COLUMN_WIDTH = 10;
const COMPACT_VALUE_COLUMN_WIDTH = 7;

const classConstructors = new Map();
const characterJobCache = new Map();
const characterEntries = classesData.map(normalizeCharacterEntry);
const execFileAsync = promisify(execFile);

function normalizeCharacterEntry(entry) {
    if (typeof entry === 'string') {
        return {
            name: entry,
            type: 'classes',
        };
    }

    return {
        name: entry.name,
        type: entry.type ?? 'classes',
    };
}

function validateCharacterEntry(entry) {
    if (!entry?.name || !entry?.type) {
        throw new Error('Character entry must have name and type.');
    }

    if (!/^[a-z0-9_-]+$/i.test(entry.name) || !/^[a-z0-9_-]+$/i.test(entry.type)) {
        throw new Error(`Invalid character entry: ${entry.type}/${entry.name}`);
    }
}

function characterKey(entry) {
    return `${entry.type}/${entry.name}`;
}

async function characterJob(entry) {
    validateCharacterEntry(entry);

    const key = characterKey(entry);

    if (!characterJobCache.has(key)) {
        try {
            const script = `
                const type = ${JSON.stringify(entry.type)};
                const name = ${JSON.stringify(entry.name)};
                const module = await import(\`./chars/\${type}/\${name}.js\`);
                const char = new module.default();
                const job = typeof char.getJob === 'function' ? char.getJob() : char._job ?? '';
                process.stdout.write(String(job));
            `;
            const { stdout } = await execFileAsync(process.execPath, ['--input-type=module', '-e', script], {
                cwd: new URL('.', import.meta.url),
            });

            characterJobCache.set(key, stdout.trim() || 'unknown');
        } catch {
            characterJobCache.set(key, 'unknown');
        }
    }

    return characterJobCache.get(key);
}

function sideColor(unit) {
    return unit.side === PLAYER ? chalk.green : chalk.red;
}

function formatHeading(text) {
    return chalk.cyan.bold(text);
}

function clearScreen() {
    if (output.isTTY) {
        output.write('\x1B[2J\x1B[3J\x1B[H');
    }
}

async function loadClassConstructor(characterEntry) {
    validateCharacterEntry(characterEntry);

    const key = characterKey(characterEntry);

    if (!classConstructors.has(key)) {
        const classUrl = new URL(`./chars/${characterEntry.type}/${characterEntry.name}.js`, import.meta.url);
        const classModule = await import(classUrl.href);

        if (typeof classModule.default !== 'function') {
            throw new Error(`Character file for ${key} does not export a constructor.`);
        }

        classConstructors.set(key, classModule.default);
    }

    return classConstructors.get(key);
}

async function createUnit(characterEntry, side, index) {
    const ClassConstructor = await loadClassConstructor(characterEntry);
    const char = new ClassConstructor();

    // The current class methods read minManaUsage from the instance.
    // Keep this local to the simulator instead of changing existing classes.
    if (typeof char.minManaUsage !== 'number') {
        char.minManaUsage = ClassConstructor.minManaUsage ?? DEFAULT_MIN_MANA_USAGE;
    }

    return {
        id: `${side === PLAYER ? 'P' : 'E'}${index}`,
        side,
        className: characterEntry.name,
        type: characterEntry.type,
        char,
    };
}

function isAlive(unit) {
    return unit?.char && typeof unit.char.isDead === 'function' ? !unit.char.isDead() : false;
}

function livingUnits(units) {
    return units.filter(isAlive);
}

function allUnits(teams) {
    return [...teams.player, ...teams.enemy];
}

function otherSide(side) {
    return side === PLAYER ? ENEMY : PLAYER;
}

function normalizeTeamNames(teamNames = {}) {
    return {
        [PLAYER]: String(teamNames[PLAYER] || DEFAULT_TEAM_NAMES[PLAYER]).trim() || DEFAULT_TEAM_NAMES[PLAYER],
        [ENEMY]: String(teamNames[ENEMY] || DEFAULT_TEAM_NAMES[ENEMY]).trim() || DEFAULT_TEAM_NAMES[ENEMY],
    };
}

function teamName(teamNames, side) {
    return teamNames?.[side] ?? DEFAULT_TEAM_NAMES[side] ?? side;
}

function safeToString(unit) {
    try {
        return typeof unit.char.toString === 'function' ? unit.char.toString() : {};
    } catch {
        return {};
    }
}

function safeName(unit) {
    try {
        const name = typeof unit.char.getName === 'function' ? unit.char.getName() : {};
        const className = name.name ?? unit.className ?? unit.char?.constructor?.name ?? 'unknown';
        const nickname = name.nickname ?? className;

        return nickname && nickname !== className ? `${nickname} (${className})` : className;
    } catch {
        return unit.className ?? 'unknown';
    }
}

function formatNumber(value, fallback = '?') {
    return Number.isFinite(value) ? String(Math.max(0, Math.floor(value))) : fallback;
}

function unitHp(unit) {
    const data = safeToString(unit);
    const hp = Number(data.hp ?? unit.char?._hp);
    const maxHp = Number(data.fullHP ?? data.maxHp ?? unit.char?._fullHP);

    if (Number.isFinite(maxHp)) {
        return `${formatNumber(hp)}/${formatNumber(maxHp)}`;
    }

    return formatNumber(hp);
}

function unitMana(unit) {
    const data = safeToString(unit);
    const mana = Number(data.MANA ?? data.mana ?? unit.char?._mana);
    const maxMana = Number(data.fullMana ?? data.maxMana ?? unit.char?._fullMana);

    if (!Number.isFinite(mana) && !Number.isFinite(maxMana)) {
        return '?';
    }

    if (Number.isFinite(maxMana)) {
        return `${formatNumber(mana)}/${formatNumber(maxMana)}`;
    }

    return formatNumber(mana);
}

function unitAtk(unit) {
    const data = safeToString(unit);
    const atk = Number(data.atk ?? data.ATK ?? unit.char?._atk);

    return Number.isFinite(atk) ? atk : 0;
}

function unitDef(unit) {
    const data = safeToString(unit);
    const def = Number(data.DEF ?? data.def ?? unit.char?._def);

    return Number.isFinite(def) ? def : 0;
}

function unitDarkAtk(unit) {
    const data = safeToString(unit);
    const darkAtk = Number(data.DATK ?? data.datk ?? unit.char?._datk);

    return Number.isFinite(darkAtk) ? darkAtk : 0;
}

function unitDarkDef(unit) {
    const data = safeToString(unit);
    const darkDef = Number(data.DDEF ?? data.ddef ?? unit.char?._ddef);

    return Number.isFinite(darkDef) ? darkDef : 0;
}

function estimateAttackDamage(actor, target, { dark = false } = {}) {
    if (!actor || !target || unitStatus(target).includes('invulnerable')) {
        return 0;
    }

    const attack = dark ? unitDarkAtk(actor) : unitAtk(actor);
    const defense = dark ? unitDarkDef(target) : unitDef(target);

    return Math.max(0, Math.floor(attack - defense));
}

function isDarkAttackStronger(actor, target) {
    return estimateAttackDamage(actor, target, { dark: true }) > estimateAttackDamage(actor, target);
}

function switchWeakDarkAttackToNormal(plan) {
    if (plan.kind !== 'darkAttack' || isDarkAttackStronger(plan.actor, plan.target)) {
        return false;
    }

    plan.kind = 'attack';
    plan.skillName = null;
    plan.skillMethod = null;
    plan.targetScope = inferTargetScope(plan.actor, plan.kind, plan.skillName);

    return true;
}

function unitInt(unit) {
    const data = safeToString(unit);
    const intValue = Number(data.INT ?? data.int ?? unit.char?._int);

    return Number.isFinite(intValue) ? intValue : 0;
}

function unitLuck(unit) {
    const data = safeToString(unit);
    const luck = Number(data.LUCK ?? data.luck ?? unit.char?._luck);

    return Number.isFinite(luck) ? luck : 0;
}

function unitStatus(unit) {
    const rawStatus = unit.char?._status ?? safeToString(unit).status ?? [];
    const statuses = Array.isArray(rawStatus) ? rawStatus : [rawStatus];

    if (!isAlive(unit)) {
        return 'dead';
    }

    return statuses.filter(Boolean).join(', ') || 'none';
}

function formatUnitName(unit, { padded = true } = {}) {
    const name = `[${unit.id}] ${safeName(unit)}`;
    const text = padded ? name.padEnd(NAME_COLUMN_WIDTH, ' ') : name;

    return isAlive(unit) ? sideColor(unit)(text) : chalk.gray(text);
}

function formatStatCell(label, value, color = text => text, width = VALUE_COLUMN_WIDTH) {
    return color(`${label} ${value}`.padEnd(width, ' '));
}

function statusColor(status) {
    if (status === 'dead') {
        return chalk.gray;
    }

    if (status === 'healthy') {
        return chalk.green;
    }

    return chalk.yellow;
}

function formatUnitStats(unit, { includeMana = true, includeInt = true, separator = ' | ' } = {}) {
    const status = unitStatus(unit);
    const cells = [formatStatCell('HP', unitHp(unit), chalk.bold)];

    if (includeMana) {
        cells.push(formatStatCell('Mana', unitMana(unit), chalk.blue));
    }

    cells.push(
        formatStatCell('ATK', formatNumber(unitAtk(unit)), text => text, COMPACT_VALUE_COLUMN_WIDTH),
        formatStatCell('DEF', formatNumber(unitDef(unit)), text => text, COMPACT_VALUE_COLUMN_WIDTH),
    );

    if (includeInt) {
        cells.push(formatStatCell('INT', formatNumber(unitInt(unit)), text => text, COMPACT_VALUE_COLUMN_WIDTH));
    }

    cells.push(formatStatCell('LUCK', formatNumber(unitLuck(unit)), text => text, COMPACT_VALUE_COLUMN_WIDTH));

    cells.push(
        formatStatCell('Status', status, text => {
            const plain = `Status ${status}`.padEnd(VALUE_COLUMN_WIDTH, ' ');
            return statusColor(status)(plain);
        }),
    );

    return cells.join(separator);
}

function formatUnitLine(unit) {
    return `${formatUnitName(unit)} | ${formatUnitStats(unit)}`;
}

function formatUnitShort(unit) {
    return `${formatUnitName(unit, { padded: false })} ${formatUnitStats(unit, { includeMana: false, includeInt: false, separator: ' ' })}`;
}

async function printClassList() {
    console.log(`\n${formatHeading('Verfuegbare Klassen:')}`);

    for (const [index, entry] of characterEntries.entries()) {
        const job = await characterJob(entry);
        console.log(
            `  ${chalk.gray(String(index + 1).padStart(2, ' '))}. ${chalk.bold(entry.name)} ${chalk.gray(`(${job})`)}`,
        );
    }
}

function printTeam(title, units) {
    console.log(formatHeading(title));

    [...units]
        .sort((left, right) => unitInt(right) - unitInt(left))
        .forEach(unit => {
            console.log(`  ${formatUnitLine(unit)}`);
        });
}

function formatTurnOrderSummary(roundOrder) {
    return roundOrder.map(entry => formatUnitName(entry.unit, { padded: false })).join(', ');
}

function printRoundOrder(roundOrder) {
    console.log(formatHeading('Zugreihenfolge:'));
    console.log(`  ${formatTurnOrderSummary(roundOrder)}`);
}

function printBattleState(round, teams, roundOrder) {
    const teamNames = teams.teamNames;

    console.log(formatHeading(`===== Runde ${round} =====`));
    printRoundOrder(roundOrder);
    console.log('');
    printTeam(`${teamName(teamNames, PLAYER)} Einheiten:`, teams.player);
    console.log('');
    printTeam(`${teamName(teamNames, ENEMY)} Einheiten:`, teams.enemy);
}

function printChosenActions(plans) {
    console.log(formatHeading('Gewaehlte Aktionen:'));

    if (plans.length === 0) {
        console.log(chalk.gray('  Noch keine Aktionen gewaehlt.'));
        return;
    }

    plans.forEach(plan => {
        console.log(`  ${chalk.hex('#f59e0b')('-')} ${describePlan(plan)}`);
    });
}

function printExecutionLog(executionLog) {
    if (executionLog.length === 0) {
        return;
    }

    console.log(`\n${formatHeading('Ausgefuehrte Aktionen:')}`);
    executionLog.forEach(line => {
        console.log(line);
    });
}

function renderScreen({ round, teams, roundOrder, chosenPlans = [], executionLog = [] }) {
    clearScreen();
    printBattleState(round, teams, roundOrder);
    console.log('');
    printChosenActions(chosenPlans);
    printExecutionLog(executionLog);
}

async function askPositiveInteger(rl, question) {
    while (true) {
        const answer = (await rl.question(question)).trim();
        const value = Number.parseInt(answer, 10);

        if (Number.isInteger(value) && value > 0) {
            return value;
        }

        console.log('Bitte eine ganze Zahl groesser als 0 eingeben.');
    }
}

async function askClassName(rl, question) {
    while (true) {
        const answer = (await rl.question(question)).trim().toLowerCase();
        const index = Number.parseInt(answer, 10);

        if (Number.isInteger(index) && index >= 1 && index <= characterEntries.length) {
            return characterEntries[index - 1];
        }

        const byName = characterEntries.find(entry => entry.name.toLowerCase() === answer);

        if (byName) {
            return byName;
        }

        const byPath = characterEntries.find(entry => `${entry.type}/${entry.name}`.toLowerCase() === answer);

        if (byPath) {
            return byPath;
        }

        console.log('Ungueltige Klasse. Bitte Index oder Namen aus der Liste verwenden.');
    }
}

async function chooseUnits(rl, side, teamNames) {
    const label = teamName(teamNames, side);
    const amount = await askPositiveInteger(rl, `\nWie viele Einheiten fuer ${label}? `);
    const units = [];

    for (let index = 1; index <= amount; index++) {
        await printClassList();
        const characterEntry = await askClassName(rl, `${label} Einheit ${index}: Klasse waehlen: `);
        units.push(await createUnit(characterEntry, side, index));
    }

    return units;
}

function safeSkills(unit) {
    try {
        const skillInfo = typeof unit.char.getSkills === 'function' ? unit.char.getSkills() : {};
        const skills = Array.isArray(skillInfo.skills) ? skillInfo.skills.filter(Boolean) : [];
        const isAbleToUseSkill =
            typeof unit.char.isAbleToUseSkill === 'function'
                ? unit.char.isAbleToUseSkill()
                : Boolean(skillInfo.isAbleToUseSkill);

        return {
            skills,
            isAbleToUseSkill,
        };
    } catch {
        return {
            skills: [],
            isAbleToUseSkill: false,
        };
    }
}

function resolveSkillMethod(char, skillName) {
    if (typeof char?.[skillName] === 'function') {
        return skillName;
    }

    const normalized = String(skillName).toLowerCase();
    let proto = char;

    while (proto && proto !== Object.prototype) {
        for (const property of Object.getOwnPropertyNames(proto)) {
            if (
                property !== 'constructor' &&
                property.toLowerCase() === normalized &&
                typeof char[property] === 'function'
            ) {
                return property;
            }
        }

        proto = Object.getPrototypeOf(proto);
    }

    return null;
}

function inferTargetScope(unit, kind, skillName) {
    if (kind === 'attack' || kind === 'darkAttack') {
        return 'enemy';
    }

    const skill = String(skillName ?? '').toLowerCase();

    if (skill === 'selfheal' || (unit.className === 'berserker' && skill === 'atkbuff')) {
        return 'self';
    }

    if (skill.includes('debuff')) {
        return 'enemy';
    }

    if (skill.includes('heal') || skill.includes('buff') || skill === 'vitality' || skill === 'invulnerability') {
        return 'ally';
    }

    if (
        skill.includes('attack') ||
        skill.includes('breath') ||
        skill.includes('ball') ||
        skill.includes('shard') ||
        skill === 'sleep' ||
        skill === 'manadrain' ||
        skill === 'poisonarrow'
    ) {
        return 'enemy';
    }

    return 'enemy';
}

function printUnitInfo(unit) {
    const skillInfo = safeSkills(unit);

    console.log(`\n${formatHeading(`Info fuer ${safeName(unit)}`)}`);
    console.log(`  ${formatUnitLine(unit)}`);
    console.log(
        `  Dark ATK ${formatNumber(Number(safeToString(unit).DATK ?? unit.char?._datk))} | Dark DEF ${formatNumber(Number(safeToString(unit).DDEF ?? unit.char?._ddef))} | Luck ${formatNumber(Number(safeToString(unit).LUCK ?? unit.char?._luck))} | Range ${formatNumber(Number(safeToString(unit).RANGE ?? unit.char?._range))}`,
    );

    if (skillInfo.skills.length === 0) {
        console.log(chalk.gray('  Keine Skills verfuegbar.'));
        return;
    }

    console.log('  Skills:');
    skillInfo.skills.forEach((skill, index) => {
        const method = resolveSkillMethod(unit.char, skill);
        const scope = inferTargetScope(unit, 'skill', skill);
        const methodText = method && method !== skill ? chalk.gray(` -> ${method}`) : '';
        const unavailable = method ? '' : chalk.red(' (nicht implementiert)');
        const manaText = skillInfo.isAbleToUseSkill ? chalk.green('Mana ok') : chalk.yellow('wenig Mana');

        console.log(`    ${index + 1}. ${chalk.bold(skill)}${methodText}${unavailable} | Ziel: ${scope} | ${manaText}`);
    });
}

function targetCandidates(teams, unit, scope) {
    if (scope === 'self') {
        return isAlive(unit) ? [unit] : [];
    }

    if (scope === 'ally') {
        return livingUnits(teams[unit.side]);
    }

    if (scope === 'enemy') {
        return livingUnits(teams[otherSide(unit.side)]);
    }

    return livingUnits(allUnits(teams));
}

async function askTarget(rl, teams, unit, scope) {
    const candidates = targetCandidates(teams, unit, scope);

    if (candidates.length === 0) {
        return null;
    }

    if (scope === 'self') {
        console.log(`  Ziel: ${formatUnitShort(unit)}`);
        return unit;
    }

    console.log('  Ziele:');
    candidates.forEach((candidate, index) => {
        console.log(`    ${index + 1}. ${formatUnitShort(candidate)}`);
    });

    while (true) {
        const answer = (await rl.question('  Ziel waehlen: ')).trim().toLowerCase();
        const index = Number.parseInt(answer, 10);

        if (Number.isInteger(index) && index >= 1 && index <= candidates.length) {
            return candidates[index - 1];
        }

        const byId = candidates.find(candidate => candidate.id.toLowerCase() === answer);

        if (byId) {
            return byId;
        }

        console.log('  Ungueltiges Ziel. Bitte Index oder Einheiten-ID verwenden.');
    }
}

function printActionMenu(unit, skillInfo) {
    console.log(`\n${formatHeading(`Aktion fuer ${safeName(unit)}`)}`);
    console.log(`  ${formatUnitShort(unit)}`);
    console.log(`${chalk.hex('#f59e0b')('1.')} attack`);
    console.log(`${chalk.hex('#f59e0b')('2.')} dark attack`);

    if (skillInfo.skills.length > 0) {
        const manaHint = skillInfo.isAbleToUseSkill ? '' : chalk.yellow(' (vermutlich nicht genug Mana)');
        console.log(`${chalk.hex('#f59e0b')('3.')} skill${manaHint}`);
    }

    console.log(`${chalk.gray('i.')} info`);
}

function printSkillMenu(unit, skillInfo) {
    console.log(`\n${formatHeading(`Skill fuer ${safeName(unit)}`)}`);
    skillInfo.skills.forEach((skill, index) => {
        const method = resolveSkillMethod(unit.char, skill);
        const methodHint = method && method !== skill ? chalk.gray(` -> ${method}`) : '';
        const unavailable = method ? '' : chalk.red(' (nicht implementiert)');
        console.log(`${chalk.hex('#f59e0b')(`${index + 1}.`)} ${chalk.bold(skill)}${methodHint}${unavailable}`);
    });
    console.log(`${chalk.gray('i.')} info`);
}

async function askPlayerAction(rl, teams, unit, sequence, viewState) {
    const skillInfo = safeSkills(unit);
    const hasSkills = skillInfo.skills.length > 0;

    let kind = 'attack';
    let showInfo = false;
    let notice = null;

    while (true) {
        renderScreen(viewState);
        if (showInfo) {
            printUnitInfo(unit);
            showInfo = false;
        }
        if (notice) {
            console.log(chalk.yellow(`\n${notice}`));
            notice = null;
        }
        printActionMenu(unit, skillInfo);

        const answer = (await rl.question('  Aktion waehlen: ')).trim().toLowerCase();

        if (answer === 'info' || answer === 'i' || answer === '?') {
            showInfo = true;
            continue;
        }

        if (answer === '1' || answer === 'attack' || answer === 'a' || (!answer && !hasSkills)) {
            kind = 'attack';
            break;
        }

        if (
            answer === '2' ||
            answer === 'dark' ||
            answer === 'darkattack' ||
            answer === 'dark attack' ||
            answer === 'd'
        ) {
            kind = 'darkAttack';
            break;
        }

        if (hasSkills && (answer === '3' || answer === 'skill' || answer === 's')) {
            if (!skillInfo.isAbleToUseSkill) {
                notice = `${safeName(unit)} hat nicht genug Mana fuer Skills.`;
                continue;
            }

            kind = 'skill';
            break;
        }

        console.log(
            hasSkills
                ? '  Ungueltige Aktion. Bitte attack, dark attack, skill oder info waehlen.'
                : '  Ungueltige Aktion. Bitte attack, dark attack oder info waehlen.',
        );
    }

    let skillName = null;
    let skillMethod = null;

    if (kind === 'skill') {
        while (true) {
            renderScreen(viewState);
            if (showInfo) {
                printUnitInfo(unit);
                showInfo = false;
            }
            printSkillMenu(unit, skillInfo);

            const answer = (await rl.question('  Skill waehlen: ')).trim().toLowerCase();
            const index = Number.parseInt(answer, 10);

            if (answer === 'info' || answer === 'i' || answer === '?') {
                showInfo = true;
                continue;
            }

            if (Number.isInteger(index) && index >= 1 && index <= skillInfo.skills.length) {
                skillName = skillInfo.skills[index - 1];
                skillMethod = resolveSkillMethod(unit.char, skillName);
                break;
            }

            const byName = skillInfo.skills.find(skill => skill.toLowerCase() === answer);

            if (byName) {
                skillName = byName;
                skillMethod = resolveSkillMethod(unit.char, skillName);
                break;
            }

            console.log('  Ungueltiger Skill. Bitte Index oder Skill-Namen verwenden.');
        }
    }

    const scope = inferTargetScope(unit, kind, skillName);
    const target = await askTarget(rl, teams, unit, scope);

    return {
        actor: unit,
        kind,
        skillName,
        skillMethod,
        target,
        targetScope: scope,
        sequence,
    };
}

function randomItem(items) {
    if (items.length === 0) {
        return null;
    }

    return items[Math.floor(Math.random() * items.length)];
}

function chooseAiAction(teams, unit, sequence) {
    const skillInfo = safeSkills(unit);
    const possibleActions = ['attack', 'darkAttack'];

    if (skillInfo.isAbleToUseSkill && skillInfo.skills.length > 0) {
        possibleActions.push('skill');
    }

    const kind = randomItem(possibleActions);
    const skillName = kind === 'skill' ? randomItem(skillInfo.skills) : null;
    const skillMethod = skillName ? resolveSkillMethod(unit.char, skillName) : null;
    const scope = inferTargetScope(unit, kind, skillName);
    const target = randomItem(targetCandidates(teams, unit, scope));

    const plan = {
        actor: unit,
        kind,
        skillName,
        skillMethod,
        target,
        targetScope: scope,
        sequence,
    };

    switchWeakDarkAttackToNormal(plan);

    return plan;
}

function getInitiative(unit) {
    try {
        const result = typeof unit.char.getInt === 'function' ? unit.char.getInt() : null;
        const intValue = Number(result?.int ?? unitInt(unit));

        return Number.isFinite(intValue) ? intValue : 0;
    } catch (error) {
        console.log(`  Initiative fuer ${unit.id} konnte nicht gelesen werden: ${error.message}`);
        return unitInt(unit);
    }
}

function buildRoundOrder(teams) {
    return [...livingUnits(teams.player), ...livingUnits(teams.enemy)]
        .map((unit, sequence) => ({
            unit,
            sequence,
            initiative: getInitiative(unit),
        }))
        .sort((left, right) => {
            if (right.initiative !== left.initiative) {
                return right.initiative - left.initiative;
            }

            return left.sequence - right.sequence;
        });
}

function initiativeFromRoundOrder(roundOrder, unit) {
    return roundOrder.find(entry => entry.unit === unit)?.initiative ?? getInitiative(unit);
}

function describePlan(plan) {
    const action = plan.kind === 'skill' ? plan.skillName : plan.kind === 'darkAttack' ? 'dark attack' : 'attack';
    const target = plan.target ? ` -> ${formatUnitName(plan.target, { padded: false })}` : ' -> kein Ziel';

    return `${formatUnitName(plan.actor, { padded: false })} ${action}${target}`;
}

function isCpuControlled(unit, options) {
    return options.cpuControlledSides.includes(unit.side);
}

async function collectRoundPlans(rl, teams, roundOrder, viewState, options) {
    const plans = [];
    let sequence = 0;

    for (const unit of livingUnits(teams.player)) {
        viewState.chosenPlans = plans;
        plans.push(
            isCpuControlled(unit, options)
                ? chooseAiAction(teams, unit, sequence++)
                : await askPlayerAction(rl, teams, unit, sequence++, viewState),
        );
        viewState.chosenPlans = plans;
        renderScreen(viewState);
    }

    for (const unit of livingUnits(teams.enemy)) {
        plans.push(chooseAiAction(teams, unit, sequence++));
    }

    for (const plan of plans) {
        plan.initiative = initiativeFromRoundOrder(roundOrder, plan.actor);
    }

    plans.sort((left, right) => {
        if (right.initiative !== left.initiative) {
            return right.initiative - left.initiative;
        }

        return left.sequence - right.sequence;
    });

    viewState.chosenPlans = plans;
    renderScreen(viewState);

    return plans;
}

function flattenActions(value) {
    if (Array.isArray(value)) {
        return value.flatMap(flattenActions);
    }

    if (value && typeof value === 'object') {
        return [value];
    }

    return [];
}

function tagActionResults(value, patch) {
    if (Array.isArray(value)) {
        return value.map(item => tagActionResults(item, patch));
    }

    if (value && typeof value === 'object') {
        return {
            ...value,
            ...patch,
        };
    }

    return value;
}

function actionTrigger(action) {
    return action?.trigger ?? action?.triggers ?? null;
}

function messageEmoji(action) {
    if (action?.valid === false) {
        return '⚠️';
    }

    if (
        String(action?.msg ?? '')
            .toLowerCase()
            .includes('defeated')
    ) {
        return '💀';
    }

    switch (actionTrigger(action)) {
        case 'calcDamage':
            return '💥';
        case 'changeStatus':
            return '✨';
        case 'reciveHealing':
        case 'manaHeal':
            return '💚';
        case 'manaDrain':
            return '🔵';
        case 'buff':
            return '⬆️';
        case 'debuff':
            return '⬇️';
        case 'triggerVitality':
            return '🌿';
        default:
            return '•';
    }
}

function printActionMessage(action, prefix = '  ') {
    if (action?.msg) {
        const formattedMsg = `${messageEmoji(action)} ${action.msg}`;
        const message =
            action.valid === false
                ? chalk.yellow(formattedMsg)
                : String(action.msg).toLowerCase().includes('defeated')
                  ? chalk.red.bold(formattedMsg)
                  : chalk.white(formattedMsg);

        console.log(`${prefix}${message}`);
    }
}

function normalizeBuffAction(action) {
    const buff = action.buff ?? action.debuff;

    if (!buff || typeof buff !== 'object') {
        return action;
    }

    return {
        ...action,
        buff: {
            ...buff,
            selfBuff: buff.selfBuff ?? buff.selfBuf ?? action.selfBuff,
        },
    };
}

function printResult(result) {
    for (const action of flattenActions(result)) {
        printActionMessage(action);
    }
}

function findReplacementTarget(teams, plan) {
    const candidates = targetCandidates(teams, plan.actor, plan.targetScope);

    return candidates.find(candidate => candidate.id !== plan.target?.id) ?? candidates[0] ?? null;
}

function executeRawAction(action, plan, teams) {
    printActionMessage(action);

    if (action?.valid === false) {
        return;
    }

    const trigger = actionTrigger(action);
    const target = plan.target;

    if (!trigger) {
        return;
    }

    if (!target || !isAlive(target)) {
        console.log('  Kein lebendes Ziel fuer diese Action.');
        return;
    }

    try {
        switch (trigger) {
            case 'calcDamage': {
                const damage = Number(action.damage);

                if (!Number.isFinite(damage)) {
                    console.log('  Schaden konnte nicht berechnet werden.');
                    return;
                }

                const usesDarkDefense = plan.kind === 'darkAttack' || action.defenseType === 'dark';
                const defenseMethod =
                    usesDarkDefense && typeof target.char.darkDefend === 'function' ? 'darkDefend' : 'defend';
                const defense =
                    typeof target.char[defenseMethod] === 'function'
                        ? target.char[defenseMethod]()
                        : { msg: `${safeName(target)} kann sich nicht verteidigen.`, damage: 0, valid: true };

                printActionMessage(defense);
                printResult(target.char.calcDamage(action, defense));
                return;
            }

            case 'changeStatus':
                if (!action.status || typeof target.char.changeStatus !== 'function') {
                    console.log('  Status konnte nicht angewendet werden.');
                    return;
                }

                printResult(target.char.changeStatus(action.status));
                return;

            case 'reciveHealing':
                if (typeof target.char.reciveHealing !== 'function') {
                    console.log('  Ziel kann keine Heilung empfangen.');
                    return;
                }

                printResult(target.char.reciveHealing(action));
                return;

            case 'manaHeal':
                if (typeof target.char.reciveMana !== 'function') {
                    console.log('  Ziel kann kein Mana empfangen.');
                    return;
                }

                printResult(target.char.reciveMana({ ...action, mana: action.manaHeal ?? action.mana }));
                return;

            case 'manaDrain':
                if (typeof target.char.drainMana !== 'function') {
                    console.log('  Ziel kann kein Mana verlieren.');
                    return;
                }

                printResult(target.char.drainMana(action));
                return;

            case 'buff':
                if (typeof Base.prototype.buff !== 'function') {
                    console.log('  Buff-Verarbeitung ist nicht verfuegbar.');
                    return;
                }

                printResult(Base.prototype.buff.call(target.char, normalizeBuffAction(action)));
                return;

            case 'debuff':
                if (target.side === plan.actor.side) {
                    console.log('  Debuff kann nur auf gegnerische Einheiten angewendet werden.');
                    return;
                }

                if (typeof target.char.defbuff !== 'function') {
                    console.log('  Debuff-Verarbeitung ist nicht verfuegbar.');
                    return;
                }

                printResult(target.char.defbuff(normalizeBuffAction(action)));
                return;

            case 'triggerVitality':
                if (typeof target.char.triggerVitality !== 'function') {
                    console.log('  Vitality konnte nicht angewendet werden.');
                    return;
                }

                target.char.triggerVitality();
                console.log(`  ${safeName(target)} ist wieder healthy.`);
                return;

            default:
                console.log(`  Kein Handler fuer Trigger "${trigger}".`);
        }
    } catch (error) {
        console.log(`  Fehler bei Trigger "${trigger}": ${error.message}`);
    }
}

function runActionMethod(plan) {
    if (plan.kind === 'attack') {
        if (typeof plan.actor.char.attack !== 'function') {
            return { msg: `${safeName(plan.actor)} kann nicht angreifen.`, valid: false };
        }

        return plan.actor.char.attack();
    }

    if (plan.kind === 'darkAttack') {
        if (typeof plan.actor.char.darkAttack !== 'function') {
            return { msg: `${safeName(plan.actor)} kann keinen Dark Attack ausfuehren.`, valid: false };
        }

        return tagActionResults(plan.actor.char.darkAttack(), { defenseType: 'dark' });
    }

    if (!plan.skillMethod) {
        return { msg: `Skill ${plan.skillName} ist fuer ${safeName(plan.actor)} nicht implementiert.`, valid: false };
    }

    if (typeof plan.actor.char.isAbleToUseSkill === 'function' && !plan.actor.char.isAbleToUseSkill()) {
        return { msg: `${safeName(plan.actor)} hat nicht genug Mana fuer ${plan.skillName}.`, valid: false };
    }

    return plan.actor.char[plan.skillMethod]();
}

function canAct(unit) {
    if (typeof unit.char.isAbleToDoAction !== 'function') {
        return true;
    }

    const result = unit.char.isAbleToDoAction();
    printActionMessage(result);

    return result?.valid !== false;
}

function executePlan(plan, teams, options) {
    if (!isAlive(plan.actor)) {
        console.log(`\n> ${plan.actor.id} ${safeName(plan.actor)} ist tot und kann nicht handeln.`);
        return;
    }

    let replacementMessage = null;

    if (plan.target && !isAlive(plan.target)) {
        const replacement = findReplacementTarget(teams, plan);

        if (!replacement || !isAlive(replacement)) {
            console.log(`\n> ${describePlan(plan)}`);
            console.log('  Ziel ist tot, keine Ersatz-Ziele verfuegbar.');
            return;
        }

        replacementMessage = `Ziel ${plan.target.id} ist tot. Neues Ziel: ${replacement.id} ${safeName(replacement)}`;
        plan.target = replacement;
    }

    const switchedAttack = isCpuControlled(plan.actor, options) ? switchWeakDarkAttackToNormal(plan) : false;

    if (replacementMessage) {
        console.log(`\n> ${replacementMessage}`);
        console.log(`  ${describePlan(plan)}`);
    } else {
        console.log(`\n> ${describePlan(plan)}`);
    }

    if (switchedAttack) {
        console.log('  KI wechselt auf normalen Angriff, weil Dark Attack nicht mehr Schaden verursacht.');
    }

    if (!canAct(plan.actor)) {
        return;
    }

    let rawResult;

    try {
        rawResult = runActionMethod(plan);
    } catch (error) {
        console.log(`  Action konnte nicht ausgefuehrt werden: ${error.message}`);
        return;
    }

    const actions = flattenActions(rawResult);

    if (actions.length === 0) {
        console.log('  Action hat kein verarbeitbares Ergebnis geliefert.');
        return;
    }

    for (const action of actions) {
        executeRawAction(action, plan, teams);
    }
}

function printRoundStatusEffects(teams) {
    console.log(`\n${formatHeading('Status nach der Runde:')}`);

    for (const unit of livingUnits(allUnits(teams))) {
        try {
            printResult(unit.char.activateStatusOnChar());
        } catch (error) {
            console.log(`  Status fuer ${unit.id} konnte nicht aktiviert werden: ${error.message}`);
        }
    }
}

function winner(teams) {
    const playerAlive = livingUnits(teams.player).length > 0;
    const enemyAlive = livingUnits(teams.enemy).length > 0;

    if (playerAlive && enemyAlive) {
        return null;
    }

    if (playerAlive) {
        return PLAYER;
    }

    if (enemyAlive) {
        return ENEMY;
    }

    return 'draw';
}

function printWinner(result, round, teamNames) {
    console.log(`\n${formatHeading('===== Ergebnis =====')}`);

    if (result === PLAYER) {
        console.log(
            chalk.green.bold(
                `${teamName(teamNames, PLAYER)} gewinnt. ${teamName(teamNames, ENEMY)} ist nach ${round - 1} Runden besiegt.`,
            ),
        );
    } else if (result === ENEMY) {
        console.log(
            chalk.red.bold(
                `${teamName(teamNames, ENEMY)} gewinnt. ${teamName(teamNames, PLAYER)} ist nach ${round - 1} Runden besiegt.`,
            ),
        );
    } else {
        console.log(chalk.yellow.bold('Unentschieden. Beide Seiten wurden besiegt.'));
    }
}

function captureConsole(callback) {
    const outputLines = [];
    const originalLog = console.log;

    console.log = (...args) => {
        outputLines.push(args.join(' '));
    };

    try {
        callback();
    } finally {
        console.log = originalLog;
    }

    return outputLines;
}

async function confirmNextRound(rl, nextRound, viewState) {
    renderScreen(viewState);
    console.log(`\n${formatHeading('Rundenzusammenfassung')}`);
    await rl.question(chalk.gray(`Enter druecken fuer Runde ${nextRound}...`));
}

async function runBattle(rl, teams, options) {
    let round = 1;

    while (!winner(teams)) {
        const roundOrder = buildRoundOrder(teams);
        const viewState = {
            round,
            teams,
            roundOrder,
            chosenPlans: [],
            executionLog: [],
        };

        renderScreen(viewState);

        const plans = await collectRoundPlans(rl, teams, roundOrder, viewState, options);

        for (const plan of plans) {
            if (winner(teams)) {
                break;
            }

            const logLines = captureConsole(() => executePlan(plan, teams, options));
            viewState.executionLog.push(...logLines);
            renderScreen(viewState);
        }

        const statusLines = captureConsole(() => printRoundStatusEffects(teams));
        viewState.executionLog.push(...statusLines);

        if (!winner(teams) && options.pauseBetweenRounds) {
            await confirmNextRound(rl, round + 1, viewState);
        } else {
            renderScreen(viewState);
        }

        round++;
    }

    printWinner(winner(teams), round, teams.teamNames);
}

export async function runBattleSimulator({
    cpuControlledSides = [ENEMY],
    pauseBetweenRounds = true,
    teamNames: requestedTeamNames = DEFAULT_TEAM_NAMES,
} = {}, existingReadline = null) {
    const rl = existingReadline ?? readline.createInterface({ input, output });
    const shouldCloseReadline = !existingReadline;
    const teamNames = normalizeTeamNames(requestedTeamNames);

    try {
        await printClassList();

        const teams = {
            player: await chooseUnits(rl, PLAYER, teamNames),
            enemy: await chooseUnits(rl, ENEMY, teamNames),
            teamNames,
        };

        await runBattle(rl, teams, { cpuControlledSides, pauseBetweenRounds });
    } finally {
        if (shouldCloseReadline) {
            rl.close();
        }
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    runBattleSimulator().catch(error => {
        console.error(`Battle-Simulator fehlgeschlagen: ${error.message}`);
        process.exitCode = 1;
    });
}
