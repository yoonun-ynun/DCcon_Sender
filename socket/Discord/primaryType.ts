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
