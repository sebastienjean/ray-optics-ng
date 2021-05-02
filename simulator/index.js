﻿var canvasPainter = {
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

var objTypes = {};

objTypes['lineobj'] = {

    c_mousedown: function (obj, mouse) {
        obj.p2 = mouse;
        if (!mouseOnPoint_construct(mouse, obj.p1)) {
            draw();
        }
    },

    c_mousemove: function (obj, mouse, ctrl, shift) {
        if (shift) {
            obj.p2 = snapToDirection(mouse, constructionPoint, [{x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {
                x: 1,
                y: -1
            }]);
        } else {
            obj.p2 = mouse;
        }

        obj.p1 = ctrl ? Graph.point(2 * constructionPoint.x - obj.p2.x, 2 * constructionPoint.y - obj.p2.y) : constructionPoint;

        if (!mouseOnPoint_construct(mouse, obj.p1)) {
            draw();
        }
    },

    c_mouseup: function (obj, mouse) {
        if (!mouseOnPoint_construct(mouse, obj.p1)) {
            isConstructing = false;
        }
    },

    move: function (obj, diffX, diffY) {
        obj.p1.x = obj.p1.x + diffX;
        obj.p1.y = obj.p1.y + diffY;
        obj.p2.x = obj.p2.x + diffX;
        obj.p2.y = obj.p2.y + diffY;
    },

    clicked: function (obj, mouse_nogrid, mouse, draggingPart) {
        if (mouseOnPoint(mouse_nogrid, obj.p1) && Graph.length_squared(mouse_nogrid, obj.p1) <= Graph.length_squared(mouse_nogrid, obj.p2)) {
            draggingPart.part = 1;
            draggingPart.targetPoint = Graph.point(obj.p1.x, obj.p1.y);
            return true;
        }
        if (mouseOnPoint(mouse_nogrid, obj.p2)) {
            draggingPart.part = 2;
            draggingPart.targetPoint = Graph.point(obj.p2.x, obj.p2.y);
            return true;
        }
        if (mouseOnSegment(mouse_nogrid, obj)) {
            draggingPart.part = 0;
            draggingPart.mouse0 = mouse;
            draggingPart.mouse1 = mouse;
            draggingPart.snapData = {};
            return true;
        }
        return false;
    },

    dragging: function (obj, mouse, draggingPart, ctrl, shift) {
        var basePoint;
        if (draggingPart.part == 1) {
            basePoint = ctrl ? Graph.midpoint(draggingPart.originalObj) : draggingPart.originalObj.p2;

            obj.p1 = shift ? snapToDirection(mouse, basePoint, [{x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {
                x: 1,
                y: -1
            }, {
                x: (draggingPart.originalObj.p2.x - draggingPart.originalObj.p1.x),
                y: (draggingPart.originalObj.p2.y - draggingPart.originalObj.p1.y)
            }]) : mouse;
            obj.p2 = ctrl ? Graph.point(2 * basePoint.x - obj.p1.x, 2 * basePoint.y - obj.p1.y) : basePoint;
        }
        if (draggingPart.part == 2) {
            basePoint = ctrl ? Graph.midpoint(draggingPart.originalObj) : draggingPart.originalObj.p1;

            obj.p2 = shift ? snapToDirection(mouse, basePoint, [{x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {
                x: 1,
                y: -1
            }, {
                x: (draggingPart.originalObj.p2.x - draggingPart.originalObj.p1.x),
                y: (draggingPart.originalObj.p2.y - draggingPart.originalObj.p1.y)
            }]) : mouse;
            obj.p1 = ctrl ? Graph.point(2 * basePoint.x - obj.p2.x, 2 * basePoint.y - obj.p2.y) : basePoint;
        }
        if (draggingPart.part == 0) {
            if (shift) {
                var mouse_snapped = snapToDirection(mouse, draggingPart.mouse0, [{x: 1, y: 0}, {
                    x: 0,
                    y: 1
                }, {
                    x: (draggingPart.originalObj.p2.x - draggingPart.originalObj.p1.x),
                    y: (draggingPart.originalObj.p2.y - draggingPart.originalObj.p1.y)
                }, {
                    x: (draggingPart.originalObj.p2.y - draggingPart.originalObj.p1.y),
                    y: -(draggingPart.originalObj.p2.x - draggingPart.originalObj.p1.x)
                }], draggingPart.snapData);
            } else {
                var mouse_snapped = mouse;
                draggingPart.snapData = {};
            }

            var mouseDiffX = draggingPart.mouse1.x - mouse_snapped.x;
            var mouseDiffY = draggingPart.mouse1.y - mouse_snapped.y;

            obj.p1.x = obj.p1.x - mouseDiffX;
            obj.p1.y = obj.p1.y - mouseDiffY;

            obj.p2.x = obj.p2.x - mouseDiffX;
            obj.p2.y = obj.p2.y - mouseDiffY;

            draggingPart.mouse1 = mouse_snapped;
        }
    },

    rayIntersection: function (obj, ray) {
        var rp_temp = Graph.intersection_2line(Graph.line(ray.p1, ray.p2), Graph.line(obj.p1, obj.p2));

        if (Graph.intersection_is_on_segment(rp_temp, obj) && Graph.intersection_is_on_ray(rp_temp, ray)) {
            return rp_temp;
        }
    }
};

//"halfplane"
objTypes['halfplane'] = {

    p_name: 'Refractive index',
    p_min: 1,
    p_max: 3,
    p_step: 0.01,

    supportSurfaceMerging: true,

    create: function (mouse) {
        return {type: 'halfplane', p1: mouse, p2: mouse, p: 1.5};
    },

    c_mousedown: objTypes['lineobj'].c_mousedown,
    c_mousemove: objTypes['lineobj'].c_mousemove,
    c_mouseup: objTypes['lineobj'].c_mouseup,
    move: objTypes['lineobj'].move,

    clicked: function (obj, mouse_nogrid, mouse, draggingPart) {
        if (mouseOnPoint(mouse_nogrid, obj.p1) && Graph.length_squared(mouse_nogrid, obj.p1) <= Graph.length_squared(mouse_nogrid, obj.p2)) {
            draggingPart.part = 1;
            draggingPart.targetPoint = Graph.point(obj.p1.x, obj.p1.y);
            return true;
        }
        if (mouseOnPoint(mouse_nogrid, obj.p2)) {
            draggingPart.part = 2;
            draggingPart.targetPoint = Graph.point(obj.p2.x, obj.p2.y);
            return true;
        }
        if (mouseOnLine(mouse_nogrid, obj)) {
            draggingPart.part = 0;
            draggingPart.mouse0 = mouse;
            draggingPart.mouse1 = mouse;
            draggingPart.snapData = {};
            return true;
        }
        return false;
    },

    dragging: function (obj, mouse, draggingPart, ctrl, shift) {
        var basePoint;
        if (draggingPart.part == 1) {
            basePoint = ctrl ? Graph.midpoint(draggingPart.originalObj) : draggingPart.originalObj.p2;

            obj.p1 = shift ? snapToDirection(mouse, basePoint, [{x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {
                x: 1,
                y: -1
            }, {
                x: (draggingPart.originalObj.p2.x - draggingPart.originalObj.p1.x),
                y: (draggingPart.originalObj.p2.y - draggingPart.originalObj.p1.y)
            }]) : mouse;
            obj.p2 = ctrl ? Graph.point(2 * basePoint.x - obj.p2.x, 2 * basePoint.y - obj.p2.y) : basePoint;
        }
        if (draggingPart.part == 2) {
            basePoint = ctrl ? Graph.midpoint(draggingPart.originalObj) : draggingPart.originalObj.p1;

            obj.p2 = shift ? snapToDirection(mouse, basePoint, [{x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {
                x: 1,
                y: -1
            }, {
                x: (draggingPart.originalObj.p2.x - draggingPart.originalObj.p1.x),
                y: (draggingPart.originalObj.p2.y - draggingPart.originalObj.p1.y)
            }]) : mouse;
            obj.p1 = ctrl ? Graph.point(2 * basePoint.x - obj.p2.x, 2 * basePoint.y - obj.p2.y) : basePoint;
        }
        if (draggingPart.part == 0) {
            if (shift) {
                var mouse_snapped = snapToDirection(mouse, draggingPart.mouse0, [{
                    x: (draggingPart.originalObj.p2.x - draggingPart.originalObj.p1.x),
                    y: (draggingPart.originalObj.p2.y - draggingPart.originalObj.p1.y)
                }, {
                    x: (draggingPart.originalObj.p2.y - draggingPart.originalObj.p1.y),
                    y: -(draggingPart.originalObj.p2.x - draggingPart.originalObj.p1.x)
                }], draggingPart.snapData);
            } else {
                var mouse_snapped = mouse;
                draggingPart.snapData = {};
            }

            var mouseDiffX = draggingPart.mouse1.x - mouse_snapped.x;
            var mouseDiffY = draggingPart.mouse1.y - mouse_snapped.y;

            obj.p1.x = obj.p1.x - mouseDiffX;
            obj.p1.y = obj.p1.y - mouseDiffY;

            obj.p2.x = obj.p2.x - mouseDiffX;
            obj.p2.y = obj.p2.y - mouseDiffY;

            draggingPart.mouse1 = mouse_snapped;
        }
    },

    rayIntersection: function (obj, ray) {
        if (obj.p <= 0) return;
        var rp_temp = Graph.intersection_2line(Graph.line(ray.p1, ray.p2), Graph.line(obj.p1, obj.p2));

        if (Graph.intersection_is_on_ray(rp_temp, ray)) {
            return rp_temp;
        }
    },

    draw: function (obj, canvas, aboveLight) {
        if (!aboveLight) {
            var len = Math.sqrt((obj.p2.x - obj.p1.x) * (obj.p2.x - obj.p1.x) + (obj.p2.y - obj.p1.y) * (obj.p2.y - obj.p1.y));
            var par_x = (obj.p2.x - obj.p1.x) / len;
            var par_y = (obj.p2.y - obj.p1.y) / len;
            var per_x = par_y;
            var per_y = -par_x;

            var sufficientlyLargeDistance = (Math.abs(obj.p1.x + origin.x) + Math.abs(obj.p1.y + origin.y) + canvas.height + canvas.width) / Math.min(1, scale);

            ctx.beginPath();
            ctx.moveTo(obj.p1.x - par_x * sufficientlyLargeDistance, obj.p1.y - par_y * sufficientlyLargeDistance);
            ctx.lineTo(obj.p1.x + par_x * sufficientlyLargeDistance, obj.p1.y + par_y * sufficientlyLargeDistance);
            ctx.lineTo(obj.p1.x + (par_x - per_x) * sufficientlyLargeDistance, obj.p1.y + (par_y - per_y) * sufficientlyLargeDistance);
            ctx.lineTo(obj.p1.x - (par_x + per_x) * sufficientlyLargeDistance, obj.p1.y - (par_y + per_y) * sufficientlyLargeDistance);

            objTypes['refractor'].fillGlass(obj.p);
        }

        ctx.fillStyle = 'indigo';
        ctx.fillRect(obj.p1.x - 2, obj.p1.y - 2, 3, 3);
        ctx.fillRect(obj.p2.x - 2, obj.p2.y - 2, 3, 3);
    },

    shot: function (obj, ray, rayIndex, rp, surfaceMerging_objs) {

        var rdots = (ray.p2.x - ray.p1.x) * (obj.p2.x - obj.p1.x) + (ray.p2.y - ray.p1.y) * (obj.p2.y - obj.p1.y);
        var ssq = (obj.p2.x - obj.p1.x) * (obj.p2.x - obj.p1.x) + (obj.p2.y - obj.p1.y) * (obj.p2.y - obj.p1.y);
        var normal = {
            x: rdots * (obj.p2.x - obj.p1.x) - ssq * (ray.p2.x - ray.p1.x),
            y: rdots * (obj.p2.y - obj.p1.y) - ssq * (ray.p2.y - ray.p1.y)
        };

        var shotType = this.getShotType(obj, ray);
        if (shotType == 1) {
            var n1 = obj.p;
        } else if (shotType == -1) {
            var n1 = 1 / obj.p;
        } else {
            ray.exist = false;
            return;
        }

        for (var i = 0; i < surfaceMerging_objs.length; i++) {
            shotType = objTypes[surfaceMerging_objs[i].type].getShotType(surfaceMerging_objs[i], ray);
            if (shotType == 1) {
                n1 *= surfaceMerging_objs[i].p;
            } else if (shotType == -1) {
                n1 /= surfaceMerging_objs[i].p;
            } else if (shotType == 0) {
            } else {
                ray.exist = false;
                return;
            }
        }
        objTypes['refractor'].refract(ray, rayIndex, rp, normal, n1);
    },

    getShotType: function (obj, ray) {
        var rcrosss = (ray.p2.x - ray.p1.x) * (obj.p2.y - obj.p1.y) - (ray.p2.y - ray.p1.y) * (obj.p2.x - obj.p1.x);
        if (rcrosss > 0) {
            return 1;
        }
        if (rcrosss < 0) {
            return -1;
        }
        return 2;
    }
};

//"circlelens"
objTypes['circlelens'] = {

    p_name: 'Refractive index',
    p_min: 1,
    p_max: 3,
    p_step: 0.01,

    supportSurfaceMerging: true,

    create: function (mouse) {
        return {type: 'circlelens', p1: mouse, p2: mouse, p: 1.5};
    },

    //lineobJ
    c_mousedown: objTypes['lineobj'].c_mousedown,
    c_mousemove: function (obj, mouse, ctrl, shift) {
        objTypes['lineobj'].c_mousemove(obj, mouse, false, shift)
    },
    c_mouseup: objTypes['lineobj'].c_mouseup,
    move: objTypes['lineobj'].move,

    clicked: function (obj, mouse_nogrid, mouse, draggingPart) {
        if (mouseOnPoint(mouse_nogrid, obj.p1) && Graph.length_squared(mouse_nogrid, obj.p1) <= Graph.length_squared(mouse_nogrid, obj.p2)) {
            draggingPart.part = 1;
            draggingPart.targetPoint = Graph.point(obj.p1.x, obj.p1.y);
            return true;
        }
        if (mouseOnPoint(mouse_nogrid, obj.p2)) {
            draggingPart.part = 2;
            draggingPart.targetPoint = Graph.point(obj.p2.x, obj.p2.y);
            return true;
        }
        if (Math.abs(Graph.length(obj.p1, mouse_nogrid) - Graph.length_segment(obj)) < clickExtent_line) {
            draggingPart.part = 0;
            draggingPart.mouse0 = mouse;
            draggingPart.mouse1 = mouse;
            draggingPart.snapData = {};
            return true;
        }
        return false;
    },

    dragging: function (obj, mouse, draggingPart, ctrl, shift) {
        objTypes['lineobj'].dragging(obj, mouse, draggingPart, false, shift)
    },

    rayIntersection: function (obj, ray) {
        if (obj.p <= 0) return;
        var rp_temp = Graph.intersection_line_circle(Graph.line(ray.p1, ray.p2), Graph.circle(obj.p1, obj.p2));
        var rp_exist = [];
        var rp_lensq = [];
        for (var i = 1; i <= 2; i++) {

            rp_exist[i] = Graph.intersection_is_on_ray(rp_temp[i], ray) && Graph.length_squared(rp_temp[i], ray.p1) > minShotLength_squared;
            rp_lensq[i] = Graph.length_squared(ray.p1, rp_temp[i]);
        }

        if (rp_exist[1] && ((!rp_exist[2]) || rp_lensq[1] < rp_lensq[2])) {
            return rp_temp[1];
        }
        if (rp_exist[2] && ((!rp_exist[1]) || rp_lensq[2] < rp_lensq[1])) {
            return rp_temp[2];
        }
    },

    draw: function (obj, canvas, aboveLight) {
        if (!aboveLight) {
            ctx.beginPath();
            ctx.arc(obj.p1.x, obj.p1.y, Graph.length_segment(obj), 0, Math.PI * 2, false);
            objTypes['refractor'].fillGlass(obj.p);
        }
        ctx.lineWidth = 1;
        ctx.fillStyle = 'red';
        ctx.fillRect(obj.p1.x - 2, obj.p1.y - 2, 3, 3);
        ctx.fillStyle = 'indigo';
        ctx.fillRect(obj.p2.x - 2, obj.p2.y - 2, 3, 3);
    },

    shot: function (obj, ray, rayIndex, rp, surfaceMerging_objs) {
        var midpoint = Graph.midpoint(Graph.line_segment(ray.p1, rp));
        var d = Graph.length_squared(obj.p1, obj.p2) - Graph.length_squared(obj.p1, midpoint);
        if (d > 0) {
            var n1 = obj.p;
            var normal = {x: obj.p1.x - rp.x, y: obj.p1.y - rp.y};
        } else if (d < 0) {
            var n1 = 1 / obj.p;
            var normal = {x: rp.x - obj.p1.x, y: rp.y - obj.p1.y};
        } else {
            ray.exist = false;
            return;
        }

        var shotType;
        for (var i = 0; i < surfaceMerging_objs.length; i++) {
            shotType = objTypes[surfaceMerging_objs[i].type].getShotType(surfaceMerging_objs[i], ray);
            if (shotType == 1) {
                n1 *= surfaceMerging_objs[i].p;
            } else if (shotType == -1) {
                n1 /= surfaceMerging_objs[i].p;
            } else if (shotType == 0) {
            } else {
                ray.exist = false;
                return;
            }
        }
        objTypes['refractor'].refract(ray, rayIndex, rp, normal, n1);
    },

    getShotType: function (obj, ray) {
        var midpoint = Graph.midpoint(Graph.line_segment(ray.p1, this.rayIntersection(obj, ray)));
        var d = Graph.length_squared(obj.p1, obj.p2) - Graph.length_squared(obj.p1, midpoint);

        if (d > 0) {
            return 1;
        }
        if (d < 0) {
            return -1;
        }
        return 2;
    }
};

//"refractor"
objTypes['refractor'] = {

    p_name: 'Refractive index',
    p_min: 1,
    p_max: 3,
    p_step: 0.01,

    supportSurfaceMerging: true,

    create: function (mouse) {
        return {type: 'refractor', path: [{x: mouse.x, y: mouse.y, arc: false}], notDone: true, p: 1.5};
    },

    c_mousedown: function (obj, mouse) {
        if (obj.path.length > 1) {
            if (obj.path.length > 3 && mouseOnPoint(mouse, obj.path[0])) {
                obj.path.length--;
                obj.notDone = false;
                draw();
                return;
            }
            obj.path[obj.path.length - 1] = {x: mouse.x, y: mouse.y};
            obj.path[obj.path.length - 1].arc = true;
        }
    },

    c_mousemove: function (obj, mouse, ctrl, shift) {
        if (!obj.notDone) {
            return;
        }
        if (typeof obj.path[obj.path.length - 1].arc != 'undefined') {
            if (obj.path[obj.path.length - 1].arc && Math.sqrt(Math.pow(obj.path[obj.path.length - 1].x - mouse.x, 2) + Math.pow(obj.path[obj.path.length - 1].y - mouse.y, 2)) >= 5) {
                obj.path[obj.path.length] = mouse;
                draw();
            }
        } else {
            obj.path[obj.path.length - 1] = {x: mouse.x, y: mouse.y};
            draw();
        }
    },

    c_mouseup: function (obj, mouse) {
        if (!obj.notDone) {
            isConstructing = false;
            draw();
            return;
        }
        if (obj.path.length > 3 && mouseOnPoint(mouse, obj.path[0])) {
            obj.path.length--;
            obj.notDone = false;
            isConstructing = false;
            draw();
            return;
        }
        if (obj.path[obj.path.length - 2] && !obj.path[obj.path.length - 2].arc && mouseOnPoint_construct(mouse, obj.path[obj.path.length - 2])) {
            delete obj.path[obj.path.length - 1].arc;
        } else {
            obj.path[obj.path.length - 1] = {x: mouse.x, y: mouse.y};
            obj.path[obj.path.length - 1].arc = false;
            obj.path[obj.path.length] = {x: mouse.x, y: mouse.y};

        }
        draw();
    },

    draw: function (obj, canvas, aboveLight) {
        var p1, p2, p3;
        var center;
        var r;
        var a1, a2, a3;
        var acw;

        if (obj.notDone) {
            ctx.beginPath();
            ctx.moveTo(obj.path[0].x, obj.path[0].y);

            for (var i = 0; i < obj.path.length - 1; i++) {
                if (obj.path[(i + 1)].arc && !obj.path[i].arc && i < obj.path.length - 2) {
                    p1 = Graph.point(obj.path[i].x, obj.path[i].y);
                    p2 = Graph.point(obj.path[(i + 2)].x, obj.path[(i + 2)].y);
                    p3 = Graph.point(obj.path[(i + 1)].x, obj.path[(i + 1)].y);
                    center = Graph.intersection_2line(Graph.perpendicular_bisector(Graph.line(p1, p3)), Graph.perpendicular_bisector(Graph.line(p2, p3)));
                    if (isFinite(center.x) && isFinite(center.y)) {
                        r = Graph.length(center, p3);
                        a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
                        a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
                        a3 = Math.atan2(p3.y - center.y, p3.x - center.x);
                        acw = (a2 < a3 && a3 < a1) || (a1 < a2 && a2 < a3) || (a3 < a1 && a1 < a2);

                        ctx.arc(center.x, center.y, r, a1, a2, acw);
                    } else {
                        ctx.lineTo(obj.path[(i + 2)].x, obj.path[(i + 2)].y);
                    }
                } else if (!obj.path[(i + 1)].arc && !obj.path[i].arc) {
                    ctx.lineTo(obj.path[(i + 1)].x, obj.path[(i + 1)].y);
                }
            }

            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgb(128,128,128)';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (!aboveLight) {
            ctx.beginPath();
            ctx.moveTo(obj.path[0].x, obj.path[0].y);

            for (var i = 0; i < obj.path.length; i++) {
                if (obj.path[(i + 1) % obj.path.length].arc && !obj.path[i % obj.path.length].arc) {
                    p1 = Graph.point(obj.path[i % obj.path.length].x, obj.path[i % obj.path.length].y);
                    p2 = Graph.point(obj.path[(i + 2) % obj.path.length].x, obj.path[(i + 2) % obj.path.length].y);
                    p3 = Graph.point(obj.path[(i + 1) % obj.path.length].x, obj.path[(i + 1) % obj.path.length].y);
                    center = Graph.intersection_2line(Graph.perpendicular_bisector(Graph.line(p1, p3)), Graph.perpendicular_bisector(Graph.line(p2, p3)));
                    if (isFinite(center.x) && isFinite(center.y)) {
                        r = Graph.length(center, p3);
                        a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
                        a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
                        a3 = Math.atan2(p3.y - center.y, p3.x - center.x);
                        acw = (a2 < a3 && a3 < a1) || (a1 < a2 && a2 < a3) || (a3 < a1 && a1 < a2);

                        ctx.arc(center.x, center.y, r, a1, a2, acw);
                    } else {
                        ctx.lineTo(obj.path[(i + 2) % obj.path.length].x, obj.path[(i + 2) % obj.path.length].y);
                    }

                } else if (!obj.path[(i + 1) % obj.path.length].arc && !obj.path[i % obj.path.length].arc) {
                    ctx.lineTo(obj.path[(i + 1) % obj.path.length].x, obj.path[(i + 1) % obj.path.length].y);
                }
            }
            this.fillGlass(obj.p);
        }
        ctx.lineWidth = 1;


        for (var i = 0; i < obj.path.length; i++) {
            if (typeof obj.path[i].arc != 'undefined') {
                if (obj.path[i].arc) {
                    ctx.fillStyle = 'rgb(255,0,255)';
                    ctx.fillRect(obj.path[i].x - 2, obj.path[i].y - 2, 3, 3);
                } else {
                    ctx.fillStyle = 'rgb(255,0,0)';
                    ctx.fillRect(obj.path[i].x - 2, obj.path[i].y - 2, 3, 3);
                }
            }
        }
    },

    fillGlass: function (n) {
        if (n >= 1) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'white';
            ctx.globalAlpha = Math.log(n) / Math.log(1.5) * 0.2;
            ctx.fill('evenodd');
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';

        } else {
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgb(70,70,70)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    },

    move: function (obj, diffX, diffY) {
        for (var i = 0; i < obj.path.length; i++) {
            obj.path[i].x += diffX;
            obj.path[i].y += diffY;
        }
    },

    clicked: function (obj, mouse_nogrid, mouse, draggingPart) {
        var p1, p2, p3;
        var center;
        var r;
        var a1, a2, a3;
        var click_lensq = Infinity;
        var click_lensq_temp;
        var targetPoint_index = -1;
        for (var i = 0; i < obj.path.length; i++) {
            if (mouseOnPoint(mouse_nogrid, obj.path[i])) {
                click_lensq_temp = Graph.length_squared(mouse_nogrid, obj.path[i]);
                if (click_lensq_temp <= click_lensq) {
                    click_lensq = click_lensq_temp;
                    targetPoint_index = i;
                }
            }
        }
        if (targetPoint_index != -1) {
            draggingPart.part = 1;
            draggingPart.index = targetPoint_index;
            draggingPart.targetPoint = Graph.point(obj.path[targetPoint_index].x, obj.path[targetPoint_index].y);
            return true;
        }

        for (var i = 0; i < obj.path.length; i++) {
            if (obj.path[(i + 1) % obj.path.length].arc && !obj.path[i % obj.path.length].arc) {
                p1 = Graph.point(obj.path[i % obj.path.length].x, obj.path[i % obj.path.length].y);
                p2 = Graph.point(obj.path[(i + 2) % obj.path.length].x, obj.path[(i + 2) % obj.path.length].y);
                p3 = Graph.point(obj.path[(i + 1) % obj.path.length].x, obj.path[(i + 1) % obj.path.length].y);
                center = Graph.intersection_2line(Graph.perpendicular_bisector(Graph.line(p1, p3)), Graph.perpendicular_bisector(Graph.line(p2, p3)));
                if (isFinite(center.x) && isFinite(center.y)) {
                    r = Graph.length(center, p3);
                    a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
                    a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
                    a3 = Math.atan2(p3.y - center.y, p3.x - center.x);
                    var a_m = Math.atan2(mouse_nogrid.y - center.y, mouse_nogrid.x - center.x);
                    if (Math.abs(Graph.length(center, mouse_nogrid) - r) < clickExtent_line && (((a2 < a3 && a3 < a1) || (a1 < a2 && a2 < a3) || (a3 < a1 && a1 < a2)) == ((a2 < a_m && a_m < a1) || (a1 < a2 && a2 < a_m) || (a_m < a1 && a1 < a2)))) {
                        draggingPart.part = 0;
                        draggingPart.mouse0 = mouse;
                        draggingPart.mouse1 = mouse;
                        draggingPart.snapData = {};
                        return true;
                    }
                } else {
                    if (mouseOnSegment(mouse_nogrid, Graph.segment(obj.path[(i) % obj.path.length], obj.path[(i + 2) % obj.path.length]))) {
                        draggingPart.part = 0;
                        draggingPart.mouse0 = mouse;
                        draggingPart.mouse1 = mouse;
                        draggingPart.snapData = {};
                        return true;
                    }
                }
            } else if (!obj.path[(i + 1) % obj.path.length].arc && !obj.path[i % obj.path.length].arc) {
                if (mouseOnSegment(mouse_nogrid, Graph.segment(obj.path[(i) % obj.path.length], obj.path[(i + 1) % obj.path.length]))) {
                    draggingPart.part = 0;
                    draggingPart.mouse0 = mouse;
                    draggingPart.mouse1 = mouse;
                    draggingPart.snapData = {};
                    return true;
                }
            }
        }
    },

    dragging: function (obj, mouse, draggingPart, ctrl, shift) {
        if (draggingPart.part == 1) {
            obj.path[draggingPart.index].x = mouse.x;
            obj.path[draggingPart.index].y = mouse.y;
        }

        if (draggingPart.part == 0) {
            if (shift) {
                var mouse_snapped = snapToDirection(mouse, draggingPart.mouse0, [{x: 1, y: 0}, {
                    x: 0,
                    y: 1
                }], draggingPart.snapData);
            } else {
                var mouse_snapped = mouse;
                draggingPart.snapData = {};
            }
            this.move(obj, mouse_snapped.x - draggingPart.mouse1.x, mouse_snapped.y - draggingPart.mouse1.y);
            draggingPart.mouse1 = mouse_snapped;
        }
    },

    rayIntersection: function (obj, ray) {
        if (obj.notDone || obj.p <= 0) return;

        var s_lensq = Infinity;
        var s_lensq_temp;
        var s_point = null;
        var s_point_temp = null;
        var rp_exist = [];
        var rp_lensq = [];
        var rp_temp;
        var p1, p2, p3;
        var center;
        var r;

        for (var i = 0; i < obj.path.length; i++) {
            s_point_temp = null;
            if (obj.path[(i + 1) % obj.path.length].arc && !obj.path[i % obj.path.length].arc) {
                p1 = Graph.point(obj.path[i % obj.path.length].x, obj.path[i % obj.path.length].y);
                p2 = Graph.point(obj.path[(i + 2) % obj.path.length].x, obj.path[(i + 2) % obj.path.length].y);
                p3 = Graph.point(obj.path[(i + 1) % obj.path.length].x, obj.path[(i + 1) % obj.path.length].y);
                center = Graph.intersection_2line(Graph.perpendicular_bisector(Graph.line(p1, p3)), Graph.perpendicular_bisector(Graph.line(p2, p3)));
                if (isFinite(center.x) && isFinite(center.y)) {
                    r = Graph.length(center, p3);
                    rp_temp = Graph.intersection_line_circle(Graph.line(ray.p1, ray.p2), Graph.circle(center, p2));
                    for (var ii = 1; ii <= 2; ii++) {
                        rp_exist[ii] = !Graph.intersection_is_on_segment(Graph.intersection_2line(Graph.line(p1, p2), Graph.line(p3, rp_temp[ii])), Graph.segment(p3, rp_temp[ii])) && Graph.intersection_is_on_ray(rp_temp[ii], ray) && Graph.length_squared(rp_temp[ii], ray.p1) > minShotLength_squared;
                        rp_lensq[ii] = Graph.length_squared(ray.p1, rp_temp[ii]);
                    }
                    if (rp_exist[1] && ((!rp_exist[2]) || rp_lensq[1] < rp_lensq[2]) && rp_lensq[1] > minShotLength_squared) {
                        s_point_temp = rp_temp[1];
                        s_lensq_temp = rp_lensq[1];
                    }
                    if (rp_exist[2] && ((!rp_exist[1]) || rp_lensq[2] < rp_lensq[1]) && rp_lensq[2] > minShotLength_squared) {
                        s_point_temp = rp_temp[2];
                        s_lensq_temp = rp_lensq[2];
                    }
                } else {
                    var rp_temp = Graph.intersection_2line(Graph.line(ray.p1, ray.p2), Graph.line(obj.path[i % obj.path.length], obj.path[(i + 2) % obj.path.length]));

                    if (Graph.intersection_is_on_segment(rp_temp, Graph.segment(obj.path[i % obj.path.length], obj.path[(i + 2) % obj.path.length])) && Graph.intersection_is_on_ray(rp_temp, ray) && Graph.length_squared(ray.p1, rp_temp) > minShotLength_squared) {
                        s_lensq_temp = Graph.length_squared(ray.p1, rp_temp);
                        s_point_temp = rp_temp;
                    }
                }
            } else if (!obj.path[(i + 1) % obj.path.length].arc && !obj.path[i % obj.path.length].arc) {
                var rp_temp = Graph.intersection_2line(Graph.line(ray.p1, ray.p2), Graph.line(obj.path[i % obj.path.length], obj.path[(i + 1) % obj.path.length]));

                if (Graph.intersection_is_on_segment(rp_temp, Graph.segment(obj.path[i % obj.path.length], obj.path[(i + 1) % obj.path.length])) && Graph.intersection_is_on_ray(rp_temp, ray) && Graph.length_squared(ray.p1, rp_temp) > minShotLength_squared) {
                    s_lensq_temp = Graph.length_squared(ray.p1, rp_temp);
                    s_point_temp = rp_temp;
                }
            }
            if (s_point_temp) {
                if (s_lensq_temp < s_lensq) {
                    s_lensq = s_lensq_temp;
                    s_point = s_point_temp;
                }
            }
        }
        if (s_point) {
            return s_point;
        }
    },

    shot: function (obj, ray, rayIndex, rp, surfaceMerging_objs) {
        if (obj.notDone) {
            return;
        }
        var shotData = this.getShotData(obj, ray);
        var shotType = shotData.shotType;
        if (shotType == 1) {
            var n1 = obj.p;
        } else if (shotType == -1) {
            var n1 = 1 / obj.p;
        } else if (shotType == 0) {
            var n1 = 1;
        } else {
            ray.exist = false;
            return;
        }

        for (var i = 0; i < surfaceMerging_objs.length; i++) {
            shotType = objTypes[surfaceMerging_objs[i].type].getShotType(surfaceMerging_objs[i], ray);
            if (shotType == 1) {
                n1 *= surfaceMerging_objs[i].p;
            } else if (shotType == -1) {
                n1 /= surfaceMerging_objs[i].p;
            } else if (shotType == 0) {
            } else {
                ray.exist = false;
                return;
            }
        }

        this.refract(ray, rayIndex, shotData.s_point, shotData.normal, n1);
    },

    getShotType: function (obj, ray) {
        return this.getShotData(obj, ray).shotType;
    },

    getShotData: function (obj, ray) {
        var s_lensq = Infinity;
        var s_lensq_temp;
        var s_point = null;
        var s_point_temp = null;
        var s_point_index;
        var surfaceMultiplicity = 1;
        var rp_on_ray = [];
        var rp_exist = [];
        var rp_lensq = [];
        var rp_temp;
        var rp2_exist = [];
        var rp2_lensq = [];
        var rp2_temp;
        var normal_x;
        var normal_x_temp;
        var normal_y;
        var normal_y_temp;
        var rdots;
        var ssq;
        var nearEdge = false;
        var nearEdge_temp = false;
        var p1, p2, p3;
        var center;
        var ray2 = Graph.ray(ray.p1, Graph.point(ray.p2.x + Math.random() * 1e-5, ray.p2.y + Math.random() * 1e-5));
        var ray_intersect_count = 0;

        for (var i = 0; i < obj.path.length; i++) {
            s_point_temp = null;
            nearEdge_temp = false;
            if (obj.path[(i + 1) % obj.path.length].arc && !obj.path[i % obj.path.length].arc) {
                p1 = Graph.point(obj.path[i % obj.path.length].x, obj.path[i % obj.path.length].y);
                p2 = Graph.point(obj.path[(i + 2) % obj.path.length].x, obj.path[(i + 2) % obj.path.length].y);
                p3 = Graph.point(obj.path[(i + 1) % obj.path.length].x, obj.path[(i + 1) % obj.path.length].y);
                center = Graph.intersection_2line(Graph.perpendicular_bisector(Graph.line(p1, p3)), Graph.perpendicular_bisector(Graph.line(p2, p3)));
                if (isFinite(center.x) && isFinite(center.y)) {
                    rp_temp = Graph.intersection_line_circle(Graph.line(ray.p1, ray.p2), Graph.circle(center, p2));
                    rp2_temp = Graph.intersection_line_circle(Graph.line(ray2.p1, ray2.p2), Graph.circle(center, p2));
                    for (var ii = 1; ii <= 2; ii++) {
                        rp_on_ray[ii] = Graph.intersection_is_on_ray(rp_temp[ii], ray);
                        rp_exist[ii] = rp_on_ray[ii] && !Graph.intersection_is_on_segment(Graph.intersection_2line(Graph.line(p1, p2), Graph.line(p3, rp_temp[ii])), Graph.segment(p3, rp_temp[ii])) && Graph.length_squared(rp_temp[ii], ray.p1) > minShotLength_squared;
                        rp_lensq[ii] = Graph.length_squared(ray.p1, rp_temp[ii]);
                        rp2_exist[ii] = !Graph.intersection_is_on_segment(Graph.intersection_2line(Graph.line(p1, p2), Graph.line(p3, rp2_temp[ii])), Graph.segment(p3, rp2_temp[ii])) && Graph.intersection_is_on_ray(rp2_temp[ii], ray2) && Graph.length_squared(rp2_temp[ii], ray2.p1) > minShotLength_squared;
                        rp2_lensq[ii] = Graph.length_squared(ray2.p1, rp2_temp[ii]);
                    }
                    if (rp_exist[1] && ((!rp_exist[2]) || rp_lensq[1] < rp_lensq[2]) && rp_lensq[1] > minShotLength_squared) {
                        s_point_temp = rp_temp[1];
                        s_lensq_temp = rp_lensq[1];
                        if (rp_on_ray[2] && rp_lensq[1] < rp_lensq[2]) {
                            normal_x_temp = s_point_temp.x - center.x;
                            normal_y_temp = s_point_temp.y - center.y;
                        } else {
                            normal_x_temp = center.x - s_point_temp.x;
                            normal_y_temp = center.y - s_point_temp.y;
                        }
                    }
                    if (rp_exist[2] && ((!rp_exist[1]) || rp_lensq[2] < rp_lensq[1]) && rp_lensq[2] > minShotLength_squared) {
                        s_point_temp = rp_temp[2];
                        s_lensq_temp = rp_lensq[2];
                        if (rp_on_ray[1] && rp_lensq[2] < rp_lensq[1]) {
                            normal_x_temp = s_point_temp.x - center.x;
                            normal_y_temp = s_point_temp.y - center.y;
                        } else {
                            normal_x_temp = center.x - s_point_temp.x;
                            normal_y_temp = center.y - s_point_temp.y;
                        }
                    }
                    if (rp2_exist[1] && rp2_lensq[1] > minShotLength_squared) {
                        ray_intersect_count++;
                    }
                    if (rp2_exist[2] && rp2_lensq[2] > minShotLength_squared) {
                        ray_intersect_count++;
                    }
                    if (s_point_temp && (Graph.length_squared(s_point_temp, p1) < minShotLength_squared || Graph.length_squared(s_point_temp, p2) < minShotLength_squared)) {
                        nearEdge_temp = true;
                    }
                } else {
                    rp_temp = Graph.intersection_2line(Graph.line(ray.p1, ray.p2), Graph.line(obj.path[i % obj.path.length], obj.path[(i + 2) % obj.path.length]));
                    rp2_temp = Graph.intersection_2line(Graph.line(ray2.p1, ray2.p2), Graph.line(obj.path[i % obj.path.length], obj.path[(i + 2) % obj.path.length]));
                    if (Graph.intersection_is_on_segment(rp_temp, Graph.segment(obj.path[i % obj.path.length], obj.path[(i + 2) % obj.path.length])) && Graph.intersection_is_on_ray(rp_temp, ray) && Graph.length_squared(ray.p1, rp_temp) > minShotLength_squared) {
                        s_lensq_temp = Graph.length_squared(ray.p1, rp_temp);
                        s_point_temp = rp_temp;

                        rdots = (ray.p2.x - ray.p1.x) * (obj.path[(i + 2) % obj.path.length].x - obj.path[i % obj.path.length].x) + (ray.p2.y - ray.p1.y) * (obj.path[(i + 2) % obj.path.length].y - obj.path[i % obj.path.length].y);
                        ssq = (obj.path[(i + 2) % obj.path.length].x - obj.path[i % obj.path.length].x) * (obj.path[(i + 2) % obj.path.length].x - obj.path[i % obj.path.length].x) + (obj.path[(i + 2) % obj.path.length].y - obj.path[i % obj.path.length].y) * (obj.path[(i + 2) % obj.path.length].y - obj.path[i % obj.path.length].y);

                        normal_x_temp = rdots * (obj.path[(i + 2) % obj.path.length].x - obj.path[i % obj.path.length].x) - ssq * (ray.p2.x - ray.p1.x);
                        normal_y_temp = rdots * (obj.path[(i + 2) % obj.path.length].y - obj.path[i % obj.path.length].y) - ssq * (ray.p2.y - ray.p1.y);
                    }

                    if (Graph.intersection_is_on_segment(rp2_temp, Graph.segment(obj.path[i % obj.path.length], obj.path[(i + 2) % obj.path.length])) && Graph.intersection_is_on_ray(rp2_temp, ray2) && Graph.length_squared(ray2.p1, rp2_temp) > minShotLength_squared) {
                        ray_intersect_count++;
                    }

                    if (s_point_temp && (Graph.length_squared(s_point_temp, obj.path[i % obj.path.length]) < minShotLength_squared || Graph.length_squared(s_point_temp, obj.path[(i + 2) % obj.path.length]) < minShotLength_squared)) {
                        nearEdge_temp = true;
                    }
                }
            } else if (!obj.path[(i + 1) % obj.path.length].arc && !obj.path[i % obj.path.length].arc) {
                rp_temp = Graph.intersection_2line(Graph.line(ray.p1, ray.p2), Graph.line(obj.path[i % obj.path.length], obj.path[(i + 1) % obj.path.length]));
                rp2_temp = Graph.intersection_2line(Graph.line(ray2.p1, ray2.p2), Graph.line(obj.path[i % obj.path.length], obj.path[(i + 1) % obj.path.length]));
                if (Graph.intersection_is_on_segment(rp_temp, Graph.segment(obj.path[i % obj.path.length], obj.path[(i + 1) % obj.path.length])) && Graph.intersection_is_on_ray(rp_temp, ray) && Graph.length_squared(ray.p1, rp_temp) > minShotLength_squared) {
                    s_lensq_temp = Graph.length_squared(ray.p1, rp_temp);
                    s_point_temp = rp_temp;

                    rdots = (ray.p2.x - ray.p1.x) * (obj.path[(i + 1) % obj.path.length].x - obj.path[i % obj.path.length].x) + (ray.p2.y - ray.p1.y) * (obj.path[(i + 1) % obj.path.length].y - obj.path[i % obj.path.length].y);
                    ssq = (obj.path[(i + 1) % obj.path.length].x - obj.path[i % obj.path.length].x) * (obj.path[(i + 1) % obj.path.length].x - obj.path[i % obj.path.length].x) + (obj.path[(i + 1) % obj.path.length].y - obj.path[i % obj.path.length].y) * (obj.path[(i + 1) % obj.path.length].y - obj.path[i % obj.path.length].y);

                    normal_x_temp = rdots * (obj.path[(i + 1) % obj.path.length].x - obj.path[i % obj.path.length].x) - ssq * (ray.p2.x - ray.p1.x);
                    normal_y_temp = rdots * (obj.path[(i + 1) % obj.path.length].y - obj.path[i % obj.path.length].y) - ssq * (ray.p2.y - ray.p1.y);
                }
                if (Graph.intersection_is_on_segment(rp2_temp, Graph.segment(obj.path[i % obj.path.length], obj.path[(i + 1) % obj.path.length])) && Graph.intersection_is_on_ray(rp2_temp, ray2) && Graph.length_squared(ray2.p1, rp2_temp) > minShotLength_squared) {
                    ray_intersect_count++;
                }
                if (s_point_temp && (Graph.length_squared(s_point_temp, obj.path[i % obj.path.length]) < minShotLength_squared || Graph.length_squared(s_point_temp, obj.path[(i + 1) % obj.path.length]) < minShotLength_squared)) {
                    nearEdge_temp = true;
                }
            }
            if (s_point_temp) {
                if (s_point && Graph.length_squared(s_point_temp, s_point) < minShotLength_squared) {
                    surfaceMultiplicity++;
                } else if (s_lensq_temp < s_lensq) {
                    s_lensq = s_lensq_temp;
                    s_point = s_point_temp;
                    s_point_index = i;
                    normal_x = normal_x_temp;
                    normal_y = normal_y_temp;
                    nearEdge = nearEdge_temp;
                    surfaceMultiplicity = 1;
                }
            }
        }
        if (nearEdge) {
            var shotType = 2;
        } else if (surfaceMultiplicity % 2 == 0) {
            var shotType = 0;
        } else if (ray_intersect_count % 2 == 1) {
            var shotType = 1;
        } else {
            var shotType = -1;
        }

        return {s_point: s_point, normal: {x: normal_x, y: normal_y}, shotType: shotType};
    },

    refract: function (ray, rayIndex, s_point, normal, n1) {
        var normal_len = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        var normal_x = normal.x / normal_len;
        var normal_y = normal.y / normal_len;

        var ray_len = Math.sqrt((ray.p2.x - ray.p1.x) * (ray.p2.x - ray.p1.x) + (ray.p2.y - ray.p1.y) * (ray.p2.y - ray.p1.y));

        var ray_x = (ray.p2.x - ray.p1.x) / ray_len;
        var ray_y = (ray.p2.y - ray.p1.y) / ray_len;

        //http://en.wikipedia.org/wiki/Snell%27s_law#Vector_form

        var cos1 = -normal_x * ray_x - normal_y * ray_y;
        var sq1 = 1 - n1 * n1 * (1 - cos1 * cos1);

        if (sq1 < 0) {
            ray.p1 = s_point;
            ray.p2 = Graph.point(s_point.x + ray_x + 2 * cos1 * normal_x, s_point.y + ray_y + 2 * cos1 * normal_y);
        } else {
            var cos2 = Math.sqrt(sq1);

            var R_s = Math.pow((n1 * cos1 - cos2) / (n1 * cos1 + cos2), 2);
            var R_p = Math.pow((n1 * cos2 - cos1) / (n1 * cos2 + cos1), 2);
            var R = 0.5 * (R_s + R_p);
            //http://en.wikipedia.org/wiki/Fresnel_equations#Definitions_and_power_equations

            var ray2 = Graph.ray(s_point, Graph.point(s_point.x + ray_x + 2 * cos1 * normal_x, s_point.y + ray_y + 2 * cos1 * normal_y));
            ray2.brightness = ray.brightness * R;
            ray2.gap = ray.gap;
            if (ray2.brightness > 0.01) {
                addRay(ray2);
            } else if (!ray.gap) {
                var amp = Math.floor(0.01 / ray2.brightness) + 1;
                if (rayIndex % amp == 0) {
                    ray2.brightness = ray2.brightness * amp;
                    addRay(ray2);
                }
            }

            ray.p1 = s_point;
            ray.p2 = Graph.point(s_point.x + n1 * ray_x + (n1 * cos1 - cos2) * normal_x, s_point.y + n1 * ray_y + (n1 * cos1 - cos2) * normal_y);
            ray.brightness = ray.brightness * (1 - R);
        }
    }
};

//"laser"
objTypes['laser'] = {

    create: function (mouse) {
        return {type: 'laser', p1: mouse, p2: mouse};
    },

    //lineobj
    c_mousedown: objTypes['lineobj'].c_mousedown,
    c_mousemove: objTypes['lineobj'].c_mousemove,
    c_mouseup: objTypes['lineobj'].c_mouseup,
    move: objTypes['lineobj'].move,
    clicked: objTypes['lineobj'].clicked,
    dragging: objTypes['lineobj'].dragging,

    draw: function (obj, canvas) {
        ctx.fillStyle = 'rgb(255,0,0)';
        ctx.fillRect(obj.p1.x - 2, obj.p1.y - 2, 5, 5);
        ctx.fillRect(obj.p2.x - 2, obj.p2.y - 2, 3, 3);
    },

    shoot: function (obj) {
        var ray1 = Graph.ray(obj.p1, obj.p2);
        ray1.brightness = 1;
        ray1.gap = true;
        ray1.isNew = true;
        addRay(ray1);
    }
};

//"mirror"
objTypes['mirror'] = {

    create: function (mouse) {
        return {type: 'mirror', p1: mouse, p2: mouse};
    },

    //lineobj
    c_mousedown: objTypes['lineobj'].c_mousedown,
    c_mousemove: objTypes['lineobj'].c_mousemove,
    c_mouseup: objTypes['lineobj'].c_mouseup,
    move: objTypes['lineobj'].move,
    clicked: objTypes['lineobj'].clicked,
    dragging: objTypes['lineobj'].dragging,
    rayIntersection: objTypes['lineobj'].rayIntersection,

    draw: function (obj, canvas) {
        ctx.strokeStyle = 'rgb(168,168,168)';
        ctx.beginPath();
        ctx.moveTo(obj.p1.x, obj.p1.y);
        ctx.lineTo(obj.p2.x, obj.p2.y);
        ctx.stroke();
    },

    shot: function (mirror, ray, rayIndex, rp) {
        var rx = ray.p1.x - rp.x;
        var ry = ray.p1.y - rp.y;
        var mx = mirror.p2.x - mirror.p1.x;
        var my = mirror.p2.y - mirror.p1.y;
        ray.p1 = rp;
        ray.p2 = Graph.point(rp.x + rx * (my * my - mx * mx) - 2 * ry * mx * my, rp.y + ry * (mx * mx - my * my) - 2 * rx * mx * my);
    }
};

//"lens"
objTypes['lens'] = {

    p_name: 'Focal length',
    p_min: -1000,
    p_max: 1000,
    p_step: 1,

    create: function (mouse) {
        return {type: 'lens', p1: mouse, p2: mouse, p: 100};
    },

    //lineobj
    c_mousedown: objTypes['lineobj'].c_mousedown,
    c_mousemove: objTypes['lineobj'].c_mousemove,
    c_mouseup: objTypes['lineobj'].c_mouseup,
    move: objTypes['lineobj'].move,
    clicked: objTypes['lineobj'].clicked,
    dragging: objTypes['lineobj'].dragging,
    rayIntersection: objTypes['lineobj'].rayIntersection,

    draw: function (obj, canvas) {
        var len = Math.sqrt((obj.p2.x - obj.p1.x) * (obj.p2.x - obj.p1.x) + (obj.p2.y - obj.p1.y) * (obj.p2.y - obj.p1.y));
        var par_x = (obj.p2.x - obj.p1.x) / len;
        var par_y = (obj.p2.y - obj.p1.y) / len;
        var per_x = par_y;
        var per_y = -par_x;
        var arrow_size_per = 5;
        var arrow_size_par = 5;
        var center_size = 2;

        ctx.strokeStyle = 'rgb(128,128,128)';
        ctx.globalAlpha = 1 / ((Math.abs(obj.p) / 100) + 1);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(obj.p1.x, obj.p1.y);
        ctx.lineTo(obj.p2.x, obj.p2.y);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgb(255,0,0)';

        var center = Graph.midpoint(obj);
        ctx.strokeStyle = 'rgb(255,255,255)';
        ctx.beginPath();
        ctx.moveTo(center.x - per_x * center_size, center.y - per_y * center_size);
        ctx.lineTo(center.x + per_x * center_size, center.y + per_y * center_size);
        ctx.stroke();

        if (obj.p > 0) {
            ctx.beginPath();
            ctx.moveTo(obj.p1.x - par_x * arrow_size_par, obj.p1.y - par_y * arrow_size_par);
            ctx.lineTo(obj.p1.x + par_x * arrow_size_par + per_x * arrow_size_per, obj.p1.y + par_y * arrow_size_par + per_y * arrow_size_per);
            ctx.lineTo(obj.p1.x + par_x * arrow_size_par - per_x * arrow_size_per, obj.p1.y + par_y * arrow_size_par - per_y * arrow_size_per);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(obj.p2.x + par_x * arrow_size_par, obj.p2.y + par_y * arrow_size_par);
            ctx.lineTo(obj.p2.x - par_x * arrow_size_par + per_x * arrow_size_per, obj.p2.y - par_y * arrow_size_par + per_y * arrow_size_per);
            ctx.lineTo(obj.p2.x - par_x * arrow_size_par - per_x * arrow_size_per, obj.p2.y - par_y * arrow_size_par - per_y * arrow_size_per);
            ctx.fill();
        }
        if (obj.p < 0) {
            ctx.beginPath();
            ctx.moveTo(obj.p1.x + par_x * arrow_size_par, obj.p1.y + par_y * arrow_size_par);
            ctx.lineTo(obj.p1.x - par_x * arrow_size_par + per_x * arrow_size_per, obj.p1.y - par_y * arrow_size_par + per_y * arrow_size_per);
            ctx.lineTo(obj.p1.x - par_x * arrow_size_par - per_x * arrow_size_per, obj.p1.y - par_y * arrow_size_par - per_y * arrow_size_per);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(obj.p2.x - par_x * arrow_size_par, obj.p2.y - par_y * arrow_size_par);
            ctx.lineTo(obj.p2.x + par_x * arrow_size_par + per_x * arrow_size_per, obj.p2.y + par_y * arrow_size_par + per_y * arrow_size_per);
            ctx.lineTo(obj.p2.x + par_x * arrow_size_par - per_x * arrow_size_per, obj.p2.y + par_y * arrow_size_par - per_y * arrow_size_per);
            ctx.fill();
        }
    },

    shot: function (lens, ray, rayIndex, shootPoint) {
        var lens_length = Graph.length_segment(lens);
        var main_line_unitvector_x = (-lens.p1.y + lens.p2.y) / lens_length;
        var main_line_unitvector_y = (lens.p1.x - lens.p2.x) / lens_length;
        var mid_point = Graph.midpoint(lens);
        var twoF_point_1 = Graph.point(mid_point.x + main_line_unitvector_x * 2 * lens.p, mid_point.y + main_line_unitvector_y * 2 * lens.p);
        var twoF_point_2 = Graph.point(mid_point.x - main_line_unitvector_x * 2 * lens.p, mid_point.y - main_line_unitvector_y * 2 * lens.p);
        var twoF_line_near, twoF_line_far;
        if (Graph.length_squared(ray.p1, twoF_point_1) < Graph.length_squared(ray.p1, twoF_point_2)) {
            twoF_line_near = Graph.parallel(lens, twoF_point_1);
            twoF_line_far = Graph.parallel(lens, twoF_point_2);
        } else {
            twoF_line_near = Graph.parallel(lens, twoF_point_2);
            twoF_line_far = Graph.parallel(lens, twoF_point_1);
        }
        if (lens.p > 0) {
            ray.p2 = Graph.intersection_2line(twoF_line_far, Graph.line(mid_point, Graph.intersection_2line(twoF_line_near, ray)));
            ray.p1 = shootPoint;
        } else {
            ray.p2 = Graph.intersection_2line(twoF_line_far, Graph.line(shootPoint, Graph.intersection_2line(twoF_line_near, Graph.line(mid_point, Graph.intersection_2line(twoF_line_far, ray)))));
            ray.p1 = shootPoint;
        }
    }
};

//"idealmirror"
objTypes['idealmirror'] = {

    p_name: 'Focal length',
    p_min: -1000,
    p_max: 1000,
    p_step: 1,

    create: function (mouse) {
        return {type: 'idealmirror', p1: mouse, p2: Graph.point(mouse.x + gridSize, mouse.y), p: 100};
    },

    //lineobj
    c_mousedown: objTypes['lineobj'].c_mousedown,
    c_mousemove: objTypes['lineobj'].c_mousemove,
    c_mouseup: objTypes['lineobj'].c_mouseup,
    move: objTypes['lineobj'].move,
    clicked: objTypes['lineobj'].clicked,
    dragging: objTypes['lineobj'].dragging,
    rayIntersection: objTypes['lineobj'].rayIntersection,

    draw: function (obj, canvas) {
        var len = Math.sqrt((obj.p2.x - obj.p1.x) * (obj.p2.x - obj.p1.x) + (obj.p2.y - obj.p1.y) * (obj.p2.y - obj.p1.y));
        var par_x = (obj.p2.x - obj.p1.x) / len;
        var par_y = (obj.p2.y - obj.p1.y) / len;
        var per_x = par_y;
        var per_y = -par_x;
        var arrow_size_per = 5;
        var arrow_size_par = 5;
        var center_size = 1;

        ctx.strokeStyle = 'rgb(168,168,168)';
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(obj.p1.x, obj.p1.y);
        ctx.lineTo(obj.p2.x, obj.p2.y);
        ctx.stroke();
        ctx.lineWidth = 1;

        var center = Graph.midpoint(obj);
        ctx.strokeStyle = 'rgb(255,255,255)';
        ctx.beginPath();
        ctx.moveTo(center.x - per_x * center_size, center.y - per_y * center_size);
        ctx.lineTo(center.x + per_x * center_size, center.y + per_y * center_size);
        ctx.stroke();
        ctx.fillStyle = 'rgb(255,0,0)';

        if (obj.p < 0) {
            ctx.beginPath();
            ctx.moveTo(obj.p1.x - par_x * arrow_size_par, obj.p1.y - par_y * arrow_size_par);
            ctx.lineTo(obj.p1.x + par_x * arrow_size_par + per_x * arrow_size_per, obj.p1.y + par_y * arrow_size_par + per_y * arrow_size_per);
            ctx.lineTo(obj.p1.x + par_x * arrow_size_par - per_x * arrow_size_per, obj.p1.y + par_y * arrow_size_par - per_y * arrow_size_per);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(obj.p2.x + par_x * arrow_size_par, obj.p2.y + par_y * arrow_size_par);
            ctx.lineTo(obj.p2.x - par_x * arrow_size_par + per_x * arrow_size_per, obj.p2.y - par_y * arrow_size_par + per_y * arrow_size_per);
            ctx.lineTo(obj.p2.x - par_x * arrow_size_par - per_x * arrow_size_per, obj.p2.y - par_y * arrow_size_par - per_y * arrow_size_per);
            ctx.fill();
        }
        if (obj.p > 0) {
            ctx.beginPath();
            ctx.moveTo(obj.p1.x + par_x * arrow_size_par, obj.p1.y + par_y * arrow_size_par);
            ctx.lineTo(obj.p1.x - par_x * arrow_size_par + per_x * arrow_size_per, obj.p1.y - par_y * arrow_size_par + per_y * arrow_size_per);
            ctx.lineTo(obj.p1.x - par_x * arrow_size_par - per_x * arrow_size_per, obj.p1.y - par_y * arrow_size_par - per_y * arrow_size_per);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(obj.p2.x - par_x * arrow_size_par, obj.p2.y - par_y * arrow_size_par);
            ctx.lineTo(obj.p2.x + par_x * arrow_size_par + per_x * arrow_size_per, obj.p2.y + par_y * arrow_size_par + per_y * arrow_size_per);
            ctx.lineTo(obj.p2.x + par_x * arrow_size_par - per_x * arrow_size_per, obj.p2.y + par_y * arrow_size_par - per_y * arrow_size_per);
            ctx.fill();
        }
    },

    shot: function (obj, ray, rayIndex, shootPoint) {
        objTypes['lens'].shot(obj, ray, rayIndex, Graph.point(shootPoint.x, shootPoint.y));

        ray.p1.x = 2 * ray.p1.x - ray.p2.x;
        ray.p1.y = 2 * ray.p1.y - ray.p2.y;

        objTypes['mirror'].shot(obj, ray, rayIndex, shootPoint);
    }
};

//"blackline"
objTypes['blackline'] = {

    create: function (mouse) {
        return {type: 'blackline', p1: mouse, p2: mouse};
    },

    //lineobj
    c_mousedown: objTypes['lineobj'].c_mousedown,
    c_mousemove: objTypes['lineobj'].c_mousemove,
    c_mouseup: objTypes['lineobj'].c_mouseup,
    move: objTypes['lineobj'].move,
    clicked: objTypes['lineobj'].clicked,
    dragging: objTypes['lineobj'].dragging,
    rayIntersection: objTypes['lineobj'].rayIntersection,

    draw: function (obj, canvas) {
        ctx.strokeStyle = 'rgb(70,35,10)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(obj.p1.x, obj.p1.y);
        ctx.lineTo(obj.p2.x, obj.p2.y);
        ctx.stroke();
        ctx.lineWidth = 1;
    },

    shot: function (obj, ray, rayIndex, rp) {
        ray.exist = false;
    }
};

//"radiant"
objTypes['radiant'] = {

    p_name: 'Brightness',
    p_min: 0,
    p_max: 1,
    p_step: 0.01,

    create: function (mouse) {
        return {type: 'radiant', x: mouse.x, y: mouse.y, p: 0.5};
    },

    c_mousedown: function (obj, mouse) {
        draw();
    },

    c_mousemove: function (obj, mouse, ctrl, shift) {
    },

    c_mouseup: function (obj, mouse) {
        isConstructing = false;
    },

    draw: function (obj, canvas) {
        ctx.fillStyle = 'rgb(0,255,0)';
        ctx.fillRect(obj.x - 2, obj.y - 2, 5, 5);

    },

    move: function (obj, diffX, diffY) {
        obj.x = obj.x + diffX;
        obj.y = obj.y + diffY;
        return obj;
    },

    clicked: function (obj, mouse_nogrid, mouse, draggingPart) {
        if (mouseOnPoint(mouse_nogrid, obj)) {
            draggingPart.part = 0;
            draggingPart.mouse0 = Graph.point(obj.x, obj.y);
            draggingPart.targetPoint = Graph.point(obj.x, obj.y);
            draggingPart.snapData = {};
            return true;
        }
        return false;
    },

    dragging: function (obj, mouse, draggingPart, ctrl, shift) {
        if (shift) {
            var mouse_snapped = snapToDirection(mouse, draggingPart.mouse0, [{x: 1, y: 0}, {
                x: 0,
                y: 1
            }], draggingPart.snapData);
        } else {
            var mouse_snapped = mouse;
            draggingPart.snapData = {};
        }

        obj.x = mouse_snapped.x;
        obj.y = mouse_snapped.y;
        return {obj: obj};
    },

    shoot: function (obj) {
        var s = Math.PI * 2 / parseInt(getRayDensity() * 500);
        var i0 = (mode == 'observer') ? (-s * 2 + 1e-6) : 0;
        for (var i = i0; i < (Math.PI * 2 - 1e-5); i = i + s) {
            var ray1 = Graph.ray(Graph.point(obj.x, obj.y), Graph.point(obj.x + Math.sin(i), obj.y + Math.cos(i)));
            ray1.brightness = Math.min(obj.p / getRayDensity(), 1);
            ray1.isNew = true;
            if (i == i0) {
                ray1.gap = true;
            }
            addRay(ray1);
        }
    }
};

//"parallel"
objTypes['parallel'] = {

    p_name: 'Brightness',
    p_min: 0,
    p_max: 1,
    p_step: 0.01,

    create: function (mouse) {
        return {type: 'parallel', p1: mouse, p2: mouse, p: 0.5};
    },

    //lineobj
    c_mousedown: objTypes['lineobj'].c_mousedown,
    c_mousemove: objTypes['lineobj'].c_mousemove,
    c_mouseup: objTypes['lineobj'].c_mouseup,
    move: objTypes['lineobj'].move,
    clicked: objTypes['lineobj'].clicked,
    dragging: objTypes['lineobj'].dragging,

    draw: function (obj, canvas) {
        var a_l = Math.atan2(obj.p1.x - obj.p2.x, obj.p1.y - obj.p2.y) - Math.PI / 2;
        ctx.strokeStyle = 'rgb(0,255,0)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(obj.p1.x + Math.sin(a_l) * 2, obj.p1.y + Math.cos(a_l) * 2);
        ctx.lineTo(obj.p2.x + Math.sin(a_l) * 2, obj.p2.y + Math.cos(a_l) * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(128,128,128,255)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obj.p1.x, obj.p1.y);
        ctx.lineTo(obj.p2.x, obj.p2.y);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.lineCap = 'butt';
    },

    shoot: function (obj) {
        var n = Graph.length_segment(obj) * getRayDensity();
        var stepX = (obj.p2.x - obj.p1.x) / n;
        var stepY = (obj.p2.y - obj.p1.y) / n;
        var rayp2_x = obj.p1.x + obj.p2.y - obj.p1.y;
        var rayp2_y = obj.p1.y - obj.p2.x + obj.p1.x;

        for (var i = 0.5; i <= n; i++) {
            var ray1 = Graph.ray(Graph.point(obj.p1.x + i * stepX, obj.p1.y + i * stepY), Graph.point(rayp2_x + i * stepX, rayp2_y + i * stepY));
            ray1.brightness = Math.min(obj.p / getRayDensity(), 1);
            ray1.isNew = true;
            if (i == 0) {
                ray1.gap = true;
            }
            addRay(ray1);
        }
    }
};

//"arcmirror"
objTypes['arcmirror'] = {

    create: function (mouse) {
        return {type: 'arcmirror', p1: mouse};
    },

    c_mousedown: function (obj, mouse) {
        if (!obj.p2 && !obj.p3) {
            draw();
            obj.p2 = mouse;
            return;
        }
        if (obj.p2 && !obj.p3 && !mouseOnPoint_construct(mouse, obj.p1)) {
            obj.p2 = mouse;
            draw();
            obj.p3 = mouse;
            return;
        }
    },

    c_mousemove: function (obj, mouse, ctrl, shift) {
        if (!obj.p3 && !mouseOnPoint_construct(mouse, obj.p1)) {
            if (shift) {
                obj.p2 = snapToDirection(mouse, constructionPoint, [{x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {
                    x: 1,
                    y: -1
                }]);
            } else {
                obj.p2 = mouse;
            }

            obj.p1 = ctrl ? Graph.point(2 * constructionPoint.x - obj.p2.x, 2 * constructionPoint.y - obj.p2.y) : constructionPoint;

            draw();
            return;
        }
        if (obj.p3 && !mouseOnPoint_construct(mouse, obj.p2)) {
            obj.p3 = mouse;
            draw();
            return;
        }
    },

    c_mouseup: function (obj, mouse) {
        if (obj.p2 && !obj.p3 && !mouseOnPoint_construct(mouse, obj.p1)) {
            obj.p3 = mouse;
            return;
        }
        if (obj.p3 && !mouseOnPoint_construct(mouse, obj.p2)) {
            obj.p3 = mouse;
            draw();
            isConstructing = false;
            return;
        }
    },

    draw: function (obj, canvas) {
        ctx.fillStyle = 'rgb(255,0,255)';
        if (obj.p3 && obj.p2) {
            var center = Graph.intersection_2line(Graph.perpendicular_bisector(Graph.line(obj.p1, obj.p3)), Graph.perpendicular_bisector(Graph.line(obj.p2, obj.p3)));
            if (isFinite(center.x) && isFinite(center.y)) {
                var r = Graph.length(center, obj.p3);
                var a1 = Math.atan2(obj.p1.y - center.y, obj.p1.x - center.x);
                var a2 = Math.atan2(obj.p2.y - center.y, obj.p2.x - center.x);
                var a3 = Math.atan2(obj.p3.y - center.y, obj.p3.x - center.x);
                ctx.strokeStyle = 'rgb(168,168,168)';
                ctx.beginPath();
                ctx.arc(center.x, center.y, r, a1, a2, (a2 < a3 && a3 < a1) || (a1 < a2 && a2 < a3) || (a3 < a1 && a1 < a2));
                ctx.stroke();
                ctx.fillRect(obj.p3.x - 2, obj.p3.y - 2, 3, 3);
                ctx.fillStyle = 'rgb(255,0,0)';
                ctx.fillRect(obj.p1.x - 2, obj.p1.y - 2, 3, 3);
                ctx.fillRect(obj.p2.x - 2, obj.p2.y - 2, 3, 3);
            } else {
                ctx.strokeStyle = 'rgb(168,168,168)';
                ctx.beginPath();
                ctx.moveTo(obj.p1.x, obj.p1.y);
                ctx.lineTo(obj.p2.x, obj.p2.y);
                ctx.stroke();

                ctx.fillRect(obj.p3.x - 2, obj.p3.y - 2, 3, 3);
                ctx.fillStyle = 'rgb(255,0,0)';
                ctx.fillRect(obj.p1.x - 2, obj.p1.y - 2, 3, 3);
                ctx.fillRect(obj.p2.x - 2, obj.p2.y - 2, 3, 3);
            }
        } else if (obj.p2) {
            ctx.fillStyle = 'rgb(255,0,0)';
            ctx.fillRect(obj.p1.x - 2, obj.p1.y - 2, 3, 3);
            ctx.fillRect(obj.p2.x - 2, obj.p2.y - 2, 3, 3);
        } else {
            ctx.fillStyle = 'rgb(255,0,0)';
            ctx.fillRect(obj.p1.x - 2, obj.p1.y - 2, 3, 3);
        }
    },

    move: function (obj, diffX, diffY) {
        obj.p1.x = obj.p1.x + diffX;
        obj.p1.y = obj.p1.y + diffY;
        obj.p2.x = obj.p2.x + diffX;
        obj.p2.y = obj.p2.y + diffY;

        obj.p3.x = obj.p3.x + diffX;
        obj.p3.y = obj.p3.y + diffY;
        return obj;
    },

    clicked: function (obj, mouse_nogrid, mouse, draggingPart) {
        if (mouseOnPoint(mouse_nogrid, obj.p1) && Graph.length_squared(mouse_nogrid, obj.p1) <= Graph.length_squared(mouse_nogrid, obj.p2) && Graph.length_squared(mouse_nogrid, obj.p1) <= Graph.length_squared(mouse_nogrid, obj.p3)) {
            draggingPart.part = 1;
            draggingPart.targetPoint = Graph.point(obj.p1.x, obj.p1.y);
            return true;
        }
        if (mouseOnPoint(mouse_nogrid, obj.p2) && Graph.length_squared(mouse_nogrid, obj.p2) <= Graph.length_squared(mouse_nogrid, obj.p3)) {
            draggingPart.part = 2;
            draggingPart.targetPoint = Graph.point(obj.p2.x, obj.p2.y);
            return true;
        }
        if (mouseOnPoint(mouse_nogrid, obj.p3)) {
            draggingPart.part = 3;
            draggingPart.targetPoint = Graph.point(obj.p3.x, obj.p3.y);
            return true;
        }

        var center = Graph.intersection_2line(Graph.perpendicular_bisector(Graph.line(obj.p1, obj.p3)), Graph.perpendicular_bisector(Graph.line(obj.p2, obj.p3)));
        if (isFinite(center.x) && isFinite(center.y)) {
            var r = Graph.length(center, obj.p3);
            var a1 = Math.atan2(obj.p1.y - center.y, obj.p1.x - center.x);
            var a2 = Math.atan2(obj.p2.y - center.y, obj.p2.x - center.x);
            var a3 = Math.atan2(obj.p3.y - center.y, obj.p3.x - center.x);
            var a_m = Math.atan2(mouse_nogrid.y - center.y, mouse_nogrid.x - center.x);
            if (Math.abs(Graph.length(center, mouse_nogrid) - r) < clickExtent_line && (((a2 < a3 && a3 < a1) || (a1 < a2 && a2 < a3) || (a3 < a1 && a1 < a2)) == ((a2 < a_m && a_m < a1) || (a1 < a2 && a2 < a_m) || (a_m < a1 && a1 < a2)))) {
                draggingPart.part = 0;
                draggingPart.mouse0 = mouse;
                draggingPart.mouse1 = mouse;
                draggingPart.snapData = {};
                return true;
            }
        } else {
            if (mouseOnSegment(mouse_nogrid, obj)) {
                draggingPart.part = 0;
                draggingPart.mouse0 = mouse;
                draggingPart.mouse1 = mouse;
                draggingPart.snapData = {};
                return true;
            }
        }
        return false;
    },

    dragging: function (obj, mouse, draggingPart, ctrl, shift) {
        var basePoint;
        if (draggingPart.part == 1) {
            basePoint = ctrl ? Graph.midpoint(draggingPart.originalObj) : draggingPart.originalObj.p2;
            obj.p1 = shift ? snapToDirection(mouse, basePoint, [{x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {
                x: 1,
                y: -1
            }, {
                x: (draggingPart.originalObj.p2.x - draggingPart.originalObj.p1.x),
                y: (draggingPart.originalObj.p2.y - draggingPart.originalObj.p1.y)
            }]) : mouse;
            obj.p2 = ctrl ? Graph.point(2 * basePoint.x - obj.p1.x, 2 * basePoint.y - obj.p1.y) : basePoint;
        }
        if (draggingPart.part == 2) {
            basePoint = ctrl ? Graph.midpoint(draggingPart.originalObj) : draggingPart.originalObj.p1;

            obj.p2 = shift ? snapToDirection(mouse, basePoint, [{x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {
                x: 1,
                y: -1
            }, {
                x: (draggingPart.originalObj.p2.x - draggingPart.originalObj.p1.x),
                y: (draggingPart.originalObj.p2.y - draggingPart.originalObj.p1.y)
            }]) : mouse;
            obj.p1 = ctrl ? Graph.point(2 * basePoint.x - obj.p2.x, 2 * basePoint.y - obj.p2.y) : basePoint;
        }
        if (draggingPart.part == 3) {
            obj.p3 = mouse;
        }
        if (draggingPart.part == 0) {
            if (shift) {
                var mouse_snapped = snapToDirection(mouse, draggingPart.mouse0, [{x: 1, y: 0}, {
                    x: 0,
                    y: 1
                }, {
                    x: (draggingPart.originalObj.p2.x - draggingPart.originalObj.p1.x),
                    y: (draggingPart.originalObj.p2.y - draggingPart.originalObj.p1.y)
                }, {
                    x: (draggingPart.originalObj.p2.y - draggingPart.originalObj.p1.y),
                    y: -(draggingPart.originalObj.p2.x - draggingPart.originalObj.p1.x)
                }], draggingPart.snapData);
            } else {
                var mouse_snapped = mouse;
                draggingPart.snapData = {};
            }

            var mouseDiffX = draggingPart.mouse1.x - mouse_snapped.x;
            var mouseDiffY = draggingPart.mouse1.y - mouse_snapped.y;

            obj.p1.x = obj.p1.x - mouseDiffX;
            obj.p1.y = obj.p1.y - mouseDiffY;

            obj.p2.x = obj.p2.x - mouseDiffX;
            obj.p2.y = obj.p2.y - mouseDiffY;

            obj.p3.x = obj.p3.x - mouseDiffX;
            obj.p3.y = obj.p3.y - mouseDiffY;

            draggingPart.mouse1 = mouse_snapped;
        }
    },

    rayIntersection: function (obj, ray) {
        if (!obj.p3) {
            return;
        }
        var center = Graph.intersection_2line(Graph.perpendicular_bisector(Graph.line(obj.p1, obj.p3)), Graph.perpendicular_bisector(Graph.line(obj.p2, obj.p3)));
        if (isFinite(center.x) && isFinite(center.y)) {

            var rp_temp = Graph.intersection_line_circle(Graph.line(ray.p1, ray.p2), Graph.circle(center, obj.p2));
            var rp_exist = [];
            var rp_lensq = [];
            for (var i = 1; i <= 2; i++) {
                rp_exist[i] = !Graph.intersection_is_on_segment(Graph.intersection_2line(Graph.line(obj.p1, obj.p2), Graph.line(obj.p3, rp_temp[i])), Graph.segment(obj.p3, rp_temp[i])) && Graph.intersection_is_on_ray(rp_temp[i], ray) && Graph.length_squared(rp_temp[i], ray.p1) > minShotLength_squared;
                rp_lensq[i] = Graph.length_squared(ray.p1, rp_temp[i]);
            }
            if (rp_exist[1] && ((!rp_exist[2]) || rp_lensq[1] < rp_lensq[2])) {
                return rp_temp[1];
            }
            if (rp_exist[2] && ((!rp_exist[1]) || rp_lensq[2] < rp_lensq[1])) {
                return rp_temp[2];
            }
        } else {
            return objTypes['mirror'].rayIntersection(obj, ray);
        }
    },

    shot: function (obj, ray, rayIndex, rp) {
        var center = Graph.intersection_2line(Graph.perpendicular_bisector(Graph.line(obj.p1, obj.p3)), Graph.perpendicular_bisector(Graph.line(obj.p2, obj.p3)));
        if (isFinite(center.x) && isFinite(center.y)) {
            var rx = ray.p1.x - rp.x;
            var ry = ray.p1.y - rp.y;
            var cx = center.x - rp.x;
            var cy = center.y - rp.y;
            var c_sq = cx * cx + cy * cy;
            var r_dot_c = rx * cx + ry * cy;
            ray.p1 = rp;
            ray.p2 = Graph.point(rp.x - c_sq * rx + 2 * r_dot_c * cx, rp.y - c_sq * ry + 2 * r_dot_c * cy);
        } else {
            return objTypes['mirror'].shot(obj, ray, rayIndex, rp);
        }
    }
};

//"ruler"
objTypes['ruler'] = {

    create: function (mouse) {
        return {type: 'ruler', p1: mouse, p2: mouse};
    },

    c_mousedown: objTypes['lineobj'].c_mousedown,
    c_mousemove: objTypes['lineobj'].c_mousemove,
    c_mouseup: objTypes['lineobj'].c_mouseup,
    move: objTypes['lineobj'].move,
    clicked: objTypes['lineobj'].clicked,
    dragging: objTypes['lineobj'].dragging,

    draw: function (obj, canvas, aboveLight) {
        if (aboveLight) return;
        ctx.globalCompositeOperation = 'lighter';
        var len = Math.sqrt((obj.p2.x - obj.p1.x) * (obj.p2.x - obj.p1.x) + (obj.p2.y - obj.p1.y) * (obj.p2.y - obj.p1.y));
        var par_x = (obj.p2.x - obj.p1.x) / len;
        var par_y = (obj.p2.y - obj.p1.y) / len;
        var per_x = par_y;
        var per_y = -par_x;
        var ang = Math.atan2(obj.p2.y - obj.p1.y, obj.p2.x - obj.p1.x);
        var scale_step = 10;
        var scale_step_mid = 50;
        var scale_step_long = 100;
        var scale_len = 10;
        var scale_len_mid = 15;

        ctx.strokeStyle = 'rgb(128,128,128)';
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgb(128,128,128)';

        if (ang > Math.PI * (-0.25) && ang <= Math.PI * 0.25) {
            var scale_direction = -1;
            var scale_len_long = 20;
            var text_ang = ang;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
        } else if (ang > Math.PI * (-0.75) && ang <= Math.PI * (-0.25)) {
            var scale_direction = 1;
            var scale_len_long = 15;
            var text_ang = ang - Math.PI * (-0.5);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
        } else if (ang > Math.PI * 0.75 || ang <= Math.PI * (-0.75)) {
            var scale_direction = 1;
            var scale_len_long = 20;
            var text_ang = ang - Math.PI;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
        } else {
            var scale_direction = -1;
            var scale_len_long = 15;
            var text_ang = ang - Math.PI * 0.5;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
        }

        ctx.beginPath();
        ctx.moveTo(obj.p1.x, obj.p1.y);
        ctx.lineTo(obj.p2.x, obj.p2.y);
        var x, y;
        for (var i = 0; i <= len; i += scale_step) {
            ctx.moveTo(obj.p1.x + i * par_x, obj.p1.y + i * par_y);
            if (i % scale_step_long == 0) {
                x = obj.p1.x + i * par_x + scale_direction * scale_len_long * per_x;
                y = obj.p1.y + i * par_y + scale_direction * scale_len_long * per_y;
                ctx.lineTo(x, y);
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(text_ang);
                ctx.fillText(i, 0, 0);
                ctx.restore();
            } else if (i % scale_step_mid == 0) {
                ctx.lineTo(obj.p1.x + i * par_x + scale_direction * scale_len_mid * per_x, obj.p1.y + i * par_y + scale_direction * scale_len_mid * per_y);
            } else {
                ctx.lineTo(obj.p1.x + i * par_x + scale_direction * scale_len * per_x, obj.p1.y + i * par_y + scale_direction * scale_len * per_y);
            }
        }
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    }
};

//"protractor"
objTypes['protractor'] = {

    create: function (mouse) {
        return {type: 'protractor', p1: mouse, p2: mouse};
    },

    c_mousedown: objTypes['lineobj'].c_mousedown,
    c_mousemove: function (obj, mouse, ctrl, shift) {
        objTypes['lineobj'].c_mousemove(obj, mouse, false, shift)
    },
    c_mouseup: objTypes['lineobj'].c_mouseup,
    move: objTypes['lineobj'].move,

    clicked: function (obj, mouse_nogrid, mouse, draggingPart) {
        if (mouseOnPoint(mouse_nogrid, obj.p1) && Graph.length_squared(mouse_nogrid, obj.p1) <= Graph.length_squared(mouse_nogrid, obj.p2)) {
            draggingPart.part = 1;
            draggingPart.targetPoint = Graph.point(obj.p1.x, obj.p1.y);
            return true;
        }
        if (mouseOnPoint(mouse_nogrid, obj.p2)) {
            draggingPart.part = 2;
            draggingPart.targetPoint = Graph.point(obj.p2.x, obj.p2.y);
            return true;
        }
        if (Math.abs(Graph.length(obj.p1, mouse_nogrid) - Graph.length_segment(obj)) < clickExtent_line) {
            draggingPart.part = 0;
            draggingPart.mouse0 = mouse;
            draggingPart.mouse1 = mouse;
            draggingPart.snapData = {};
            return true;
        }
        return false;
    },

    dragging: function (obj, mouse, draggingPart, ctrl, shift) {
        objTypes['lineobj'].dragging(obj, mouse, draggingPart, false, shift)
    },

    draw: function (obj, canvas, aboveLight) {
        if (!aboveLight) {
            ctx.globalCompositeOperation = 'lighter';
            var r = Math.sqrt((obj.p2.x - obj.p1.x) * (obj.p2.x - obj.p1.x) + (obj.p2.y - obj.p1.y) * (obj.p2.y - obj.p1.y));
            var scale_width_limit = 5;
            var scale_step = 1;
            var scale_step_mid = 5;
            var scale_step_long = 10;
            var scale_len = 10;
            var scale_len_mid = 15;
            var scale_len_long = 20;

            ctx.strokeStyle = 'rgb(128,128,128)';
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = 'rgb(128,128,128)';

            if (r * scale_step * Math.PI / 180 < scale_width_limit) {
                scale_step = 2;
                scale_step_mid = 10;
                scale_step_long = 30;
            }
            if (r * scale_step * Math.PI / 180 < scale_width_limit) {
                scale_step = 5;
                scale_step_mid = 10;
                scale_step_long = 30;
                scale_len = 5;
                scale_len_mid = 8;
                scale_len_long = 10;
                ctx.font = 'bold 10px Arial';
            }
            if (r * scale_step * Math.PI / 180 < scale_width_limit) {
                scale_step = 10;
                scale_step_mid = 30;
                scale_step_long = 90;
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            ctx.beginPath();
            ctx.arc(obj.p1.x, obj.p1.y, r, 0, Math.PI * 2, false);

            var ang, x, y;
            for (var i = 0; i < 360; i += scale_step) {
                ang = i * Math.PI / 180 + Math.atan2(obj.p2.y - obj.p1.y, obj.p2.x - obj.p1.x);
                ctx.moveTo(obj.p1.x + r * Math.cos(ang), obj.p1.y + r * Math.sin(ang));
                if (i % scale_step_long == 0) {
                    x = obj.p1.x + (r - scale_len_long) * Math.cos(ang);
                    y = obj.p1.y + (r - scale_len_long) * Math.sin(ang);
                    ctx.lineTo(x, y);
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(ang + Math.PI * 0.5);
                    ctx.fillText((i > 180) ? (360 - i) : i, 0, 0);
                    ctx.restore();
                } else if (i % scale_step_mid == 0) {
                    ctx.lineTo(obj.p1.x + (r - scale_len_mid) * Math.cos(ang), obj.p1.y + (r - scale_len_mid) * Math.sin(ang));
                } else {
                    ctx.lineTo(obj.p1.x + (r - scale_len) * Math.cos(ang), obj.p1.y + (r - scale_len) * Math.sin(ang));
                }
            }
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        }
        ctx.fillStyle = 'red';
        ctx.fillRect(obj.p1.x - 2, obj.p1.y - 2, 3, 3);
        ctx.fillStyle = 'rgb(255,0,255)';
        ctx.fillRect(obj.p2.x - 2, obj.p2.y - 2, 3, 3);
    }
};

var canvas;
var ctx;
var mouse;
var mouse_lastmousedown;
var objs = [];
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
    init_i18n();
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
        objs[objs.length] = JSON.parse(JSON.stringify(objs[selectedObj]));
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

    for (var i = 0; i < objs.length; i++) {
        objTypes[objs[i].type].draw(objs[i], canvas);
        if (objTypes[objs[i].type].shoot) {
            objTypes[objs[i].type].shoot(objs[i]);
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
                for (var i = 0; i < objs.length; i++) {
                    if (objTypes[objs[i].type].rayIntersection) {
                        s_point_temp = objTypes[objs[i].type].rayIntersection(objs[i], waitingRays[j]);
                        if (s_point_temp) {
                            s_lensq_temp = Graph.length_squared(waitingRays[j].p1, s_point_temp);
                            if (s_point && Graph.length_squared(s_point_temp, s_point) < minShotLength_squared && (objTypes[objs[i].type].supportSurfaceMerging || objTypes[s_obj.type].supportSurfaceMerging)) {
                                if (objTypes[s_obj.type].supportSurfaceMerging) {
                                    if (objTypes[objs[i].type].supportSurfaceMerging) {
                                        surfaceMerging_objs[surfaceMerging_objs.length] = objs[i];
                                    } else {
                                        s_obj = objs[i];
                                        s_obj_index = i;
                                        s_point = s_point_temp;
                                        s_lensq = s_lensq_temp;
                                        surfaceMerging_objs = [];
                                    }
                                }
                            } else if (s_lensq_temp < s_lensq && s_lensq_temp > minShotLength_squared) {
                                s_obj = objs[i];
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
                    objTypes[s_obj.type].shot(s_obj, waitingRays[j], j, s_point, surfaceMerging_objs);
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
    for (var i = 0; i < objs.length; i++) {
        objTypes[objs[i].type].draw(objs[i], canvas, true);
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
            objTypes[objs[objs.length - 1].type].c_mousedown(objs[objs.length - 1], mouse);
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

            for (var i = 0; i < objs.length; i++) {
                if (typeof objs[i] != 'undefined') {
                    draggingPart_ = {};
                    if (objTypes[objs[i].type].clicked(objs[i], mouse_nogrid, mouse, draggingPart_)) {
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
                draggingPart.originalObj = JSON.parse(JSON.stringify(objs[targetObj_index]));
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
                objs[objs.length] = objTypes[AddingObjType].create(mouse);
                isConstructing = true;
                constructionPoint = mouse;
                if (objs[selectedObj]) {
                    if (hasSameAttrType(objs[selectedObj], objs[objs.length - 1])) {
                        objs[objs.length - 1].p = objs[selectedObj].p;
                    }
                }
                selectObj(objs.length - 1);
                objTypes[objs[objs.length - 1].type].c_mousedown(objs[objs.length - 1], mouse);
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
        objTypes[objs[objs.length - 1].type].c_mousemove(objs[objs.length - 1], mouse, e.ctrlKey, e.shiftKey);
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

            objTypes[objs[draggingObj].type].dragging(objs[draggingObj], mouse, draggingPart, e.ctrlKey, e.shiftKey);

            if (draggingPart.part == 0) {
                if (e.ctrlKey && !draggingPart.hasDuplicated) {
                    objs[objs.length] = draggingPart.originalObj;
                    draggingPart.hasDuplicated = true;
                }
                if (!e.ctrlKey && draggingPart.hasDuplicated) {
                    objs.length--;
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
            objTypes[objs[objs.length - 1].type].c_mouseup(objs[objs.length - 1], mouse);
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

        for (var i = 0; i < objs.length; i++) {
            if (typeof objs[i] != 'undefined') {
                draggingPart_ = {};
                if (objTypes[objs[i].type].clicked(objs[i], mouse, mouse, draggingPart_)) {
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
            draggingPart.originalObj = JSON.parse(JSON.stringify(objs[targetObj_index]));
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
    if (index < 0 || index >= objs.length) {
        selectedObj = -1;
        document.getElementById('obj_settings').style.display = 'none';
        return;
    }
    selectedObj = index;
    document.getElementById('obj_name').innerHTML = document.getElementById('tool_' + objs[index].type).dataset['n'];
    if (objTypes[objs[index].type].p_name) {
        document.getElementById('p_box').style.display = '';
        var p_temp = objs[index].p;
        document.getElementById('p_name').innerHTML = document.getElementById('tool_' + objs[index].type).dataset['p'];
        document.getElementById('objAttr_range').min = objTypes[objs[index].type].p_min;
        document.getElementById('objAttr_range').max = objTypes[objs[index].type].p_max;
        document.getElementById('objAttr_range').step = objTypes[objs[index].type].p_step;
        document.getElementById('objAttr_range').value = p_temp;
        document.getElementById('objAttr_text').value = p_temp;
        objs[index].p = p_temp;
        for (var i = 0; i < objs.length; i++) {
            if (i != selectedObj && hasSameAttrType(objs[i], objs[selectedObj])) {
                document.getElementById('setAttrAll_box').style.display = '';
                break;
            }
            if (i == objs.length - 1) {
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
    objs[selectedObj].p = value;
    document.getElementById('objAttr_text').value = value;
    document.getElementById('objAttr_range').value = value;
    if (document.getElementById('setAttrAll').checked) {
        for (var i = 0; i < objs.length; i++) {
            if (hasSameAttrType(objs[i], objs[selectedObj])) {
                objs[i].p = value;
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
            objTypes[objs[positioningObj].type].dragging(objs[positioningObj], Graph.point(xyData[0], xyData[1]), draggingPart, ctrl, shift);
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
    for (var i = index; i < objs.length - 1; i++) {
        objs[i] = JSON.parse(JSON.stringify(objs[i + 1]));
    }
    isConstructing = false;
    objs.length = objs.length - 1;
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
        objs.length--;
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
    objs.length = 0;
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
        objs[objs.length] = JSON.parse(JSON.stringify(objs[selectedObj]));
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
                objTypes[objs[selectedObj].type].move(objs[selectedObj], -step, 0);
            }
            if (e.keyCode == 38) {
                objTypes[objs[selectedObj].type].move(objs[selectedObj], 0, -step);
            }
            if (e.keyCode == 39) {
                objTypes[objs[selectedObj].type].move(objs[selectedObj], step, 0);
            }
            if (e.keyCode == 40) {
                objTypes[objs[selectedObj].type].move(objs[selectedObj], 0, step);
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
            for (var i = 0; i < objs.length; i++) {
                if (e.keyCode == 37) {
                    objTypes[objs[i].type].move(objs[i], -step, 0);
                }
                if (e.keyCode == 38) {
                    objTypes[objs[i].type].move(objs[i], 0, -step);
                }
                if (e.keyCode == 39) {
                    objTypes[objs[i].type].move(objs[i], step, 0);
                }
                if (e.keyCode == 40) {
                    objTypes[objs[i].type].move(objs[i], 0, step);
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

function init_i18n() {
    i18nInit();

    var downarraw = '\u25BC';
    document.title = i18nTranslate('appName');

    // Toolbar
    document.getElementById('toolbar_title').innerHTML = i18nTranslate('toolbar_title');

    //Ray
    document.getElementById('tool_laser').value = i18nTranslate('toolname_laser');
    document.getElementById('tool_laser').dataset['n'] = i18nTranslate('toolname_laser');

    //Point source
    document.getElementById('tool_radiant').value = i18nTranslate('toolname_radiant');
    document.getElementById('tool_radiant').dataset['n'] = i18nTranslate('toolname_radiant');
    document.getElementById('tool_radiant').dataset['p'] = i18nTranslate('brightness');

    //Beam
    document.getElementById('tool_parallel').value = i18nTranslate('toolname_parallel');
    document.getElementById('tool_parallel').dataset['n'] = i18nTranslate('toolname_parallel');
    document.getElementById('tool_parallel').dataset['p'] = i18nTranslate('brightness');

    //Mirror▼
    document.getElementById('tool_mirror_').value = i18nTranslate('toolname_mirror_') + downarraw;

    //Mirror->Line
    document.getElementById('tool_mirror').value = i18nTranslate('tooltitle_mirror');
    document.getElementById('tool_mirror').dataset['n'] = i18nTranslate('toolname_mirror_');

    //Mirror->Circular Arc
    document.getElementById('tool_arcmirror').value = i18nTranslate('tooltitle_arcmirror');
    document.getElementById('tool_arcmirror').dataset['n'] = i18nTranslate('toolname_mirror_');

    //Mirror->Curve (ideal)
    document.getElementById('tool_idealmirror').value = i18nTranslate('tooltitle_idealmirror');
    document.getElementById('tool_idealmirror').dataset['n'] = i18nTranslate('toolname_idealmirror');
    document.getElementById('tool_idealmirror').dataset['p'] = i18nTranslate('focallength');

    //Refractor▼
    document.getElementById('tool_refractor_').value = i18nTranslate('toolname_refractor_') + downarraw;

    //Refractor->Half-plane
    document.getElementById('tool_halfplane').value = i18nTranslate('tooltitle_halfplane');
    document.getElementById('tool_halfplane').dataset['n'] = i18nTranslate('toolname_refractor_');
    document.getElementById('tool_halfplane').dataset['p'] = i18nTranslate('refractiveindex');

    //Refractor->Circle
    document.getElementById('tool_circlelens').value = i18nTranslate('tooltitle_circlelens');
    document.getElementById('tool_circlelens').dataset['n'] = i18nTranslate('toolname_refractor_');
    document.getElementById('tool_circlelens').dataset['p'] = i18nTranslate('refractiveindex');

    //Refractor->Other shape
    document.getElementById('tool_refractor').value = i18nTranslate('tooltitle_refractor');
    document.getElementById('tool_refractor').dataset['n'] = i18nTranslate('toolname_refractor_');
    document.getElementById('tool_refractor').dataset['p'] = i18nTranslate('refractiveindex');

    //Refractor->Lens (ideal)
    document.getElementById('tool_lens').value = i18nTranslate('tooltitle_lens');
    document.getElementById('tool_lens').dataset['n'] = i18nTranslate('toolname_lens');
    document.getElementById('tool_lens').dataset['p'] = i18nTranslate('focallength');

    //Blocker
    document.getElementById('tool_blackline').value = i18nTranslate('toolname_blackline');
    document.getElementById('tool_blackline').dataset['n'] = i18nTranslate('toolname_blackline');

    //Ruler
    document.getElementById('tool_ruler').value = i18nTranslate('toolname_ruler');
    document.getElementById('tool_ruler').dataset['n'] = i18nTranslate('toolname_ruler');

    //Protractor
    document.getElementById('tool_protractor').value = i18nTranslate('toolname_protractor');
    document.getElementById('tool_protractor').dataset['n'] = i18nTranslate('toolname_protractor');

    //Move view
    document.getElementById('tool_').value = i18nTranslate('toolname_');

    // Mode bar
    document.getElementById('modebar_title').innerHTML = i18nTranslate('modebar_title');
    document.getElementById('mode_light').value = i18nTranslate('modename_light');
    document.getElementById('mode_extended_light').value = i18nTranslate('modename_extended_light');
    document.getElementById('mode_images').value = i18nTranslate('modename_images');
    document.getElementById('mode_observer').value = i18nTranslate('modename_observer');
    document.getElementById('rayDensity_title').innerHTML = i18nTranslate('raydensity');

    document.getElementById('undo').value = i18nTranslate('undo');
    document.getElementById('redo').value = i18nTranslate('redo');
    document.getElementById('reset').value = i18nTranslate('reset');
    document.getElementById('save').value = i18nTranslate('save');
    document.getElementById('save_name_title').innerHTML = i18nTranslate('save_name');
    document.getElementById('save_confirm').value = i18nTranslate('save');
    document.getElementById('save_cancel').value = i18nTranslate('save_cancel');
    document.getElementById('save_description').innerHTML = i18nTranslate('save_description');
    document.getElementById('open').value = i18nTranslate('open');
    document.getElementById('lockobjs_title').innerHTML = i18nTranslate('lockobjs');
    document.getElementById('grid_title').innerHTML = i18nTranslate('snaptogrid');
    document.getElementById('showgrid_title').innerHTML = i18nTranslate('grid');

    document.getElementById('setAttrAll_title').innerHTML = i18nTranslate('applytoall');
    document.getElementById('copy').value = i18nTranslate('duplicate');
    document.getElementById('delete').value = i18nTranslate('delete');

    document.getElementById('forceStop').innerHTML = i18nTranslate('processing');

    document.getElementById('footer_message').innerHTML = i18nTranslate('footer_message');
    document.getElementById('homepage').innerHTML = i18nTranslate('homepage');
    document.getElementById('source').innerHTML = i18nTranslate('source');
}