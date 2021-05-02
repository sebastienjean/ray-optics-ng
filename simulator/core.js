var canvasPainter = {
    draw: function (graph, color) {
        // point
        if (graph.type == 1) {
            ctx.fillStyle = color ? color : 'red';
            ctx.fillRect(graph.x - 2, graph.y - 2, 5, 5);
        }
        // line
        else if (graph.type == 2) {
            ctx.strokeStyle = color ? color : 'black';
            ctx.beginPath();
            var ang1 = Math.atan2((graph.p2.x - graph.p1.x), (graph.p2.y - graph.p1.y));
            var cvsLimit = (Math.abs(graph.p1.x + origin.x) + Math.abs(graph.p1.y + origin.y) + canvas.height + canvas.width) / Math.min(1, scale);  //取一個會超出繪圖區的距離(當做直線端點)
            ctx.moveTo(graph.p1.x - Math.sin(ang1) * cvsLimit, graph.p1.y - Math.cos(ang1) * cvsLimit);
            ctx.lineTo(graph.p1.x + Math.sin(ang1) * cvsLimit, graph.p1.y + Math.cos(ang1) * cvsLimit);
            ctx.stroke();
        }
        // ray
        else if (graph.type == 3) {
            ctx.strokeStyle = color ? color : 'black';
            var ang1, cvsLimit;
            if (Math.abs(graph.p2.x - graph.p1.x) > 1e-5 || Math.abs(graph.p2.y - graph.p1.y) > 1e-5) {
                ctx.beginPath();
                ang1 = Math.atan2((graph.p2.x - graph.p1.x), (graph.p2.y - graph.p1.y));
                cvsLimit = (Math.abs(graph.p1.x + origin.x) + Math.abs(graph.p1.y + origin.y) + canvas.height + canvas.width) / Math.min(1, scale);
                ctx.moveTo(graph.p1.x, graph.p1.y);
                ctx.lineTo(graph.p1.x + Math.sin(ang1) * cvsLimit, graph.p1.y + Math.cos(ang1) * cvsLimit);
                ctx.stroke();
            }
        }
        // (line_)segment
        else if (graph.type == 4) {
            ctx.strokeStyle = color ? color : 'black';
            ctx.beginPath();
            ctx.moveTo(graph.p1.x, graph.p1.y);
            ctx.lineTo(graph.p2.x, graph.p2.y);
            ctx.stroke();
        }
        // circle
        else if (graph.type == 5) {
            ctx.strokeStyle = color ? color : 'black';
            ctx.beginPath();
            if (typeof graph.r == 'object') {
                var dx = graph.r.p1.x - graph.r.p2.x;
                var dy = graph.r.p1.y - graph.r.p2.y;
                ctx.arc(graph.c.x, graph.c.y, Math.sqrt(dx * dx + dy * dy), 0, Math.PI * 2, false);
            } else {
                ctx.arc(graph.c.x, graph.c.y, graph.r, 0, Math.PI * 2, false);
            }
            ctx.stroke();
        }
    },
    cls: function () {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(scale, 0, 0, scale, origin.x, origin.y);
    }
};

var canvas;
var ctx;
var mouse;
var mouse_lastmousedown;
var isConstructing = false;
var constructionPoint;
var draggingObj = -1;
var positioningObj = -1;
var draggingPart = {};
var selectedObj = -1;
var AddingObjType = '';
var waitingRays = [];
var rayDensity_light = 0.1;
var rayDensity_images = 1;
var extendLight = false;
var showLight = true;
var gridSize = 20;
var origin = {x: 0, y: 0};
var undoArr = [];
var undoIndex = 0;
var undoLimit = 20;
var undoUBound = 0;
var undoLBound = 0;
var observer;
var mode = 'light';
var timerID = -1;
var isDrawing = false;
var hasExceededTime = false;
var forceStop = false;
var lastDrawTime = -1;
var stateOutdated = false;
var minShotLength = 1e-6;
var minShotLength_squared = minShotLength * minShotLength;
var snapToDirection_lockLimit_squared = 900;
var clickExtent_line = 10;
var clickExtent_point = 10;
var clickExtent_point_construct = 10;
var tools_normal = ['laser', 'radiant', 'parallel', 'blackline', 'ruler', 'protractor', ''];
var tools_withList = ['mirror_', 'refractor_'];
var tools_inList = ['mirror', 'arcmirror', 'idealmirror', 'lens', 'refractor', 'halfplane', 'circlelens'];
var modes = ['light', 'extended_light', 'images', 'observer'];
var xyBox_cancelContextMenu = false;
var scale = 1;

