# DCcon Sender Privacy Policy

**Effective Date: October 1, 2026**

This Privacy Policy explains how the official DCcon Sender service (“DCcon Sender,” the “Service,” “we,” “us,” or “our”) collects, uses, stores, and otherwise processes information when you use the DCcon Sender Discord bot, Discord Activity, website, APIs, and related services.

This Privacy Policy applies only to the official Service operated by the DCcon Sender Operator.

Forks, modified versions, and self-hosted instances may process information differently and are the responsibility of their respective operators.

## 1. Summary

DCcon Sender processes information primarily to:

- authenticate users through Discord;
- identify users and their Discord context;
- provide DCcon search, profile, and sending functionality;
- determine Discord servers and channels in which functionality is available;
- maintain user-selected DCcon lists;
- process Discord commands, messages, and reactions required by Service features;
- maintain sessions and authentication tokens;
- measure basic Service usage;
- prevent abuse and maintain security; and
- diagnose technical problems.

We do not sell personal information.

Discord API data is not sold, licensed, provided to data brokers, or used to build advertising profiles.

## 2. Information We Process

Depending on how you use the Service, we may process the following information.

### A. Discord account information

When you authenticate through Discord or interact with the bot, we may receive or process:

- Discord User ID;
- Discord username;
- global display name;
- server-specific nickname;
- Discord profile image or avatar URL;
- email address, where provided through Discord OAuth;
- Discord server/guild ID;
- Discord server/guild name;
- server membership information;
- Discord channel ID;
- Discord channel name;
- Discord message ID;
- Discord Activity instance ID; and
- authentication method used.

The standard Discord OAuth configuration used by the Service may request the following scopes:

- `identify`
- `email`
- `guilds`

Not every item made available through those scopes is necessarily permanently stored.

### B. Authentication credentials and tokens

Depending on the authentication method and whether normal browser cookies are available, the Service may process:

- Discord OAuth authorization codes;
- Discord OAuth access tokens;
- Discord OAuth refresh tokens;
- token expiration times;
- DCcon Sender session tokens;
- JSON Web Tokens (JWTs);
- CSRF-protection tokens; and
- authentication state information.

OAuth authorization codes are used to complete authentication and are not intended to be stored after they have served that purpose.

Where the Discord Activity authentication fallback requires server-side token storage, Discord access and refresh tokens are stored in encrypted form.

Authentication tokens are used only as necessary to authenticate the user and provide Discord-integrated functionality.

### C. DCcon profile information

If you save DCcon packages to your Service profile, we may store:

- your Discord User ID;
- your Discord username or display name;
- your Discord email address where available;
- DCcon package identifiers selected by you; and
- associated DCcon image references or URLs.

This information is used to provide the profile and saved-DCcon functionality.

### D. Service usage information

The Service may store basic usage information, including:

- Discord User ID;
- username; and
- number of times certain sending functions have been used.

This information is used for basic operational statistics, capacity planning, abuse prevention, and maintenance.

### E. Discord server and channel configuration

When server administrators configure applicable bot functionality, the Service may process or store information including:

- Discord guild/server ID;
- Discord channel IDs;
- configuration settings;
- recommendation thresholds;
- negative-reaction thresholds;
- automatic-reaction settings; and
- configuration version information.

### F. Message and reaction information

Certain recommendation, reaction, or message-processing functionality requires the Service to receive Discord message events.

Depending on the feature, the Service may process:

- message content;
- image attachment URL;
- message ID;
- related message IDs;
- channel ID;
- guild/server ID;
- Discord User ID of the author;
- username or server nickname;
- reaction information;
- recommendation and negative-reaction counts; and
- expiration or queue-state information.

This information is processed only where required for the relevant bot functionality.

The Service is not intended to operate as a general-purpose archive of Discord conversations.

### G. Technical and security information

The Service itself may process technical information necessary for authentication, security, and network communications.

In addition, hosting providers, reverse proxies, operating systems, or other infrastructure used by the Operator may automatically generate information such as:

- IP address;
- request timestamp;
- requested URL;
- browser or user-agent information;
- HTTP status;
- network error information; and
- security or application logs.

The exact information contained in infrastructure logs depends on the deployment configuration.

### H. Application logs

For troubleshooting and development purposes, application logs may contain information associated with requests or Discord events.

Depending on the deployed software version and logging configuration, these logs may include usernames, message content, error information, or identifiers.

We seek to limit access to such logs and retain them only for as long as reasonably necessary for troubleshooting, security, or operational purposes.

## 3. How We Obtain Information

Information may be obtained:

