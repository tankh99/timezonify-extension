// import "../browser-polyfill";


export const getTimezonesData = async() => {
  const timezones = await browser.runtime.sendMessage({
    command: "get-timezones"
  })
  return timezones
}

export const getCountriesData = async() => {
  const countries = await browser.runtime.sendMessage({
    command: "get-countries"
  })
  return countries
}

export const getTimezoneFromCountry = (countryAbbr) => {
  return moment.tz.zonesForCountry(countryAbbr)[0]
}

export const setStorageValue = (key, value) => {
    browser.storage.sync.set({[key]: value})
}
  
export const getStorageValue = async(key) => {
  var gettingValue = await browser.storage.sync.get([key]);
  return gettingValue && gettingValue[key]
}


export const getBrowserTabs = async () => {
  return new Promise((resolve) => {
    if(browser.tabs){

      browser.tabs.query({active: true, currentWindow: true})
      .then((tabs) => {
        resolve(tabs);
      }).catch((err) => {
        console.error(err)
      })
    }
  })
}



export const getState = async () => {
  return new Promise((resolve) => {
    getBrowserTabs()
    .then((tabs) => {
      browser.runtime.sendMessage({
        command: "get-state",
        tabId: tabs[0].id
      }).then((state) => {
        resolve(state)
      }).catch((err) => {
        console.error(err)
      })
    })
  })
}

export const setState = async (state) => {
  return new Promise((resolve) => {
    getBrowserTabs()
    .then((tabs) => {
      browser.runtime.sendMessage({
        command: "set-state",
        state,
        tabId: tabs[0].id
      }).then(() => {
        resolve()
      }).catch((err) => {
        console.error(err)
      })
    })
  })
}

export const cleanTimeOffset = (offset) => {
  let decimalPlace = offset % 1;
  let hour = offset - decimalPlace;
  return { hour, minute: decimalPlace * 60 };
}

export const getOffsetTime = (hour, minute, sourceOffset, clientOffset, meridian) => {
  const { hour: cleanedClientOffset, minute: clientMinute } = cleanTimeOffset(
    clientOffset
  );
  const { hour: cleanedSourceOffset, minute: sourceMinute } = cleanTimeOffset(
    sourceOffset
  );
  
  hour = hour - cleanedSourceOffset + cleanedClientOffset;
  minute = minute - sourceMinute + clientMinute;

  return formatTime(hour, minute, meridian, meridian == null);
}

export const formatTime = (hour, minute, meridian, is24hr) => {

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

    if(hour > 24) return formatTime(hour, minute, meridian, is24hr)
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
      meridian = meridian ? (meridian.toLowerCase() === "am" ? "pm" : "am") : "";
  }

  if(hour < 0){
    hour = hour + 12;
    meridian = meridian ? (meridian.toLowerCase() === "am" ? "pm" : "am") : "";
  }
  if(minute.toString().length < 2){
    minute = "0" + minute;
  }

  if(hour > 12) return formatTime(hour, minute, meridian, is24hr) // hour will be more than 12 even after minusing if its 11:00pm PT and your timezone is MPST/SGT
  return { hour, minute, meridian };
  
}

export default {
  fetchTimezonesData: getTimezonesData,
  setStorageValue,
  getStorageValue,
  getBrowserTabs,
  getState,
  setState,
  cleanTimeOffset,
  getOffsetTime,
  formatTime
}