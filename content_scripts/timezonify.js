
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
    // timezonify();
}

var prevRange = null;

function removePopovers(){
  const popovers = document.querySelectorAll(".timezonify-popover:not(.timezonify-time-popover)");
  console.log(popovers)
  for(let popover of popovers){
      popover.remove();
  }
}

function addPopover(range){
    const rect = range.getBoundingClientRect()
    const parentNode = getRangeParentNode(range);
    prevRange = range
    createTimezonifyPopover(parentNode, rect, range.toString())
}


document.onmouseup = async (e) => {
  console.log(e.target)
  if(e.target.classList.contains("timezonify-popover")) return;

  const dataUrl = browser.runtime.getURL("/data/timezones.json");
  _timezones = await(await fetch(dataUrl)).json()

  const sel = document.getSelection();
  const range = sel.getRangeAt(0)
  var regex = /(?<!\S)((1[0-2]|0?[0-9]):([0-5]?[0-9]?)([AaPp][Mm])|(2[0-3]|[0-1][0-9]):?([0-5][0-9]))\s?([A-Z]{2,4})/gm
  // if(e.target.classList.contains("timezonify-popover")) return;
  
  const popovers = document.querySelectorAll(".timezonify-popover:not(.timezonify-time-popover)");
  
  if(prevRange !== null && !checkSameRange(prevRange, range)){  // user selected different text
    removePopovers()
    if(!sel.isCollapsed && popovers.length < 1) addPopover(range) // user didn't just click away
  } else if(popovers.length < 1 && !sel.isCollapsed){
    addPopover(range)
  }
}


function checkSameRange(prevRange, newRange){
  if(prevRange !== null && 
    prevRange.startContainer.data === newRange.startContainer.data && 
    prevRange.startOffset === newRange.startOffset && 
    prevRange.endOffset === newRange.endOffset){
    return true;
  }
  return false;
}

function getRangeParentNode(range){
  const rangeNode = range.startContainer
  if(rangeNode.nodeType == Node.TEXT_NODE){
      return rangeNode.parentNode
  }
  return rangeNode.parentNode
}


function createTimezonifyPopover(parentNode, rect, text){
  let button = document.createElement("button");
  let textHeight = parseInt(window.getComputedStyle(parentNode).fontSize, 10)
  button.style.top = (rect.top > rect.height ? rect.top - (textHeight) - 6 : rect.top + textHeight + 3) + window.scrollY + "px";
  
  // button.style.top = rect.top - rect.height / 2 + "px"
  button.style.left = rect.left + window.scrollX + "px"
  button.style.position = "absolute";
  button.style.opacity = 0.7;
  button.style.backgroundColor = "black";
  button.style.color = "white";
  button.style.border = "none"
  button.style.borderRadius = 4 + "px"
  button.style.cursor = "pointer"
  button.style.padding = 4 + "px"
  button.style.userSelect = "none"
  button.style.zIndex = 9999;
  // button.style.fontSize = document.body.fontSize + "px"

  button.className = "timezonify-popover"
  button.innerText = "Timezonify";
  button.dataset.text = text;
  // button.dataset.parentID = sharedID
  button.onclick = (e) => {
      const timezonified = timezonify(text);
      if(!timezonified){
          console.error("Not a valid time")
          button.innerText = "Not a valid time"
          setTimeout(() => {
              e.target.parentNode.removeChild(e.target)
          }, 1500)
          return;
      } 
      button.classList.add("timezonify-time-popover")
      button.style.top = rect.top + "px"
      button.style.left = rect.left + "px"
      button.style.opacity = 1;
      button.innerText = timezonified;
  }

  button.ondblclick = (e) => {
    e.target.parentNode.removeChild(e.target)
  }
  
  // parentNode.style.position = "relative"
  // parentNode.id = sharedID
  document.body.append(button)
}

function createTimePopover(parentNode, rect, replacement){
  let button = document.createElement("button");
  button.style.top = rect.top > rect.height ? (rect.top - rect.height - 6 + "px") : (rect.top + rect.height + 3 + "px");
  button.style.left = rect.left + "px"
  
  button.className = "timezonify-time-popover"
  button.innerText = replacement;
  // button.onclick = (e) => {
  //     createTimePopover(parentNode, rect, timezonified)
  // }
  parentNode.style.position = "unset"
  parentNode.append(button)
}


function timezonify(text){
  var regex = /\s?((1[0-2]|0?[0-9]):([0-5]?[0-9]?)\s?([AaPp][Mm])|(2[0-3]|[0-1][0-9]):?([0-5][0-9]))\s+([A-Z]{2,4})/gm            
  const replacement = replaceTime(text, regex)
  return replacement
}

function replaceTime(text, regex){
  const matches = text.match(regex)
  if(matches){
      for(let match of matches){
          const convertedTime = convertTime(regex, match)
          return convertedTime
      }
  }
}

function convertTime(regex, string){

  const groups = regex.exec(string);
  const hour = groups[2] ?? groups[5];
  const minute = groups[3] ?? groups[6];
  const meridian = groups[4];
  const timezone = groups[7];
  const sourceTimezoneData = findTimezoneDataFromTimezone(timezone);
  const clientTimezoneData = getClientTimezoneData();
  // console.log(clientTimezoneData)
  if(sourceTimezoneData){
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
      return targetTimeString   
  } else {
      console.error(`Exception: ${timezone} is not a timezone!`)
      throw `Exception: ${timezone} is not a timezone!`
  }
          
}

  
  function getClientTimezoneData() {
    // const offset = new Date().getTimezoneOffset() / 60;
    const utc = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneData = findTimezoneDataFromTimezoneUtc(utc)
    return timezoneData;
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