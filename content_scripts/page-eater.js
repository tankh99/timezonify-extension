

function eatPageReceiver(request, sender, sendResponse){
    document.body.textContent = ""
    var header = document.createElement("h1")
    header.textContent = request.replacement
    document.body.appendChild(header)
    
    document.body.append("11:00pm IST")


    fetch(url)
    .then(res => {
        console.log(res)
    }).catch(err => {
        console.error(err)
    })
}

browser.runtime.onMessage.addListener(eatPageReceiver)