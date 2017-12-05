require([
    'esri/Map',
    'esri/views/SceneView',
    'dojo/domReady!'
], function (
    Map,
    SceneView
) {
        // Enforce strict mode
        'use strict';

        var view = new SceneView({
            container: 'map',
            extent: {
                xmin: -111.742,
                ymin: 36.161,
                xmax: -111.675,
                ymax: 36.199
            },
            map: new Map({
                basemap: 'satellite',
                ground: 'world-elevation'
            }),
            environment: {
                lighting: {
                    directShadowsEnabled: true,
                    ambientOcclusionEnabled: true
                }
            }
        });
        view.then(function () {
            gameloop();
        });

        var origin = null;

        function gameloop() {
            window.requestAnimationFrame(gameloop);

            var gamepads = navigator.getGamepads();
            if (!gamepads || gamepads.length === 0) {
                // skip
            }
            else {
                var gamepad = gamepads[0];
                var camera = view.camera;

                if (!origin) {
                    origin = gamepad.axes.slice()
                }
                var lx = gamepad.axes[0] - origin[0];
                var ly = gamepad.axes[1] - origin[1];
                var rx = gamepad.axes[2] - origin[2];
                var ry = gamepad.axes[3] - origin[3];
                var lp = gamepad.buttons[4].pressed;
                var rp = gamepad.buttons[5].pressed;

                var heading = camera.heading + rx;
                var tilt = camera.tilt - ry;

                var speed = camera.position.z / 50;

                var x =
                    camera.position.x +
                    speed * lx * Math.cos(camera.heading * Math.PI / 180) +
                    speed * ly * Math.sin(-camera.heading * Math.PI / 180);
                var y =
                    camera.position.y +
                    speed * lx * Math.sin(-camera.heading * Math.PI / 180) -
                    speed * ly * Math.cos(camera.heading * Math.PI / 180);
                var z = camera.position.z;
                if (lp) { z -= speed; }
                if (rp) { z += speed; }

                view.camera = {
                    fov: 55,
                    heading: heading,
                    position: {
                        x: x,
                        y: y,
                        z: z,
                        spatialReference: {
                            wkid: 102100
                        }
                    },
                    tilt: tilt
                };
            }
        }

        //function getGamepad() {
        //    // http://luser.github.io/gamepadtest/
        //    // https://github.com/luser/gamepadtest
        //    // https://developer.mozilla.org/en-US/docs/Web/API/Gamepad
        //    var gamepads = navigator.getGamepads();
        //    if (!gamepads) {
        //        return null;
        //    }
        //    if (gamepads.length === 0) {
        //        return null;
        //    }
        //    return gamepads[0];
        //}
    });