## 시작하기
mongoDB가 무조건 서버에서 돌고 있어야 합니다. 외부로의 포트포워딩은 필요 없습니다. 내부에서 사용합니다.

### Discord 봇 설정

> https://discord.com/developers/applications 에서 봇 추가 및 설정을 할 수 있습니다. 아래 설정을 따라주세요
> ```text
> Installation >> Default Install Settings >> User Install:             applications.commands
> Installation >> Default Install Settings >> Guild Install:            Send Messages, View Channels, View Server Insights
> OAuth2 >> Redirects:                                                  https://{ YOUR_DOMAIN }/api/auth/callback/discord
> Activities >> Settings >> Activity Settings >> Enable Activities:     Enable
> Activities >> Settings >> Activity Settings >>Supported Platforms:    Select all
> Activities >> Settings >> Activity URL Mappings >> Root Mapping:      { YOUR_DOMAIN }/components/discordapp
> ```

### .env 파일 설정
> 프로젝트 루트에 .env 파일을 생성하고 아래처럼 값을 넣습니다.
>> `npx auth`를 사용 후 .env로 파일 명을 바꾸는 것이 편할 수 있습니다.
> ```dotenv
> AUTH_SECRET="{secret key for JWT token(you can use npx auth)}"
> AES_KEY="{key for AES-256-GCM(encoded by hex)}"
> AUTH_URL="https://{your domain url}"
> AUTH_DISCORD_ID="{your discord bot OAuth2 client ID}"
> AUTH_DISCORD_SECRET="{your discord bot OAuth2 client Secret}"
> DISCORD_TOKEN="{your discord bot token}"
> APPLICATION_ID="{your discord bot application id}"
> MONGO_URI="{mongo_db uri}"
> ```


### 웹서버 실행
> 해당 프로젝트는 리버스 프록시를 이용해 localhost:3000에 프록시 하는것을 바탕으로 만들어졌습니다.<br>
> nginx로 리버스 프록시 하는걸 권장드리며, 대신 소스 내 하드코딩 되어있는 https://localhost:3000요청을 수정할 수 있습니다.
> ```shell
> npm run build
> npm run start
> ```
> 위 명령어로 서버는 localhost:3000에서 동작하게 됩니다.

### 봇 클라이언트 실행
> ```shell
> npm run socket:build
> npm run socket:start
> ```
> 위 명령어로 소켓은 디스코드 서버와 통신을 시작하며 봇을 온라인으로 전환시킵니다.


## File Structure
For discord bot<br>

```shell
./socket
├── DataBase
│  ├── models.ts              - User schema
│  └── query.ts               - Get data on database
├── Discord
│  ├── AJAX.ts                - HTTP Request
│  ├── CommandHandler.ts      - handle discord interaction
│  ├── Commands
│  │  ├── handler.ts          - handle Commands
│  │  ├── selectProfile.ts    - send with profile value
│  │  ├── sendDCcon.ts        - send with dccon index
│  │  └── sendList.ts         - send added
│  ├── Errors
│  │  └── CommandError.ts     - Errors
│  └── interfaces
│      ├── Payloads.ts
│      ├── primaryType.ts
│      └── types.ts
├── connection
│  ├── Message.ts             - for interface
│  ├── connect.ts             - for Gateway API
│  └── heartbeat.ts           - send Heartbeat to discord
├── server.ts                 - start
└── tsconfig.json             - for TS
```
<br><br>
For web server
``` shell
./src
├── app
│  ├── Bar.js                   - search bar
│  ├── Header.js                - main header of the webpage
│  ├── Provider.js              - for auth.js and react-query
│  ├── Tabs.js                  - for client component
│  ├── api                      - APIs
│  │  ├── auth                  - auth.js
│  │  │  └── [...nextauth]
│  │  │     └── route.js
│  │  ├── controller            - database controllers
│  │  │  └── route.js           - processing for GET, POST, PUT, DELETE Request
│  │  ├── embed                 - api for discord embedded app
│  │  │  ├── crypter.js         - for encrypt
│  │  │  ├── channels           - get channels about guild id
│  │  │  │  └── route.js
│  │  │  ├── cookie-test        - test cookie can saving
│  │  │  │  └── route.js
│  │  │  ├── guilds             - get union about user's guild and bot's guild
│  │  │  │  └── route.js
│  │  │  ├── login              - auth with JWT or Authorization header
│  │  │  │  └── route.js
│  │  │  ├── refresh            - refreshing token
│  │  │  │  └── route.js
│  │  │  ├── send               - send dccon about user's select
│  │  │  │  └── route.js
│  │  │  └── session            - get user's informagion
│  │  │      └── route.js
│  │  ├── img                   - proxy
│  │  │  └── route.js
│  │  └── info                  - response info API
│  │     └── route.js
│  ├── components               - for iframe
│  │  ├── IframeOveray.js       - load iframe overlay
│  │  ├── discordapp            - discord embedded app page
│  │  │  ├── channels.js        - selector about to send channel
│  │  │  ├── frame.js           - authing user and get user idendify
│  │  │  ├── list.js            - listing about selected dccon image
│  │  │  ├── page.js
│  │  │  ├── selector.js        - select using dccon
│  │  │  └── style.css          - style for embedded app
│  │  └── info                  - page for iframe
│  │     ├── Button.js          - Download, Add button
│  │     ├── Image.js           - render image
│  │     ├── iframe.css
│  │     └── page.js            - main page
│  ├── favicon.ico
│  ├── globals.css
│  ├── layout.js
│  ├── page.js                  - main page
│  ├── page.module.css
│  ├── profile
│  │  └── page.js               - my profile page
│  └── search 
│     ├── List.js               - listing search result
│     ├── loading.js            - show this page during search
│     └── page.js               - page for after search
├── auth.js                     - auth.js
├── lib
│  ├── fetchDC.js               - fetching on DCinside server
│  └── mongodb.js               - connect to mongoDB
├── middleware.js               - auth.js
├── models
│  └── User.js                  - User schema
└── store                       - local storage for user cons
   ├── queryList.js             - loop fetch using react-query
   └── storeList.js             - store on local storage using zustand
```