import type { guildMember, user } from './primaryType.js';

export interface interaction {
    id: string;
    application_id: string;
    type: 1 | 2 | 3 | 4 | 5;
    data?:
        | applicationCommandDataStructure
        | messageComponentDataStructure
        | modalSubmitDataStructure;
    guild?: Record<string, unknown>;
    guild_id?: string;
    channel?: Record<string, unknown>;
    channel_id?: string;
    member?: guildMember;
    user?: user;
    token: string;
    version: number;
    message?: Record<string, unknown>;
    app_permissions: string;
    locale?: string;
    guild_locale?: string;
    authorizing_integration_owners: 0 | 1;
    context?: 0 | 1 | 2;
    attachment_size_limit: number;
}

export interface applicationCommandDataStructure {
    id: string;
    name: string;
    type: number;
    resolved: resolvedData;
    options: applicationCommandInteractionDataOption[];
    guild_id: string;
    target_id: string;
}

export interface messageComponentDataStructure {
    custom_id: string;
    component_type: number;
    values?: {
        type: number;
        id?: number;
        custom_id: string;
        options: {
            label: string;
            value: string;
            description?: string;
            emoji?: Record<string, unknown>;
            default?: boolean;
        }[];
        placeholder?: string;
        min_values?: number;
        max_values?: number;
        required?: boolean;
        disabled?: boolean;
    }[];
    resolved?: resolvedData;
}

export interface modalSubmitDataStructure {
    custom_id: string;
    components: Record<string, unknown>[];
    resolved?: resolvedData;
}

interface resolvedData {
    users?: Record<string, unknown>;
    members?: Record<string, unknown>;
    roles?: Record<string, unknown>;
    channels?: Record<string, unknown>;
    messages?: Record<string, unknown>;
    attachments?: Record<string, unknown>;
}

interface applicationCommandInteractionDataOption {
    name: string;
    type: number;
    value?: string | number | boolean;
    options: applicationCommandInteractionDataOption[];
    focused: boolean;
}