window.onload = function (e) {
    initGUI();
    canvas = document.getElementById('canvas1');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d');
    mouse = Graph.point(0, 0);

    if (typeof (Storage) !== "undefined" && localStorage.rayOpticsData) {
        document.getElementById('textarea1').value = localStorage.rayOpticsData;
    }

    if (document.getElementById('textarea1').value != '') {
        jsonImportFromHiddenField();
        toolbtn_clicked('');
    } else {
        initParameters();
    }

    undoArr[0] = document.getElementById('textarea1').value;
    document.getElementById('undo').disabled = true;
    document.getElementById('redo').disabled = true;

    window.onmousedown = function (e) {
        selectObj(-1);
    };

    window.ontouchstart = function (e) {
        selectObj(-1);
    };

    canvas.onmousedown = function (e) {
        document.getElementById('objAttr_text').blur();
        document.body.focus();
        canvas_onmousedown(e);
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
        return false;
    };

    canvas.onmousemove = function (e) {
        canvas_onmousemove(e);
    };

    canvas.onmouseup = function (e) {
        canvas_onmouseup(e);
    };

    // IE9, Chrome, Safari, Opera
    canvas.addEventListener("mousewheel", canvas_onmousewheel, false);
    // Firefox
    canvas.addEventListener("DOMMouseScroll", canvas_onmousewheel, false);

    function canvas_onmousewheel(e) {
        // cross-browser wheel delta
        var e = window.event || e; // old IE support
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        var d = scale;
        if (delta < 0) {
            d = scale * 0.9;
        } else if (delta > 0) {
            d = scale / 0.9;
        }
        d = Math.max(25, Math.min(500, d * 100));
        setScaleWithCenter(d / 100, (e.pageX - e.target.offsetLeft) / scale, (e.pageY - e.target.offsetTop) / scale);
        window.toolBarViewModel.zoom.value(d);
        return false;
    }

    canvas.ontouchstart = function (e) {
        document.getElementById('objAttr_text').blur();
        document.body.focus();
        canvas_onmousedown(e);
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
    };

    canvas.ontouchmove = function (e) {
        canvas_onmousemove(e);
        e.preventDefault();
    };

    canvas.ontouchend = function (e) {
        canvas_onmouseup(e);
        e.preventDefault();
    };

    canvas.ontouchcancel = function (e) {
        canvas_onmouseup(e);
        undo();
        e.preventDefault();
    };

    canvas.ondblclick = function (e) {
        canvas_ondblclick(e);
    };

    tools_normal.forEach(function (element, index) {
        document.getElementById('tool_' + element).onmouseenter = function (e) {
            toolbtn_mouseentered(element, e);
        };
        document.getElementById('tool_' + element).onclick = function (e) {
            toolbtn_clicked(element, e);
        };
        cancelMousedownEvent('tool_' + element);
    });

    tools_withList.forEach(function (element, index) {
        document.getElementById('tool_' + element).onmouseenter = function (e) {
            toolbtnwithlist_mouseentered(element, e);
        };
        document.getElementById('tool_' + element).onclick = function (e) {
            toolbtn_clicked(element, e);
        };
        document.getElementById('tool_' + element).onmouseleave = function (e) {
            toolbtnwithlist_mouseleft(element, e);
        };
        document.getElementById('tool_' + element + 'list').onmouseleave = function (e) {
            toollist_mouseleft(element, e);
        };
        cancelMousedownEvent('tool_' + element);
    });

    tools_inList.forEach(function (element, index) {
        document.getElementById('tool_' + element).onclick = function (e) {
            toollistbtn_clicked(element, e);
        };
        cancelMousedownEvent('tool_' + element);
    });

    document.getElementById('undo').onclick = undo;
    cancelMousedownEvent('undo');

    document.getElementById('redo').onclick = redo;
    cancelMousedownEvent('redo');

    document.getElementById('reset').onclick = function () {
        initParameters();
        createUndoPoint();
    };
    cancelMousedownEvent('reset');

    document.getElementById('accessJSON').onclick = accessJSON;
    cancelMousedownEvent('accessJSON');

    document.getElementById('save').onclick = function () {
        document.getElementById('saveBox').style.display = '';
        document.getElementById('save_name').select();
    };
    cancelMousedownEvent('save');

    document.getElementById('open').onclick = function () {
        document.getElementById('openfile').click();
    };
    cancelMousedownEvent('open');

    document.getElementById('openfile').onchange = function () {
        jsonLoadFromFile(this.files[0]);
    };

    modes.forEach(function (element, index) {
        document.getElementById('mode_' + element).onclick = function () {
            modebtn_clicked(element);
            createUndoPoint();
        };
        cancelMousedownEvent('mode_' + element);
    });

    document.getElementById('zoom').oninput = function () {
        setScale(this.value / 100);
        draw();
    };

    document.getElementById('zoom_txt').onfocusout = function () {
        setScale(this.value / 100);
        draw();
    };

    document.getElementById('zoom_txt').onkeyup = function () {
        if (event.keyCode === 13) {
            setScale(this.value / 100);
            draw();
        }
    };

    document.getElementById('zoom').onmouseup = function () {
        setScale(this.value / 100);
        createUndoPoint();
    };

    document.getElementById('zoom').ontouchend = function () {
        setScale(this.value / 100);
        createUndoPoint();
    };
    cancelMousedownEvent('rayDensity');

    document.getElementById('rayDensity').oninput = function () {
        setRayDensity(Math.exp(this.value));
        draw();
    };

    document.getElementById('rayDensity_txt').onfocusout = function () {
        setRayDensity(Math.exp(this.value));
        draw();
    };

    document.getElementById('rayDensity_txt').onkeyup = function () {
        if (event.keyCode === 13) {
            setRayDensity(Math.exp(this.value));
            draw();
        }
    };

    document.getElementById('rayDensity').onmouseup = function () {
        setRayDensity(Math.exp(this.value));
        draw();
        createUndoPoint();
    };

    document.getElementById('rayDensity').ontouchend = function () {
        setRayDensity(Math.exp(this.value));
        draw();
        createUndoPoint();
    };
    cancelMousedownEvent('rayDensity');
    cancelMousedownEvent('lockobjs_');
    cancelMousedownEvent('grid_');

    document.getElementById('showgrid_').onclick = function () {
        draw()
    };

    document.getElementById('showgrid').onclick = function () {
        draw()
    };
    cancelMousedownEvent('showgrid_');

    document.getElementById('forceStop').onclick = function () {
        if (timerID != -1) {
            forceStop = true;
        }
    };
    cancelMousedownEvent('forceStop');

    document.getElementById('objAttr_range').oninput = function () {
        setAttr(document.getElementById('objAttr_range').value * 1);
    };

    document.getElementById('objAttr_range').onmouseup = function () {
        createUndoPoint();
    };

    document.getElementById('objAttr_range').ontouchend = function () {
        setAttr(document.getElementById('objAttr_range').value * 1);
        createUndoPoint();
    };
    cancelMousedownEvent('objAttr_range');

    document.getElementById('objAttr_text').onchange = function () {
        setAttr(document.getElementById('objAttr_text').value * 1);
    };
    cancelMousedownEvent('objAttr_text');

    document.getElementById('objAttr_text').onkeydown = function (e) {
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
    };

    document.getElementById('objAttr_text').onclick = function (e) {
        this.select();
    };

    document.getElementById('setAttrAll').onchange = function () {
        setAttr(document.getElementById('objAttr_text').value * 1);
        createUndoPoint();
    };
    cancelMousedownEvent('setAttrAll');
    cancelMousedownEvent('setAttrAll_');

    document.getElementById('copy').onclick = function () {
        elements[elements.length] = JSON.parse(JSON.stringify(elements[selectedObj]));
        draw();
        createUndoPoint();
    };
    cancelMousedownEvent('copy');

    document.getElementById('delete').onclick = function () {
        removeObj(selectedObj);
        draw();
        createUndoPoint();
    };
    cancelMousedownEvent('delete');

    document.getElementById('textarea1').onchange = function () {
        jsonImportFromHiddenField();
        createUndoPoint();
    };

    document.getElementById('save_name').onkeydown = function (e) {
        if (e.keyCode == 13) {
            //enter
            document.getElementById('save_confirm').onclick();
        }
        if (e.keyCode == 27) {
            //esc
            document.getElementById('save_cancel').onclick();
        }

        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
    };

    document.getElementById('save_cancel').onclick = function () {
        document.getElementById('saveBox').style.display = 'none';
    };

    document.getElementById('save_confirm').onclick = jsonSaveToFile;
    cancelMousedownEvent('saveBox');

    document.getElementById('xybox').onkeydown = function (e) {
        if (e.keyCode == 13) {
            //enter
            confirmPositioning(e.ctrlKey, e.shiftKey);
        }
        if (e.keyCode == 27) {
            //esc
            endPositioning();
        }

        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
    };

    document.getElementById('xybox').oninput = function (e) {
        this.size = this.value.length;
    };

    document.getElementById('xybox').addEventListener('contextmenu', function (e) {
        if (xyBox_cancelContextMenu) {
            e.preventDefault();
            xyBox_cancelContextMenu = false;
        }
    }, false);
    cancelMousedownEvent('xybox');

    window.ondragenter = function (e) {
        e.stopPropagation();
        e.preventDefault();
    };

    window.ondragover = function (e) {
        e.stopPropagation();
        e.preventDefault();
    };

    window.ondrop = function (e) {
        e.stopPropagation();
        e.preventDefault();

        var dt = e.dataTransfer;
        if (dt.files[0]) {
            var files = dt.files;
            jsonLoadFromFile(files[0]);
        } else {
            var fileString = dt.getData('text');
            document.getElementById('textarea1').value = fileString;
            selectedObj = -1;
            jsonImportFromHiddenField();
            createUndoPoint();
        }
    };

    canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    }, false);

    toolbtn_clicked('laser');
};

