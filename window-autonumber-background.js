/* 
  Auto-number Windows - stable menu order
  Copyright 2022. Jefferson "jscher2000" Scher. License: MPL-2.0.
  v0.1 - initial design
  v0.2 - full renumber (do not rely on list)
*/

function updatePreface(evt){
	// Retrieve an array of all open windows
	var wins = browser.windows.getAll();
	wins.then((arrWins) => {
		// Sort by id, ascending, just in case
		arrWins.sort(function(a,b) {return (a.id - b.id);});
		// Update prefaces unconditionally
		for (var w=0; w<arrWins.length; w++){
			// Update window preface - v0.2
			browser.windows.update(arrWins[w].id, {titlePreface: (w + 1) + ' '}).catch((err) => {console.log('Error updating window preface: ', err);});	
		}
	});
}

/*** INITIALIZE ***/
updatePreface();

/*** EVENT HANDLERS ***/

// Listen for window opening and update
browser.windows.onCreated.addListener(updatePreface);

// Listen for window closing and update - v0.2
browser.windows.onRemoved.addListener(updatePreface);

/*** TODO: Tools menu item to force a renumber or stop numbering? ***/

/*** TODO: Toolbar button to force a renumber or stop numbering? ***/
