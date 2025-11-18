Following information helps in successfully creating & editing a dataflow. 

There are 4 steps involved on a high level (once the user provides the use case):
1. Making "get all blocks" api call to know which all blocks are available, and whether the user's use case can be sufficed with the blocks available.
2. Creating an empty canvas using the "create canvas" api, and store the dataflow ID. 
3. For each block that is selected for the given use case, making the "get specific details of a block" api call, and storing this information.
4. Creating the request body for "save or edit dataflow" api call by arranging the blocks in a specific order as the use case. To create this request body, response of the "empty canvas" api & response of the "get specific details of a block" api are needed. 

Below is the in details explanation of the entire flow:

**Important note:**
1. The API curls are available in the "Connect+ copilot.md" file.


## Detail explanation of creating dataflows

### Step 1: Get Available Blocks

```
curl --location 'https://eucrm.connectplus.capillarytech.com/api/v3/blocks' \
--header 'Content-Type: application/json' \
--header 'X-CAP-API-AUTH-ORG-ID: 100458' \
--header 'Cookie: ph_phc_66osOdYGIaEhFJqGovTvbT4NUDfFEUByR64aZg62Xsq_posthog=%7B%22distinct_id%22%3A%2201946d81-97e8-7d40-a01f-17b4f559704f%22%2C%22%24sesid%22%3A%5B1744446503554%2C%220196291c-8ce3-7a72-8144-58f29f9778da%22%2C1744446459107%5D%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22https%3A%2F%2Fwww.google.com%2F%22%2C%22u%22%3A%22https%3A%2F%2Fwww.capillarytech.com%2Fspark-matrix-2024-loyalty%2F%22%7D%7D; SESSION=ZDZlNDYxMTItYWQyMC00ZjY3LTkwYzUtNTE5ZjNkYmUzZTRl' \
--header 'Content-Length: 0'

```

**Response**: Array of available blocks  
**Extract**: Nothing - Just verify if the use case asked by the user is possible with the available blocks

---

### Step 2: Create Canvas

```
curl --location --request POST 'https://eucrm.connectplus.capillarytech.com/api/v3/dataflows/canvas?name=Dataflow20262811125' \
--header 'Content-Type: application/json' \
--header 'Cookie: ph_phc_66osOdYGIaEhFJqGovTvbT4NUDfFEUByR64aZg62Xsq_posthog=%7B%22distinct_id%22%3A%2201946d81-97e8-7d40-a01f-17b4f559704f%22%2C%22%24sesid%22%3A%5B1744446503554%2C%220196291c-8ce3-7a72-8144-58f29f9778da%22%2C1744446459107%5D%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22https%3A%2F%2Fwww.google.com%2F%22%2C%22u%22%3A%22https%3A%2F%2Fwww.capillarytech.com%2Fspark-matrix-2024-loyalty%2F%22%7D%7D; SESSION=ZDZlNDYxMTItYWQyMC00ZjY3LTkwYzUtNTE5ZjNkYmUzZTRl' \
--header 'X-CAP-API-AUTH-ORG-ID: 100458'
```


**Response**:

```
{
    "dataflowId": "b46d8cd7-e91e-1ad9-ffff-ffffa0d7ef0b",
    "status": "DRAFT",
    "version": 1
}
```

**Extract**: `dataflowId` → Will become `dataflowUuid` in final request (aka step4)

---

### Step 3: Get Block Details (Call for EACH block needed)

```
curl --location 'https://eucrm.connectplus.capillarytech.com/api/v3/blocks/57/metadata' \
--header 'Content-Type: application/json' \
--header 'X-CAP-API-AUTH-ORG-ID: 0' \
--header 'Cookie: ph_phc_66osOdYGIaEhFJqGovTvbT4NUDfFEUByR64aZg62Xsq_posthog=%7B%22distinct_id%22%3A%2201946d81-97e8-7d40-a01f-17b4f559704f%22%2C%22%24sesid%22%3A%5B1744446503554%2C%220196291c-8ce3-7a72-8144-58f29f9778da%22%2C1744446459107%5D%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22https%3A%2F%2Fwww.google.com%2F%22%2C%22u%22%3A%22https%3A%2F%2Fwww.capillarytech.com%2Fspark-matrix-2024-loyalty%2F%22%7D%7D; SESSION=ZDZlNDYxMTItYWQyMC00ZjY3LTkwYzUtNTE5ZjNkYmUzZTRl'
```

**Response** (for each):

```
{
    "blockId": "71",
    "type": "sftp_read",
    "name": "sftp_read",
    "blockVersion": "2.0",
    "blockInputs": [...],
    "source": true
}
```

