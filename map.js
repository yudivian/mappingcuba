let map;
let currentLayer;
let lastClickedLayer;
let mapsConfig;
let codes;
let geojsonList;
let region;
let regionmap;
const fixedColor = '#afafaf';
let baseColor = '#afafaf';
let colors = [baseColor];
const dropdownIDs = ['colorSelect1', 'colorSelect2', 'colorSelect3'];
let colorRegions;

// Styles
var defaultPolygonStyle = {
  weight: 2,
  opacity: 0.8,
  color: baseColor,
  dashArray: '3',
  fillOpacity: 0.8,
};

var highlightStyle = {
  weight: 3,
  opacity: 1,
  color: baseColor,
  dashArray: '',
  fillOpacity: 1
}


// Loading the map
function initColorRegions(data) {
  colorRegions = { "provinces": {}, "municipalities": {} }
  data.features.forEach(d => {
    prop = d.properties;
    colorRegions.provinces[prop.DPA_province_code] = fixedColor;
    if ("DPA_municipality_code" in prop) {
      colorRegions.municipalities[prop.DPA_municipality_code] = fixedColor;
    }
  })
    ;
}

function initMap() {
  map = L.map('map').setView([0, 0], 4);
}

function loadGeoJSON(url) {
  if (currentLayer) {
    map.removeLayer(currentLayer);
    currentLayer = null;
  }
  $.getJSON(url)
    .done(data => {
      currentLayer = L.geoJson(data, {
        onEachFeature: onEachFeature,
        style: defaultPolygonStyle,
      })
      currentLayer.addTo(map);
      map.fitBounds(currentLayer.getBounds());
      initColorRegions(data);
      console.log(colorRegions);
    })
    .fail(() => {
      alert('Error al cargar el GeoJSON.');
    });
}


// Setting selectors 
function populateRegion() {
  const selector = $('#region');
  selector.empty();
  for (const key in mapsConfig) {
    item = mapsConfig[key]
    selector.append($('<option>', { value: item.value, text: item.name }));
  }
}

function populateRegionmap() {
  const selector = $('#regionmap');
  selector.empty();
  geojsonList.forEach(item => {
    selector.append($('<option>', { value: item.url, text: item.name }));
  });
}

function setupRegionmapEvent() {
  $('#regionmap').on('change', function () {
    const url = $(this).val();
    regionmap = url
    loadGeoJSON(url);
    populateProvinceSelect();
    populateMunicipalitySelect();
    changeBaseColor(fixedColor);
  });
}

function setupRegionEvent() {
  $('#region').on('change', function () {
    region = $(this).val()
    geojsonList = mapsConfig[region].items;
    populateRegionmap();
    $('#regionmap').val(geojsonList[0].url).trigger('change');
    if (region === "provinces") {
      $('#municipalityselectionblock').hide();
    } else {
      $('#municipalityselectionblock').show();
      populateMunicipalitySelect();
    }
    changeBaseColor(fixedColor);
  });
}

function searchCode(id) {
  for (const [key, value] of Object.entries(codesConfig)) {
    if (value.id === id) {
      return [value.name, value.code];
    }
  }
  return null;
}

function populateProvinceSelect() {
  parts = $('#regionmap').val().split("/")
  reg = parts[parts.length - 1].slice(0, -8);
  const $selectprov = $('#provincecolor');
  $selectprov.empty();
  const $optionprov = $('<option></option>')
    .val("")
    .text("Seleccione la provincia");
  $selectprov.append($optionprov)
  if (reg === "cuba") {
    for (const [key, value] of Object.entries(codesConfig)) {
      const provText = value.name;
      const $optionprov = $('<option></option>')
        .val(key)
        .text(provText);
      $selectprov.append($optionprov)
    }
  } else {
    const $valprov = searchCode(reg);
    const $optionprov = $('<option></option>')
      .val($valprov[1])
      .text($valprov[0]);
    $selectprov.append($optionprov)
  }
  validateApplyButton("colorSelect2");
}

