/**
 * Module that registers the outdoors functionality
 */
var Outside = {
        scene: 'outside',
        name: _("Outside"),
        options: {
                startVariant: 'default'
        },
        startVariant: 'default',
        tab: null,
        panel: null,

        _STORES_OFFSET: 0,
        _GATHER_DELAY: 60,
        _TRAPS_DELAY: 90,
        _POP_DELAY: [0.5, 3],
	_HUT_ROOM: 4,
	
        _INCOME: {
                'gatherer': {
                        name: _('gatherer'),
                        delay: 10,
                        stores: {
                                'wood': 1
                        }
                },
		'hunter': {
			name: _('hunter'),
			delay: 10,
			stores: {
				'fur': 0.5,
				'meat': 0.5
			}
		},
		'trapper': {
			name: _('trapper'),
			delay: 10,
			stores: {
				'meat': -1,
				'bait': 1
			}
		},
		'tanner': {
			name: _('tanner'),
			delay: 10,
			stores: {
				'fur': -5,
				'leather': 1
			}
		},
		'charcutier': {
			name: _('charcutier'),
			delay: 10,
			stores: {
				'meat': -5,
				'wood': -5,
				'cured meat': 1
			}
		},
		'iron miner': {
			name: _('iron miner'),
			delay: 10,
			stores: {
				'cured meat': -1,
				'iron': 1
			}
		},
		'coal miner': {
			name: _('coal miner'),
			delay: 10,
			stores: {
				'cured meat': -1,
				'coal': 1
			}
		},
		'sulphur miner': {
			name: _('sulphur miner'),
			delay: 10,
			stores: {
				'cured meat': -1,
				'sulphur': 1
			}
		},
		'steelworker': {
			name: _('steelworker'),
			delay: 10,
			stores: {
				'iron': -1,
				'coal': -1,
				'steel': 1
			}
		},
                'armourer': {
                        name: _('armourer'),
                        delay: 10,
                        stores: {
                                'steel': -1,
                                'sulphur': -1,
                                'bullets': 1
                        }
                }
        },
        themeVariants: {
                default: {
                        gatherActionText: _('gather wood'),
                        gatherNotification: _('dry brush and dead branches litter the forest floor'),
                        shelterLabel: _('take shelter'),
                        gatherAmount: 10,
                        gatherCartMultiplier: 5,
                        workerNames: {
                                'gatherer': _('gatherer'),
                                'hunter': _('hunter'),
                                'trapper': _('trapper'),
                                'tanner': _('tanner'),
                                'charcutier': _('charcutier'),
                                'iron miner': _('iron miner'),
                                'coal miner': _('coal miner'),
                                'sulphur miner': _('sulphur miner'),
                                'steelworker': _('steelworker'),
                                'armourer': _('armourer')
                        },
                        trapMessages: {}
                },
                magic: {
                        gatherActionText: _('harvest witchwood'),
                        gatherNotification: _('witchwood branches glimmer across the enchanted clearing'),
                        shelterLabel: _('raise ward'),
                        gatherAmount: 12,
                        gatherCartMultiplier: 5,
                        gatherCharmChance: 0.15,
                        gatherCharmMessage: _('a charm hums with latent wards'),
                        workerNames: {
                                'gatherer': _('grove tender'),
                                'hunter': _('star hunter'),
                                'trapper': _('sigil snarer'),
                                'tanner': _('essence binder'),
                                'charcutier': _('spirit smoker'),
                                'iron miner': _('meteor miner'),
                                'coal miner': _('shadow delver'),
                                'sulphur miner': _('ember seeker'),
                                'steelworker': _('starforger'),
                                'armourer': _('arcane munitionsmith')
                        },
                        trapMessages: {
                                'fur': _('shreds of moonhide'),
                                'meat': _('slivers of spectral meat'),
                                'scales': _('glittering wyrmscales'),
                                'teeth': _('spirit fangs bound in twine'),
                                'cloth': _('wisps of spellthread'),
                                'charm': _('a charm thrums with latent wards')
                        }
                }
        },
        getVariantData: function () {
                var variant = Outside.startVariant || Outside.options.startVariant || 'default';
                return Outside.themeVariants[variant] || Outside.themeVariants.default;
        },
        getGatherAmount: function () {
                var data = Outside.getVariantData();
                return typeof data.gatherAmount === 'number' ? data.gatherAmount : 10;
        },
        getCartGatherAmount: function (baseAmount) {
                var data = Outside.getVariantData();
                var multiplier = typeof data.gatherCartMultiplier === 'number' ? data.gatherCartMultiplier : 5;
                return baseAmount * multiplier;
        },
        getGatherText: function () {
                var data = Outside.getVariantData();
                return data.gatherActionText || _('gather wood');
        },
        getGatherMessage: function () {
                var data = Outside.getVariantData();
                return data.gatherNotification || _('dry brush and dead branches litter the forest floor');
        },
        getTrapMessage: function (resource, fallback) {
                var data = Outside.getVariantData();
                if (data.trapMessages && data.trapMessages[resource]) {
                        return data.trapMessages[resource];
                }
                return fallback;
        },
        getShelterLabel: function () {
                var data = Outside.getVariantData();
                return data.shelterLabel || _('take shelter');
        },
        getWorkerDisplayName: function (key) {
                var data = Outside.getVariantData();
                if (data.workerNames && data.workerNames[key]) {
                        return data.workerNames[key];
                }
                if (Outside._INCOME[key] && Outside._INCOME[key].name) {
                        return Outside._INCOME[key].name;
                }
                return _(key);
        },
        _timeDisplay: null,
        _weatherDisplay: null,
        _shelterButton: null,
        _shelterLabel: null,
	TrapDrops: [
		{
			rollUnder: 0.5,
			name: 'fur',
			message: _('scraps of fur')
		},
		{
			rollUnder: 0.75,
			name: 'meat',
			message: _('bits of meat')
		},
		{
			rollUnder: 0.85,
			name: 'scales',
			message: _('strange scales')
		},
		{
			rollUnder: 0.93,
			name: 'teeth',
			message: _('scattered teeth')
		},
		{
			rollUnder: 0.995,
			name: 'cloth',
			message: _('tattered cloth')
		},
		{
			rollUnder: 1.0,
			name: 'charm',
			message: _('a crudely made charm')
                }
        ],

        resolveStartVariant: function (variant) {
                return variant === 'magic' ? 'magic' : 'default';
        },

        getLocationLabel: function (variant) {
                if (variant === 'magic') {
                        return _("An Enchanted Clearing");
                }
                return _("A Silent Forest");
        },

        applyStartVariantTheme: function (variant) {
                var normalized = Outside.resolveStartVariant(variant);
                Outside.startVariant = normalized;
                Outside.options = Outside.options || {};
                Outside.options.startVariant = normalized;

                if (Outside.tab && Outside.tab.length) {
                        Outside.tab.text(Outside.getLocationLabel(normalized));
                }

                if (Outside.panel && Outside.panel.length) {
                        Outside.panel.toggleClass('magic-start', normalized === 'magic');
                }
                if (Outside._shelterLabel && Outside._shelterLabel.length) {
                        Outside._shelterLabel.text(Outside.getShelterLabel());
                }
                var gatherButton = $('#gatherButton');
                if (gatherButton.length) {
                        var textNode = gatherButton.contents().filter(function () {
                                return this.nodeType === 3;
                        }).first();
                        if (textNode.length) {
                                textNode[0].nodeValue = Outside.getGatherText();
                        }
                }
        },

        initMagicStart: function (options) {
                options = options || {};
                options.startVariant = 'magic';
                if (Outside.panel && Outside.panel.length) {
                        Outside.applyStartVariantTheme('magic');
                        return;
                }
                Outside.init(options);
        },

        init: function(options) {
                this.options = $.extend(
                        this.options,
                        options
                );

                var variant = Outside.resolveStartVariant(this.options.startVariant);
                Outside.options.startVariant = variant;
                Outside.startVariant = variant;

                if(Engine._debug) {
                        this._GATHER_DELAY = 0;
                        this._TRAPS_DELAY = 0;
                }

                // Create the outside tab
                this.tab = Header.addLocation(Outside.getLocationLabel(variant), "outside", Outside);
                Outside.tab = this.tab;

                // Create the Outside panel
                this.panel = $('<div>').attr('id', "outsidePanel")
                        .addClass('location')
                        .appendTo('div#locationSlider');
                Outside.panel = this.panel;
                if (variant === 'magic') {
                        this.panel.addClass('magic-start');
                }

                var statusRow = $('<div>').addClass('outside-status').appendTo(this.panel);
                Outside._timeDisplay = $('<span>').addClass('outside-status-time').appendTo(statusRow);
                Outside._weatherDisplay = $('<span>').addClass('outside-status-weather').appendTo(statusRow);

		var shelterRow = $('<div>').addClass('outside-shelter').appendTo(this.panel);
		Outside._shelterButton = new Button.Button({
			id: 'shelterButton',
			text: '',
			click: Outside.takeShelter,
			width: '120px'
		}).appendTo(shelterRow);
                Outside._shelterLabel = $('<span>').addClass('buttonLabel').text(Outside.getShelterLabel()).prependTo(Outside._shelterButton);
		Outside._shelterButton.hide();

		//subscribe to stateUpdates
		$.Dispatch('stateUpdate').subscribe(Outside.handleStateUpdates);
		
		if(typeof $SM.get('features.location.outside') == 'undefined') {
			$SM.set('features.location.outside', true);
			if(!$SM.get('game.buildings')) $SM.set('game.buildings', {});
			if(!$SM.get('game.population')) $SM.set('game.population', 0);
			if(!$SM.get('game.workers')) $SM.set('game.workers', {});
		}
		
		this.updateVillage();
		Outside.updateWorkersView();
		Outside.updateVillageIncome();
		Outside.updateTimeWeather();

		Engine.updateSlider();

		// Create the gather button
		new Button.Button({
			id: 'gatherButton',
                        text: Outside.getGatherText(),
			click: Outside.gatherWood,
			cooldown: Outside._GATHER_DELAY,
			width: '80px'
		}).appendTo('div#outsidePanel');

                Outside.updateTrapButton();
        },
	
	getMaxPopulation: function() {
		return $SM.get('game.buildings["hut"]', true) * Outside._HUT_ROOM;
	},
	
	increasePopulation: function() {
		var space = Outside.getMaxPopulation() - $SM.get('game.population');
		if(space > 0) {
			var num = Math.floor(Math.random()*(space/2) + space/2);
			if(num === 0) num = 1;
			if(num == 1) {
				Notifications.notify(null, _('a stranger arrives in the night'));
			} else if(num < 5) {
				Notifications.notify(null, _('a weathered family takes up in one of the huts.'));
			} else if(num < 10) {
				Notifications.notify(null, _('a small group arrives, all dust and bones.'));
			} else if(num < 30) {
				Notifications.notify(null, _('a convoy lurches in, equal parts worry and hope.'));
			} else {
				Notifications.notify(null, _("the town's booming. word does get around."));
			}
			Engine.log('population increased by ' + num);
			$SM.add('game.population', num);
		}
		Outside.schedulePopIncrease();
	},
	
	killVillagers: function(num) {
		$SM.add('game.population', num * -1);
		if($SM.get('game.population') < 0) {
			$SM.set('game.population', 0);
		}
		var remaining = Outside.getNumGatherers();
		if(remaining < 0) {
			var gap = -remaining;
			for(var k in $SM.get('game.workers')) {
				var numWorkers = $SM.get('game.workers["'+k+'"]');
				if(numWorkers < gap) {
					gap -= numWorkers;
					$SM.set('game.workers["'+k+'"]', 0);
				} else {
					$SM.add('game.workers["'+k+'"]', gap * -1);
					break;
				}
			}
		}
	},
	
	destroyHuts: function(num, allowEmpty) {
		var dead = 0;
		for(var i = 0; i < num; i++){
			var population = $SM.get('game.population', true);
			var rate = population / Outside._HUT_ROOM;
			var full = Math.floor(rate);
			// by default this is used to destroy full or half-full huts
			// pass allowEmpty to include empty huts in the armageddon
			var huts = (allowEmpty) ? $SM.get('game.buildings["hut"]', true) : Math.ceil(rate);
			if(!huts) {
				break;
			}
			// random can be 0 but not 1; however, 0 as a target is useless
			var target = Math.floor(Math.random() * huts) + 1;
			var inhabitants = 0;
			if(target <= full){
				inhabitants = Outside._HUT_ROOM;
			} else if(target == full + 1){
				inhabitants = population % Outside._HUT_ROOM;
			}
			$SM.set('game.buildings["hut"]', ($SM.get('game.buildings["hut"]') - 1));
			if(inhabitants){
				Outside.killVillagers(inhabitants);
				dead += inhabitants;
			}
		}
		// this method returns the total number of victims, for further actions
		return dead;
	},
	
	schedulePopIncrease: function() {
		var nextIncrease = Math.floor(Math.random()*(Outside._POP_DELAY[1] - Outside._POP_DELAY[0])) + Outside._POP_DELAY[0];
		Engine.log('next population increase scheduled in ' + nextIncrease + ' minutes');
		Outside._popTimeout = Engine.setTimeout(Outside.increasePopulation, nextIncrease * 60 * 1000);
	},
	
	updateWorkersView: function() {
		var workers = $('div#workers');

		// If our population is 0 and we don't already have a workers view,
		// there's nothing to do here.
		if(!workers.length && $SM.get('game.population') === 0) return;

		var needsAppend = false;
		if(workers.length === 0) {
			needsAppend = true;
			workers = $('<div>').attr('id', 'workers').css('opacity', 0);
		}
		
		var numGatherers = $SM.get('game.population');
		var gatherer = $('div#workers_row_gatherer', workers);
		
                for(var k in $SM.get('game.workers')) {
                        var lk = Outside.getWorkerDisplayName(k);
                        var workerCount = $SM.get('game.workers["'+k+'"]');
                        var row = $('div#workers_row_' + k.replace(' ', '-'), workers);
                        if(row.length === 0) {
                                row = Outside.makeWorkerRow(k, workerCount);

                                var curPrev = null;
                                workers.children().each(function(i) {
                                        var child = $(this);
                                        var childKey = child.attr('key');
                                        if(childKey && childKey != 'gatherer') {
                                                var cName = Outside.getWorkerDisplayName(childKey);
                                                if(cName < lk) {
                                                        curPrev = child.attr('id');
                                                }
                                        }
                                });
                                if(curPrev == null && gatherer.length === 0) {
					row.prependTo(workers);
				} else if(curPrev == null) {
					row.insertAfter(gatherer);
				} else {
					row.insertAfter(workers.find('#'+ curPrev));
				}
				
			} else {
                                $('div#' + row.attr('id') + ' > div.row_key', workers).text(Outside.getWorkerDisplayName(k));
                                $('div#' + row.attr('id') + ' > div.row_val > span', workers).text(workerCount);
                        }
			numGatherers -= workerCount;
			if(workerCount === 0) {
				$('.dnBtn', row).addClass('disabled');
				$('.dnManyBtn', row).addClass('disabled');
			} else {
				$('.dnBtn', row).removeClass('disabled');
				$('.dnManyBtn', row).removeClass('disabled');
			}
		}
		
		if(gatherer.length === 0) {
			gatherer = Outside.makeWorkerRow('gatherer', numGatherers);
			gatherer.prependTo(workers);
		} else {
                        $('div#workers_row_gatherer > div.row_key', workers).text(Outside.getWorkerDisplayName('gatherer'));
                        $('div#workers_row_gatherer > div.row_val > span', workers).text(numGatherers);
		}
		
		if(numGatherers === 0) {
			$('.upBtn', '#workers').addClass('disabled');
			$('.upManyBtn', '#workers').addClass('disabled');
		} else {
			$('.upBtn', '#workers').removeClass('disabled');
			$('.upManyBtn', '#workers').removeClass('disabled');
		}
		
		
		if(needsAppend && workers.children().length > 0) {
			workers.appendTo('#outsidePanel').animate({opacity:1}, 300, 'linear');
		}
	},
	
	getNumGatherers: function() {
		var num = $SM.get('game.population'); 
		for(var k in $SM.get('game.workers')) {
			num -= $SM.get('game.workers["'+k+'"]');
		}
		return num;
	},
	
	makeWorkerRow: function(key, num) {
                var name = Outside.getWorkerDisplayName(key);
                var row = $('<div>')
                        .attr('key', key)
                        .attr('id', 'workers_row_' + key.replace(' ','-'))
                        .addClass('workerRow');
                $('<div>').addClass('row_key').text(name).appendTo(row);
		var val = $('<div>').addClass('row_val').appendTo(row);
		
		$('<span>').text(num).appendTo(val);
		
		if(key != 'gatherer') {
			$('<div>').addClass('upBtn').appendTo(val).click([1], Outside.increaseWorker);
			$('<div>').addClass('dnBtn').appendTo(val).click([1], Outside.decreaseWorker);
			$('<div>').addClass('upManyBtn').appendTo(val).click([10], Outside.increaseWorker);
			$('<div>').addClass('dnManyBtn').appendTo(val).click([10], Outside.decreaseWorker);
		}
		
		$('<div>').addClass('clear').appendTo(row);
		
                var tooltip = $('<div>').addClass('tooltip bottom right').appendTo(row);
                var income = Outside._INCOME[key];
                for(var s in income.stores) {
                        var r = $('<div>').addClass('storeRow');
                        $('<div>').addClass('row_key').text(Room.getResourceLabel(s)).appendTo(r);
                        $('<div>').addClass('row_val').text(Engine.getIncomeMsg(income.stores[s], income.delay)).appendTo(r);
                        r.appendTo(tooltip);
                }
		
		return row;
	},
	
	increaseWorker: function(btn) {
		var worker = $(this).closest('.workerRow').attr('key');
		if(Outside.getNumGatherers() > 0) {
			var increaseAmt = Math.min(Outside.getNumGatherers(), btn.data);
			Engine.log('increasing ' + worker + ' by ' + increaseAmt);
			$SM.add('game.workers["'+worker+'"]', increaseAmt);
		}
	},
	
	decreaseWorker: function(btn) {
		var worker = $(this).closest('.workerRow').attr('key');
		if($SM.get('game.workers["'+worker+'"]') > 0) {
			var decreaseAmt = Math.min($SM.get('game.workers["'+worker+'"]') || 0, btn.data);
			Engine.log('decreasing ' + worker + ' by ' + decreaseAmt);
			$SM.add('game.workers["'+worker+'"]', decreaseAmt * -1);
		}
	},
	
	updateVillageRow: function(name, num, village) {
                var id = 'building_row_' + name.replace(' ', '-');
                var lname = Room.getDisplayName(name);
		var row = $('div#' + id, village);
		if(row.length === 0 && num > 0) {
			row = $('<div>').attr('id', id).addClass('storeRow');
			$('<div>').addClass('row_key').text(lname).appendTo(row);
			$('<div>').addClass('row_val').text(num).appendTo(row);
			$('<div>').addClass('clear').appendTo(row);
			var curPrev = null;
			village.children().each(function(i) {
				var child = $(this);
				if(child.attr('id') != 'population') {
					var cName = child.children('.row_key').text();
					if(cName < lname) {
						curPrev = child.attr('id');
					}
				}
			});
			if(curPrev == null) {
				row.prependTo(village);
			} else {
				row.insertAfter('#' + curPrev);
			}
                } else if(num > 0) {
                        $('div#' + row.attr('id') + ' > div.row_key', village).text(lname);
                        $('div#' + row.attr('id') + ' > div.row_val', village).text(num);
		} else if(num === 0) {
			row.remove();
		}
	},
	
	updateVillage: function(ignoreStores) {
		var village = $('div#village');
		var population = $('div#population');
		var needsAppend = false;
		if(village.length === 0) {
			needsAppend = true;
			village = $('<div>').attr('id', 'village').css('opacity', 0);
			population = $('<div>').attr('id', 'population').appendTo(village);
		}
		
		for(var k in $SM.get('game.buildings')) {
			if(k == 'trap') {
				var numTraps = $SM.get('game.buildings["'+k+'"]');
				var numBait = $SM.get('stores.bait', true);
				var traps = numTraps - numBait;
				traps = traps < 0 ? 0 : traps;
				Outside.updateVillageRow(k, traps, village);
				Outside.updateVillageRow('baited trap', numBait > numTraps ? numTraps : numBait, village);
			} else {
				if(Outside.checkWorker(k)) {
					Outside.updateWorkersView();
				}
				Outside.updateVillageRow(k, $SM.get('game.buildings["'+k+'"]'), village);
			}
		}
		/// TRANSLATORS : pop is short for population.
		population.text(_('pop ') + $SM.get('game.population') + '/' + this.getMaxPopulation());
		
		var hasPeeps;
		if($SM.get('game.buildings["hut"]', true) === 0) {
			hasPeeps = false;
			village.attr('data-legend', _('forest'));
		} else {
			hasPeeps = true;
			village.attr('data-legend', _('village'));
		}
		
		if(needsAppend && village.children().length > 1) {
			village.prependTo('#outsidePanel');
			village.animate({opacity:1}, 300, 'linear');
		}
		
		if(hasPeeps && typeof Outside._popTimeout == 'undefined') {
			Outside.schedulePopIncrease();
		}
		
		this.setTitle();

		if(!ignoreStores && Engine.activeModule === Outside && village.children().length > 1) {
			$('#storesContainer').css({top: village.height() + 26 + Outside._STORES_OFFSET + 'px'});
		}
	},
	
	checkWorker: function(name) {
		var jobMap = {
			'lodge': ['hunter', 'trapper'],
			'tannery': ['tanner'],
			'smokehouse': ['charcutier'],
			'iron mine': ['iron miner'],
			'coal mine': ['coal miner'],
			'sulphur mine': ['sulphur miner'],
			'steelworks': ['steelworker'],
			'armoury' : ['armourer']
		};
		
		var jobs = jobMap[name];
		var added = false;
		if(typeof jobs == 'object') {
			for(var i = 0, len = jobs.length; i < len; i++) {
				var job = jobs[i];
				if(typeof $SM.get('game.buildings["'+name+'"]') == 'number' && 
						typeof $SM.get('game.workers["'+job+'"]') != 'number') {
					Engine.log('adding ' + job + ' to the workers list');
					$SM.set('game.workers["'+job+'"]', 0);
					added = true;
				}
			}
		}
		return added;
	},
	
	updateVillageIncome: function() {
		for(var worker in Outside._INCOME) {
			var income = Outside._INCOME[worker];
			var num = worker == 'gatherer' ? Outside.getNumGatherers() : $SM.get('game.workers["'+worker+'"]');
			if(typeof num == 'number') {
				if(num < 0) num = 0;
				var tooltip = $('.tooltip', 'div#workers_row_' + worker.replace(' ', '-'));
				tooltip.empty();
				var needsUpdate = false;
				var curIncome = $SM.getIncome(worker);
				var perWorker = income.stores;
				if (typeof TimeWeather !== 'undefined' && TimeWeather && typeof TimeWeather.applyIncomeModifiers === 'function') {
					perWorker = TimeWeather.applyIncomeModifiers(worker, perWorker);
				}
				var stores = {};
				for(var store in perWorker) {
					if(!Object.prototype.hasOwnProperty.call(perWorker, store)) {
						continue;
					}
					stores[store] = perWorker[store] * num;
					if(curIncome[store] != stores[store]) needsUpdate = true;
					var row = $('<div>').addClass('storeRow');
					$('<div>').addClass('row_key').text(_(store)).appendTo(row);
					$('<div>').addClass('row_val').text(Engine.getIncomeMsg(stores[store], income.delay)).appendTo(row);
					row.appendTo(tooltip);
				}
				if(needsUpdate) {
					$SM.setIncome(worker, {
						delay: income.delay,
						stores: stores
					});
				}
			}
		}
		Room.updateIncomeView();
	},

	updateTimeWeather: function() {
		if(!Outside._timeDisplay) {
			return;
		}
		if (typeof TimeWeather === 'undefined' || !TimeWeather) {
			Outside._timeDisplay.text('');
			if (Outside._weatherDisplay) {
				Outside._weatherDisplay.text('');
			}
			Outside.updateShelterAction();
			return;
		}

		var tod = typeof TimeWeather.getTimeOfDay === 'function' ? TimeWeather.getTimeOfDay() : 'dawn';
		var icon = typeof TimeWeather.getTimeOfDayIcon === 'function' ? TimeWeather.getTimeOfDayIcon(tod) : '';
		var currentTime = typeof TimeWeather.getFormattedTime === 'function' ? TimeWeather.getFormattedTime() : '';
		var timeParts = [];
		if(icon) timeParts.push(icon);
		timeParts.push(_(tod));
		if(currentTime) timeParts.push(currentTime);
		Outside._timeDisplay.text(timeParts.join(' '));

		if(Outside._weatherDisplay) {
			var weather = typeof TimeWeather.getWeatherKind === 'function' ? TimeWeather.getWeatherKind() : 'clear';
			var weatherIcon = typeof TimeWeather.getWeatherIcon === 'function' ? TimeWeather.getWeatherIcon(weather) : '';
			var intensity = typeof TimeWeather.getWeatherIntensity === 'function' ? TimeWeather.getWeatherIntensity() : 0;
			var weatherParts = [];
			if(weatherIcon) weatherParts.push(weatherIcon);
			weatherParts.push(_(weather));
			if(intensity > 0) {
				weatherParts.push('(' + Math.round(intensity * 100) + '%)');
			}
			Outside._weatherDisplay.text(weatherParts.join(' '));
		}

		Outside.updateShelterAction();
	},

	updateShelterAction: function() {
		if(!Outside._shelterButton) {
			return;
		}
		if (typeof TimeWeather === 'undefined' || !TimeWeather || typeof TimeWeather.isAdverseWeather !== 'function') {
			Outside._shelterButton.hide();
			return;
		}

		if(!TimeWeather.isAdverseWeather()) {
			Outside._shelterButton.hide();
			Button.setDisabled(Outside._shelterButton, false);
			Outside._shelterLabel.text(_('take shelter'));
			return;
		}

		Outside._shelterButton.show();
		var active = typeof TimeWeather.isShelterActive === 'function' ? TimeWeather.isShelterActive() : false;
		var ticksLeft = typeof TimeWeather.getShelterTicksLeft === 'function' ? TimeWeather.getShelterTicksLeft() : 0;
		if(active) {
			Outside._shelterLabel.text(_('sheltering ({0})', ticksLeft));
			Button.setDisabled(Outside._shelterButton, true);
		} else {
			Outside._shelterLabel.text(_('take shelter'));
			Button.setDisabled(Outside._shelterButton, false);
		}
	},

	takeShelter: function() {
		if (typeof TimeWeather === 'undefined' || !TimeWeather || typeof TimeWeather.activateShelter !== 'function') {
			return;
		}
		var activated = TimeWeather.activateShelter();
		if(activated) {
			Outside.updateShelterAction();
		}
	},

	updateTrapButton: function() {
		var btn = $('div#trapsButton');
		if($SM.get('game.buildings["trap"]', true) > 0) {
			if(btn.length === 0) {
				new Button.Button({
					id: 'trapsButton',
					text: _("check traps"),
					click: Outside.checkTraps,
					cooldown: Outside._TRAPS_DELAY,
					width: '80px'
				}).appendTo('div#outsidePanel');
			} else {
				Button.setDisabled(btn, false);
			}
		} else {
			if(btn.length > 0) {
				Button.setDisabled(btn, true);
			}
		}
	},
	
	setTitle: function() {
		var numHuts = $SM.get('game.buildings["hut"]', true);
		var title;
		if(numHuts === 0) {
			title = _("A Silent Forest");
		} else if(numHuts == 1) {
			title = _("A Lonely Hut");
		} else if(numHuts <= 4) {
			title = _("A Tiny Village");
		} else if(numHuts <= 8) {
			title = _("A Modest Village");
		} else if(numHuts <= 14) {
			title = _("A Large Village");
		} else {
			title = _("A Raucous Village");
		}
		
		if(Engine.activeModule == this) {
			document.title = title;
		}
		$('#location_outside').text(title);
	},
	
	onArrival: function(transition_diff) {
		Outside.setTitle();
		if(!$SM.get('game.outside.seenForest')) {
			Notifications.notify(Outside, _("the sky is grey and the wind blows relentlessly"));
			$SM.set('game.outside.seenForest', true);
		}
		Outside.updateTrapButton();
		Outside.updateVillage(true);

		Engine.moveStoresView($('#village'), transition_diff);
		
		// set music
		var numberOfHuts = $SM.get('game.buildings["hut"]', true);
		if(numberOfHuts === 0) {
			AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_SILENT_FOREST);
		} else if(numberOfHuts == 1) {
			AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_LONELY_HUT);
		} else if(numberOfHuts <= 4) {
			AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_TINY_VILLAGE);
		} else if(numberOfHuts <= 8) {
			AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_MODEST_VILLAGE);
		} else if(numberOfHuts <= 14) {
			AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_LARGE_VILLAGE);
		} else {
			AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_RAUCOUS_VILLAGE);
		}
	},
	
        gatherWood: function() {
                Notifications.notify(Outside, Outside.getGatherMessage());
                var baseAmount = Outside.getGatherAmount();
                var gatherAmt = $SM.get('game.buildings["cart"]', true) > 0 ? Outside.getCartGatherAmount(baseAmount) : baseAmount;
                $SM.add('stores.wood', gatherAmt);
                var bonusMessage = Outside.maybeApplyGatherBonus();
                if (bonusMessage) {
                        Notifications.notify(Outside, bonusMessage);
                }
                AudioEngine.playSound(AudioLibrary.GATHER_WOOD);
        },

        maybeApplyGatherBonus: function () {
                var data = Outside.getVariantData();
                if (Outside.resolveStartVariant(Outside.startVariant) !== 'magic') {
                        return null;
                }
                if (data.gatherCharmChance && Math.random() < data.gatherCharmChance) {
                        $SM.add('stores.charm', 1);
                        return data.gatherCharmMessage || _('a charm hums with latent wards');
                }
                return null;
        },

        checkTraps: function() {
                var drops = {};
                var msg = [];
                var numTraps = $SM.get('game.buildings["trap"]', true);
		var numBait = $SM.get('stores.bait', true);
		var numDrops = numTraps + (numBait < numTraps ? numBait : numTraps);
		for(var i = 0; i < numDrops; i++) {
			var roll = Math.random();
			for(var j in Outside.TrapDrops) {
                                var drop = Outside.TrapDrops[j];
                                if(roll < drop.rollUnder) {
                                        var num = drops[drop.name];
                                        if(typeof num == 'undefined') {
                                                num = 0;
                                                msg.push(Outside.getTrapMessage(drop.name, drop.message));
                                        }
                                        drops[drop.name] = num + 1;
                                        break;
                                }
                        }
		}
		/// TRANSLATORS : Mind the whitespace at the end.
		var s = _('the traps contain ');
		for(var l = 0, len = msg.length; l < len; l++) {
			if(len > 1 && l > 0 && l < len - 1) {
				s += ", ";
			} else if(len > 1 && l == len - 1) {
				/// TRANSLATORS : Mind the whitespaces at the beginning and end.
				s += _(" and ");
			}
			s += msg[l];
		}
		
		var baitUsed = numBait < numTraps ? numBait : numTraps;
		drops['bait'] = -baitUsed;
		
		Notifications.notify(Outside, s);
		$SM.addM('stores', drops);
		AudioEngine.playSound(AudioLibrary.CHECK_TRAPS);
	},
	
	handleStateUpdates: function(e){
		if(e.category == 'stores'){
			Outside.updateVillage();
		} else if(e.stateName.indexOf('game.workers') === 0 || e.stateName.indexOf('game.population') === 0){
			Outside.updateVillage();
			Outside.updateWorkersView();
			Outside.updateVillageIncome();
		} else if(e.category == 'meta' || e.stateName.indexOf('meta.') === 0){
			Outside.updateTimeWeather();
			Outside.updateVillageIncome();
		}
	}
};
