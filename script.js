'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  id = Date.now();
  date = new Date();
  constructor(lat, lng, distance, duration) {
    this.lat = lat;
    this.lng = lng;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    //prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    //prettier-ignore
    this.description = `${this.type[0].toUpperCase() + this.type.slice(1).toLowerCase()} on ${months[new Date().getMonth()]} ${new Date().getDate()}`;
    console.log(this.description);
  }
}

class Running extends Workout {
  type = 'running';
  constructor(lat, lng, distance, duration, cadence) {
    super(lat, lng, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / (this.distance / 60); // min/km/h
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(lat, lng, distance, duration, elevationGain) {
    super(lat, lng, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60); //km/h
    return this.speed;
  }
}

const John = new Cycling(12, 5, 25, -1, 20);

// THE APP
class App {
  #map;
  #mapE;
  #workouts = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function (err) {
          return console.log(
            err,
            'We could not get your location. Kindly give us permission to access your location.'
          );
        }
      );
  }

  _loadMap(position) {
    const { latitude = 51.5549, longitude = 0.1084 } = position.coords ?? {};
    console.log(latitude, longitude);

    console.log(
      '🚀 ~ file: script.js:93 ~ App ~ _loadMap ~ position:',
      position
    );

    this.#map = L.map('map').setView([latitude, longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    console.log(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    if (!this.#workouts) return;
    this.#workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    });
  }

  _showForm(e) {
    //get map event
    this.#mapE = e;

    //render form
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleElevationField() {
    //Input type toggle for running and cycling
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    e.preventDefault();
    const { lat, lng } = this.#mapE.latlng;
    console.log(lat, lng);

    //get values
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const cadence = +inputCadence.value;
    const elevationGain = +inputElevation.value;
    let workout;

    //check input validity: finite numbers & Greater than zero
    const validInput = (...inputs) => {
      console.log(...inputs);
      return inputs.every(input => Number.isFinite(input) && input > 0); //We'll come sort the conditions later
    };

    //validate input for running and create new workout object !
    if (type === 'running') {
      if (!validInput(duration, distance, cadence))
        return alert('Every field must contain a positive number');
      //create a new cycling workout object

      workout = new Running(lat, lng, distance, duration, cadence);
      console.log(workout.type);
    }

    //validate input for cycling and create new workout object (elevationGain can take a negative number)
    if (type === 'cycling') {
      if (!validInput(duration, distance, elevationGain))
        return alert('Every field must contain a positive number');
      // create new workout instance

      workout = new Cycling(lat, lng, distance, duration, elevationGain);
      console.log(workout.type);
    }

    //push to the workout array
    this.#workouts.push(workout);

    ////Render workout marker on the map (with PopUp)
    this._renderWorkoutMarker(workout);

    ////Render workout on the workout list
    this._renderWorkout(workout);

    //Save workouts array to localStorage
    this._setLocalStorage();

    //clear input fields
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        '';

    form.classList.add('hidden');
  }

  _renderWorkoutMarker(workout) {
    L.marker([workout.lat, workout.lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 150,
          closeOnClick: false,
          autoClose: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${
          workout.type[0].toUpperCase() + workout.type.slice(1).toLowerCase()
        } drill`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              (workout.type === 'running' && '🏃') ||
              (workout.type === 'cycling' && '🚴🏼‍♂️')
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;
    }

    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
               <span class="workout__icon">⚡️</span>
               <span class="workout__value">${workout.speed.toFixed(1)}</span>
               <span class="workout__unit">min/km</span>
             </div>
             <div class="workout__details">
               <span class="workout__icon">⛰</span>
               <span class="workout__value">${workout.elevationGain}</span>
               <span class="workout__unit">spm</span>
             </div>
           </li>
           `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const clickedWorkout = e.target.closest('.workout');
    if (!clickedWorkout) return;
    const workout = this.#workouts.find(
      session => session.id === +clickedWorkout.dataset.id
    );
    console.log(workout);

    this.#map.setView([workout.lat, workout.lng], 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
    });
  }
}

const app = new App();

console.log('bean');
