$(function() {

	var scene, camera, renderer, container;

	// inset scene elements
	var scene_i, camera_i, renderer_i, container_i;

	// inset constants
	var CANVAS_WIDTH = 50,
		CANVAS_HEIGHT = 50,
		CAM_DISTANCE = 300;
	
	var geometry, material, mesh, plane;

	var scene_width = 700;
	var scene_height = 500;

	var mouse;
	
	// scene_width = window.innerWidth;
	// scene_height = window.innerHeight;
	
	init();
	animate();

	function init()
	{
		container = document.getElementById("canvas-container");
		container_i = document.getElementById('inset');
		//		container = document.createElement("div");
		// document.body.appendChild(container);
		
		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera(
			//camera = new THREE.OrthographicCamera(
			45, scene_width / scene_height, 0.0001, 10000
		);
		// camera.position.set(0, 300 ,500);
		camera.position.set(0, 0 ,1000);


		geometry = new THREE.BoxGeometry(200, 200, 200);
		material = new THREE.MeshNormalMaterial({
		});

		mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(300, 300, 300);

		plane = new THREE.Mesh(
			new THREE.PlaneGeometry(1000,1000),
			new THREE.MeshBasicMaterial({
				color: 0x000,				
				side: THREE.DoubleSide,
				transparent: true,
				opacity: 0.3				
			})
		);

		var line_geometry = new THREE.Geometry();
		
		line_geometry.vertices.push(new THREE.Vector3(0,0,-800));
		line_geometry.vertices.push(new THREE.Vector3(0,0,800));
		
		var line_material = new THREE.LineBasicMaterial({
			color:0x888888, linewidth: 5
		});
		var line = new THREE.Line(line_geometry, line_material);


		// sample track
		//Create a closed bent a sine-like wave
		var curve = new THREE.SplineCurve3( [
			new THREE.Vector3( 0, 0, 0 ),
			new THREE.Vector3( 10, 40, 10 ),
			new THREE.Vector3( 25, 350, 25 ),
			new THREE.Vector3( 400, 0, 400 )
		] );

		var geometry_c = new THREE.Geometry();
		geometry_c.vertices = curve.getPoints( 50 );

		//Create the final Object3d to add to the scene
		var splineObject = new THREE.Line(
			geometry_c, new THREE.LineBasicMaterial({
				color : 0x0011dd,
				linewidth: 5
			})
		);
		
		// add assets to scene
		// scene.add(splineObject);
		scene.add(line);
		// scene.add(plane);
		// scene.add(mesh);

		renderer = new THREE.WebGLRenderer();
		renderer.setClearColor(0xffffff);
		// renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setSize(scene_width, scene_height);
		
        container.addEventListener('mousedown', onSceneMouseDown, false);
        container.addEventListener('mousemove', onSceneMouseMove, false);
        // document.addEventListener('mousemove', onDocumentMouseMove, false);
		
		controls = new THREE.TrackballControls(camera, container);

		controls.rotateSpeed = 4.0;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 0.5;

		controls.noZoom = false;
		controls.noPan = false;

		controls.staticMoving = true;
		// controls.dynamicDampingFactor = 0.03;

		controls.keys = [ 65, 83, 68 ];

		
		controls.addEventListener( 'change', render );

		container.appendChild(renderer.domElement);

		// inset elements
		
		renderer_i = new THREE.WebGLRenderer({
			alpha: true
		});
		renderer_i.setClearColor( 0xf0f0f0, 0);
		renderer_i.setSize( CANVAS_WIDTH, CANVAS_HEIGHT );
		container_i.appendChild( renderer_i.domElement );

		// scene
		scene_i = new THREE.Scene();

		// camera
		camera_i = new THREE.PerspectiveCamera(
			50, CANVAS_WIDTH / CANVAS_HEIGHT, 1, 1000
		);
		camera_i.up = camera.up; // important!

		// axes
		axes = new THREE.AxisHelper( 100 );
		scene_i.add( axes );

		var projector = new THREE.Projector();
		mouse = new THREE.Vector2();

		render();
	}

	function load_geometry(filename)
	{
		var merge_all_geomerties = false;
		var use_wireframe = false;
		
		waitingDialog.show("Loading geometry", {dialogSize: 'sm'});
		geometry_file = "geometry/" + filename;
		
		$.ajax(
			geometry_file,
			{
				dataType: "json",
				success: function(data) {

					document.detector_modules = [];

					if (merge_all_geomerties) {
						var global_geom = new THREE.Geometry();
					}

					for ( var k in data)
					{
						var vals = data[k];

						var vertices = [];

						
						for (var i in vals['x'])
						{
							vertices.push(
								new THREE.Vector3(
									parseFloat(vals['x'][i]), parseFloat(vals['y'][i]), parseFloat(vals['z'][i])
								)
							);
						}
						
						var faces = [
							new THREE.Face3(0, 4, 3),
							new THREE.Face3(3, 4, 7),
							new THREE.Face3(3, 7, 2),
							new THREE.Face3(7, 6, 2),
							new THREE.Face3(4, 5, 6),
							new THREE.Face3(6, 7, 4),
							new THREE.Face3(0, 1, 4),
							new THREE.Face3(4, 1, 5),
							new THREE.Face3(0, 3, 1),
							new THREE.Face3(3, 2, 1),
							new THREE.Face3(1, 2, 5),
							new THREE.Face3(2, 6, 5)
						];
						
						var geom = new THREE.Geometry();
						geom.vertices = vertices;
						geom.faces = faces;
						
						geom.computeFaceNormals();

						var shape_mesh;
						
						if (use_wireframe) {
							shape_mesh = new THREE.MeshBasicMaterial({
								wireframe: true, color: 0x00ff00
							});
						} else {
							shape_mesh = new THREE.MeshNormalMaterial({
								color:0x0000ff,
								transparent: true,
								opacity: 0.2,
								side: THREE.DoubleSide
							});
						}
						
						var shape = new THREE.Mesh(	geom, shape_mesh);

						shape.data = {
							"mod_id" : data[k].mod_id,
							"mod_type" : data[k].mod_id,
							"identifier": data[k].identifier
						};
						
						document.detector_modules.push(shape);

						if (merge_all_geomerties) {
							shape.updateMatrix();
							global_geom.merge(shape.geometry, shape.matrix);
						}
					}

					if (merge_all_geomerties) {
						scene.add(
							new THREE.Mesh(
								global_geom,
								new THREE.MeshNormalMaterial()
							)
						);
					}
					
					document.geometry_loaded = true;
					waitingDialog.hide();

					render();
				},
				fail: function(data) {
					alert("Error loading geometry.");
					waitingDialog.hide();
				}
			}
		);
	}

	function animate()
	{
		requestAnimationFrame(animate);

		
		camera_i.position.copy( camera.position );
		camera_i.position.sub( controls.target ); // added by @libe
		camera_i.position.setLength( CAM_DISTANCE );

		camera_i.lookAt( scene_i.position );


		controls.update();
	}

	function render()
	{
		renderer.render(scene, camera);
		renderer_i.render(scene_i, camera_i);
	}

	document.loadGeometry = function ()
	{
		if (document.geometry_loaded) {
			return;
		}

		load_geometry("geometry_combined.json");
		
		document.visible_geoms = {
			"B1": false,
			"B2": false,
			"B3": false,
			"B4": false,
			"B5": false,
			"B6": false,
			"E1": false,
			"E2": false,
			"E3": false,
			"E4": false,
			"E5": false,
			"E-1": false,
			"E-2": false,
			"E-3": false,
			"E-4": false,
			"E-5": false
		};
	};

	$(".geom-controls input.btn").click(function(element){

		if (!document.geometry_loaded) {
			alert("Please load geometry first.");
			return;
		}
		
		var target = $(element.currentTarget);
		
		if (target.hasClass("active")) {
			target.removeClass("active");
			document.hideGeomElement(target.attr("value"));
		} else {
			$(element.currentTarget).addClass("active");
			document.showGeomElement(target.attr("value"));
		}
		// alert("clicked");
	});

	document.showGeomElement = function (identifier)
	{
		if (!document.visible_modules) {
			document.visible_modules = [];
		}
		if (document.visible_geoms[identifier]) {
			return;
		}
		
		for ( var i in document.detector_modules)
		{
			var mod = document.detector_modules[i];
			if (mod.data.identifier == identifier) {
				scene.add(mod);
				document.visible_modules.push(mod);
			}
		}
		
		document.visible_geoms[identifier] = true;
		

		render();
	};
	
	document.hideGeomElement = function (identifier)
	{
		if (!document.visible_geoms[identifier]) {
			return;
		}
		
		for ( var i in document.detector_modules)
		{
			var mod = document.detector_modules[i];
			if (mod.data.identifier == identifier) {
				scene.remove(mod);
			}
		}
		
		document.visible_geoms[identifier] = false;		

		render();
	};

	document.lookXY = function()
	{
		var length = camera.position.length();
		camera.position.x = 0;
		camera.position.y = 0;
		camera.position.z = length;
		camera.up = new THREE.Vector3(0,1,0);
		
		camera.lookAt(new THREE.Vector3(0,0,0));
	};

	document.lookXZ = function ()
	{
		var length = camera.position.length();
		camera.position.x = 0;
		camera.position.y = length;
		camera.position.z = 0;
		camera.up = new THREE.Vector3(1,0,0);
		
		camera.lookAt(new THREE.Vector3(0,0,0));
	};

	document.lookYZ = function ()
	{
		var length = camera.position.length();
		camera.position.x = length;
		camera.position.y = 0;
		camera.position.z = 0;
		camera.up = new THREE.Vector3(0,0,1);
		
		camera.lookAt(new THREE.Vector3(0,0,0));
	};

	document.zoomIn = function ()
	{
		console.log("zooming in");
		camera.position.x -= 0.1 * camera.position.x;
		camera.position.y -= 0.1 * camera.position.y;
		camera.position.z -= 0.1 * camera.position.z;
		camera.updateProjectionMatrix();
	};

	document.zoomOut = function ()
	{
		console.log("zooming out");
		camera.position.x += 0.1 * camera.position.x;
		camera.position.y += 0.1 * camera.position.y;
		camera.position.z += 0.1 * camera.position.z;
		camera.updateProjectionMatrix();
	};

	document.moveUp = function ()
	{
		camera.position.x += 10;
		camera.updateProjectionMatrix();
	};

	document.moveDown = function ()
	{
		camera.position.x -= 10;
		camera.updateProjectionMatrix();
	};

	document.visualiseEvent = function(cands)
	{

		// put a reference to external method for parsing the data here

		// extract event name

		// extract tracks
		// var tracks_list = tracks;					
		// $("#tracks_no").text(tracks_list.length);
		
		// extract reconstructions
		var candidates_list = cands;
		$("#recons_no").text(candidates_list.length);

		document.event = {};

		document.event.candidates = [];
		
		console.log(candidates_list.length + " candidates found.");
		/*
		 /*
		 for ( var k in tracks_list)
		 {
		 var v_coords = tracks_list[k];

		 
		 var vertices_vect = [];
		 for (var j in v_coords)
		 {
		 vertices_vect.push(new THREE.Vector3(
		 v_coords[j][0],
		 v_coords[j][1],
		 v_coords[j][2]
		 ));
		 }

		 // track as a line
		 var curve = new THREE.SplineCurve3(vertices_vect);
		 var geom = new THREE.Geometry();
		 geom.vertices = curve.getPoints(50);

		 var track = new THREE.Line(
		 geom,
		 new THREE.LineBasicMaterial({
		 color: 0x00ff00,
		 linewidth: 2
		 })
		 );
		 

		 
		 // track as a tube
		 // var mat = new THREE.MeshBasicMaterial({color: 0x00ff00});
         // var tubeGeometry = new THREE.TubeGeometry(new THREE.SplineCurve3(vertices_vect), 60, 1);
		 // var track = new THREE.Mesh(tubeGeometry, mat);
		 
		 
		 document.event.tracks.push(track);

		 
		 /*
		 // alternative collision detection mechanism

		 var cube = track;
		 var originPoint = cube.position.clone();
		 for (var vertexIndex = 0; vertexIndex < cube.geometry.vertices.length; vertexIndex++)
		 {


		 
		 var s_geometry = new THREE.SphereGeometry(0.5, 50, 50);
		 var vertex = cube.geometry.vertices[vertexIndex];
		 var stub = new THREE.Mesh(
		 s_geometry,
		 new THREE.MeshBasicMaterial({color: 0x0000ff, transparent:true, opacity:0.1})
		 );
		 stub.position.x = vertex.x;
		 stub.position.y = vertex.y;
		 stub.position.z = vertex.z;
		 
		 // scene.add(stub); 



		 
		 if (vertexIndex == 0) continue;

		 var ray = new THREE.Raycaster(cube.geometry.vertices[vertexIndex], cube.geometry.vertices[vertexIndex-1]);
		 // console.log(ray); continue;
		 var points = [];
		 points.push(ray.ray.origin);
		 points.push(ray.ray.direction);
		 var mat = new THREE.MeshBasicMaterial({color: 0xff0000});
         var tubeGeometry = new THREE.TubeGeometry(new THREE.SplineCurve3(points), 60, 0.1);
		 var tube = new THREE.Mesh(tubeGeometry, mat);
		 scene.add(tube); continue;
		 
		 var collisionResults = ray.intersectObjects(document.detector_modules);
		 //
		 // console.log("detection collision with " + document.detector_modules.length + " modules");

		 if (collisionResults.length > 0) {
		 console.log("colision found");
		 for (var i in collisionResults)
		 {
		 var obj = collisionResults[i].object;

		 v			 //console.log(obj);

		 // obj.material.color = 0xff0000;
		 //obj.material.transparent = true;
		 //obj.material.opacity = 0.1;

		 scene.add(obj);
		 
		 // console.log(collisionResults);
		 }
		 continue;
		 }
		 }
		 
		 
		 scene.add(track);
		 }
		 */

		visualise_points = false;
		
		for ( var i in candidates_list)
		{
			v_coords = candidates_list[i].coords;

			if (v_coords.length == 0) {
				console.log("no coords found");
				continue;
			}

			vertices_vect = [];
			for (var m in v_coords)
			{
				vertices_vect.push(new THREE.Vector3(
					v_coords[m][0],
					v_coords[m][1],
					v_coords[m][2]
				));

				
				if (visualise_points) {
					
					var point = new THREE.Mesh(
						new THREE.SphereGeometry(1.5, 20, 20),
						new THREE.MeshBasicMaterial({color: 0x000000})
					);
					point.position.set(
						v_coords[m][0],
						v_coords[m][1],
						v_coords[m][2]
					);

					scene.add(point);
				}
			}

			// track as a line
			curve = new THREE.SplineCurve3(vertices_vect);
			geom = new THREE.Geometry();
			geom.vertices = curve.getPoints(50);

			var cand = new THREE.Line(
				geom,
				new THREE.LineBasicMaterial({
					color: 0x0000ff,
					linewidth: 2,
					transparent: true,
					opacity: 0.5
				})
			);


			var obj = candidates_list[i];
			cand.id = i;

			cand.data = {};
			cand.data.stubs_obj_list = [];
			cand.data.stubs_coord = obj.stubs;
			cand.data.tp_obj_coords = obj.track;
			cand.data.tp_obj = {};

			cand.data.pt = obj.pt;
			cand.data.q = obj.q;
			cand.data.eta = obj.eta;
			cand.data.phi0 = obj.phi0;

			document.add_candidate(cand);

			cand.show_info = function ()
			{
				console.log("showing info");
				console.log(this.data);
				
				var stubs_list = this.data.stubs_coord;
				

				for( var key in stubs_list)
				{
					
					var x = stubs_list[key][0];
					var y = stubs_list[key][1];
					var z = stubs_list[key][2];
					
					var s_geometry = new THREE.SphereGeometry(1.5, 20, 20);
					
					var stub = new THREE.Mesh(
						s_geometry,
						new THREE.MeshBasicMaterial({color: 0xff0000})
					);
					stub.position.set(x, y, z);

					scene.add(stub);

					this.data.stubs_obj_list.push(stub);
				}

				var tracks_list = this.data.tp_obj_coords;
				// console.log(tracks_list);
				
				//for ( var k in tracks_list)
				//{
				var v_coords = tracks_list;

				if (tracks_list.length > 0) {
					var vertices_vect = [];
					for (var j in v_coords)
					{
						vertices_vect.push(new THREE.Vector3(
							v_coords[j][0],
							v_coords[j][1],
							v_coords[j][2]
						));
					}

					console.log(tracks_list);
					// track as a line
					var curve = new THREE.SplineCurve3(vertices_vect);
					var geom = new THREE.Geometry();
					geom.vertices = curve.getPoints(50);

					var track = new THREE.Line(
						geom,
						new THREE.LineBasicMaterial({
							color: 0x00ff00,
							linewidth: 10
						})
					);

					scene.remove(scene.children);
					scene.add(track);
					
					this.data.tp_obj = track;

				} else {
					console.log("no tp for particle");

				}
				
				// track as a tube
				// var mat = new THREE.MeshBasicMaterial({color: 0x00ff00});
				// var tubeGeometry = new THREE.TubeGeometry(new THREE.SplineCurve3(vertices_vect), 60, 1);
				// var track = new THREE.Mesh(tubeGeometry, mat);
				
				
				// document.event.tracks.push(track);
				//}
				
			};

			cand.hide_info = function ()
			{
				for (var i in this.data.stubs_obj_list)
				{
					scene.remove(this.data.stubs_obj_list[i]);
				}

				scene.remove(this.data.tp_obj);
				console.log("hiding info");
			};
			
			document.event.candidates.push(cand);
			
			scene.add(cand);
			// console.log("Cand added");

			/*

			 var stubs_list = candidates_list[i].stubs;

			 for( var key in stubs_list)
			 {
			 
			 var x = stubs_list[key][0];
			 var y = stubs_list[key][1];
			 var z = stubs_list[key][2];
			 
			 var s_geometry = new THREE.SphereGeometry(1.5, 20, 20);
			 
			 var stub = new THREE.Mesh(
			 s_geometry,
			 new THREE.MeshBasicMaterial({color: 0xff0000})
			 );
			 stub.position.set(x, y, z);
			 
			 // cand.data.stubs_obj_list.push(stub);

			 // scene.add(stub);
			 // console.log("Stub added.");
			 }
			 */
		}

		document.attach_table_events(scene, render);
		
		render();
	};
	
	document.loadData = function ()
	{
		//var filename = "test4.js";
		var filename = "test_full.js";

		document.loadEvent(filename);
	};

	document.loadEvent = function (filename)
	{
		console.log("Loading events/" + filename);

		if (document.event) {
			scene.remove(event);
		}

		var full_filename = "events/" + filename;

		waitingDialog.show("Loading event", {dialogSize: 'sm'});
		$.ajax(
			full_filename,
			{
				dataType: "script",
				processData: true,
				success: function(data) {
					console.log("Data successfuly loaded from " + full_filename);
					//console.log(data);
					//console.log(external_data);


					document.visualiseEvent(external_data.candidates);

					document.external_data = external_data;
					
					waitingDialog.hide();
				},
				error: function (data, textstatus, error) {
					console.log("Loading Test Status: " + textstatus);
					console.log("Eror: " + error);
					console.log("Error loading data from " + full_filename);
					
					waitingDialog.hide();
				}
			}
		);
	};


	function onSceneMouseMove (event)
	{
		if (!document.external_data)
			return;
		
		var rect = container.getBoundingClientRect();

		var mouse_x_scene = event.clientX - rect.left;
		var mouse_y_scene = event.clientY - rect.top;

		mouse.x = ( mouse_x_scene / scene_width ) * 2 - 1;
		mouse.y = (- mouse_y_scene / scene_height ) * 2 + 1;
		
		var raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(document.event.candidates, true);


		if (document.prev_hover_target) {

			document.reset_candidate(document.prev_hover_target, scene, render);
			
			// document.prev_hover_target.material = document.prev_material;
			//document.prev_hover_target.material.opacity = document.prev_hover_material.opacity;

			//document.prev_hover_target.material.linewidth = document.prev_hover_material.linewidth;

			/*
			document.prev_hover_target.material.color.setHex(0x0000ff);

			// document.prev_hover_target.object.material = document.prev_material;

			// document.prev_hover_target.object.color = {'r': 0, 'g': 0, 'b':1};
			scene.remove(document.prev_hover_target);
			scene.add(document.prev_hover_target);

			// console.log("resetting");

			render();
			 */
		}

		
        if (intersects.length > 0) {

			var obj = intersects[0].object;

			if (obj == document.prev_target) {
				return;
			}

			document.highlight_candidate(obj, scene, render);

			/*
			//var index = obj.id;
			//document.prev_hover_target = document.event.candidates[index];
			document.prev_hover_target = obj;
			document.prev_hover_material = obj.material;

            obj.material.transparent = true;
			//obj.material.linewidth = 4;
			//obj.material.opacity = 1;

			obj.material.color.setHex(0xb85423);

			render();
			*/
        }
	}
	
	function onSceneMouseDown (event)
	{
		//var document.prev_target;
		// the mouse interaction is currently disabled
		// return;
		
		//if (!document.geometry_loaded)
		//return;

		var rect = container.getBoundingClientRect();

		var mouse_x_scene = event.clientX - rect.left;
		var mouse_y_scene = event.clientY - rect.top;

		mouse.x = ( mouse_x_scene / scene_width ) * 2 - 1;
		mouse.y = (- mouse_y_scene / scene_height ) * 2 + 1;
		
		var raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(document.event.candidates, true);

        if (intersects.length > 0) {

			if (document.prev_target) {

				document.reset_click_candidate(document.prev_target, scene, render);
				/*
				// document.prev_target.material = document.prev_material;
				document.prev_target.material.opacity = document.prev_material.opacity;
				document.prev_target.material.linewidth = document.prev_material.linewidth;
				document.prev_target.material.color.setHex(0x0000ff);

				scene.remove(document.prev_target);
				scene.add(document.prev_target);

				document.prev_target.hide_info();

				render();
				 */
			}

			var obj = intersects[0].object;

			document.select_candidate(obj, scene, render);
				/*

			//var index = intersects[0].object.id;
			//document.prev_target = document.event.candidates[index];
			document.prev_target = obj;
			document.prev_material = obj.material;

			obj.show_info();

            obj.material.transparent = true;
            obj.material.opacity = 0.9;
			obj.material.linewidth = 3;
			obj.material.color.setHex(0xaa00dd);

			document.prev_hover_target = null;

			render();
			console.log("clicked");*/
        } else {
			// console.log("no intersects");
		}
	}

});
