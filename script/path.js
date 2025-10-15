var Path = {
        DEFAULT_BAG_SPACE: 10,
        _STORES_OFFSET: 0,
        // Everything not in this list weighs 1
        Weight: {
                'bone spear': 2,
                'iron sword': 3,
                'steel sword': 5,
                'rifle': 5,
                'bullets': 0.1,
                'energy cell': 0.2,
                'laser rifle': 5,
    'plasma rifle': 5,
                'bolas': 0.5,
        },
        themeVariants: {
                default: {
                        outfittingLegend: _('supplies:'),
                        armourRowLabel: _('armour'),
                        armourLabels: {
                                none: _('none'),
                                'kinetic armour': _('kinetic'),
                                's armour': _('steel'),
                                'i armour': _('iron'),
                                'l armour': _('leather')
                        },
                        displayNames: {},
                        weightAliases: {}
                },
                magic: {
                        outfittingLegend: _('ritual kit:'),
                        armourRowLabel: _('wards'),
                        armourLabels: {
                                none: _('none'),
                                'kinetic armour': _('aegis field'),
                                's armour': _('starsteel shell'),
                                'i armour': _('meteoric mail'),
                                'l armour': _('warded leathers')
                        },
                        displayNames: {
                                'laser rifle': _('sunshard rifle')
                        },
                        weightAliases: {
                                'witchlight torch': 'torch',
                                'crystal phial': 'waterskin',
                                'starlit cask': 'cask',
                                'everflow tank': 'water tank',
                                'spiritthorn spear': 'bone spear',
                                'runed rucksack': 'rucksack',
                                'levitation wagon': 'wagon',
                                'astral convoy': 'convoy',
                                'warded leathers': 'l armour',
                                'meteoric mail': 'i armour',
                                'starsteel plate': 's armour',
                                'meteoric blade': 'iron sword',
                                'starsteel blade': 'steel sword',
                                'echo rifle': 'rifle',
                                'sunshard rifle': 'laser rifle',
                                'arcane rounds': 'bullets',
                                'mana battery': 'energy cell',
                                'binding orbs': 'bolas',
                                'volatile orb': 'grenade',
                                'spellblade': 'bayonet',
                                'eldritch alloy': 'alien alloy',
                                'mending draught': 'medicine',
                                'astral jerky': 'cured meat'
                        }
                }
        },

        name: 'Path',
        options: {
                startVariant: 'default'
        }, // Nuthin'
        startVariant: 'default',
        tab: null,
        panel: null,
        getVariantData: function () {
                var variant = Path.startVariant || Path.options.startVariant || 'default';
                return Path.themeVariants[variant] || Path.themeVariants.default;
        },
        getOutfittingLegend: function () {
                var data = Path.getVariantData();
                return data.outfittingLegend || _('supplies:');
        },
        getGearDisplayName: function (key, fallback) {
                var data = Path.getVariantData();
                if (data.displayNames && data.displayNames[key]) {
                        return data.displayNames[key];
                }
                if (typeof Room !== 'undefined' && typeof Room.getDisplayName === 'function') {
                        return Room.getDisplayName(key);
                }
                if (fallback) {
                        return fallback;
                }
                return _(key);
        },
        getArmourRowLabel: function () {
                var data = Path.getVariantData();
                return data.armourRowLabel || _('armour');
        },
        getArmourLabel: function (key) {
                var data = Path.getVariantData();
                if (data.armourLabels && data.armourLabels[key]) {
                        return data.armourLabels[key];
                }
                if (key === 'none') {
                        return _('none');
                }
                if (typeof Room !== 'undefined' && typeof Room.getDisplayName === 'function') {
                        return Room.getDisplayName(key);
                }
                return _(key);
        },
        resolveWeightKey: function (thing) {
                var data = Path.getVariantData();
                if (data.weightAliases && data.weightAliases[thing]) {
                        return data.weightAliases[thing];
                }
                return thing;
        },
        resolveStartVariant: function (variant) {
                return variant === 'magic' ? 'magic' : 'default';
        },
        getLocationLabel: function (variant) {
                if (variant === 'magic') {
                        return _('A Luminous Path');
                }
                return _('A Dusty Path');
        },
        applyStartVariantTheme: function (variant) {
                var normalized = Path.resolveStartVariant(variant);
                Path.startVariant = normalized;
                Path.options = Path.options || {};
                Path.options.startVariant = normalized;

                if (Path.tab && Path.tab.length) {
                        Path.tab.text(Path.getLocationLabel(normalized));
                }

                if (Path.panel && Path.panel.length) {
                        Path.panel.toggleClass('magic-start', normalized === 'magic');
                }
                var outfitting = $('#outfitting');
                if (outfitting.length) {
                        outfitting.attr('data-legend', Path.getOutfittingLegend());
                }
        },
        initMagicStart: function (options) {
                options = options || {};
                options.startVariant = 'magic';
                if (Path.panel && Path.panel.length) {
                        Path.applyStartVariantTheme('magic');
                        return;
                }
                Path.init(options);
        },
        init: function(options) {
                this.options = $.extend(
                        this.options,
                        options
                );

                var variant = Path.resolveStartVariant(this.options.startVariant);
                Path.options.startVariant = variant;
                Path.startVariant = variant;

                // Init the World
                World.init();

                // Create the path tab
                this.tab = Header.addLocation(Path.getLocationLabel(variant), "path", Path);
                Path.tab = this.tab;

                // Create the Path panel
                this.panel = $('<div>').attr('id', "pathPanel")
                        .addClass('location')
                        .appendTo('div#locationSlider');
                Path.panel = this.panel;
                if (variant === 'magic') {
                        this.panel.addClass('magic-start');
                }

                this.scroller = $('<div>').attr('id', 'pathScroller').appendTo(this.panel);

                // Add the outfitting area
                var outfittingLegend = Path.getOutfittingLegend();
                var outfitting = $('<div>').attr({'id': 'outfitting'}).appendTo(this.scroller);
                outfitting.attr('data-legend', outfittingLegend);
		$('<div>').attr('id', 'bagspace').appendTo(outfitting);
		
		// Add the embark button
		new Button.Button({
			id: 'embarkButton',
			text: _("embark"),
			click: Path.embark,
			width: '80px',
			cooldown: World.DEATH_COOLDOWN
		}).appendTo(this.scroller);
		
		Path.outfit = $SM.get('outfit');
		
		Engine.updateSlider();
		
		//subscribe to stateUpdates
                $.Dispatch('stateUpdate').subscribe(Path.handleStateUpdates);
        },

        openPath: function() {
                var variant = 'default';
                if (typeof Engine !== 'undefined' && typeof Engine.determineStartVariant === 'function') {
                        variant = Engine.determineStartVariant();
                } else if (typeof Room !== 'undefined' && typeof Room.getStartVariant === 'function') {
                        variant = Room.getStartVariant();
                }

                if (typeof Engine !== 'undefined' && typeof Engine.initializeStartLocations === 'function') {
                        Engine.initializeStartLocations(variant);
                } else if (variant === 'magic' && typeof Path.initMagicStart === 'function') {
                        Path.initMagicStart();
                } else {
                        Path.init();
                }
                Engine.event('progress', 'path');
                Notifications.notify(Room, _('the compass points ' + World.dir));
        },
	
        getWeight: function(thing) {
                var lookupKey = Path.resolveWeightKey(thing);
                var w = Path.Weight[lookupKey];
                if(typeof w != 'number') w = 1;

                return w;
        },
	
	getCapacity: function() {
		if($SM.get('stores["cargo drone"]', true) > 0) {
			return Path.DEFAULT_BAG_SPACE + 100;
		} else if($SM.get('stores.convoy', true) > 0) {
			return Path.DEFAULT_BAG_SPACE + 60;
		} else if($SM.get('stores.wagon', true) > 0) {
			return Path.DEFAULT_BAG_SPACE + 30;
		} else if($SM.get('stores.rucksack', true) > 0) {
			return Path.DEFAULT_BAG_SPACE + 10;
		}
		return Path.DEFAULT_BAG_SPACE;
	},
	
	getFreeSpace: function() {
		var num = 0;
		if(Path.outfit) {
			for(var k in Path.outfit) {
				var n = Path.outfit[k];
				if(isNaN(n)) {
					// No idea how this happens, but I will fix it here!
					Path.outfit[k] = n = 0;
				}
				num += n * Path.getWeight(k);
			}
		}
		return Path.getCapacity() - num;
	},
	
	updatePerks: function(ignoreStores) {
		if($SM.get('character.perks')) {
			var perks = $('#perks');
			var needsAppend = false;
			if(perks.length === 0) {
				needsAppend = true;
				perks = $('<div>').attr({'id': 'perks', 'data-legend': _('perks')});
			}
			for(var k in $SM.get('character.perks')) {
				var id = 'perk_' + k.replace(' ', '-');
				var r = $('#' + id);
				if($SM.get('character.perks["'+k+'"]') && r.length === 0) {
					r = $('<div>').attr('id', id).addClass('perkRow').appendTo(perks);
					$('<div>').addClass('row_key').text(_(k)).appendTo(r);
					$('<div>').addClass('tooltip bottom right').text(Engine.Perks[k].desc).appendTo(r);
				}
			}
			
			if(needsAppend && perks.children().length > 0) {
				perks.prependTo(Path.panel);
			}
			
			if(!ignoreStores && Engine.activeModule === Path) {
				$('#storesContainer').css({top: perks.height() + 26 + Path._STORES_OFFSET + 'px'});
			}
		}
	},
	
	updateOutfitting: function() {
		var outfit = $('div#outfitting');
		
		if(!Path.outfit) {
			Path.outfit = {};
		}
		
		// Add the armour row
                var armour = Path.getArmourLabel('none');
    if($SM.get('stores["kinetic armour"]', true) > 0)
                        armour = Path.getArmourLabel('kinetic armour');
                else if($SM.get('stores["s armour"]', true) > 0)
                        armour = Path.getArmourLabel('s armour');
                else if($SM.get('stores["i armour"]', true) > 0)
                        armour = Path.getArmourLabel('i armour');
                else if($SM.get('stores["l armour"]', true) > 0)
                        armour = Path.getArmourLabel('l armour');
                var aRow = $('#armourRow');
                if(aRow.length === 0) {
                        aRow = $('<div>').attr('id', 'armourRow').addClass('outfitRow').prependTo(outfit);
                        $('<div>').addClass('row_key').text(Path.getArmourRowLabel()).appendTo(aRow);
                        $('<div>').addClass('row_val').text(armour).appendTo(aRow);
                        $('<div>').addClass('clear').appendTo(aRow);
                } else {
                        $('.row_key', aRow).text(Path.getArmourRowLabel());
                        $('.row_val', aRow).text(armour);
                }

                // Add the water row
                var wRow = $('#waterRow');
                if(wRow.length === 0) {
                        wRow = $('<div>').attr('id', 'waterRow').addClass('outfitRow').insertAfter(aRow);
                        $('<div>').addClass('row_key').text(Room.getResourceLabel('water')).appendTo(wRow);
                        $('<div>').addClass('row_val').text(World.getMaxWater()).appendTo(wRow);
                        $('<div>').addClass('clear').appendTo(wRow);
                } else {
                        $('.row_key', wRow).text(Room.getResourceLabel('water'));
                        $('.row_val', wRow).text(World.getMaxWater());
                }
		
		var space = Path.getFreeSpace();
		var currentBagCapacity = 0;
		// Add the non-craftables to the craftables
		var carryable = $.extend({
			'cured meat': { type: 'tool', desc: _('restores') + ' ' + World.MEAT_HEAL + ' ' + _('hp') },
			'bullets': { type: 'tool', desc: _('use with rifle') },
			'grenade': {type: 'weapon' },
			'bolas': {type: 'weapon' },
			'laser rifle': {type: 'weapon' },
			'energy cell': {type: 'tool', desc: _('emits a soft red glow') },
			'bayonet': {type: 'weapon' },
			'charm': {type: 'tool'},
			'alien alloy': { type: 'tool' },
			'medicine': {type: 'tool', desc: _('restores') + ' ' + World.MEDS_HEAL + ' ' + _('hp') }
		}, Room.Craftables, Fabricator.Craftables);
		
                for(var k in carryable) {
                        var store = carryable[k];
                        var displayName = Path.getGearDisplayName(k, store.name);
                        var lk = displayName;
                        var storeData = $.extend({}, store, { name: displayName });
                        var have = $SM.get('stores["'+k+'"]');
                        var num = Path.outfit[k];
                        num = typeof num == 'number' ? num : 0;
                        if (have !== undefined) {
                                if (have < num) { num = have; }
                                $SM.set(k, num, true);
                        }

                        var row = $('div#outfit_row_' + k.replace(' ', '-'), outfit);
                        if((store.type == 'tool' || store.type == 'weapon') && have > 0) {
                                currentBagCapacity += num * Path.getWeight(k);
                                if(row.length === 0) {
                                        row = Path.createOutfittingRow(k, num, storeData);

                                        var curPrev = null;
                                        outfit.children().each(function(i) {
                                                var child = $(this);
                                                if(child.attr('id').indexOf('outfit_row_') === 0) {
							var cName = child.children('.row_key').text();
							if(cName < lk) {
								curPrev = child.attr('id');
							}
						}
					});
                                        if(curPrev == null) {
                                                row.insertAfter(wRow);
                                        } else {
                                                row.insertAfter(outfit.find('#' + curPrev));
                                        }
                                } else {
                                        $('div#' + row.attr('id') + ' > div.row_key', outfit).text(displayName);
                                        $('div#' + row.attr('id') + ' > div.row_val > span', outfit).text(num);
                                        $('div#' + row.attr('id') + ' .tooltip .numAvailable', outfit).text(have - num);
                                }
				if(num === 0) {
					$('.dnBtn', row).addClass('disabled');
					$('.dnManyBtn', row).addClass('disabled');
				} else {
					$('.dnBtn', row).removeClass('disabled');
					$('.dnManyBtn', row).removeClass('disabled');
				}
				if(num == have || space < Path.getWeight(k)) {
					$('.upBtn', row).addClass('disabled');
					$('.upManyBtn', row).addClass('disabled');
				} else {
					$('.upBtn', row).removeClass('disabled');
					$('.upManyBtn', row).removeClass('disabled');
				}
			} else if(have === 0 && row.length > 0) {
				row.remove();
			}
		}

		Path.updateBagSpace(currentBagCapacity);

	},

	updateBagSpace: function(currentBagCapacity) {
		// Update bagspace
		$('#bagspace').text(_('free {0}/{1}', Math.floor(Path.getCapacity() - currentBagCapacity) , Path.getCapacity()));

		if(Path.outfit['cured meat'] > 0) {
			Button.setDisabled($('#embarkButton'), false);
		} else {
			Button.setDisabled($('#embarkButton'), true);
		}

	},
	
	createOutfittingRow: function(key, num, store) {
		if(!store.name) store.name = _(key);
		var row = $('<div>').attr('id', 'outfit_row_' + key.replace(' ', '-')).addClass('outfitRow').attr('key',key);
		$('<div>').addClass('row_key').text(store.name).appendTo(row);
		var val = $('<div>').addClass('row_val').appendTo(row);
		
		$('<span>').text(num).appendTo(val);
		$('<div>').addClass('upBtn').appendTo(val).click([1], Path.increaseSupply);
		$('<div>').addClass('dnBtn').appendTo(val).click([1], Path.decreaseSupply);
		$('<div>').addClass('upManyBtn').appendTo(val).click([10], Path.increaseSupply);
		$('<div>').addClass('dnManyBtn').appendTo(val).click([10], Path.decreaseSupply);
		$('<div>').addClass('clear').appendTo(row);
		
		var numAvailable = $SM.get('stores["'+key+'"]', true);
		var tt = $('<div>').addClass('tooltip bottom right').appendTo(row);

		if(store.type == 'weapon') {
			$('<div>').addClass('row_key').text(_('damage')).appendTo(tt);
			$('<div>').addClass('row_val').text(World.getDamage(key)).appendTo(tt);
		} else if(store.type == 'tool' && store.desc != "undefined") {
			$('<div>').addClass('row_key').text(store.desc).appendTo(tt);
		}

		$('<div>').addClass('row_key').text(_('weight')).appendTo(tt);
		$('<div>').addClass('row_val').text(Path.getWeight(key)).appendTo(tt);
		$('<div>').addClass('row_key').text(_('available')).appendTo(tt);
		$('<div>').addClass('row_val').addClass('numAvailable').text(numAvailable).appendTo(tt);
		
		return row;
	},
	
	increaseSupply: function(btn) {
		var supply = $(this).closest('.outfitRow').attr('key');
		Engine.log('increasing ' + supply + ' by up to ' + btn.data);
		var cur = Path.outfit[supply];
		cur = typeof cur == 'number' ? cur : 0;
		if(Path.getFreeSpace() >= Path.getWeight(supply) && cur < $SM.get('stores["'+supply+'"]', true)) {
			var maxExtraByWeight = Math.floor(Path.getFreeSpace() / Path.getWeight(supply));
			var maxExtraByStore  = $SM.get('stores["'+supply+'"]', true) - cur;
			Path.outfit[supply] = cur + Math.min(btn.data, maxExtraByWeight, maxExtraByStore);
			$SM.set('outfit['+supply+']', Path.outfit[supply]);
			Path.updateOutfitting();
		}
	},
	
	decreaseSupply: function(btn) {
		var supply = $(this).closest('.outfitRow').attr('key');
		Engine.log('decreasing ' + supply + ' by up to ' + btn.data);
		var cur = Path.outfit[supply];
		cur = typeof cur == 'number' ? cur : 0;
		if(cur > 0) {
			Path.outfit[supply] = Math.max(0, cur - btn.data);
			$SM.set('outfit['+supply+']', Path.outfit[supply]);
			Path.updateOutfitting();
		}
	},
	
	onArrival: function(transition_diff) {
		Path.setTitle();
		Path.updateOutfitting();
		Path.updatePerks(true);
		
		AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_DUSTY_PATH);

		Engine.moveStoresView($('#perks'), transition_diff);
	},
	
        setTitle: function() {
                document.title = Path.getLocationLabel(Path.startVariant || 'default');
        },
	
	embark: function() {
		for(var k in Path.outfit) {
			$SM.add('stores["'+k+'"]', -Path.outfit[k]);
		}
		World.onArrival();
		$('#outerSlider').animate({left: '-700px'}, 300);
		Engine.activeModule = World;
		AudioEngine.playSound(AudioLibrary.EMBARK);
	},
	
	handleStateUpdates: function(e){
		if(e.category == 'character' && e.stateName.indexOf('character.perks') === 0 && Engine.activeModule == Path){
			Path.updatePerks();
		} else if(e.category == 'income' && Engine.activeModule == Path){
			Path.updateOutfitting();
		}
	}
};
