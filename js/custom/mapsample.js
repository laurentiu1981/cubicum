(function(){
  var scene = new THREE.Scene();
  var movingObjects = [];
  var mixers = [];
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
    addRandomPoints(planeObject, movingObjects, 10);
    return planeObject;
  }

  function addRandomPoints(parent, movingObjects, number) {
    for (var i = 0; i < number; i++) {
      //addPoint(parent, movingObjects);
      addHorse(parent, movingObjects);
    }
  }



  function addPoint(parent, movingObjects) {

    var geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    geometry.velocity = new THREE.Vector3(
        Math.random() * 0.2 - 0.1,              // x
        Math.random() * 0.2 - 0.1, // y: random vel
        0);
    var pointMaterial = new THREE.MeshBasicMaterial({color: 0x123456});
    var particle = new THREE.Mesh(geometry, pointMaterial);
    particle.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, 0);
    movingObjects.push(particle);
    parent.add(particle);
  }

  var planeNormalAxis = new THREE.Vector3(0, 1, 0);
  var maxSpeed = 0.14142135623;
  var maxMixerUpdate = 0.04;
  function addHorse(parent, movingObjects) {
    var loader = new THREE.JSONLoader();
    loader.load( "models/animated/horse.json", function( geometry ) {

      var mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
        vertexColors: THREE.FaceColors,
        morphTargets: true
      } ) );
      mesh.scale.set( 0.001, 0.001, 0.001 );
      geometry.velocity = new THREE.Vector3(
        Math.random() * 0.2 - 0.1,              // x
        Math.random() * 0.2 - 0.1, // y: random vel
        0);
      mesh.position.set(0, 0, 0);
      mesh.rotateY(Math.PI / 2);
      mesh.rotateZ(Math.PI / 2);
      var speed = Math.sqrt(Math.pow(geometry.velocity.x, 2) + Math.pow(geometry.velocity.y, 2));


      rotateBasedOnVelocity(mesh);

      movingObjects.push(mesh);
      parent.add(mesh);

      var mixer = new THREE.AnimationMixer( mesh );
      mixers.push(mixer);
      var clip = THREE.AnimationClip.CreateFromMorphTargetSequence( 'gallop', geometry.morphTargets, 30 );
      mixer.clipAction( clip ).setDuration( 1 ).play();
      mixer.updateCoeficient = speed/maxSpeed * maxMixerUpdate;
    } );
  }

  function rotateBasedOnVelocity(mesh, click) {
    var rotateAngle = Math.atan(Math.abs(mesh.geometry.velocity.y) / Math.abs(mesh.geometry.velocity.x));
    if (mesh.geometry.velocity.x < 0) {
      rotateAngle = Math.PI - rotateAngle;
    }
    if (click) {
      mesh.rotateOnAxis(planeNormalAxis, 0);
      return;
    }
    var axisRotation = (rotateAngle) * (mesh.geometry.velocity.y < 0 ? -1 : 1);
    mesh.rotateOnAxis(planeNormalAxis, axisRotation - (mesh.geometry.currentAxisRotation ? mesh.geometry.currentAxisRotation : 0));
    mesh.geometry.currentAxisRotation = axisRotation;
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

  var lineMaterial = new THREE.LineBasicMaterial({
    color: 0x0000ff
  });
  var vectorLineMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff
  });
  var lineGeometry = new THREE.Geometry();
  lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
  lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));

  var vectorLineGeometry = new THREE.Geometry();
  vectorLineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
  vectorLineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));

  var line = new THREE.Line(lineGeometry, lineMaterial);
  var vectorLine = new THREE.Line(vectorLineGeometry, vectorLineMaterial);

  var intersects = [];
  var planeIntersect;
  var mouseDown = false;

  scene.add(cube);
  scene.add(map);
  for (var i = -5; i <= 5; i++) {
    map.add(createAPlane(10, 10, 0.1, i));
  }

  camera.position.z = 100; //move camera back so we can see the cube

  var fps = 30;
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

      for (var mindex in mixers) {
        mixers[mindex].update(mixers[mindex].updateCoeficient);
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
    if (!mouseDown) {
      mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
      mouse.y = -( event.clientY / renderer.domElement.height ) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      intersects = raycaster.intersectObjects(movingObjects);
      if (activeObject) {
        planeIntersect = raycaster.intersectObject(activeObject.object.parent);
        if (planeIntersect.length) {
          lineGeometry.vertices[1].x = planeIntersect[0].point.x;
          lineGeometry.vertices[1].y = planeIntersect[0].point.y;
          lineGeometry.vertices[1].z = planeIntersect[0].point.z;
          lineGeometry.vertices[0].x = planeIntersect[0].point.x;
          lineGeometry.vertices[0].y = planeIntersect[0].point.y;
          lineGeometry.vertices[0].z = planeIntersect[0].point.z + 1;
        }
      }
    }
    lineGeometry.verticesNeedUpdate = true;
  }

  function onMouseDown(event) {
    mouseDown = true;
  }
  function onMouseUp(event) {
    mouseDown = false;
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
        scene.add(line);
        scene.add(vectorLine);
      }
    }
    else {
      var activePoint = activeObject.object.position;
      var hits = raycaster.intersectObject(activeObject.object.parent, true);
      if (hits.length) {
        var speed = Math.sqrt(Math.pow(activeObject.object.geometry.velocity.x, 2) + Math.pow(activeObject.object.geometry.velocity.y, 2));
        var xyangle = Math.atan(Math.abs(hits[0].point.x - activePoint.x) / Math.abs(hits[0].point.y - activePoint.y));
        var Vx = Math.sin(xyangle) * speed;
        var Vy = Math.cos(xyangle) * speed;

        activeObject.object.geometry.velocity.x = Vx * (hits[0].point.x > activePoint.x ? 1 : -1);
        activeObject.object.geometry.velocity.y = Vy * (hits[0].point.y > activePoint.y ? 1 : -1);

        rotateBasedOnVelocity(activeObject.object);

        vectorLineGeometry.vertices[0].x = activePoint.x;
        vectorLineGeometry.vertices[0].y = activePoint.y;
        vectorLineGeometry.vertices[0].z = activePoint.z + activeObject.object.parent.position.z;
        vectorLineGeometry.vertices[1].x = hits[0].point.x;
        vectorLineGeometry.vertices[1].y = hits[0].point.y;
        vectorLineGeometry.vertices[1].z = hits[0].point.z;
        vectorLineGeometry.verticesNeedUpdate = true;
      }


    }
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

  }

  window.addEventListener( 'resize', onWindowResize, false );
  window.addEventListener( 'mousemove', onMouseMove, false );
  window.addEventListener( 'mousedown', onMouseDown, false );
  window.addEventListener( 'mousedown', onMouseUp, false );
  window.addEventListener( 'click', onMouseClick, false );


})();
