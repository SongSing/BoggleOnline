var socket;
var words = [];
var timerTime = 0;
var timer;
var gameLength = 0;
var chatSwitch = false;
var lastChat = "";

function init()
{
	$("#joinGame").click(function()
	{
		joinGame(false);
	});

	$("#createGame").click(function()
	{
		joinGame(true);
	});
	
	$("#submit").click(submitWord);
	
	$("#input").keypress(function(e)
	{
		if (e.which === 13)
		{
			submitWord();
		}
	});
	
	$("#sendChat").click(sendChat);
	
	$("#chatInput").keypress(function(e)
	{
		if (e.which === 13)
		{
			sendChat();
		}
	});
	
	$("#start").click(function()
	{
		socket.send("start", "");
	});
	
	if (Notification)
	{
		if (Notification.permission !== "granted")
		{
			Notification.requestPermission();
		}
	}
	else
	{
		alert("Your browser doesn't support desktop notifications. Sucks!");
	}
}

function notify(message)
{
	if (Notification)
	{
		if (Notification.permission === "granted")
		{
			var n = new Notification("Boggle Online",
			{
				body: message
			});
		}
		else
		{
			Notification.requestPermission();
			alert(message);
		}
	}
	else
	{
		alert(message);
	}
}

function setTimer(seconds)
{
	clearInterval(timer);
	timerTime = seconds;
	
	var f = function()
	{
		if (timerTime > 0)
		{
			var str = parseInt(timerTime / 60) + ":";
			var secs = (timerTime % 60).toString();
			str += (secs.length === 1 ? "0" : "") + secs;
			
			$("#timer").text(str);
			timerTime--;
		}
		else
		{
			clearInterval(timer);
		}
	}
	
	timer = setInterval(f, 1000);
	f();
}

function escapeHtml(x)
{
	var map =
	{
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;",
		"/": "&#x2F;",
		"\"": "&92;"
	};
	
	for (var thing in map)
	{
		x = x.replace(new RegExp(thing, "g"), map[thing]);
	}
	
	return x;
}

function submitWord()
{
	var word = $("#input").val().toLowerCase();
	
	if (word.length < 3 || word.length > 17)
	{
		return;
	}
	
	$("#input").val("");
	var d = document.createElement("div");
	$(d).text(word);
	$("#words").append(d);
	$("#words").get(0).scrollTop = $("#words").get(0).scrollHeight;
	
	words.push(word);
}

function sendChat()
{
	var msg = $("#chatInput").val();
	
	if (msg.length < 1)
	{
		return;
	}
	
	$("#chatInput").val("");
	socket.send("chat", msg);
}

function initSocket(ip, port)
{
	socket = new Socket(ip, port);
	socket.onMessage = handleMessage;
}

function handleMessage(msg)
{
	var m = Socket.unpack(msg);
	var command = m.command;
	var data = m.data;
	console.log(msg);

	if (command === "joinFailed")
	{
		alert("Failed to join.\r\n" + data.toString());
	}
	else if (command === "join")
	{
		$("#setup").hide();
		$("#game").show();

		var playing = data.playing;
		gameLength = data.gameLength;
		
		$("#start").text("Start Game (" + gameLength + "s)");

		// setup accordingly
		// nothing to do here atm, since you can't join games that are in progress
	}
	else if (command === "players")
	{
		var players = data;
		var divs = [];

		for (var i = 0; i < players.length; i++)
		{
			var d = document.createElement("div");
			d.id = "player" + players[i];
			$(d).text(players[i]);
			$("#players").append(d);
		}
	}
	else if (command === "addPlayer")
	{
		var d = document.createElement("div");
		d.id = "player" + data;
		$(d).text(data);
		$("#players").append(d);
	}
	else if (command === "removePlayer")
	{
		console.log("removing " + data);
		$("#player" + data).remove();
	}
	else if (command === "start")
	{
		$("#start").hide();
		$("#words").empty();
		$("#results").empty();
		
		notify(data.player + " has started a game of Boggle! Starts in " + data.wait + " seconds!");;
		words = [];
		setTimer(data.wait);
		gameLength = data.length;
	}
	else if (command === "board")
	{
		setTimer(gameLength);
		$("#board").show();
		words = [];
		for (var i = 0; i < 16; i++)
		{
			$("#b" + (i + 1)).text(data[i].toUpperCase());
		}
	}
	else if (command === "end")
	{
		socket.send("words", words);
	}
	else if (command === "winner")
	{	
		var fib = [ 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597 ];
		var winners = data.players;
		var scores = data.scores;
		var pwords = data.words;
		var dups = data.duplicates;
		
		dups = dups.map(function (item)
		{
			var h = words.indexOf(item) !== -1;
			item = escapeHtml(item);
			
			if (h)
			{
				item = "<b>" + item + "</b>";
			}
			
			return item;
		});
		
		$("#results").html("Winner(s): " + escapeHtml(winners.join(", ")) + "<hr />");
		
		for (var p in pwords)
		{
			pwords[p] = pwords[p].map(function(item)
			{
				return item + " (" + fib[item.length - 2] + ")";
			});
			
			var div = document.createElement("div");
			div.className = "result";
			
			var d = $(div);
			d.text("");
			
			var won = winners.indexOf(p) !== -1;
			console.log(winners);
			console.log(p);
			console.log(won);
			
			d.html((won ? "<b>" : "") + escapeHtml(p) + (won ? "</b>" : "") + "<br />"
				+ "Words: " + escapeHtml(pwords[p].join(", ")) + "<br />"
				+ "Score: " + scores[p] + "<hr />");
			
			$("#results").append(d);
		}
		
		var ddiv = document.createElement("div");
		var dd = $(ddiv);
		
		dd.html("Duplicated words (not counted): " + dups.join(", ") + "<hr />");
		
		$("#results").append(dd);
		
		$("#start").show();
	}
	else if (command === "chat")
	{
		var player = data.player;
		var msg = data.message;
		
		var d = document.createElement("div");
		$(d).html((player === lastChat ? "" : "<b>" + escapeHtml(player) + ":</b> ") + escapeHtml(msg));
		d.className = "chatMessage";
		
		if (player !== lastChat)
		{
			chatSwitch = !chatSwitch;
		}
		
		d.className += " " + (chatSwitch ? "a" : "b");
		d.title = player;
		
		lastChat = player;
		
		$("#chat").append(d);
		$("#chat").get(0).scrollTop = $("#chat").get(0).scrollHeight;
	}
}

function joinGame(creating)
{
	if (socket)
	{
		if (socket.isOpen())
		{
			socket.close();
		}
	}

	var name = $("#name").val();
	var room = $("#room").val();
	var ip = $("#ip").val();
	var port = $("#port").val();
	var length = $("#length").val();

	if (name.length === 0)
	{
		alert("Need a name!");
		return;
	}

	if (room.length === 0)
	{
		alert("Need a room!");
		return;
	}

	if (ip.length === 0)
	{
		alert("Need a server IP address!");
		return;
	}

	if (port.toString().length === 0)
	{
		alert("Need a port!");
		return;
	}

	var info = {};
	info.name = name;
	info.room = room;
	info.creating = creating;
	info.gameLength = length;

	initSocket(ip, port);

	socket.onOpen = function()
	{
		socket.onClose = function() { console.log("closed"); };
		socket.sendCommand("join", info);
	};

	socket.onError = function()
	{
		alert("Connection lost. Make sure your info is valid.");
	};

	socket.connect();
}