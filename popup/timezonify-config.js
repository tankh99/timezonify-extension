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

function setLoading(loading){
    
}

async function init(){

    
    var parentElement = $(".asdf");
    $(".js-example-basic-single").select2({
        dropdownParent: parentElement
    });
    await importScripts();
    await getTimezones();
    await getCountries()
    initTimezoneSelect();
    initTimeInput()
    initClientTimezone();
    updateFormValues();
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
        // const clientTime = moment().tz(timezoneName).format("h:mm A")
        // const clientDate = moment().tz(clientTimezone.timezones[0]).format("ddd, MMM Do")
        const [clientTime, clientDate] = convertTime(new Date(), timezoneName, timezoneName)
        console.log(clientTime)
        $("#from-timezone").val(clientTimezone.timezones[0]).trigger("change")
        $("#from-time-input").val(clientTime)
        $("#from-date").text(clientDate)
    })
    
}

function getFormattedTimeFromInput($element){
    const timepicker = $element.timepicker()
    const formattedTime = timepicker.format(timepicker.getTime(), "HH:mm")
    return formattedTime
}

function updateOppositeDatetimeValues($timeInput, fromTime){
    const timezone = $(`#${$timeInput.data("timezone")}`).val()
    const oppositeId = $timeInput.data("opposite-id")
    const id = $timeInput.data("id")
    const oppositeTimezone = $(`#${oppositeId}-timezone`).val()
    const oppositeTimeInput = $(`#${oppositeId}-time-input`)
    const oppositeDate = $(`#${oppositeId}-date`)
    const correspondingDate = $(`#${id}-date`)
    
    if(oppositeTimezone && fromTime){
        const [convertedTime, convertedDate, fromDate] = convertTime(fromTime, timezone, oppositeTimezone, $timeInput.attr("id") == "from-time-input")
        
        console.log("convertedDate", convertedDate)
        console.log("convertedTime", convertedTime)
        console.log("fromDate", fromDate)
        oppositeTimeInput.val(convertedTime)
        oppositeDate.text(convertedDate)
        correspondingDate.text(fromDate)
    }
}

function initTimeInput(){
    $(".time-input").each((index, input) => {
        const $timeInput = $(input)
        $timeInput.timepicker({
            timeFormat: "h:mm p",
            change: (time) => {
                if(typeof time === "object"){

                    // if(typeof time === "Date")
                    utils.setState({
                        [$timeInput.attr("id")]: time
                    })
                    const formattedFromTime = getFormattedTimeFromInput($timeInput)
                    updateOppositeDatetimeValues($timeInput, formattedFromTime)
                } else {
                    // Usually only triggers if the user leaves the input blank or entered a string instead of time
                    console.error("Time is not in a proper format", time)
                }
            }, 
        })
        $($timeInput).on("focus dblclick", (e) => {
            $(e.target).select()
        })

    })
}

function customMatcher(params, data){
     // If there are no search terms, return all of the data
     if ($.trim(params.term) === '') {
        return data;
      }
  
      // Do not display the item if there is no 'text' property
      if (typeof data.text === 'undefined') {
        return null;
      }
  
      // `params.term` should be the term that is used for searching
      // `data.text` is the text that is displayed for the data object
      if (data.text.indexOf(params.term) > -1) {
        var modifiedData = $.extend({}, data, true);
        modifiedData.text += ' (matched)';
  
        // You can return modified objects from here
        // This includes matching the `children` how you want in nested data sets
        return modifiedData;
      }
  
      // Return `null` if the term should not be displayed
      return null;
}

function initTimezoneSelect(){
    $(document).on("select2:open", () => {
        $(".select2-search__field").select()
        // $(this).select2("positionDropdown", true)
    })
    
    $(".timezone-select").each((index, dropdown) => {
        const timezoneDropdown = $(dropdown)
        timezoneDropdown.select2({
            width: "50%",
            placeholder: "Select Country",
            dropdownCssClass: "select2-typography",
            selectionCssClass: "select2-typography select2-selection",
            // dropdownParent: $("#main-content")
        })
        for (let country of countries){
            const option = new Option(country.name, `${country.timezones[0]}`, false, false)
            timezoneDropdown.append(option)
        }
        timezoneDropdown.on("input", (e) => {
            const timezoneId = timezoneDropdown.attr("id")
            const oppositeTimeInput = $(`#${timezoneDropdown.data("opposite-name")}-input`)
            const oppositeTimezoneSelect = $(`#${timezoneDropdown.data("opposite-name")}zone`)
            const correspondingTimeInput = $(`#${timezoneDropdown.data("id")}-time-input`)
            
            if(oppositeTimeInput.val()){
                const formattedTime = getFormattedTimeFromInput(oppositeTimeInput)
                // const [toTime, toDate] = convertTime(formattedTime, timezoneDropdown.val(), e.target.value)
                
                updateOppositeDatetimeValues(oppositeTimeInput, formattedTime)
                
            }

            utils.setState({
                [timezoneId]: e.target.value,
                // [correspondingTimeInput.attr("id")]: correspondingTimeInput.val()
            })
        })
        timezoneDropdown.val("").trigger("change")
    })
    
}

