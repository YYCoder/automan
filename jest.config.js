module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    globals: {
        'ts-jest': {
            tsconfig: './tsconfig.json'
        }
    },
    collectCoverage: true,
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/**/*.d.ts",
        "bin/**/*.ts",
        "!bin/**/*.d.ts",
    ]
};