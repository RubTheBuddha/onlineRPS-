
//  Global Vars


// Store the objects for each of the two players
var p1 = null;
var p2 = null;

// Store the player names
var p1Name = "";
var p2Name = "";

// Store the name of the player in the user's browser
var yourPlayerName = "";

//  player choices var
var p1Choice = "";
var p2Choice = "";

// Who's turn
var turn = 1;


//  Firebase


// Get a reference to the database service
var database = firebase.database();

// Attach a listener to the database /players/ node to listen for any changes
database.ref("/players/").on("value", function(snapshot) {
	// Check for existence of player 1 in the database
	if (snapshot.child("p1").exists()) {
		console.log("Player 1 exists");

		// Record p1 data
		p1 = snapshot.val().p1;
		p1Name = p1.name;

		// Update p1 display
		$("#p1Name").text(p1Name);
		$("#p1Stats").html("Win: " + p1.win + ", Loss: " + p1.loss + ", Tie: " + p1.tie);
	} else {
		console.log("Player 1 does NOT exist");

		p1 = null;
		p1Name = "";

		// Update p1 display
		$("#p1Name").text("Waiting for Player 1...");
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		database.ref("/outcome/").remove();
		$("#roundOutcome").html("Rock-Paper-Scissors");
		$("#waitingNotice").html("");
		$("#p1Stats").html("Win: 0, Loss: 0, Tie: 0");
	}

	// Check for existence of player 2 in the database
	if (snapshot.child("p2").exists()) {
		console.log("Player 2 exists");

		// Record player2 data
		p2 = snapshot.val().p2;
		p2Name = p2.name;

		// Update player2 display
		$("#p2Name").text(p2Name);
		$("#p2Stats").html("Win: " + p2.win + ", Loss: " + p2.loss + ", Tie: " + p2.tie);
	} else {
		console.log("Player 2 does NOT exist");

		p2 = null;
		p2Name = "";

		// Update player2 display
		$("#p2Name").text("Waiting for Player 2...");
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		database.ref("/outcome/").remove();
		$("#roundOutcome").html("Rock-Paper-Scissors");
		$("#waitingNotice").html("");
		$("#p2Stats").html("Win: 0, Loss: 0, Tie: 0");
	}

	// If both players are now present, it's p1's turn
	if (p1 && p2) {
		// Update the display with a green border around player 1
		$("#playerPanel1").addClass("playerPanelTurn");

		// Update the center display
		$("#waitingNotice").html("Waiting on " + p1Name + " to choose...");
	}

	// If both players leave the game, empty the chat session
	if (!p1 && !p2) {
		database.ref("/chat/").remove();
		database.ref("/turn/").remove();
		database.ref("/outcome/").remove();

		$("#chatDisplay").empty();
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		$("#roundOutcome").html("Rock-Paper-Scissors");
		$("#waitingNotice").html("");
	}
});

// Attach a listener that detects user disconnection events
database.ref("/players/").on("child_removed", function(snapshot) {
	var msg = snapshot.val().name + " has disconnected!";

	// Get a key for the disconnection chat entry
	var chatKey = database.ref().child("/chat/").push().key;

	// Save the disconnection chat entry
	database.ref("/chat/" + chatKey).set(msg);
});

// Attach a listener to the database /chat/ node to listen for any new chat messages
database.ref("/chat/").on("child_added", function(snapshot) {
	var chatMsg = snapshot.val();
	var chatEntry = $("<div>").html(chatMsg);

	// Change the color of the chat message depending on user or connect/disconnect event
	if (chatMsg.includes("disconnected")) {
		chatEntry.addClass("chatColorDisconnected");
	} else if (chatMsg.includes("joined")) {
		chatEntry.addClass("chatColorJoined");
	} else if (chatMsg.startsWith(yourPlayerName)) {
		chatEntry.addClass("chatColor1");
	} else {
		chatEntry.addClass("chatColor2");
	}

	$("#chatDisplay").append(chatEntry);
	$("#chatDisplay").scrollTop($("#chatDisplay")[0].scrollHeight);
});

// Attach a listener to the database /turn/ node to listen for any changes
database.ref("/turn/").on("value", function(snapshot) {
	// Check if it's p1's turn
	if (snapshot.val() === 1) {
		console.log("TURN 1");
		turn = 1;

		// Update the display if both players are in the game
		if (p1 && p2) {
			$("#playerPanel1").addClass("playerPanelTurn");
			$("#playerPanel2").removeClass("playerPanelTurn");
			$("#waitingNotice").html("Waiting on " + p1Name + " to choose...");
		}
	} else if (snapshot.val() === 2) {
		console.log("TURN 2");
		turn = 2;

		// Update the display if both players are in the game
		if (p1 && p2) {
			$("#playerPanel1").removeClass("playerPanelTurn");
			$("#playerPanel2").addClass("playerPanelTurn");
			$("#waitingNotice").html("Waiting on " + p2Name + " to choose...");
		}
	}
});

// Attach a listener to the database /outcome/ node to be notified of the game outcome
database.ref("/outcome/").on("value", function(snapshot) {
	$("#roundOutcome").html(snapshot.val());
});

/*
//
//  Button Events Section
//
*/

