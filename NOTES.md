
# Notes
To help me out with coding and troubleshooting
This URL contains a very helpful example which involves traversing through text nodes of a DOM https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/find/find

### Zipping
```
zip -r timezonify.zip . -x ".*" -x "__MACOSX" -x "example.html" -x "NOTES.md" -x ".gitignore" -x ".git" -x "*screenshots*" -x "lib/.*" -x "timezonify.zip" -x "timezonify-chrome.zip"
```
This command zips up the package without including the junk files like _MACOSX and DS_STORE, as well as ignoring all the previously ignored files

### Testing on different browser
```web-ext run --target chromium```
Test the browser on a chrome browser
```web-ext run --target firefox```
Or test the browser on a firefox browser

# Troubleshooting
### Importing module
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#dynamic_module_loading


### Using browser-polyfill
https://github.com/mozilla/webextension-polyfill#installation
1. Add it to manifest.json
   1. background
   2. content_scripts


### Inspecting the popup 
Reference here: https://extensionworkshop.com/documentation/develop/debugging/#debugging-popups
1. Go to about:debugging. Click on This Firefox
2. Inspect Timezonify
2. Prevent popup auto-hide by clicking on the top-right settings icon
3. Open popup
4. Click on the icon that appears to the left of the settings
5. Select timezonify.html to inspect

### Removed Features
1. Timezonify Button
manifest.json content_scripts line
```
"content_scripts": [
    {
        "matches": ["*://*/*"],
        "js": [
            "browser-polyfill.js",
            "content_scripts/timezonify.js"
        ]
    }
],
```