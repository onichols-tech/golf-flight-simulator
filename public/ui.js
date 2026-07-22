/**
 * UI Manager for Golf Flight Simulator
 * Handles 3D visualization and animation
 */

class GolfVisualization {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.ballGroup = null;
    this.trajectory = null;
    this.animationId = null;
    this.isAnimating = false;

    this.initThreeJS();
  }

  /**
   * Initialize Three.js scene
   */
  initThreeJS() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 500, 1000);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    this.camera.position.set(100, 80, 100);
    this.camera.lookAt(150, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(200, 300, 200);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.far = 1000;
    sunLight.shadow.camera.left = -500;
    sunLight.shadow.camera.right = 500;
    sunLight.shadow.camera.top = 500;
    sunLight.shadow.camera.bottom = -500;
    this.scene.add(sunLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Fairway markers
    this.addFairwayMarkers();

    // Ball group
    this.ballGroup = new THREE.Group();
    this.scene.add(this.ballGroup);

    // Start animation loop
    this.animate();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Add fairway distance markers
   */
  addFairwayMarkers() {
    const distances = [50, 100, 150, 200, 250, 300];
    
    distances.forEach(distance => {
      const metersDistance = distance / 1.09361; // convert yards to meters
      
      // Marker pole
      const poleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
      const poleMaterial = new THREE.MeshPhongMaterial({ color: 0xff6b6b });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(metersDistance, 2.5, 0);
      pole.castShadow = true;
      this.scene.add(pole);

      // Marker flag
      const flagGeometry = new THREE.PlaneGeometry(10, 8);
      const flagMaterial = new THREE.MeshPhongMaterial({ color: 0xffeb3b });
      const flag = new THREE.Mesh(flagGeometry, flagMaterial);
      flag.position.set(metersDistance + 5, 7, 0);
      flag.castShadow = true;
      this.scene.add(flag);

      // Label (would need canvas texture)
    });
  }

  /**
   * Display trajectory
   */
  displayTrajectory(trajectoryData) {
    // Clear previous trajectory
    while (this.ballGroup.children.length > 0) {
      this.ballGroup.remove(this.ballGroup.children[0]);
    }

    // Draw trajectory line
    const linePoints = trajectoryData.map(point => 
      new THREE.Vector3(point.x, point.y, point.z)
    );

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.ballGroup.add(line);

    // Draw ball positions along trajectory
    const spacing = Math.floor(trajectoryData.length / 20); // ~20 ball positions
    for (let i = 0; i < trajectoryData.length; i += spacing) {
      const point = trajectoryData[i];
      const sphere = this.createGolfBall();
      sphere.position.set(point.x, point.y, point.z);
      sphere.scale.set(0.3, 0.3, 0.3);
      sphere.material.opacity = 0.3 + (i / trajectoryData.length) * 0.7;
      this.ballGroup.add(sphere);
    }

    // Draw landing position
    const landingPoint = trajectoryData[trajectoryData.length - 1];
    const landingMarker = new THREE.Mesh(
      new THREE.SphereGeometry(3, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0x00ff00, opacity: 0.5 })
    );
    landingMarker.position.set(landingPoint.x, 0.5, landingPoint.z);
    this.ballGroup.add(landingMarker);

    this.trajectory = trajectoryData;
  }

  /**
   * Create golf ball mesh
   */
  createGolfBall() {
    const geometry = new THREE.SphereGeometry(1.07, 32, 32); // golf ball diameter ~1.68 inches
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 100,
      side: THREE.DoubleSide
    });
    const ball = new THREE.Mesh(geometry, material);
    ball.castShadow = true;
    ball.receiveShadow = true;
    return ball;
  }

  /**
   * Animate ball flight
   */
  animateFlight(trajectoryData, duration = 5) {
    this.isAnimating = true;
    let startTime = Date.now();

    // Clear previous elements except trajectory line
    const children = [...this.ballGroup.children];
    children.forEach(child => {
      if (child instanceof THREE.Line) return; // keep trajectory line
      this.ballGroup.remove(child);
    });

    // Create animated ball
    const ball = this.createGolfBall();
    ball.scale.set(1, 1, 1);
    this.ballGroup.add(ball);

    const animateFrame = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000; // in seconds
      const progress = Math.min(elapsed / duration, 1);

      const trajectoryIndex = Math.floor(progress * (trajectoryData.length - 1));
      const point = trajectoryData[trajectoryIndex];

      ball.position.set(point.x, point.y, point.z);

      // Rotate ball
      ball.rotation.x += 0.1;
      ball.rotation.y += 0.15;

      // Follow camera
      this.camera.position.x = point.x - 50;
      this.camera.position.y = point.y + 30;
      this.camera.position.z = point.z + 50;
      this.camera.lookAt(point.x, point.y, point.z);

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animateFrame);
      } else {
        this.isAnimating = false;
        // Return camera to overview
        this.resetView();
      }
    };

    animateFrame();
  }

  /**
   * Stop animation
   */
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isAnimating = false;
  }

  /**
   * Reset camera view
   */
  resetView() {
    this.camera.position.set(100, 80, 100);
    this.camera.lookAt(150, 0, 0);
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Main animation loop
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Clear scene
   */
  clearScene() {
    while (this.ballGroup.children.length > 0) {
      this.ballGroup.remove(this.ballGroup.children[0]);
    }
    this.trajectory = null;
  }
}
