(function () {

    L.mapbox.accessToken = 'pk.eyJ1Ijoic2ViYXN0aWFuLWNoIiwiYSI6ImNpejkxdzZ5YzAxa2gyd21udGpmaGU0dTgifQ.IrEd_tvrl6MuypVNUGU5SQ';

    // create the Leaflet map using mapbox.light tiles
    var map = L.mapbox.map('map', 'mapbox.light', {
        zoomSnap: .1
    });


    // load CSV data
    omnivore.csv('data/kenya_education_2014.csv')
        .on('ready', function (e) {
            drawMap(e.target.toGeoJSON());
            drawLegend(e.target.toGeoJSON());
        })
        .on('error', function (e) {
            console.log(e.error[0].message);
        });

    var options = {
        pointToLayer: function (feature, ll) {
            return L.circleMarker(ll, {
                opacity: 1,
                weight: 2,
                fillOpacity: 0
            });
        }
    };

    function drawMap(data) {

        var girlsLayer = L.geoJson(data, options).setStyle({
            color: '#D96D02'
        }).addTo(map);

        var boysLayer = L.geoJson(data, options).setStyle({
            color: '#6E77B0'
        }).addTo(map);

        map.fitBounds(girlsLayer.getBounds(), {
            padding: [35,35]
        });

        //call functions right when map is drawn
        resizeCircles(girlsLayer, boysLayer, 1);
        sequenceUI(girlsLayer, boysLayer);
        retrieveInfo(boysLayer, 1);


    }

    function drawLegend(data) {

        // create Leaflet control for the legend
        var legend = L.control({
            position: 'bottomright'
        });

        // when added to the map
        legend.onAdd = function (map) {

                // select the element with id of 'legend'
                var div = L.DomUtil.get("legend");

                // disable the mouse events
                L.DomEvent.disableScrollPropagation(div);
                L.DomEvent.disableClickPropagation(div);

                // add legend to the control
                return div;
            }
            // add the control to the map
        legend.addTo(map);

        var dataValues = [];

        data.features.map(function (school) {

            for (var grade in school.properties) {

                var attribute = school.properties[grade];

                if (Number(attribute)) {
                    dataValues.push(attribute);
                }
            }
        });

        var sortedValues = dataValues.sort(function (a, b) {
            return b - a;
        });

        var maxValue = Math.round(sortedValues[0] / 1000) * 1000;

        var largeDiameter = calcRadius(maxValue) * 2,
            smallDiameter = largeDiameter / 2;

        $(".legend-circles").css('height', largeDiameter.toFixed());

        // set width and height for large circle
        $('.legend-large').css({
            'width': largeDiameter.toFixed(),
            'height': largeDiameter.toFixed()
        });
        // set width and height for small circle and position
        $('.legend-small').css({
            'width': smallDiameter.toFixed(),
            'height': smallDiameter.toFixed(),
            'top': largeDiameter - smallDiameter,
            'left': smallDiameter / 2
        })

        // label the max and median value
        $(".legend-large-label").html(maxValue);
        $(".legend-small-label").html((maxValue / 2));

        // adjust the position of the large based on size of circle
        $(".legend-large-label").css({
            'top': -11,
            'left': largeDiameter + 30,
        });

        // adjust the position of the large based on size of circle
        $(".legend-small-label").css({
            'top': smallDiameter - 11,
            'left': largeDiameter + 30
        });

        // insert a couple hr elements and use to connect value label to top of each circle
        $("<hr class='large'>").insertBefore(".legend-large-label")
        $("<hr class='small'>").insertBefore(".legend-small-label").css('top', largeDiameter - smallDiameter - 8);
    }
    //calculates radius for resizeCircles
    function calcRadius(val) {
        var radius = Math.sqrt(val / Math.PI);
        return radius * .5;
    }
    //resizes circles based on current grade
    function resizeCircles(girlsLayer, boysLayer, currentGrade) {

        girlsLayer.eachLayer(function (layer) {
            var radius = calcRadius(Number(layer.feature.properties['G' + currentGrade]));
            layer.setRadius(radius);
        });

        boysLayer.eachLayer(function (layer) {
            var radius = calcRadius(Number(layer.feature.properties['B' + currentGrade]));
            layer.setRadius(radius);
        });

        retrieveInfo(boysLayer, currentGrade);
    }

    function sequenceUI(girlsLayer, boysLayer) {

        //sliderControl
        var sliderControl = L.control({
            position: 'bottomleft'
        });

        sliderControl.onAdd = function (map) {

            var controls = L.DomUtil.get("slider");
            // disable the mouse events
            L.DomEvent.disableScrollPropagation(controls);
            L.DomEvent.disableClickPropagation(controls);
            // add slider to the control
            return controls;
        }

        //slider title
        var sliderName = L.control({
            position: 'bottomleft'
        });

        //attach it to the div tag made for the slider title
        sliderName.onAdd = function (map) {
            var div1 = L.DomUtil.get("sliderTitle");
            return div1
        };

        sliderControl.addTo(map);
        //header added after, so it appears above slider
        sliderName.addTo(map);

        //on change, resize the circles to the correct grade level
        //update the header to the current grade
        $('.slider')
            .on('input change', function () {
                var currentGrade = $(this).val();
                resizeCircles(girlsLayer, boysLayer, currentGrade);
                $('#sliderTitle').html('Grade ' + currentGrade);
            });
    }

    function retrieveInfo(boysLayer, currentGrade) {
        var info = $('#info');

        //on mouseover, unhide info box
        boysLayer.on('mouseover', function (e) {

            info.removeClass('none').show();

            var props = e.layer.feature.properties;

            //fill in info box, add data to the specific
            //area created by the html info box
            $('#info span').html(props.COUNTY);
            $('.girls span:first-child').html('(grade ' + currentGrade + ')');
            $('.boys span:first-child').html('(grade ' + currentGrade + ')');
            $('.girls span:last-child').html(props['G' + currentGrade]);
            $('.boys span:last-child').html(props['B' + currentGrade]);

            //on mouseover, set the fill to 0.6
            e.layer.setStyle({
                fillOpacity: 0.6
            });

            var girlsValues = [],
                boysValues = [];

            //for all grades, push the girls to the empty array for girls;
            //push the boys to empty array for boys
            for (var i = 1; i <= 8; i++) {

                girlsValues.push(props['G' + i]);
                boysValues.push(props['B' + i]);
            }

            //create chart for the girls
            $('.girlspark').sparkline(girlsValues, {
                width: '160px',
                height: '30px',
                lineColor: '#D96D02',
                fillColor: '#d98939',
                spotRadius: 0,
                lineWidth: 2
            });

            //create chart for the boys
            $('.boyspark').sparkline(boysValues, {
                width: '160px',
                height: '30px',
                lineColor: '#6E77B0',
                fillColor: '#878db0',
                spotRadius: 0,
                lineWidth: 2
            });
        });

        //on mouseout, remove the fill of the circle
        boysLayer.on('mouseout', function (e) {
            info.hide();
            e.layer.setStyle({
                fillOpacity: 0
            });
        });

        // when the mouse moves on the document
        $(document).mousemove(function (e) {
            // first offset from the mouse position of the info window
            info.css({
                "left": e.pageX + 6,
                "top": e.pageY - info.height() - 25
            });

            // if it crashes into the top, flip it lower right
            if (info.offset().top < 4) {
                info.css({
                    "top": e.pageY + 15
                });
            }
            // if it crashes into the right, flip it to the left
            if (info.offset().left + info.width() >= $(document).width() - 40) {
                info.css({
                    "left": e.pageX - info.width() - 80
                });
            }
        });
    }
})();