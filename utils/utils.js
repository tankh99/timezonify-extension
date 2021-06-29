export var test = "Testing"
export const setStorageValue = (key, value) => {
    browser.storage.sync.set({[key]: value})
}
  
export const getStorageValue = async(key) => {
  var gettingValue = await browser.storage.sync.get([key]);
  return gettingValue && gettingValue[key]
}


export const getBrowserTabs = async () => {
  return new Promise((resolve) => {

    browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
      resolve(tabs);
    })
  })
}