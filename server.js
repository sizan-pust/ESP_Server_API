// const express = require('express');
// const app = express();
// app.use(express.json());

// // In-memory state for ONE device (you can extend this later)
// let deviceState = {
//   led: 'OFF',
//   lastUpdated: Date.now(),
// };

// // Flutter -> set state
// app.post('/api/device/state', (req, res) => {
//   const { led } = req.body;

//   if (led !== 'ON' && led !== 'OFF') {
//     return res.status(400).json({ error: 'led must be ON or OFF' });
//   }

//   deviceState.led = led;
//   deviceState.lastUpdated = Date.now();

//   console.log('New device state from Flutter:', deviceState);
//   res.json({ ok: true, deviceState });
// });

// // ESP32 -> read state
// app.get('/api/device/state', (req, res) => {
//   res.json(deviceState);
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store connected ESP32 devices
const connectedDevices = new Map();

// REST API endpoints
app.post('/api/command', (req, res) => {
  const { deviceId, command } = req.body;
  
  if (connectedDevices.has(deviceId)) {
    const deviceSocket = connectedDevices.get(deviceId);
    deviceSocket.emit('command', command);
    res.json({ success: true, message: 'Command sent' });
  } else {
    res.status(404).json({ success: false, message: 'Device not connected' });
  }
});

app.get('/api/devices', (req, res) => {
  const devices = Array.from(connectedDevices.keys());
  res.json({ devices });
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // ESP32 devices identify themselves
  socket.on('register', (deviceId) => {
    connectedDevices.set(deviceId, socket);
    console.log(`ESP32 registered: ${deviceId}`);
    
    socket.emit('registered', { status: 'success' });
  });

  // Handle commands from ESP32
  socket.on('sensor_data', (data) => {
    io.emit('sensor_update', data);
  });

  socket.on('disconnect', () => {
    // Remove from connected devices
    for (let [deviceId, deviceSocket] of connectedDevices.entries()) {
      if (deviceSocket.id === socket.id) {
        connectedDevices.delete(deviceId);
        console.log(`ESP32 disconnected: ${deviceId}`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});