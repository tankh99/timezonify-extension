var enabled;
var autoHighlight;
var regex = /(<.*>)?((1[0-2]|0?[0-9]):([0-5]?[0-9]?)(<\/.*>)?\s?(<.*>)?([AaPp][Mm])(<\/.*>)?|(<.*>)?(2[0-3]|[0-1][0-9]):?([0-5][0-9])(<\/.*>)?)\s+(<.*>)?([A-Z]{2,4})(<\/.*>)?/gm
var utils;
var oldHtml;



function setStorageValue(key, value){
  browser.storage.sync.set({[key]: value})
}

async function getStorageValue(key){
  var gettingValue = await browser.storage.sync.get([key]);
  return gettingValue && gettingValue[key]
}

async function importScripts(){ // so far only imports 1 script: utils.js (helps out with code reusability)
  return new Promise((resolve) => {

    import("../utils/utils.js")
    .then((module) => {
        utils = module;
        resolve()
    })
    // import(browser.runtime.getURL("utils/utils.js"))
    // .then((module) => {
    //   utils = module;
    //   resolve()
    // })
  })
}



var _timezones = []
var prevRange = null;

function removePopovers(){
  const popovers = document.querySelectorAll(".timezonify-popover:not(.timezonify-time-popover)");
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
  let fontSize = parseInt(window.getComputedStyle(parentNode).fontSize, 10)
  let padding = 4
  // let lineHeight = window.getComputedStyle(parentNode).lineHeight === "normal" ? textHeight * 1.2 : parseInt(window.getComputedStyle(parentNode).lineHeight, 10)
  button.style.top = (rect.top > rect.height ? (rect.top - fontSize - 12) : (rect.top + rect.height)) + window.scrollY + "px";
  button.style.left = rect.left + window.scrollX + "px"
  button.style.position = "absolute";
  button.style.backgroundColor = "rgba(0,0,0,0.7)";
  
  button.style.color = "white";
  button.style.border = "none"
  button.style.borderRadius = 4 + "px"
  button.style.cursor = "pointer"
  button.style.padding = padding + "px"
  button.style.userSelect = "none"
  button.style.zIndex = 9999;
  // button.style.whiteSpace = "nowrap"
  button.style.wordBreak = "break-word"
  button.style.fontSize = fontSize + "px"

  button.className = "timezonify-popover"
  button.innerText = "Timezonify";
  // button.dataset.parentID = sharedID
  button.onclick = (e) => {
    try{

      const timezonified = timezonify(text);
      if(!timezonified){
          console.error("Not a valid time")
          button.innerText = "Not a valid time"
          setTimeout(() => {
            if(e.target.parentNode) e.target.parentNode.removeChild(e.target)
          }, 1500)
          return;
      } 
      padding = 3
      // const clientTimezoneData = getClientTimezoneData();
      const targetTimezone = "PT"
      const clientTimezone = "MPST"
      const lengthDiff = clientTimezone.length - targetTimezone.length > 0 ? clientTimezone.length - targetTimezone.length : 0
      button.innerText = timezonified;
      button.classList.add("timezonify-time-popover")
      button.style.color = "white"
      button.style.backgroundColor = "black";
      button.style.textAlign = "left"
      button.style.display = "flex"
      button.style.alignItems = "center"
      button.style.justifyContent = "center";
      button.style.padding = padding + "px";
      button.style.top = rect.top + window.scrollY - padding + "px"
      button.style.left = rect.left + window.scrollX - padding + "px"
      button.style.minHeight = rect.height + padding * 2 + "px";

      button.style.minWidth = rect.width + padding * 2 + "px";
      button.style.fontSize = (fontSize) + "px"; //

      // button.style.width = (fontSize <= 10 ? rect.width + fontSize: rect.width) + 1 / fontSize  * lengthDiff + "px";
      // button.style.fontSize = (fontSize > 14 ? fontSize - padding : fontSize) + "px"; // to compensate for the box size
      
      // console.log(JSON.stringify(button.clientWidth))
      // console.log(JSON.stringify(button.offsetWidth))
      // console.log(JSON.stringify(button.scrollWidth))
    } catch (ex){
      console.error(ex)
      button.innerText = ex
      setTimeout(() => {
          e.target.parentNode.removeChild(e.target)
      }, 1500)
    }
  }

  button.ondblclick = (e) => {
    e.target.parentNode.removeChild(e.target)
  }
  
  // parentNode.style.position = "relative"
  // parentNode.id = sharedID
  document.body.append(button)
}

function timezonify(text){
  const replacement = replaceTime(text)
  return replacement
}

function replaceTime(text){
  const matches = text.match(regex)
  if(matches){
    const groups = regex.exec(text)
    const convertedTime = convertTime(groups)
    return convertedTime;
  }
}

