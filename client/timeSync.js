class timeSync {
  constructor() {
    //this.estimatedServerTime;
    this.serverTimeTicks = 0;
    this.averagedDelta = 0;

    this.simulationStartLocal;
    this.simulationStartServer;
    this.simulationDelta;
  }

  serverTick(t) {
    // Expontential weighted moving average 
    // https://stackoverflow.com/questions/12636613/how-to-calculate-moving-average-without-keeping-the-count-and-data-total
    this.serverTimeTicks++;
    const local = new Date().getTime();
    const delta = t - local;
    this.averagedDelta = this.averagedDelta + (delta - this.averagedDelta) / Math.min(this.serverTimeTicks, 1000);

    const deltaDelta = this.simulationDelta - this.averagedDelta;

    if (this.simulationStartTime === undefined) {
      this.simulationStartLocal = local;
      this.simulationStartServer = t;
      this.simulationDelta = delta;
    } else if (Math.abs(deltaDelta) > 10) {
      // We want to adjust our startLocal time to kinda match the average ping... so that actions appear to be smooth locally
      this.simulationDelta = this.averagedDelta;
      this.simulationStartLocal = this.simulationStartLocal + deltaDelta;
    }
  }
}
export default timeSync;
