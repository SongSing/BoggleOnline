// socket.js is by SongSing and is a good time
// var s = new Socket(4334.5464.43243, 9999);
// s.onMessage = function (msg) { console.log(Socket.unpack(msg).data); }
// s.connect();
// s.sendCommand("kill", "pup");

function Socket(ip, port)
{
    this.socket = undefined;
    this.ip = ip;
    this.port = port;
    
    this.onOpen = function()
    {
        console.log("Opened");
    };
    
    this.onMessage = function(msg)
    {
        console.log("Received: " + msg);
    };
    
    this.onClose = function()
    {
        console.log("Closed");
    };
    
    this.onError = function(e)
    {
        console.log("Error: " + e.data);  
    };
}

Socket.prototype.connect = function()
{
    var self = this;
    this.socket = new WebSocket("ws://" + this.ip + ":" + this.port);
    
    this.socket.onmessage = function(e)
    {
        self.onMessage(e.data);
    };
    
    this.socket.onopen = this.onOpen;
    this.socket.onclose = this.onClose;
    this.socket.onerror = this.onError;
}

Socket.prototype.sendRaw = function(data)
{
    this.socket.send(data);
};

Socket.prototype.sendCommand = function(command, data)
{
    var toSend = command + "|" + JSON.stringify(data);
    this.sendRaw(toSend);
};

Socket.prototype.send = function(command, data)
{
    this.sendCommand(command, data);  
};

Socket.prototype.isOpen = function()
{
    return (this.readyState === 1);
};

Socket.prototype.close = function()
{
    this.socket.close();
};

Socket.unpack = function(d)
{
    var command, data;
    
    if (d.indexOf("|") === -1)
    {
        command = undefined;
        data = JSON.parse(d);
    }
    else
    {
        command = d.substr(0, d.indexOf("|"));
        data = JSON.parse(d.substr(d.indexOf("|") + 1));
    }
    
    return { "command": command, "data": data };
};