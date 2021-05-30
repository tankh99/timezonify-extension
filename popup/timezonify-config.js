// import timezones from '../timezones.json'

// const src = browser.runtime.getURL("data/storage.js");
// const storage = await import(src);

window.browser = (function () {
    return window.msBrowser ||
      window.browser ||
      window.chrome;
  })();


function setStorageValue(key, value){
browser.storage.sync.set({[key]: value})
}

async function getStorageValue(key, cb){
    browser.storage.sync.get([key], (result) => {
        return cb(result[key])
    });
}

function getCurrentTab(){
    return browser.tabs.query({active: true, currentWindow: true})
}

var enabled; 
var autoHighlight;
var storage;

async function init(){
    getStorageValue("enabled", (_enabled) => {
        enabled = _enabled
        updateIndicator("enabled", _enabled)
    })


    getStorageValue("autoHighlight", (_autoHighlight) => {
        autoHighlight = _autoHighlight;
        updateIndicator("autoHighlight", _autoHighlight)
    })


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


// function onClickListener(){
    
// } 

function reportScriptError(error){
    console.error(`Failed to execute timezonify content script: ${error.message}`);
}


(() => {
    init(); // init to be run everytime

    if(window.hasRun){
        return;
    }

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
        
        if (e.target.classList.contains("toggle-timezonify-btn")){
            toggleTimezonify();
        } else if (e.target.classList.contains("toggle-autoHighlight-btn")){
            toggleAutoHighlight()
        }
    })
    // browser.tabs.executeScript({file: "/browser-polyfill.js"});
    // browser.tabs.executeScript({file: "/content_scripts/timezonify.js"})
    // .then(onClickListener)
    // .catch(reportScriptError)
    window.hasRun = true;
})()

