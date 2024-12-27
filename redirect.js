// Function to extract query parameters from a given URL
function getQueryParamFromURL(url, param) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    return urlParams.get(param);
  }
  
  // Identify the <script> tag dynamically and extract the 'data-user' parameter
  const currentScript = document.querySelector('script[src*="redirect.js"]');
  const pubId = currentScript ? getQueryParamFromURL(currentScript.src, 'data-user') : null;
  
  // Function to fetch the offer data based on the pubId
  async function fetchOfferData(pubId) {
    if (!pubId) {
      console.error("Missing pubId parameter.");
      return { redirectUrl: "https://default-url.com", buttonLabel: "Click Here" }; // Fallback
    }
  
    try {
      // Fetch offer data from the server using pubId
      const response = await fetch(`http://localhost:5000/test-button?pubId=${encodeURIComponent(pubId)}`);
      if (response.ok) {
        const scriptContent = await response.text(); // Get the script content
        eval(scriptContent); // Dynamically evaluate the script returned by the server
      } else {
        console.error("Failed to fetch offer data. Status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching offer data:", error);
    }
  }
  
  // Fetch and execute the script for the given pubId
  (async function() {
    await fetchOfferData(pubId);
  })();
  