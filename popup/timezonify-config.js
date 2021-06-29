// import timezones from '../timezones.json'

// const src = browser.runtime.getURL("data/storage.js");
// const storage = await import(src);
var timezones;
var activeTab = ""
var utils;
// config values
var enabled; 
var autoHighlight;
var storage;

// function setStorageValue(key, value){
//     browser.storage.sync.set({[key]: value})
// }

// async function getStorageValue(key){
//     var gettingValue = await browser.storage.sync.get([key]);
//     return gettingValue && gettingValue[key]
// }

function getCurrentTab(){
    return browser.tabs.query({active: true, currentWindow: true})
}

async function init(){
    await importScripts();
    await fetchTimezones();
    updateClientTimezone();
    populateTimezoneSelect()
    updateTimezonifyButton();
}

async function updateTimezonifyButton(){
    utils.getBrowserTabs()
    .then(tabs => {
        browser.runtime.sendMessage({
            command: "get-state",
            tabId: tabs[0].id
        }).then((res) => {
            if(res) {
                console.log("Hydrating state")
                toggleTimezonifyButtonDisplay(true, res.oldHtml)
                
            }
        })

    })
}

async function updateConfigIndicators(){
    const _enabled = await utils.getStorageValue("enabled")
    const _autoHighlight = await utils.getStorageValue("autoHighlight");
    enabled = _enabled
    updateConfigSwitch("enabled", _enabled)
    autoHighlight = _autoHighlight;
    updateConfigSwitch("autoHighlight", _autoHighlight)
}

async function importScripts(){
    import("../utils/utils.js")
    .then((module) => {
        utils = module;
    })
}

async function fetchTimezones(){
    const dataUrl = browser.runtime.getURL("data/timezones.json");
    const _timezones = await(await fetch(dataUrl)).json()
    timezones = _timezones;
}

async function updateClientTimezone(){
    let localTimezoneHtml = document.querySelector("#local-timezone");
    const utc = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let localTimezone = await findTimezoneDataFromTimezoneUtc(utc)
    
    localTimezoneHtml.innerText = localTimezone.abbr;
}

function populateTimezoneSelect(){
    const timezoneDropdown = document.querySelector("#timezone-select");
    for(let timezone of timezones){
        timezoneDropdown.appendChild(new Option(timezone.text))
    }
}



async function findTimezoneDataFromTimezoneUtc(timezoneUtc) {
    return new Promise(resolve => {
        utils.getBrowserTabs()
        .then(tabs => {
            browser.tabs.sendMessage(tabs[0].id, {
                command: "find-timezone",
                data: timezoneUtc
            }, function(response) {
                resolve(response);
            })
        })
    })
  }

function convertTimezone(){
    console.log("converting!")
}

function updateConfigSwitch(key, value){
    const toggles = document.querySelectorAll(".toggle-btn");
    toggles.forEach((item, index) => {
        if(item.dataset.type === key){
            item.checked = value
        }
    })

}

async function toggleTimezonifyButtonDisplay(isTimezonified, oldHtml){
    
    utils.getBrowserTabs()
    .then((tabs) => {
        const state = {
            command: "save-state",
            state: {oldHtml},
            tabId: tabs[0].id,
            undo: !isTimezonified
        }
        browser.runtime.sendMessage(state)
    })
    const timezonifyBtn = document.querySelector(".timezonify-btn")
    const undoTimezonifyBtn = document.querySelector(".undo-timezonify-btn");
    
    if(isTimezonified){
        timezonifyBtn.classList.add("hide")
        undoTimezonifyBtn.classList.remove("hide")
    } else {
        timezonifyBtn.classList.remove("hide")
        undoTimezonifyBtn.classList.add("hide")
    }
}

(async() => {
    if(!window.hasRun) await init(); // run first before anything else, but only once
    updateConfigIndicators(); // to be run everytime

    if(window.hasRun){
        return;
    }
    
    document.addEventListener("click", (e) => {
        function toggleTimezonifyConfig(){   
            utils.setStorageValue("enabled", !enabled);
            enabled = !enabled;
            // updateIndicator(!enabled)
        }

        function toggleAutoHighlightConfig(){
            utils.setStorageValue("autoHighlight", !autoHighlight);
            autoHighlight = !autoHighlight
            // updateIndicator(!autoHighlight)
        }
        if(e.target.classList.contains("timezonify-btn")){
            
            utils.getBrowserTabs()
            .then((tabs) => {
                browser.tabs.sendMessage(tabs[0].id, {
                    command: "timezonify"
                }).then(({oldHtml}) => {
                    toggleTimezonifyButtonDisplay(true, oldHtml)
                })
            })
        } else if (e.target.classList.contains("undo-timezonify-btn")){
            utils.getBrowserTabs() 
            .then((tabs) => {
                browser.tabs.sendMessage(tabs[0].id, {
                    command: "undo-timezonify",
                    tabId: tabs[0].id
                }, () => {

                    toggleTimezonifyButtonDisplay(false)
                })
            })
        }else if (e.target.classList.contains("toggle-timezonify-btn")){
            toggleTimezonifyConfig();
        } else if (e.target.classList.contains("toggle-autoHighlight-btn")){
            toggleAutoHighlightConfig()
        } else if (e.target.classList.contains("tab")){
            const id = e.target.dataset.id;
            const allTabContent = document.querySelectorAll(".tab-content")
            const allTabs = document.querySelectorAll(".tab");
            for(let i = 0; i < allTabContent.length; i++){
                const tabContent = allTabContent[i];
                const tab = allTabs[i]
                if(tabContent.id == id){
                    tabContent.classList.remove("hide")
                    tab.classList.add("active-tab")
                    
                } else {
                    tabContent.classList.add("hide")
                    tab.classList.remove("active-tab")
                    
                }
            }
        } else if (e.target.classList.contains("convert-btn")){
            console.log("Triggering convert")
            const hour = document.querySelector("#hour-input").value;
            const timezone = document.querySelector("#timezone-select").value;
            console.log(hour);
        }
    })

    // browser.tabs.executeScript({file: "/content_scripts/timezonify.js"})
    // .then(onClickListener)
    // .catch(reportScriptError)
    window.hasRun = true;
})()

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

})