**Extract from each response**:

- `type` → becomes `blockType` in the final step (aka step4)
- `blockInputs` → use entire array as-is

---

### Step 4: Create/Save Dataflow

```
curl --location --request PUT 'https://crm-nightly-new.connectplus.capillarytech.com/api/v3/dataflows' \
--header 'Content-Type: application/json' \
--header 'X-CAP-API-AUTH-ORG-ID: 0' \
--header 'Cookie: SESSION=NDY4OWQzZDktNjcyMi00ZmJjLWEwMzEtNjIyODkzNDMwNjQ0; SESSION=ODM2ODE3NDQtZTI4Ni00NzExLTllOTMtODBmOTEwOTM5ZWJl' \
--data-raw '{
    "dataflowUuid": "eace7cf2-0199-1000-ffff-ffffcdb32ce4",
    "description": "Updated pipeline for SFTP file processing",
    "schedule": "0/1 0 * * * ? *",
    "blocks": [
        {
            "id": "block1",
            "blockId": "71",
            "blockName": "Connect-to-Source",
            "blockType": "sftp_read",
            "destinationBlockIds": [
                "block2"
            ],
            "blockInputs": [
                {
                    "id": "436",
                    "name": "hostname",
                    "key": "input.sftp.hostname",
                    "type": "text",
                    "value": "data.capillarydata.com",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "437",
                    "name": "username",
                    "key": "input.sftp.username",
                    "type": "text",
                    "value": "automationuser",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "438",
                    "name": "password",
                    "key": "input.sftp.password",
                    "type": "password",
                    "value": "Welivein@2025!",
                    "dynamicType": null,
                    "htmlType": "password",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "439",
                    "name": "sourceDirectory",
                    "key": "input.sftp.sourceDir",
                    "type": "text",
                    "value": "/Capillary testing/vtest4/source",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "440",
                    "name": "fileRegex",
                    "key": "input.fileRegex",
                    "type": "text",
                    "value": ".*.csv",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": [
                        {
                            "label": ".*.csv",
                            "value": ".*.csv"
                        },
                        {
                            "label": ".*",
                            "value": ".*"
                        }
                    ]
                },
                {
                    "id": "441",
                    "name": "processedDirectory",
                    "key": "input.sftp.processedDirectory",
                    "type": "text",
                    "value": "/Capillary testing/vtest4/process",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "442",
                    "name": "unzipFiles",
                    "key": "input.unzipFiles",
                    "type": "checkbox",
                    "value": "false",
                    "dynamicType": null,
                    "htmlType": "checkbox",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "445",
                    "name": "apiErrorFilePath",
                    "key": "input.sftp.apiErrorFilePath",
                    "type": "text",
                    "value": "/Capillary testing/vtest4/error",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "446",
                    "name": "searchDirRecursively",
                    "key": "input.searchDirRecursively",
                    "type": "checkbox",
                    "value": "false",
                    "dynamicType": null,
                    "htmlType": "checkbox",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "447",
                    "name": "port",
                    "key": "input.sftp.port",
                    "type": "text",
                    "value": "22",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "4143",
                    "name": "File Delimiter",
                    "key": "input.fileDelimiter",
                    "type": "text",
                    "value": ",",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "443",
                    "name": "Report Status Code",
                    "key": "input.reportStatusCode",
                    "type": "select",
                    "value": "all",
                    "dynamicType": null,
                    "htmlType": "select",
                    "childrenFields": {},
                    "selectValues": [
                        {
                            "label": "all",
                            "value": "all"
                        },
                        {
                            "label": "success",
                            "value": "success"
                        },
                        {
                            "label": "failure",
                            "value": "failure"
                        }
                    ]
                },
                {
                    "id": "4163",
                    "name": "Private Key Path",
                    "key": "input.privateKeyPath",
                    "type": "file",
                    "value": null,
                    "dynamicType": null,
                    "htmlType": "file",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "4164",
                    "name": "Private Key Passphrase",
                    "key": "input.privateKeyPassphrase",
                    "type": "password",
                    "value": null,
                    "dynamicType": null,
                    "htmlType": "password",
                    "childrenFields": {},
                    "selectValues": []
                }
            ]
        },
        {
            "id": "block2",
            "blockId": "72",
            "blockName": "csv-to-json",
            "blockType": "convert_csv_to_json",
            "destinationBlockIds": [
                "block3"
            ],
            "blockInputs": [
                {
                    "id": "4125",
                    "name": "fileType",
                    "key": "input.fileType",
                    "type": "select",
                    "value": "5c5b9607-0173-1000-87ad-a0b9ca44885f",
                    "dynamicType": null,
                    "htmlType": "select",
                    "childrenFields": {},
                    "selectValues": [
                        {
                            "label": "csv",
                            "value": "5c5b9607-0173-1000-87ad-a0b9ca44885f"
                        }
                    ]
                },
                {
                    "id": "4126",
                    "name": "sortHeaders",
                    "key": "input.sortHeaders",
                    "type": "text",
                    "value": null,
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "4127",
                    "name": "alphabeticalSort",
                    "key": "input.alphabeticalSort",
                    "type": "checkbox",
                    "value": "false",
                    "dynamicType": null,
                    "htmlType": "checkbox",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "4128",
                    "name": "groupSize",
                    "key": "input.groupSize",
                    "type": "text",
                    "value": "1",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "4130",
                    "name": "groupBy",
                    "key": "input.groupBy",
                    "type": "text",
                    "value": null,
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                }
            ]
        },
        {
            "id": "block3",
            "blockId": "73",
            "blockName": "neo-block",
            "blockType": "neo_block",
            "destinationBlockIds": [
                "block4"
            ],
            "blockInputs": [
                {
                    "id": "4132",
                    "name": "neoDataFlows",
                    "key": "input.neoDataFlows",
                    "type": "neo",
                    "value": "http://neo-a.default:3000/api/v1/xto6x/execute/transform",
                    "dynamicType": null,
                    "htmlType": "select",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "4133",
                    "name": "split response",
                    "key": "input.splitResponse",
                    "type": "select",
                    "value": "true",
                    "dynamicType": null,
                    "htmlType": "select",
                    "childrenFields": {},
                    "selectValues": [
                        {
                            "label": "true",
                            "value": "true"
                        },
                        {
                            "label": "false",
                            "value": "false"
                        }
                    ]
                },
                {
                    "id": "4134",
                    "name": "Authorization",
                    "key": "input.authorization",
                    "type": "text",
                    "value": "Basic ${ten:append('\''product_sdk_user@capillarytech.com'\''):base64Encode()}",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "4135",
                    "name": "Max Retry",
                    "key": "input.maxRetry",
                    "type": "text",
                    "value": "",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "4136",
                    "name": "Extra Retry Error Codes",
                    "key": "input.extraRetryErrorCodes",
                    "type": "text",
                    "value": "",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "4137",
                    "name": "Extra No Retry Error Codes",
                    "key": "input.extraNoRetryErrorCodes",
                    "type": "text",
                    "value": "",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                }
            ]
        },
        {
            "id": "block4",
            "blockId": "57",
            "blockName": "API Block",
            "blockType": "http_write",
            "destinationBlockIds": [],
            "blockInputs": [
                {
                    "id": "389",
                    "name": "clientKey",
                    "key": "input.clientKey",
                    "type": "text",
                    "value": "noDQtnN74JhDS2C57i1oLQmzS",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "390",
                    "name": "clientSecret",
                    "key": "input.clientSecret",
                    "type": "password",
                    "value": "b0LGijN4V9nJXEgmXftOSI2549E9YvV4ccZCZvxu",
                    "dynamicType": null,
                    "htmlType": "password",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "391",
                    "name": "apiEndPoint",
                    "key": "input.apiEndPoint",
                    "type": "text",
                    "value": "/v2/integrations/customer/transaction/bulk",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "392",
                    "name": "apiBaseUrl",
                    "key": "input.apiBaseUrl",
                    "type": "text",
                    "value": "https://nightly.intouch.capillarytech.com",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "393",
                    "name": "apiMethod",
                    "key": "input.apiMethod",
                    "type": "select",
                    "value": "POST",
                    "dynamicType": null,
                    "htmlType": "select",
                    "childrenFields": {},
                    "selectValues": [
                        {
                            "label": "POST",
                            "value": "POST"
                        },
                        {
                            "label": "PUT",
                            "value": "PUT"
                        }
                    ]
                },
                {
                    "id": "394",
                    "name": "oAuthBaseUrl",
                    "key": "input.oAuthBaseUrl",
                    "type": "text",
                    "value": "https://nightly.intouch.capillarytech.com",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "396",
                    "name": "bulkSupport",
                    "key": "input.bulkSupport",
                    "type": "text",
                    "value": true,
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "397",
                    "name": "requestSplitPath",
                    "key": "input.requestSplitPath",
                    "type": "text",
                    "value": "$.*",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "398",
                    "name": "responseSplitPath",
                    "key": "input.responseSplitPath",
                    "type": "text",
                    "value": "$.*",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "399",
                    "name": "recoverableErrorCodes",
                    "key": "input.recoverableErrorCodes",
                    "type": "text",
                    "value": "521,502,503,504",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "400",
                    "name": "parsePathMap",
                    "key": "input.parsePathMap",
                    "type": "text",
                    "value": "{\"status_code\":\"$.*.['\''errors'\''].*.code\",\"error_message\":\"$.*.['\''errors'\''].*.message\",\"entity_id\":\"$.entity.id\"}",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "401",
                    "name": "yieldingErrorCodes",
                    "key": "input.yieldingErrorCodes",
                    "type": "text",
                    "value": "429",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "402",
                    "name": "maxRetries",
                    "key": "input.maxRetries",
                    "type": "text",
                    "value": "3",
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                },
                {
                    "id": "403",
                    "name": "additionalHeaders",
                    "key": "input.additionalHeaders",
                    "type": "text",
                    "value": null,
                    "dynamicType": null,
                    "htmlType": "text",
                    "childrenFields": {},
                    "selectValues": []
                }
            ]
        }
    ]
}'
```