// Attach an event handler to the "Submit" button to add a new user to the database
$("#add-name").on("click", function(event) {
	event.preventDefault();

	// First, make sure that the name field is non-empty and we are still waiting for a player
	if ( ($("#name-input").val().trim() !== "") && !(p1 && p2) ) {
		// Adding p1
		if (p1 === null) {
			console.log("Adding Player 1");

			yourPlayerName = $("#name-input").val().trim();
			p1 = {
				name: yourPlayerName,
				win: 0,
				loss: 0,
				tie: 0,
				choice: ""
			};

			// Add player1 to the database
			database.ref().child("/players/p1").set(p1);


			// Set the turn value to 1, as player1 goes first
			database.ref().child("/turn").set(1);

			// If this user disconnects by closing or refreshing the browser, remove the user from the database
			database.ref("/players/p1").onDisconnect().remove();
		} else if( (p1 !== null) && (p2 === null) ) {
			// Adding player2
			console.log("Adding Player 2");

			yourPlayerName = $("#name-input").val().trim();
			p2 = {
				name: yourPlayerName,
				win: 0,
				loss: 0,
				tie: 0,
				choice: ""
			};

			// Add player2 to the database
			database.ref().child("/players/p2").set(p2);

			// If this user disconnects by closing or refreshing the browser, remove the user from the database
			database.ref("/players/p2").onDisconnect().remove();
		}

		// Add a user joining message to the chat
		var msg = yourPlayerName + " has joined!";
		console.log(msg);

		// Get a key for the join chat entry
		var chatKey = database.ref().child("/chat/").push().key;

		// Save the join chat entry
		database.ref("/chat/" + chatKey).set(msg);

		// Reset the name input box
		$("#name-input").val("");	
	}
});

// Attach an event handler to the chat "Send" button to append the new message to the conversation
$("#chat-send").on("click", function(event) {
	event.preventDefault();

	// First, make sure that the player exists and the message box is non-empty
	if ( (yourPlayerName !== "") && ($("#chat-input").val().trim() !== "") ) {
		// Grab the message from the input box and subsequently reset the input box
		var msg = yourPlayerName + ": " + $("#chat-input").val().trim();
		$("#chat-input").val("");

		// Get a key for the new chat entry
		var chatKey = database.ref().child("/chat/").push().key;

		// Save the new chat entry
		database.ref("/chat/" + chatKey).set(msg);
	}
});

// Monitor Player1's selection
$("#playerPanel1").on("click", ".panelOption", function(event) {
	event.preventDefault();

	// Make selections only when both players are in the game
	if (p1 && p2 && (yourPlayerName === p1.name) && (turn === 1) ) {
		// Record player1's choice
		var choice = $(this).text().trim();

		// Record the player choice into the database
		p1Choice = choice;
		database.ref().child("/players/p1/choice").set(choice);

		// Set the turn value to 2, as it is now player2's turn
		turn = 2;
		database.ref().child("/turn").set(2);
	}
});

// Monitor Player2's selection
$("#playerPanel2").on("click", ".panelOption", function(event) {
	event.preventDefault();

	// Make selections only when both players are in the game
	if (p1 && p2 && (yourPlayerName === p2.name) && (turn === 2) ) {
		// Record player2's choice
		var choice = $(this).text().trim();

		// Record the player choice into the database
		p2Choice = choice;
		database.ref().child("//p2/choice").set(choice);

		// Compare player1 and player 2 choices and record the outcome
		rpsCompare();
	}
});

// rpsCompare is the main rock/paper/scissors logic to see which player wins
function rpsCompare() {
	if (p1.choice === "Rock") {
		if (p2.choice === "Rock") {
			// Tie
			console.log("tie");

			database.ref().child("/outcome/").set("Tie game!");
			database.ref().child("/players/p1/tie").set(p1.tie + 1);
			database.ref().child("/players/p2/tie").set(p2.tie + 1);
		} else if (p2.choice === "Paper") {
			// Player2 wins
			console.log("paper wins");

			database.ref().child("/outcome/").set("Paper wins!");
			database.ref().child("/players/p1/loss").set(p1.loss + 1);
			database.ref().child("/players/p2/win").set(p2.win + 1);
		} else { // scissors
			// Player1 wins
			console.log("rock wins");

			database.ref().child("/outcome/").set("Rock wins!");
			database.ref().child("/players/p1/win").set(p1.win + 1);
			database.ref().child("/players/p2/loss").set(p2.loss + 1);
		}

	} else if (p1.choice === "Paper") {
		if (p2.choice === "Rock") {
			// Player1 wins
			console.log("paper wins");

			database.ref().child("/outcome/").set("Paper wins!");
			database.ref().child("/players/p1/win").set(p1.win + 1);
			database.ref().child("/players/p2/loss").set(p2.loss + 1);
		} else if (p2.choice === "Paper") {
			// Tie
			console.log("tie");

			database.ref().child("/outcome/").set("Tie game!");
			database.ref().child("/players/p1/tie").set(p1.tie + 1);
			database.ref().child("/players/p2/tie").set(p2.tie + 1);
		} else { // Scissors
			// Player2 wins
			console.log("scissors win");

			database.ref().child("/outcome/").set("Scissors win!");
			database.ref().child("/players/p1/loss").set(p1.loss + 1);
			database.ref().child("/players/p2/win").set(p2.win + 1);
		}

	} else if (p1.choice === "Scissors") {
		if (p2.choice === "Rock") {
			// p2 wins
			console.log("rock wins");

			database.ref().child("/outcome/").set("Rock wins!");
			database.ref().child("/players/p1/loss").set(p1.loss + 1);
			database.ref().child("/players/p2/win").set(p2.win + 1);
		} else if (p2.choice === "Paper") {
			// p1 wins
			console.log("scissors win");

			database.ref().child("/outcome/").set("Scissors win!");
			database.ref().child("/players/p1/win").set(p1.win + 1);
			database.ref().child("/players/p2/loss").set(p2.loss + 1);
		} else {
			// Tie
			console.log("tie");

			database.ref().child("/outcome/").set("Tie game!");
			database.ref().child("/players/p1/tie").set(p1.tie + 1);
			database.ref().child("/players/p2/tie").set(p2.tie + 1);
		}

	}

	// Reset to p1 turn
	turn = 1;
	database.ref().child("/turn").set(1);
}
