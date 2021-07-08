

var states = {}

browser.tabs.onActivated.addListener((activeInfo) => {
    browser.runtime.sendMessage({
        command: "switch-tab"
    })
})

// provides a storage that lasts only until the browser refreshes
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const tabId = request.tabId
    if(request.command === "set-state"){
        // console.log(request)
        if(!request.state.undo) {
            states[tabId] = {
                ...states[tabId],
                ...request.state
            }
        } else {
            states[tabId] = {
                ...states[tabId],
                oldHtml: null
            }
        }
    } else if(request.command === "get-state"){
        sendResponse(states[tabId])
    } else if (request.command === "refresh"){
        states = {
            ...states,
            [sender.tab.id]: {},
        };
    }
    refreshed = false
})