// isFrom is only true if the timezoneSelect or the timeInput corresponds to the from date & time 
// fromTime
function convertTime(fromTimeValue, fromTimezone, toTimezone, isFrom=false){
    let rawToDate;
    let fromDate;

    if(typeof fromTimeValue == "string"){
        const timeData = fromTimeValue.split(":")
        const hours = timeData[0]
        const minutes = timeData[1]
        console.log("hours", hours, "minutes", minutes)
        fromDate = moment.tz(fromTimezone)
        fromDate.hours(hours)
        fromDate.minutes(minutes)
    } else {
        fromDate = moment(fromTimeValue)
    }

    rawToDate = fromDate.clone().tz(toTimezone) // important to clone(), otherwise fromDate will be converted into the toTimezone
    
    // console.log("fromdate", fromDate)
    // console.log("fromtimevalue", fromTimeValue)
    if(!isFrom){ // Triggers only when the isFrom variable is false. Corrects the from date, os that it is always the current date
        
        if(rawToDate.date() < moment().date()){
            rawToDate.add(1, "days")
        } else if (rawToDate.date() > moment().date()){
            rawToDate.subtract(1, "days")
            fromDate.subtract(1, "days")
        } 
    }
    // if(rawToDate.days())
    const toTime = rawToDate.format("h:mm A")
    const toDate = rawToDate.format("ddd, Do MMM")
    const formattedFromDate = fromDate.format("ddd, Do MMM")
    return [toTime, toDate, formattedFromDate]
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
            // toTimeInput.val(state[toTimeInput.attr("id")])
            console.log(state)
            fromTimezoneSelect.val(state[fromTimezoneSelect.attr("id")] ?? fromTimezoneSelect[0].value).trigger("change")
            toTimezoneSelect.val(state[toTimezoneSelect.attr("id")] ?? toTimezoneSelect[0].value).trigger("change")
            if(state[fromTimeInput.attr("id")]){ // To update from-time-input if user previously updated its values
                const formattedTime = moment(state[fromTimeInput.attr("id")]).format("h:mm A")
                fromTimeInput.val(formattedTime)
            } 
            // if(state[toTimeInput.attr("id")]){
            //     const formattedTime = moment(state[toTimeInput.attr("id")]).format("h:mm A")
            //     toTimeInput.val(formattedTime)
            // }
            // else if (state[toTimeInput].attr("id")){
            //     const formattedTime = moment(state[toTimeInput.attr("id")]).format("hh:mm A")
            //     toTimeInput.val(formattedTime)
            // }
            
            // if(toTimezoneSelect.val()){ // Updates to-time-input and to-date if there is a to-timezone value saved in state
            //     console.log("frmotimeinput.val", fromTimeInput.val())
            //     const formattedTime = getFormattedTimeFromInput(fromTimeInput)
            //     const [toTime, toDate] = convertTime(formattedTime, fromTimezoneSelect.val(), toTimezoneSelect.val(), true)
            //     toTimeInput.val(toTime)
            //     $("#to-date").text(toDate)
            //     // updateOppositeDatetimeValues(toTimeInput, toTime)
            // }

            
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

    // Swap Function
    $("#swap-btn").on("click", (e) => {
        const fromTimeInput = $("#from-time-input")
        const fromTimezoneSelect = $("#from-timezone");
        const fromDateText = $("#from-date");
        const toTimeInput = $("#to-time-input")
        const toTimezoneSelect = $("#to-timezone");
        const toDateText = $("#to-date");

        const fromTimeInputVal = fromTimeInput.val()
        const fromTimezoneSelectVal = fromTimezoneSelect.val()
        const fromDateVal = fromDateText.text()

        const toTimeInputVal = toTimeInput.val()
        const toTimezoneSelectVal = toTimezoneSelect.val()
        const toDateVal = toDateText.text()
        
        let fromTime = fromTimeInputVal
        let fromDate = fromDateVal
        let toTime = toTimeInputVal
        let toDate = toDateVal

        // if(fromTimeInputVal && fromTimezoneSelectVal){
        //     [fromTime, fromDate] = convertTime(getFormattedTimeFromInput(fromTimeInput), fromTimezoneSelectVal, toTimezoneSelectVal)
        // }

        // let toTime, toDate;
        // if(toTimeInputVal && toTimezoneSelectVal){
        //     [toTime, toDate] = convertTime(getFormattedTimeFromInput(toTimeInput), toTimezoneSelectVal, fromTimezoneSelectVal)
        // }

        console.log("fromTime", fromTime)
        console.log("toTime", toTime)
        toTimezoneSelect.val(fromTimezoneSelectVal).trigger("change")
        toTimeInput.val(fromTime)
        toDateText.text(fromDate)

        fromTimezoneSelect.val(toTimezoneSelectVal).trigger("change")
        fromTimeInput.val(toTime)
        fromDateText.text(toDate)
        // const currentDate = moment().format("ddd, MMM Do") // Avoids the standard swap because we always want to From date to be the date today
        // fromDate.text(currentDate)
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