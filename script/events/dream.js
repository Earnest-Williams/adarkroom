Events.RoomMagicDream = {
        title: _('A Restless Sleep'),
        scenes: {
                start: {
                        text: [
                                _('exhaustion tugs at your thoughts as you curl beside the cold hearth.'),
                                _('just for a moment, you let the darkness take you.')
                        ],
                        buttons: {
                                drift: {
                                        text: _('let go'),
                                        nextScene: 'dream'
                                }
                        }
                },
                dream: {
                        text: [
                                _('in the quiet void a crystal hovers, glowing with a deep blue light.'),
                                _('its pulse echoes in your chest, promising warmth where none should be.')
                        ],
                        buttons: {
                                reach: {
                                        text: _('reach for it'),
                                        nextScene: 'wake'
                                }
                        }
                },
                wake: {
                        onLoad: function () {
                                Room.setStartVariant('magic');
                                Engine.enterMagicStart();
                        },
                        text: [
                                _('you jolt awake, the vision of the crystal burning behind your eyes.'),
                                _('though the fire still lies dead, a strange energy hums in the room.')
                        ],
                        buttons: {
                                rise: {
                                        text: _('rise'),
                                        nextScene: 'end'
                                }
                        }
                }
        }
};
