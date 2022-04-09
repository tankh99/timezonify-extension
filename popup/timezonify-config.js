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
var countries;

async function importScripts(){
    return new Promise((resolve) => {

        import("../utils/utils.js")
        .then((module) => {
            utils = module;
            resolve()
        })
    })
}

function test(){
    // console.log(time.format())
}

async function init(){

//   const timezones = await browser.runtime.sendMessage({
//     command: "get-timezones"
//   })
    await importScripts();
    await getTimezones();
    await getCountries()
    updateFormValues();
    initClientTimezone();
    initTimezoneSelect();
    initTimeInput()
    updateTimezonifyButton();
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


async function getTimezones(){
    let _timezones = await utils.getTimezonesData()
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

async function getCountries(){
    let _countries = await utils.getCountriesData()
    countries = _countries

}


async function initClientTimezone(){
    utils.getState()
    .then(async(state) => {
        let localTimezone = state ? state.clientTimezone : null;
        
        const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if(!state || !state.clientTimezone){ // initializing timezone. 
            localTimezone = await findTimezoneDataFromTimezoneName(timezoneName)
            utils.setState({clientTimezone: localTimezone})
        }
        clientTimezone = localTimezone
        const clientTime = moment().tz(clientTimezone.timezones[0]).format("h:mm A")
        
        $("#from-timezone").val(clientTimezone.timezones[0]).trigger("change")
        $("#from-time-input").val(clientTime)
    })
    
}

function getFormattedTimeFromInput($element){
    const timepicker = $element.timepicker()
    const formattedTime = timepicker.format(timepicker.getTime(), "HH:mm")
    return formattedTime
}

function updateCorrespondingTimeInputValues($timeInput, time){
    const timezone = $(`#${$timeInput.data("timezone")}`).val()
    const correspondingTimezone = $(`#${$timeInput.data("corresponding-name")}zone`).val()
    const correspondingTimeInput = $(`#${$timeInput.data("corresponding-name")}-input`)
    if(correspondingTimezone && time){
        const convertedTime = convertTime(time, timezone, correspondingTimezone)
        correspondingTimeInput.val(convertedTime)
    }

    
}

function initTimeInput(){
    $(".time-input").each((index, input) => {
        const timeInput = $(input)
        timeInput.timepicker({
            timeFormat: "h:mm p",
            change: (time) => {
                utils.setState({
                    fromTimeValue: time
                })
                const formattedTime = getFormattedTimeFromInput(timeInput)
                console.log(formattedTime)
                updateCorrespondingTimeInputValues(timeInput, formattedTime)
            }, 
        })
        $(timeInput).on("focus", (e) => {
            $(e.target).select()
        })
    })
}

function initTimezoneSelect(){
    $(document).on("select2:open", () => {
        document.querySelector(".select2-search__field").focus()
    })
    
    $(".timezone-select").each((index, dropdown) => {
        const timezoneDropdown = $(dropdown)
        timezoneDropdown.select2({
            width: "50%",
            placeholder: "Select Country",
            dropdownCssClass: "select2-typography",
            selectionCssClass: "select2-typography select2-selection"
        })
        for (let country of countries){
            const option = new Option(country.name, `${country.timezones[0]}`, false, false)
            timezoneDropdown.append(option)
        }
        timezoneDropdown.on("input", (e) => {
            const timezoneId = timezoneDropdown.attr("id")
            const oppositeTimeInput = $(`#${timezoneDropdown.data("opposite-name")}-input`)
            const oppositeTimezoneSelect = $(`#${timezoneDropdown.data("opposite-name")}zone`)
            const correspondingTimeInput = $(`#${timezoneDropdown.data("name")}-input`)
            utils.setState({
                [timezoneId]: e.target.value
            })
            
            if(oppositeTimeInput.val()){
                const formattedTime = getFormattedTimeFromInput(oppositeTimeInput)
                console.log("formattedTime", formattedTime)
                const toTime = convertTime(formattedTime, timezoneDropdown.val(), e.target.value)
                console.log("to time", toTime)
                updateCorrespondingTimeInputValues(oppositeTimeInput, formattedTime)
                // correspondingTimeInput.val(toTime)
                // if(timezoneId == "from-timezone") {
                //     console.log("triggering change for", correspondingTimeInput)
                //     correspondingTimeInput.trigger("change")
                // }
            }
        })
        timezoneDropdown.val("").trigger("change")
    })
    
}

function convertTime(fromTimeValue, fromTimezone, toTimezone){
    const timeData = fromTimeValue.split(":")
    const hours = timeData[0]
    const minutes = timeData[1]
    let fromDate = moment.tz(fromTimezone)
    fromDate.hours(hours)
    fromDate.minutes(minutes)
    const toValue = fromDate.tz(toTimezone).format("h:mm A")
    return toValue
}

async function findTimezoneDataFromTimezoneName(timezoneUtc) {
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
    const fromTimeInput = $("#from-time-input")
    const toTimeInput = $("#to-time-input")
    const fromTimezoneSelect = $("#from-timezone");
    const toTimezoneSelect = $("#to-timezone");



    utils.getState()
    .then((state) => {
        if(state) {
            fromTimeInput.val(state.fromTimeValue)
            toTimeInput.val(state.toTimeValue)
            fromTimezoneSelect.val(state.fromTimezone ?? fromTimezoneSelect[0].value).trigger("change")
            toTimezoneSelect.val(state.toTimezone ?? toTimezoneSelect[0].value).trigger("change")
        } 
    })
    
}


var initialized = false;

// $(".timezone-select").on("change", (e) => {
//     console.log(e.target.value)
// })

$(document).ready(async () => {

    await init(); // run first before anything else, but only once
    // updateConfigIndicators(); // to be run everytime
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
        } else if (e.target.classList.contains("tab")){ // DEPRECATED CODE for multiple tabs in the popup
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
            const value = document.querySelector("#timezone-select").value;
            // const time = moment.tz(new Date(), clientTimezone.utc[0])
            // console.log(moment.tz.zonesForCountry(value))
            const fromTime = document.querySelector("#from-time-input").value
            console.log(fromTime)
            const timezone = utils.getTimezoneFromCountry(value)
            const fromDate = moment(fromTime, "HH:mm")
            console.log(timezone)

            console.log(fromDate.format())
            const toDate = fromDate.tz(timezone)
            console.log(toDate.format())
            const result = document.querySelector("#to-time-input");
            result.value = toDate.format("HH:mm")
            // const time = document.querySelector("#from-time-input").value; // returns 24hr value
            // const timezoneValue = document.querySelector("#timezone-select").value;
            // const offset = timezoneValue.split("/")[0]
            // // console.log(document.querySelector("#timezone-select").text())
            // const result = document.querySelector("#converted-result");
            // let convertedTime;
            // if(time){

            //     // let {hour, minute, meridian} = utils.formatTime(time)
            //     let hour = parseInt(time.split(":")[0])
            //     let minute = parseInt(time.split(":")[1])
            //     let meridian = "am";
            //     if(hour >= 12){ // convert to 12-hour format
            //         meridian = "pm";
            //         hour -= 12
            //     }
            //     const {hour: hourOffset, minute: minuteOffset} = utils.cleanTimeOffset(offset)
            //     const {hour: clientHourOffset, minute: clientMinuteOffset} = utils.cleanTimeOffset(clientTimezone.offset)
            //     // if client hour offset is less than target hour offset, minus it from the hour. Basically, subtract the smaller offset from the hour
            //     hour = clientHourOffset < hourOffset ? hour - clientHourOffset + hourOffset : hour - hourOffset + clientHourOffset;
            //     // opposite to the above: subtract the greater minute offset from the minute
            //     minute = clientMinuteOffset < minuteOffset ? minute - minuteOffset + clientMinuteOffset : minute - clientMinuteOffset + minuteOffset;
            //     let {hour:formattedHour, minute: formattedMinute, meridian:formattedMeridian} = utils.formatTime(hour, minute, meridian)
            //     if(formattedHour < 0){
            //         formattedHour *= -1;
            //         formattedMeridian = formattedMeridian == "am" ? "pm" : "am";
            //     } 
            //     convertedTime = `${formattedHour}:${formattedMinute}${formattedMeridian} ${clientTimezone.abbr}`
            //     result.innerText = convertedTime
            // } 
            // utils.setState({
            //     time, 
            //     timezone: timezoneValue, 
            //     convertedTime
            // })
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
})