function draw() {
    stateOutdated = true;
    document.getElementById('forceStop').style.display = 'none';
    if (timerID != -1) {
        clearTimeout(timerID);
        timerID = -1;
        isDrawing = false;
    }

    if (!isDrawing) {
        isDrawing = true;
        draw_();
    }
}

function draw_() {
    if (!stateOutdated) {
        isDrawing = false;
        return;
    }
    stateOutdated = false;

    jsonExportToUIHiddenField();
    canvasPainter.cls();
    ctx.globalAlpha = 1;
    hasExceededTime = false;
    waitingRays = [];
    shotRayCount = 0;

    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (document.getElementById('showgrid').checked) {
        ctx.strokeStyle = 'rgb(64,64,64)';
        var dashstep = 4;
        ctx.beginPath();
        for (var x = origin.x / scale % gridSize; x <= canvas.width / scale; x += gridSize) {
            for (var y = 0; y <= canvas.height / scale; y += dashstep) {
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + dashstep * 0.5);
            }
        }
        for (var y = origin.y / scale % gridSize; y <= canvas.height / scale; y += gridSize) {
            for (var x = 0; x <= canvas.width / scale; x += dashstep) {
                ctx.moveTo(x, y);
                ctx.lineTo(x + dashstep * 0.5, y);
            }
        }
        ctx.stroke();
    }
    ctx.restore();

    for (var i = 0; i < elements.length; i++) {
        Element[elements[i].type].draw(elements[i], canvas);
        if (Element[elements[i].type].shoot) {
            Element[elements[i].type].shoot(elements[i]);
        }
    }

    shootWaitingRays();

    if (mode == 'observer') {
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.fillStyle = 'blue';
        ctx.arc(observer.c.x, observer.c.y, observer.r, 0, Math.PI * 2, false);
        ctx.fill();
    }
    lastDrawTime = new Date();
}

function addRay(ray) {
    waitingRays[waitingRays.length] = ray;
}

function getRayDensity() {
    if (mode == 'images' || mode == 'observer') {
        return rayDensity_images;
    } else {
        return rayDensity_light;
    }
}

