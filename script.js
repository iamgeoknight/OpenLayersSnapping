/*
Create and Render map on div with zoom and center
*/
class OLMap {
  //Constructor accepts html div id, zoom level and center coordinaes
  constructor(map_div, zoom, center) {
    this.map = new ol.Map({
      target: map_div,
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        })
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat(center),
        zoom: zoom
      })
    });
  }
}


/*
Create Vector Layer
*/
class VectorLayer{
  //Constructor accepts title of vector layer and map object
  constructor(title, map) {
    this.layer = new ol.layer.Vector({
      title: title,      
      source: new ol.source.Vector({
        projection:map.getView().projection
      }),
      style: new ol.style.Style({        
        stroke: new ol.style.Stroke({
          color: '#0e97fa',
          width:8
        })
      })
    });
  }
}


/*
Create a Draw interaction for LineString and Polygon
*/
class Draw {  
  //Constructor accepts geometry type, map object and vector layer
  constructor(type, map, vector_layer) {
    this.map = map;
    this.vector_layer = vector_layer;
    this.features = [];
    
    //Draw feature
    this.draw = new ol.interaction.Draw({
        type: type,
        stopClick: true,
        source: vector_layer.getSource()
    });
    this.draw.on('drawstart', this.onDrawStart);
    this.draw.on('drawend', this.onDrawEnd);
    this.map.addInteraction(this.draw);


    //Snap Feature to vector source
    let snap = new ol.interaction.Snap({
      source: vector_layer.getSource()
    });
    map.addInteraction(snap);
    
  }

  /*
  This function will be called when you start drawing
  */
  onDrawStart = (e) => {  
    //Binding onGeomChange function with drawing feature
    e.feature.getGeometry().on('change', this.onGeomChange);
    this.coordinates_length = 0;
  }

  /*
  This function will be called when drawing is finished
  */
  onDrawEnd = (e) => {  
    this.removeSnapFeatures();
  }

  /*
  This function will called when ever there will be a change in geometry like increase in length, area, position,
  */
  onGeomChange = (e) => {
    let geomType = e.target.getType();
    let coordinates = e.target.getCoordinates();
    if (geomType == "Polygon"){
      coordinates = e.target.getCoordinates()[0];
    }

    //This logic will check if the new coordinates are added to geometry. If yes, then It will create 4 line features perpendicular to x/y axis
    if (coordinates.length > this.coordinates_length) {
      this.snapFeatures(coordinates)                
      this.coordinates_length =  coordinates.length;
    }
    else {                     
      this.coordinates_length =  coordinates.length;
    }  
  }

  /*
  This function will create 4 lines perpendicular to x/y axis at clicked locations
  */ 
  snapFeatures = (coordinates) => {
    this.removeSnapFeatures();
    let length = coordinates.length - 2;
    let coordinate = coordinates[length];
    let x = coordinate[0];
    let y = coordinate[1];
    let style = new ol.style.Style({
      stroke: new ol.style.Stroke({ 
        color: '#000',
        width: 5
      })
    });

    //Creating 4 line features perpendicular to x/y axis. Drawn/Modified feature will snap to these 4 features.
    [0, 90, 180, 270].forEach(angle => {
      angle = (angle*Math.PI)/180;
      let xx = x + (100000 * Math.cos(angle));
      let yy = y + (100000 * Math.sin(angle));
      let feature = new ol.Feature({
        geometry: new ol.geom.LineString([[x,y], [xx,yy]])
      });
      feature.setStyle(style);
      this.features.push(feature);
      this.vector_layer.getSource().addFeature(feature);
    });
  }

  /**/ 
  removeSnapFeatures = () => {
    this.features.forEach(feature => {
      this.vector_layer.getSource().removeFeature(feature);
    });
    this.features = [];
  }
}


//Create map and vector layer
let map = new OLMap('map', 9, [-96.6345990807462, 32.81890764151014]).map;
let snapFeatures = [];
let vector_layer = new VectorLayer('Temp Layer', map).layer
map.addLayer(vector_layer);


//Add Interaction to map depending on your selection
let draw = null;
let btnClick = (e) => {  
  removeInteractions();
  let geomType = e.srcElement.attributes.geomtype.nodeValue;
  //Create interaction
  draw = new Draw(geomType, map, vector_layer, snapFeatures);
}


//Remove map interactions except default interactions
let removeInteractions = () => {
  let extra_interactions = map.getInteractions().getArray().slice(9);
  let len = extra_interactions.length;
  for (let i in extra_interactions) {
    map.removeInteraction(extra_interactions[i]);
  }  
}


//Clear vector features and overlays and remove any interaction
let clear = () => {
  removeInteractions();
  map.getOverlays().clear();
  vector_layer.getSource().clear();
}

//Bind methods to click events of buttons
let line = document.getElementById('btn1');
line.onclick = btnClick;

let poly = document.getElementById('btn2');
poly.onclick = btnClick;

let clearGraphics = document.getElementById('btn3');
clearGraphics.onclick = clear;