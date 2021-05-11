
browser.contextMenus.create({
    id: "timezonify",
    title: "Timezonify"
})

async function messageTab(tabs){
    
    browser.tabs.sendMessage(tabs[0].id, {
        replacement: "I have changedzzz!!",
    })
}

async function messageTimezonify(tabs){
    const timezones = await (await fetch("data/timezones.json")).json()
    console.log(timezones)
    browser.tabs.sendMessage(tabs[0].id, {
        timezones
    })
}

function onExecutedEatPage(result){
    var query = browser.tabs.query({
        active: true,
        currentWindow: true
    })
    query.then(messageTab)
}

function onExecuted(result){
    var query = browser.tabs.query({
        active:true,
        currentWindow:true
    })
    query.then(messageTimezonify)
}


browser.contextMenus.onClicked.addListener((info, tab) => {
    if(info.menuItemId == "eat-page"){
        let executing = browser.tabs.executeScript({
            file: "content_scripts/page-eater.js"
        })
        executing.then(onExecutedEatPage)
    } else if (info.menuItemId == "timezonify"){
        let executing = browser.tabs.executeScript({
            file: "content_scripts/timezonify.js"
        })
        executing.then(onExecuted)
    }
})