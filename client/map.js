(function() {
  var _hueToRgb = function(p, q, t){
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  /*
   * Converts an HSL color to RGB.
   * @param {Number} h The hue value.
   * @param {Number} s The saturation value.
   * @param {Number} s The lightness value.
  */
  var hslToRgb = function(h, s, l){
    var r, g, b;

    if (s == 0) {
      r = g = b = l;
    } else {

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = _hueToRgb(p, q, h + 1/3);
      g = _hueToRgb(p, q, h);
      b = _hueToRgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
  };

  /*
   * Converts an HSL color to an RGB hex representation.
   * @param {Number} h The hue value.
   * @param {Number} s The saturation value.
   * @param {Number} s The lightness value.
   */
  var hslToHex = function(h, s, l) {
    return '#' + hslToRgb(h, s, l).map(function(v) {
      return parseInt(v).toString(16);
    }).join('');
  };


  /*
   * ProductMap
   * ==========
   * Wraps the Mapbox map. Responsible for plotting products and notifying the rest of
   * the application about search marker movement.
   */
  var ProductMap = function(center, searchRadius) {
    var self = this;
    EventEmitter2.call(self);

    L.mapbox.accessToken = 'pk.eyJ1IjoiYWxleG1pY3RpYyIsImEiOiIwNjA5YzY4OTRhOTlkZmZiYW' +
                           'MwOTVkYTQyODE0MWM1OSJ9.qlmkUkppOWpEcLjvsBqkZA';

    var initMap = function() {
      var options = {minZoom: 8, maxZoom: 18};
      var map = L.mapbox.map('map', 'mapbox.streets', options);

      map.setView(center, options.minZoom);
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();

      return map;
    };

    var initSearchMarker = function() {
      var marker = L.marker(center, {zIndexOffset: 1000, draggable: true});
      marker.addTo(this.map);
      return marker;
    };

    var initSearchArea = function() {
      var area = L.circle(this.marker.getLatLng(), searchRadius, {
        opacity: 0.7,
        weight: 0.5,
        fillOpacity: 0.2
      });

      this.marker.on('drag', function(e) {
        var pos = e.target.getLatLng();
        area.setLatLng(pos);
        self.emit('change:searchpos', pos);
      });

      area.addTo(this.map);

      return area;
    };

    var getProductLayer = function(products) {
      var features = products.map(function(product) {
        var shop = product.shop;
        var color = hslToHex(0.2 * (1 - product.popularity), 0.8, 0.5);
        return {
          type: 'Feature',
          properties: {
            title: product.title,
            'marker-color': color,
            'marker-size': 'large',
            'marker-symbol': 'heart'
          },
          geometry: {
            type: 'Point',
            coordinates: [shop.lng, shop.lat]
          }
        };
      });

      var productLayer = L.mapbox.featureLayer();

      productLayer.on('mouseover', function(e) {
        e.layer.openPopup();
      });

      productLayer.on('mouseout', function(e) {
        e.layer.closePopup();
      });

      productLayer.setGeoJSON({
        type: 'FeatureCollection',
        features: features
      });

      return productLayer;
    };

    this.plot = function(products) {
      if (this.map.hasLayer(this.productLayer)) {
        this.map.removeLayer(this.productLayer);
      }
      this.productLayer = getProductLayer(products);
      this.productLayer.addTo(this.map);
    };

    this.map = initMap.call(this);
    this.marker = initSearchMarker.call(this);
    this.area = initSearchArea.call(this);
  };


  /*
   * Searcher
   * ==========
   * Performs API search requests.
   */
  var Searcher = function(prefs) {
    var self = this;
    EventEmitter2.call(self);

    // Default preferences.
    this.prefs = prefs;

    this.search = function(cb) {
      // TODO: Implement this.
    };
  };


  /*
   * SearchControls
   * ==============
   * Wraps the control box and adapts DOM events to application events.
   */
  var SearchControls = function(prefs) {
    var self = this;
    EventEmitter2.call(self);

    var $search = $('#controls .search');

    // Set initial values.
    var $radius = $('#controls .radius').val(prefs.radius).selectize();
    var $count = $('#controls .count').val(prefs.count).selectize();
    var $tags = $('#controls .tags').selectize({
      delimiter: ',',
      persist: false,
      create: function(input) {
        return {value: input, text: input};
      }
    });

    $search.on('click', function() {
      self.emit('search');
      return false;
    });

    $radius.on('change', function(e) {
      var val = $(e.target).val();
      self.emit('change:radius', parseInt(val));
      return false;
    });

    $count.on('change', function(e) {
      var val = $(e.target).val();
      self.emit('change:count', parseInt(val));
      return false;
    });

    $tags.on('change', function(e) {
      var val = $(e.target).val();
      var valArray = [];
      if (val) valArray = val.split(',');
      self.emit('change:tags', valArray);
    });
  };


  /*
   * Initializes the application and hooks up all the event handlers.
   */
  var init = function() {
    var prefs = {
      count: 10,
      radius: 500,
      position: L.latLng(59.3325800, 18.0649000), // Hello Stockholm!
      tags: []
    };

    var controls = new SearchControls(prefs);
    var searcher = new Searcher(prefs);
    var map = new ProductMap(prefs.position, prefs.radius);

    controls.on('search', function() {
      searcher.search(function(err, products) {
        if (err) return alert(err);
        map.plot(products);
      });
    });

    controls.on('change:radius', function(radius) {
      searcher.prefs.radius = radius;
      map.area.setRadius(radius);
    });

    controls.on('change:count', function(count) {
      searcher.prefs.count = count;
    });

    controls.on('change:tags', function(tags) {
      searcher.prefs.tags = tags;
    });

    map.on('change:searchpos', function(latlng) {
      searcher.prefs.position = latlng;
    });
  };


  // Inherit from `EventEmitter2`.
  ProductMap.prototype = Object.create(EventEmitter2.prototype);
  Searcher.prototype = Object.create(EventEmitter2.prototype);
  SearchControls.prototype = Object.create(EventEmitter2.prototype);


  // Boot the application.
  init();
}());