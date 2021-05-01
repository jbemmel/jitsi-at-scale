// Get reference to 'start' button
let startButton = document.getElementById("start");

//chrome.storage.sync.get("color", ({ color }) => {
//  changeColor.style.backgroundColor = color;
//});

// When the button is clicked, inject setPageBackgroundColor into current page
startButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: startStream,
  });
});

// The body of this function will be execuetd as a content script inside the
// current page
function startStream() {
  chrome.storage.sync.get("settings", ({ settings }) => {
    console.log( `TODO: Find audio/video element, connect to room ${settings}, start streaming` );
  });
}
