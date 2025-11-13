**Brief context for the agent:** Connect+ is a data ingestion tool from Capillary technologies which brands can use to move data from one place to another place. Following are some of the examples:
1. SFTP as a source & destination
2. S3 as a source & destination
3. HTTP as a source & destination
4. Events (Kafka) as a source & destination

Not just moving the files from place to place, not just making the API calls, it can also help in performing some transformations in between. 

Examples:
1. Move a file from SFTP to S3 location.
2. Move a file from S3 to SFTP location.
3. Read a file from the SFTP & make API calls.
4. Read from the stream (like Kafka) & make API calls. 
5. Read from SFTP location & send the data to stream (like kafka)
6. Read a file from SFTP, do some transformations & make API calls
7. Read from the stream (like kafka), do some transformations & make API calls
8. etc...

**APIs information:** Following are some of the APIs that can be used to do CRUD operation in Connect+, and the following has to be used by the agent for building the conversational bot. 

**Important**:The following APIs currently gets authenticated using the "Cookie" header. It can be observed from the all the below curls. That's why, whenever anyways wants to use this conversational bot, the very first thing the bot has to ask is "Cookie". Once the user provides that Cookie, that should be set as it is in the header without trimming anything, and the API works successfully. Also, there is a header like "X-CAP-API-AUTH-ORG-ID" that can be observed below. That also has to be provided by the user. So, in short, whenever anyone wants to use the conversational builder, the initial action is to ask for the "Cookie" & "Org ID".

**Important:** This authentication mechanism of depending on Cookie is temporary. In future, a token based authentication will come where there will be one API that takes username & password as input, and provides the token. That token can be used to make the APIs call. Full details of that will be added in this document soon, but the agent has to remember this so that  code can be written in a better way.

**Authentication 
- Current: Cookie + X-CAP-API-AUTH-ORG-ID header
- Future: Token-based with username/password

1. API to get details of all the blocks available 

```
curl --location 'https://eucrm.connectplus.capillarytech.com/api/v3/blocks' \
--header 'Content-Type: application/json' \
--header 'X-CAP-API-AUTH-ORG-ID: 100458' \
--header 'Cookie: ph_phc_66osOdYGIaEhFJqGovTvbT4NUDfFEUByR64aZg62Xsq_posthog=%7B%22distinct_id%22%3A%2201946d81-97e8-7d40-a01f-17b4f559704f%22%2C%22%24sesid%22%3A%5B1744446503554%2C%220196291c-8ce3-7a72-8144-58f29f9778da%22%2C1744446459107%5D%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22https%3A%2F%2Fwww.google.com%2F%22%2C%22u%22%3A%22https%3A%2F%2Fwww.capillarytech.com%2Fspark-matrix-2024-loyalty%2F%22%7D%7D; SESSION=ZDZlNDYxMTItYWQyMC00ZjY3LTkwYzUtNTE5ZjNkYmUzZTRl' \
--header 'Content-Length: 0'
```

2. API to get all the metadata details of a specific block

```
curl --location 'https://eucrm.connectplus.capillarytech.com/api/v3/blocks/57/metadata' \
--header 'Content-Type: application/json' \
--header 'X-CAP-API-AUTH-ORG-ID: 0' \
--header 'Cookie: ph_phc_66osOdYGIaEhFJqGovTvbT4NUDfFEUByR64aZg62Xsq_posthog=%7B%22distinct_id%22%3A%2201946d81-97e8-7d40-a01f-17b4f559704f%22%2C%22%24sesid%22%3A%5B1744446503554%2C%220196291c-8ce3-7a72-8144-58f29f9778da%22%2C1744446459107%5D%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22https%3A%2F%2Fwww.google.com%2F%22%2C%22u%22%3A%22https%3A%2F%2Fwww.capillarytech.com%2Fspark-matrix-2024-loyalty%2F%22%7D%7D; SESSION=ZDZlNDYxMTItYWQyMC00ZjY3LTkwYzUtNTE5ZjNkYmUzZTRl'
```

3. API to create an empty canvas for the dataflow

```
curl --location --request POST 'https://eucrm.connectplus.capillarytech.com/api/v3/dataflows/canvas?name=Dataflow20262811125' \
--header 'Content-Type: application/json' \
--header 'Cookie: ph_phc_66osOdYGIaEhFJqGovTvbT4NUDfFEUByR64aZg62Xsq_posthog=%7B%22distinct_id%22%3A%2201946d81-97e8-7d40-a01f-17b4f559704f%22%2C%22%24sesid%22%3A%5B1744446503554%2C%220196291c-8ce3-7a72-8144-58f29f9778da%22%2C1744446459107%5D%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22https%3A%2F%2Fwww.google.com%2F%22%2C%22u%22%3A%22https%3A%2F%2Fwww.capillarytech.com%2Fspark-matrix-2024-loyalty%2F%22%7D%7D; SESSION=ZDZlNDYxMTItYWQyMC00ZjY3LTkwYzUtNTE5ZjNkYmUzZTRl' \
--header 'X-CAP-API-AUTH-ORG-ID: 100458'
```

4. API to get basic details of an existing dataflow

