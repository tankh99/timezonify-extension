var states = {}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.command === "save-state"){
        if(!request.undo) {
            states[request.tabId] = {
                ...states[request.tabId],
                ...request.state
            }
        } else {
            states[request.tabId] = null
        }
    } else if(request.command === "get-state"){
        sendResponse(states[request.tabId])
    } else if (request.command === "refresh"){
        states = {};
    }
})

function saveState(state){

}