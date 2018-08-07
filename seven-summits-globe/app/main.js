define([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/layers/FeatureLayer",
  "esri/geometry/Point",
  "esri/layers/support/LabelClass",
  "esri/core/watchUtils",
  "esri/request",
  "dojo/on"
], function (WebScene, SceneView, FeatureLayer, Point, LabelClass, watchUtils, esriRequest, on) {
  return {
    init: function () {
      const webscene = new WebScene({
        basemap: null,
        ground: "world-elevation"
      });
      webscene.ground.surfaceColor = '#004C73';

      const view = new SceneView({
        container: "view",
        map: webscene,
        alphaCompositingEnabled: true,
        camera:       {
          heading: 0,
          tilt: 0,
          position: {
            latitude:  21.5,
            longitude: 94.3,
            z: 25000000
          }
        },
        environment: {
          background: {
            type: "color",
            color: [0, 0, 0, 0]
          },
          lighting: {
            date: "Sun Feb 15 2018 15:30:00 GMT+0900 (W. Europe Daylight Time)",
          },
          starsEnabled: false,
          atmosphereEnabled: false
        }
      });
      window.view = view;
      view.ui.empty("top-left"); // Removes all of the elements in the top-left of the view's container

      const continentsBoundaries = new FeatureLayer({
        url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Continents/FeatureServer",
        title: "World Continents",
        renderer: {
          type: "simple",
          symbol: {
            type: "polygon-3d",
            symbolLayers: [{
              type: "fill",
              material: {
                color: [255, 250, 239, 0.8]
              },
              outline: {
                color: [70, 70, 70, 0.7]
              }
            }]
          }
        }
      });

      const graticule = new FeatureLayer({
        url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/World_graticule_15deg/FeatureServer",
        opacity: 0.8,
        renderer: {
          type: "simple", // autocasts as new SimpleRenderer()
          symbol: {
            type: "simple-line", // autocasts as new SimpleLineSymbol()
            width: 2,
            color: "#1971b1"
          }
        }
      });

      webscene.addMany([graticule, continentsBoundaries]);


      // ********* add the summits form geojson

      var fields = [{
          name: "ObjectID",
          alias: "ObjectID",
          type: "oid"
        },
        {
          name: "name",
          alias: "name",
          type: "string"
        }, {
          name: "latitude",
          alias: "latitude",
          type: "double"
        }, {
          name: "longitude",
          alias: "longitude",
          type: "double"
        }, {
          name: "zoom",
          alias: "zoom",
          type: "integer"
        }, {
          name: "tilt",
          alias: "tilt",
          type: "integer"
        }, {
          name: "heading",
          alias: "heading",
          type: "integer"
        }, {
          name: "camera_pos_lat",
          alias: "camera_pos_lat",
          type: "double"
        }, {
          name: "camera_pos_lon",
          alias: "camera_pos_lon",
          type: "double"
        }, {
          name: "camera_pos_z",
          alias: "camera_pos_z",
          type: "double"
        }
      ];

      getData()
        .then(createGraphics) // then send it to the createGraphics() method
        .then(createLayer) // when graphics are created, create the layer
        .catch(errback);

      // Request the data
      function getData() {
        var url = "summits.geojson";
        return esriRequest(url, {
          responseType: "json"
        });
      }

      function createGraphics(response) {
        // raw GeoJSON data
        var geoJson = response.data;

        // Create an array of Graphics from each GeoJSON feature
        return geoJson.features.map(function (feature, i) {
          return {
            geometry: new Point({
              x: feature.geometry.coordinates[0],
              y: feature.geometry.coordinates[1]
            }),
            // select only the attributes you care about
            attributes: {
              ObjectID: i,
              name: feature.properties.name,
              latitude: feature.properties.latitude,
              longitude: feature.properties.longitude,
              zoom: feature.properties.zoom,
              tilt: feature.properties.tilt,
              heading: feature.properties.heading,
              camera_pos_lat: feature.properties.camera_pos_lat,
              camera_pos_lon: feature.properties.camera_pos_lon,
              camera_pos_z: feature.properties.camera_pos_z
            }
          };
        });
      }

      function createLayer(graphics) {
        summitLayer = new FeatureLayer({
          source: graphics,
          fields: fields,
          objectIdField: "ObjectID",
          spatialReference: {
            wkid: 4326
          },
          geometryType: "point",
          renderer: {
            type: "simple",
            symbol: {
              type: "point-3d",
              symbolLayers: [{
                type: "icon",
                size: 8,
                resource: {
                  primitive: "circle"
                },
                material: {
                  color: "#1971b1"
                },
                outline: {
                  size: 1,
                  color: "white"
                }
              }],
              verticalOffset: {
                screenLength: 30
              },
              callout: {
                type: "line",
                size: 1.5,
                color: "#1971b1"
              }
            }
          },
          screenSizePerspectiveEnabled: false,
          labelingInfo: [
            new LabelClass({
              labelExpressionInfo: {
                expression: "$feature.name"
              },
              symbol: {
                type: "label-3d",
                symbolLayers: [{
                  type: "text",
                  material: {
                    color: "#1971b1"
                  },
                  size: 14,
                  font: {
                    family: "Open Sans",
                    weight: "bold"
                  },
                  halo: {
                    color: "white",
                    size: 1
                  }
                }]
              }
            })
          ]
        });
        webscene.add(summitLayer)
      }

      // Executes if data retrieval was unsuccessful.
      function errback(error) {
        console.error("Creating failed. ", error);
      }     

      // ********* END: add the summits form geojson

      on(dojo.query(".summitbutton"), "click", function () {
        console.log(this.id);
        switch (this.id) {
          case "globe":
            view.goTo({
              zoom: 1
            });
            break;
          default:
            goToSummit(this.id)

        }
      });

      function goToSummit(name) {
        console.log("gotosummit zoom to: " + name);
        summitLayer.source.items.forEach(feature => {
          if (feature.attributes.name == name) {
            view.goTo({
              heading: feature.attributes.heading,
              tilt: feature.attributes.tilt,
              position: {
                latitude: feature.attributes.camera_pos_lat,
                longitude: feature.attributes.camera_pos_lon,
                z: feature.attributes.camera_pos_z
              }
            });
            return;
          }
        });
      }

      // change the mode (small scale: continents, large scale: satellite)
      watchUtils.whenTrue(view, "stationary", function () {
        if (view.scale < 2000000) {
          continentsBoundaries.visible = false;
          view.map.basemap = "satellite";
          view.environment.atmosphereEnabled = true;
          document.getElementById('image').style.backgroundImage = "url()";
        } else {
          continentsBoundaries.visible = true;
          view.map.basemap = null;
          view.environment.atmosphereEnabled = false;
          document.getElementById('image').style.backgroundImage = "url(./background.jpg)";
        }
      });

      // ************* click on summit *******
      // and retrieve the screen x, y coordinates
      view.on("click", eventHandlerPointerDown);

      function eventHandlerPointerDown(event) {
        // the hitTest() checks to see if any graphics in the view
        // intersect the given screen x, y coordinates        
        view.hitTest(event)
          .then(getSummitName)
          .then(goToSummit)
          .catch(errback);        
      }

      function getSummitName(response) {
        if (response.results.length) {
          if (response.results[0].graphic) {
            var localgraphic = response.results.filter(function (result) {
              return result.graphic.layer === summitLayer;
            })[0].graphic;
            summitname = localgraphic.attributes.name;
            console.log("click on: " + summitname);
            return summitname;
          }
        }
        throw "no summit clicked";
      }

      /// ************* END: click on summit *******

    }
  }
});