function jsonExportToUIHiddenField() {
    document.getElementById('textarea1').value = JSON.stringify({
        version: 2,
        objs: objs,
        mode: mode,
        rayDensity_light: rayDensity_light,
        rayDensity_images: rayDensity_images,
        observer: observer,
        origin: origin,
        scale: scale
    });
    if (typeof (Storage) !== "undefined") {
        localStorage.rayOpticsData = document.getElementById('textarea1').value;
    }
}

function jsonImportFromHiddenField() {
    var jsonData = JSON.parse(document.getElementById('textarea1').value);
    if (typeof jsonData != 'object') return;
    if (!jsonData.version) {
        var str1 = document.getElementById('textarea1').value.replace(/"point"|"xxa"|"aH"/g, '1').replace(/"circle"|"xxf"/g, '5').replace(/"k"/g, '"objs"').replace(/"L"/g, '"p1"').replace(/"G"/g, '"p2"').replace(/"F"/g, '"p3"').replace(/"bA"/g, '"exist"').replace(/"aa"/g, '"parallel"').replace(/"ba"/g, '"mirror"').replace(/"bv"/g, '"lens"').replace(/"av"/g, '"notDone"').replace(/"bP"/g, '"lightAlpha"').replace(/"ab"|"observed_light"|"observed_images"/g, '"observer"');
        jsonData = JSON.parse(str1);
        if (!jsonData.objs) {
            jsonData = {objs: jsonData};
        }
        if (!jsonData.mode) {
            jsonData.mode = 'light';
        }
        if (!jsonData.rayDensity_light) {
            jsonData.rayDensity_light = 1;
        }
        if (!jsonData.rayDensity_images) {
            jsonData.rayDensity_images = 1;
        }
        if (!jsonData.scale) {
            jsonData.scale = 1;
        }
        jsonData.version = 1;
    }
    if (jsonData.version == 1) {
        jsonData.origin = {x: 0, y: 0};
    }
    if (jsonData.version > 2) {
        return;
    }
    //TODO: Create new version.
    if (!jsonData.scale) {
        jsonData.scale = 1;
    }

    objs = jsonData.objs;
    rayDensity_light = jsonData.rayDensity_light;
    rayDensity_images = jsonData.rayDensity_images;
    observer = jsonData.observer;
    origin = jsonData.origin;
    scale = jsonData.scale;
    modebtn_clicked(jsonData.mode);
    selectObj(selectedObj);
}

//TODO check if this function is really called
function accessJSON() {
    if (document.getElementById('textarea1').style.display == 'none') {
        document.getElementById('textarea1').style.display = '';
        document.getElementById('textarea1').select();
    } else {
        document.getElementById('textarea1').style.display = 'none';
    }
}

function jsonSaveToFile() {
    jsonExportToUIHiddenField();

    var blob = new Blob([document.getElementById('textarea1').value], {type: 'application/json'});
    saveAs(blob, document.getElementById('save_name').value);

    document.getElementById('saveBox').style.display = 'none';
}

function jsonLoadFromFile(readFile) {
    var reader = new FileReader();
    document.getElementById('save_name').value = readFile.name;
    reader.readAsText(readFile);
    reader.onload = function (evt) {
        var fileString = evt.target.result;
        document.getElementById('textarea1').value = fileString;
        endPositioning();
        selectedObj = -1;
        jsonImportFromHiddenField();
        createUndoPoint();
    };
}

