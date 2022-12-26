/* 
  Auto-number Windows - stable menu order
  Copyright 2022. Jefferson "jscher2000" Scher. License: MPL-2.0.
  v0.1 - initial design
*/

var arrPrefaces = []; // Store what we assigned; Q: should we separate private windows?

function updatePreface(evt){
	// Retrieve an array of all open windows
	var wins = browser.windows.getAll();
	wins.then((arrWins) => {
		// Sort by id, ascending, just in case
		arrWins.sort(function(a,b) {return (a.id - b.id);});
		// Update prefaces as needed
		for (var w=0; w<arrWins.length; w++){
			var lastPreface = arrPrefaces.find(oP => oP.id === arrWins[w].id);
			if (lastPreface){ // update if needed
				if (lastPreface.preface !== (w + 1) + ' '){
					// Update arrPrefaces
					lastPreface.preface = (w + 1) + ' ';
					// Update window preface
					browser.windows.update(arrWins[w].id, {titlePreface: (w + 1) + ' '});
				}
			} else { // newbie
				// Add object to arrPrefaces
				arrPrefaces.push({id: arrWins[w].id, preface: (w + 1) + ' '});
				// Update window preface
				browser.windows.update(arrWins[w].id, {titlePreface: (w + 1) + ' '});
			}
		}
	});
}

/*** INITIALIZE ***/
updatePreface();

/*** EVENT HANDLERS ***/

// Listen for window opening and update
browser.windows.onCreated.addListener(updatePreface);

// Listen for window close and purge from arrPrefaces, update others
browser.windows.onRemoved.addListener((wid) => {
	// remove window from arrPrefaces
	var elPosition = arrPrefaces.findIndex(oP => oP.id === wid);
	if (elPosition){
		// this window is in our array
		arrPrefaces.splice(elPosition, 1);
		// in case it wasn't the last window, we need to update prefaces again
		updatePreface();
	}
});
