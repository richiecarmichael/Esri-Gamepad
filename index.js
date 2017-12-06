/*
    Copyright 2017 Esri

    Licensed under the Apache License, Version 2.0 (the 'License');
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at:
    https://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an 'AS IS' BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

/*
    REFERENCE MATERIAL

    The gamepad specification and compatiablity.
    https://developer.mozilla.org/en-US/docs/Web/API/Gamepad

    Sample application.
    http://luser.github.io/gamepadtest/

    Source code to sample application.
    https://github.com/luser/gamepadtest
*/

require(
    [
        'esri/Map',
        'esri/views/SceneView',
        'dojo/domReady!'
    ],
    function (
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
            // When the map loads immediately start the game loop.
            window.requestAnimationFrame(gameloop);
        });

        // These constants dictate the speed of angular and linear motion. Adjust as necessary.
        var ANGULAR_RATIO = 4;
        var LINEAR_RATIO = 0.05;

        // Use this variable to store the at-rest values of the joysticks. Older controllers may not be zero.
        var origin = null;

        // Parabolic function that will honor the original cardinality. This function is used to de-sensitize the xbox axes.
        function parabolic(e) {
            var p = e * e;
            if (e < 0) {
                p *= -1;
            }
            return p;
        }

        // This function is called every frame.
        function gameloop() {
            // Get all attached gamepads. Do not proceed if none exist.
            var gamepads = navigator.getGamepads();
            if (gamepads && gamepads.length > 0 && gamepads[0]) {
                // For simplicity only use first connected gamepad. Assume xbox 360/one controller.
                var xbox = gamepads[0];

                // Get Esri camera.
                var camera = view.camera;

                // If this is the first loop then store the at-rest positions of the axis.
                if (!origin) {
                    origin = xbox.axes.slice();
                }

                // Get the position of the two xbox axes, apply the origin correction and parabolic curve.
                // The parabolic function will make movements near the origin less pronounced than the edges.
                var lx = parabolic(xbox.axes[0] - origin[0]);
                var ly = parabolic(xbox.axes[1] - origin[1]);
                var rx = parabolic(xbox.axes[2] - origin[2]);
                var ry = parabolic(xbox.axes[3] - origin[3]);

                // Values for the left and right triggers.
                var lt = parabolic(xbox.buttons[6].value);
                var rt = parabolic(xbox.buttons[7].value);

                // Calculate the new heading and tilt.
                var heading = camera.heading + rx * ANGULAR_RATIO;
                var tilt = camera.tilt - ry * ANGULAR_RATIO;

                // Calculate the z-dependant linear ratio.
                var speed   = camera.position.z * LINEAR_RATIO;

                // Calculate the x, y and z.
                var x =
                    camera.position.x +
                    speed * lx * Math.cos(camera.heading * Math.PI / 180) +
                    speed * ly * Math.sin(-camera.heading * Math.PI / 180);
                var y =
                    camera.position.y +
                    speed * lx * Math.sin(-camera.heading * Math.PI / 180) -
                    speed * ly * Math.cos(camera.heading * Math.PI / 180);
                var z = camera.position.z +
                    speed * -lt +
                    speed * rt;

                // Assign an autocast camera using the heading, tilt and position calculated above.
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

            // Lastly request that this function be re-run before the next re-paint.
            window.requestAnimationFrame(gameloop);
        }
    }
);