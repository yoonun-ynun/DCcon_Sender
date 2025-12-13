export type CommandErrorCode = 'MISSING_ARGUMENT' | 'INVALID_ARGUMENT' | 'INDEX_OVERFLOW';

export class CommandError extends Error {
    constructor(
        public readonly code: CommandErrorCode,
        message: string,
    ) {
        super(message);
        this.name = 'CommandError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
