# timezonify-extension
Makes all timings local. Select the text you want to convert into your local timezone, and click on the Timezonify button that appears above the text. 

You can also enable/disable the extension by clicking on the extension's popup.

TODO:

1. Complete the convert timezone form inside the popup - Done
2. Figure out a way to reuse the same code for both content_scripts and popups - Done
3. Separate the current options from the popup page and put it inside a separate options page (hint: define "options_ui" inside manifest.json).
4. Add country name fields to major timezones
5. Update to manifest v3

# Version History:

v4.0 Feature Rework: 
- There is now a timezonify button instead of popovers appearing over text. This button automatically converts all matched time text into the local timezone. I made the change as this is much closer to what I envisioned this extension to be. 
- Added a form inside the browser popup that allows users to convert timezones manually. This popup has ethereal persistence for the form values inside the popup. This means that the values that the user types into the time-input and timezone-select, and even the result from converting will be retained throughout popup closes and will only reset on page refresh 
- Added browser-polyfill.js and thus, the chrome branch is now deprecated!
- Added utils.js, allowing the reusability of code

v3.0: Feature: Added auto-highlighting, which can auto-highlight valid timing text. This will help make selections much easier. Also added toggle for auto-highlighting

v2.1: Added a toggle feature to enable/disable timezonify highlighting. Added support for common timezones

v2.0: Simply highlight the text you want to convert, click on Timezonify and voila! It overlays the new timing over the highlighted text. Double-click the overlay if you wish to delete it

v1.0: Simply select the timing you want to convert, right-click to open up the context menu and then Timezonify!

