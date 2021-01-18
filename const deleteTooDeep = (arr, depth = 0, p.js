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
                 console.log("Hier")
                 console.log(json)
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
            parentFile = depth > 2 ? parentFileName : key
            let json = deleteTooDeep(arr[key], depth + 1, parentFile)

            // "on the object we set object's key to the deeper stuff"
            arr[key] = json

            // store all the returned contents TODO: maybe sort keys alphabetically ?
        })

        // so if one of the keys returned content, 
        // add it to the object, but only if depth is at least two, because nesting 2 needs to contain all the rest of contents.
        //arr.content = contentAccumulator
        arr.depth = depth
        // when done, we add the depth key to it.
        return arr
    }
    
    // here it's only string.

    // if the depth is over 2, fetch the files' contents !
     return arr
                
    
    // we read the file's content, and return it. it gets combined in the array handler !
    
}