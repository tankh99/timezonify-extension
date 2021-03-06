import "../browser-polyfill.js"
import {timezones} from '../data/timezones.js'
import {countries} from '../data/countries.js'
import * as utils from '../utils/utils.js'

// importScripts("../browser-polyfill.js")
// importScripts("../data/timezones.js")
// importScripts("../utils/utils.js")

// import * as utils from "../utils/utils";

var states = {}

// provides a storage that lasts only until the browser refreshes
// dsiabled code which allows each individual tab to have their own state. to re-enable simply uncomment out the tabId code portions

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // const tabId = request.tabId
    if(request.command === "set-state"){
        if(!request.state.undo) {
            // states[tabId] = {
            //     ...states[tabId],
            //     ...request.state
            // }
            states = {
                ...states,
                ...request.state
            }
        } else {
            states = {
                ...states,
                oldHtml: null
            }
            // states[tabId] = {
            //     ...states[tabId],
            //     oldHtml: null
            // }
        }
    } else if(request.command === "get-state"){
        sendResponse(states)
    } else if (request.command === "refresh"){
        states = {
            ...states,
            [sender.tab.id]: {},
        };
    } else if (request.command === "get-timezones"){
        sendResponse(timezones)
    } else if (request.command === "get-timezone-by-utc"){
        const timezone = findTimezoneDataFromTimezoneName(request.timezoneUtc)
        sendResponse(timezone)
    } else if (request.command === "get-countries"){
        sendResponse(countries)
    }
    // refreshed = false
})


function findTimezoneDataFromTimezoneName(timezoneName) {
    return countries.find((country) => {
        const containsTimezone = country.timezones.filter((timezone) => timezoneName == timezone).length > 0
        return containsTimezone
    })
    // return timezones.find((timezone) => {
    //   const containsUtc =
    //     timezone.utc.filter((utc) => {
    //       return utc === timezoneUtc;
    //     }).length > 0;
    //   return containsUtc;
    // });
  }
