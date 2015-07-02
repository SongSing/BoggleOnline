var socket;
var words = [];
var timerTime = 0;
var timer;

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

function submitWord()
{
	var word = $("#input").get(0).value;
	
	if (word.length < 3)
	{
		return;
	}
	
	$("#input").get(0).value = "";
	var d = document.createElement("div");
	$(d).text(word);
	$("#words").append(d)
	
	words.push(word);
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

		var playing = data;

		// setup accordingly
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
		$("#player" + data).remove();
	}
	else if (command === "start")
	{
		notify(data.player + " has started a game of Boggle! Starts in " + data.wait + " seconds!");;
		words = [];
		setTimer(5);
	}
	else if (command === "board")
	{
		$("#start").hide();
		$("#board").show();
		words = [];
		for (var i = 0; i < 16; i++)
		{
			$("#b" + (i + 1)).text(data[i].toUpperCase());
		}
		setTimer(3 * 60);
	}
	else if (command === "end")
	{
		socket.send("words", words)
	}
	else if (command === "winner")
	{
		alert("Winner(s): " + data.players.join(", "));
		
		$("#start").show();
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

	var name = $("#name").get(0).value;
	var room = $("#room").get(0).value;
	var ip = $("#ip").get(0).value;
	var port = $("#port").get(0).value;

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