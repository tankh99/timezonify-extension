// import timezones from '../timezones.json'

// const src = browser.runtime.getURL("data/storage.js");
// const storage = await import(src);

function setStorageValue(key, value){
    browser.storage.sync.set({[key]: value})
}

async function getStorageValue(key){
    var gettingValue = await browser.storage.sync.get([key]);
    return gettingValue && gettingValue[key]
}

function getCurrentTab(){
    return browser.tabs.query({active: true, currentWindow: true})
}

var enabled; 
var autoHighlight;
var storage;

async function init(){
    const _enabled = await getStorageValue("enabled")
    const _autoHighlight = await getStorageValue("autoHighlight");
    enabled = _enabled
    updateIndicator("enabled", _enabled)
    autoHighlight = _autoHighlight;
    updateIndicator("autoHighlight", _autoHighlight)


}

function updateIndicator(key, value){
    
    // const indicators = document.querySelectorAll(".text-indicator");
    // for(let indicator of indicators){
    //     indicator.innerText = value ? "Enabled" : "Disabled"
        
    // }

    const toggles = document.querySelectorAll(".toggle-btn");
    toggles.forEach((item, index) => {
        if(item.dataset.type === key){
            item.checked = value
        }
    })
    // document.querySelector("#enabled-indicator").innerText = _enabled ? "Enabled" : "Disabled"
    // document.querySelector(".toggle-timezonify-btn").checked = _enabled;

    // document.querySelectorAll("#autoHighlight-indicator").innerText

}


function onClickListener(){
    
    document.addEventListener("click", (e) => {

        function toggleTimezonify(){   
            setStorageValue("enabled", !enabled);
            enabled = !enabled;
            // updateIndicator(!enabled)
        }

        function toggleAutoHighlight(){
            setStorageValue("autoHighlight", !autoHighlight);
            autoHighlight = !autoHighlight
            // updateIndicator(!autoHighlight)
        }

        function reportError(error){
            console.error(`Could not timezonify: ${error}`);
        }
        if (e.target.classList.contains("toggle-timezonify-btn")){
            toggleTimezonify();
        } else if (e.target.classList.contains("toggle-autoHighlight-btn")){
            toggleAutoHighlight()
        }
    })
}

function reportScriptError(error){
    console.error(`Failed to execute timezonify content script: ${error.message}`);
}


(() => {
    init(); // init to be run everytime

    if(window.hasRun){
        return;
    }

    browser.tabs.executeScript({file: "/content_scripts/timezonify.js"})
    .then(onClickListener)
    .catch(reportScriptError)
    window.hasRun = true;
})()

