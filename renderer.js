const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
const jQuery = require('jquery')

function delay(delayInms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
  });
}

var lastReaded = "";

const connectionStatusDom = jQuery('#connectionStatus');
const connectionButtonDom = jQuery('#connectButton');
const customizeTabDom = jQuery('#customizeTab');
const portListDom = jQuery("#portList");
const messageDom = jQuery('#msg');

messageDom.keydown((e) => {
  if(['|'].indexOf(e.key) === -1){

  } else {
    e.preventDefault();
  }
});

async function listPorts() {

  connectionStatusDom.html("Pick a com port and connect");
  const listingListItem = jQuery('<li class="uk-text-center">Listing...</li>');

  portListDom.html(listingListItem);

  await delay(1000);

  await SerialPort.list().then((ports, err) => {
    if (err) {
      portListDom.html('<li class="uk-text-center">' + err.message + '</li>');
      return
    }

    if (ports.length === 0) {
      portListDom.html('<li class="uk-text-center">Not found</li>');
    }

    portListDom.empty();

    for (var i = 0; i < ports.length; i++) {
      
      var node = jQuery('<li class="uk-text-center" style="cursor: pointer"><div first></div><div second class="uk-text-meta"></div></li>');
      var port = ports[i];
      function x(node, port) {
        node.click(() => setPort(node, port));
        node.find('[first]').html(port.path);
        node.find('[second]').html(port.friendlyName);
        portListDom.append(node);
      }

      x(node, port);

    }

  })
}

function setPort(node, port) {
  portListDom.find('li').removeClass('uk-text-primary');
  node.addClass('uk-text-primary');
  selectedPort = port;
}

listPorts()

var selectedPort = null;
var port;
var deviceCheckOK = false;

async function disconnectPort(showMessage = true) {
  if (port !== undefined && port.isOpen) {
    deviceCheckOK = false;
    port.close();
    customizeTabDom.addClass('uk-disabled');
    if (showMessage) connectionStatusDom.html("Disconnected");
  }
}

async function connectPort() {

  if (selectedPort !== null) {

    connectionStatusDom.html("Connecting...");

    if (port !== undefined && port.isOpen) {
      deviceCheckOK = false;
      port.close();
      customizeTabDom.addClass('uk-disabled');
      await delay(1000);
    }

    port = new SerialPort({
      path: selectedPort.path,
      baudRate: 9600,
      autoOpen: false,
      //parser: new ReadlineParser('\n'),
    });

    
    port.open(function (err) {
      if (err) {
        connectionStatusDom.html("Connection fail");
        document.getElementById("status").innerHTML = err.message;
        return;
      }

      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))

      connectionStatusDom.html("Checking device...");

      var checkDeviceTimeout = setTimeout(function () {
        connectionStatusDom.html("Device not found");
        disconnectPort(false);
      }, 4000);

      
    
      parser.on('data', data => {

        var readline = data.toString();

        if (deviceCheckOK == false) {
          if (readline.indexOf("Strimer Plus Arduino") > -1) {
            deviceCheckOK = true;
            clearTimeout(checkDeviceTimeout);
            var splittedCommands = readline.split("|");
            for (var i=0; i<splittedCommands.length; i++) {
              var keyValue = splittedCommands[i].split(':');
              if (keyValue[0] == 'msg') {
                jQuery('#msg').val(keyValue[1]);
              } else if (keyValue[0] == 'delay') {
                jQuery('#delay').val(keyValue[1]);
              } else if (keyValue[0] == 'bri') {
                jQuery('#bri').val(keyValue[1]);
              } else if (keyValue[0] == 'color') {
                var color = '#'+parseInt(keyValue[1]).toString(16); 
                jQuery('#color').val(color);
              } else if (keyValue[0] == 'bgcolor') {
                var color = '#'+parseInt(keyValue[1]).toString(16); 
                jQuery('#bgcolor').val(color);
              } else if (keyValue[0] == 'inv') {
                if (keyValue[1] == '1') {
                  jQuery('#inv-1').prop("checked", true);
                } else {
                  jQuery('#inv-0').prop("checked", true);
                }
                  
              }

            }

            customizeTabDom.removeClass("uk-disabled");
            connectionStatusDom.html("Connected");
            UIkit.switcher(jQuery('#tabs').get(0)).show(1);
          }
        }

        lastReaded = readline;
      });
    });
  }
}

var dontFlood = false;
var lastLine = "";


async function serialWrite(line, checkOK = true) {

  lastLine = line;

  if (dontFlood) return;

  dontFlood = true;

  setTimeout(async function () {

    dontFlood = false;

    if (port !== undefined && port.isOpen) {

      lastReaded = "";

      var result = await port.write(lastLine + '\n');

      await delay(250);

      if (!result) {
        customizeTabDom.addClass('uk-disabled');
        connectionStatusDom.html("Please make connect");
        UIkit.switcher(jQuery('#tabs').get(0)).show(0);
      } else if (checkOK && lastReaded.indexOf("OK") == -1) {
        customizeTabDom.addClass('uk-disabled');
        connectionStatusDom.html("Device not found");
        UIkit.switcher(jQuery('#tabs').get(0)).show(0);
      }
    }

    else {
      customizeTabDom.addClass('uk-disabled');
      connectionStatusDom.html("Please make connect");
      UIkit.switcher(jQuery('#tabs').get(0)).show(0);
    }
  }, 500)


}