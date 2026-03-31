// Find our date picker inputs and button on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const button = document.querySelector('button');
const gallery = document.getElementById('gallery');

const apiKey = 'adItB2Y1qNGeO2c3gcxdDytJ5sL4wtBfppxGY5KV';

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Function to fetch images from NASA APOD API
async function fetchApodImages(startDate, endDate) {
  try {
    // Show that we're loading
    gallery.innerHTML = '<p>Loading cosmic images...</p>';

    // Build the API URL with our parameters
    const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;

    // Fetch the data from NASA's API
    const response = await fetch(url);

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    // Convert the response to JSON format
    const images = await response.json();

    // Display the images in our gallery
    displayImages(images);
  } catch (error) {
    // If something went wrong, show an error message
    gallery.innerHTML = `<p style="color: red;">Error loading images: ${error.message}</p>`;
  }
}

// Function to display the images in the gallery
function displayImages(images) {
  // Clear the gallery
  gallery.innerHTML = '';

  // Loop through each image and create HTML for it
  images.forEach(image => {
    // Create a container for each item
    const imageCard = document.createElement('div');
    imageCard.className = 'gallery-item';

    // Check if this is a video or an image
    if (image.media_type === 'video') {
      // For videos, create a thumbnail by extracting the YouTube video ID
      const thumbnailUrl = getYouTubeThumbnail(image.url);
      
      // Add a video badge to show it's a video
      imageCard.innerHTML = `
        <div class="media-container video-container">
          <img src="${thumbnailUrl}" alt="${image.title}" class="video-thumbnail" />
          <div class="video-badge">▶ VIDEO</div>
        </div>
        <h3>${image.title}</h3>
        <p style="font-size: 0.9em; color: gray;">${image.date}</p>
      `;
      
      // Add error handling if the thumbnail fails to load
      const imgElement = imageCard.querySelector('.video-thumbnail');
      imgElement.addEventListener('error', () => {
        // If thumbnail fails, show a fallback color with text
        imgElement.style.display = 'none';
        const container = imageCard.querySelector('.video-container');
        container.style.backgroundColor = '#1a1a1a';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.minHeight = '220px';
      });
    } else {
      // For regular images, display normally
      imageCard.innerHTML = `
        <img src="${image.url}" alt="${image.title}" />
        <h3>${image.title}</h3>
        <p style="font-size: 0.9em; color: gray;">${image.date}</p>
      `;
    }

    // When someone clicks on a gallery item, open the modal
    imageCard.addEventListener('click', () => {
      openModal(image);
    });

    // Add the card to the gallery
    gallery.appendChild(imageCard);
  });
}

// Function to extract YouTube video ID and get thumbnail
function getYouTubeThumbnail(url) {
  // Extract the video ID from YouTube URL using regex
  // This handles multiple YouTube URL formats
  let videoId = '';
  
  // Try to match youtube.com/embed/VIDEO_ID format
  let match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (match) {
    videoId = match[1];
  } else {
    // Try to match youtube.com/watch?v=VIDEO_ID format
    match = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (match) {
      videoId = match[1];
    } else {
      // Try to match youtu.be/VIDEO_ID format
      match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      if (match) {
        videoId = match[1];
      }
    }
  }

  // If we found a video ID, return the thumbnail URL
  // Try high quality first, with fallbacks to other qualities
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  
  // Fallback: return a default placeholder if we can't extract the ID
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23000" width="200" height="150"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-size="16" font-family="Arial"%3EVIDEO%3C/text%3E%3C/svg%3E';
}

// Function to open the modal and show the full image or video details
function openModal(image) {
  // Create or get the modal
  let modal = document.getElementById('imageModal');

  // If the modal doesn't exist yet, create it
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.className = 'modal hidden';
    document.body.appendChild(modal);
  }

  // Build the media content based on type
  let mediaContent = '';
  if (image.media_type === 'video') {
    // For videos, embed an iframe
    mediaContent = `
      <div class="modal-video-container">
        <iframe 
          src="${image.url}" 
          title="${image.title}" 
          class="modal-video"
          allowfullscreen
          allow="autoplay">
        </iframe>
      </div>
    `;
  } else {
    // For images, display normally
    mediaContent = `
      <img src="${image.url}" alt="${image.title}" class="modal-image" />
    `;
  }

  // Fill the modal with the image or video data
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <button class="modal-close">✕</button>
      ${mediaContent}
      <h2>${image.title}</h2>
      <p class="modal-date">${image.date}${image.media_type === 'video' ? ' • VIDEO' : ''}</p>
      <p class="modal-explanation">${image.explanation}</p>
    </div>
  `;

  // Remove the hidden class to show the modal
  modal.classList.remove('hidden');

  // Close modal when clicking the close button
  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.addEventListener('click', closeModal);

  // Close modal when clicking the overlay (outside the content)
  const overlay = modal.querySelector('.modal-overlay');
  overlay.addEventListener('click', closeModal);
}

// Function to close the modal
function closeModal() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Close modal when pressing the Escape key
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

// When the user clicks the button, fetch images for the selected date range
button.addEventListener('click', () => {
  const startDate = startInput.value;
  const endDate = endInput.value;

  // Make sure both dates have been selected
  if (!startDate || !endDate) {
    alert('Please select both a start and end date');
    return;
  }

  // Fetch and display the images
  fetchApodImages(startDate, endDate);
});
