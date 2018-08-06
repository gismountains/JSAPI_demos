require([
  "esri/WebScene",
  "esri/layers/FeatureLayer",
  "esri/views/SceneView",
  "esri/layers/support/LabelClass",
  "utils",
  "esri/renderers/smartMapping/statistics/summaryStatistics",
  "esri/core/watchUtils",
  "dojo/domReady!"
], function (
  WebScene, FeatureLayer, SceneView, LabelClass, utils, summaryStatistics, watchUtils
) {
  const summitsLayer = new FeatureLayer({
    url: "https://services8.arcgis.com/eDcvF96dtvlvHgLI/arcgis/rest/services/summits/FeatureServer",
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
            color: "#3a4e7a"
          },
          outline: {
            size: 1,
            color: "white"
          }
        }],
        verticalOffset: {
          screenLength: "30"
        },
        callout: {
          type: "line",
          size: 1.5,
          color: "#3a4e7a"
        }
      }
    },
    labelingInfo: []
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

  const countryBoundaries = new FeatureLayer({
    url: "http://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer",
    title: "World Countries",
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

  const webscene = new WebScene({
    basemap: null,
    layers: [graticule, summitsLayer, countryBoundaries],
    ground: "world-elevation"
  });
  webscene.ground.surfaceColor = '#091d36';

  const view = new SceneView({
    map: webscene,
    container: "viewDiv",
    constraints: {
      collision: {
        enabled: true
      }
    },
    camera: {
      position: {
        latitude: 21.5,
        longitude: 94.3,
        z: 25000000
      },
      heading: 0,
      tilt: 0
    },
    padding: {
      bottom: 200
    },
    ui: {
      components: []
    },
    environment: {
      background: {
        type: "color",
        color: "#5e83ba"
      },
      atmosphereEnabled: false,
      starsEnabled: false,
      lighting: {
        directShadowsEnabled: true,
        date: "Sun Feb 15 2018 15:30:00 GMT+0900 (W. Europe Daylight Time)",
        cameraTrackingEnabled: true,
        ambientOcclusionEnabled: true
      }
    }
  });
  window.view = view;

  // change the mode (small scale: countries, large scale: satellite)
  watchUtils.whenTrue(view, "stationary", function () {
    if (view.scale < 2000000) {
      countryBoundaries.visible = false;
      view.map.basemap = "satellite";
      view.environment.atmosphereEnabled = true;
      summitsLayer.labelingInfo = [new LabelClass({
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
      })];
    } else {
      countryBoundaries.visible = true;
      view.map.basemap = null;
      view.environment.atmosphereEnabled = false;
      summitsLayer.labelingInfo = [];
    }
  });

  summaryStatistics({
      layer: summitsLayer,
      field: "altitude"
    })
    .then((result) => {
      const slider = utils.createSlider(Math.log(result.min), Math.log(result.max));

      slider.on('end', function (values, handles, unencoded) {
        const min = parseInt(Math.exp(unencoded[0]));
        const max = parseInt(Math.exp(unencoded[1]));
        summitsLayer.definitionExpression =
          `altitude >= ${min} AND altitude <= ${max}`;
      });
    })
    .otherwise((err) => {
      console.log(err);
    });

});