function convertTime(groups){
  const hour = groups[3] ?? groups[10];
  const minute = groups[4] ?? groups[11];
  const meridian = groups[7]
  const timezone = groups[14];
  const sourceTimezoneData = findTimezoneDataFromTimezone(timezone);
  const clientTimezoneData = getClientTimezoneData();
  
  

  if(sourceTimezoneData){
      const {
          hour: targetHour,
          minute: targetMinute,
          meridian: targetMeridian
      } = utils.getOffsetTime(
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
      throw `${timezone} is not a timezone!`
  }
          
}

  
  function getClientTimezoneData() {
    // const offset = new Date().getTimezoneOffset() / 60;
    const utc = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneData = findTimezoneDataFromTimezoneName(utc)
    return timezoneData;
  }
  
  function findTimezoneDataFromTimezone(timezone) {
    return _timezones.find((timezoneData) => {
      return timezoneData.abbr === timezone || (timezoneData.aliases && timezoneData.aliases.includes(timezone))
    });
  }
  
  function findTimezoneDataFromTimezoneName(timezoneUtc) {
    return _timezones.find((timezone) => {
      const containsUtc =
        timezone.utc.filter((utc) => {
          return utc === timezoneUtc;
        }).length > 0;
      return containsUtc;
    });
  }
  
  // 
  

  function iterateThroughNode(node, regex){
    let indexes = []
    if(node.nodeType == Node.TEXT_NODE){
        const results = []
        while(match = regex.exec(node.textContent)){
            if(match && match.length > 0){
                results.push({node: node, index: match.index, value: match[0]})
            } 
        }
        return results;
    }
    node.childNodes.forEach((item, index) => {
        const result = (iterateThroughNode(item, regex))
        if(result){
            indexes = indexes.concat(result)
        }
    })
    return indexes;
}

document.onmouseup = async (e) => {
  if(enabled){
    if(e.target.classList.contains("timezonify-popover")) return;
    const sel = document.getSelection();
    let autoHighlightFound = false;
    if(sel.isCollapsed) return removePopovers();

    let range = sel.getRangeAt(0)
    const popovers = document.querySelectorAll(".timezonify-popover:not(.timezonify-time-popover)");
    if(autoHighlight && range.toString().match(regex)){
      let matches = [...range.toString().matchAll(regex)]
      const groups = matches[0];
      sel.removeAllRanges()
      if(groups){
        const hour = groups[2] ?? groups[5];
        const minute = groups[3] ?? groups[6];
        const meridian = groups[4];
        const timezone = groups[7];
        const dynamicRegex = new RegExp(`(${hour}:${minute})|(${meridian})|(${timezone})`, "gm")
        const nodes = iterateThroughNode(range.commonAncestorContainer, dynamicRegex)
    
        range = document.createRange();
        
        let startFound = false;
        for(let node of nodes){
            if(node.value === `${hour}:${minute}`){
                range.setStart(node.node, node.index)
                startFound = true
            }
            if(startFound && node.value.trim() === timezone){
                range.setEnd(node.node, node.index + node.value.length)
                autoHighlightFound = true;
                break;
            }
        }
        sel.addRange(range)
      }
    }
    // 2 scenarios
    // 1. user highlights the same text
    // 2. user clicks on the highlighted text
    
      if(!checkSameRange(prevRange, range)){ // if highlighted different text
      
        if(prevRange !== null){  // user selected different text
          removePopovers()
        } 
        if(!sel.isCollapsed && autoHighlight && autoHighlightFound){
          addPopover(range)
        }
      } 
      else if (sel.type === "Caret"){ // current problem with these else if statements is that when user highlights the same text again, it will remove the timezonify popup
        removePopovers()
      } else if (popovers.length < 1){
        addPopover(range)
      }
  } else {
    removePopovers()
  }
}

// helper code

function getNodes() {
  let walker = document.createTreeWalker(document, window.NodeFilter.SHOW_TEXT, null, false);
  let nodes = [];
  while(node = walker.nextNode()) {
    nodes.push(node);
  }
  return nodes;
}



async function init(){
  const _enabled = await utils.getStorageValue("enabled")
  
  enabled = _enabled
  if(enabled == null) {
      enabled = true;
      utils.setStorageValue("enabled", true)
  }

  const _autoHighlight = await utils.getStorageValue("autoHighlight");
  autoHighlight = _autoHighlight;
  if(_autoHighlight == null){
      utils.setStorageValue("autoHighlight", true);
      autoHighlight = true;
  }

  _timezones = await utils.getTimezonesData();
}


function undoTimezonifyAll(tabId){
  browser.runtime.sendMessage({
      command: "get-state",
      tabId: tabId
    }).then(res => {
      setHtml(res.oldHtml)
    })
}

function timezonifyAll(text){
  oldHtml = text;
  while((groups = regex.exec(text)) != null){
    const timezonified = convertTime(groups) 
    text = text.replace(`${groups[2]} ${groups[14]}`, timezonified)
    
  }
  setHtml(text);
  return text
}

function setHtml(html){
  // Purpose of the parser is to prevent unsafe assignment to HTML. However, the caveat of this is that it adds a 2nd body tag into the HTML
  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, "text/html")
  const tags = parsed.getElementsByTagName("body")
  document.body.innerHTML = ``;

  for(const tag of tags){
    tag.style.padding = "0";
    tag.style.margin = "0";
    document.body.appendChild(tag);
  }

}

  
(async() => {

  if(window.hasRun){
      return;
  }
  await importScripts();
  init();
  browser.runtime.sendMessage({
    command: "refresh"
  })
  // whenever the user updates the configurations in the popup, update them here as well, removing any existing popups if user disables the extension
  browser.storage.onChanged.addListener((storage) => {
    enabled = storage.enabled != null ? storage.enabled.newValue : enabled
    autoHighlight = storage.autoHighlight != null ? storage.autoHighlight.newValue : autoHighlight
    document.querySelectorAll(".timezonify-time-popover").forEach((item) => {
        if(enabled) item.style.display = "flex"
        else item.style.display = "none"

    })
  })
  window.hasRun = true;
})()

// this MUST be at the bottom. Putting it above the init function will cause the init function to not run
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if(message.command === "timezonify"){
    const oldHtml = document.body.innerHTML
    const timezonifiedHtml = timezonifyAll(document.body.innerHTML);
    sendResponse({timezonifiedHtml, oldHtml})
  } else if (message.command === "undo-timezonify"){
    undoTimezonifyAll(message.tabId);
  }
  // else if(message.command == "find-timezone"){
  //   const timezoneData = findTimezoneDataFromTimezoneUtc(message.data)
  //   sendResponse(timezoneData)
  // }
})