let signalChartInstance = null;
let signalComponents = [];
let samplingRate;
let numberOfSamples;
let timeStep;
const arrayOfSamples = [];
const continuousSignal = [];

function readSignalComponents() {
  signalComponents = []; // wyzeruj starą zawartość

  // Ile składowych user wybrał?
  const num = parseInt(document.getElementById('numComponents').value, 10);

  for (let i = 1; i <= num; i++) {
    const freqInput = document.getElementById(`freq${i}`);
    const ampInput = document.getElementById(`amp${i}`);
    const phaseInput = document.getElementById(`phase${i}`);

    if (freqInput && ampInput && phaseInput) {
      const freq = parseFloat(freqInput.value);
      const amp = parseFloat(ampInput.value);
      const phase = parseFloat(phaseInput.value) * Math.PI;

      // Możesz dodać warunek: if (amp !== 0 && freq !== 0) ...
      // albo zawsze pchać do tablicy
      signalComponents.push({ freq, amp, phase });
    }
  }
}
function createComponentsInputs() {
  const container = document.getElementById('componentsContainer');
  container.innerHTML = '';

  const num = parseInt(document.getElementById('numComponents').value, 10);
  if (num < 1 || num > 10) {
    return;
  }

  for (let i = 1; i <= num; i++) {
    const componentSection = document.createElement('div');
    componentSection.style.border = '1px solid #ccc';
    componentSection.style.padding = '8px';
    componentSection.style.margin = '8px 0';

    const header = document.createElement('h5');
    header.textContent = `Parametry składowej nr ${i}`;
    componentSection.appendChild(header);

    // freq
    const freqLabel = document.createElement('label');
    freqLabel.textContent = 'Częstotliwość [Hz]: ';
    const freqInput = document.createElement('input');
    freqInput.type = 'number';
    freqInput.id = `freq${i}`;
    freqInput.value = i === 1 ? '50' : '0';
    freqInput.step = '50';

    // amp
    const ampLabel = document.createElement('label');
    ampLabel.textContent = ' Amplituda: ';
    const ampInput = document.createElement('input');
    ampInput.type = 'number';
    ampInput.id = `amp${i}`;
    ampInput.value = i === 1 ? '1' : '0';
    ampInput.step = '0.1';

    const phaseLabel = document.createElement('label');
    phaseLabel.textContent = ' Przesunięcie fazowe (wielokrotność π): ';
    const phaseInput = document.createElement('input');
    phaseInput.type = 'number';
    phaseInput.id = `phase${i}`;
    phaseInput.value = '0';
    phaseInput.step = '0.01';

    componentSection.appendChild(freqLabel);
    componentSection.appendChild(freqInput);
    componentSection.appendChild(ampLabel);
    componentSection.appendChild(ampInput);
    componentSection.appendChild(phaseLabel);
    componentSection.appendChild(phaseInput);

    container.appendChild(componentSection);
  }
}
function generateContinuousSignal() {
  continuousSignal.length = 0;
  // w pętli np. co 0.02
  for (let n = 0; n < numberOfSamples; n += 0.02) {
    const x = n / samplingRate;
    let y = 0;
    // sumujemy wszystkie składowe
    for (const comp of signalComponents) {
      y += comp.amp * Math.sin(2 * Math.PI * comp.freq * x + comp.phase);
    }
    continuousSignal.push({ x, y });
  }
}
function sampling() {
  arrayOfSamples.length = 0;
  for (let n = 0; n < numberOfSamples; n++) {
    const x = n / samplingRate;
    let y = 0;
    for (const comp of signalComponents) {
      y += comp.amp * Math.sin(2 * Math.PI * comp.freq * x + comp.phase);
    }
    arrayOfSamples.push({ x, y });
  }
}
function FFT(x) {
  const N = x.length;
  if (N <= 1) return x;
  const even = FFT(x.filter((_, index) => index % 2 === 0));
  const odd = FFT(x.filter((_, index) => index % 2 !== 0));
  const X = new Array(N).fill(math.complex(0, 0));
  for (let k = 0; k < N / 2; k++) {
    const twiddle = math.exp(math.complex(0, (-2 * Math.PI * k) / N));
    const evenValue = even[k] || math.complex(0, 0);
    const oddValue = odd[k] || math.complex(0, 0);
    displayPartialResults(
      `Twiddle factor for k=${k}: ${math.format(twiddle, {
        notation: 'fixed',
        precision: 4,
      })}`
    );
    X[k] = math.add(evenValue, math.multiply(twiddle, oddValue));
    X[k + N / 2] = math.subtract(evenValue, math.multiply(twiddle, oddValue));
    displayPartialResults(
      `FFT[k=${k}]: ${math.format(X[k], { notation: 'fixed', precision: 4 })}`
    );
    displayPartialResults(
      `FFT[k=${k + N / 2}]: ${math.format(X[k + N / 2], {
        notation: 'fixed',
        precision: 4,
      })}`
    );
  }
  return X;
}
function displayFFTResults(fftResults) {
  const resultsSection = document.getElementById('FFTresults');
  resultsSection.innerHTML = '<h4>Wyniki FFT</h4>';
  fftResults.forEach((result, index) => {
    const amplitude = (math.abs(result) * 2) / numberOfSamples;
    const frequency = (index * samplingRate) / numberOfSamples;
    const correctedAmplitude = index === 0 ? amplitude / 2 : amplitude;

    const listItem = document.createElement('li');
    listItem.textContent = `X(${index}) = ${math.format(result, {
      notation: 'fixed',
      precision: 4,
    })}`;
    resultsSection.appendChild(listItem);

    const componentDescription = document.createElement('p');
    componentDescription.textContent =
      `W badanym sygnale składowa o częstotliwości ${frequency.toFixed(
        2
      )} Hz ` + `ma amplitudę ${correctedAmplitude.toFixed(4)}`;
    resultsSection.appendChild(componentDescription);
  });
}
function displayPartialResults(message) {
  const resultsSection = document.getElementById('results');
  const listItem = document.createElement('li');
  listItem.textContent = message;
  resultsSection.appendChild(listItem);
}
function generateSignalAndSamplesChart(samples) {
  const ctx = document.getElementById('SignalAndSamples').getContext('2d');
  if (signalChartInstance) signalChartInstance.destroy();

  signalChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Signal',
          data: continuousSignal,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Samples',
          data: arrayOfSamples,
          borderColor: 'rgb(219, 56, 27)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          type: 'scatter',
          showLine: false,
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'Time (s)',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Amplitude',
          },
        },
      },
    },
  });
}
function checkIfPowerOfTwo(numberOfSamples) {
  if (numberOfSamples < 1) {
    alert('Number of samples must be > 0');
    return false;
  }
  if ((numberOfSamples & (numberOfSamples - 1)) === 0) {
    return true;
  } else {
    alert('Number of samples has to be a power of 2');
    return false;
  }
}
function checkIfValid(samplingRate, numberOfSamples) {
  const x = samplingRate / numberOfSamples;
  if (x % 12.5 !== 0) {
    alert(
      'Sampling rate divided by number of samples has to be a multiple of 12,5 Hz'
    );
    return false;
  }
  return true;
}
function showBarChar(fftResults, samplingRate, numberOfSamples) {
  const amplitudes = [];
  const frequencies = [];

  for (let k = 0; k < fftResults.length; k++) {
    const freq = (k * samplingRate) / numberOfSamples;
    const amp = math.abs(fftResults[k]);
    frequencies.push(freq);
    amplitudes.push(amp);
  }

  const maxAmp = Math.max(...amplitudes);
  const percentages = amplitudes.map((amp) => (amp / maxAmp) * 100);

  const ctx = document.getElementById('fftBarChart').getContext('2d');
  const labels = frequencies.map((f) => f.toFixed(2) + ' Hz');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Procentowa zawartość (%)',
          data: percentages,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Częstotliwość [Hz]' },
        },
        y: {
          title: { display: true, text: 'Zawartość procentowa [%]' },
          beginAtZero: true,
        },
      },
    },
  });
}
function FFTAlgorithm() {
  samplingRate = parseFloat(document.getElementById('samplingRate').value);
  numberOfSamples = parseInt(document.getElementById('numberOfSamples').value);

  if (
    checkIfPowerOfTwo(numberOfSamples) &&
    checkIfValid(samplingRate, numberOfSamples)
  ) {
    readSignalComponents();

    timeStep = 1 / samplingRate;
    generateContinuousSignal();
    sampling();

    generateSignalAndSamplesChart(arrayOfSamples, continuousSignal);

    const fftResults = FFT(
      arrayOfSamples.map((sample) => math.complex(sample.y, 0))
    );
    displayFFTResults(fftResults);

    showBarChar(fftResults, samplingRate, numberOfSamples);
  }
}