## Complete Stitching Formula

```
// FINAL REQUEST BODY CONSTRUCTION (aka Step4 request body creation)

{
    // FROM STEP 2 (Canvas API)
    "dataflowUuid": response_from_step2.dataflowId,
    
    // GENERATED BASED ON BLOCKS
    "description": generateDescription(all_block_types),
    
    // FIXED VALUE
    "schedule": "0/1 0 * * * ? *",
    
    // BUILD BLOCKS ARRAY
    "blocks": [
        // FOR EACH BLOCK (in sequence order)
        {
            // CALCULATED FIELDS
            "id": "block" + (index + 1),  // block1, block2, block3, etc.
            "blockName": generateShortName(blockType), // Create readable name
            "destinationBlockIds": (isLastBlock ? [] : ["block" + (index + 2)]),
            
            // FROM STEP 3 (Block Details API)
            "blockId": blockId_used_in_step3,  // Same ID used to fetch details
            "blockType": response_from_step3.type,  // Copy from response
            "blockInputs": response_from_step3.blockInputs  // Copy entire array
        }
    ]
}
```

## Concrete Example: 4-Block Pipeline

### Given Block Sequence: (assume as per an use case)

1. sftp_read (blockId: 71)
2. convert_csv_to_json (blockId: 72)
3. neo_block (blockId: 73)
4. http_write (blockId: 57)

