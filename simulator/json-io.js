function jsonExport() {
    const jsonString = JSON.stringify({
        version: 2,
        objs: elements,
        mode: mode,
        rayDensity_light: rayDensity_light,
        rayDensity_images: rayDensity_images,
        observer: observer,
        origin: origin,
        scale: scale
    });
    if (typeof (Storage) !== "undefined") {
        localStorage.rayOpticsData =jsonString
    }

    return jsonString
}

function jsonImport(jsonString) {
    var jsonData = JSON.parse(jsonString);
    elements = jsonData.objs;
    rayDensity_light = jsonData.rayDensity_light;
    rayDensity_images = jsonData.rayDensity_images;
    observer = jsonData.observer;
    origin = jsonData.origin;
    scale = jsonData.scale;
    mode = jsonData.mode
    selectObj(selectedObj);
}

function jsonSaveToFile(jsonString, fileName) {
    saveAs(new Blob([jsonString], {type: 'application/json'}), fileName);
}

function jsonLoadFromFile(fileName) {
    var reader = new FileReader();
    var jsonString = "";
    reader.readAsText(fileName);

    //TODO try to deal with this async read later
    reader.onload = function (evt) {
        jsonString = evt.target.result;
        document.getElementById('textarea1').value = jsonString;
        endPositioning();
        selectedObj = -1;
        jsonImport(document.getElementById('textarea1').value);
        modebtn_clicked(mode);
        createUndoPoint();
    };
}

