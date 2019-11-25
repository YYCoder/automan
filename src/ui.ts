import chalk from 'chalk';

export const boldRed = chalk.bold.red;
export const boldOrange = chalk.bold.keyword('orange');
export const greenBright = chalk.greenBright;

export const error = (e: Error) => {
    console.error(boldRed(e.message));
    console.error(e);
}

export const warning = (...args: any[]) => console.error(chalk.bold.keyword('orange')(...args));

export const info = (...args: any[]) => console.log(greenBright(...args));