export interface DiscordMessageBody {
    content?: string;
    nonce?: string | number;
    tts?: boolean;
    embeds?: embed[];
    allowed_mentions?: {
        parse?: ('users' | 'roles' | 'everyone')[];
        roles?: string[];
        users?: string[];
        replied_user?: boolean;
    };
    message_reference?: {
        type: 0 | 1;
        message_id?: string;
        channel_id?: string;
        guild_id?: string;
        fail_if_not_exists?: boolean;
    };
    components?: Record<string, unknown>[];
    sticker_ids?: string[];
    enforce_nonce?: boolean;
    poll?: {
        question: {
            text: string;
        };
        answers: {
            answer_id: number;
            poll_media: {
                text: string;
            };
        }[];
        /** ISO 8601 timestamp, use Date.toISOString() */
        expiry: string;
        allow_multiselect: boolean;
        layout_type: number;
        results?: {
            is_finalized: boolean;
            answer_counts: {
                id: number;
                count: number;
                me_voted: boolean;
            }[];
        };
    };
}

export type Command_List = 'list' | 'select' | 'profile';

export interface CommandPayload {
    name: Command_List;
    user?: {
        user_name?: string;
        user_id: string;
        avatar_link?: string;
    };
    application: {
        application_id: string;
    };
    interaction: {
        interaction_token: string;
    };
    select?: {
        selectedCon?: number;
        index?: string;
        selector?: number;
    };
}

export interface DiscordMessagePayload extends DiscordMessageBody {
    attachments: {
        id: number;
        filename: string;
    }[];
}

export interface DiscordCommandPayload {
    name: string;
    name_localizations?: Record<string, string>;
    description?: string;
    description_localizations?: Record<string, string>;
    options?: (DiscordCommandOption | DiscordSubCommandOption)[];
    default_member_permissions?: string;
    dm_permission?: boolean;
    default_permission?: boolean;
    integration_types?: 0 | 1;
    contexts?: 0 | 1 | 2;
    /** 1 is default */
    type?: 1 | 2 | 3 | 4;
    nsfw?: boolean;
}

export interface interactionResponse {
    type: number;
    data?: Record<string, unknown>;
}

export interface editMessage {
    content?: string;
    embeds?: embed[];
    flags?: number;
    allowed_mentions?: Record<string, string[]>;
    components?: Record<string, unknown>[];
    attachments?: {
        id: number;
        filename: string;
    }[];
    poll?: {
        question: {
            text: string;
        };
        answers: {
            answer_id: number;
            poll_media: {
                text: string;
            };
        }[];
        /** ISO 8601 timestamp, use Date.toISOString() */
        expiry: string;
        allow_multiselect: boolean;
        layout_type: number;
        results?: {
            is_finalized: boolean;
            answer_counts: {
                id: number;
                count: number;
                me_voted: boolean;
            }[];
        };
    };
}

interface embed {
    title?: string;
    type?: string;
    description?: string;
    url?: string;
    /** ISO 8601 timestamp, use Date.toISOString() */
    timestamp?: string;
    color?: number;
    footer?: {
        text: string;
        icon_url?: string;
        proxy_icon_url?: string;
    };
    image?: {
        url: string;
        proxy_url?: string;
        height?: number;
        width?: number;
    };
    thumbnail?: {
        url: string;
        proxy_url?: string;
        height?: number;
        width?: number;
    };
    video?: {
        url?: string;
        proxy_url?: string;
        height?: number;
        width?: number;
    };
    provider?: {
        name?: string;
        url?: string;
    };
    author?: {
        name: string;
        url?: string;
        icon_url?: string;
        proxy_icon_url?: string;
    };
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
}

interface DiscordCommandOption {
    type: CommandOptionType;
    name: string;
    description: string;
    name_localizations?: Record<string, string>;
    description_localizations?: Record<string, string>;
    required?: boolean;
    choices?: {
        name: string;
        name_localizations?: Record<string, string>;
        value: string | number;
    };
    channel_types?: number[];
    /** use this option when type is integer or number */
    min_value?: number;
    /** use this option when type is integer or number */
    max_value?: number;
    /** use this option when type is string */
    min_length?: string;
    /** use this option when type is string */
    max_length?: string;
    /** use this option when type is string or integer or number */
    autocomplete?: boolean;
}

interface DiscordSubCommandOption extends Omit<DiscordCommandOption, 'required'> {
    type: 1 | 2;
    options?: DiscordCommandOption;
}

const CommandOptionType = {
    SUB_COMMAND: 1,
    SUB_COMMAND_GROUP: 2,
    STRING: 3,
    INTEGER: 4,
    BOOLEAN: 5,
    USER: 6,
    CHANNEL: 7,
    ROLE: 8,
    MENTIONABLE: 9,
    NUMBER: 10,
    ATTACHMENT: 11,
} as const;

type CommandOptionType = (typeof CommandOptionType)[keyof typeof CommandOptionType];
