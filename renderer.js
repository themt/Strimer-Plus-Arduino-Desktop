// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { SerialPort } = require('serialport')
const tableify = require('tableify')

async function listSerialPorts() {
  await SerialPort.list().then((ports, err) => {
    if(err) {
      document.getElementById('error').textContent = err.message
      return
    } else {
      document.getElementById('error').textContent = ''
    }
    console.log('ports', ports);

    if (ports.length === 0) {
      document.getElementById('error').textContent = 'No ports discovered'
    }

    tableHTML = tableify(ports)
    document.getElementById('ports').innerHTML = tableHTML
  })
}

function listPorts() {
  listSerialPorts();
  setTimeout(listPorts, 2000);
}

// Set a timeout that will check for new serialPorts every 2 seconds.
// This timeout reschedules itself.
setTimeout(listPorts, 2000);

listSerialPorts()

var portList = SerialPort.list();

portList.then((r) => {
console.log ("list 1", r);
})

console.log ("list", portList);

// Create a port
const port = new SerialPort({
  path: '/dev/tty.wchusbserial1450',
  baudRate: 9600,
  autoOpen: false,
})

port.open(function (err) {
  if (err) {
    document.getElementById("status").innerHTML = err.message;
    return console.log('Error opening port: ', err.message)
  }

  // Because there's no callback to write, write errors will be emitted on the port:
  port.write('main screen turn on')
})

port.on('data', data =>{
  console.log('got word from arduino:', data.toString());
});

port.write ('-color 00FF00\n');

function serialWrite (line) {
  console.log ("serialWrtite "+ line +"\n");
  port.write(line + '\n');
}

//port.write('-color 00FF00')


