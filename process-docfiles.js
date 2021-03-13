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
var S = require('string');

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

//Description: Tests if a string is some header in markdown
const isSomeHeader = (input) => {

}


// 1. Formats the headers to resemble a correct TOC necessary for readthedocs
const countUpAllTopicLevels = (input, depth) =>{
    //console.log("format depth : ", depth)

    // from depth 4 on we add one additional hashtag to topics, for depth 5 we add 2 hashtags, and so on.
    let additionalHashtags = depth - 3
    let result = input

    let reg2 = new RegExp(`^## `, 'gm')
    let reg3 = new RegExp(`^### `, 'gm')
    let reg4 = new RegExp(`^#### `, 'gm')
    let reg5 = new RegExp(`^##### `, 'gm')
    let reg6 = new RegExp(`^###### `, 'gm')

    result = result.replace(reg6, `######${'#'.repeat(additionalHashtags)} `)
    result = result.replace(reg5, `#####${'#'.repeat(additionalHashtags)} `)
    result = result.replace(reg4, `####${'#'.repeat(additionalHashtags)} `)
    result = result.replace(reg3, `###${'#'.repeat(additionalHashtags)} `)
    result = result.replace(reg2, `##${'#'.repeat(additionalHashtags)} `)
    //var path = regex.exec(line)[0]

    return result
}

