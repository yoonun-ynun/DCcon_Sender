## Getting Started

MongoDB must be running on your server.

> Create a `.env` file in the project root.
> ```dotenv
> AUTH_SECRET={secret key for JWT token}
> AUTH_URL={your domain url}
> AUTH_DISCORD_ID={your discord bot OAuth2 client ID}
> AUTH_DISCORD_SECRET={your discord bot OAuth2 client Secret}
> DISCORD_TOKEN={your discord bot token}
> APPLICATION_ID={your discord bot application id}
> MONGO_URI={mongo_db uri}
> ```

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
>For discord bot<br>
>./socket<br>
├── DataBase<br>
│&emsp; ├── models.ts ___- User schema___<br>
│&emsp; └── query.ts ___- Get data on database___<br>
├── Discord<br>
│&emsp; ├── AJAX.ts ___- HTTP Request___<br>
│&emsp; ├── CommandHandler.ts ___- handle discord interaction___<br>
│&emsp; ├── Payloads.ts ___- for interface___<br>
│&emsp; ├── primaryType.ts ___- for interface___<br>
│&emsp; └── types.ts ___- for interface___<br>
├── connection<br>
│&emsp; ├── Message.ts ___- for interface___<br>
│&emsp; ├── connect.ts ___- for Gateway API___<br>
│&emsp; └── heartbeat.ts ___- send Heartbeat to discord___<br>
├── server.ts ___- start___<br>
└── tsconfig.json ___- for TS___<br>

> For web server<br>
>./src<br>
├── app<br>
│&emsp; ├── Bar.js ___- search bar___<br>
│&emsp; ├── Header.js ___- webpage main head___<br>
│&emsp; ├── Provider.js ___- for auth.js and react-query___<br>
│&emsp; ├── Tabs.js ___- for client component___<br>
│&emsp; ├── api ___- APIs___<br>
│&emsp; │&emsp; ├── auth ___- auth.js___<br>
│&emsp; │&emsp; │&emsp; └── [...nextauth]<br>
│&emsp; │&emsp; │&emsp;     └── route.js<br>
│&emsp; │&emsp; ├── controller ___- get Data on DB___<br>
│&emsp; │&emsp; │&emsp; └── route.js ___- processing for GET, POST, PUT, DELETE Request___<br>
│&emsp; │&emsp; ├── img ___- proxy___<br>
│&emsp; │&emsp; │&emsp; └── route.js<br>
│&emsp; │&emsp; └── info ___- Response con info___<br>
│&emsp; │&emsp; &emsp;&emsp;└── route.js<br>
│&emsp; ├── components ___- for iframe___<br>
│&emsp; │&emsp; ├── IframeOveray.js ___- load iframe overlay___<br>
│&emsp; │&emsp; └── info ___- page for iframe___<br>
│&emsp; │&emsp;&emsp;&emsp;├── Button.js ___- Download, Add button___<br>
│&emsp; │&emsp;&emsp;&emsp;├── Image.js ___- render image___<br>
│&emsp; │&emsp;&emsp;&emsp;├── iframe.css<br>
│&emsp; │&emsp;&emsp;&emsp;└── page.js ___- main page___<br>
│&emsp; ├── favicon.ico<br>
│&emsp; ├── globals.css<br>
│&emsp; ├── layout.js<br>
│&emsp; ├── page.js ___- main page___<br>
│&emsp; ├── page.module.css<br>
│&emsp; ├── profile<br>
│&emsp; │&emsp; └── page.js ___- my profile page___<br>
│&emsp; └── search <br>
│&emsp;&emsp;&emsp;├── List.js ___- listing search result___<br>
│&emsp;&emsp;&emsp;├── loading.js ___- show this page during search___<br>
│&emsp;&emsp;&emsp;└── page.js ___- page for after search___<br>
├── auth.js ___- auth.js___<br>
├── lib<br>
│&emsp;├── fetchDC.js ___- fetching on DCinside server___<br>
│&emsp;└── mongodb.js ___- connect to mongoDB___<br>
├── middleware.js ___- auth.js___<br>
├── models<br>
│&emsp;└── User.js ___- User schema___<br>
└── store ___- store on local storage about user has con___<br>
&emsp;&emsp;├── queryList.js ___- loop fetch using react-query___<br>
&emsp;&emsp;└── storeList.js ___- save on local storage using zustand___<br>