### Stitching Process:

```
# Step 1: Check if blocks for the given use case. If the necessary blocks are not available, tell the user that necessary blocks are not available. Also, before creating an empty canvas, show the blocks you are going to use to the user in the same order in which you are going to arrange them. If the user asks for modification, feel free to do it if you think that makes sense.

# Step 2: Create canvas
canvas_response = {
    "dataflowId": "b46d8cd7-e91e-1ad9-ffff-ffffa0d7ef0b"
}

# Step 3: Get details for each block
block_71_response = {
    "type": "sftp_read",
    "blockInputs": [...]  # Full array
}

block_72_response = {
    "type": "convert_csv_to_json",
    "blockInputs": [...]  # Full array
}

block_73_response = {
    "type": "neo_block",
    "blockInputs": [...]  # Full array
}

block_57_response = {
    "type": "http_write",
    "blockInputs": [...]  # Full array
}

# Step 4: Build final request
final_request = {
    "dataflowUuid": "b46d8cd7-e91e-1ad9-ffff-ffffa0d7ef0b",  # From Step 2
    "description": "Pipeline: sftp_read → convert_csv_to_json → neo_block → http_write",  # Generated
    "schedule": "0/1 0 * * * ? *",  # Fixed
    "blocks": [
        {
            "id": "block1",
            "blockId": "71",
            "blockName": "SFTP-Source",  # Generated from type
            "blockType": "sftp_read",  # From block_71_response.type
            "destinationBlockIds": ["block2"],  # Next block
            "blockInputs": block_71_response.blockInputs  # Entire array
        },
        {
            "id": "block2",
            "blockId": "72",
            "blockName": "CSV-to-JSON",
            "blockType": "convert_csv_to_json",  # From block_72_response.type
            "destinationBlockIds": ["block3"],
            "blockInputs": block_72_response.blockInputs
        },
        {
            "id": "block3",
            "blockId": "73",
            "blockName": "Transform",
            "blockType": "neo_block",  # From block_73_response.type
            "destinationBlockIds": ["block4"],
            "blockInputs": block_73_response.blockInputs
        },
        {
            "id": "block4",
            "blockId": "57",
            "blockName": "API-Writer",
            "blockType": "http_write",  # From block_57_response.type
            "destinationBlockIds": [],  # Empty - last block
            "blockInputs": block_57_response.blockInputs
        }
    ]
}
```