function shootWaitingRays() {
    timerID = -1;
    var st_time = new Date();
    var alpha0 = 1;

    ctx.globalAlpha = alpha0;
    var observed;
    var last_ray;
    var last_intersection;
    var s_obj;
    var s_obj_index;
    var last_s_obj_index;
    var s_point;
    var s_point_temp;
    var s_lensq;
    var s_lensq_temp;
    var observed_point;
    var observed_intersection;
    var rpd;
    var leftRayCount = waitingRays.length;
    var surfaceMerging_objs = [];

    while (leftRayCount != 0 && !forceStop) {
        if (new Date() - st_time > 200) {
            document.getElementById('status').innerHTML = shotRayCount + ' rays (' + leftRayCount + ' waiting)';
            hasExceededTime = true;
            timerID = setTimeout(shootWaitingRays, 10);
            document.getElementById('forceStop').style.display = '';
            return;
        }

        leftRayCount = 0;
        last_s_obj_index = -1;
        last_ray = null;
        last_intersection = null;
        for (var j = 0; j < waitingRays.length; j++) {
            if (waitingRays[j] && waitingRays[j].exist) {
                s_obj = null;
                s_obj_index = -1;
                s_point = null;
                surfaceMerging_objs = [];
                s_lensq = Infinity;
                observed = false;
                for (var i = 0; i < elements.length; i++) {
                    if (Element[elements[i].type].rayIntersection) {
                        s_point_temp = Element[elements[i].type].rayIntersection(elements[i], waitingRays[j]);
                        if (s_point_temp) {
                            s_lensq_temp = Graph.length_squared(waitingRays[j].p1, s_point_temp);
                            if (s_point && Graph.length_squared(s_point_temp, s_point) < minShotLength_squared && (Element[elements[i].type].supportSurfaceMerging || Element[s_obj.type].supportSurfaceMerging)) {
                                if (Element[s_obj.type].supportSurfaceMerging) {
                                    if (Element[elements[i].type].supportSurfaceMerging) {
                                        surfaceMerging_objs[surfaceMerging_objs.length] = elements[i];
                                    } else {
                                        s_obj = elements[i];
                                        s_obj_index = i;
                                        s_point = s_point_temp;
                                        s_lensq = s_lensq_temp;
                                        surfaceMerging_objs = [];
                                    }
                                }
                            } else if (s_lensq_temp < s_lensq && s_lensq_temp > minShotLength_squared) {
                                s_obj = elements[i];
                                s_obj_index = i;
                                s_point = s_point_temp;
                                s_lensq = s_lensq_temp;
                                surfaceMerging_objs = [];
                            }
                        }
                    }
                }
                ctx.globalAlpha = alpha0 * waitingRays[j].brightness;
                if (s_lensq == Infinity) {
                    if (mode == 'light' || mode == 'extended_light') {
                        canvasPainter.draw(waitingRays[j], 'rgb(255,255,128)');
                    }
                    if (mode == 'extended_light' && !waitingRays[j].isNew) {
                        canvasPainter.draw(Graph.ray(waitingRays[j].p1, Graph.point(waitingRays[j].p1.x * 2 - waitingRays[j].p2.x, waitingRays[j].p1.y * 2 - waitingRays[j].p2.y)), 'rgb(255,128,0)');
                    }
                    if (mode == 'observer') {
                        observed_point = Graph.intersection_line_circle(waitingRays[j], observer)[2];
                        if (observed_point) {
                            if (Graph.intersection_is_on_ray(observed_point, waitingRays[j])) {
                                observed = true;
                            }
                        }
                    }
                } else {
                    if (mode == 'light' || mode == 'extended_light') {
                        canvasPainter.draw(Graph.segment(waitingRays[j].p1, s_point), 'rgb(255,255,128)');
                    }
                    if (mode == 'extended_light' && !waitingRays[j].isNew) {
                        canvasPainter.draw(Graph.ray(waitingRays[j].p1, Graph.point(waitingRays[j].p1.x * 2 - waitingRays[j].p2.x, waitingRays[j].p1.y * 2 - waitingRays[j].p2.y)), 'rgb(255,128,0)');
                        canvasPainter.draw(Graph.ray(s_point, Graph.point(s_point.x * 2 - waitingRays[j].p1.x, s_point.y * 2 - waitingRays[j].p1.y)), 'rgb(80,80,80)');
                    }
                    if (mode == 'observer') {
                        observed_point = Graph.intersection_line_circle(waitingRays[j], observer)[2];

                        if (observed_point) {
                            if (Graph.intersection_is_on_segment(observed_point, Graph.segment(waitingRays[j].p1, s_point))) {
                                observed = true;
                            }
                        }
                    }
                }
                if (mode == 'observer' && last_ray) {
                    if (!waitingRays[j].gap) {
                        observed_intersection = Graph.intersection_2line(waitingRays[j], last_ray);

                        if (observed) {
                            if (last_intersection && Graph.length_squared(last_intersection, observed_intersection) < 25) {
                                if (Graph.intersection_is_on_ray(observed_intersection, Graph.ray(observed_point, waitingRays[j].p1)) && Graph.length_squared(observed_point, waitingRays[j].p1) > 1e-5) {
                                    ctx.globalAlpha = alpha0 * (waitingRays[j].brightness + last_ray.brightness) * 0.5;
                                    if (s_point) {
                                        rpd = (observed_intersection.x - waitingRays[j].p1.x) * (s_point.x - waitingRays[j].p1.x) + (observed_intersection.y - waitingRays[j].p1.y) * (s_point.y - waitingRays[j].p1.y);
                                    } else {
                                        rpd = (observed_intersection.x - waitingRays[j].p1.x) * (waitingRays[j].p2.x - waitingRays[j].p1.x) + (observed_intersection.y - waitingRays[j].p1.y) * (waitingRays[j].p2.y - waitingRays[j].p1.y);
                                    }
                                    if (rpd < 0) {
                                        canvasPainter.draw(observed_intersection, 'rgb(255,128,0)');
                                    } else if (rpd < s_lensq) {
                                        canvasPainter.draw(observed_intersection, 'rgb(255,255,128)');
                                    }
                                    canvasPainter.draw(Graph.segment(observed_point, observed_intersection), 'rgb(0,0,255)');
                                } else {
                                    canvasPainter.draw(Graph.ray(observed_point, waitingRays[j].p1), 'rgb(0,0,255)');
                                }
                            } else {
                                if (last_intersection) {
                                    canvasPainter.draw(Graph.ray(observed_point, waitingRays[j].p1), 'rgb(0,0,255)');
                                }
                            }
                        }
                        last_intersection = observed_intersection;
                    } else {
                        last_intersection = null;
                    }
                }
                if (mode == 'images' && last_ray) {
                    if (!waitingRays[j].gap) {
                        observed_intersection = Graph.intersection_2line(waitingRays[j], last_ray);
                        if (last_intersection && Graph.length_squared(last_intersection, observed_intersection) < 25) {
                            ctx.globalAlpha = alpha0 * (waitingRays[j].brightness + last_ray.brightness) * 0.5;

                            if (s_point) {
                                rpd = (observed_intersection.x - waitingRays[j].p1.x) * (s_point.x - waitingRays[j].p1.x) + (observed_intersection.y - waitingRays[j].p1.y) * (s_point.y - waitingRays[j].p1.y);
                            } else {
                                rpd = (observed_intersection.x - waitingRays[j].p1.x) * (waitingRays[j].p2.x - waitingRays[j].p1.x) + (observed_intersection.y - waitingRays[j].p1.y) * (waitingRays[j].p2.y - waitingRays[j].p1.y);
                            }

                            if (rpd < 0) {
                                canvasPainter.draw(observed_intersection, 'rgb(255,128,0)');
                            } else if (rpd < s_lensq) {
                                canvasPainter.draw(observed_intersection, 'rgb(255,255,128)');
                            } else {
                                canvasPainter.draw(observed_intersection, 'rgb(80,80,80)');
                            }
                        }
                        last_intersection = observed_intersection;
                    }
                }

                if (last_s_obj_index != s_obj_index) {
                    waitingRays[j].gap = true;
                }

                waitingRays[j].isNew = false;
                last_ray = {p1: waitingRays[j].p1, p2: waitingRays[j].p2};
                last_s_obj_index = s_obj_index;
                if (s_obj) {
                    Element[s_obj.type].shot(s_obj, waitingRays[j], j, s_point, surfaceMerging_objs);
                } else {
                    waitingRays[j] = null;
                }

                shotRayCount = shotRayCount + 1;
                if (waitingRays[j] && waitingRays[j].exist) {
                    leftRayCount = leftRayCount + 1;
                }
            }
        }
    }
    ctx.globalAlpha = 1.0;
    for (var i = 0; i < elements.length; i++) {
        Element[elements[i].type].draw(elements[i], canvas, true);
    }
    if (mode == 'observer') {
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.fillStyle = 'blue';
        ctx.arc(observer.c.x, observer.c.y, observer.r, 0, Math.PI * 2, false);
        ctx.fill();
    }
    if (forceStop) {
        document.getElementById('status').innerHTML = shotRayCount + ' rays (stopped)';
        forceStop = false;
    } else if (hasExceededTime) {
        document.getElementById('status').innerHTML = shotRayCount + ' rays';
    } else {
        document.getElementById('status').innerHTML = shotRayCount + ' rays (' + (new Date() - st_time) + 'ms)';
    }
    document.getElementById('forceStop').style.display = 'none';
    setTimeout(draw_, 10);
}

function mouseOnPoint(mouse, point) {
    return Graph.length_squared(mouse, point) < clickExtent_point * clickExtent_point;
}

function mouseOnPoint_construct(mouse, point) {
    return Graph.length_squared(mouse, point) < clickExtent_point_construct * clickExtent_point_construct;
}

