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

const qb = { // quickbaseTablesInfo
    // This is where all the quickbase table names used to make queries are hardcoded & stored
    // these are used whenenever a page needs to retrieve, update, or create data on quickbase database
    studentExamples: {
        name: 'student-examples',
        id: 'br3juud42',
        fields: ['Record ID#', 'Last Reviewed Date', 'Review Interval', 'Related Student', 'Related example', 'Date Created']
    },
    students: {
        name: 'students',
        id: 'brrtdx784',
        fields: ['Record ID#', 'Name']
    },
    vocabulary: {
        name: 'vocabulary',
        id: 'brrcdgyix',
        fields: ['word/idiom', 'Vocab Name']
    },
    examples: {
        name: 'examples',
        id: 'brrcdgyjw',
        fields: ['Record ID#', 'spanish example', 'english translation', 'vocab included', 'spanglish?']
    },
    lessons: {
        name: 'Lessons',
        id: 'brrtcungb',
        fields: ['Lesson', 'Vocab Included']
        //fields: ['Lesson']
    }
}


function printFields(json) { 
    console.log('Fields', json.fields)
}

// camelizes string and also removes special characters like #
// for ex: converts 'Record ID#' to 'recordId', 'word/idiom' to 'wordIdiom', 'spanglish?' to 'spanglish'
function camelize(str) {
    const strArr = str.replaceAll(/[^\w\s]/gi, ' ')
    const strArr2 = strArr.split(' ')
    const camelArr = strArr2.map((word, index) => index === 0 ? word.toLowerCase(): word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    return camelArr.join('')
}

// creates object that maps fieldNames to their corresponding numbers on quickbase database
// essentially linking the fields names to the number they are associated with on quickbase
function createFieldsJSON(fieldNames, jsonFields) {
    const newArr = fieldNames.map(fieldName => {
        return {
            name: camelize(fieldName),
            number: jsonFields.find(element => element.label.toLowerCase() === fieldName.toLowerCase()).id
        }
    })
    //console.log('createFieldsJSON: ', newArr)
    return newArr
}

apiKey = process.env.API_KEY;

app.get('/',(req,res) => {
    res.json('nothing to see here');
});

function createTable2(data, linksArr) {
    //console.log('creatTable')
    return data.map(element => {
        const stringedJSON = '{' +  linksArr.map(link => { return ('\"' + link.name + '\"' + ':' + null)}).join(', ') + '}'
        //console.log('stringedJSON: ', stringedJSON)
        const parsedJSON = JSON.parse(stringedJSON)
        
        //console.log('parsedJSON: ', parsedJSON)
        linksArr.forEach(link => {
            parsedJSON[link.name] = element[link.number].value
        });
        //console.log('parsedJSON2: ', parsedJSON)
        return parsedJSON
    })
}

/*function createLocalTable(tableName, jsonData) {
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
}*/

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

    function createBody(tableID) {
        return {
            "from": tableID.id,
            "select": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
        }
    }

    const options = {
        url: 'https://api.quickbase.com/v1/records/query',
        method: 'POST',
        headers: createHeaders(),
        data: JSON.stringify(createBody(tableRequest)),
        responseType: "arraybuffer"
    }
    
    console.log(options);

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
        const json = JSON.parse(decodedData);

        printFields(json) // don't delete

        const linkedFieldsToNumsArr = createFieldsJSON(tableRequest.fields, json.fields)
        const tableArr = createTable2(json.data, linkedFieldsToNumsArr)
        return tableArr
        //Old Version:
        //const filteredTable = createLocalTable(tableRequest,objectTable);
        //const stringyTable = JSON.stringify(filteredTable);
        //return stringyTable
    })
    //.catch(err => console.log(err))

    return jsonTable;
}

app.get('/qb-vocabulary', async (req,res) => {
    const vocabTable = await getTable(qb.vocabulary);
    //console.log(await vocabTable);
    res.json(await vocabTable);
});

app.get('/qb-lessons', async (req,res) => {
    const lessonTable = await getTable(qb.lessons);
    //console.log(await lessonTable);
    res.json(await lessonTable);
});

app.get('/qb-examples', async (req,res) => {
    const exampleTable = await getTable(qb.examples);
    //console.log(await exampleTable);
    res.json(await exampleTable);
});

app.listen(PORT,()=>console.log('server is listening'));