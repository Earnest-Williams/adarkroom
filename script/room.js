/**
 * Module that registers the simple room functionality
 */
var Room = {
	// times in (minutes * seconds * milliseconds)
	_FIRE_COOL_DELAY: 5 * 60 * 1000, // time after a stoke before the fire cools
	_ROOM_WARM_DELAY: 30 * 1000, // time between room temperature updates
	_BUILDER_STATE_DELAY: 0.5 * 60 * 1000, // time between builder state updates
	_STOKE_COOLDOWN: 10, // cooldown to stoke the fire
	_NEED_WOOD_DELAY: 15 * 1000, // from when the stranger shows up, to when you need wood
        buttons: {},
        startVariantPrepared: false,
        themeVariants: {
                default: {
                        sectionLabels: {
                                build: _('build:'),
                                craft: _('craft:'),
                                buy: _('buy:'),
                                stores: _('stores'),
                                weapons: _('weapons')
                        },
                        displayNames: {},
                        craftables: {}
                },
                magic: {
                        sectionLabels: {
                                build: _('weave:'),
                                craft: _('enchant:'),
                                buy: _('barter:'),
                                stores: _('satchel'),
                                weapons: _('foci')
                        },
                        displayNames: {
                                'wood': _('witchwood'),
                                'fur': _('moonhide'),
                                'meat': _('spectral meat'),
                                'bait': _('runed bait'),
                                'leather': _('enchanted leather'),
                                'cloth': _('spellthread'),
                                'scales': _('wyrmscale'),
                                'teeth': _('spirit fang'),
                                'cured meat': _('astral jerky'),
                                'iron': _('meteoric iron'),
                                'coal': _('shadow coal'),
                                'sulphur': _('brimstone ash'),
                                'steel': _('starsteel'),
                                'bullets': _('arcane rounds'),
                                'energy cell': _('mana battery'),
                                'bolas': _('binding orbs'),
                                'grenade': _('volatile orb'),
                                'bayonet': _('spellblade'),
                                'alien alloy': _('eldritch alloy'),
                                'medicine': _('mending draught'),
                                'compass': _('astral compass'),
                                'charm': _('warding charm'),
                                'torch': _('witchlight torch'),
                                'waterskin': _('crystal phial'),
                                'cask': _('starlit cask'),
                                'water': _('moonwater'),
                                'water tank': _('everflow tank'),
                                'bone spear': _('spiritthorn spear'),
                                'rucksack': _('runed rucksack'),
                                'wagon': _('levitation wagon'),
                                'convoy': _('astral convoy'),
                                'l armour': _('warded leathers'),
                                'i armour': _('meteoric mail'),
                                's armour': _('starsteel plate'),
                                'iron sword': _('meteoric blade'),
                                'steel sword': _('starsteel blade'),
                                'rifle': _('echo rifle'),
                                'laser rifle': _('sunshard rifle'),
                                'kinetic armour': _('kinetic aegis'),
                                'trap': _('glyph snare'),
                                'baited trap': _('baited glyph snare'),
                                'cart': _('levitation sled'),
                                'hut': _('mystic hut'),
                                'lodge': _('moon lodge'),
                                'trading post': _('arcane bazaar'),
                                'tannery': _('essence tanner'),
                                'smokehouse': _('spirit kiln'),
                                'workshop': _('enchanter\'s atelier'),
                                'steelworks': _('starforge'),
                                'armoury': _('arcane arsenal')
                        },
                        craftables: {
                                'trap': {
                                        name: _('glyph snare'),
                                        availableMsg: _('builder murmurs about weaving glyph snares to catch wandering spirits.'),
                                        buildMsg: _('more glyph snares to bind more spirits'),
                                        maxMsg: _('no more sigils will hold now')
                                },
                                'cart': {
                                        name: _('levitation sled'),
                                        availableMsg: _('builder says she can charm a sled to carry witchwood'),
                                        buildMsg: _('the levitation sled hums, ready to glide with timber')
                                },
                                'hut': {
                                        name: _('mystic hut'),
                                        availableMsg: _('builder says other wanderers of the craft will come if there is space'),
                                        buildMsg: _('a mystic hut rises, its wards beckoning others'),
                                        maxMsg: _('no room remains for more mystic huts')
                                },
                                'lodge': {
                                        name: _('moon lodge'),
                                        availableMsg: _('villagers could hunt shades, given the means'),
                                        buildMsg: _('the moon lodge glows faintly out in the woods')
                                },
                                'trading post': {
                                        name: _('arcane bazaar'),
                                        availableMsg: _('an arcane bazaar would steady the flow of curios'),
                                        buildMsg: _('nomads linger under the bazaar\'s lanterns')
                                },
                                'tannery': {
                                        name: _('essence tanner'),
                                        availableMsg: _('builder says cured moonhide could prove useful'),
                                        buildMsg: _('incense curls as the essence tanner opens for work')
                                },
                                'smokehouse': {
                                        name: _('spirit kiln'),
                                        availableMsg: _('builder says she can bind the essence before it fades'),
                                        buildMsg: _('builder finishes the spirit kiln. she looks hungry.')
                                },
                                'workshop': {
                                        name: _('enchanter\'s atelier'),
                                        availableMsg: _('builder says she could weave finer things with proper foci'),
                                        buildMsg: _('the atelier hums with latent power')
                                },
                                'steelworks': {
                                        name: _('starforge'),
                                        availableMsg: _('builder says the villagers could forge starsteel with the right sigils'),
                                        buildMsg: _('a haze of starlight settles as the starforge awakens')
                                },
                                'armoury': {
                                        name: _('arcane arsenal'),
                                        availableMsg: _('builder says it would help to conjure rounds without pause'),
                                        buildMsg: _('the arcane arsenal crackles with remembered wars')
                                },
                                'torch': {
                                        name: _('witchlight torch'),
                                        buildMsg: _('a witchlight torch to hold back the dark')
                                },
                                'waterskin': {
                                        name: _('crystal phial'),
                                        buildMsg: _('the phial will hold a little more moonwater')
                                },
                                'cask': {
                                        name: _('starlit cask'),
                                        buildMsg: _('the cask safeguards enough water for longer rituals')
                                },
                                'water tank': {
                                        name: _('everflow tank'),
                                        buildMsg: _('never thirst beneath the wards again')
                                },
                                'bone spear': {
                                        name: _('spiritthorn spear'),
                                        buildMsg: _('not elegant, but keen enough to pierce restless spirits')
                                },
                                'rucksack': {
                                        name: _('runed rucksack'),
                                        buildMsg: _('sigils make carrying more feel almost weightless')
                                },
                                'wagon': {
                                        name: _('levitation wagon'),
                                        buildMsg: _('the wagon floats, eager to haul enchanted goods')
                                },
                                'convoy': {
                                        name: _('astral convoy'),
                                        buildMsg: _('the convoy can haul nearly everything the village can craft')
                                },
                                'l armour': {
                                        name: _('warded leathers'),
                                        buildMsg: _('wards woven into leather offer better than rags')
                                },
                                'i armour': {
                                        name: _('meteoric mail'),
                                        buildMsg: _('meteoric mail wards more blows than leather')
                                },
                                's armour': {
                                        name: _('starsteel plate'),
                                        buildMsg: _('starsteel turns aside nearly anything')
                                },
                                'iron sword': {
                                        name: _('meteoric blade'),
                                        buildMsg: _('the meteoric blade sings with old light')
                                },
                                'steel sword': {
                                        name: _('starsteel blade'),
                                        buildMsg: _('the starsteel blade rings true')
                                },
                                'rifle': {
                                        name: _('echo rifle'),
                                        buildMsg: _('an echo rifle, black powder bound with sigils')
                                }
                        }
                }
        },
        getVariantData: function () {
                var variant = Room.getStartVariant ? Room.getStartVariant() : 'default';
                return Room.themeVariants[variant] || Room.themeVariants.default;
        },

        getSectionLabel: function (section, fallback) {
                var data = Room.getVariantData();
                if (data.sectionLabels && data.sectionLabels[section]) {
                        return data.sectionLabels[section];
                }
                return fallback;
        },

        getCraftableVariantField: function (key, field) {
                var data = Room.getVariantData();
                if (data.craftables && data.craftables[key] && data.craftables[key][field]) {
                        return data.craftables[key][field];
                }
                return null;
        },

        getCraftableName: function (key) {
                var override = Room.getCraftableVariantField(key, 'name');
                if (override) {
                        return override;
                }
                var craftable = Room.Craftables && Room.Craftables[key];
                if (craftable && craftable.name) {
                        return craftable.name;
                }
                return _(key);
        },

        getCraftableText: function (key, field) {
                var override = Room.getCraftableVariantField(key, field);
                if (override) {
                        return override;
                }
                var craftable = Room.Craftables && Room.Craftables[key];
                if (craftable && craftable[field]) {
                        return craftable[field];
                }
                return null;
        },

        getDisplayName: function (key) {
                var data = Room.getVariantData();
                if (data.displayNames && data.displayNames[key]) {
                        return data.displayNames[key];
                }
                if (Room.Craftables && Room.Craftables[key] && Room.Craftables[key].name) {
                        return Room.Craftables[key].name;
                }
                if (Room.TradeGoods && Room.TradeGoods[key] && Room.TradeGoods[key].name) {
                        return Room.TradeGoods[key].name;
                }
                if (Room.MiscItems && Room.MiscItems[key] && Room.MiscItems[key].name) {
                        return Room.MiscItems[key].name;
                }
                if (typeof Fabricator !== 'undefined' && Fabricator.Craftables && Fabricator.Craftables[key] && Fabricator.Craftables[key].name) {
                        return Fabricator.Craftables[key].name;
                }
                return _(key);
        },

        getResourceLabel: function (key) {
                return Room.getDisplayName(key);
        },

        Craftables: {
		'trap': {
			name: _('trap'),
			button: null,
			maximum: 10,
			availableMsg: _('builder says she can make traps to catch any creatures might still be alive out there'),
			buildMsg: _('more traps to catch more creatures'),
			maxMsg: _("more traps won't help now"),
			type: 'building',
			cost: function () {
				var n = $SM.get('game.buildings["trap"]', true);
				return {
					'wood': 10 + (n * 10)
				};
			},
			audio: AudioLibrary.BUILD_TRAP
		},
		'cart': {
			name: _('cart'),
			button: null,
			maximum: 1,
			availableMsg: _('builder says she can make a cart for carrying wood'),
			buildMsg: _('the rickety cart will carry more wood from the forest'),
			type: 'building',
			cost: function () {
				return {
					'wood': 30
				};
			},
			audio: AudioLibrary.BUILD_CART
		},
		'hut': {
			name: _('hut'),
			button: null,
			maximum: 20,
			availableMsg: _("builder says there are more wanderers. says they'll work, too."),
			buildMsg: _('builder puts up a hut, out in the forest. says word will get around.'),
			maxMsg: _('no more room for huts.'),
			type: 'building',
			cost: function () {
				var n = $SM.get('game.buildings["hut"]', true);
				return {
					'wood': 100 + (n * 50)
				};
			},
			audio: AudioLibrary.BUILD_HUT
		},
		'lodge': {
			name: _('lodge'),
			button: null,
			maximum: 1,
			availableMsg: _('villagers could help hunt, given the means'),
			buildMsg: _('the hunting lodge stands in the forest, a ways out of town'),
			type: 'building',
			cost: function () {
				return {
					wood: 200,
					fur: 10,
					meat: 5
				};
			},
			audio: AudioLibrary.BUILD_LODGE
		},
		'trading post': {
			name: _('trading post'),
			button: null,
			maximum: 1,
			availableMsg: _("a trading post would make commerce easier"),
			buildMsg: _("now the nomads have a place to set up shop, they might stick around a while"),
			type: 'building',
			cost: function () {
				return {
					'wood': 400,
					'fur': 100
				};
			},
			audio: AudioLibrary.BUILD_TRADING_POST
		},
		'tannery': {
			name: _('tannery'),
			button: null,
			maximum: 1,
			availableMsg: _("builder says leather could be useful. says the villagers could make it."),
			buildMsg: _('tannery goes up quick, on the edge of the village'),
			type: 'building',
			cost: function () {
				return {
					'wood': 500,
					'fur': 50
				};
			},
			audio: AudioLibrary.BUILD_TANNERY
		},
		'smokehouse': {
			name: _('smokehouse'),
			button: null,
			maximum: 1,
			availableMsg: _("should cure the meat, or it'll spoil. builder says she can fix something up."),
			buildMsg: _('builder finishes the smokehouse. she looks hungry.'),
			type: 'building',
			cost: function () {
				return {
					'wood': 600,
					'meat': 50
				};
			},
			audio: AudioLibrary.BUILD_SMOKEHOUSE
		},
		'workshop': {
			name: _('workshop'),
			button: null,
			maximum: 1,
			availableMsg: _("builder says she could make finer things, if she had the tools"),
			buildMsg: _("workshop's finally ready. builder's excited to get to it"),
			type: 'building',
			cost: function () {
				return {
					'wood': 800,
					'leather': 100,
					'scales': 10
				};
			},
			audio: AudioLibrary.BUILD_WORKSHOP
		},
		'steelworks': {
			name: _('steelworks'),
			button: null,
			maximum: 1,
			availableMsg: _("builder says the villagers could make steel, given the tools"),
			buildMsg: _("a haze falls over the village as the steelworks fires up"),
			type: 'building',
			cost: function () {
				return {
					'wood': 1500,
					'iron': 100,
					'coal': 100
				};
			},
			audio: AudioLibrary.BUILD_STEELWORKS
		},
		'armoury': {
			name: _('armoury'),
			button: null,
			maximum: 1,
			availableMsg: _("builder says it'd be useful to have a steady source of bullets"),
			buildMsg: _("armoury's done, welcoming back the weapons of the past."),
			type: 'building',
			cost: function () {
				return {
					'wood': 3000,
					'steel': 100,
					'sulphur': 50
				};
			},
			audio: AudioLibrary.BUILD_ARMOURY
		},
		'torch': {
			name: _('torch'),
			button: null,
			type: 'tool',
			buildMsg: _('a torch to keep the dark away'),
			cost: function () {
				return {
					'wood': 1,
					'cloth': 1
				};
			},
			audio: AudioLibrary.CRAFT_TORCH
		},
		'waterskin': {
			name: _('waterskin'),
			button: null,
			type: 'upgrade',
			maximum: 1,
			buildMsg: _('this waterskin\'ll hold a bit of water, at least'),
			cost: function () {
				return {
					'leather': 50
				};
			},
			audio: AudioLibrary.CRAFT_WATERSKIN
		},
		'cask': {
			name: _('cask'),
			button: null,
			type: 'upgrade',
			maximum: 1,
			buildMsg: _('the cask holds enough water for longer expeditions'),
			cost: function () {
				return {
					'leather': 100,
					'iron': 20
				};
			},
			audio: AudioLibrary.CRAFT_CASK
		},
		'water tank': {
			name: _('water tank'),
			button: null,
			type: 'upgrade',
			maximum: 1,
			buildMsg: _('never go thirsty again'),
			cost: function () {
				return {
					'iron': 100,
					'steel': 50
				};
			},
			audio: AudioLibrary.CRAFT_WATER_TANK
		},
		'bone spear': {
			name: _('bone spear'),
			button: null,
			type: 'weapon',
			buildMsg: _("this spear's not elegant, but it's pretty good at stabbing"),
			cost: function () {
				return {
					'wood': 100,
					'teeth': 5
				};
			},
			audio: AudioLibrary.CRAFT_BONE_SPEAR
		},
		'rucksack': {
			name: _('rucksack'),
			button: null,
			type: 'upgrade',
			maximum: 1,
			buildMsg: _('carrying more means longer expeditions to the wilds'),
			cost: function () {
				return {
					'leather': 200
				};
			},
			audio: AudioLibrary.CRAFT_RUCKSACK
		},
		'wagon': {
			name: _('wagon'),
			button: null,
			type: 'upgrade',
			maximum: 1,
			buildMsg: _('the wagon can carry a lot of supplies'),
			cost: function () {
				return {
					'wood': 500,
					'iron': 100
				};
			},
			audio: AudioLibrary.CRAFT_WAGON
		},
		'convoy': {
			name: _('convoy'),
			button: null,
			type: 'upgrade',
			maximum: 1,
			buildMsg: _('the convoy can haul mostly everything'),
			cost: function () {
				return {
					'wood': 1000,
					'iron': 200,
					'steel': 100
				};
			},
			audio: AudioLibrary.CRAFT_CONVOY
		},
		'l armour': {
			name: _('l armour'),
			type: 'upgrade',
			maximum: 1,
			buildMsg: _("leather's not strong. better than rags, though."),
			cost: function () {
				return {
					'leather': 200,
					'scales': 20
				};
			},
			audio: AudioLibrary.CRAFT_LEATHER_ARMOUR
		},
		'i armour': {
			name: _('i armour'),
			type: 'upgrade',
			maximum: 1,
			buildMsg: _("iron's stronger than leather"),
			cost: function () {
				return {
					'leather': 200,
					'iron': 100
				};
			},
			audio: AudioLibrary.CRAFT_IRON_ARMOUR
		},
		's armour': {
			name: _('s armour'),
			type: 'upgrade',
			maximum: 1,
			buildMsg: _("steel's stronger than iron"),
			cost: function () {
				return {
					'leather': 200,
					'steel': 100
				};
			},
			audio: AudioLibrary.CRAFT_STEEL_ARMOUR
		},
		'iron sword': {
			name: _('iron sword'),
			button: null,
			type: 'weapon',
			buildMsg: _("sword is sharp. good protection out in the wilds."),
			cost: function () {
				return {
					'wood': 200,
					'leather': 50,
					'iron': 20
				};
			},
			audio: AudioLibrary.CRAFT_IRON_SWORD
		},
		'steel sword': {
			name: _('steel sword'),
			button: null,
			type: 'weapon',
			buildMsg: _("the steel is strong, and the blade true."),
			cost: function () {
				return {
					'wood': 500,
					'leather': 100,
					'steel': 20
				};
			},
			audio: AudioLibrary.CRAFT_STEEL_SWORD
		},
		'rifle': {
			name: _('rifle'),
			type: 'weapon',
			buildMsg: _("black powder and bullets, like the old days."),
			cost: function () {
				return {
					'wood': 200,
					'steel': 50,
					'sulphur': 50
				};
			},
			audio: AudioLibrary.CRAFT_RIFLE
		}
	},

	TradeGoods: {
		'scales': {
			type: 'good',
			cost: function () {
				return { fur: 150 };
			},
			audio: AudioLibrary.BUY_SCALES
		},
		'teeth': {
			type: 'good',
			cost: function () {
				return { fur: 300 };
			},
			audio: AudioLibrary.BUY_TEETH
		},
		'iron': {
			type: 'good',
			cost: function () {
				return {
					'fur': 150,
					'scales': 50
				};
			},
			audio: AudioLibrary.BUY_IRON
		},
		'coal': {
			type: 'good',
			cost: function () {
				return {
					'fur': 200,
					'teeth': 50
				};
			},
			audio: AudioLibrary.BUY_COAL
		},
		'steel': {
			type: 'good',
			cost: function () {
				return {
					'fur': 300,
					'scales': 50,
					'teeth': 50
				};
			},
			audio: AudioLibrary.BUY_STEEL
		},
		'medicine': {
			type: 'good',
			cost: function () {
				return {
					'scales': 50, 'teeth': 30
				};
			},
			audio: AudioLibrary.BUY_MEDICINE
		},
		'bullets': {
			type: 'good',
			cost: function () {
				return {
					'scales': 10
				};
			},
			audio: AudioLibrary.BUY_BULLETS
		},
		'energy cell': {
			type: 'good',
			cost: function () {
				return {
					'scales': 10,
					'teeth': 10
				};
			},
			audio: AudioLibrary.BUY_ENERGY_CELL
		},
		'bolas': {
			type: 'weapon',
			cost: function () {
				return {
					'teeth': 10
				};
			},
			audio: AudioLibrary.BUY_BOLAS
		},
		'grenade': {
			type: 'weapon',
			cost: function () {
				return {
					'scales': 100,
					'teeth': 50
				};
			},
			audio: AudioLibrary.BUY_GRENADES
		},
		'bayonet': {
			type: 'weapon',
			cost: function () {
				return {
					'scales': 500,
					'teeth': 250
				};
			},
			audio: AudioLibrary.BUY_BAYONET
		},
		'alien alloy': {
			type: 'good',
			cost: function () {
				return {
					'fur': 1500,
					'scales': 750,
					'teeth': 300
				};
			},
			audio: AudioLibrary.BUY_ALIEN_ALLOY
		},
		'compass': {
			type: 'special',
			maximum: 1,
			cost: function () {
				return {
					fur: 400,
					scales: 20,
					teeth: 10
				};
			},
			audio: AudioLibrary.BUY_COMPASS
		}
	},

	MiscItems: {
		'laser rifle': {
			type: 'weapon'
		}
	},

	name: _("Room"),
	init: function (options) {
		this.options = $.extend(
			this.options,
			options
		);

		Room.pathDiscovery = Boolean($SM.get('stores["compass"]'));
		Room.startVariantPrepared = Boolean($SM.get('game.magicPathPrepared'));
		var startVariant = Room.getStartVariant();
		Room.ensureStartVariantPreparation(startVariant);

		if (Engine._debug) {
			this._ROOM_WARM_DELAY = 5000;
			this._BUILDER_STATE_DELAY = 5000;
			this._STOKE_COOLDOWN = 0;
			this._NEED_WOOD_DELAY = 5000;
		}

		if (typeof $SM.get('features.location.room') == 'undefined') {
			$SM.set('features.location.room', true);
			$SM.set('game.builder.level', -1);
		}

		// If this is the first time playing, the fire is dead and it's freezing. 
		// Otherwise grab past save state temp and fire level.
		$SM.set('game.temperature', $SM.get('game.temperature.value') === undefined ? this.TempEnum.Freezing : $SM.get('game.temperature'));
		$SM.set('game.fire', $SM.get('game.fire.value') === undefined ? this.FireEnum.Dead : $SM.get('game.fire'));

		// Create the room tab
		this.tab = Header.addLocation(_("A Dark Room"), "room", Room);

		// Create the Room panel
		this.panel = $('<div>')
			.attr('id', "roomPanel")
			.addClass('location')
			.appendTo('div#locationSlider');

		Engine.updateSlider();

		// Create the light button
		new Button.Button({
			id: 'lightButton',
			text: _('light fire'),
			click: Room.lightFire,
			cooldown: Room._STOKE_COOLDOWN,
			width: '80px',
			cost: { 'wood': 5 }
		}).appendTo('div#roomPanel');

		// Create the stoke button
		new Button.Button({
			id: 'stokeButton',
			text: _("stoke fire"),
			click: Room.stokeFire,
			cooldown: Room._STOKE_COOLDOWN,
			width: '80px',
			cost: { 'wood': 1 }
		}).appendTo('div#roomPanel');

		var sleepButton = new Button.Button({
			id: 'sleepButton',
			text: _('sleep'),
			click: Room.sleep,
			width: '80px'
		}).appendTo('div#roomPanel');
		sleepButton.hide();
		Button.setDisabled(sleepButton, true);

		// Create the stores container
		$('<div>').attr('id', 'storesContainer').prependTo('div#roomPanel');

		//subscribe to stateUpdates
		$.Dispatch('stateUpdate').subscribe(Room.handleStateUpdates);

		Room.updateButton();
		Room.updateStoresView();
		Room.updateIncomeView();
		Room.updateBuildButtons();

		Room._fireTimer = Engine.setTimeout(Room.coolFire, Room._FIRE_COOL_DELAY);
		Room._tempTimer = Engine.setTimeout(Room.adjustTemp, Room._ROOM_WARM_DELAY);

		/*
		 * Builder states:
		 * 0 - Approaching
		 * 1 - Collapsed
		 * 2 - Shivering
		 * 3 - Sleeping
		 * 4 - Helping
		 */
		if ($SM.get('game.builder.level') >= 0 && $SM.get('game.builder.level') < 3) {
			Room._builderTimer = Engine.setTimeout(Room.updateBuilderState, Room._BUILDER_STATE_DELAY);
		}
		if ($SM.get('game.builder.level') == 1 && $SM.get('stores.wood', true) < 0) {
			Engine.setTimeout(Room.unlockForest, Room._NEED_WOOD_DELAY);
		}
		Engine.setTimeout($SM.collectIncome, 1000);

		Notifications.notify(Room, _("the room is {0}", Room.TempEnum.fromInt($SM.get('game.temperature.value')).text));
		Notifications.notify(Room, _("the fire is {0}", Room.FireEnum.fromInt($SM.get('game.fire.value')).text));
	},

	options: {}, // Nothing for now

	onArrival: function (transition_diff) {
		Room.setTitle();
		if (Room.changed) {
			Notifications.notify(Room, _("the fire is {0}", Room.FireEnum.fromInt($SM.get('game.fire.value')).text));
			Notifications.notify(Room, _("the room is {0}", Room.TempEnum.fromInt($SM.get('game.temperature.value')).text));
			Room.changed = false;
		}
		if ($SM.get('game.builder.level') == 3) {
			$SM.add('game.builder.level', 1);
			$SM.setIncome('builder', {
				delay: 10,
				stores: { 'wood': 2 }
			});
			Room.updateIncomeView();
			Notifications.notify(Room, _("the stranger is standing by the fire. she says she can help. says she builds things."));
		}

		Engine.moveStoresView(null, transition_diff);

		Room.setMusic();
		Room.ensureStartVariantPreparation();
		Room.updateButton();
	},

	TempEnum: {
		fromInt: function (value) {
			for (var k in this) {
				if (typeof this[k].value != 'undefined' && this[k].value == value) {
					return this[k];
				}
			}
			return null;
		},
		Freezing: { value: 0, text: _('freezing') },
		Cold: { value: 1, text: _('cold') },
		Mild: { value: 2, text: _('mild') },
		Warm: { value: 3, text: _('warm') },
		Hot: { value: 4, text: _('hot') }
	},

	FireEnum: {
		fromInt: function (value) {
			for (var k in this) {
				if (typeof this[k].value != 'undefined' && this[k].value == value) {
					return this[k];
				}
			}
			return null;
		},
		Dead: { value: 0, text: _('dead') },
		Smoldering: { value: 1, text: _('smoldering') },
		Flickering: { value: 2, text: _('flickering') },
		Burning: { value: 3, text: _('burning') },
		Roaring: { value: 4, text: _('roaring') }
	},

	setTitle: function () {
		var title = $SM.get('game.fire.value') < 2 ? _("A Dark Room") : _("A Firelit Room");
		if (Engine.activeModule == this) {
			document.title = title;
		}
		$('div#location_room').text(title);
	},

	getStartVariant: function () {
		var variant = $SM.get('game.startVariant');
		if (variant === undefined || variant === null || variant === '') {
			variant = 'default';
			$SM.set('game.startVariant', variant);
		}
		return variant;
	},

	setStartVariant: function (variant) {
		var current = Room.getStartVariant();
		if (current === variant) {
			return;
		}
		$SM.set('game.startVariant', variant);
	},

	ensureStartVariantPreparation: function (variant) {
		var currentVariant = variant || Room.getStartVariant();
		if (currentVariant === 'magic' && !Room.startVariantPrepared) {
			Room.prepareMagicalPath();
		}
	},

	prepareMagicalPath: function () {
		if (Room.startVariantPrepared) {
			return;
		}
		Room.startVariantPrepared = true;
		$SM.set('game.magicPathPrepared', true);
		if (typeof Path !== 'undefined' && typeof Path.prepareMagicPath === 'function') {
			Path.prepareMagicPath();
		}
		Room.updateButton();
	},

	updateButton: function () {
		var light = $('#lightButton.button');
		var stoke = $('#stokeButton.button');
		var sleep = $('#sleepButton.button');
		var fireIsDead = $SM.get('game.fire.value') == Room.FireEnum.Dead.value;
		var startVariant = Room.getStartVariant();
		var shouldShowSleep = fireIsDead && startVariant === 'default' && !Room.startVariantPrepared;

		if (sleep.length) {
			if (shouldShowSleep) {
				sleep.show();
				Button.setDisabled(sleep, false);
			} else {
				Button.setDisabled(sleep, true);
				sleep.hide();
			}
		}

		if (fireIsDead && stoke.css('display') != 'none') {
			stoke.hide();
			light.show();
			if (stoke.hasClass('disabled')) {
				Button.cooldown(light);
			}
		} else if (light.css('display') != 'none') {
			stoke.show();
			light.hide();
			if (light.hasClass('disabled')) {
				Button.cooldown(stoke);
			}
		}

		if (!$SM.get('stores.wood')) {
			light.addClass('free');
			stoke.addClass('free');
		} else {
			light.removeClass('free');
			stoke.removeClass('free');
		}
	},
	_fireTimer: null,
	_tempTimer: null,
	sleep: function () {
		var sleepBtn = $('#sleepButton.button');
		if (!sleepBtn.length) {
			return;
		}
		if ($SM.get('game.fire.value') != Room.FireEnum.Dead.value) {
			return;
		}
		if (Room.getStartVariant() !== 'default' || Room.startVariantPrepared) {
			return;
		}
		Button.setDisabled(sleepBtn, true);
		sleepBtn.hide();
		Events.startEvent(Events.RoomMagicDream);
	},
	lightFire: function () {
		var wood = $SM.get('stores.wood');
		if (wood < 5) {
			Notifications.notify(Room, _("not enough wood to get the fire going"));
			Button.clearCooldown($('#lightButton.button'));
			return;
		} else if (wood > 4) {
			$SM.set('stores.wood', wood - 5);
		}
		$SM.set('game.fire', Room.FireEnum.Burning);
		AudioEngine.playSound(AudioLibrary.LIGHT_FIRE);
		Room.onFireChange();
	},

	stokeFire: function () {
		var wood = $SM.get('stores.wood');
		if (wood === 0) {
			Notifications.notify(Room, _("the wood has run out"));
			Button.clearCooldown($('#stokeButton.button'));
			return;
		}
		if (wood > 0) {
			$SM.set('stores.wood', wood - 1);
		}
		if ($SM.get('game.fire.value') < 4) {
			$SM.set('game.fire', Room.FireEnum.fromInt($SM.get('game.fire.value') + 1));
		}
		AudioEngine.playSound(AudioLibrary.STOKE_FIRE);
		Room.onFireChange();
	},

	onFireChange: function () {
		if (Engine.activeModule != Room) {
			Room.changed = true;
		}
		Notifications.notify(Room, _("the fire is {0}", Room.FireEnum.fromInt($SM.get('game.fire.value')).text), true);
		if ($SM.get('game.fire.value') > 1 && $SM.get('game.builder.level') < 0) {
			$SM.set('game.builder.level', 0);
			Notifications.notify(Room, _("the light from the fire spills from the windows, out into the dark"));
			Engine.setTimeout(Room.updateBuilderState, Room._BUILDER_STATE_DELAY);
		}
		window.clearTimeout(Room._fireTimer);
		Room._fireTimer = Engine.setTimeout(Room.coolFire, Room._FIRE_COOL_DELAY);
		Room.updateButton();
		Room.setTitle();

		// only update music if in the room
		if (Engine.activeModule == Room) {
			Room.setMusic();
		}
	},

	coolFire: function () {
		var wood = $SM.get('stores.wood');
		if ($SM.get('game.fire.value') <= Room.FireEnum.Flickering.value &&
			$SM.get('game.builder.level') > 3 && wood > 0) {
			Notifications.notify(Room, _("builder stokes the fire"), true);
			$SM.set('stores.wood', wood - 1);
			$SM.set('game.fire', Room.FireEnum.fromInt($SM.get('game.fire.value') + 1));
		}
		if ($SM.get('game.fire.value') > 0) {
			$SM.set('game.fire', Room.FireEnum.fromInt($SM.get('game.fire.value') - 1));
			Room._fireTimer = Engine.setTimeout(Room.coolFire, Room._FIRE_COOL_DELAY);
			Room.onFireChange();
		}
	},

	adjustTemp: function () {
		var old = $SM.get('game.temperature.value');
		if ($SM.get('game.temperature.value') > 0 && $SM.get('game.temperature.value') > $SM.get('game.fire.value')) {
			$SM.set('game.temperature', Room.TempEnum.fromInt($SM.get('game.temperature.value') - 1));
			Notifications.notify(Room, _("the room is {0}", Room.TempEnum.fromInt($SM.get('game.temperature.value')).text), true);
		}
		if ($SM.get('game.temperature.value') < 4 && $SM.get('game.temperature.value') < $SM.get('game.fire.value')) {
			$SM.set('game.temperature', Room.TempEnum.fromInt($SM.get('game.temperature.value') + 1));
			Notifications.notify(Room, _("the room is {0}", Room.TempEnum.fromInt($SM.get('game.temperature.value')).text), true);
		}
		if ($SM.get('game.temperature.value') != old) {
			Room.changed = true;
		}
		Room._tempTimer = Engine.setTimeout(Room.adjustTemp, Room._ROOM_WARM_DELAY);
	},

        unlockForest: function () {
                $SM.set('stores.wood', 4);
                var variant = 'default';
                if (typeof Engine !== 'undefined' && typeof Engine.determineStartVariant === 'function') {
                        variant = Engine.determineStartVariant();
                } else {
                        variant = Room.getStartVariant();
                }

                if (typeof Engine !== 'undefined' && typeof Engine.initializeStartLocations === 'function') {
                        Engine.initializeStartLocations(variant);
                } else if (variant === 'magic' && typeof Outside.initMagicStart === 'function') {
                        Outside.initMagicStart();
                } else {
                        Outside.init();
                }
                Notifications.notify(Room, _("the wind howls outside"));
                Notifications.notify(Room, _("the wood is running out"));
                Engine.event('progress', 'outside');
        },

	updateBuilderState: function () {
		var lBuilder = $SM.get('game.builder.level');
		if (lBuilder === 0) {
			Notifications.notify(Room, _("a ragged stranger stumbles through the door and collapses in the corner"));
			lBuilder = $SM.setget('game.builder.level', 1);
			Engine.setTimeout(Room.unlockForest, Room._NEED_WOOD_DELAY);
		}
		else if (lBuilder < 3 && $SM.get('game.temperature.value') >= Room.TempEnum.Warm.value) {
			var msg = "";
			switch (lBuilder) {
				case 1:
					msg = _("the stranger shivers, and mumbles quietly. her words are unintelligible.");
					break;
				case 2:
					msg = _("the stranger in the corner stops shivering. her breathing calms.");
					break;
			}
			Notifications.notify(Room, msg);
			if (lBuilder < 3) {
				lBuilder = $SM.setget('game.builder.level', lBuilder + 1);
			}
		}
		if (lBuilder < 3) {
			Engine.setTimeout(Room.updateBuilderState, Room._BUILDER_STATE_DELAY);
		}
		Engine.saveGame();
	},

	updateStoresView: function () {
		var stores = $('div#stores');
		var resources = $('div#resources');
		var special = $('div#special');
		var weapons = $('div#weapons');
		var needsAppend = false, rNeedsAppend = false, sNeedsAppend = false, wNeedsAppend = false, newRow = false;
                if (stores.length === 0) {
                        stores = $('<div>').attr({
                                'id': 'stores'
                        }).css('opacity', 0);
                        needsAppend = true;
                }
                stores.attr('data-legend', Room.getSectionLabel('stores', _('stores')));
		if (resources.length === 0) {
			resources = $('<div>').attr({
				id: 'resources'
			}).css('opacity', 0);
			rNeedsAppend = true;
		}
		if (special.length === 0) {
			special = $('<div>').attr({
				id: 'special'
			}).css('opacity', 0);
			sNeedsAppend = true;
		}
                if (weapons.length === 0) {
                        weapons = $('<div>').attr({
                                'id': 'weapons'
                        }).css('opacity', 0);
                        wNeedsAppend = true;
                }
                weapons.attr('data-legend', Room.getSectionLabel('weapons', _('weapons')));
		for (var k in $SM.get('stores')) {

			if (k.indexOf('blueprint') > 0) {
				// don't show blueprints
				continue;
			}

                        const good =
        Room.Craftables[k] ||
        Room.TradeGoods[k] ||
        Room.MiscItems[k] ||
        Fabricator.Craftables[k];
      const type = good ? good.type : null;

			var location;
			switch (type) {
				case 'upgrade':
					// Don't display upgrades on the Room screen
					continue;
				case 'building':
					// Don't display buildings either
					continue;
				case 'weapon':
					location = weapons;
					break;
				case 'special':
					location = special;
					break;
				default:
					location = resources;
					break;
			}

			var id = "row_" + k.replace(/ /g, '-');
			var row = $('div#' + id, location);
			var num = $SM.get('stores["' + k + '"]');

			if (typeof num != 'number' || isNaN(num)) {
				// No idea how counts get corrupted, but I have reason to believe that they occassionally do.
				// Build a little fence around it!
				num = 0;
				$SM.set('stores["' + k + '"]', 0);
			}

                        var lk = Room.getDisplayName(k);

			// thieves?
			if (typeof $SM.get('game.thieves') == 'undefined' && num > 5000 && $SM.get('features.location.world')) {
				$SM.startThieves();
			}

			if (row.length === 0) {
				row = $('<div>').attr('id', id).addClass('storeRow');
                                $('<div>').addClass('row_key').text(lk).appendTo(row);
				$('<div>').addClass('row_val').text(Math.floor(num)).appendTo(row);
				$('<div>').addClass('clear').appendTo(row);
				var curPrev = null;
				location.children().each(function (i) {
					var child = $(this);
                                        var cName = child.children('.row_key').text();
                                        if (cName < lk) {
                                                curPrev = child.attr('id');
                                        }
				});
				if (curPrev == null) {
					row.prependTo(location);
				} else {
					row.insertAfter(location.find('#' + curPrev));
				}
				newRow = true;
			} else {
                                $('div#' + row.attr('id') + ' > div.row_key', location).text(Room.getDisplayName(k));
                                $('div#' + row.attr('id') + ' > div.row_val', location).text(Math.floor(num));
			}
		}

		if (rNeedsAppend && resources.children().length > 0) {
			resources.prependTo(stores);
			resources.animate({ opacity: 1 }, 300, 'linear');
		}

		if (sNeedsAppend && special.children().length > 0) {
			special.appendTo(stores);
			special.animate({ opacity: 1 }, 300, 'linear');
		}

		if (needsAppend && stores.find('div.storeRow').length > 0) {
			stores.appendTo('div#storesContainer');
			stores.animate({ opacity: 1 }, 300, 'linear');
		}

		if (wNeedsAppend && weapons.children().length > 0) {
			weapons.appendTo('div#storesContainer');
			weapons.animate({ opacity: 1 }, 300, 'linear');
		}

		if (newRow) {
			Room.updateIncomeView();
		}

		if ($("div#outsidePanel").length) {
			Outside.updateVillage();
		}

		if ($SM.get('stores.compass') && !Room.pathDiscovery) {
			Room.pathDiscovery = true;
			Path.openPath();
		}
	},

	updateIncomeView: function () {
		var stores = $('div#resources');
		var totalIncome = {};
		if (stores.length === 0 || typeof $SM.get('income') == 'undefined') return;
		$('div.storeRow', stores).each(function (index, el) {
			el = $(el);
			$('div.tooltip', el).remove();
			var ttPos = index > 10 ? 'top right' : 'bottom right';
			var tt = $('<div>').addClass('tooltip ' + ttPos);
			var storeName = el.attr('id').substring(4).replace('-', ' ');
			for (var incomeSource in $SM.get('income')) {
				var income = $SM.get('income["' + incomeSource + '"]');
				for (var store in income.stores) {
					if (store == storeName && income.stores[store] !== 0) {
                                                var incomeLabel = _(incomeSource);
                                                if (typeof Outside !== 'undefined' && typeof Outside.getWorkerDisplayName === 'function') {
                                                        incomeLabel = Outside.getWorkerDisplayName(incomeSource);
                                                }
                                                $('<div>').addClass('row_key').text(incomeLabel).appendTo(tt);
						$('<div>')
							.addClass('row_val')
							.text(Engine.getIncomeMsg(income.stores[store], income.delay))
							.appendTo(tt);
						if (!totalIncome[store] || totalIncome[store].income === undefined) {
							totalIncome[store] = { income: 0 };
						}
						totalIncome[store].income += Number(income.stores[store]);
						totalIncome[store].delay = income.delay;
					}
				}
			}
			if (tt.children().length > 0) {
				var total = totalIncome[storeName].income;
				$('<div>').addClass('total row_key').text(_('total')).appendTo(tt);
				$('<div>').addClass('total row_val').text(Engine.getIncomeMsg(total, totalIncome[storeName].delay)).appendTo(tt);
				tt.appendTo(el);
			}
		});
	},

	buy: function (buyBtn) {
		var thing = $(buyBtn).attr('buildThing');
		var good = Room.TradeGoods[thing];
		var numThings = $SM.get('stores["' + thing + '"]', true);
		if (numThings < 0) numThings = 0;
		if (good.maximum <= numThings) {
			return;
		}

		var storeMod = {};
		var cost = good.cost();
		for (var k in cost) {
			var have = $SM.get('stores["' + k + '"]', true);
                        if (have < cost[k]) {
                                Notifications.notify(Room, _('not enough {0}', Room.getResourceLabel(k)));
                                return false;
                        } else {
                                storeMod[k] = have - cost[k];
			}
		}
		$SM.setM('stores', storeMod);

		Notifications.notify(Room, good.buildMsg);

		$SM.add('stores["' + thing + '"]', 1);

		// audio
		AudioEngine.playSound(AudioLibrary.BUY);
	},

	build: function (buildBtn) {
		var thing = $(buildBtn).attr('buildThing');
		if ($SM.get('game.temperature.value') <= Room.TempEnum.Cold.value) {
			Notifications.notify(Room, _("builder just shivers"));
			return false;
		}
		var craftable = Room.Craftables[thing];

		var numThings = 0;
		switch (craftable.type) {
			case 'good':
			case 'weapon':
			case 'tool':
			case 'upgrade':
				numThings = $SM.get('stores["' + thing + '"]', true);
				break;
			case 'building':
				numThings = $SM.get('game.buildings["' + thing + '"]', true);
				break;
		}

		if (numThings < 0) numThings = 0;
		if (craftable.maximum <= numThings) {
			return;
		}

		var storeMod = {};
		var cost = craftable.cost();
		for (var k in cost) {
			var have = $SM.get('stores["' + k + '"]', true);
                        if (have < cost[k]) {
                                Notifications.notify(Room, _('not enough {0}', Room.getResourceLabel(k)));
                                return false;
                        } else {
                                storeMod[k] = have - cost[k];
			}
		}
		$SM.setM('stores', storeMod);

                var buildMsg = Room.getCraftableText(thing, 'buildMsg');
                if (buildMsg) {
                        Notifications.notify(Room, buildMsg);
                }

		switch (craftable.type) {
			case 'good':
			case 'weapon':
			case 'upgrade':
			case 'tool':
				$SM.add('stores["' + thing + '"]', 1);
				break;
			case 'building':
				$SM.add('game.buildings["' + thing + '"]', 1);
				break;
		}

		// audio
		switch (craftable.type) {
			case 'weapon':
			case 'upgrade':
			case 'tool':
				AudioEngine.playSound(AudioLibrary.CRAFT);
				break;
			case 'building':
				AudioEngine.playSound(AudioLibrary.BUILD);
				break;
		}
	},

	needsWorkshop: function (type) {
		return type == 'weapon' || type == 'upgrade' || type == 'tool';
	},

	craftUnlocked: function (thing) {
		if (Room.buttons[thing]) {
			return true;
		}
		if ($SM.get('game.builder.level') < 4) return false;
		var craftable = Room.Craftables[thing];
		if (Room.needsWorkshop(craftable.type) && $SM.get('game.buildings["' + 'workshop' + '"]', true) === 0) return false;
		var cost = craftable.cost();

		//show button if one has already been built
		if ($SM.get('game.buildings["' + thing + '"]') > 0) {
			Room.buttons[thing] = true;
			return true;
		}
		// Show buttons if we have at least 1/2 the wood, and all other components have been seen.
		if ($SM.get('stores.wood', true) < cost['wood'] * 0.5) {
			return false;
		}
		for (var c in cost) {
			if (!$SM.get('stores["' + c + '"]')) {
				return false;
			}
		}

		Room.buttons[thing] = true;
		//don't notify if it has already been built before
                if (!$SM.get('game.buildings["' + thing + '"]')) {
                        var availableMsg = Room.getCraftableText(thing, 'availableMsg');
                        if (availableMsg) {
                                Notifications.notify(Room, availableMsg);
                        }
                }
		return true;
	},

	buyUnlocked: function (thing) {
		if (Room.buttons[thing]) {
			return true;
		} else if ($SM.get('game.buildings["trading post"]', true) > 0) {
			if (thing == 'compass' || typeof $SM.get('stores["' + thing + '"]') != 'undefined') {
				// Allow the purchase of stuff once you've seen it
				return true;
			}
		}
		return false;
	},

	updateBuildButtons: function () {
                var buildSection = $('#buildBtns');
                var needsAppend = false;
                var buildLegend = Room.getSectionLabel('build', _('build:'));
                if (buildSection.length === 0) {
                        buildSection = $('<div>').attr({ 'id': 'buildBtns' }).css('opacity', 0);
                        needsAppend = true;
                }
                buildSection.attr('data-legend', buildLegend);

                var craftSection = $('#craftBtns');
                var cNeedsAppend = false;
                var craftLegend = Room.getSectionLabel('craft', _('craft:'));
                if (craftSection.length === 0 && $SM.get('game.buildings["workshop"]', true) > 0) {
                        craftSection = $('<div>').attr({ 'id': 'craftBtns' }).css('opacity', 0);
                        cNeedsAppend = true;
                }
                if (craftSection.length > 0) {
                        craftSection.attr('data-legend', craftLegend);
                }

                var buySection = $('#buyBtns');
                var bNeedsAppend = false;
                var buyLegend = Room.getSectionLabel('buy', _('buy:'));
                if (buySection.length === 0 && $SM.get('game.buildings["trading post"]', true) > 0) {
                        buySection = $('<div>').attr({ 'id': 'buyBtns' }).css('opacity', 0);
                        bNeedsAppend = true;
                }
                if (buySection.length > 0) {
                        buySection.attr('data-legend', buyLegend);
                }

		for (var k in Room.Craftables) {
			craftable = Room.Craftables[k];
			var max = $SM.num(k, craftable) + 1 > craftable.maximum;
			if (craftable.button == null) {
				if (Room.craftUnlocked(k)) {
					var loc = Room.needsWorkshop(craftable.type) ? craftSection : buildSection;
                                        craftable.button = new Button.Button({
                                                id: 'build_' + k.replace(/ /g, '-'),
                                                cost: craftable.cost(),
                                                text: Room.getCraftableName(k),
                                                click: Room.build,
                                                width: '80px',
                                                ttPos: loc.children().length > 10 ? 'top right' : 'bottom right'
                                        }).css('opacity', 0).attr('buildThing', k).appendTo(loc).animate({ opacity: 1 }, 300, 'linear');
                                        var newCostTooltip = $('.tooltip', craftable.button);
                                        if (newCostTooltip.length) {
                                                newCostTooltip.empty();
                                                var newCost = craftable.cost();
                                                for (var nc in newCost) {
                                                        $('<div>').addClass('row_key').text(Room.getResourceLabel(nc)).appendTo(newCostTooltip);
                                                        $('<div>').addClass('row_val').text(newCost[nc]).appendTo(newCostTooltip);
                                                }
                                        }
                                }
                        } else {
                                var buttonTextNode = craftable.button.contents().filter(function () {
                                        return this.nodeType === 3;
                                }).first();
                                if (buttonTextNode.length) {
                                        buttonTextNode[0].nodeValue = Room.getCraftableName(k);
                                }
                                // refresh the tooltip
                                var costTooltip = $('.tooltip', craftable.button);
                                costTooltip.empty();
                                var cost = craftable.cost();
                                for (var c in cost) {
                                        $("<div>").addClass('row_key').text(Room.getResourceLabel(c)).appendTo(costTooltip);
                                        $("<div>").addClass('row_val').text(cost[c]).appendTo(costTooltip);
                                }
                                if (max && !craftable.button.hasClass('disabled')) {
                                        var maxMsg = Room.getCraftableText(k, 'maxMsg');
                                        if (maxMsg) {
                                                Notifications.notify(Room, maxMsg);
                                        }
                                }
                        }
                        if (max) {
                                Button.setDisabled(craftable.button, true);
                        } else {
				Button.setDisabled(craftable.button, false);
			}
		}

		for (var g in Room.TradeGoods) {
			good = Room.TradeGoods[g];
			var goodsMax = $SM.num(g, good) + 1 > good.maximum;
			if (good.button == null) {
				if (Room.buyUnlocked(g)) {
                                        good.button = new Button.Button({
                                                id: 'build_' + g,
                                                cost: good.cost(),
                                                text: Room.getDisplayName(g),
                                                click: Room.buy,
                                                width: '80px',
                                                ttPos: buySection.children().length > 10 ? 'top right' : 'bottom right'
                                        }).css('opacity', 0).attr('buildThing', g).appendTo(buySection).animate({ opacity: 1 }, 300, 'linear');
                                        var newGoodsTooltip = $('.tooltip', good.button);
                                        if (newGoodsTooltip.length) {
                                                newGoodsTooltip.empty();
                                                var baseCost = good.cost();
                                                for (var bc in baseCost) {
                                                        $('<div>').addClass('row_key').text(Room.getResourceLabel(bc)).appendTo(newGoodsTooltip);
                                                        $('<div>').addClass('row_val').text(baseCost[bc]).appendTo(newGoodsTooltip);
                                                }
                                        }
                                }
                        } else {
                                var goodTextNode = good.button.contents().filter(function () {
                                        return this.nodeType === 3;
                                }).first();
                                if (goodTextNode.length) {
                                        goodTextNode[0].nodeValue = Room.getDisplayName(g);
                                }
                                // refresh the tooltip
                                var goodsCostTooltip = $('.tooltip', good.button);
                                goodsCostTooltip.empty();
                                var goodCost = good.cost();
                                for (var gc in goodCost) {
                                        $("<div>").addClass('row_key').text(Room.getResourceLabel(gc)).appendTo(goodsCostTooltip);
                                        $("<div>").addClass('row_val').text(goodCost[gc]).appendTo(goodsCostTooltip);
                                }
                                if (goodsMax && !good.button.hasClass('disabled')) {
                                        Notifications.notify(Room, good.maxMsg);
                                }
			}
			if (goodsMax) {
				Button.setDisabled(good.button, true);
			} else {
				Button.setDisabled(good.button, false);
			}
		}

		if (needsAppend && buildSection.children().length > 0) {
			buildSection.appendTo('div#roomPanel').animate({ opacity: 1 }, 300, 'linear');
		}
		if (cNeedsAppend && craftSection.children().length > 0) {
			craftSection.appendTo('div#roomPanel').animate({ opacity: 1 }, 300, 'linear');
		}
		if (bNeedsAppend && buildSection.children().length > 0) {
			buySection.appendTo('div#roomPanel').animate({ opacity: 1 }, 300, 'linear');
		}
	},

	compassTooltip: function (direction) {
		var ttPos = $('div#resources').children().length > 10 ? 'top right' : 'bottom right';
		var tt = $('<div>').addClass('tooltip ' + ttPos);
		$('<div>').addClass('row_key').text(_('the compass points ' + direction)).appendTo(tt);
		tt.appendTo($('#row_compass'));
	},

	handleStateUpdates: function (e) {
		if (e.category == 'stores') {
			Room.updateStoresView();
			Room.updateBuildButtons();
		} else if (e.category == 'income') {
			Room.updateStoresView();
			Room.updateIncomeView();
		} else if (e.stateName.indexOf('game.buildings') === 0) {
			Room.updateBuildButtons();
		} else if (e.stateName === 'game.startVariant') {
			Room.ensureStartVariantPreparation();
			Room.updateButton();
		} else if (e.stateName === 'game.magicPathPrepared') {
			Room.startVariantPrepared = Boolean($SM.get('game.magicPathPrepared'));
			Room.updateButton();
		}
	},

	setMusic() {
		// set music based on fire level
		var fireValue = $SM.get('game.fire.value');
		switch (fireValue) {
			case 0:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_DEAD);
				break;
			case 1:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_SMOLDERING);
				break;
			case 2:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_FLICKERING);
				break;
			case 3:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_BURNING);
				break;
			case 4:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_ROARING);
				break;
		}
	}
};
