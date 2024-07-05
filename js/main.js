// Create the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x008080); // Set blue-green background color

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(36, 6.4, 12);  // Updated default position
camera.rotation.set(-0.49, 1.21, 0.46);  // Updated default rotation

// Create a directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 0); // Set the position of the light
scene.add(directionalLight);

// Add ambient light to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Create a renderer
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable damping (inertia)
controls.dampingFactor = 0.25; // Set damping factor
controls.enableZoom = true; // Enable zoom

let model; // Variable to store the loaded model

// Create a loader for loading the GLB file with Draco compression
const loader = new THREE.GLTFLoader();
const dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/libs/draco/');
loader.setDRACOLoader(dracoLoader);

// Load the GLB file
loader.load('models/home1.glb', function (gltf) {
    model = gltf.scene;
    scene.add(model);

    // Adjust the position, rotation, and scale of the model
    model.position.set(8, -1, -1);
    model.rotation.set(0, 1, 0);
    model.scale.set(2, 2, 2);
    console.log('Model loaded');

    // Initialize GUI controls for the camera
    initGUI();

    // Add points to the scene
    addClickablePoints();
}, undefined, function (error) {
    console.error('An error occurred while loading the model:', error);
});


// Initialize GUI controls for the camera
let gui, cameraFolder, cameraPositionFolder, cameraRotationFolder;

// Function to initialize GUI controls
function initGUI() {
    gui = new dat.GUI();

    // Camera properties
    cameraFolder = gui.addFolder('Camera Properties');
    cameraPositionFolder = cameraFolder.addFolder('Position');
    cameraRotationFolder = cameraFolder.addFolder('Rotation');

    cameraPositionFolder.add(camera.position, 'x', -200, 200).listen();
    cameraPositionFolder.add(camera.position, 'y', -200, 200).listen();
    cameraPositionFolder.add(camera.position, 'z', -200, 200).listen();

    cameraRotationFolder.add(camera.rotation, 'x', -Math.PI, Math.PI).listen();
    cameraRotationFolder.add(camera.rotation, 'y', -Math.PI, Math.PI).listen();
    cameraRotationFolder.add(camera.rotation, 'z', -Math.PI, Math.PI).listen();

    cameraFolder.open();
    cameraPositionFolder.open();
    cameraRotationFolder.open();
}

// Add event listeners to update GUI controls when OrbitControls change
controls.addEventListener('change', () => {
    gui.updateDisplay();
});

// Toggle button for OrbitControls
let orbitControlsEnabled = true;
document.getElementById('toggleControls').addEventListener('click', function () {
    orbitControlsEnabled = !orbitControlsEnabled;
    controls.enabled = orbitControlsEnabled;
    this.textContent = orbitControlsEnabled ? 'Disable Orbit Controls' : 'Enable Orbit Controls';
});

// Function to move the camera to a specific position with a transition
function moveCamera(position, rotation, rightMoveDuration = 2) {
    const easeDuration = 2; // Duration in seconds for easing

    // Fast initial movement
    gsap.to(camera.position, {
        x: position.x,
        y: position.y,
        z: position.z,
        duration: easeDuration,
        onUpdate: function () {
            camera.updateProjectionMatrix();
        }
    });

    gsap.to(camera.rotation, {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
        duration: easeDuration,
        ease: Power1.easeInOut,
        onUpdate: function () {
            camera.updateProjectionMatrix();
        }
    });

    // Hide all clickable points during the transition
    clickablePoints.forEach(point => {
        point.visible = false;
    });

    // Show points again after the transition completes
    gsap.delayedCall(easeDuration, () => {
        clickablePoints.forEach(point => {
            point.visible = true;
        });
    });

    // Move camera right after reaching the position
    gsap.delayedCall(easeDuration + 0.5, () => {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        const rightVector = new THREE.Vector3();
        rightVector.crossVectors(forward, camera.up);

        gsap.to(camera.position, {
            x: camera.position.x + rightVector.x * 5,
            y: camera.position.y + rightVector.y * 5,
            z: camera.position.z + rightVector.z * 5,
            duration: rightMoveDuration,
            onUpdate: function () {
                camera.updateProjectionMatrix();
            }
        });
    });
}

// Array to store clickable points
const clickablePoints = [];

// Function to add clickable points to the scene
function addClickablePoints() {
    const points = [
        { position: new THREE.Vector3(29, 8.4, -11), label: 'Living Room' },
        { position: new THREE.Vector3(19, 25, -6), label: 'Rooftop Room' },
        { position: new THREE.Vector3(6, 10.5, 29), label: 'Balcony' },
        { position: new THREE.Vector3(35, 4.5, 18), label: 'Front' },
        { position: new THREE.Vector3(-25, 11, -24), label: 'Back' }
    ];

    points.forEach(point => {
        const geometry = new THREE.SphereGeometry(0.8, 16, 16); // Smaller size
        const material = new THREE.MeshBasicMaterial({ color: 0xfffdd0 }); // Cream white color
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(point.position);
        scene.add(sphere);

        sphere.userData = { label: point.label, position: point.position };
        clickablePoints.push(sphere);
    });
}

// Handle mouse click
function onDocumentMouseClick(event) {
    event.preventDefault();
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(clickablePoints);
    if (intersects.length > 0) {
        const point = intersects[0].object.userData.position;
        moveCamera(point, { x: 0, y: 0, z: 0 }); // Change rotation as needed
    }
}

document.addEventListener('click', onDocumentMouseClick, false);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Update controls
    renderer.render(scene, camera);
}

animate();

// Adjust canvas size when the window is resized
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Toggle sidebar visibility
let sidebarVisible = false;
document.getElementById('toggleSidebar').addEventListener('click', function () {
    sidebarVisible = !sidebarVisible;
    document.getElementById('sidebar').style.display = sidebarVisible ? 'block' : 'none';
});

// Event listeners for sidebar buttons
document.getElementById('livingRoomButton').addEventListener('click', function () {
    moveCamera({ x: 29, y: 8.4, z: -11 }, { x: -2.47, y: 1.1, z: 2.52 });
});

document.getElementById('rooftopButton').addEventListener('click', function () {
    moveCamera({ x: 19, y: 25, z: -6 }, { x: -1.16, y: 0.5, z: 0.91 });
});

document.getElementById('balconyButton').addEventListener('click', function () {
    moveCamera({ x: 6, y: 10.5, z: 29 }, { x: -0.34, y: 0.2, z: 0.06 });
});

document.getElementById('frontButton').addEventListener('click', function () {
    moveCamera({ x: 35, y: 4.5, z: 18 }, { x: -0.25, y: 1.1, z: 0.22 });
});

document.getElementById('backButton').addEventListener('click', function () {
    moveCamera({ x: -25, y: 11, z: -24 }, { x: -1.52, y: 1.1, z: -2.52 });
});

