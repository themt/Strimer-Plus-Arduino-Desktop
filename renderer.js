// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { SerialPort } = require('serialport')
const tableify = require('tableify')
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
const portListDom = jQuery("#portList");

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
      var r = ports[i];
      node.click(() => setPort(node, r));
      node.find('[first]').html(ports[i].path);
      node.find('[second]').html(ports[i].friendlyName);
      portListDom.append(node);
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

async function disconnectPort() {
  if (port !== undefined && port.isOpen) {
    deviceCheckOK = false;
    port.close();
    connectionStatusDom.html("Disconnected");
  }
}

async function connectPort() {

  if (selectedPort !== null) {

    connectionStatusDom.html("Connecting...");

    if (port !== undefined && port.isOpen) {
      deviceCheckOK = false;
      port.close();
      await delay(1000);
    }

    port = new SerialPort({
      path: selectedPort.path,
      baudRate: 9600,
      autoOpen: false,
      parser: new Readline("\r\n"),
    });

    port.open(function (err) {
      if (err) {
        connectionStatusDom.html("Connection fail");
        document.getElementById("status").innerHTML = err.message;
        return;
      }

      console.log(port);

      connectionStatusDom.html("Checking device...");

      port.on('data', data => {
        if (deviceCheckOK == false) {
          if (data.toString().indexOf("Strimer Plus Arduino") > -1) {
            deviceCheckOK = true;
            connectionStatusDom.html("Done");
            UIkit.switcher(jQuery('#tabs').get(0)).show(1);
          }
        }

        console.log ("read", data.toString());

        lastReaded = data.toString();
      });
    });
  }
}


async function serialWrite(line) {
  if (port !== undefined && port.isOpen) {

    lastReaded = "";

    var result = await port.write(line + '\n');

    await delay(1000);

    if (!result) {
      connectionStatusDom.html("Please make connect");
      UIkit.switcher(jQuery('#tabs').get(0)).show(0);
    } else if (lastReaded.indexOf("OK") == -1) {
      connectionStatusDom.html("Device not found");
      UIkit.switcher(jQuery('#tabs').get(0)).show(0);
    }
  }

  else {
    connectionStatusDom.html("Please make connect");
    UIkit.switcher(jQuery('#tabs').get(0)).show(0);
  }
}