// takes text, returns text.
const formatAllContent = (input, depth) =>{
    
    // 1. remove unwanted tokens from headings ('.exports', etc.)
    // remove ⏏ everywhere 
    let sig = funcSigRegex.exec(removeExports)[0]
                let sigLine = `**Type Sig:** ${sig}`
                formattedLines.push(sigLine  + '\n')
    replaced = S(replaced).replaceAll('* _instance_', '').s
    replaced = S(replaced).replaceAll('* _async_', '').s
    replaced = S(replaced).replaceAll('* _static_', '').s
    // split into array of lines
    var lines = S(replaced).lines()
   
    // do the actual formatting
    var formattedLines = []; 
    
    lines.forEach((line, index, array) => {
        if(line.startsWith("import TransactionValidator")){
        /* if(line.startsWith("#### unpackAndVerify(txHash")){ */
            console.log("found the deleted line!")
            console.log("At line " + index + " of text array length: " + array.length)
        }
        // remove module path from the title and put it one line below
        let isHeadingRegex = new RegExp('^#.*? @aeternity/aepp-sdk/.*?$')
        // remove TOC in text - nobody is using these docs in github
        let isTOCline = new RegExp('.*?\\* .*?\\[.*?\]\\(#.*?\\).*?$')

        let isSubHeading = new RegExp('^##')
        // get the function signature from heading
        let funcSigRegex = new RegExp('[A-Za-z].*$')
        // get only function name from heading's type signature
        let pollutedHeaderRegex = new RegExp('(?<=[^#\\*a-zA-Z\\d\\s:]).*(?=\\()')
        //let cleanHeaderRegex = new RegExp('^[^\\*;](?<= )[^\\*;]*(?=\\()')

        let onlyFuncNameRegex = new RegExp('(?<=\\s).*?(?=\\()')

        // get all the heading hashtags, without the trailing space.
        let headingHashtagsRegex = new RegExp('^#.*#')

        if (isHeadingRegex.test(line)){
            // if it's a header like ## @aeternity/aepp-sdk/es/tx/builder:
            //.. match the path:
            let regex = new RegExp('@aeternity/aepp-sdk/.*?$')
            var path = regex.exec(line)[0]
            // ... and insert it as a new line under the old heading.
            formattedLines.push(removePath = S(line).replaceAll('@aeternity/aepp-sdk/es/', '').s)
            let modulePath = `**Module Path:** ${path} \n` 
            formattedLines.push(modulePath)
            // .. and remove path from heading


        } else if(isTOCline.test(line)){
            // if it's a ToC (table of contents) line, remove it
            return null
        } else if (isSubHeading.test(line)){
            //remove '.exports'
            let removeExports = line.replace('exports.', '')

            // extract function signature from heading and add below heading
            // first, test if it's some polluted header like #### *tx.nameUpdateTx(options) ⇒ `String`*
            if(pollutedHeaderRegex.test(removeExports)){
                let onlyFunctionName = pollutedHeaderRegex.exec(removeExports)[0]
                var sig;
                // extract the sig, clean it and add it a line below heading
                try{sig = funcSigRegex.exec(removeExports)[0]} catch (e) {
                    console.log("Issue with: ", removeExports); 
                    formattedLines.push(removeExports)
                }
                let cleanedSig = sig.replace('*', '')
                

                let onlyHeadings = headingHashtagsRegex.exec(removeExports)[0]
                formattedLines.push(onlyHeadings + ' ' + onlyFunctionName)
                
                let sigLine = `**Type Sig:** ${cleanedSig}`
                formattedLines.push(sigLine)

            } else if (funcSigRegex.test(removeExports)) { // we assume it's a clean heading here
                // if it is a clean header like ### buildTransaction(type, params, [options]) ⇒ `Object` 
                var onlyFunctionName = '';
                try {
                onlyFunctionName = onlyFuncNameRegex.exec(removeExports)[0]
                } catch(e){
                    console.log("Failed getting function name from this input: ", removeExports)
                    formattedLines.push(removeExports)
                }
                if(onlyFunctionName.length < 2) {
                    console.log("No function name found in : ", removeExports); 
                    // if a function signature could not be found, just take the old heading without the #s
                    let sig = S(removeExports).replaceAll('#', '').s
                    let sigLine = `**Type Sig:**${sig}`
                    formattedLines.push(sigLine  + '\n')
                }
                // extract the sig, clean it and add it a line below heading

                let onlyHeadings = headingHashtagsRegex.exec(removeExports)[0]
                formattedLines.push(onlyHeadings + ' ' + onlyFunctionName + '\n')
                // add type signature
                let sig = funcSigRegex.exec(removeExports)[0]
                let sigLine = `**Type Sig:** ${sig}`
                formattedLines.push(sigLine  + '\n')

            } else {
                console.log("================================== WARNING == no subheader formatting pattern matched, add one !")
                formattedLines.push(line)
            }

           
        } else{
            formattedLines.push(line) // here it should be just some line of text
        }
    })

    joinedLines = formattedLines.join('\n')

    // Replace repeated empty lines
    var EOL = joinedLines.match(/\r\n/gm)?"\r\n":"\n";
    var regExp = new RegExp("("+EOL+"){3,}", "gm");
    text = joinedLines.replace(regExp, EOL+EOL+EOL);

    return text
    //return input
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
                            let adjustedHeadings = countUpAllTopicLevels(data, originalDepth);
                            filecontentAcc = filecontentAcc.concat([adjustedHeadings, os.EOL]);
                            let filename = filenameFromPath(path)
                            console.log("Originaldepth : ", originalDepth)
                            generatedFileName = generatedFileName.concat(filename + '-' + originalDepth);
                        }
                        // for the TOC
                        let generatedFile_relativePath = 'flattened/' + generatedFileName + '.md'
                        // for file writing
                        let generatedFile_absolutePath = basePath + generatedFile_relativePath
                        
                        // do the pretty-formatting before saving:
                        //let formattedContent = formatAllContent(filecontentAcc)

                        // short-circuit file content formatting here, we do it in the end for every file.
                        let formattedContent = filecontentAcc;

                        fs.writeFileSync(generatedFile_absolutePath, formattedContent, null, 2)
                        existingDocs.push(generatedFile_relativePath)
                        const docsAttachedWithGenerated = existingDocs

                        console.log("Pushed: ", generatedFile_absolutePath)
                            
                        // as a last step: if "the key" consists of an array:
                        // if the array length is only one, set its value for the key.
                        // if more files in the entry, merge them all together, save, and put that new one as value !
                        
                        arr[key] = docsAttachedWithGenerated;
                        //console.log(filteredContentArray)
                    }

                           
                    // as a last step: if "the key" consists of an array:
                    // if the array length is only one, set its value for the key.
                    // if more files in the entry, merge them all together, save, and put that new one as value !
                        
                    if (arr.depth && arr.depth > 1){
                        if(key == 'ae'){
                            console.log("AE coming!")
                        }

                        // if the array length is only one, set its value for the key.
                        if (Array.isArray(arr[key]) && arr[key].length == 1){
                            arr[key] = arr[key][0]
                            // if more files in the entry, merge them all together, save, and put that new one as value !

                        } else if (Array.isArray(arr[key]) && arr[key].length > 1) {
                            var filecontentAcc = ''
                            var generatedFileName = ''

                            arr[key].forEach(path => {
                                let data = fs.readFileSync(basePath + path, "utf8");
                                filecontentAcc = filecontentAcc.concat([data, os.EOL]);
                                let filename = filenameFromPath(path)
                                generatedFileName = generatedFileName.concat(filename + '-');
                            });
                                                    // for the TOC
                            let generatedFile_relativePath = 'flattened/' + generatedFileName + '.md'
                            // for file writing
                            let generatedFile_absolutePath = basePath + generatedFile_relativePath
                            
                            // do the pretty-formatting before saving:
                            // short-circuit file content formatting here, we do it in the end for every file.
                            /* let formattedFilecontentAcc = formatAllContent(filecontentAcc) */
                            let formattedFilecontentAcc = filecontentAcc
                            fs.writeFileSync(generatedFile_absolutePath, formattedFilecontentAcc, null, 2)

                            arr[key] = generatedFile_relativePath
                        }
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
fs.writeFileSync('./mkdocs.yml', mkdocs_generated, null, 4)

// add the ## titles (2 hash signs) to all files in the API reference necessary for proper displaying in readthedocs


// find the "API reference" entry in the navigation
var APIref;

mkdocs.nav.forEach(navEntry => {
    if (Object.keys(navEntry)[0] == "API Reference"){
        APIref = navEntry['API Reference'];
    }
})

// format each file and add a header topic to it
APIref.forEach(entry => {
    fileTitle = Object.keys(entry)[0]
    filePath = entry[fileTitle]
    
    var theFile = fs.readFileSync(basePath + filePath);
    
    var fileContent = S(formatAllContent(theFile)).lines()
    fileContent.unshift("## " + fileTitle, ' ', )

    withAddedHeadings = fileContent.join('\n')
    fs.writeFileSync(basePath + filePath, withAddedHeadings)
})