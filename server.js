const express = require('express');
const app = express();
app.use(express.json());

// In-memory state for ONE device (you can extend this later)
let deviceState = {
  led: 'OFF',
  lastUpdated: Date.now(),
};

// Flutter -> set state
app.post('/api/device/state', (req, res) => {
  const { led } = req.body;

  if (led !== 'ON' && led !== 'OFF') {
    return res.status(400).json({ error: 'led must be ON or OFF' });
  }

  deviceState.led = led;
  deviceState.lastUpdated = Date.now();

  console.log('New device state from Flutter:', deviceState);
  res.json({ ok: true, deviceState });
});

// ESP32 -> read state
app.get('/api/device/state', (req, res) => {
  res.json(deviceState);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
