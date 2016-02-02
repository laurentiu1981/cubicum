(function(){
  var scene = new THREE.Scene();
  var movingObjects = [];
  var activeObject;
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
      depth = 50, //depth
      width = 50, //width
      height = 50, //height
      a = 100,
      b = 100,
      c = 100;
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
      linesHeight: a,
      linesWidth: b,
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

    var planeObject = new THREE.Mesh( new THREE.PlaneGeometry( x1, y1, 1), material );
    planeObject.position.set( 0, 0, depth );
    addRandomPoints(planeObject, movingObjects, 100);
    return planeObject;
  }

  function addRandomPoints(parent, movingObjects, number) {
    for (var i = 0; i < number; i++) {
      var point = addPoint();
      movingObjects.push(point);
      parent.add(point);
    }
  }



  function addPoint() {

    var pX = Math.random() * 2,
        pY = Math.random() * 2,
        pZ = 0,
        geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    geometry.velocity = new THREE.Vector3(
        Math.random() * 0.2 - 0.1,              // x
        Math.random() * 0.2 - 0.1, // y: random vel
        0);
    var pointMaterial = new THREE.MeshBasicMaterial({color: 0x123456});
    var particle = new THREE.Mesh(geometry, pointMaterial);
    particle.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, 0);
    return particle;
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
      stepw = 20 * config.width / config.linesWidth,
      steph = 20 * config.height / config.linesHeight;

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
  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2(), INTERSECTED;

  var intersects = [];

  scene.add(cube);
  scene.add(map);
  for (var i = -5; i <= 5; i++) {
    map.add(createAPlane(10, 10, 0.1, i));
  }

  camera.position.z = 100; //move camera back so we can see the cube

  var fps = 60;
  var now;
  var then = Date.now();
  var initial = Date.now();
  var interval = 1000/fps;
  var delta;
  var cicleInterval = 10;
  var timeCoeficient = 0;
  var render = function() {
    requestAnimationFrame(render);

    if (intersects.length > 0) {
      for(var i in intersects) {
        if (!activeObject || intersects[i].object.uuid != activeObject.object.uuid) {
          intersects[i].object.material.color.set(0xff0000);
        }
      }
    }
    now = Date.now();
    delta = now - then;

    if (delta > interval) {
      timeCoeficient = delta / 1000;
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
      for (var index in movingObjects) {
        movingObjects[index].position.x += movingObjects[index].geometry.velocity.x * timeCoeficient;
        movingObjects[index].position.y += movingObjects[index].geometry.velocity.y * timeCoeficient;
      }

      // ... Code for Drawing the Frame ...
      //rotate cube a little each frame
      //map.rotation.x += 0.01;
      //map.rotation.y = ((now - initial) / 1000 % cicleInterval) / cicleInterval * 2 * Math.PI;
    }
  };
  render();

  function onMouseMove(event) {
    event.preventDefault();
    mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    intersects = raycaster.intersectObjects( movingObjects );
  }

  function onMouseClick(event) {
    if (!activeObject) {
      event.preventDefault();
      mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
      mouse.y = -( event.clientY / renderer.domElement.height ) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      intersects = raycaster.intersectObjects(movingObjects);
      if (intersects.length > 0) {
        activeObject = intersects[0];
        activeObject.object.material.color.set( 0xd8ffe4 );
        console.log('new activeObject');
      }
    }
    else {
      var normal = new THREE.Vector3(0,0,1);
      var activePoint = activeObject.object.position;
      var mousePoint = new THREE.Vector3(mouse.x, mouse.y, 16);
      var rayProjection = new THREE.Raycaster(mousePoint, normal.clone().negate(), 0, Number.POSITIVE_INFINITY);
      var hits = rayProjection.intersectObject(activeObject.object.parent, true);
      if (hits.length) {
        console.log('active point: ' + activePoint.x + ':' + activePoint.y + '  projection point: ' + hits[0].point.x + ':' + hits[0].point.y);

        var speed = Math.sqrt(Math.pow(activeObject.object.geometry.velocity.x, 2) + Math.pow(activeObject.object.geometry.velocity.y, 2));
        var distance = Math.sqrt(Math.pow(hits[0].point.x - activePoint.x, 2) + Math.pow(hits[0].point.y - activePoint.y, 2));

        var time = distance / speed;
        console.log('time: ' + time);
        var Vx = (hits[0].point.x - activePoint.x) / time;
        var Vy = (hits[0].point.y - activePoint.y) / time;

        activeObject.object.geometry.velocity.x = Vx;
        activeObject.object.geometry.velocity.y = Vy;
      }


    }
  }

  window.addEventListener( 'mousemove', onMouseMove, false );
  window.addEventListener( 'click', onMouseClick, false );


})();
