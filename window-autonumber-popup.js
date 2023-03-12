/* 
  Auto-number Windows - stable menu order
  Copyright 2023. Jefferson "jscher2000" Scher. License: MPL-2.0.
  version 0.5 - initial popup design
*/

/*** Initialize Popup Page ***/

// Default starting values
var oPrefs = {
	filterbar: true,			// show filter bar on popup
	caseinsens: true,			// filter is case insensitive
	bodyfontsize: 14,			// numeric font size for popup
	bodywidth: 500,				// numeric pixel min-width for popup
	bodyheight: 500				// numeric pixel min-height for popup
}

var listels;

// Update oPrefs from storage and build URLs list
if (typeof browser != 'undefined'){ // live Firefox extension
	browser.storage.local.get("prefs").then((results) => {
		if (results.prefs != undefined){
			if (JSON.stringify(results.prefs) != '{}'){
				var arrSavedPrefs = Object.keys(results.prefs)
				for (var j=0; j<arrSavedPrefs.length; j++){
					oPrefs[arrSavedPrefs[j]] = results.prefs[arrSavedPrefs[j]];
				}
			}
		}
		// Set font size
		document.body.style.setProperty('--body-size', oPrefs.bodyfontsize + 'px', 'important');
		// Hide filter bar if preferred (access to this pref is TODO)
		if (oPrefs.filterbar == false) document.getElementById('filterbar').style.display = 'none';

		// Do we have Tabs permission?
		browser.permissions.contains({
			permissions: [
				"tabs"
			]
		}).then((result) => {
			var list = document.getElementById('winlist');
			if (result === true){ // Build out the window list
				list.style.display = '';
				//document.body.style.setProperty('--body-width', oPrefs.bodywidth + 'px', 'important');
				//document.body.style.setProperty('--body-height', oPrefs.bodyheight + 'px', 'important');
				browser.windows.getAll().then((arrWins) => {
					var newLI = document.getElementById('newLI');
					for (var i=0; i<arrWins.length; i++){
						var clone = document.importNode(newLI.content, true);
						// Populate the template
						var li = clone.querySelector('li');
						li.setAttribute('winid', arrWins[i].id);
						var wtitle = arrWins[i].title.trim();
						var pos = wtitle.lastIndexOf(' — Mozilla Firefox');
						if (pos > 0) wtitle = wtitle.slice(0, pos).trim();
						if (wtitle.length < 3) wtitle += ' [Untitled]';
						li.setAttribute('title', wtitle);
						li.setAttribute('incog', arrWins[i].incognito);
						li.setAttribute('focused', arrWins[i].focused);
						li.querySelector('.wintitle').textContent = wtitle;
						// Add the item to the list
						list.appendChild(clone);
					}
					if (arrWins.length % 2 != 0){
						// insert a placeholder to make a nice bottom border
						var clone = document.importNode(newLI.content, true);
						var li = clone.querySelector('li');
						li.setAttribute('dummy', true);
						list.appendChild(clone);
					}
					// TODO Make this optional! 
					browser.tabs.query({active: true}).then((arrTabs) =>{
						var litems = list.querySelectorAll('li');
						for (i=0; i<litems.length; i++){
							var winTab = arrTabs.find(oTab => oTab.windowId === parseInt(litems[i].getAttribute('winid')));
							if (winTab){
								litems[i].getElementsByClassName('favicon')[0].setAttribute('src', winTab.favIconUrl);
								litems[i].setAttribute('title', winTab.title + ' \n' + winTab.url);
							}
						}
					});
				});
				// Initialize permission selector value 
				document.forms['frmtabsperm'].elements['tabsperm'].value = 'yes';
			} else { // Hide the <ul> & filter bar
				list.style.display = 'none';
				document.body.style.setProperty('--body-width', '450px', 'important');
				document.body.style.maxWidth = '450px';
				document.body.style.setProperty('--body-height', '110px', 'important');
				document.getElementById('filterbar').style.display = 'none';
				// Initialize permission selector value 
				document.forms['frmtabsperm'].elements['tabsperm'].value = 'no';
			}
		}).catch((err) => {
			document.querySelector('#oops span').textContent = 'Error retrieving "prefs" from storage or building window list: ' + err.message;
			document.getElementById('oops').style.display = 'block';
		});
	});
} else { 
	// saved web page?
}

/*** Handle User Interaction ***/

function switchTo(evt){
	var tgt = evt.target;
	if (tgt.nodeName == 'LI'){
		var li = tgt;
	} else {
		li = tgt.closest('li');
	}
	if (!li){
		document.querySelector('#oops span').textContent = 'Script is confused about what you clicked. Try again?';
		document.getElementById('oops').style.display = 'block';
		return;
	}
	if (li.hasAttribute('winid') && !li.hasAttribute('dummy')){
		if (tgt.classList.contains('btntablist') || tgt.parentNode.classList.contains('btntablist')){
			alert('Make a tab list');
			return;
		} else {
			browser.windows.update(parseInt(li.getAttribute('winid')), {focused: true});
		}
	}
}
// List event handlers 
document.getElementById('winlist').addEventListener('click', switchTo, false);
document.getElementById('winlist').addEventListener('mouseup', function(evt){
	if (evt.button == 1){
		// Open site
		switchTo(evt);
	}
}, false);

