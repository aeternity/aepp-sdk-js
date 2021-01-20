// takes the generated DOC files and flattens their structure so that there are no more than 2 levels of nesting in the menu.

// State: 
// generates yaml seemingly as needed in the nav, 
// left to do: -formatting the headers of the flattened, properly
// - inserting into the mkdocs.yaml nav !


// one is better at parsing, the other is better at converting!
const YAML = require('yamljs');
const yaml = require('js-yaml');

const fs = require('fs')
var os = require("os");

/// helpers
basePath = './docs/'

cleanupAccumulator = (s) => {
    while(s.charAt(0) === ' ' || s.charAt(0) === '➔'){
        s = s.substring(1);
    }
    return s
}

Object.defineProperty(Set.prototype, 'addAll', {
    enumerable: false,
    configurable: false,
    value: function (iterable) {
      for (let item of iterable) {
        this.add(item);
      }
      return this;
    }
  });

const isObject = A => {
    if( (typeof A === "object" || typeof A === 'function') && (A !== null) )
    {
        return true
    } else {return false}
}

// stub, do header formatting based on depth here !
const formatHeaders = (input, depth) =>{
    return input
}
const filenameFromPath = (path) => {
    const regex = new RegExp('[ \\w-]+?(?=\\.)')
    return path.match(regex)[0];
}

// for objects, for every key, we assume that every value of type string is a path to a file that can be opened
// if depth is over 2 and we have a string, load that file and save it to parentFileName ! 
const assignDepth = (arr, depth = 1, parentFileName = "") => {

    // if it's an array:
    if(Array.isArray(arr)){

        var contentAccumulator = ''

        arr.forEach((value, index, array) => {
            // process array content with same depth level

            // if the return has file content, add it to the corresponding parentFileName !
            
            let {content, json} = assignDepth(value, depth)
            arr[index] = json

            // if there is content, add it to the content accumulator.
            if (content != null && content.length > 2) { 
                contentAccumulator = contentAccumulator + ' ➔ ' + content
            }
            // <<<-------- accumulate content here !!!
        })
       
        if (depth >2){
         return {json: arr, content: contentAccumulator} 
        } else {
            return {json: arr, content: null}
        }
    }  
    
    // check if array value is an object:
    else if (isObject(arr) == true) {
        // if yes, we process all its keys
        
        var contentAccumulator = ''

        Object.keys(arr).forEach(key => {
            // if the 'content' key is checked, return that one as JSON basically, and add its
            // content to the accumulator so it's returned later, too
            
       /*      if (key == "content") {
                console.log("checking content")
                contentAccumulator = contentAccumulator + ' \n \n ' + arr.key
                return {json: arr.content, content: undefined}
            }
             */

            // if the depth is over 2, pass the previous parentFileName. 
            // If under, pass the key as parentFileName
            parentFile = depth > 2 ? parentFileName : key
            let {content, json} = assignDepth(arr[key], depth + 1, parentFile)

            // "on the object we set object's key to the deeper stuff"
            arr[key] = json

            // store all the returned contents TODO: maybe sort keys alphabetically ?
            if (content != null && content.length > 2) { 
                contentAccumulator = contentAccumulator + ' ➔ ' + content
                // removes all the trailing nonsense:
                contentAccumulator = cleanupAccumulator(contentAccumulator)
            }
        })

        // so if one of the keys returned content, 
        // add it to the object, but only if depth is at least two, because nesting 2 needs to contain all the rest of contents.
        depth > 1 ? arr.content = contentAccumulator : true
        //arr.content = contentAccumulator
        arr.depth = depth
        // when done, we add the depth key to it.
        return {content: arr.content, json: arr}
    }
    
    // here it's only string.

    // if the depth is over 2, fetch the files' contents !
    if(depth > 2){
        // return file content
        //let data = fs.readFileSync(basePath + arr, "utf8");
        
        // return file name and add depth indicator to the end
        let data = arr + '---' + depth;
        //console.log(data)
        return {json: arr, 
                content: data 
                } 
    } else {
        return {json: arr,
                content: null}
    }
    // we read the file's content, and return it. it gets combined in the array handler !
    
}

// first, parse mkdocs YAML to JSON
parsedYaml = YAML.load('mkdocs_original.yml');

// 3rd nesting: head title: ##   , content ###
// 4th nesting: head title: ###  , content ####

// assign depth to each nav entry
let JSONwithDepth = assignDepth(parsedYaml.nav)
fs.writeFileSync('./parsedYaml.nav.txt', JSON.stringify(JSONwithDepth, null, 2))

// delete what's nested too deep (that stuff remains under the keys 'content)
const deleteTooDeep = (arr, depth = 0, parentFileName = "") => {
    
    // we work on the input array, not constructing new one!
    const isObject = A => {
        if( (typeof A === "object" || typeof A === 'function') && (A !== null) )
        {
            return true
        } else {return false}
    }

    // if it's an array:
    if(Array.isArray(arr)){


        arr.forEach((value, index, array) => {
            let json = deleteTooDeep(value)
            // remove the result if its depth is over 2 !
            //console.log(value)
            //arr[index = json]
             if (isObject(json) && json.depth > 2){  
                arr.splice(index,1)
            } else {
                // just in case if JSON is not an object, add it anyway.
                arr[index] = json
            } 
            // <<<-------- accumulate content here !!!
        })

        return arr 
        
    }  
    
    // check if array value is an object:
    else if (isObject(arr) == true) {
        // if yes, we process all its keys

        Object.keys(arr).forEach(key => {
            // if the 'content' key is checked, return that one as JSON basically, and add its
            // content to the accumulator so it's returned later, too
            
       /*      if (key == "content") {
                console.log("checking content")
                contentAccumulator = contentAccumulator + ' \n \n ' + arr.key
                return {json: arr.content, content: undefined}
            }
             */

            // if the depth is over 2, pass the previous parentFileName. 
            // If under, pass the key as parentFileName
            //parentFile = depth > 2 ? parentFileName : key
            let json = deleteTooDeep(arr[key], depth + 1)

            // "on the object we set object's key to the deeper stuff"
            arr[key] = json

            // store all the returned contents TODO: maybe sort keys alphabetically ?
        })

        // so if one of the keys returned content, 
        // add it to the object, but only if depth is at least two, because nesting 2 needs to contain all the rest of contents.
        //arr.content = contentAccumulator
        arr.depth = arr.depth
        // when done, we add the depth key to it.
        return arr
    }
    
    // here it's only string.
     return arr
                
    
    // we read the file's content, and return it. it gets combined in the array handler !
    
}