function mouseOnSegment(mouse, segment) {
    var d_per = Math.pow((mouse.x - segment.p1.x) * (segment.p1.y - segment.p2.y) + (mouse.y - segment.p1.y) * (segment.p2.x - segment.p1.x), 2) / ((segment.p1.y - segment.p2.y) * (segment.p1.y - segment.p2.y) + (segment.p2.x - segment.p1.x) * (segment.p2.x - segment.p1.x));
    var d_par = (segment.p2.x - segment.p1.x) * (mouse.x - segment.p1.x) + (segment.p2.y - segment.p1.y) * (mouse.y - segment.p1.y);
    return d_per < clickExtent_line * clickExtent_line && d_par >= 0 && d_par <= Graph.length_segment_squared(segment);
}

function mouseOnLine(mouse, line) {
    var d_per = Math.pow((mouse.x - line.p1.x) * (line.p1.y - line.p2.y) + (mouse.y - line.p1.y) * (line.p2.x - line.p1.x), 2) / ((line.p1.y - line.p2.y) * (line.p1.y - line.p2.y) + (line.p2.x - line.p1.x) * (line.p2.x - line.p1.x));
    return d_per < clickExtent_line * clickExtent_line;
}

function snapToDirection(mouse, basePoint, directions, snapData) {
    var x = mouse.x - basePoint.x;
    var y = mouse.y - basePoint.y;

    if (snapData && snapData.locked) {
        var k = (directions[snapData.i0].x * x + directions[snapData.i0].y * y) / (directions[snapData.i0].x * directions[snapData.i0].x + directions[snapData.i0].y * directions[snapData.i0].y);
        return Graph.point(basePoint.x + k * directions[snapData.i0].x, basePoint.y + k * directions[snapData.i0].y);
    } else {
        var i0;
        var d_sq;
        var d0_sq = Infinity;
        for (var i = 0; i < directions.length; i++) {
            d_sq = (directions[i].y * x - directions[i].x * y) * (directions[i].y * x - directions[i].x * y) / (directions[i].x * directions[i].x + directions[i].y * directions[i].y);
            if (d_sq < d0_sq) {
                d0_sq = d_sq;
                i0 = i;
            }
        }

        if (snapData && x * x + y * y > snapToDirection_lockLimit_squared) {
            snapData.locked = true;
            snapData.i0 = i0;
        }

        var k = (directions[i0].x * x + directions[i0].y * y) / (directions[i0].x * directions[i0].x + directions[i0].y * directions[i0].y);
        return Graph.point(basePoint.x + k * directions[i0].x, basePoint.y + k * directions[i0].y);
    }
}

function canvas_onmousedown(e) {
    if (e.changedTouches) {
        var et = e.changedTouches[0];
    } else {
        var et = e;
    }
    var mouse_nogrid = Graph.point((et.pageX - e.target.offsetLeft - origin.x) / scale, (et.pageY - e.target.offsetTop - origin.y) / scale);
    mouse_lastmousedown = mouse_nogrid;
    if (positioningObj != -1) {
        confirmPositioning(e.ctrlKey, e.shiftKey);
        if (!(e.which && e.which == 3)) {
            return;
        }
    }

    if (!((e.which && (e.which == 1 || e.which == 3)) || (e.changedTouches))) {
        return;
    }

    if (document.getElementById('grid').checked) {
        mouse = Graph.point(Math.round(((et.pageX - e.target.offsetLeft - origin.x) / scale) / gridSize) * gridSize, Math.round(((et.pageY - e.target.offsetTop - origin.y) / scale) / gridSize) * gridSize);
    } else {
        mouse = mouse_nogrid;
    }

    if (isConstructing) {
        if ((e.which && e.which == 1) || (e.changedTouches)) {
            Element[elements[elements.length - 1].type].c_mousedown(elements[elements.length - 1], mouse);
        }
    } else {
        if ((!(document.getElementById('lockobjs').checked) != (e.altKey && AddingObjType != '')) && !(e.which == 3)) {
            draggingPart = {};

            if (mode == 'observer') {
                if (Graph.length_squared(mouse_nogrid, observer.c) < observer.r * observer.r) {
                    draggingObj = -4;
                    draggingPart = {};
                    draggingPart.mouse0 = mouse;
                    draggingPart.mouse1 = mouse;
                    draggingPart.snapData = {};
                    return;
                }
            }

            var draggingPart_ = {};
            var click_lensq = Infinity;
            var click_lensq_temp;
            var targetObj_index = -1;
            var targetIsPoint = false;

            for (var i = 0; i < elements.length; i++) {
                if (typeof elements[i] != 'undefined') {
                    draggingPart_ = {};
                    if (Element[elements[i].type].clicked(elements[i], mouse_nogrid, mouse, draggingPart_)) {
                        if (draggingPart_.targetPoint) {
                            targetIsPoint = true;
                            click_lensq_temp = Graph.length_squared(mouse_nogrid, draggingPart_.targetPoint);
                            if (click_lensq_temp <= click_lensq) {
                                targetObj_index = i;
                                click_lensq = click_lensq_temp;
                                draggingPart = draggingPart_;
                            }
                        } else if (!targetIsPoint) {
                            targetObj_index = i;
                            draggingPart = draggingPart_;
                        }
                    }
                }
            }
            if (targetObj_index != -1) {
                selectObj(targetObj_index);
                draggingPart.originalObj = JSON.parse(JSON.stringify(elements[targetObj_index]));
                draggingPart.hasDuplicated = false;
                draggingObj = targetObj_index;
                return;
            }
        }

        if (draggingObj == -1) {
            if ((AddingObjType == '') || (e.which == 3)) {
                draggingObj = -3;
                draggingPart = {};
                draggingPart.mouse0 = mouse;
                draggingPart.mouse1 = mouse;
                draggingPart.mouse2 = origin;
                draggingPart.snapData = {};
                document.getElementById('obj_settings').style.display = 'none';
                selectedObj = -1;
            } else {
                elements[elements.length] = Element[AddingObjType].create(mouse);
                isConstructing = true;
                constructionPoint = mouse;
                if (elements[selectedObj]) {
                    if (hasSameAttrType(elements[selectedObj], elements[elements.length - 1])) {
                        elements[elements.length - 1].p = elements[selectedObj].p;
                    }
                }
                selectObj(elements.length - 1);
                Element[elements[elements.length - 1].type].c_mousedown(elements[elements.length - 1], mouse);
            }
        }
    }
}