let lastfilter = '';
function filterTitles(evt){
	var newval = '';
	if (evt.target.id == 'filterclear'){
		document.getElementById('filterbar').value = ''; // TODO -- sometimes doesn't reset the list?
	} else {
		newval = evt.target.value.trim();
		if (oPrefs.caseinsens) newval = newval.toLowerCase();
	}
	// If no change from last filter, exit
	if (newval == lastfilter) return;
	// Apply the filter
	listels = document.querySelectorAll('#winlist li:not([dummy="true"])');
	var i, j, words, title;
	if (newval.length === 0){ //reset all to visible
		for (i=0; i<listels.length; i++){
			listels[i].removeAttribute('filterfail');
		}
	} else { // filter per user input
		words = newval.replace(/ +/g, ' ').split(' ');
		for (i=0; i<listels.length; i++){
			title = listels[i].getAttribute('title');
			if (oPrefs.caseinsens) title = title.toLowerCase();
			for (j=0; j<words.length; j++){
				if (title.indexOf(words[j]) === -1){
					listels[i].setAttribute('filterfail', 'true');
					break; // stop checking parts, go to next i
				} else {
					listels[i].removeAttribute('filterfail');
					// don't break - this could be overridden if the next part is not found
				}
			}
		}
		// Check groups
		listels = document.querySelectorAll('#winlist li[hostname]:not([hostbutton="additional"]');
		for (i=0; i<listels.length; i++){
			var el = listels[i], hn = el.getAttribute('hostname'), addshow = 0;
			while (el.nextElementSibling){
				el = el.nextElementSibling;
				// Different host, we're done looping
				if (el.getAttribute('hostname') != hn) break;
				if (!el.hasAttribute('filterfail')){
					if (el.getAttribute('hostbutton') == 'additional') addshow++;
				}
			}
			if (addshow == 0){
				if (listels[i].hasAttribute('filterfail')){
					if (listels[i].getAttribute('filterfail') == 'true') listels[i].setAttribute('filterfail', 'all');
				} else {
					listels[i].setAttribute('filterfail', 'adds');
				}
			}
		}
	}
	// Update lastfilter
	lastfilter = newval;
}

// Filter bar and Options button event handlers
document.getElementById('filterbar').addEventListener('keyup', filterTitles, false);
document.getElementById('filterclear').addEventListener('click', filterTitles, false);
document.getElementById('frmfilter').addEventListener('submit', function(){return false;}, false);
document.getElementById('closepop').addEventListener('click', function(){self.close();}, false);
document.getElementById('btnRenumber').addEventListener('click', function(){
	browser.runtime.sendMessage({action: 'renumber'}).then((response) => {
		var list = document.getElementById('winlist');
		if (list.style.display != 'none'){
			list.style.opacity = 0.4;		// refresh the list
			browser.windows.getAll().then((arrWins) => {
				// empty the existing list
				while (list.firstChild) list.lastChild.remove();
				// rebuild the list // TODO get rid of this duplication!!
				var newLI = document.getElementById('newLI');
				for (var i=0; i<arrWins.length; i++){
					var clone = document.importNode(newLI.content, true);
					// Populate the template
					var li = clone.querySelector('li');
					li.setAttribute('winid', arrWins[i].id);
					var wtitle = arrWins[i].title.trim();
					var pos = wtitle.lastIndexOf(' — Mozilla Firefox');
					if (pos > -1) wtitle = wtitle.slice(0, pos).trim();
					if (wtitle.split(' ').length < 2) wtitle += ' [Untitled]';
					li.setAttribute('title', wtitle);
					li.setAttribute('incog', arrWins[i].incognito);
					li.setAttribute('focused', arrWins[i].focused);
					li.querySelector('.wintitle').textContent = wtitle;
					// Add the item to the list
					list.appendChild(clone);
				}
				if (arrWins.length % 2 != 0){
					// insert a placeholder to make a nice bottom border
					var clone = document.importNode(newLI.content, true);
					var li = clone.querySelector('li');
					li.setAttribute('dummy', true);
					list.appendChild(clone);
				}
				// TODO Make this optional! 
				browser.tabs.query({active: true}).then((arrTabs) =>{
					var litems = list.querySelectorAll('li');
					for (i=0; i<litems.length; i++){
						var winTab = arrTabs.find(oTab => oTab.windowId === parseInt(litems[i].getAttribute('winid')));
						if (winTab){
							litems[i].getElementsByClassName('favicon')[0].setAttribute('src', winTab.favIconUrl);
							litems[i].setAttribute('title', winTab.title + ' \n' + winTab.url);
						}
					}
				});
				list.style.opacity = 1;
			});
		}
	}).catch((err) => {
		window.alert(err);
	});
}, false);

// Permission selector
function toggleTabsPerm(evt){
	if (evt.target.getAttribute('name') == 'tabsperm'){
		if (evt.target.value == 'yes'){ // Request if needed
			window.setTimeout(function(){self.close()}, 250);
			// Request permission
			browser.permissions.request({
				permissions: ["tabs"]
			}).then((result) => {
				if (result === false){
					alert('Permission was not granted?');
					// revert the radio button
					window.setTimeout(function(){
						evt.target.value == 'no';
					}, 100);
				}
			})
		} else { // Revoke if needed - after confirmation?
			browser.permissions.remove({
				permissions: ["tabs"]
			}).then((result) => {
				if (result === false){
					alert('Permission revocation was not successul for some reason.');
					// revert the radio button
					window.setTimeout(function(){
						evt.target.value == 'yes';
					}, 100);
				} else {
					window.setTimeout(function(){self.close()}, 250);
				}
			});
		}
	}
}
document.getElementById('frmtabsperm').addEventListener('change', toggleTabsPerm, false);
document.getElementById('frmtabsperm').addEventListener('submit', function(){return false;}, false);