1. directly from you;
2. through Discord OAuth;
3. through the Discord API and Gateway;
4. from Discord interaction and Activity payloads;
5. from commands, messages, or reactions processed by the bot;
6. from information you save to your DCcon Sender profile; or
7. automatically from the technical infrastructure used to operate the Service.

## 4. Purposes of Processing

We use the information described above only for purposes reasonably necessary to operate and protect the Service, including:

### Authentication

To identify users, establish sessions, validate Discord Activity participation, refresh authentication, and prevent unauthorized access.

### Discord integration

To determine applicable servers and channels, respond to user commands, and transmit requested content to Discord.

### User profiles

To maintain saved DCcon package lists and display them to the applicable user.

### Recommendation and reaction features

To associate messages, users, reactions, channels, and servers where required for configured recommendation-related functionality.

### Usage statistics

To count use of certain Service features and understand basic operational load.

### Security and abuse prevention

To detect suspicious requests, unauthorized access, exploitation, or violations of the Terms of Service.

### Maintenance and debugging

To diagnose failures and improve reliability.

### Legal compliance

To comply with lawful obligations, legal proceedings, court orders, regulatory requirements, or valid requests concerning third-party rights.

## 5. Discord API Data

Information obtained from Discord is used only as reasonably necessary to provide the stated functionality of DCcon Sender.

We do not:

- sell Discord API data;
- license Discord API data;
- provide Discord API data to data brokers;
- use Discord API data to create advertising profiles;
- use Discord API data to determine eligibility for employment, housing, insurance, credit, or similar decisions;
- attempt to re-identify data Discord provides in an anonymized or protected form; or
- use Discord message content to train machine-learning or artificial-intelligence models.

Discord API data may be deleted when it is no longer necessary for the Service, when Discord requires deletion, when an applicable user validly requests deletion, or when operation of the relevant functionality ends, subject to applicable legal obligations.

## 6. DCInside and DCcon Information

The Service also processes information and content retrieved from DCInside for the purpose of providing DCcon-related functionality.

This may include:

- DCcon package identifiers;
- package titles;
- package descriptions;
- image URLs;
- DCcon images;
- popularity or ranking information; and
- related metadata.

This information generally concerns publicly displayed content rather than the Service user's personal account information.

DCcon content may be temporarily cached for technical purposes.

The Service does not use DCcon content or Discord user data to train artificial-intelligence models.

## 7. Cookies and Session Technologies

The Service uses authentication cookies and similar technologies necessary to maintain secure sessions.

These may include:

- a secure session-token cookie; and
- a CSRF-protection cookie.

Authentication cookies are configured with security protections such as `Secure` and `HttpOnly` where applicable.

Where normal cookies cannot be used within a Discord embedded environment, the Service may use a short-lived bearer token or JWT to maintain the authenticated session.

Disabling required cookies may prevent some Service functionality from operating.

## 8. Storage and Retention

We retain information only for as long as reasonably necessary for the purposes described in this Privacy Policy, subject to technical limitations and applicable legal requirements.

Typical retention practices include the following.

### User profile data

Discord User ID, profile information, and saved DCcon selections may be retained while the user's DCcon Sender profile remains active or until deletion is requested.

### Authentication tokens

Session tokens are retained for the lifetime of the applicable session.

Stored Discord access and refresh tokens used for embedded authentication may be retained until they expire, are replaced, are revoked, are no longer necessary, or the related account information is deleted.

### Usage counters

Basic usage counters may remain associated with the applicable Discord User ID while necessary for Service operation or until deletion is requested, unless retention is legally required.

### Message-processing state

Message and reaction information used for queue-based functionality is intended to be operational or temporary state.

Such data may remain in application memory or database records until expiration, replacement, cleanup, manual deletion, or until it is no longer necessary for the applicable functionality.

### DCcon image cache

DCcon images may generally be cached for approximately seven days and may be refreshed when used again.

### DCcon package metadata cache

Package metadata may generally remain cached while actively used and may expire after a period of inactivity.

### Service and security logs

Logs are retained for only as long as reasonably necessary for troubleshooting, security, abuse prevention, or legal requirements.

Backups, if maintained, may contain information for a limited additional period until they are overwritten or deleted according to the backup cycle.

## 9. Sharing and Disclosure

We do not sell personal information.

Information may be disclosed only where reasonably necessary in the following circumstances.

### Discord

The Service communicates with Discord in order to authenticate users, retrieve Discord information, receive events, and perform actions requested through the Service.

Discord processes information under its own terms and privacy policies.

### Infrastructure and service providers