function canvas_onmousemove(e) {
    if (e.changedTouches) {
        var et = e.changedTouches[0];
    } else {
        var et = e;
    }
    var mouse_nogrid = Graph.point((et.pageX - e.target.offsetLeft - origin.x) / scale, (et.pageY - e.target.offsetTop - origin.y) / scale);
    var mouse2;

    if (document.getElementById('grid').checked && !(e.altKey && !isConstructing)) {
        mouse2 = Graph.point(Math.round(((et.pageX - e.target.offsetLeft - origin.x) / scale) / gridSize) * gridSize, Math.round(((et.pageY - e.target.offsetTop - origin.y) / scale) / gridSize) * gridSize);
    } else {
        mouse2 = mouse_nogrid;
    }

    if (mouse2.x == mouse.x && mouse2.y == mouse.y) {
        return;
    }
    mouse = mouse2;

    if (isConstructing) {
        Element[elements[elements.length - 1].type].c_mousemove(elements[elements.length - 1], mouse, e.ctrlKey, e.shiftKey);
    } else {
        if (draggingObj == -4) {
            if (e.shiftKey) {
                var mouse_snapped = snapToDirection(mouse, draggingPart.mouse0, [{x: 1, y: 0}, {
                    x: 0,
                    y: 1
                }], draggingPart.snapData);
            } else {
                var mouse_snapped = mouse;
                draggingPart.snapData = {};
            }

            var mouseDiffX = (mouse_snapped.x - draggingPart.mouse1.x);
            var mouseDiffY = (mouse_snapped.y - draggingPart.mouse1.y);

            observer.c.x += mouseDiffX;
            observer.c.y += mouseDiffY;

            draggingPart.mouse1 = mouse_snapped;
            draw();
        }

        if (draggingObj >= 0) {

            Element[elements[draggingObj].type].dragging(elements[draggingObj], mouse, draggingPart, e.ctrlKey, e.shiftKey);

            if (draggingPart.part == 0) {
                if (e.ctrlKey && !draggingPart.hasDuplicated) {
                    elements[elements.length] = draggingPart.originalObj;
                    draggingPart.hasDuplicated = true;
                }
                if (!e.ctrlKey && draggingPart.hasDuplicated) {
                    elements.length--;
                    draggingPart.hasDuplicated = false;
                }
            }

            draw();
        }

        if (draggingObj == -3) {
            if (e.shiftKey) {
                var mouse_snapped = snapToDirection(mouse_nogrid, draggingPart.mouse0, [{x: 1, y: 0}, {
                    x: 0,
                    y: 1
                }], draggingPart.snapData);
            } else {
                var mouse_snapped = mouse_nogrid;
                draggingPart.snapData = {};
            }

            var mouseDiffX = (mouse_snapped.x - draggingPart.mouse1.x);
            var mouseDiffY = (mouse_snapped.y - draggingPart.mouse1.y);

            origin.x = mouseDiffX * scale + draggingPart.mouse2.x;
            origin.y = mouseDiffY * scale + draggingPart.mouse2.y;
            draw();
        }
    }
}

function canvas_onmouseup(e) {
    if (isConstructing) {
        if ((e.which && e.which == 1) || (e.changedTouches)) {
            Element[elements[elements.length - 1].type].c_mouseup(elements[elements.length - 1], mouse);
            if (!isConstructing) {
                createUndoPoint();
            }
        }
    } else {
        if (e.which && e.which == 3 && draggingObj == -3 && mouse.x == draggingPart.mouse0.x && mouse.y == draggingPart.mouse0.y) {
            draggingObj = -1;
            draggingPart = {};
            canvas_ondblclick(e);
            return;
        }
        draggingObj = -1;
        draggingPart = {};
        createUndoPoint();
    }
}

function canvas_ondblclick(e) {
    var mouse = Graph.point((e.pageX - e.target.offsetLeft - origin.x) / scale, (e.pageY - e.target.offsetTop - origin.y) / scale);
    if (isConstructing) {
    } else if (mouseOnPoint(mouse, mouse_lastmousedown)) {
        draggingPart = {};
        if (mode == 'observer') {
            if (Graph.length_squared(mouse, observer.c) < observer.r * observer.r) {
                positioningObj = -4;
                draggingPart = {};
                draggingPart.targetPoint = Graph.point(observer.c.x, observer.c.y);
                draggingPart.snapData = {};

                document.getElementById('xybox').style.left = (draggingPart.targetPoint.x * scale + origin.x) + 'px';
                document.getElementById('xybox').style.top = (draggingPart.targetPoint.y * scale + origin.y) + 'px';
                document.getElementById('xybox').value = '(' + (draggingPart.targetPoint.x) + ',' + (draggingPart.targetPoint.y) + ')';
                document.getElementById('xybox').size = document.getElementById('xybox').value.length;
                document.getElementById('xybox').style.display = '';
                document.getElementById('xybox').select();
                document.getElementById('xybox').setSelectionRange(1, document.getElementById('xybox').value.length - 1);
                xyBox_cancelContextMenu = true;

                return;
            }
        }

        var draggingPart_ = {};
        var click_lensq = Infinity;
        var click_lensq_temp;
        var targetObj_index = -1;

        for (var i = 0; i < elements.length; i++) {
            if (typeof elements[i] != 'undefined') {
                draggingPart_ = {};
                if (Element[elements[i].type].clicked(elements[i], mouse, mouse, draggingPart_)) {
                    if (draggingPart_.targetPoint) {
                        click_lensq_temp = Graph.length_squared(mouse, draggingPart_.targetPoint);
                        if (click_lensq_temp <= click_lensq) {
                            targetObj_index = i;
                            click_lensq = click_lensq_temp;
                            draggingPart = draggingPart_;
                        }
                    }
                }
            }
        }
        if (targetObj_index != -1) {
            selectObj(targetObj_index);
            draggingPart.originalObj = JSON.parse(JSON.stringify(elements[targetObj_index]));
            draggingPart.hasDuplicated = false;
            positioningObj = targetObj_index;

            document.getElementById('xybox').style.left = (draggingPart.targetPoint.x * scale + origin.x) + 'px';
            document.getElementById('xybox').style.top = (draggingPart.targetPoint.y * scale + origin.y) + 'px';
            document.getElementById('xybox').value = '(' + (draggingPart.targetPoint.x) + ',' + (draggingPart.targetPoint.y) + ')';
            document.getElementById('xybox').size = document.getElementById('xybox').value.length;
            document.getElementById('xybox').style.display = '';
            document.getElementById('xybox').select();
            document.getElementById('xybox').setSelectionRange(1, document.getElementById('xybox').value.length - 1);
            xyBox_cancelContextMenu = true;
        }
    }
}

