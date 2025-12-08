## Getting Started

MongoDB must be running on your server.

> Create a `.env` file in the project root.
> ```dotenv
> AUTH_SECRET="{secret key for JWT token}"
> AUTH_URL="{your domain url}"
> AUTH_DISCORD_ID="{your discord bot OAuth2 client ID}"
> AUTH_DISCORD_SECRET="{your discord bot OAuth2 client Secret}"
> DISCORD_TOKEN="{your discord bot token}"
> APPLICATION_ID="{your discord bot application id}"
> MONGO_URI="{mongo_db uri}"
> ```
<br><br>
> Start Web Server
>> ```shell
>>  npm install
>>  npm run build
>>  npm run start
>> ```
>> Server will run on localhost:3000
> 
> Start Discord Server
>> ```shell
>> npm run build:socket
>> npm run start:socket
>> ```
>> set discord bot status to online


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
│  ├── Payloads.ts            - for interface
│  ├── primaryType.ts         - for interface
│  └── types.ts               - for interface
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
│  │  ├── img                   - proxy
│  │  │  └── route.js
│  │  └── info                  - response info API
│  │     └── route.js
│  ├── components               - for iframe
│  │  ├── IframeOveray.js       - load iframe overlay
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