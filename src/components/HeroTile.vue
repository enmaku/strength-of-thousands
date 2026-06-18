<template>
  <q-card flat bordered class="hero-tile">
    <q-card-section class="q-pb-none">
      <div class="text-subtitle1 text-weight-medium">{{ tile.name }}</div>
      <div class="text-caption sot-muted">
        Level {{ tile.level }} {{ tile.ancestry }} · {{ tile.alignment }}
      </div>
      <div class="text-caption sot-muted">{{ tile.classLine }}</div>
    </q-card-section>

    <q-card-section class="q-pt-sm tile-body">
      <div class="stat-row">
        <span class="stat-label">Mods</span>
        <span class="stat-values stat-values-stacked">
          <span>
            STR {{ fmtMod(tile.abilityMods.str) }}
            DEX {{ fmtMod(tile.abilityMods.dex) }}
            CON {{ fmtMod(tile.abilityMods.con) }}
          </span>
          <span>
            INT {{ fmtMod(tile.abilityMods.int) }}
            WIS {{ fmtMod(tile.abilityMods.wis) }}
            CHA {{ fmtMod(tile.abilityMods.cha) }}
          </span>
        </span>
      </div>

      <div class="stat-row">
        <span class="stat-label">Saves</span>
        <span class="stat-values">
          Fort {{ fmtBonus(tile.fortitude) }}
          Ref {{ fmtBonus(tile.reflex) }}
          Will {{ fmtBonus(tile.will) }}
        </span>
      </div>

      <div class="stat-row">
        <span class="stat-label">Combat</span>
        <span class="stat-values">
          AC {{ tile.ac }}
          HP {{ tile.maxHp }}
          Spd {{ tile.speed }} ft
          PP {{ tile.passivePerception }}
        </span>
      </div>

      <div v-if="tile.primaryAttack" class="stat-row">
        <span class="stat-label">Strike</span>
        <span class="stat-values">
          {{ tile.primaryAttack.name }} {{ fmtBonus(tile.primaryAttack.bonus) }}
          ({{ tile.primaryAttack.damage }})
        </span>
      </div>

      <div v-if="tile.spellAttack != null" class="stat-row">
        <span class="stat-label">Spells</span>
        <span class="stat-values">
          ATK {{ fmtBonus(tile.spellAttack) }}
          DC {{ tile.spellDc }}
        </span>
      </div>

      <div class="stat-row prof-row">
        <span class="stat-label">Prof</span>
        <span class="prof-checks">
          <span v-for="item in profItems" :key="item.key" class="prof-item">
            <q-icon
              :name="tile.proficiencies[item.key] ? 'check_box' : 'check_box_outline_blank'"
              size="xs"
            />
            {{ item.label }}
          </span>
        </span>
      </div>

      <div v-if="tile.languages.length" class="stat-row">
        <span class="stat-label">Lang</span>
        <span class="stat-values">{{ tile.languages.join(', ') }}</span>
      </div>

      <div v-if="tile.lores.length" class="stat-row">
        <span class="stat-label">Lores</span>
        <span class="stat-values">
          {{ tile.lores.map((l) => `${l.name} +${l.rank}`).join(', ') }}
        </span>
      </div>
    </q-card-section>

    <q-card-actions v-if="editable" align="right" class="q-pt-none">
      <q-btn flat dense color="primary" label="Update" :loading="updating" @click="emit('refresh')" />
    </q-card-actions>
  </q-card>
</template>

<script setup>
defineProps({
  tile: { type: Object, required: true },
  editable: { type: Boolean, default: false },
  updating: { type: Boolean, default: false },
})

const emit = defineEmits(['refresh'])

const profItems = [
  { key: 'light', label: 'L' },
  { key: 'medium', label: 'M' },
  { key: 'heavy', label: 'H' },
  { key: 'shield', label: 'Sh' },
  { key: 'simple', label: 'Sim' },
  { key: 'martial', label: 'Mar' },
]

function fmtMod(value) {
  return value >= 0 ? `+${value}` : String(value)
}

function fmtBonus(value) {
  return value >= 0 ? `+${value}` : String(value)
}
</script>

<style scoped>
.hero-tile {
  height: 100%;
}

.tile-body {
  font-size: 0.75rem;
  line-height: 1.35;
}

.stat-row {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.35rem;
}

.stat-label {
  flex: 0 0 2.75rem;
  font-weight: 600;
  color: var(--q-dark);
}

.stat-values {
  flex: 1;
  color: var(--q-dark);
}

.prof-row {
  align-items: flex-start;
}

.prof-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
}

.prof-item {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
}
</style>