```
curl --location 'https://eucrm.connectplus.capillarytech.com/api/v3/dataflows/c3b16f8c-712f-38f3-92f6-fed05a8bf103' \
--header 'Content-Type: application/json' \
--header 'X-CAP-API-AUTH-ORG-ID: 0' \
--header 'Cookie: ph_phc_66osOdYGIaEhFJqGovTvbT4NUDfFEUByR64aZg62Xsq_posthog=%7B%22distinct_id%22%3A%2201946d81-97e8-7d40-a01f-17b4f559704f%22%2C%22%24sesid%22%3A%5B1744446503554%2C%220196291c-8ce3-7a72-8144-58f29f9778da%22%2C1744446459107%5D%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22https%3A%2F%2Fwww.google.com%2F%22%2C%22u%22%3A%22https%3A%2F%2Fwww.capillarytech.com%2Fspark-matrix-2024-loyalty%2F%22%7D%7D; SESSION=ZDZlNDYxMTItYWQyMC00ZjY3LTkwYzUtNTE5ZjNkYmUzZTRl'
```

5. API to get full details of an existing dataflow

```
curl --location 'https://eucrm.connectplus.capillarytech.com/api/v3/dataflows/c3b16f8c-712f-38f3-92f6-fed05a8bf103/with-values' \
--header 'Content-Type: application/json' \
--header 'X-CAP-API-AUTH-ORG-ID: 0' \
--header 'Cookie: ph_phc_66osOdYGIaEhFJqGovTvbT4NUDfFEUByR64aZg62Xsq_posthog=%7B%22distinct_id%22%3A%2201946d81-97e8-7d40-a01f-17b4f559704f%22%2C%22%24sesid%22%3A%5B1744446503554%2C%220196291c-8ce3-7a72-8144-58f29f9778da%22%2C1744446459107%5D%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22https%3A%2F%2Fwww.google.com%2F%22%2C%22u%22%3A%22https%3A%2F%2Fwww.capillarytech.com%2Fspark-matrix-2024-loyalty%2F%22%7D%7D; SESSION=ZDZlNDYxMTItYWQyMC00ZjY3LTkwYzUtNTE5ZjNkYmUzZTRl'
```

**Important**: Later, more important API details will be added, that are required to build the agent. 

**Things to remember while building the bot:**

**What We're Building:**
A conversational AI copilot for Connect+ (Capillary's data ingestion tool) that helps users create and manage data flows through natural language interactions.

**UI Design Principles from the Image:**
- **Color Palette:** Clean, light background with subtle grays
- **Primary Blue:** Used for interactive elements and action buttons 
- **Typography:** Clean, modern sf pro font, good hierarchy with different weights
- **Layout:** Card-based design with subtle borders, organized in sections
- **Spacing:** Generous whitespace, not cramped. 1.5x spacing between lines.
- **Preview:** The response should always be rendered as md, unless something else if strictly required. 
- **Elements:** Toggle buttons (True/False), dropdown menus, collapsible sections with chevrons
- **Overall Feel:** Professional, minimal, enterprise-grade SaaS product

**Aspects & behaviour of the bot:**
1. Whenever the user opens the bot to use it, for now, always ask for cookie & userID so you can set it as header while making the API calls to Connect+ APIs.
2. Inside the logic page, aka chat page, assuming it like having 2 column of equal width. Now the chat window should be just the 2nd column only. Leave the 1st column empty, i will add some static image later. 
3. There should be a clear chat option which people can use to clear the entire chat they have done so far till that point in that chat session. It's like clean slate. 
4. Whenever the logo is given, add it at the top-left corner of both home & chat page. 
5. This entire bot has to work just like chatgpt, claude, etc... Easy to use, intuitive, necessary options in the chat (like copy message, code code, etc...). Should be world class. 
6. Ask for the openai key to the user which you have to hardcode in the backend, and don't expose it anywhere. This is important because, the chat will be managed by an LLM only. A pure conversational bot. 
7. Use the gpt-4o model to handle the entire conversation. This LLM or whatever is the llm used, will decide when to make API calls to Connect+ APIs, when to speak casually, when to ask questions and all of those things. 
8. This bot is user based, meaning if 10 users are using this chatbot from 10 different places, it should work independently for all of them. 
9. Sometimes during the building of bot phase, the builder may not use correct terminology. So, whenever, please check with the builder or the user. 
10. The chat should be streaming in nature, meaning, when the responses are coming, the scroll has to happen automatically so the user don't have to scroll down. If needed, this can be a option to the user in the form of toggle. Default be streaming (word-by-word, and auto scroll with the text progress)
11. Whenever the user enters the first message in a chat session, you can make "get all blocks" API call by default. This is because, this information will be needed across the chat for the bot & the user. So instead of making API call repeatedly, better to make the call by default at beginning & store it in chat memory of that user. Share your opinion to the builder on this, and ask for necessary questions if unclear. 
12. When the user clicks on clear chat, then memory of that particular chat session can be refreshed. Meaning, the "get all block details" that are stored can be removed i guess? think if this is a good idea & ask the user while implementing it. 
13. This document may not be able to cover all the aspects, that doesn't mean you don't have to do that. Always suggest the users & take feedback.

