
# Notes
To help me out with coding and troubleshooting
This URL contains a very helpful example which involves traversing through text nodes of a DOM https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/find/find

### Zipping
```zip -r dir.zip . -x ".*" -x "__MACOSX" -x "example.html" -x "NOTES.md" -x ".gitignore" -x ".git" -x "*screenshots*""```
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