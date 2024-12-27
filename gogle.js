const express = require('express');
const rateLimit = require('express-rate-limit');
const { addDoc, collection } = require('firebase/firestore');
const { db } = require('./firebase'); // Assuming you have a Firebase instance

const app = express();
app.use(express.json());

// Rate limiting to prevent brute force or spam clicks
const clickLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});

// Function to generate a device fingerprint (you can adjust it as needed)
function generateDeviceFingerprint(req) {
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip;
  const deviceInfo = { userAgent, ipAddress };
  
  // You can add more unique identifiers here (like screen resolution, language)
  return `${userAgent}:${ipAddress}`; // Simplified for demo
}

app.post('/record-click', clickLimiter, async (req, res) => {
  const { pubId, offerId, timestamp } = req.body;
  const ipAddress = req.ip; // Capture the IP address
  const deviceFingerprint = generateDeviceFingerprint(req); // Generate a fingerprint

  try {
    // Save the click data to Firestore
    await addDoc(collection(db, 'clicks'), {
      pubId,
      offerId,
      timestamp,
      ipAddress,
      deviceFingerprint,
    });
    
    res.status(200).json({ success: 'Click recorded' });
  } catch (error) {
    console.error('Error recording click:', error);
    res.status(500).json({ error: 'Error recording click' });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
