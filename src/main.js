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
    const marker = L.marker(loc.coords).addTo(leafletMap);

    const popupContent = `
      <strong>${loc.name}</strong><br>
      <button class="enter-ar-btn" data-id="${loc.id}">Enter AR</button>
    `;

    marker.bindPopup(popupContent);

    // Add event listener when the popup is opened
    marker.on("popupopen", (e) => {
      const popupEl = e.popup.getElement();
      const btn = popupEl.querySelector(".enter-ar-btn");
      if (btn) {
        btn.addEventListener("click", () => goToAR(loc.id));
      }
    });
  });
}

function goToAR(id) {
  if (leafletMap) {
    mapCenter = leafletMap.getCenter();
    mapZoom = leafletMap.getZoom();
  }
  location.hash = `#/ar/${id}`;
}

function renderARView(id) {
  const loc = locations.find((l) => l.id === id);
  if (!loc) return renderNotFound();

  app.innerHTML = `
    <div id="ar-view">
      <button class="btn" onclick="location.hash = '#'">← Back to Map</button>
      <model-viewer
        src="${loc.modelUrl}"
        alt="3D model of ${loc.name}"
        ar
        ar-modes="webxr scene-viewer quick-look"
        autoplay
        camera-controls
        ar-scale="fixed"
        max-field-of-view="180deg"
      ></model-viewer>
    </div>
  `;
}

function renderMapView() {
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
  const center = mapCenter || [41.149819, -8.628316];
  const zoom = mapZoom || 13;
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