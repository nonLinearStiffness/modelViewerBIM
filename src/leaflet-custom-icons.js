import "leaflet";
import "./main.css";

const app = document.getElementById("app");

let leafletMap = null;
let locations = [];
let mapCenter = null;
let mapZoom = null;

// Red marker icon (public domain, from https://github.com/pointhi/leaflet-color-markers)
const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Example: Custom building icon (replace with your own if desired)
// const buildingIcon = new L.Icon({
//   iconUrl: "./public/ic_view_in_ar_new_googblue_48dp.png", // Example path
//   iconSize: [32, 32],
//   iconAnchor: [16, 32],
// });

async function fetchModelData() {
  const res = await fetch("models.json");
  if (!res.ok) throw new Error("Failed to load model data");
  return res.json();
}

function locateUser(controlBtn) {
  leafletMap.locate({
    setView: true,
    maxZoom: 14,
    enableHighAccuracy: true,
  });
  leafletMap.once("locationfound", (e) => {
    const radius = e.accuracy;
    L.marker(e.latlng).addTo(leafletMap).bindPopup("You are here").openPopup();
    L.circle(e.latlng, radius).addTo(leafletMap);
    if (controlBtn) {
      controlBtn.disabled = false;
      controlBtn.title = "Center on Me";
    }
  });
  leafletMap.once("locationerror", (e) => {
    console.warn("Location failed:", e.message);
    leafletMap.setView([51.505, -0.09], 13);
    if (controlBtn) {
      controlBtn.disabled = true;
      controlBtn.title = "Location unavailable";
    }
  });
}

function addLocationMarkers() {
  locations.forEach((loc) => {
    // Use redIcon for red dots, or replace with buildingIcon for a custom icon
    const marker = L.marker(loc.coords, { icon: redIcon }).addTo(leafletMap);
    marker.on("click", () => goToAR(loc.id));
  });
}
// ...existing code...
