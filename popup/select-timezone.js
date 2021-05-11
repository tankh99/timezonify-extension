// import timezones from '../timezones.json'
function onClickListener(){

    // console.log("initizliased")
    // debugger
    document.addEventListener("click", (e) => {

        function timezonify(tabs){
            // console.log(timezones)
            browser.tabs.sendMessage(tabs[0].id, {
                command: "timezonify"
            })
        }

        function reset(tabs){
            browser.tabs.sendMessage(tabs[0].id, {
                command: "reset"
            })
        }

        function reportError(error){
            console.error(`Could not timezonify: ${error}`);
        }

        if(e.target.classList.contains("timezone-btn")){
            browser.tabs.query({active: true, currentWindow: true})
            .then(timezonify)
            .catch(reportError)
        } else if (e.target.classList.contains("reset")){
            browser.tabs.query({active: true, currentWindow: true})
            .then(reset)
            .catch(reportError)
        }
    })
}

function reportScriptError(error){
    console.error(`Failed to execute timezonify content script: ${error.message}`);
}

browser.tabs.executeScript({file: "/content_scripts/timezonify.js"})
.then(onClickListener)
.catch(reportScriptError)