window.onresize = function (e) {
    if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw();
    }
};

function selectObj(index) {
    if (index < 0 || index >= elements.length) {
        selectedObj = -1;
        document.getElementById('obj_settings').style.display = 'none';
        return;
    }
    selectedObj = index;
    document.getElementById('obj_name').innerHTML = document.getElementById('tool_' + elements[index].type).dataset['n'];
    if (Element[elements[index].type].p_name) {
        document.getElementById('p_box').style.display = '';
        var p_temp = elements[index].p;
        document.getElementById('p_name').innerHTML = document.getElementById('tool_' + elements[index].type).dataset['p'];
        document.getElementById('objAttr_range').min = Element[elements[index].type].p_min;
        document.getElementById('objAttr_range').max = Element[elements[index].type].p_max;
        document.getElementById('objAttr_range').step = Element[elements[index].type].p_step;
        document.getElementById('objAttr_range').value = p_temp;
        document.getElementById('objAttr_text').value = p_temp;
        elements[index].p = p_temp;
        for (var i = 0; i < elements.length; i++) {
            if (i != selectedObj && hasSameAttrType(elements[i], elements[selectedObj])) {
                document.getElementById('setAttrAll_box').style.display = '';
                break;
            }
            if (i == elements.length - 1) {
                document.getElementById('setAttrAll_box').style.display = 'none';
            }
        }
    } else {
        document.getElementById('p_box').style.display = 'none';
    }

    document.getElementById('obj_settings').style.display = '';
}

function hasSameAttrType(obj1, obj2) {
    return document.getElementById('tool_' + obj1.type).dataset['n'] == document.getElementById('tool_' + obj2.type).dataset['n'];
}

function setAttr(value) {
    elements[selectedObj].p = value;
    document.getElementById('objAttr_text').value = value;
    document.getElementById('objAttr_range').value = value;
    if (document.getElementById('setAttrAll').checked) {
        for (var i = 0; i < elements.length; i++) {
            if (hasSameAttrType(elements[i], elements[selectedObj])) {
                elements[i].p = value;
            }
        }
    }
    draw();
}

function confirmPositioning(ctrl, shift) {
    var xyData = JSON.parse('[' + document.getElementById('xybox').value.replace(/\(|\)/g, '') + ']');
    if (xyData.length == 2) {
        if (positioningObj == -4) {
            observer.c.x = xyData[0];
            observer.c.y = xyData[1];
        } else {
            Element[elements[positioningObj].type].dragging(elements[positioningObj], Graph.point(xyData[0], xyData[1]), draggingPart, ctrl, shift);
        }
        draw();
        createUndoPoint();
    }

    endPositioning();
}

function endPositioning() {
    document.getElementById('xybox').style.display = 'none';
    positioningObj = -1;
    draggingPart = {};
}

function removeObj(index) {
    for (var i = index; i < elements.length - 1; i++) {
        elements[i] = JSON.parse(JSON.stringify(elements[i + 1]));
    }
    isConstructing = false;
    elements.length = elements.length - 1;
    selectedObj--;
    selectObj(selectedObj);
}

function createUndoPoint() {
    undoIndex = (undoIndex + 1) % undoLimit;
    undoUBound = undoIndex;
    document.getElementById('undo').disabled = false;
    document.getElementById('redo').disabled = true;
    undoArr[undoIndex] = document.getElementById('textarea1').value;
    if (undoUBound == undoLBound) {
        undoLBound = (undoLBound + 1) % undoLimit;
    }
}

function undo() {
    if (isConstructing) {
        isConstructing = false;
        elements.length--;
        selectObj(-1);

        draw();
        return;
    }
    if (positioningObj != -1) {
        endPositioning();
        return;
    }
    if (undoIndex == undoLBound)
        return;

    undoIndex = (undoIndex + (undoLimit - 1)) % undoLimit;
    document.getElementById('textarea1').value = undoArr[undoIndex];
    jsonImportFromHiddenField();
    document.getElementById('redo').disabled = false;
    if (undoIndex == undoLBound) {
        document.getElementById('undo').disabled = true;
    }
}

function redo() {
    isConstructing = false;
    endPositioning();
    if (undoIndex == undoUBound)
        return;

    undoIndex = (undoIndex + 1) % undoLimit;
    document.getElementById('textarea1').value = undoArr[undoIndex];
    jsonImportFromHiddenField();
    document.getElementById('undo').disabled = false;
    if (undoIndex == undoUBound) {
        document.getElementById('redo').disabled = true;
    }
}

function initParameters() {
    isConstructing = false;
    endPositioning();
    elements.length = 0;
    selectObj(-1);

    rayDensity_light = 0.1;
    rayDensity_images = 1;
    window.toolBarViewModel.rayDensity.value(rayDensity_light);
    extendLight = false;
    showLight = true;
    origin = {x: 0, y: 0};
    observer = null;
    scale = 1;
    window.toolBarViewModel.zoom.value(scale * 100);
    toolbtn_clicked('laser');
    modebtn_clicked('light');

    //Reset new UI.
    window.toolBarViewModel.tools.selected("Ray");
    window.toolBarViewModel.modes.selected("Rays");
    window.toolBarViewModel.c1.selected(false);
    window.toolBarViewModel.c2.selected(false);
    window.toolBarViewModel.c3.selected(false);

    document.getElementById('lockobjs').checked = false;
    document.getElementById('grid').checked = false;
    document.getElementById('showgrid').checked = false;
    document.getElementById('setAttrAll').checked = false;

    draw();
}

