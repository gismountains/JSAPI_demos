define(["nouislider"], function(nouislider) {

  return {
    createSlider: function(min, max) {
      var summitSlider = document.getElementById("summitSlider");

      nouislider.create(summitSlider, {
        start: [min, max],
        range: {
          'min': min,
          'max': max
        },
        connect: true,
        orientation: 'vertical',
        direction: 'rtl',
        tooltips: true,
        format: {
          to: function(value) {
            return parseInt(Math.exp(value)).toLocaleString() + " metres";
          },
          from: function (value) {
            return value;
          }
        }
      });

      return summitSlider.noUiSlider;
    }
  }

})