function populateMunicipalitySelect() {
  parts = $('#regionmap').val().split("/")
  reg = parts[parts.length - 1].slice(0, -8);
  const $selectmun = $('#municipalitycolor');
  $selectmun.empty();
  const $optionmun = $('<option></option>')
    .val("")
    .text("Seleccione el municipio");
  $selectmun.append($optionmun)
  if (reg === "cuba") {
    for (const [key, value] of Object.entries(codesConfig)) {
      const provText = value.name;
      for (const [keym, valuem] of Object.entries(codesConfig[key]["municipalities"])) {
        const $optionmun = $('<option></option>')
          .val(keym)
          .text(provText + '-' + valuem.name);
        $selectmun.append($optionmun)
      }
    }
  } else {
    const $valprov = searchCode(reg);
    for (const [keym, valuem] of Object.entries(codesConfig[$valprov[1]]["municipalities"])) {
      const $optionmun = $('<option></option>')
        .val(keym)
        .text($valprov[0] + '-' + valuem.name);
      $selectmun.append($optionmun)
    }
  }
  validateApplyButton("colorSelect3");
}


// Color Menu 
function showColorMenu(x, y) {
  $('#colorMenu').remove();
  let $menu = $('<div></div>')
    .attr('id', 'colorMenu')
    .css({
      'position': 'absolute',
      'background-color': 'white',
      'border': '1px solid #ccc',
      'padding': '5px',
      'box-shadow': '2px 2px 5px rgba(0,0,0,0.2)',
      'z-index': '1000',
      'max-width': '120px'
    });

  if (colors.length === 0) {
    $menu.append('<p style="margin: 0; padding-bottom: 5px; text-align: center;">Debe añadir un color</p>');
  } else {
    $menu.append('<p style="margin: 0; padding-bottom: 5px; text-align: center;">Seleccione el color:</p>');
    let $colorsContainer = $('<div></div>').css({
      'display': 'flex',
      'flex-wrap': 'wrap',
      'justify-content': 'center'
    });

    colors.forEach(color => {
      $('<div></div>')
        .addClass('menu-item')
        .css({
          'background-color': color,
          'width': '20px',
          'height': '20px',
          'margin': '2px',
          'border': '1px solid #000',
          'cursor': 'pointer'
        })
        .attr('title', color)
        .on('click', function () {
          applyColor(color);
          hideColorMenu();
        })
        .appendTo($colorsContainer);
    });
    $menu.append($colorsContainer);
  }

  $('body').append($menu);

  $menu.css({
    'left': x + 'px',
    'top': y + 'px'
  }).show();

  $(document).off('click.hideMenu');
  $(document).on('click.hideMenu', function (event) {
    if (!$menu.is(event.target) && $menu.has(event.target).length === 0) {
      hideColorMenu();
    }
  });
}

function hideColorMenu() {
  $('#colorMenu').hide();
  $(document).off('click.hideMenu');
}

function applyColor(color) {
  if (map.lastClickedLayer) {
    // map.lastClickedLayer.setStyle({ fillColor: color });
    if ("DPA_municipality_code" in map.lastClickedLayer.feature.properties) {
      setSpecificRegionFillColors([map.lastClickedLayer.feature.properties.DPA_municipality_code],"municipality",color)
      // colorRegions.municipalities[map.lastClickedLayer.feature.properties.DPA_municipality_code]=color;
    } else {
      setSpecificRegionFillColors([map.lastClickedLayer.feature.properties.DPA_province_code],"province",color)
      // colorRegions.provinces[map.lastClickedLayer.feature.properties.DPA_province_code]=color;
    }
  }
}

function getRegionTootltip(feature) {
  const pro = feature.properties.province;
  if ("municipality" in feature.properties) {
    const mun = feature.properties.municipality;
    return "<p>" + pro + ", " + mun + "</p>"
  }
  return "<p>" + pro + "</p>"
}


function matchRegionType(feature, regionsToColor, regionType) {
  if (regionType === "all") {
    return true
  }
  if (regionType === "province") {
    return regionsToColor.some(element => element === feature.properties.DPA_province_code);
  }
  if (regionType === "municipality") {
    return regionsToColor.some(element => element === feature.properties.DPA_municipality_code);
  }
  return false;
}

function setSpecificRegionFillColors(regionsToColor, regionType, regionColor) {
  currentLayer.eachLayer(function (layer) {
    if (layer.feature && layer.feature.geometry && (layer.feature.geometry.type === 'Polygon' || layer.feature.geometry.type === 'MultiPolygon')) {
      let newColor = regionColor;
      if (matchRegionType(layer.feature, regionsToColor, regionType)) {
        if (regionType === "municipality") {
          colorRegions.municipalities[layer.feature.properties.DPA_municipality_code] = newColor;
        } else if (regionType === "province") {
          
          colorRegions.provinces[layer.feature.properties.DPA_province_code] = newColor;
        } else {
          if ("DPA_municipality_code" in layer.feature.properties) {
            colorRegions.municipalities[layer.feature.properties.DPA_municipality_code] = newColor;
          }
          colorRegions.provinces[layer.feature.properties.DPA_province_code] = newColor;
        }
        layer.setStyle({ fillColor: newColor });
      }
    }
  });
}

