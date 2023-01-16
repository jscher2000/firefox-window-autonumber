/* 
  Auto-number Windows - stable menu order
  Copyright 2022. Jefferson "jscher2000" Scher. License: MPL-2.0.
  v0.1 - initial design
  v0.2 - full renumber (do not rely on list)
  v0.3 - Tools menu Renumber item
*/

function updatePreface(evt){
	// Retrieve an array of all open windows
	var wins = browser.windows.getAll();
	wins.then((arrWins) => {
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

/*** MENU ITEMS AND EVENTS ***/

// Renumber command on the Tools menu
browser.menus.create({
	id: 'winRenumber',
	title: 'Renumber windows now',
	contexts: ['tools_menu']
});
browser.menus.onClicked.addListener((menuInfo, currTab) => {
	switch (menuInfo.menuItemId) {
		case 'winRenumber':
			updatePreface();
			break;
		default:
			// This should never happen
	}
});
