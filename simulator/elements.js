let Element = {};

Element['lineobj'] = {
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
Element['halfplane'] = {

    p_name: 'Refractive index',
    p_min: 1,
    p_max: 3,
    p_step: 0.01,

    supportSurfaceMerging: true,

    create: function (mouse) {
        return {type: 'halfplane', p1: mouse, p2: mouse, p: 1.5};
    },

    c_mousedown: Element['lineobj'].c_mousedown,
    c_mousemove: Element['lineobj'].c_mousemove,
    c_mouseup: Element['lineobj'].c_mouseup,
    move: Element['lineobj'].move,

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

            Element['refractor'].fillGlass(obj.p);
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
            shotType = Element[surfaceMerging_objs[i].type].getShotType(surfaceMerging_objs[i], ray);
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
        Element['refractor'].refract(ray, rayIndex, rp, normal, n1);
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
Element['circlelens'] = {

    p_name: 'Refractive index',
    p_min: 1,
    p_max: 3,
    p_step: 0.01,

    supportSurfaceMerging: true,

    create: function (mouse) {
        return {type: 'circlelens', p1: mouse, p2: mouse, p: 1.5};
    },

    //lineobJ
    c_mousedown: Element['lineobj'].c_mousedown,
    c_mousemove: function (obj, mouse, ctrl, shift) {
        Element['lineobj'].c_mousemove(obj, mouse, false, shift)
    },
    c_mouseup: Element['lineobj'].c_mouseup,
    move: Element['lineobj'].move,

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
        Element['lineobj'].dragging(obj, mouse, draggingPart, false, shift)
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
            Element['refractor'].fillGlass(obj.p);
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
            shotType = Element[surfaceMerging_objs[i].type].getShotType(surfaceMerging_objs[i], ray);
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
        Element['refractor'].refract(ray, rayIndex, rp, normal, n1);
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
Element['refractor'] = {

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
            shotType = Element[surfaceMerging_objs[i].type].getShotType(surfaceMerging_objs[i], ray);
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
Element['laser'] = {

    create: function (mouse) {
        return {type: 'laser', p1: mouse, p2: mouse};
    },

    //lineobj
    c_mousedown: Element['lineobj'].c_mousedown,
    c_mousemove: Element['lineobj'].c_mousemove,
    c_mouseup: Element['lineobj'].c_mouseup,
    move: Element['lineobj'].move,
    clicked: Element['lineobj'].clicked,
    dragging: Element['lineobj'].dragging,

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
Element['mirror'] = {

    create: function (mouse) {
        return {type: 'mirror', p1: mouse, p2: mouse};
    },

    //lineobj
    c_mousedown: Element['lineobj'].c_mousedown,
    c_mousemove: Element['lineobj'].c_mousemove,
    c_mouseup: Element['lineobj'].c_mouseup,
    move: Element['lineobj'].move,
    clicked: Element['lineobj'].clicked,
    dragging: Element['lineobj'].dragging,
    rayIntersection: Element['lineobj'].rayIntersection,

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
Element['lens'] = {

    p_name: 'Focal length',
    p_min: -1000,
    p_max: 1000,
    p_step: 1,

    create: function (mouse) {
        return {type: 'lens', p1: mouse, p2: mouse, p: 100};
    },

    //lineobj
    c_mousedown: Element['lineobj'].c_mousedown,
    c_mousemove: Element['lineobj'].c_mousemove,
    c_mouseup: Element['lineobj'].c_mouseup,
    move: Element['lineobj'].move,
    clicked: Element['lineobj'].clicked,
    dragging: Element['lineobj'].dragging,
    rayIntersection: Element['lineobj'].rayIntersection,

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
Element['idealmirror'] = {

    p_name: 'Focal length',
    p_min: -1000,
    p_max: 1000,
    p_step: 1,

    create: function (mouse) {
        return {type: 'idealmirror', p1: mouse, p2: Graph.point(mouse.x + gridSize, mouse.y), p: 100};
    },

    //lineobj
    c_mousedown: Element['lineobj'].c_mousedown,
    c_mousemove: Element['lineobj'].c_mousemove,
    c_mouseup: Element['lineobj'].c_mouseup,
    move: Element['lineobj'].move,
    clicked: Element['lineobj'].clicked,
    dragging: Element['lineobj'].dragging,
    rayIntersection: Element['lineobj'].rayIntersection,

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
        Element['lens'].shot(obj, ray, rayIndex, Graph.point(shootPoint.x, shootPoint.y));

        ray.p1.x = 2 * ray.p1.x - ray.p2.x;
        ray.p1.y = 2 * ray.p1.y - ray.p2.y;

        Element['mirror'].shot(obj, ray, rayIndex, shootPoint);
    }
};

//"blackline"
Element['blackline'] = {

    create: function (mouse) {
        return {type: 'blackline', p1: mouse, p2: mouse};
    },

    //lineobj
    c_mousedown: Element['lineobj'].c_mousedown,
    c_mousemove: Element['lineobj'].c_mousemove,
    c_mouseup: Element['lineobj'].c_mouseup,
    move: Element['lineobj'].move,
    clicked: Element['lineobj'].clicked,
    dragging: Element['lineobj'].dragging,
    rayIntersection: Element['lineobj'].rayIntersection,

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
Element['radiant'] = {

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
Element['parallel'] = {

    p_name: 'Brightness',
    p_min: 0,
    p_max: 1,
    p_step: 0.01,

    create: function (mouse) {
        return {type: 'parallel', p1: mouse, p2: mouse, p: 0.5};
    },

    //lineobj
    c_mousedown: Element['lineobj'].c_mousedown,
    c_mousemove: Element['lineobj'].c_mousemove,
    c_mouseup: Element['lineobj'].c_mouseup,
    move: Element['lineobj'].move,
    clicked: Element['lineobj'].clicked,
    dragging: Element['lineobj'].dragging,

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
Element['arcmirror'] = {

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
            return Element['mirror'].rayIntersection(obj, ray);
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
            return Element['mirror'].shot(obj, ray, rayIndex, rp);
        }
    }
};

//"ruler"
Element['ruler'] = {

    create: function (mouse) {
        return {type: 'ruler', p1: mouse, p2: mouse};
    },

    c_mousedown: Element['lineobj'].c_mousedown,
    c_mousemove: Element['lineobj'].c_mousemove,
    c_mouseup: Element['lineobj'].c_mouseup,
    move: Element['lineobj'].move,
    clicked: Element['lineobj'].clicked,
    dragging: Element['lineobj'].dragging,

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
Element['protractor'] = {

    create: function (mouse) {
        return {type: 'protractor', p1: mouse, p2: mouse};
    },

    c_mousedown: Element['lineobj'].c_mousedown,
    c_mousemove: function (obj, mouse, ctrl, shift) {
        Element['lineobj'].c_mousemove(obj, mouse, false, shift)
    },
    c_mouseup: Element['lineobj'].c_mouseup,
    move: Element['lineobj'].move,

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
        Element['lineobj'].dragging(obj, mouse, draggingPart, false, shift)
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

let elements = [];