function updateColorPreview(dropdownID) {
  const $select = $('#' + dropdownID);
  const selectedColor = $select.val();

  const previewBoxID = 'colorPreviewBox' + dropdownID.replace('colorSelect', '');
  const $previewBox = $('#' + previewBoxID);

  if (selectedColor) {
    $previewBox.css('background-color', selectedColor).show();
  } else {
    $previewBox.hide();
  }
}

function updateDropdown(dropdownID) {
  const $select = $('#' + dropdownID);
  const currentSelected = $select.val();

  $select.empty();
  $select.append('<option value="">Selecciona el color</option>');
  colors.forEach(color => {
    const optionText = "■ " + color;
    const $option = $('<option></option>')
      .val(color)
      .text(optionText)
      .css('color', color);
    $select.append($option);
  });

  if (colors.includes(currentSelected)) {
    $select.val(currentSelected);
  } else {
    $select.val('');
  }

  updateColorPreview(dropdownID);
}

function updateAllDropdowns() {
  dropdownIDs.forEach(updateDropdown);
}

function updateColorBoxes() {
  const $selectedColorsDiv = $('#selectedColors').empty();
  if (colors.length != 0) {

    colors.forEach(color => {
      const $box = $('<div></div>')
        .addClass('color-box')
        .css('background-color', color)
        .attr("title", color);

      if (color != baseColor) {

        const $deleteBtn = $('<span>&times;</span>')
          .addClass('delete-button')
          .attr('title', `Elimina ${color}`)
          .on('click', function (e) {
            e.stopPropagation();
            removeColor(color);
          });

        $box.append($deleteBtn);
      }
      $selectedColorsDiv.append($box);
    });
  } else {
    $selectedColorsDiv.append("<p>No hay colores seleccionados</p>");
  }
}

function changeBaseColor(basecolor) {
  baseColor = basecolor;
  const $baseColorsDiv = $('#baseColor').empty();
  const $colorbox = $('<div></div>')
    .addClass('color-box')
    .css('background-color', baseColor)
    .attr('title', baseColor);
  $baseColorsDiv.append($colorbox);
  updateUI();
}

function updateUI() {
  updateColorBoxes();
  updateAllDropdowns();
}

function addColor(color) {
  if (!colors.includes(color)) {
    colors.push(color);
    updateUI();
  }
}

function removeColor(color) {
  colors = colors.filter(c => c !== color);
  updateUI();
}

$('#addColorButton').on('click', function () {
  const newColor = $('#colorPicker').val();
  addColor(newColor);
});

function paintGeneralColor() {
  gencolor = $('#generalcolor').val();
  selectcolor = $('#colorSelect1').val();
  if ((selectcolor != null) && (selectcolor != "")) {
    if (gencolor === "all") {
      changeBaseColor(selectcolor);
      setSpecificRegionFillColors([], "all", selectcolor);
    } else if (gencolor === "selected") {
      for (const [prov, pcolor] of Object.entries(colorRegions.provinces)) {
        if (pcolor != baseColor) {
          setSpecificRegionFillColors([prov], "province", selectcolor);
        }
      }
      for (const [mun, mcolor] of Object.entries(colorRegions.municipalities)) {
        if (mcolor != baseColor) {
          setSpecificRegionFillColors([mun], "municipality", selectcolor)
        }
      }
    } else if (gencolor === "notselected") {
       for (const [prov, pcolor] of Object.entries(colorRegions.provinces)) {
        if (pcolor === baseColor) {
          setSpecificRegionFillColors([prov], "province", selectcolor);
        }
      }
      for (const [mun, mcolor] of Object.entries(colorRegions.municipalities)) {
        if (mcolor === baseColor) {
          setSpecificRegionFillColors([mun], "municipality", selectcolor)
        }
      }
      changeBaseColor(selectcolor)
    }
  }
}

