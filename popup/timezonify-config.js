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


async function importScripts(){
    return new Promise((resolve) => {

        import("../utils/utils.js")
        .then((module) => {
            utils = module;
            resolve()
        })
    })
}

async function init(){

//   const timezones = await browser.runtime.sendMessage({
//     command: "get-timezones"
//   })
//   console.log(timezones)
    await importScripts();
    await fetchTimezones();
    updateClientTimezone();
    populateTimezoneSelect()
    updateTimezonifyButton();
    updateFormValues();
    initialized = true;
    // document.querySelector("#timezone-select").select2(); // doesn't work because web extension doesn't support importing of external libraries?!
}

var lastLoadValue = 0;

async function updateTimezonifyButton(){
    utils.getState()
    .then((state) => {
        if(state) {
            toggleTimezonifyButtonDisplay(state.oldHtml != null, state.oldHtml)
        }
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


async function fetchTimezones(){
    let _timezones = await utils.fetchTimezonesData()
    _timezones = _timezones.sort((a, b) => {
        if(a.value < b.value){
            return -1
        }
        if(a.value > b.value){
            return 1
        }
        return 0
    })
    timezones = _timezones;
}

async function updateClientTimezone(){
    utils.getState()
    .then(async(state) => {
        let localTimezoneHtml = document.querySelector("#local-timezone");
        let localTimezone = state ? state.clientTimezone : null;
        
        if(!state || !state.clientTimezone){ // initializing timezone. 
            const utc = Intl.DateTimeFormat().resolvedOptions().timeZone;
            localTimezone = await findTimezoneDataFromTimezoneUtc(utc)
            console.log(localTimezone)
            utils.setState({clientTimezone: localTimezone})
        }
        localTimezoneHtml.innerText = localTimezone.abbr;
        clientTimezone = localTimezone
    })
    
}

function populateTimezoneSelect(){
    const timezoneDropdown = document.querySelector("#timezone-select");
    for(let timezone of timezones){
        timezoneDropdown.appendChild(new Option(`${timezone.value} (${timezone.abbr})`, `${timezone.offset}/${timezone.abbr}`))
    }
}



async function findTimezoneDataFromTimezoneUtc(timezoneUtc) {
    const timezone = await browser.runtime.sendMessage({
        command: "get-timezone-by-utc",
        timezoneUtc: timezoneUtc
    })
    return timezone
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
    utils.setState({
        oldHtml, 
        undo: !isTimezonified
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


function updateFormValues(){
    const timeInput = document.querySelector("#time-input")
    const timezoneSelect = document.querySelector("#timezone-select");
    const convertedResult = document.querySelector("#converted-result")

    utils.getState()
    .then((state) => {
        if(state) {
            timeInput.value = state.timeValue
            timezoneSelect.value = state.timezoneValue ?? timezoneSelect[0].value
            convertedResult.textContent = state.convertedTime
        }
    })
    
    if(!initialized){
        timeInput.addEventListener("input", (e) => {
            utils.setState({
                timeValue: e.target.value
            })
        })

        timezoneSelect.addEventListener("input", (e) => {
            utils.setState({
                timezoneValue: e.target.value
            })
        })
    }
}


var initialized = false;
(async() => {
    await init(); // run first before anything else, but only once
    updateConfigIndicators(); // to be run everytime
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
                }).then(() => {
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
            const timezoneValue = document.querySelector("#timezone-select").value;
            const offset = timezoneValue.split("/")[0]
            // console.log(document.querySelector("#timezone-select").text())
            const result = document.querySelector("#converted-result");
            let convertedTime;
            if(time){

                // let {hour, minute, meridian} = utils.formatTime(time)
                let hour = parseInt(time.split(":")[0])
                let minute = parseInt(time.split(":")[1])
                let meridian = "am";
                if(hour >= 12){ // convert to 12-hour format
                    meridian = "pm";
                    hour -= 12
                }
                const {hour: hourOffset, minute: minuteOffset} = utils.cleanTimeOffset(offset)
                const {hour: clientHourOffset, minute: clientMinuteOffset} = utils.cleanTimeOffset(clientTimezone.offset)
                // if client hour offset is less than target hour offset, minus it from the hour. Basically, subtract the smaller offset from the hour
                hour = clientHourOffset < hourOffset ? hour - clientHourOffset + hourOffset : hour - hourOffset + clientHourOffset;
                // opposite to the above: subtract the greater minute offset from the minute
                minute = clientMinuteOffset < minuteOffset ? minute - minuteOffset + clientMinuteOffset : minute - clientMinuteOffset + minuteOffset;
                let {hour:formattedHour, minute: formattedMinute, meridian:formattedMeridian} = utils.formatTime(hour, minute, meridian)
                if(formattedHour < 0){
                    formattedHour *= -1;
                    formattedMeridian = formattedMeridian == "am" ? "pm" : "am";
                } 
                convertedTime = `${formattedHour}:${formattedMinute}${formattedMeridian} ${clientTimezone.abbr}`
                result.innerText = convertedTime
            } 
            utils.setState({
                time, 
                timezone: timezoneValue, 
                convertedTime
            })
            // {
                // result.innerHtml = `<span class="error">Time is invalid</span>` // innerHTML doesn't work!
                // result.innerText = "Time is invalid"
            // }
        }
    })


    browser.runtime.onMessage.addListener((message) => {
        if(message.command == "switch-tab"){
            updateFormValues();
        }
    })
    window.hasRun = true;
})()