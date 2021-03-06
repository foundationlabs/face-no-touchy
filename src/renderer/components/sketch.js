// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet using p5.js
=== */
/* eslint-disable */

import ml5 from 'ml5'

export default function run() {
  // Grab elements, create settings, etc.
  var video = document.getElementById('video');
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');


  // The detected positions will be inside an array
  let poses = [];

  // Create a webcam capture
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
      video.src = window.URL.createObjectURL(stream);
      video.play();
    });
  }

  // A function to draw the video and poses into the canvas.
  // This function is independent of the result of posenet
  // This way the video will not seem slow if poseNet
  // is not detecting a position
  function drawCameraIntoCanvas() {
    // Draw the video element into the canvas
    ctx.drawImage(video, 0, 0, 640, 480);
    // We can call both functions to draw all keypoints and the skeletons
    drawKeypoints();
    drawSkeleton();
    window.requestAnimationFrame(drawCameraIntoCanvas);
  }
  // Loop over the drawCameraIntoCanvas function
  drawCameraIntoCanvas();

  // Create a new poseNet method with a single detection
  // const poseNet = ml5.poseNet(video, 'single', gotPoses);
  // You can optionally call it for multiple poses
  const poseNet = new ml5.poseNet(video, 'multiple', modelLoaded);

  // A function that gets called every time there's an update from the model
  function modelLoaded(results) {
    console.log("model:", results);
  }

  function debounce(func, wait, immediate) {
    var timeout;

    return function executedFunction() {
      var context = this;
      var args = arguments;

      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };

      var callNow = immediate && !timeout;

      clearTimeout(timeout);

      timeout = setTimeout(later, wait);

      if (callNow) func.apply(context, args);
    };
  };

  var notify = debounce(function() {
    let notifyOfTouch = new Notification('You touched your face', {
      body: 'Don\'t do that.'
    })
  }, 1000, true);

  // Listen to new 'pose' events
  poseNet.on('pose', function (results) {
    poses = results;

    const rightWristPosition = poses[0]["pose"]["keypoints"][10]["position"];
    const leftWristPosition = poses[0]["pose"]["keypoints"][9]["position"];
    const nosePosition = poses[0]["pose"]["keypoints"][0]["position"];

    const rightWristDistanceToNose = Math.hypot(nosePosition["x"]-rightWristPosition["x"], nosePosition["y"]-rightWristPosition["y"])
    const rightWristInFrame = !!(poses[0]["pose"]["keypoints"][10]["score"] > 0.5);

    const leftWristDistanceToNose = Math.hypot(nosePosition["x"]-leftWristPosition["x"], nosePosition["y"]-leftWristPosition["y"])
    const leftWristInFrame = !!(poses[0]["pose"]["keypoints"][9]["score"] > 0.5);

    if (rightWristInFrame) {
      if (rightWristDistanceToNose < 205) {
        console.log("touching")
        notify()
      }
    }

    if (leftWristInFrame) {
      if (leftWristDistanceToNose < 205) {
        console.log("touching")
        notify()
      }
    }
  });

  // A function to draw ellipses over the detected keypoints
  function drawKeypoints()  {
    // Loop through all the poses detected
    if(poses!=undefined){
    for (let i = 0; i < poses.length; i++) {
      // For each pose detected, loop through all the keypoints
      for (let j = 0; j < poses[i].pose.keypoints.length; j++) {
        let keypoint = poses[i].pose.keypoints[j];
        // Only draw an ellipse is the pose probability is bigger than 0.2
        if (keypoint.score > 0.2) {
          ctx.fillStyle="#935FD3";

          ctx.beginPath();
          ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);

          ctx.stroke();
        }
      }
    }
  }
  }

  // A function to draw the skeletons
  function drawSkeleton() {
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i++) {
      // For every skeleton, loop through all body connections
      for (let j = 0; j < poses[i].skeleton.length; j++) {
        let partA = poses[i].skeleton[j][0];
        let partB = poses[i].skeleton[j][1];
        ctx.beginPath();
        ctx.moveTo(partA.position.x, partA.position.y);
        ctx.lineTo(partB.position.x, partB.position.y);
        ctx.stroke();
      }
    }
  }
}
