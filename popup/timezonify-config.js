// import timezones from '../timezones.json'

function setStorageValue(key, value){
    browser.storage.sync.set({[key]: value})
    // console.log("FUCK")
}

function getStorageValue(key){
    return new Promise((resolve) => {
        var gettingValue = browser.storage.sync.get([key]);
        gettingValue.then((res) => {
            return resolve(res[key]);
        })
    })
}

function getCurrentTab(){
    return browser.tabs.query({active: true, currentWindow: true})
}

var enabled; 

function init(){
    getStorageValue("enabled")
    .then((res) => {
        if(res){
            enabled = res
        } else { // set default value
            setStorageValue("enabled", true)
            enabled = true;
        } 
        updateIndicator(enabled)
    })
}

function updateIndicator(_enabled){
    enabled = _enabled
    document.querySelector("#enabled-indicator").innerText = _enabled ? "Enabled" : "Disabled"
}


(() => {
    if(!window.hasRun){
        init();
    }

    window.hasRun = true;
})()

function onClickListener(){
    
    document.addEventListener("click", (e) => {

        function toggleTimezonify(tabs){    
            setStorageValue("enabled", !enabled);
            updateIndicator(!enabled)
            browser.tabs.sendMessage(tabs[0].id, {
                command: "toggle",
            })
        }

        function reportError(error){
            console.error(`Could not timezonify: ${error}`);
        }

        if (e.target.classList.contains("toggle-timezonify-btn")){
            // setStorageValue("enabled", !enabled)
            getCurrentTab()
            .then(toggleTimezonify)
            .catch(reportError)
        }
    })
}

function reportScriptError(error){
    console.error(`Failed to execute timezonify content script: ${error.message}`);
}

browser.tabs.executeScript({file: "/content_scripts/timezonify.js"})
.then(onClickListener)
.catch(reportScriptError)

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request)
})