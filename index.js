const PORT = process.env.PORT || 8000

const express = require('express');
const cors = require('cors');
const axios = require('axios');
//const { get } = require('http');
//const { response, json } = require('express');
//const { arrayBuffer } = require('stream/consumers');
require('dotenv').config();

const app = express();

app.use(cors())

const IS_DATABASE_ASCII = true

const TABLE = {
    VOCABULARY: {
        NAME: 'vocabulary',
        ID: 'brrcdgyix',
        FIELDS: {
            // id: 3,
            wordIdiom: 6,
            use: 7,
            partOfSpeech: 8,
            frequencyRank: 14,
            vocabName: 17
        }
    },
    EXAMPLES: {
        NAME: 'examples',
        ID: 'brrcdgyjw',
        FIELDS: {
            // id: 3,
            spanishExample: 6,
            englishTranslation: 7,
            vocabIncluded: 15,
            spanglish: 13
        }
    },
    LESSONS: {
        NAME: 'lessons',
        ID: 'brrtcungb',
        FIELDS: {
            lesson: 6,
            vocabIncluded: 11
        }
    },
    VOCABULARY_EXAMPLES: 'brrcdgykk'
}

apiKey = process.env.API_KEY;

app.get('/',(req,res) => {
    res.json('nothing to see here');
});

function createLocalTable(tableName, jsonData) {
    let newArr
    switch(tableName) {
        
        case TABLE.VOCABULARY.NAME:
            newArr = jsonData.data.map(row => {
                return {
                    name: row[TABLE.VOCABULARY.FIELDS.vocabName].value,
                    partOfSpeech: row[TABLE.VOCABULARY.FIELDS.partOfSpeech].value,
                    frequencyRank: row[TABLE.VOCABULARY.FIELDS.frequencyRank].value
                }
            })       
            vocabTable = (newArr);
            return vocabTable;
        case TABLE.EXAMPLES.NAME:
            newArr = jsonData.data.map(row => {
                return {
                    spanish: row[TABLE.EXAMPLES.FIELDS.spanishExample].value,
                    english: row[TABLE.EXAMPLES.FIELDS.englishTranslation].value,
                    vocabIncluded: row[TABLE.EXAMPLES.FIELDS.vocabIncluded].value,
                    spanglish: row[TABLE.EXAMPLES.FIELDS.spanglish].value
                }
            })
            examplesTable = (newArr);
            return examplesTable;
            //setExampleList(examplesTable)
        case TABLE.LESSONS.NAME:
            newArr = jsonData.data.map(row => {
                return {
                    lesson: row[TABLE.LESSONS.FIELDS.lesson].value,
                    vocabIncluded: row[TABLE.LESSONS.FIELDS.vocabIncluded].value
                }
            })
            //console.log('lesson arr')
            //console.log(newArr)
            lessonsTable = (newArr);
            return lessonsTable
        default:
            //
    }
}

async function getTable(tableRequest) {
    const authorizer = `QB-USER-TOKEN ${apiKey}`;

    function createHeaders() {
        const headers = {
            'QB-Realm-Hostname': 'masterofmemory.quickbase.com',
            'User-Agent': 'NewBackend',
            'Authorization': authorizer,
            'Content-Type': 'application/json'
        }
        return headers
    }

    function createBody(tableName) {
        let body
        switch(tableName) {
            case TABLE.VOCABULARY.NAME:
                body = {
                    "from": TABLE.VOCABULARY.ID,
                    "select": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
                }
                return body
            case TABLE.EXAMPLES.NAME:
                body = {
                    "from": TABLE.EXAMPLES.ID,
                    "select": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
                    //"where": whereClause
                }
                return body
            case TABLE.LESSONS.NAME:
                body = {
                    "from": TABLE.LESSONS.ID,
                    "select": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
                }
                return body
            default:
        }
    }

    const options = {
        url: 'https://api.quickbase.com/v1/records/query',
        method: 'POST',
        headers: createHeaders(),
        data: JSON.stringify(createBody(tableRequest)),
        responseType: "arraybuffer"
    }

    const jsonTable = await axios.request(options).then((response) => {
        let decodedData = {};
        if (response.statusText === 'OK') {
            if(IS_DATABASE_ASCII){
                const decoder = new TextDecoder('ASCII');
                const rawData = response.data;
                decodedData = decoder.decode(rawData);
            } else {
                const decoder = new TextDecoder();
                const rawData = response.data;
                decodedData = decoder.decode(rawData);
            }
            
        } else {
            return(`Response: ${response.statusText}`);
        }
        const objectTable = JSON.parse(decodedData);
        const filteredTable = createLocalTable(tableRequest,objectTable);
        const stringyTable = JSON.stringify(filteredTable);
        return stringyTable
    })
    .catch(err => console.log(err))

    return jsonTable;
}

app.get('/qb-vocab-table',async (req,res) => {
    const vocabTable = await getTable('vocabulary');
    console.log(await vocabTable);
    res.json(await vocabTable);
});

app.get('/qb-lesson-table',async (req,res) => {
    const lessonTable = await getTable('lessons');
    console.log(await lessonTable);
    res.json(await lessonTable);
});

app.get('/qb-example-table', async (req,res) => {
    const exampleTable = await getTable('examples');
    console.log(await exampleTable);
    res.json(await exampleTable);
});

app.listen(PORT,()=>console.log('server is listening'));