const generateFilesFromContent = (arr) => {

    // if it's an array:
    if(Array.isArray(arr)){

        var docs = new Set()

        arr.forEach((value, index, array) => {
            let json = generateFilesFromContent(value)

            // just add it back
            arr[index] = json
        })

        return arr

    } // check if it is an object:
    else if (isObject(arr) == true) {
        // only handle if the key is not depth or content !

        

        Object.keys(arr).forEach(key => {
            // get the "sweet stuff"
            if(key != "depth" && key != "content") {
                
                var docs = new Set()

                if(arr.content){
                    // if docs exist, get them !
                    var existingDocs = []
                    // if "the key" is an array
                    if(Array.isArray(arr[key])) {
                        existingDocs = arr[key].filter(el => {
                            return typeof el === 'string'
                        })
                        
                        // add all docs from this "key" (which is non-content-nondepth)
                        // to the Set
                        existingDocs.forEach(el => docs.add(el))  // <--------
                    } else {
                        // else we assume "the key" contains only a string
                        docs.add(arr[key])
                    }


                    // strip tag numbers from file paths and compare if 
                    // the "content" stuff is already present in Set
                    let contentArray = arr.content.split(' ➔ ')
                    let filteredContentArray = []

                    //process all existing "content":
                    while(contentArray.length > 0){

                        // get the last one and split it:
                        let [path, originalDepth] = contentArray.pop().split('---')
                        // if it exists in the set, put it back into the array still to be processed.
                        !docs.has(path) ? filteredContentArray.push(path + "---" + originalDepth) : true

                    }


                    // USE filteredContentArray ARRAY TO BUILD FILES (DONT FORGET TO PROCESS THEM)
                    //AND ADD THE OUTPUT TO THE EXISTING DOCS ! 

                    // THEN, ADD THE EXISTING DOCS AS VALUE FOR "THAT KEY"
                    
                    // put content from filtered files (those not present in list of contents yet)
                    var filecontentAcc = ''
                    var generatedFileName = ''

                    if(filteredContentArray.length > 0){
                        while(filteredContentArray.length > 0){
                            let [path, originalDepth] = filteredContentArray.pop().split('---')
                            let data = fs.readFileSync(basePath + path, "utf8");
                            let adjustedHeadings = formatHeaders(data, originalDepth);
                            filecontentAcc = filecontentAcc.concat([adjustedHeadings, os.EOL]);
                            let filename = filenameFromPath(path)
                            generatedFileName = generatedFileName.concat(filename + '-' + originalDepth);
                        }
                        // for the TOC
                        let generatedFile_relativePath = 'flattened/' + generatedFileName + '.md'
                        // for file writing
                        let generatedFile_absolutePath = basePath + generatedFile_relativePath
                        
                        fs.writeFileSync(generatedFile_absolutePath, filecontentAcc, null, 2)
                        existingDocs.push(generatedFile_relativePath)
                        const docsAttachedWithGenerated = existingDocs

                        console.log("Pushed: ", generatedFile_absolutePath)

                        arr[key] = docsAttachedWithGenerated;

                        //console.log(filteredContentArray)
                    }
                }

                //?    json = generateFilesFromContent(arr[key])
                return json = generateFilesFromContent(arr[key])

            }

        })

        // delete the content and depth key
        delete arr.content;
        delete arr.depth;

        return arr

    } else {

        // just the strings - but those are we need ! 
        return arr
    }


}



// save the unflattened result
console.log(JSONwithDepth)
fs.writeFileSync('./testOutput.json', JSON.stringify(JSONwithDepth.json, null, 2))

console.log("Now flattened: ")

// another recursive function. this time, the TOCs array is populated with only newly constructed 
// objects for its array
const flattened = deleteTooDeep(JSONwithDepth.json)

console.log(deleteTooDeep(flattened))
fs.writeFileSync('./flattened.txt', JSON.stringify(flattened, null, 2))
//console.log(JSON.stringify(JSONwithDepth, null, 2))

const reFlattened = deleteTooDeep(flattened)

fs.writeFileSync('./reFlattened.json', JSON.stringify(reFlattened, null, 4))

const filesProcessed = generateFilesFromContent(reFlattened)

fs.writeFileSync('./final.json', JSON.stringify(filesProcessed, null, 4))

var backToYaml = yaml.dump(filesProcessed);
fs.writeFileSync('./yaml_jsyaml.yml', backToYaml, null, 4)

// load the mkdocs.yml and insert the nav
mkdocs = YAML.load('mkdocs.yml');
mkdocs.nav = filesProcessed;
console.log(mkdocs)


var mkdocs_generated = yaml.dump(mkdocs);
fs.writeFileSync('./mkdocs_generated.yml', mkdocs_generated, null, 4)