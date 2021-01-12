// takes the generated DOC files and flattens their structure so that there are no more than 2 levels of nesting in the menu.

// State: 
// seems to be flattening everything beyond level 2 up to level 2 content, n
// needs some more manual testing / verification though

const { fakeServer } = require('sinon');
const YAML = require('yamljs');
const fs = require('fs')

/// helpers
basePath = './docs/'

// for objects, for every key, we assume that every value of type string is a path to a file that can be opened

// if depth is over 2 and we have a string, load that file and save it to parentFileName ! 
const assignDepth = (arr, depth = 1, parentFileName = "") => {
    
    // we work on the input array, not constructing new one!
    const isObject = A => {
        if( (typeof A === "object" || typeof A === 'function') && (A !== null) )
        {
            return true
        } else {return false}
    }

    // if it's an array:
    if(Array.isArray(arr)){

        var contentAccumulator = ''

        arr.forEach((value, index, array) => {
            // process array content with same depth level

            // if the return has file content, add it to the corresponding parentFileName !
            
            let {content, json} = assignDepth(value, depth)
            arr[index] = json

            // if there is content, add it to the content accumulator.
            if (content != null) { 
                contentAccumulator =  contentAccumulator + ' \n \n ' + content
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

            // "on the object we set object's key to..."
            arr[key] = json
            // store all the returned contents TODO: maybe sort keys alphabetically ?
            if (content != null) { 
                contentAccumulator =  contentAccumulator + ' \n \n ' + content
            }
        })

        // so if one of the keys returned content, 
        // add it to the object, but only if depth is at least two, because nesting 2 needs to contain all the rest of contents.
        depth > 1 ? arr.content = contentAccumulator : true
        //arr.content = contentAccumulator

        // when done, we add the depth key to it.
        arr.depth = depth
        return {content: arr.content, json: arr}
    }
    
    // here it's only string.

    // if the depth is over 2, fetch the files' contents !
    if(depth > 2){

        let data = fs.readFileSync(basePath + arr, "utf8");
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

// first, parse mkdocs YAML
parsedYaml = YAML.load('mkdocs_original.yml');

// 3rd nesting: head title: ##   , content ###
// 4th nesting: head title: ###  , content ####

// assign depth to each nav entry
let JSONwithDepth = assignDepth(parsedYaml.nav)

console.log(JSONwithDepth)
fs.writeFileSync('./testOutput.txt', JSON.stringify(JSONwithDepth, null, 2))
//console.log(JSON.stringify(JSONwithDepth, null, 2))

