(function(){
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(
    75,                                     //Field of View
    window.innerWidth / window.innerHeight, //aspect ratio
    0.1,                                    //near clipping plane
    1000                                    //far clipping plane
  );
  var renderer = new THREE.WebGLRenderer({
    alpha: true,    //transparent background
    antialias: true //smooth edges
  });

  function createMap() {
    var boundingGrid = new THREE.Object3D(),
      depth = 5, //depth
      width = 5, //width
      height = 5, //height
      a = 10,
      b = 10,
      c = 10;
    var newGridXY = createAGrid({
      height: width,
      width: height,
      linesHeight: b,
      linesWidth: a,
      color: 0xDD006C
    });
    newGridXY.position.z = -depth;
    boundingGrid.add(newGridXY);

    var newGridYZ = createAGrid({
      height: width,
      width: depth,
      linesHeight: 10,
      linesWidth: 10,
      color: 0xAF221A
    });
    newGridYZ.rotation.x = Math.PI/2;
    newGridYZ.position.y = -height;
    boundingGrid.add(newGridYZ);

    var newGridXZ = createAGrid({
      height: depth,
      width: height,
      linesHeight:c,
      linesWidth: a,
      color: 0xDD006C
    });

    newGridXZ.position.x = width;
    newGridXZ.rotation.y = Math.PI/2;
    boundingGrid.add(newGridXZ);
    return boundingGrid;
  }

  function createAPlane(x1, y1, thick, depth, opts) {
    var config = opts || {
        color: 0xDD006C,
        colors: {
          '-5' : 0x201818,
          '-4' : 0x090A54,
          '-3' : 0x1214A8,
          '-2' : 0x1C1FFD,
          '-1' : 0x1C1FFD,
          '0' : 0xB21D84,
          '1' : 0xFD1C48,
          '2' : 0xFD5475,
          '3' : 0xFE8DA3,
          '4' : 0xFEC6D1,
          '5' : 0xE8E8E8
        }
      };

    var material = new THREE.LineBasicMaterial({
      color: config.colors[depth] || config.color,
      opacity: 0.4,
      transparent:  true,
      side: THREE.DoubleSide
    });

    var planeObject = new THREE.Mesh( new THREE.BoxGeometry( x1, y1, thick), material );
    planeObject.position.set( 0, 0, depth );
    return planeObject;
  }

  function createAGrid(opts) {
    var config = opts || {
        height: 5,
        width: 5,
        linesHeight: 10,
        linesWidth: 10,
        color: 0xDD006C
      };

    var material = new THREE.LineBasicMaterial({
      color: config.color,
      opacity: 0.2
    });

    var gridObject = new THREE.Object3D(),
      gridGeo = new THREE.Geometry(),
      stepw = 2 * config.width / config.linesWidth,
      steph = 2 * config.height / config.linesHeight;

    //width
    for (var i = -config.width; i <= config.width; i += stepw) {
      gridGeo.vertices.push(new THREE.Vector3(-config.height, i, 0));
      gridGeo.vertices.push(new THREE.Vector3(config.height, i, 0));

    }
    //height
    for (var i = -config.height; i <= config.height; i += steph) {
      gridGeo.vertices.push(new THREE.Vector3(i, -config.width, 0));
      gridGeo.vertices.push(new THREE.Vector3(i, config.width, 0));
    }

    var line = new THREE.Line(gridGeo, material, THREE.LinePieces);
    gridObject.add(line);

    return gridObject;
  }

  var map = createMap();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.className = 'map';
  document.body.appendChild(renderer.domElement);
  var orbit = new THREE.OrbitControls( camera, renderer.domElement );
  var geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  var material = new THREE.MeshNormalMaterial();
  var cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  scene.add(map);
  for (var i = -5; i <= 5; i++) {
    map.add(createAPlane(10, 10, 0.1, i));
  }

  camera.position.z = 10; //move camera back so we can see the cube

  var fps = 30;
  var now;
  var then = Date.now();
  var initial = Date.now();
  var interval = 1000/fps;
  var delta;
  var cicleInterval = 10;
  var render = function() {
    requestAnimationFrame(render);



    now = Date.now();
    delta = now - then;

    if (delta > interval) {
      // update time stuffs

      // Just `then = now` is not enough.
      // Lets say we set fps at 10 which means
      // each frame must take 100ms
      // Now frame executes in 16ms (60fps) so
      // the loop iterates 7 times (16*7 = 112ms) until
      // delta > interval === true
      // Eventually this lowers down the FPS as
      // 112*10 = 1120ms (NOT 1000ms).
      // So we have to get rid of that extra 12ms
      // by subtracting delta (112) % interval (100).
      // Hope that makes sense.

      then = now - (delta % interval);
      renderer.render(scene, camera);

      // ... Code for Drawing the Frame ...
      //rotate cube a little each frame
      //map.rotation.x += 0.01;
      map.rotation.y = ((now - initial) / 1000 % cicleInterval) / cicleInterval * 2 * Math.PI;
    }
  };
  render();



  //function draw() {
  //
  //  requestAnimationFrame(draw);
  //
  //  now = Date.now();
  //  delta = now - then;
  //
  //  if (delta > interval) {
  //    // update time stuffs
  //
  //    // Just `then = now` is not enough.
  //    // Lets say we set fps at 10 which means
  //    // each frame must take 100ms
  //    // Now frame executes in 16ms (60fps) so
  //    // the loop iterates 7 times (16*7 = 112ms) until
  //    // delta > interval === true
  //    // Eventually this lowers down the FPS as
  //    // 112*10 = 1120ms (NOT 1000ms).
  //    // So we have to get rid of that extra 12ms
  //    // by subtracting delta (112) % interval (100).
  //    // Hope that makes sense.
  //
  //    then = now - (delta % interval);
  //
  //    // ... Code for Drawing the Frame ...
  //  }
  //}
  //
  //draw();
})();
