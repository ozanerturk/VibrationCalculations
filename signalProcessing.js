
define(function () {
  return function buildSignalProcessing({ tf }) {
    return Object.freeze({
      Grms,
      Grms_score,
      Grms_range_score,
      Vrms,
      Vrms_score,
      Vrms_range_score,
      generateWindow,
      getCorrectionCoefficient,
      Kurtosis,
      Crest,
      Crest_star,
      Skewness,
      Clearance
  
    })
    function freqToindex(freq, sampleSize, samplingRate) {
      return Math.ceil(sampleSize * freq / samplingRate)
    }
  
    function Clearance(data) {
      if (!data.length) return 0;
      let t_signal = tf.tensor1d(data, "float32");
  
      let clearance = t_signal.abs().max().div(t_signal.abs().sqrt(2).sum().div(t_signal.size).pow(2));
      return clearance.dataSync()[0]
    }
  
    function Crest(data) {
      if (!data.length) return 0;
      let t_signal = tf.tensor1d(data, "float32");
  
      let peek = t_signal.abs().max().dataSync()[0];
      let grms = Grms_score(data)
  
      return peek / grms;
    }
    function Skewness(data) {
      if (!data.length) return 0;
      let t_signal = tf.tensor1d(data, "float32");
      let tAvg = t_signal.mean();
      let res = t_signal.sub(tAvg).pow(3).sum().div(t_signal.size).div(t_signal.sub(tAvg).pow(2).sum().div(t_signal.size).pow(1.5))
      return res.dataSync()[0]
    }
    function Kurtosis(data) {
      if (!data.length) return 0;
      let t_signal = tf.tensor1d(data, "float32");
      let tAvg = t_signal.mean();
      let res = t_signal.sub(tAvg).pow(4).sum().div(t_signal.size).div(t_signal.sub(tAvg).pow(2).sum().div(t_signal.size).pow(2))
      return res.dataSync()[0]
    }
    function Grms_score(data) {
      if (!data.length) return 0;
      var fft = Grms(data)
      fft = fft.slice(1, parseInt(fft.length / 2) + 1);
      let t_rms = tf.tensor1d(fft, "float32");
      let grms_score = Math.sqrt(t_rms.pow(2).sum().dataSync())
      return grms_score;
    }
    function highpass(signal,samplingRate,threshold) {
      threshold = threshold || 1000
      if (samplingRate < 3_000) {
        console.log("sampling rate should be greater than 3000Hz, actual:", samplingRate)
        return null
      }
      let t_signal = tf.tensor1d(signal, "float32")
      let t_sign = tf.sign(t_signal)// fazı kaydediyorum ilerde kullanacağım
  
      let t_imag = tf.zerosLike(t_signal)
      let t_complex = tf.complex(t_signal, t_imag)
  
      var t_fft = t_complex.fft() //FFT aldım complex' tensör
      // 1000Hz'nin başlangıç indexini buluyorum
      let frequency_index = freqToindex(threshold, signal.length, samplingRate)
  
      let t_zeros = tf.zeros([frequency_index]) //nyquist olduğu için baştan ve sondan bu kadar kırpacağım
      let t_ones = tf.ones([signal.length - (2 * frequency_index)]) // baştan ve sondan kırptığım kısım harici kadar duracak
      let t_filter = tf.concat([t_zeros, t_ones, t_zeros])///000001111110000 şeklinde maske oluşturuyorum
      let t_filtered = t_fft.mul(t_filter) //maskeyi uyguluyorum
      let t_filtered_signal = tf.ifft(t_filtered);
  
      let t_abs = t_filtered_signal.abs()
      let t_rebuilded_signal = t_abs.mul(t_sign);
  
      return t_rebuilded_signal.arraySync();
    }
    function Crest_star(data,samplingRate) {
      if(!samplingRate)return null;
      if (!data.length) return null;
      let highpass_signal = highpass(data,samplingRate)
      let t_signal = tf.tensor1d(highpass_signal, "float32");
      let a1 = 1, a2 = 1, a3 = 1;
      let peek = t_signal.abs().max().dataSync()[0];
      let grms = Grms_score(data)
      return a1 * peek + a2 * grms + a3 * (peek / grms);
    }
    function Vrms_range_score(data, min, max, frequency) {
      if(!frequency)return null;
      if (!data.length) return 0;
      var fft = Vrms(data, frequency).slice(min, max)
      fft = fft.slice(1, parseInt(fft.length / 2 + 1));
      let t_rms = tf.tensor1d(fft, "float32");
      let vrms_score = Math.sqrt(t_rms.pow(2).sum().dataSync())
      return vrms_score;
    }
    function Grms_range_score(data, min, max) {
  
      if (!data.length) return 0;
      var fft = Grms(data).slice(min, max)
      fft = fft.slice(1, parseInt(fft.length / 2 + 1));
      let t_rms = tf.tensor1d(fft, "float32");
      let grms_score = Math.sqrt(t_rms.pow(2).sum().dataSync())
      return grms_score;
    }
    function Vrms_score(data, frequency) {
  
      if (!data.length) return 0;
      var fft = Vrms(data, frequency)
      fft = fft.slice(1, parseInt(fft.length / 2 + 1));
      let t_rms = tf.tensor1d(fft, "float32");
      let vrms_score = Math.sqrt(t_rms.pow(2).sum().dataSync())
  
      return vrms_score;
    }
    function Vrms(data, frequency, window) {
      let t_signal = tf.tensor1d(data, "float32");
      t_signal = tf.mul(t_signal, tf.scalar(9806.65))
  
      if (window) {
        var windowArray = generateWindow(
          window,
          data.length
        );
        var correctionCoefficient = getCorrectionCoefficient(
          window,
          "amplitude"
        );
  
        var tWindow = tf.tensor1d(windowArray, "float32");
        var tCorrectionCoefficient = tf.scalar(correctionCoefficient);
        t_signal = t_signal.mul(tWindow);
        t_signal = t_signal.mul(tCorrectionCoefficient);
      }
  
      let t_imag = tf.zeros(t_signal.shape)
      let t_complex = tf.complex(t_signal, t_imag)
  
      var fft = t_complex.fft()
      var t_mag = tf.abs(fft)
      let t_omega = tf.linspace(0, 2 * Math.PI * frequency, data.length)
      let t_vrms = tf.div(t_mag, t_omega)
  
      var multiplier = tf.scalar(Math.sqrt(2) / data.length);
      t_vrms = tf.mul(t_vrms, multiplier);
      let vrms = t_vrms.arraySync()
      let Hz3_index = freqToindex(3, vrms.length, frequency)
      for (var i = 0; i <= Hz3_index; i++) {
        vrms[i] = 0;
      }
      return vrms;
    }
    function Grms(data, window) {
  
      let t_signal = tf.tensor1d(data, "float32");
  
      if (window) {
        var windowArray = generateWindow(
          window,
          data.length
        );
        var correctionCoefficient = getCorrectionCoefficient(
          window,
          "amplitude"
        );
        var tWindow = tf.tensor1d(windowArray, "float32");
        var tCorrectionCoefficient = tf.scalar(correctionCoefficient);
        t_signal = t_signal.mul(tWindow);
        t_signal = t_signal.mul(tCorrectionCoefficient);
      }
  
      // FFT GRMS
      // var sampleSize = data.length
      let t_imag = tf.zeros(t_signal.shape)
      let t_complex = tf.complex(t_signal, t_imag)
  
      var fft = t_complex.fft()
      var t_mag = tf.abs(fft)
      var multiplier = tf.scalar(Math.sqrt(2) / data.length);
      fft = tf.mul(t_mag, multiplier);
      return fft.arraySync();
    }
    function getCorrectionCoefficient(windowType, correctionType) {
      let correctionCoefficient = 1
      switch (windowType) {
        case 'hanning': // Hanning window
          correctionCoefficient = correctionType === 'amplitude' ? 2.0 : 1.63
          break
        case 'hamming': // Hamming window
          correctionCoefficient = correctionType === 'amplitude' ? 1.85 : 1.59
          break
        case 'blackman': // Blackman window
          correctionCoefficient = correctionType === 'amplitude' ? 2.80 : 1.97
          break
        case 'flattop':
          correctionCoefficient = correctionType === 'amplitude' ? 4.18 : 2.26
          break
        default: // Rectangular window function
          correctionCoefficient = 1
      }
      return correctionCoefficient
    }
    function generateWindow(windowType, nSamples) {
      // generate nSamples window function values
      // for index values 0 .. nSamples - 1
      let m = nSamples / 2
      let r
      let pi = Math.PI
      let w = new Array(nSamples)
      switch (windowType) {
        case 'bartlett': // Bartlett (triangular) window
          for (let n = 0; n < nSamples; n++) {
            w[n] = 1.0 - Math.abs(n - m) / m
          }
          break
        case 'hanning': // Hanning window
          r = pi / (m + 1)
          for (let n = -m; n < m; n++) {
            w[m + n] = 0.5 + 0.5 * Math.cos(n * r)
          }
          break
        case 'hamming': // Hamming window
          r = pi / m
          for (let n = -m; n < m; n++) {
            w[m + n] = 0.54 + 0.46 * Math.cos(n * r)
          }
          break
        case 'blackman': // Blackman window
          r = pi / m
          for (let n = -m; n < m; n++) {
            w[m + n] = 0.42 + 0.5 * Math.cos(n * r) + 0.08 * Math.cos(2 * n * r)
          }
          break
        case 'flattop':
          for (let n = 0; n < nSamples; n++) {
            w[n] = 0.21557895 - 0.41663158 * Math.cos((2 * Math.PI * n) / nSamples) + 0.277263158 * Math.cos((4 * Math.PI * n) / nSamples) - 0.083578947 * Math.cos((6 * Math.PI * n) / nSamples)
          }
          break
        default: // Rectangular window function
          for (let n = 0; n < nSamples; n++) {
            w[n] = 1.0
          }
      }
      return w
    }
  }
});