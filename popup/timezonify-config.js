// import timezones from '../timezones.json'

// const src = browser.runtime.getURL("data/storage.js");
// const storage = await import(src);
var timezones;
var activeTab = ""
var clientTimezone;
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
    // document.querySelector("#timezone-select").select2();
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
    utils.getState()
    .then(async(state) => {
        console.log(state);
        let localTimezoneHtml = document.querySelector("#local-timezone");
        let localTimezone = state ? state.clientTimezone : null;
        if(!state || !state.clientTimezone){
            const utc = Intl.DateTimeFormat().resolvedOptions().timeZone;
            localTimezone = await findTimezoneDataFromTimezoneUtc(utc)
            utils.setState({clientTimezone: localTimezone})
        }
        localTimezoneHtml.innerText = localTimezone.abbr;
        clientTimezone = localTimezone
    })
    
}

function populateTimezoneSelect(){
    const timezoneDropdown = document.querySelector("#timezone-select");
    for(let timezone of timezones){
        timezoneDropdown.appendChild(new Option(`${timezone.value} (${timezone.abbr})`, timezone.offset))
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
                return resolve(response);
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
            command: "set-state",
            state: {oldHtml, undo: !isTimezonified},
            tabId: tabs[0].id
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
    await init(); // run first before anything else, but only once
    updateConfigIndicators(); // to be run everytime

    document.querySelector("#time-input").addEventListener("onchange", (e) => {
        console.log(e.target.value)
    })
    
    document.querySelector("#timezone-select").addEventListener("change", (e) => {
        console.log(e.target.value)
    })
    
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
            const time = document.querySelector("#time-input").value; // returns 24hr value
            const result = document.querySelector("#converted-result")
            if(time){
                const offset = document.querySelector("#timezone-select").value;
                let hour = parseInt(time.split(":")[0])
                let minute = parseInt(time.split(":")[1])
                let meridian = "am";
                if(hour >= 12){ // convert to 12-hour format
                    meridian = "pm";
                    hour -= 12
                }
                const {hour: hourOffset, minute: minuteOffset} = utils.cleanTimeOffset(offset)
                const {hour: clientHourOffset, minute: clientMinuteOffset} = utils.cleanTimeOffset(clientTimezone.offset)
                hour = hour - hourOffset + clientHourOffset;
                minute = minute - minuteOffset + clientMinuteOffset;
                let {hour:formattedHour, minute: formattedMinute, meridian:formattedMeridian} = utils.formatTime(hour, minute, meridian)
                if(formattedHour < 0){
                    formattedHour *= -1;
                    formattedMeridian = formattedMeridian == "am" ? "pm" : "am";
                } 
                result.innerText = `${formattedHour}:${formattedMinute}${formattedMeridian}`
            } 
            // {
                // result.innerHtml = `<span class="error">Time is invalid</span>` // innerHTML doesn't work!
                // result.innerText = "Time is invalid"
            // }
        }
    })

    // browser.tabs.executeScript({file: "/content_scripts/timezonify.js"})
    // .then(onClickListener)
    // .catch(reportScriptError)
    window.hasRun = true;
})()