window.onkeydown = function (e) {
    //Ctrl+Z
    if (e.ctrlKey && e.keyCode == 90) {
        if (document.getElementById('undo').disabled == false) {
            undo();
        }
        return false;
    }

    //Ctrl+D
    if (e.ctrlKey && e.keyCode == 68) {
        elements[elements.length] = JSON.parse(JSON.stringify(elements[selectedObj]));
        draw();
        createUndoPoint();
        return false;
    }

    //Ctrl+Y
    if (e.ctrlKey && e.keyCode == 89) {
        document.getElementById('redo').onclick();
    }

    //Ctrl+S
    if (e.ctrlKey && e.keyCode == 83) {
        document.getElementById('save').onclick();
    }

    //Ctrl+O
    if (e.ctrlKey && e.keyCode == 79) {
        document.getElementById('open').onclick();
    }

    //Delete
    if (e.keyCode == 46 || e.keyCode == 8) {
        if (selectedObj != -1) {
            removeObj(selectedObj);
            draw();
            createUndoPoint();
        }
        return false;
    }

    //Arrow Keys
    if (e.keyCode >= 37 && e.keyCode <= 40) {
        var step = document.getElementById('grid').checked ? gridSize : 1;
        if (selectedObj >= 0) {
            if (e.keyCode == 37) {
                Element[elements[selectedObj].type].move(elements[selectedObj], -step, 0);
            }
            if (e.keyCode == 38) {
                Element[elements[selectedObj].type].move(elements[selectedObj], 0, -step);
            }
            if (e.keyCode == 39) {
                Element[elements[selectedObj].type].move(elements[selectedObj], step, 0);
            }
            if (e.keyCode == 40) {
                Element[elements[selectedObj].type].move(elements[selectedObj], 0, step);
            }
        } else if (mode == 'observer') {
            if (e.keyCode == 37) {
                observer.c.x -= step;
            }
            if (e.keyCode == 38) {
                observer.c.y -= step;
            }
            if (e.keyCode == 39) {
                observer.c.x += step;
            }
            if (e.keyCode == 40) {
                observer.c.y += step;
            }
        } else {
            for (var i = 0; i < elements.length; i++) {
                if (e.keyCode == 37) {
                    Element[elements[i].type].move(elements[i], -step, 0);
                }
                if (e.keyCode == 38) {
                    Element[elements[i].type].move(elements[i], 0, -step);
                }
                if (e.keyCode == 39) {
                    Element[elements[i].type].move(elements[i], step, 0);
                }
                if (e.keyCode == 40) {
                    Element[elements[i].type].move(elements[i], 0, step);
                }
            }
        }
        draw();
    }
};

window.onkeyup = function (e) {
    //Arrow Keys
    if (e.keyCode >= 37 && e.keyCode <= 40) {
        createUndoPoint();
    }
};

function toolbtn_mouseentered(tool, e) {
    hideAllLists();
}

function toolbtn_clicked(tool, e) {
    tools_normal.forEach(function (element, index) {
        document.getElementById('tool_' + element).className = 'toolbtn';

    });

    tools_withList.forEach(function (element, index) {
        document.getElementById('tool_' + element).className = 'toolbtn';
    });

    tools_inList.forEach(function (element, index) {
        document.getElementById('tool_' + element).className = 'toollistbtn';
    });

    hideAllLists();

    document.getElementById('tool_' + tool).className = 'toolbtnselected';
    AddingObjType = tool;
    if (tool == "mirror_") {
        var t = window.toolBarViewModel.mirrors.selected();
        if (t == "Segment")
            AddingObjType = "mirror";
        else if (t == "Circular Arc")
            AddingObjType = "arcmirror";
        else if (t == "Ideal Curved")
            AddingObjType = "idealmirror";
    } else if (tool == "refractor_") {
        var t = window.toolBarViewModel.glasses.selected();
        if (t == "Half-plane")
            AddingObjType = "halfplane";
        else if (t == "Circle")
            AddingObjType = "circlelens";
        else if (t == "Free-shape")
            AddingObjType = "refractor";
        else if (t == "Ideal Lens")
            AddingObjType = "lens";
    }
}

function toolbtnwithlist_mouseentered(tool, e) {
}

function toolbtnwithlist_mouseleft(tool, e) {
}

function toollist_mouseleft(tool, e) {
    var rect = document.getElementById('tool_' + tool).getBoundingClientRect();
    mouse = Graph.point(e.pageX, e.pageY);
    if (mouse.x < rect.left || mouse.x > rect.right || mouse.y < rect.top || mouse.y > rect.bottom + 5) {
        document.getElementById('tool_' + tool + 'list').style.display = 'none';
        if (document.getElementById('tool_' + tool).className == 'toolbtnwithlisthover') {
            document.getElementById('tool_' + tool).className = 'toolbtn';
        }
    }
}

function hideAllLists() {
    tools_withList.forEach(function (element, index) {
        document.getElementById('tool_' + element + 'list').style.display = 'none';
        if (document.getElementById('tool_' + element).className == 'toolbtnwithlisthover') {
            document.getElementById('tool_' + element).className = 'toolbtn';
        }
    });
}

function toollistbtn_clicked(tool, e) {
    var selected_toolbtn;
    var selecting_toolbtnwithlist;
    tools_withList.forEach(function (element, index) {
        if (document.getElementById('tool_' + element).className == 'toolbtnwithlisthover') {
            selecting_toolbtnwithlist = element;
        }
        if (document.getElementById('tool_' + element).className == 'toolbtnselected') {
            selected_toolbtn = element;
        }
    });

    if (!selecting_toolbtnwithlist) {
        selecting_toolbtnwithlist = selected_toolbtn;
    }

    tools_normal.forEach(function (element, index) {
        document.getElementById('tool_' + element).className = 'toolbtn';
    });
    tools_withList.forEach(function (element, index) {
        document.getElementById('tool_' + element).className = 'toolbtn';
    });
    tools_inList.forEach(function (element, index) {
        document.getElementById('tool_' + element).className = 'toollistbtn';
    });

    hideAllLists();

    document.getElementById('tool_' + selecting_toolbtnwithlist).className = 'toolbtnselected';
    document.getElementById('tool_' + tool).className = 'toollistbtnselected';
    AddingObjType = tool;
}

function modebtn_clicked(mode1) {
    document.getElementById('mode_' + mode).className = 'toolbtn';
    document.getElementById('mode_' + mode1).className = 'toolbtnselected';
    mode = mode1;
    if (mode == 'images' || mode == 'observer') {

        window.toolBarViewModel.rayDensity.value(Math.log(rayDensity_images));
    } else {
        window.toolBarViewModel.rayDensity.value(Math.log(rayDensity_light));
    }
    if (mode == 'observer' && !observer) {
        observer = Graph.circle(Graph.point((canvas.width * 0.5 - origin.x) / scale, (canvas.height * 0.5 - origin.y) / scale), 20);
    }

    draw();
}

function cancelMousedownEvent(id) {
    document.getElementById(id).onmousedown = function (e) {
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
    };
    document.getElementById(id).ontouchstart = function (e) {
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
    };
}

function setRayDensity(value) {
    if (mode == 'images' || mode == 'observer') {
        rayDensity_images = value;
    } else {
        rayDensity_light = value;
    }
}

function setScale(value) {
    setScaleWithCenter(value, canvas.width / scale / 2, canvas.height / scale / 2);
}

function setScaleWithCenter(value, centerX, centerY) {
    scaleChange = value - scale;
    origin.x *= value / scale;
    origin.y *= value / scale;
    origin.x -= centerX * scaleChange;
    origin.y -= centerY * scaleChange;
    scale = value;
    draw();
}
