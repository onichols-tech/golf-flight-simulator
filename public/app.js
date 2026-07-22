/**
 * Main Application Controller
 * Coordinates between UI, physics, and visualization
 */

class GolfFlightSimulatorApp {
  constructor() {
    this.simulator = new GolfSimulator();
    this.visualization = new GolfVisualization('canvas-container');
    this.currentResults = null;
    this.isSimulating = false;

    this.initEventListeners();
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    document.getElementById('simulateBtn').addEventListener('click', () => this.simulateAndAnimate());
    document.getElementById('simulateNoAnimBtn').addEventListener('click', () => this.simulateOnly());
    document.getElementById('resetBtn').addEventListener('click', () => this.reset());
  }

  /**
   * Get all parameters from UI
   */
  getParameters() {
    return {
      verticalLaunchAngle: parseFloat(document.getElementById('verticalAngle').value),
      horizontalLaunchAngle: parseFloat(document.getElementById('horizontalAngle').value),
      launchVelocity: parseFloat(document.getElementById('launchVelocity').value),
      backspin: parseFloat(document.getElementById('backspin').value),
      spinAxis: parseFloat(document.getElementById('spinAxis').value),
      windSpeed: parseFloat(document.getElementById('windSpeed').value),
      windDirection: parseFloat(document.getElementById('windDirection').value),
      temperatureF: parseFloat(document.getElementById('temperature').value),
      humidity: parseFloat(document.getElementById('humidity').value),
      airPressure: parseFloat(document.getElementById('airPressure').value)
    };
  }

  /**
   * Simulate and show animation
   */
  async simulateAndAnimate() {
    this.isSimulating = true;
    this.disableControls(true);
    this.updateStatus('Simulating flight path...');

    try {
      const parameters = this.getParameters();
      const results = this.simulator.simulate(parameters);

      if (!results) {
        this.updateStatus('Simulation failed. Check parameters.');
        this.isSimulating = false;
        this.disableControls(false);
        return;
      }

      this.currentResults = results;
      this.displayResults(results);
      this.visualization.displayTrajectory(results.trajectory);

      // Add small delay before animation
      await new Promise(resolve => setTimeout(resolve, 100));

      this.updateStatus('Animating flight...');
      const duration = parseFloat(results.hangTime);
      this.visualization.animateFlight(results.trajectory, Math.min(duration, 15));

      // Wait for animation to complete
      await this.waitForAnimationComplete();
      this.updateStatus('Simulation complete');
    } catch (error) {
      console.error('Simulation error:', error);
      this.updateStatus('Error: ' + error.message);
    } finally {
      this.isSimulating = false;
      this.disableControls(false);
    }
  }

  /**
   * Simulate without animation
   */
  async simulateOnly() {
    this.isSimulating = true;
    this.disableControls(true);
    this.updateStatus('Simulating flight path...');

    try {
      const parameters = this.getParameters();
      const results = this.simulator.simulate(parameters);

      if (!results) {
        this.updateStatus('Simulation failed. Check parameters.');
        this.isSimulating = false;
        this.disableControls(false);
        return;
      }

      this.currentResults = results;
      this.displayResults(results);
      this.visualization.displayTrajectory(results.trajectory);
      this.updateStatus('Simulation complete (no animation)');
    } catch (error) {
      console.error('Simulation error:', error);
      this.updateStatus('Error: ' + error.message);
    } finally {
      this.isSimulating = false;
      this.disableControls(false);
    }
  }

  /**
   * Display results in UI
   */
  displayResults(results) {
    document.getElementById('carryDistance').textContent = results.carryDistance + ' yds';
    document.getElementById('totalDistance').textContent = results.totalDistance + ' yds';
    document.getElementById('hangTime').textContent = results.hangTime + ' s';
    document.getElementById('maxHeight').textContent = results.maxHeight + ' yds';
    document.getElementById('offCenter').textContent = results.offCenter + ' yds';
    document.getElementById('landingAngle').textContent = results.landingAngle + '°';

    this.updateShotHistory();
  }

  /**
   * Update shot history display
   */
  updateShotHistory() {
    const history = this.simulator.getHistory();
    const historyContainer = document.getElementById('shotHistory');

    if (history.length === 0) {
      historyContainer.innerHTML = '<p class="empty-state">No shots recorded yet</p>';
      return;
    }

    let html = '';
    for (let i = 0; i < history.length; i++) {
      const shot = history[i];
      const time = new Date(shot.timestamp).toLocaleTimeString();
      const params = shot.parameters;

      html += `
        <div class="shot-history-item">
          <strong>Shot #${i + 1} - ${time}</strong>
          <div>Distance: ${shot.results.carryDistance} yds | Max Height: ${shot.results.maxHeight} yds</div>
          <div>Launch: ${params.launchVelocity} mph @ ${params.verticalLaunchAngle}° | Spin: ${params.backspin} rpm</div>
        </div>
      `;
    }

    historyContainer.innerHTML = html;
  }

  /**
   * Reset simulation
   */
  reset() {
    this.visualization.stopAnimation();
    this.visualization.clearScene();
    this.visualization.resetView();

    // Reset input values to defaults
    document.getElementById('verticalAngle').value = 25;
    document.getElementById('horizontalAngle').value = 0;
    document.getElementById('launchVelocity').value = 120;
    document.getElementById('backspin').value = 2500;
    document.getElementById('spinAxis').value = 0;
    document.getElementById('windSpeed').value = 0;
    document.getElementById('windDirection').value = 0;
    document.getElementById('temperature').value = 72;
    document.getElementById('humidity').value = 50;
    document.getElementById('airPressure').value = 29.92;

    // Clear results
    document.getElementById('carryDistance').textContent = '-';
    document.getElementById('totalDistance').textContent = '-';
    document.getElementById('hangTime').textContent = '-';
    document.getElementById('maxHeight').textContent = '-';
    document.getElementById('offCenter').textContent = '-';
    document.getElementById('landingAngle').textContent = '-';

    this.currentResults = null;
    this.updateStatus('Ready');
  }

  /**
   * Update status message
   */
  updateStatus(message) {
    document.getElementById('status').textContent = message;
  }

  /**
   * Disable/enable controls during simulation
   */
  disableControls(disable) {
    document.getElementById('simulateBtn').disabled = disable;
    document.getElementById('simulateNoAnimBtn').disabled = disable;
    document.getElementById('resetBtn').disabled = disable;

    // Disable input fields
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => input.disabled = disable);
  }

  /**
   * Wait for animation to complete
   */
  waitForAnimationComplete() {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!this.visualization.isAnimating) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new GolfFlightSimulatorApp();
});