Information may be processed by infrastructure providers used to host or operate the Service, such as hosting, database, network, or security providers.

Such providers are permitted to process information only as required to provide their technical services.

**Current infrastructure/service providers, if applicable: [LIST PROVIDERS OR “Self-hosted infrastructure only”]**

### Legal requirements

We may disclose information when reasonably necessary to comply with applicable law, a valid court order, lawful government request, or legal process.

### Protection of rights and security

Information may be disclosed where reasonably necessary to investigate abuse, protect users, protect the Service, respond to intellectual-property complaints, or enforce the Terms of Service.

### User direction

Information may be transmitted to Discord or another destination when the user explicitly requests the corresponding Service action.

For example, when you instruct DCcon Sender to send an image to a Discord channel, information required to perform that action is transmitted to Discord.

## 10. International Processing

Discord and other infrastructure providers may process information in countries other than the country in which you reside.

Where required by applicable law, the Operator will provide additional information or obtain consent concerning international transfers.

Users should also review Discord's Privacy Policy for information concerning Discord's own international processing practices.

## 11. Security

We use reasonable technical and organizational safeguards designed to protect information handled by the Service.

Depending on the information and authentication method, safeguards include:

- HTTPS/TLS for data in transit;
- Secure and HttpOnly authentication cookies;
- signed session tokens;
- restricted authentication scopes;
- encryption of stored Discord OAuth access and refresh tokens;
- authentication and authorization checks;
- restrictions on permitted DCcon image hosts; and
- access restrictions on databases and server infrastructure.

No method of transmission or storage can be guaranteed to be completely secure.

Users should immediately notify us if they believe their interaction with the Service or associated authentication information has been compromised.

## 12. Your Rights

Subject to applicable law, you may request:

- confirmation of whether we hold personal information about you;
- access to information associated with you;
- correction of inaccurate information;
- deletion of stored personal information;
- withdrawal of consent where processing is based on consent; or
- termination of your use of the Service.

Requests may be sent to:

**yoontk2201@gmail.com**

We may need to verify that the person making a request is the applicable Discord account holder before acting on the request.

Some information may be retained where required by law, necessary to establish or defend legal claims, or otherwise permitted by applicable law.

## 13. Deletion Requests

You may request deletion of information associated with your Discord account by contacting the privacy address above.

Where technically and legally applicable, deletion may include:

- DCcon Sender user profile information;
- saved DCcon selections;
- stored Discord OAuth credentials;
- usage data associated with your Discord User ID; and
- other personal data that is no longer required for Service operation.

Information contained only in backups may remain until the applicable backup is overwritten according to the ordinary backup cycle.

Information independently held by Discord, DCInside, another Discord user, or another third party is not controlled by DCcon Sender and must be addressed to the relevant third party.

## 14. Children

The official Service is not intended for children under 14 years of age.

We do not knowingly seek to collect personal information from children under 14.

If we become aware that information from a child under 14 has been processed in circumstances requiring parental or legal guardian consent and such consent has not been obtained, we may delete the information and restrict access to the Service.

Users must also comply with Discord's applicable age requirements.

## 15. Third-Party Services

The Service integrates with third-party services that maintain their own privacy practices.

In particular:

- Discord controls information processed within Discord and through Discord accounts; and
- DCInside controls information and content processed through its own services.

This Privacy Policy applies only to information processed by DCcon Sender and does not replace the privacy policies of those third parties.

## 16. Intellectual-Property and Legal Complaints

Information submitted as part of a copyright, trademark, privacy, or other legal complaint may be retained as reasonably necessary to investigate and document the request, respond to disputes, prevent repeated violations, or comply with applicable law.

Such information will not be used for unrelated purposes.

## 17. Changes to This Privacy Policy

We may update this Privacy Policy when our processing practices, Service features, applicable laws, or third-party platform requirements change.

Material changes will be announced through a reasonable channel such as the official website, Discord interface, or project repository.

The effective date at the top of this Privacy Policy indicates the current version.

## 18. Privacy Contact

Questions or requests concerning this Privacy Policy or personal information processed by the Service may be directed to:

**DCcon Sender Privacy Contact**  
**Email: yoontk2201@gmail.com**

If required by applicable law, additional information regarding the responsible privacy officer, representative, processing contractors, or cross-border transfers will be published with this Privacy Policy.

---

Discord and the Discord logo are trademarks of Discord Inc.

DCInside and DCcon are names and services associated with their respective rights holders.

DCcon Sender is an independent project and is not affiliated with or endorsed by Discord Inc. or DCInside Co., Ltd.
