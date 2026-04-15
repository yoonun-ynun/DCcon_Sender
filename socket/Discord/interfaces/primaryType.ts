import { type embed } from './Payloads.js';
import { type interaction } from './types.js';

export interface user {
    id: string;
    username: string;
    discriminator: string;
    global_name: string | null;
    avatar: string | null;
    bot?: boolean;
    system?: boolean;
    mfa_enabled?: boolean;
    banner?: string | null;
    accent_color?: string | null;
    locale?: string;
    verified?: boolean;
    email?: string | null;
    flags?: number;
    premium_type?: number;
    public_flags?: number;
    avatar_decoration_data?: {
        asset: string;
        sku_id: string;
    } | null;
    collectibles?: Record<string, unknown>;
    primary_guild?: Record<string, unknown>;
}

export interface guildMember {
    user?: user;
    nick?: string | null;
    avatar?: string | null;
    banner?: string | null;
    roles: Record<string, unknown>[];
    /** ISO8601 timestamp */
    joined_at: string | null;
    /** ISO8601 timestamp */
    premium_since?: string | null;
    deaf: boolean;
    mute: boolean;
    flags: number;
    pending?: boolean;
    permissions?: string;
    /** ISO8601 timestamp */
    communication_disabled_until?: string | null;
    avatar_decoration_data?: {
        asset: string;
        sku_id: string;
    } | null;
}

export interface message {
    id: string;
    channel_id: string;
    author: user;
    content: string;
    /** ISO8601 timestamp */
    timestamp: string;
    /** ISO8601 timestamp */
    edited_timestamp?: string;
    tts: boolean;
    mention_everyone: boolean;
    mentions: user[];
    mention_roles: Record<string, unknown>[];
    mention_channels?: Record<string, unknown>[];
    attachments: Record<string, unknown>[];
    embeds: embed[];
    reactions?: Record<string, unknown>[];
    nonce?: number | string;
    pinned: boolean;
    webhook_id?: string;
    type: number;
    activity?: Record<string, unknown>;
    application?: Record<string, unknown>;
    application_id?: string;
    flags?: number;
    message_reference?: Record<string, unknown>;
    message_snapshots?: Record<string, unknown>[];
    referenced_message?: message;
    interaction_metadata?: Record<string, unknown>;
    interaction?: interaction;
    thread?: Record<string, unknown>;
    components?: Record<string, unknown>[];
    sticker_items?: Record<string, unknown>[];
    stickers?: Record<string, unknown>[];
    position?: number;
    role_subscription_data?: Record<string, unknown>;
    resolved?: Record<string, unknown>;
    poll?: Record<string, unknown>;
    call?: Record<string, unknown>;
    guild_id?: string;
}

export interface createdMessage extends message {
    guild_id?: string;
    member?: guildMember;
    mentions: user[];
}

export interface channel {
    id: string;
    type: ChannelType;
    guild_id?: string;
    position?: number;
    permission_overwrites?: Record<string, unknown>[];
    name?: string;
    topic?: string;
    nsfw?: boolean;
    last_message_id?: string;
    bitrate?: number;
    user_limit?: number;
    rate_limit_per_user?: number;
    recipients?: user[];
    icon?: string;
    owner_id?: string;
    application_id?: string;
    managed?: boolean;
    parent_id?: string;
    /** ISO8601 timestamp */
    last_pin_timestamp?: string;
    rtc_region?: string;
    video_quality_mode?: number;
    message_count?: number;
    member_count?: number;
    thread_metadata?: Record<string, unknown>;
    member?: Record<string, unknown>;
    default_auto_archive_duration?: number;
    permissions?: string;
    flags?: number;
    total_message_sent?: number;
    available_tags?: Record<string, unknown>[];
    applied_tags?: string[];
    default_reaction_emoji?: Record<string, unknown>[];
    default_thread_rate_limit_per_user?: number;
    default_sort_order?: number;
    default_forum_layout?: number;
}

export const ChannelType = {
    GUILD_TEXT: 0,
    DM: 1,
    GUILD_VOICE: 2,
    GROUP_DM: 3,
    GUILD_CATEGORY: 4,
    GUILD_ANNOUNCEMENT: 5,
    ANNOUNCEMENT_THREAD: 10,
    PUBLIC_THREAD: 11,
    PRIVATE_THREAD: 12,
    GUILD_STAGE_VOICE: 13,
    GUILD_DIRECTORY: 14,
    GUILD_FORUM: 15,
    GUILD_MEDIA: 16,
} as const;

export type ChannelType = (typeof ChannelType)[keyof typeof ChannelType];