function paintProvinceColor() {
  provcolor = $('#provincecolor').val();
  selectprovcolor = $('#colorSelect2').val();
  if ((provcolor != "") && (selectprovcolor != "")) {
    setSpecificRegionFillColors([provcolor], "province", selectprovcolor)
  }
}

function paintMunicipalityColor() {
  muncolor = $('#municipalitycolor').val();
  selectmuncolor = $('#colorSelect3').val();
  if ((muncolor != "") && (selectmuncolor != "")) {
    setSpecificRegionFillColors([muncolor], "municipality", selectmuncolor)
  }
}

function validateApplyButton(dropdownID) {
  if (dropdownID === "colorSelect1") {
    if (($('#colorSelect1').val() === "") || ($('#generalcolor').val() === "")) {
      $('#generalbutton').prop('disabled', true);
    } else {
      $('#generalbutton').prop('disabled', false);
    }
  }
  if (dropdownID === "colorSelect2") {
    if (($('#colorSelect2').val() === "") || ($('#provincecolor').val() === "")) {
      $('#provincebutton').prop('disabled', true);
    } else {
      $('#provincebutton').prop('disabled', false);
    }
  }
  if (dropdownID === "colorSelect3") {
    if (($('#colorSelect3').val() === "") || ($('#municipalitycolor').val() === "")) {
      $('#municipalitybutton').prop('disabled', true);
    } else {
      $('#municipalitybutton').prop('disabled', false);
    }
  }
}


$('#generalcolor').on('change', function () {
  validateApplyButton("colorSelect1");
});

dropdownIDs.forEach(dropdownID => {
  $('#' + dropdownID).on('change', function () {
    updateColorPreview(dropdownID);
    validateApplyButton(dropdownID);
  });
});

$('#generalbutton').on('click', function () {
  paintGeneralColor();
});

$('#provincecolor').on('change', function () {
  validateApplyButton("colorSelect2");
});

$('#provincebutton').on('click', function () {
  paintProvinceColor();
});

$('#municipalitycolor').on('change', function () {
  validateApplyButton("colorSelect3");
});

$('#municipalitybutton').on('click', function () {
  paintMunicipalityColor();
});

$('#exportmapbutton').on('click', function () {
  var mapContainer = $('#map')[0];
  var mapSize = map.getSize();
  var leafletControls = $('.leaflet-control-container');
  leafletControls.hide();
  domtoimage.toPng(mapContainer, {
    width: mapSize.x,
    height: mapSize.y,
    style: {
      transform: 'none'
    }
  })
    .then(function (dataUrl) {
      leafletControls.show();
      var link = document.createElement('a');
      link.download = 'mapa_sin_controles.png';
      link.href = dataUrl;
      link.click();
    })
    .catch(function (error) {
      leafletControls.show();
      console.error('¡Ocurrió un error al generar la imagen!', error);
      alert('No se pudo guardar la imagen del mapa.');
    });
});


function onEachFeature(feature, layer) {
  if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
    var tooltipContent = getRegionTootltip(feature);
    if (feature.properties && feature.properties.name) {
      tooltipContent = feature.properties.name;
    } else if (feature.properties && feature.properties.tooltip) {
      tooltipContent = feature.properties.tooltip;
    }
    layer.bindTooltip(tooltipContent, {
      permanent: false,
      direction: 'auto',
      sticky: true,
      className: 'my-custom-tooltip'
    });

    if (feature.properties && feature.properties.description) {
      layer.bindPopup("<h3>" + feature.properties.name + "</h3><p>" + feature.properties.description + "</p>");
    }
    layer.on({
      mouseover: function (e) {
        layer.setStyle(highlightStyle);
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront();
        }
      },
      mouseout: function (e) {
        layer.setStyle(defaultPolygonStyle);
      },
      contextmenu: function (e) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
        map.lastClickedLayer = layer;
        showColorMenu(e.originalEvent.clientX, e.originalEvent.clientY);
      }
    });
  }
}

function main() {
  updateUI();
  initMap();
  populateRegion();
  setupRegionEvent();
  $('#region').val(mapsConfig.provinces.value).trigger('change');
  populateRegionmap();
  setupRegionmapEvent();
  $('#regionmap').val(geojsonList[0].url).trigger('change');
  populateProvinceSelect();
}

$.getJSON("configs/maps.json").done(function (data) {
  $.getJSON("configs/codes.json").done(function (codes) {
    mapsConfig = data
    codesConfig = codes
    main()
  })
})