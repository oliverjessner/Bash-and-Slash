import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { pathToFileURL } from 'node:url';

import chalk from 'chalk';

import { runBattleSimulator } from './battle-simulator.js';

const PLAYER = 'player';
const ENEMY = 'enemy';

function clearScreen() {
    if (output.isTTY) {
        output.write('\x1B[2J\x1B[3J\x1B[H');
    }
}

function printTitle() {
    clearScreen();
    console.log(chalk.hex('#f59e0b').bold('========================================'));
    console.log(chalk.red.bold('              BASH & SLASH'));
    console.log(chalk.hex('#f59e0b').bold('========================================'));
    console.log(chalk.gray('Waehle deinen Kampfmodus.\n'));
}

async function askName(rl, label, fallback) {
    const answer = (await rl.question(`${label} (${fallback}): `)).trim();

    return answer || fallback;
}

async function askMode(rl) {
    while (true) {
        printTitle();
        console.log(`${chalk.hex('#f59e0b')('1.')} Player vs CPU`);
        console.log(`${chalk.hex('#f59e0b')('2.')} CPU vs CPU`);

        const answer = (await rl.question('\nModus waehlen: ')).trim().toLowerCase();

        if (answer === '1' || answer === 'player vs cpu' || answer === 'pvcpu') {
            console.log('');
            const playerName = await askName(rl, 'Name fuer Spieler', 'Spieler');

            return {
                cpuControlledSides: [ENEMY],
                pauseBetweenRounds: true,
                teamNames: {
                    [PLAYER]: playerName,
                    [ENEMY]: 'CPU',
                },
            };
        }

        if (answer === '2' || answer === 'cpu vs cpu' || answer === 'cpucpu') {
            return {
                cpuControlledSides: [PLAYER, ENEMY],
                pauseBetweenRounds: false,
                teamNames: {
                    [PLAYER]: 'CPU1',
                    [ENEMY]: 'CPU2',
                },
            };
        }

        console.log(chalk.yellow('\nUngueltige Auswahl. Bitte 1 oder 2 eingeben.'));
        await rl.question(chalk.gray('Enter druecken...'));
    }
}

export async function runMenu() {
    const rl = readline.createInterface({ input, output });

    try {
        const options = await askMode(rl);
        await runBattleSimulator(options, rl);
    } finally {
        rl.close();
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    runMenu().catch(error => {
        console.error(`Menue fehlgeschlagen: ${error.message}`);
        process.exitCode = 1;
    });
}
