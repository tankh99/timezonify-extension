function readFile(path, callback){
    fetch(path, {mode: "same-origin"})
    .then((res) => {
        return res.blob()
    })
    .then((blob) => {
        let reader = new FileReader()
        reader.addEventListener("loadend", () => {
            callback(this.result)
        })
        reader.readAsText(blob)
    })
}