# Script Directory

This directory now follows a domain-oriented layout for the TypeScript rewrite of A Dark Room's game logic.

```
script/
  engine/   # Core engine pieces: scheduler, state manager, telemetry
  features/ # Game feature verticals (room, outside, world, etc.)
  content/  # Static data such as events, quests, and biomes
  ui/       # Presentation-only helpers with no state mutation
  audio/    # Audio library registry and loaders
  i18n/     # Localization helpers and extraction tooling
  net/      # Networking, syncable actions, and multiplayer stubs
```

Legacy JavaScript modules remain at the root of this directory and will be migrated incrementally.
