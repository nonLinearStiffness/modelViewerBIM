import "leaflet";
import "./main.css";

const app = document.getElementById("app");

let leafletMap = null;
let locations = [];
let mapCenter = null;
let mapZoom = null;

async function fetchModelData() {
  const res = await fetch("models.json");
  if (!res.ok) throw new Error("Failed to load model data");
  return res.json();
}

// Red marker icon (public domain, from https://github.com/pointhi/leaflet-color-markers)
const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Example: Custom building icon (uncomment and use if you want a building image)
const buildingIcon = new L.Icon({
  iconUrl: "public/bim.png",
  iconSize: [48, 48], // Increased size
  iconAnchor: [24, 48], // Adjust anchor to match new size
});

// Function to locate the user and center the map
function locateUser(controlBtn) {
  // Try to locate the user using Geolocation API. Will fire either "locationfound" or "locationerror".
  leafletMap.locate({
    setView: true,
    maxZoom: 14,
    enableHighAccuracy: true,
  });

  // If location was found, then applies the location point.
  leafletMap.once("locationfound", (e) => {
    const radius = e.accuracy;

    L.marker(e.latlng).addTo(leafletMap).bindPopup("You are here").openPopup();

    L.circle(e.latlng, radius).addTo(leafletMap);

    if (controlBtn) {
      controlBtn.disabled = false;
      controlBtn.title = "Center on Me";
    }
  });

  // If there was an error, location defaults to map center.
  leafletMap.once("locationerror", (e) => {
    console.warn("Location failed:", e.message);
    leafletMap.setView([51.505, -0.09], 13);

    if (controlBtn) {
      controlBtn.disabled = true;
      controlBtn.title = "Location unavailable";
    }
  });
}

// Function to add the markers for each location
function addLocationMarkers() {
  locations.forEach((loc) => {
    // Use buildingIcon for a custom building image
    const marker = L.marker(loc.coords, { icon: buildingIcon }).addTo(leafletMap);
    marker.on("click", () => goToAR(loc.id));
  });
}

function goToAR(id) {
  if (leafletMap) {
    mapCenter = leafletMap.getCenter();
    mapZoom = leafletMap.getZoom();
  }
  location.hash = `#/ar/${id}`;
}

function showDisclaimer(show) {
  const banner = document.getElementById("disclaimer-banner");
  const instructions = document.getElementById("map-instruction");
  if (banner) banner.style.display = show ? "block" : "none";
  if (instructions) instructions.style.display = show ? "block" : "none";
}

function renderARView(id) {
  showDisclaimer(false);
  const loc = locations.find((l) => l.id === id);
  if (!loc) return renderNotFound();

  app.innerHTML = `
    <div id="ar-view" style="position:relative; min-height:80vh;">
      <button class="btn" onclick="location.hash = '#'" style="margin-bottom: 1rem;">← Back to Map</button>
      <model-viewer
        src="${loc.modelUrl}"
        alt="3D model of ${loc.name}"
        ar
        ar-modes="scene-viewer quick-look webxr"
        autoplay
        camera-controls
        ar-scale="fixed"
        max-field-of-view="180deg"
        style="width:100%; max-width:600px; height:60vh; display:block; margin:0 auto;"
      ></model-viewer>
      <div style="
        position: absolute;
        left: 50%;
        bottom: 125px;
        transform: translateX(-50%);
        background: rgba(255,255,255,0.95);
        color: #0e0e0e;
        padding: 5px 12px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        font-size: 1rem;
        z-index: 1000;
        border: 2px solid #888;
        font-weight: bold;
        text-align: center;">
        Tap the button to view the model in Augmented Reality.
      </div>
    </div>
  `;
}

function renderMapView() {
  showDisclaimer(true);
  app.innerHTML = `<div id="map" style="height: 100%"></div>`;

  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
  }

  // Initialize the map
  leafletMap = L.map("map");

  // Add OpenStreetMap tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(leafletMap);

  // Define the map start origin and zoom level
  const center = mapCenter || [41.149819, -8.628316]; // You can adjust these coordinates for a more precise center
  const zoom = mapZoom || 18; // Increased zoom for a closer view
  leafletMap.setView(center, zoom);

  // Add the location markers
  addLocationMarkers();

  // Add custom control again
  const centerControl = L.control({ position: "bottomright" });
  centerControl.onAdd = function (map) {
    const btn = L.DomUtil.create("button", "leaflet-bar center-control");
    btn.textContent = "📍";
    btn.title = "Center on Me";
    L.DomEvent.disableClickPropagation(btn);
    btn.addEventListener("click", () => locateUser(btn));
    return btn;
  };
  centerControl.addTo(leafletMap);
}

function renderNotFound() {
  app.innerHTML = `
    <div style="padding: 2rem; text-align: center;">
      <h2>404 - Page Not Found</h2>
      <a href="#">Back to Home</a>
    </div>
  `;
}

function router() {
  const hash = location.hash || "#";
  const match = hash.match(/^#\/ar\/(\d+)$/);

  if (hash === "#") {
    renderMapView();
  } else if (match) {
    renderARView(match[1]);
  } else {
    renderNotFound();
  }
}

async function init() {
  try {
    locations = await fetchModelData();
    router(); // render initial view
    window.addEventListener("hashchange", router);
  } catch (err) {
    console.error(err);
    renderNotFound();
  }
}

init();