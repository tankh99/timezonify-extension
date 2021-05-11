// import fileReader from './file-reader'
// import timezones from '../timezones.json';

(() => {

    if(window.hasRun){
        return;
    }

    window.hasRun = true;


    browser.runtime.onMessage.addListener((message) => {
        if(message.command == "timezonify"){
            alert("Timezonifying!")
        } else if (message.command == "reset"){
            alert("Resetting!")
        }
    })

})()

var _timezones = []
function timezonifyReceiver(request, sender, sendResponse){
    const {timezones} = request;
    _timezones = timezones
    timezonify();
}

function timezonify() {
    const textContent = document.getSelection().toString();
    // const timezoneRegex = /(?<!\S)((1[0-2]|0?[0-9]):?([0-5]?[0-9]?)\s?([AaPp][Mm])|(2[0-3]|[0-1][0-9]):?([0-5][0-9]))\ *([A-Z]{2,4})(?!\S)/gm;
    const timezoneRegex = /(?<!\S)((1[0-2]|0?[0-9]):?([0-5]?[0-9]?)\s?([AaPp][Mm])|(2[0-3]|[0-1][0-9]):?([0-5][0-9]))\ *([A-Z]{2,4})/gm
    
    const matches = textContent.match(timezoneRegex); 
    // debugger
    const clientTimezone = getClientTimezone();
    const clientTimezoneData = findTimezoneDataFromTimezoneUtc(clientTimezone);
    

    if (matches) {
        for (let match of matches) {
            const matchGroups = [...match.matchAll(timezoneRegex)][0];
            const hour = matchGroups[2] ?? matchGroups[5];
            const minute = matchGroups[3] ?? matchGroups[6];
            const meridian = matchGroups[4];
            const timezone = matchGroups[7];
            const sourceTimezoneData = findTimezoneDataFromTimezone(timezone);
            if (sourceTimezoneData) {
                const {
                    hour: targetHour,
                    minute: targetMinute,
                    meridian: targetMeridian
                } = getOffsetTime(
                    hour,
                    minute,
                    sourceTimezoneData.offset,
                    clientTimezoneData.offset,
                    meridian
                );
                const targetTimeString =
                    targetHour +
                    ":" +
                    targetMinute +
                    targetMeridian +
                    " " +
                    clientTimezoneData.abbr;
                replaceSelectedText(match, targetTimeString)
                    
            }
      }
    }
  }

  function replaceSelectedText(regex, replacement){
    let sel, range, fragment;
    sel = window.getSelection();
    if(sel.getRangeAt && sel.rangeCount){
        
        const selText = sel.toString().replace(regex, replacement)
        console.log(selText)
        range = sel.getRangeAt(0)
        range.deleteContents();
        if(range.createContextualFragment){
            fragment = range.createContextualFragment(selText)
            console.log(fragment)
        } else {
            var div = document.createElement("div")
            div.innerHTML = html;
            fragment = document.createDocumentFragment();
            while (child = div.firstChild) {
                fragment.appendChild(child);
            }
        }
        var firstInsertedNode = fragment.firstChild;
        var lastInsertedNode = fragment.lastChild;
        range.insertNode(fragment);
        if (firstInsertedNode) {
            range.setStartBefore(firstInsertedNode);
            range.setEndAfter(lastInsertedNode);
        }
        sel.removeAllRanges();
        sel.addRange(range);
    }
  }
  
  function getClientTimezone() {
    // const offset = new Date().getTimezoneOffset() / 60;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone;
  }
  
  function findTimezoneDataFromTimezoneUtc(timezoneUtc) {
    return _timezones.find((timezone) => {
      const containsUtc =
        timezone.utc.filter((utc) => {
          return utc === timezoneUtc;
        }).length > 0;
      return containsUtc;
    });
  }
  
  function getOffsetTime(hour, minute, sourceOffset, clientOffset, meridian) {
    const { hour: cleanedClientOffset, minute: clientMinute } = cleanTimeOffset(
      clientOffset
    );
    const { hour: cleanedSourceOffset, minute: sourceMinute } = cleanTimeOffset(
      sourceOffset
    );
    // console.log(hour);
    // console.log(cleanedSourceOffset);
    // console.log(cleanedClientOffset);
    hour = hour - cleanedSourceOffset + cleanedClientOffset;
    minute = minute - sourceMinute + clientMinute;
    
  
    return formatTime(hour, minute, meridian, meridian == null);
  }
  
  function formatTime(hour, minute, meridian, is24hr) {
    if(is24hr){
  
      if (minute >= 60) {
        minute -= 60;
        hour += 1;
      } else if (minute < 0) {
        minute += 60;
        hour -= 1;
      }
  
      if(minute === 0){
        minute = "00"
      }
  
      if(hour > 24){
        hour -= 24;
      }
  
      if(hour < 10){
        hour = "0" + hour 
      }
  
      return {hour, minute, meridian: ""}
    }
  
    if (minute >= 60) {
        minute -= 60;
        hour += 1;
    } else if (minute < 0) {
        minute += 60;
        hour -= 1;
    }

    if(minute === 0){
        minute = "00"
    }

    if (hour > 12) {
        hour = hour - 12;
        meridian = meridian ? (meridian === "am" ? "pm" : "am") : "";
    }
    return { hour, minute, meridian };
    
  }
  
  function findTimezoneDataFromTimezone(timezone) {
    return _timezones.find((timezoneData) => timezoneData.abbr === timezone);
  }
  
  function cleanTimeOffset(offset) {
    let decimalPlace = offset % 1;
    let hour = offset - decimalPlace;
    return { hour, minute: decimalPlace * 60 };
  }

browser.runtime.onMessage.addListener(timezonifyReceiver)