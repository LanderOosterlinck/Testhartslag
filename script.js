class HeartRateMonitor {
  constructor(name, characterid) {
    //Service ID for Heart Rate class devices
    //https://www.bluetooth.com/specifications/gatt/services/
    this.SERVICE_ID = 0x180D;
    //Char id for Heart Rate Measurement
    //https://www.bluetooth.com/specifications/gatt/characteristics/
    this.CHARACTERISTIC_ID = 0x2A37;
 
    this.hrElement_ = document.getElementById('hr');
    this.avgElement_ = document.getElementById('avg');
    this.name = name;
    this.characterid = characterid;
 
    this.score_ = 0;
    this.MHR_ = 140;
    this.hasProperReading_ = false;
 
    this.gameid_ = 0;
    this.LowestHR_ = 0;
    this.HighestHR_ = 0;
 
    this.CdcHighest_ = 0;
    this.CdcAim_ = 0;
    this.playerStillPlaying_ = true;
    this.resetEverything_();
  }
 
  computeAverage_() {
    if (this.timeSum_ > 0) {
      let avg = this.hrSum_ / ((this.timeSum_) * 2);
      return avg.toFixed(1);
    }
    return '0.0';
  }
 
  resetEverything_() {
    this.lastTick_ = 0;
    this.lastHr_ = 0;
    this.hrSum_ = 0;
    this.timeSum_ = 0;
 
    this.RHR_ = 0;
    this.HRR_ = 0;
 
    this.hasProperReading_ = false;
  }
 
  setCdcValues_() {
    this.CdcHighest_ = this.lastHr_;
    this.CdcAim_ = this.CdcHighest_ - 20 ;
    console.log(this.CdcAim_);
}
 
 
  setHRR_() {
    this.RHR_ = this.lastHr_;
    this.HRR_ = (140 - this.RHR_);
  }
 
  parseHeartRate_(data) {
    let flags = data.getUint8(0);
    if (flags & 0x1) {
      return data.getUint16(1, true);
    }
    return data.getUint8(1);
  }
 
  onHeartRateChanged_(event) {
    let dataView = event.target.value;
    let tick = (new Date()).getTime();
    let hr = this.parseHeartRate_(dataView);
 
    // Ignore readings where the HR or last HR value is 0 - treat this as a
    // failed reading from the sensor.
    if (this.lastTick_ && hr && this.lastHr_) {
      this.hrSum_ += (tick - this.lastTick_) * (hr + this.lastHr_);
      this.timeSum_ += tick - this.lastTick_;
    }
    this.lastTick_ = tick;
    this.lastHr_ = hr;
    this.HRPCT_ = Math.floor((hr - this.RHR_) / (this.HRR_) * 100);
 
    if (this.hasProperReading_ == false && hr != 0) {
      validUser();
      this.hasProperReading_ = true;
    }
 
 
  }
 
  handleCharacteristic_(characteristic) {
    characteristic.addEventListener('characteristicvaluechanged',
      event => this.onHeartRateChanged_(event));
    return characteristic.startNotifications();
  }
 
  start() {
    this.resetEverything_();
    let options = {
      filters: [{
        //Only show devices that are classified as Heart Rate Sensors
        services: [this.SERVICE_ID]
      }]
    };
    navigator.bluetooth.requestDevice(options)
      .then(device => {
        return device.gatt.connect();
      })
      .then(server => {
        return server.getPrimaryService(this.SERVICE_ID);
      })
      .then(service => {
        return service.getCharacteristic(this.CHARACTERISTIC_ID);
      })
      .then(characteristic => this.handleCharacteristic_(characteristic))
      .catch(error => {
        console.log('Error: ' + error);
        deleteInvalidUser();
      });
  }
 
}
