import type { interaction } from '../Discord/interfaces/types.js';

export const Opcode = {
    DISPATCH: 0,
    HEARTBEAT: 1,
    IDENTIFY: 2,
    PRESENCE_UPDATE: 3,
    VOICE_STATE_UPDATE: 4,
    RESUME: 6,
    RECONNECT: 7,
    REQUEST_GUILD_MEMBERS: 8,
    INVALID_SESSION: 9,
    HELLO: 10,
    HEARTBEAT_ACK: 11,
    REQUEST_SOUNDBOARD_SOUNDS: 31,
} as const;

export type Opcode = (typeof Opcode)[keyof typeof Opcode];

export interface Message {
    op: Opcode;
    d?: Record<string, unknown> | interaction;
    s?: number;
    t?: string;
}
