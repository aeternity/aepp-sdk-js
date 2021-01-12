// takes the generated DOC files and flattens their structure so that there are no more than 2 levels of nesting in the menu.

const YAML = require('yamljs');

/// helpers
basePath = './docs'

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
        arr.forEach((value, index, array) => {
            // process array content with same depth level
            arr[index] = assignDepth(value, depth)
        })
    }  
    
    // check if array value is an object:
    else if (isObject(arr) == true) {
        // if yes, we process all its keys
        Object.keys(arr).forEach(key => {
            // "on the object we set object's key to..."
            arr[key] = assignDepth(arr[key], depth + 1)
        })
        // when done, we add the depth key to it.
        arr.depth = depth
    }

    // the last case is a string, which we just pass through.

    // here it's either an array, an object or string
    return arr
}

// first, parse mkdocs YAML
parsedYaml = YAML.load('mkdocs_original.yml');

// 3rd nesting: head title: ##   , content ###
// 4th nesting: head title: ###  , content ####

// assign depth to each nav entry
let JSONwithDepth = assignDepth(parsedYaml.nav)

console.log(JSON.stringify(JSONwithDepth, null, 2))

