importScripts('constants.js')

chrome.webRequest.onBeforeRequest.addListener(
    async function (details) {
        if (details.url.includes(PATTERN_DS_INSURANCE)) {
            await chrome.storage.local.set({[generateUniqueKey()]: details.url})
        }
    },
    {urls: ["<all_urls>"]}
);

function generateUniqueKey() {
    const prefix = PATTERN_API_NAME
    const randomString = Math.random().toString(36).substring(2, 12)
    return `${prefix}_${randomString}`
}

// load main website
// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
//     if(changeInfo.status === COMPLETE) {
//         chrome.storage.local.get(null, function(items) {
//             for (let element of Object.keys(items)) {
//                 if (element.includes(PATTERN_API_NAME)) {
//                     chrome.storage.local.remove(element)
//                 }
//             }
//         });
//     }
// })