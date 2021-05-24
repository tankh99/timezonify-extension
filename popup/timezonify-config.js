// import timezones from '../timezones.json'

// const src = browser.runtime.getURL("data/storage.js");
// const storage = await import(src);

function setStorageValue(key, value){
    browser.storage.sync.set({[key]: value})
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
var storage;

async function init(){
    getStorageValue("enabled")
    .then((res) => {
        enabled = res;
        if(enabled == null) {
            setStorageValue("enabled", true)
            enabled = true;
        }
        updateIndicator(enabled)
    })
}

function updateIndicator(_enabled){
    enabled = _enabled
    document.querySelector("#enabled-indicator").innerText = _enabled ? "Enabled" : "Disabled"
    document.querySelector(".toggle-timezonify-btn").checked = _enabled;
}


function onClickListener(){
    
    document.addEventListener("click", (e) => {

        function toggleTimezonify(){    
            setStorageValue("enabled", !enabled);
            updateIndicator(!enabled)
        }

        function reportError(error){
            console.error(`Could not timezonify: ${error}`);
        }

        if (e.target.classList.contains("toggle-timezonify-btn")){
            
            toggleTimezonify();
            // browser.tabs.query({active: true, currentWindow: true})
            // .then(toggleTimezonify)
            // .catch(reportError)
        }
    })
}

function reportScriptError(error){
    console.error(`Failed to execute timezonify content script: ${error.message}`);
}


(() => {
    init();
    if(window.hasRun){
        return
    }

    browser.tabs.executeScript({file: "/content_scripts/timezonify.js"})
    .then(onClickListener)
    .catch(reportScriptError)
    window.hasRun = true;
})()

