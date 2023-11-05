/* 
  Auto-number Windows - stable menu order
  Copyright 2023. Jefferson "jscher2000" Scher. License: MPL-2.0.
  v0.1 - initial design
  v0.2 - full renumber (do not rely on list)
  v0.3 - Tools menu Renumber item
  v0.3.3 - Updated for Manifest v3
  v0.5 - Toolbar button (windows list) / Numberless option
  v0.6 - Add delayed renumbering to catch tabs detached to a new window
  v0.6.5 - Try to fix problem some users report that numbering doesn't start
*/

function updatePreface(action){
	// Retrieve an array of all open windows
	browser.windows.getAll().then((arrWins) => {
		if (!arrWins || arrWins.length === 0){
			console.log('updatePreface: ERROR RETRIEVING WINDOW LIST');
			// TODO: try again? how to avoid trying indefinitely?
			return;
		}
		// Sort by id, ascending, just in case
		arrWins.sort(function(a,b) {return (a.id - b.id);});
		// Update prefaces unconditionally
		for (var w=0; w<arrWins.length; w++){
			// Update window preface - v0.2
			if (action != 'purge'){
				browser.windows.update(arrWins[w].id, {titlePreface: (w + 1) + ' '}).catch((err) => {console.log('Error updating window preface: ', err);});	
			} else {
				browser.windows.update(arrWins[w].id, {titlePreface: ''}).catch((err) => {console.log('Error updating window preface: ', err);});	
			}
		}
		return true;
	}).catch((err) => {
		console.log('getAll() failed? ', err);
		return false;
	});
}
function newWinCheck(w){
	browser.tabs.query({windowId: w.id}).then((arrTabs) => {
		if (arrTabs && arrTabs.length > 0){
			updatePreface();
		} else {
			//console.log('arrTabs was empty! creating alarm at ' + Date.now());
			browser.alarms.create('delayedrenumber', {delayInMinutes: 0.015}); // fire after about 1 second
		}
	});
}

// Alarm (similar to setTimeout) for delayed renumbering of windows created from detached tabs (and possibly other scenarios)
function handleAlarm(alarmInfo){
	switch (alarmInfo.name) {
		case 'delayedrenumber':
			//console.log(alarmInfo.name + ' being handled at ' + Date.now());
			updatePreface();
			break;
		default:
			// This should never happen
	}
}
browser.alarms.onAlarm.addListener(handleAlarm)

// Set up the Tools menu item
function menuSetup(){
	browser.menus.create({
		id: 'winAutonumber',
		title: 'Auto-number Windows',
		contexts: ['tools_menu']
	}, 
	function(){
		if (browser.runtime.lastError) console.log("Error creating winNumber menu item:", browser.runtime.lastError); 
		else {
			browser.menus.create({
				id: 'winRenumber',
				parentId: "winAutonumber",
				title: 'Renumber windows now',
				contexts: ['tools_menu']
			});
			browser.menus.create({
				id: 'winNumOff',
				parentId: "winAutonumber",
				title: 'Turn off auto-numbering',
				contexts: ['tools_menu']
			});
		}
	});
}
menuSetup();
browser.menus.onClicked.addListener((menuInfo, currTab) => {
	switch (menuInfo.menuItemId) {
		case 'winRenumber':
			updatePreface();
			// Update storage
			browser.storage.local.set({numpref: true});
			// Listen for window opening and update
			browser.windows.onCreated.addListener(newWinCheck);
			// Listen for window closing and update - v0.2
			browser.windows.onRemoved.addListener(updatePreface);
			break;
		case 'winNumOff':
			// Remove event listeners
			browser.windows.onCreated.removeListener(updatePreface);
			browser.windows.onRemoved.removeListener(updatePreface);
			// Purge numbering
			updatePreface('purge');
			// Update storage
			browser.storage.local.set({numpref: false});
			break;
		default:
			// This should never happen
	}
});

// required for MV3 per https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/ 
browser.runtime.onInstalled.addListener(menuSetup);

/*** INITIALIZE ***/
var numPref = true			// assign sequential window title preface
function init(){
	browser.storage.local.get("numpref").then((results) => {
		if (results.numpref != undefined){
			numPref = results.numpref;
		}
		if (numPref == true){
			// Renumber the windows
			updatePreface();
			// Listen for window opening and update
			browser.windows.onCreated.addListener(newWinCheck);
			if (browser.runtime.lastError) console.log("For addListener(newWinCheck):", browser.runtime.lastError);
			// Listen for window closing and update - v0.2
			browser.windows.onRemoved.addListener(updatePreface);
			if (browser.runtime.lastError) console.log("For addListener(updatePreface):", browser.runtime.lastError);
		} 
	});
}
init();
browser.runtime.onStartup.addListener(init); // v0.6.5
browser.runtime.onInstalled.addListener(init); // v0.6.5

/*** Messaging handlers ***/
function handleMessage(request, sender, sendResponse){
	// Open info page in window or tab
	if (request.action == 'renumber'){
		updatePreface();
		// Update storage
		browser.storage.local.set({numpref: true});
		// Listen for window opening and update
		browser.windows.onCreated.addListener(newWinCheck);
		// Listen for window closing and update - v0.2
		browser.windows.onRemoved.addListener(updatePreface);	
	}
}
browser.runtime.onMessage.addListener(handleMessage);