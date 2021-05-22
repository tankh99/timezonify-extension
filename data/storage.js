function setStorageValue(key, value){
    browser.storage.sync.set({[key]: value})
    // console.log("FUCK")
}

function getStorageValue(key){
    return new Promise((resolve) => {
        var gettingValue = browser.storage.sync.get([key]);
        gettingValue.then((res) => {
            console.log(res[key])
            resolve(res[key]);
        })
    })
}
// module.exports = 
// exports.setStorageValue = setStorageValue;
// exports.getStorageValue = getStorageValue;
export {
    setStorageValue,
    getStorageValue
}
