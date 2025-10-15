(function(global) {
  'use strict';

  var SEASONS = ['spring', 'summer', 'autumn', 'winter'];
  var MINUTES_PER_TICK = 1;
  var DAYS_PER_SEASON = 30;

  var DEFAULT_CONFIG = {
    timeOfDay: [
      { slice: 'dawn', startHour: 5, endHour: 6 },
      { slice: 'day', startHour: 7, endHour: 18 },
      { slice: 'dusk', startHour: 19, endHour: 20 },
      { slice: 'night', startHour: 21, endHour: 4 }
    ],
    income: {
      default: { dawn: 1, day: 1, dusk: 0.9, night: 0.6 },
      perSource: {
        gatherer: { dawn: 1.1, day: 1, dusk: 0.8, night: 0.5 },
        hunter: { dusk: 0.9, night: 0.7 },
        trapper: { dawn: 1, day: 1, dusk: 0.95, night: 0.8 }
      }
    },
    encounters: {
      timeOfDay: { dawn: 1, day: 0.85, dusk: 1.1, night: 1.35 }
    },
    weather: {
      durations: {
        clear: [12, 36],
        rain: [10, 30],
        storm: [6, 20],
        fog: [8, 24],
        snow: [12, 36],
        blizzard: [6, 18],
        heatwave: [12, 30]
      },
      intensity: {
        clear: [0, 0.25],
        rain: [0.35, 0.85],
        storm: [0.6, 1],
        fog: [0.3, 0.7],
        snow: [0.4, 0.9],
        blizzard: [0.7, 1],
        heatwave: [0.5, 0.95]
      },
      transitions: {},
      income: {
        default: {
          clear: 1,
          rain: 0.95,
          storm: 0.7,
          fog: 0.9,
          snow: 0.8,
          blizzard: 0.5,
          heatwave: 0.85
        },
        perSource: {
          gatherer: { rain: 0.75, storm: 0.5, fog: 0.85, snow: 0.7, blizzard: 0.4, heatwave: 0.75 },
          hunter: { rain: 1.05, storm: 0.7, fog: 1.1, snow: 1.2, blizzard: 1.35, heatwave: 0.9 },
          trapper: { rain: 1.15, storm: 0.85, fog: 1.1, snow: 1, blizzard: 0.85, heatwave: 0.9 }
        }
      },
      encounters: {
        clear: 1,
        rain: 0.9,
        storm: 0.7,
        fog: 1.2,
        snow: 0.95,
        blizzard: 0.8,
        heatwave: 1.05
      }
    },
    shelter: {
      durationTicks: 12,
      penaltyReduction: 0.5
    }
  };

  var TIME_MESSAGES = {
    dawn: _('dawn breaks across the silent forest.'),
    day: _('sunlight stretches long shadows across the clearing.'),
    dusk: _('the sky burns orange as dusk settles in.'),
    night: _('night falls; distant shapes stir beyond the firelight.')
  };

  var WEATHER_MESSAGES = {
    clear: _('the clouds part, leaving a crisp and quiet sky.'),
    rain: _('rain patters steadily against the rooftops.'),
    storm: _('thunder rolls overhead as a storm sweeps in.'),
    fog: _('a heavy fog blankets the village in grey silence.'),
    snow: _('snow drifts down on a biting wind.'),
    blizzard: _('a blizzard howls through the settlement.'),
    heatwave: _('heat shimmers above the cracked earth.')
  };

  var TOD_ICONS = {
    dawn: '☀︎',
    day: '☀️',
    dusk: '🌇',
    night: '🌙'
  };

  var WEATHER_ICONS = {
    clear: '☀️',
    rain: '🌧️',
    storm: '⛈️',
    fog: '🌫️',
    snow: '🌨️',
    blizzard: '❄️',
    heatwave: '🔥'
  };

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clampHour(hour) {
    if (typeof hour !== 'number' || !isFinite(hour)) {
      return 0;
    }
    var normalized = Math.floor(hour) % 24;
    return normalized < 0 ? normalized + 24 : normalized;
  }

  function weightedPick(weights, rng) {
    var entries = Object.entries(weights || {}).filter(function(entry) {
      return typeof entry[1] === 'number' && entry[1] > 0;
    });
    if (entries.length === 0) {
      return null;
    }
    var total = entries.reduce(function(sum, entry) { return sum + entry[1]; }, 0);
    var roll = rng() * total;
    var cumulative = 0;
    for (var i = 0; i < entries.length; i++) {
      cumulative += entries[i][1];
      if (roll <= cumulative) {
        return entries[i][0];
      }
    }
    return entries[entries.length - 1][0];
  }

  function interpolateMultiplier(target, intensity) {
    if (typeof target !== 'number' || target === 1) {
      return 1;
    }
    var i = clamp(intensity, 0, 1);
    if (target > 1) {
      return 1 + (target - 1) * i;
    }
    return 1 - (1 - target) * i;
  }

  var TimeWeather = {
    _config: deepClone(DEFAULT_CONFIG),
    _timeRanges: [],
    _initialized: false,

    init: function() {
      this._applyConfig();
      this._ensureState();
      this._initialized = true;
      this._syncTimeSlice(true);
      this._loadConfig();
    },

    tick: function() {
      if (!this._initialized) {
        return;
      }
      this._advanceTime();
      this._advanceWeather();
    },

    getTimeOfDay: function() {
      return $SM.get('meta.time.tod', true) || 'dawn';
    },

    getFormattedTime: function() {
      var hour = $SM.get('meta.time.hour', true) || 0;
      var minute = $SM.get('meta.time.minute', true) || 0;
      var hh = hour.toString().padStart(2, '0');
      var mm = minute.toString().padStart(2, '0');
      return hh + ':' + mm;
    },

    getTimeOfDayIcon: function(tod) {
      var slice = tod || this.getTimeOfDay();
      return TOD_ICONS[slice] || '';
    },

    getWeatherKind: function() {
      return $SM.get('meta.weather.kind', true) || 'clear';
    },

    getWeatherIntensity: function() {
      var intensity = $SM.get('meta.weather.intensity', true);
      return typeof intensity === 'number' ? clamp(intensity, 0, 1) : 0;
    },

    getWeatherIcon: function(kind) {
      var weather = kind || this.getWeatherKind();
      return WEATHER_ICONS[weather] || '';
    },

    getIncomeMultiplierFor: function(source) {
      var tod = this.getTimeOfDay();
      var weatherKind = this.getWeatherKind();
      var intensity = this.getWeatherIntensity();
      var timeDefault = this._config.income && this._config.income.default && this._config.income.default[tod];
      var timeSource = this._config.income && this._config.income.perSource && this._config.income.perSource[source] && this._config.income.perSource[source][tod];
      var weatherDefault = this._config.weather && this._config.weather.income && this._config.weather.income.default && this._config.weather.income.default[weatherKind];
      var weatherSource = this._config.weather && this._config.weather.income && this._config.weather.income.perSource && this._config.weather.income.perSource[source] && this._config.weather.income.perSource[source][weatherKind];

      var multiplier = 1;
      if (typeof timeDefault === 'number') {
        multiplier *= timeDefault;
      }
      if (typeof timeSource === 'number') {
        multiplier *= timeSource;
      }

      var weatherMult = 1;
      if (typeof weatherDefault === 'number') {
        weatherMult *= interpolateMultiplier(weatherDefault, intensity);
      }
      if (typeof weatherSource === 'number') {
        weatherMult *= interpolateMultiplier(weatherSource, intensity);
      }

      multiplier *= weatherMult;
      return this._applyShelter(multiplier);
    },

    applyIncomeModifiers: function(source, stores) {
      var multiplier = this.getIncomeMultiplierFor(source);
      if (multiplier === 1) {
        return $.extend({}, stores);
      }
      var result = {};
      for (var key in stores) {
        if (!Object.prototype.hasOwnProperty.call(stores, key)) {
          continue;
        }
        result[key] = stores[key] * multiplier;
      }
      return result;
    },

    getEncounterChanceMultiplier: function() {
      var tod = this.getTimeOfDay();
      var weatherKind = this.getWeatherKind();
      var intensity = this.getWeatherIntensity();
      var timeWeight = this._config.encounters && this._config.encounters.timeOfDay && this._config.encounters.timeOfDay[tod];
      var weatherWeight = this._config.weather && this._config.weather.encounters && this._config.weather.encounters[weatherKind];
      var multiplier = 1;
      if (typeof timeWeight === 'number') {
        multiplier *= timeWeight;
      }
      if (typeof weatherWeight === 'number') {
        multiplier *= interpolateMultiplier(weatherWeight, intensity);
      }
      return multiplier;
    },

    isAdverseWeather: function() {
      return this.getWeatherKind() !== 'clear';
    },

    isShelterActive: function() {
      return ($SM.get('meta.weather.shelterTicksLeft', true) || 0) > 0;
    },

    getShelterTicksLeft: function() {
      return $SM.get('meta.weather.shelterTicksLeft', true) || 0;
    },

    activateShelter: function() {
      if (!this.isAdverseWeather() || this.isShelterActive()) {
        return false;
      }
      var duration = this._config.shelter && typeof this._config.shelter.durationTicks === 'number'
        ? Math.max(1, Math.floor(this._config.shelter.durationTicks))
        : 8;
      this._setMeta('meta.weather.shelterTicksLeft', duration);
      Notifications.notify(null, _('the villagers take shelter against the weather.'));
      return true;
    },

    _applyShelter: function(multiplier) {
      if (multiplier >= 1 || !this.isShelterActive()) {
        return multiplier;
      }
      var reduction = this._config.shelter && typeof this._config.shelter.penaltyReduction === 'number'
        ? clamp(this._config.shelter.penaltyReduction, 0, 1)
        : 0.5;
      return 1 - (1 - multiplier) * (1 - reduction);
    },

    _loadConfig: function() {
      var self = this;
      if (typeof $ === 'undefined' || typeof $.getJSON !== 'function') {
        return;
      }
      $.getJSON('config/time.json')
        .done(function(data) {
          self._config = $.extend(true, {}, self._config, data);
          self._applyConfig();
          self._syncTimeSlice(true);
          $SM.fireUpdate('meta.time');
          self._advanceWeather(true);
          $SM.fireUpdate('meta.weather');
        })
        .fail(function() {
          // Keep defaults silently on failure.
        });
    },

    _ensureState: function() {
      if (!$SM.get('meta')) {
        $SM.set('meta', {}, true);
      }
      if (!$SM.get('meta.time')) {
        $SM.set('meta.time', {
          day: 0,
          tod: 'dawn',
          hour: 6,
          minute: 0,
          season: 'spring',
          year: 1
        }, true);
      }
      if (!$SM.get('meta.weather')) {
        $SM.set('meta.weather', {
          kind: 'clear',
          intensity: 0,
          durationTicksLeft: 0,
          seed: (Date.now() >>> 0) % 0xffffffff,
          shelterTicksLeft: 0
        }, true);
      } else if (typeof $SM.get('meta.weather.shelterTicksLeft', true) === 'undefined') {
        this._setMeta('meta.weather.shelterTicksLeft', 0, true);
      }
    },

    _applyConfig: function() {
      var ranges = Array.isArray(this._config.timeOfDay) ? this._config.timeOfDay : [];
      this._timeRanges = ranges.map(function(range) {
        return {
          slice: range.slice,
          startHour: clampHour(range.startHour),
          endHour: clampHour(range.endHour)
        };
      }).filter(function(range) {
        return typeof range.slice === 'string';
      });
    },

    _advanceTime: function() {
      var minute = $SM.get('meta.time.minute', true) || 0;
      var hour = $SM.get('meta.time.hour', true) || 0;
      var day = $SM.get('meta.time.day', true) || 0;

      minute += MINUTES_PER_TICK;
      if (minute >= 60) {
        var extraHours = Math.floor(minute / 60);
        minute = minute % 60;
        hour += extraHours;
      }
      if (hour >= 24) {
        var extraDays = Math.floor(hour / 24);
        hour = hour % 24;
        day += extraDays;
      }

      this._setMeta('meta.time.minute', minute);
      this._setMeta('meta.time.hour', hour);
      this._setMeta('meta.time.day', day);

      this._syncTimeSlice();
      this._syncSeason(day);
    },

    _syncTimeSlice: function(force) {
      var current = $SM.get('meta.time.tod', true) || 'dawn';
      var hour = $SM.get('meta.time.hour', true) || 0;
      var minute = $SM.get('meta.time.minute', true) || 0;
      var resolved = this._resolveSlice(hour, minute);
      if (resolved !== current || force) {
        this._setMeta('meta.time.tod', resolved);
        if (!force) {
          var message = TIME_MESSAGES[resolved];
          if (message) {
            Notifications.notify(null, message);
          }
        }
      }
    },

    _syncSeason: function(day) {
      var totalDays = day || 0;
      var seasonIndex = Math.floor(totalDays / DAYS_PER_SEASON) % SEASONS.length;
      var newSeason = SEASONS[seasonIndex];
      var currentSeason = $SM.get('meta.time.season', true) || 'spring';
      if (newSeason !== currentSeason) {
        this._setMeta('meta.time.season', newSeason);
      }
      var newYear = Math.floor(totalDays / (DAYS_PER_SEASON * SEASONS.length)) + 1;
      if (newYear !== $SM.get('meta.time.year', true)) {
        this._setMeta('meta.time.year', newYear);
      }
    },

    _resolveSlice: function(hour, minute) {
      var ranges = this._timeRanges.length ? this._timeRanges : DEFAULT_CONFIG.timeOfDay;
      for (var i = 0; i < ranges.length; i++) {
        var range = ranges[i];
        if (this._hourInRange(hour, minute, range.startHour, range.endHour)) {
          return range.slice;
        }
      }
      return ranges[0] ? ranges[0].slice : 'day';
    },

    _hourInRange: function(hour, minute, start, end) {
      var h = clampHour(hour);
      var startHour = clampHour(start);
      var endHour = clampHour(end);
      if (startHour === endHour) {
        return h === startHour;
      }
      if (startHour < endHour) {
        return h > startHour && h < endHour ? true : (h === startHour || h === endHour);
      }
      return h >= startHour || h <= endHour;
    },

    _advanceWeather: function(force) {
      var duration = $SM.get('meta.weather.durationTicksLeft', true) || 0;
      if (!force && duration > 0) {
        this._setMeta('meta.weather.durationTicksLeft', duration - 1);
        this._tickShelter();
        return;
      }

      var previousKind = this.getWeatherKind();
      var rng = this._createRng();
      var season = $SM.get('meta.time.season', true) || 'spring';
      var nextKind = this._chooseNextWeather(previousKind, season, rng) || previousKind;
      var intensity = this._generateIntensity(nextKind, rng);
      var durationRange = this._config.weather && this._config.weather.durations && this._config.weather.durations[nextKind];
      var minDuration = 6;
      var maxDuration = 24;
      if (Array.isArray(durationRange) && durationRange.length === 2) {
        minDuration = Math.max(1, Math.floor(durationRange[0]));
        maxDuration = Math.max(minDuration, Math.floor(durationRange[1]));
      }
      var span = maxDuration - minDuration + 1;
      var newDuration = minDuration + Math.floor(rng() * span);
      var seed = Math.floor(rng() * 0xffffffff);

      this._setMeta('meta.weather.kind', nextKind);
      this._setMeta('meta.weather.intensity', intensity);
      this._setMeta('meta.weather.durationTicksLeft', newDuration);
      this._setMeta('meta.weather.seed', seed);
      this._tickShelter();

      if (nextKind !== previousKind) {
        var weatherMsg = WEATHER_MESSAGES[nextKind];
        if (weatherMsg) {
          Notifications.notify(null, weatherMsg);
        }
        if (typeof $.Dispatch === 'function') {
          $.Dispatch('weatherChanged').publish({ from: previousKind, to: nextKind });
        }
      }
    },

    _tickShelter: function() {
      var shelter = $SM.get('meta.weather.shelterTicksLeft', true) || 0;
      if (shelter > 0) {
        this._setMeta('meta.weather.shelterTicksLeft', shelter - 1);
      }
    },

    _createRng: function() {
      var seed = $SM.get('meta.weather.seed', true);
      if (typeof seed !== 'number' || !isFinite(seed) || seed <= 0) {
        seed = Date.now() >>> 0;
      }
      var state = seed >>> 0;
      return function() {
        state = (state + 0x6d2b79f5) | 0;
        var t = Math.imul(state ^ (state >>> 15), 1 | state);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    _chooseNextWeather: function(previousKind, season, rng) {
      var transitions = this._config.weather && this._config.weather.transitions ? this._config.weather.transitions : {};
      var seasonTable = transitions[season] || transitions.default || {};
      var weights = seasonTable[previousKind] || seasonTable.default || transitions.default && transitions.default[previousKind];
      if (!weights) {
        weights = transitions.default && transitions.default.default ? transitions.default.default : {};
      }
      var picked = weightedPick(weights, rng);
      if (!picked) {
        var kinds = Object.keys(this._config.weather && this._config.weather.durations || {});
        picked = kinds.length ? kinds[Math.floor(rng() * kinds.length)] : previousKind;
      }
      return picked || previousKind;
    },

    _generateIntensity: function(kind, rng) {
      var ranges = this._config.weather && this._config.weather.intensity;
      var range = ranges && ranges[kind];
      if (!range || range.length !== 2) {
        return clamp(rng(), 0, 1);
      }
      var min = clamp(range[0], 0, 1);
      var max = clamp(range[1], min, 1);
      return min + rng() * (max - min);
    },

    _setMeta: function(path, value, silent) {
      var current = $SM.get(path, true);
      if (current === value) {
        return;
      }
      $SM.set(path, value, true);
      if (!silent) {
        $SM.fireUpdate(path);
      }
    }
  };

  global.TimeWeather = TimeWeather;
})(this);
