# reafem

A modern geospatial web application for interactive map visualizations and spatial data analysis.

![GitHub](https://img.shields.io/github/license/yourusername/reafem)
![GitHub stars](https://img.shields.io/github/stars/yourusername/reafem?style=social)

## 🌍 Technologies

- **Leaflet** - Lightweight library for simple map visualizations
- **MapLibre GL JS** - High-performance library for complex data visualizations
- **Turf.js** - Advanced geospatial analysis operations

## 📋 Overview

reafem provides a comprehensive solution for working with geospatial data in web applications. It combines the simplicity of Leaflet for basic mapping needs, the advanced rendering capabilities of MapLibre GL JS for complex visualizations, and the analytical power of Turf.js for spatial operations.

## ✨ Features

- Simple, interactive maps with Leaflet
- High-performance vector tile rendering with MapLibre
- Comprehensive spatial analysis with Turf.js
- Responsive design for desktop and mobile devices
- Customizable base maps and styling

## 🚀 Quick Start

### Installation

Add reafem to your project:

```bash
# Using npm
npm install reafem

# Using yarn
yarn add reafem

# Using pnpm
pnpm add reafem
```

### Basic Usage

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>reafem Demo</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@3.3.1/dist/maplibre-gl.css" />
  <style>
    #map { height: 500px; }
  </style>
</head>
<body>
  <div id="map"></div>
  
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/maplibre-gl@3.3.1/dist/maplibre-gl.js"></script>
  <script src="https://unpkg.com/@turf/turf@6.5.0/turf.min.js"></script>
  <script src="https://unpkg.com/reafem/dist/reafem.min.js"></script>
  <script>
    // Initialize reafem
    const app = reafem.init('map', {
      defaultView: {
        center: [0, 0],
        zoom: 2
      }
    });
    
    // Add a base layer
    app.addBaseLayer('osm', {
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    });
    
    // Load and visualize GeoJSON data
    app.loadData('sample-data.geojson').then(data => {
      app.visualize(data);
    });
  </script>
</body>
</html>
```

### Module Import

```javascript
// ES Module import
import { init, analyze } from 'reafem';
import * as L from 'leaflet';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';

// Initialize the application
const app = init('map', {
  provider: 'leaflet',  // or 'maplibre' for complex visualizations
  center: [51.505, -0.09],
  zoom: 13
});

// Load data
const geojson = await fetch('data.geojson').then(res => res.json());

// Analyze data using Turf.js
const analyzed = analyze(geojson, {
  operation: 'buffer',
  distance: 10,
  units: 'kilometers'
});

// Visualize the results
app.visualize(analyzed);
```

## 📘 API Reference

### Core Methods

```javascript
// Initialize reafem
const app = reafem.init(containerId, options);

// Switch between map providers
app.setProvider('leaflet'); // For simple visualizations
app.setProvider('maplibre'); // For complex visualizations

// Load data
const data = await app.loadData(source, options);

// Analyze spatial data
const result = app.analyze(data, {
  operation: 'buffer', // or 'voronoi', 'centroid', etc.
  // operation-specific options
});

// Visualize data
app.visualize(data, {
  style: {
    color: '#ff0000',
    weight: 2,
    opacity: 0.7
  }
});

// Add controls
app.addControl('draw');
app.addControl('layers');
app.addControl('scale');
```

### Events

```javascript
// Listen for events
app.on('click', e => {
  console.log('Clicked at:', e.latlng);
});

app.on('dataload', data => {
  console.log('Data loaded:', data);
});

app.on('analyze:complete', result => {
  console.log('Analysis complete:', result);
});
```

## 🔧 Configuration

Create a `reafem.config.js` file in your project root:

```javascript
module.exports = {
  defaultProvider: 'leaflet',
  basemaps: [
    {
      id: 'osm',
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors'
    },
    {
      id: 'satellite',
      name: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
    }
  ],
  defaultStyle: {
    point: {
      radius: 5,
      color: '#3388ff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    },
    line: {
      color: '#3388ff',
      weight: 3,
      opacity: 1
    },
    polygon: {
      color: '#3388ff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.5
    }
  }
};
```

## 📊 Examples

### Simple Map with Leaflet

```javascript
import { init } from 'reafem';

const map = init('map', {
  provider: 'leaflet',
  center: [51.505, -0.09],
  zoom: 13
});

map.addMarker([51.5, -0.09], {
  popup: 'Hello World!',
  icon: 'default'
});

map.addGeoJSON('data.geojson', {
  style: feature => ({
    color: feature.properties.color,
    weight: 2
  })
});
```

### Complex Visualization with MapLibre

```javascript
import { init } from 'reafem';

const map = init('map', {
  provider: 'maplibre',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-74.5, 40],
  zoom: 9
});

map.addSource('points', {
  type: 'geojson',
  data: 'data.geojson'
});

map.addLayer({
  id: 'points',
  type: 'circle',
  source: 'points',
  paint: {
    'circle-radius': ['interpolate', ['linear'], ['zoom'],
      10, 2,
      15, 10
    ],
    'circle-color': ['get', 'color'],
    'circle-opacity': 0.8
  }
});
```

### Spatial Analysis with Turf.js

```javascript
import { analyze, visualize } from 'reafem';

// Create a buffer around points
const buffered = analyze(points, {
  operation: 'buffer',
  distance: 5,
  units: 'kilometers'
});

// Create a voronoi diagram
const voronoi = analyze(points, {
  operation: 'voronoi',
  bbox: [-180, -90, 180, 90]
});

// Calculate the center of mass
const centroid = analyze(polygon, {
  operation: 'centroid'
});

// Visualize the results
visualize([buffered, voronoi, centroid], {
  container: 'map',
  style: {
    buffer: {
      color: '#ff0000',
      fillOpacity: 0.2
    },
    voronoi: {
      color: '#00ff00',
      weight: 1
    },
    centroid: {
      color: '#0000ff',
      radius: 5
    }
  }
});
```

## 📦 Building from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/reafem.git

# Navigate to the project directory
cd reafem

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📚 Resources

- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js-docs/api/)
- [Turf.js Documentation](https://turfjs.org/)

## 📧 Contact

- GitHub: [github.com/yourusername](https://github.com/yourusername)
- Twitter: [@yourusername](https://twitter.com/yourusername)
- Email: your.email@example.com