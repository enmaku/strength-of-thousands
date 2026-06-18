<template>
  <q-card flat bordered class="hero-tile">
    <q-card-section class="hero-header q-pb-sm">
      <div class="text-h6 text-weight-bold">{{ tile.name }}</div>
      <div class="text-caption sot-muted">
        Level {{ tile.level }} {{ tile.ancestry }} · {{ tile.alignment }}
      </div>
      <div class="text-caption sot-muted">{{ tile.classLine }}</div>
    </q-card-section>

    <q-card-section class="combat-grid q-pt-none q-pb-sm">
      <div class="grid-row grid-row--3 grid-row--vitals">
        <div class="grid-cell">
          <div class="cell-label">AC</div>
          <div class="cell-value">{{ tile.ac }}</div>
        </div>
        <div class="grid-cell">
          <div class="cell-label">HP</div>
          <div class="cell-value">{{ tile.maxHp }}</div>
        </div>
        <div class="grid-cell">
          <div class="cell-label">SPD</div>
          <div class="cell-value">{{ tile.speed }}</div>
        </div>
      </div>

      <div class="zone-rule" />

      <div class="grid-row grid-row--3 grid-row--mods">
        <div class="grid-cell">
          <div class="cell-label">STR</div>
          <div class="cell-value">{{ fmtMod(tile.abilityMods.str) }}</div>
        </div>
        <div class="grid-cell">
          <div class="cell-label">DEX</div>
          <div class="cell-value">{{ fmtMod(tile.abilityMods.dex) }}</div>
        </div>
        <div class="grid-cell">
          <div class="cell-label">CON</div>
          <div class="cell-value">{{ fmtMod(tile.abilityMods.con) }}</div>
        </div>
      </div>
      <div class="grid-row grid-row--3 grid-row--mods">
        <div class="grid-cell">
          <div class="cell-label">INT</div>
          <div class="cell-value">{{ fmtMod(tile.abilityMods.int) }}</div>
        </div>
        <div class="grid-cell">
          <div class="cell-label">WIS</div>
          <div class="cell-value">{{ fmtMod(tile.abilityMods.wis) }}</div>
        </div>
        <div class="grid-cell">
          <div class="cell-label">CHA</div>
          <div class="cell-value">{{ fmtMod(tile.abilityMods.cha) }}</div>
        </div>
      </div>

      <div class="zone-rule" />

      <div class="grid-row grid-row--4 grid-row--saves">
        <div class="grid-cell">
          <div class="cell-label">Fort</div>
          <div class="cell-value">{{ fmtBonus(tile.fortitude) }}</div>
        </div>
        <div class="grid-cell">
          <div class="cell-label">Ref</div>
          <div class="cell-value">{{ fmtBonus(tile.reflex) }}</div>
        </div>
        <div class="grid-cell">
          <div class="cell-label">Will</div>
          <div class="cell-value">{{ fmtBonus(tile.will) }}</div>
        </div>
        <div class="grid-cell">
          <div class="cell-label">PP</div>
          <div class="cell-value">{{ tile.passivePerception }}</div>
        </div>
      </div>

      <div class="zone-rule" />

      <div v-if="tile.primaryAttack" class="grid-row grid-row--1">
        <div class="grid-cell">
          <div class="cell-label">Strike</div>
          <div class="cell-value">
            {{ tile.primaryAttack.name }} {{ fmtBonus(tile.primaryAttack.bonus) }}
            ({{ tile.primaryAttack.damage }})
          </div>
        </div>
      </div>
      <div v-if="tile.primaryAttack && tile.spellAttack != null" class="zone-rule" />
      <div v-if="tile.spellAttack != null" class="grid-row grid-row--2 grid-row--spells">
        <div class="grid-cell">
          <div class="cell-label">Spell ATK</div>
          <div class="cell-value">{{ fmtBonus(tile.spellAttack) }}</div>
        </div>
        <div class="grid-cell">
          <div class="cell-label">Spell DC</div>
          <div class="cell-value">{{ tile.spellDc }}</div>
        </div>
      </div>
    </q-card-section>

    <q-card-section class="hero-footer q-pt-none">
      <div class="zone-rule q-mb-sm" />
      <div class="prof-checks">
        <span v-for="item in profItems" :key="item.key" class="prof-item">
          <q-icon
            :name="tile.proficiencies[item.key] ? 'check_box' : 'check_box_outline_blank'"
            size="xs"
          />
          {{ item.label }}
          <q-tooltip>{{ item.tooltip }}</q-tooltip>
        </span>
      </div>
      <div v-if="tile.languages.length || tile.lores.length" class="zone-rule q-my-sm" />
      <div v-if="tile.languages.length" class="footer-meta">
        {{ tile.languages.join(', ') }}
      </div>
      <div v-if="tile.lores.length" class="footer-meta">
        {{ tile.lores.map((l) => `${l.name} +${l.rank}`).join(', ') }}
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
  { key: 'light', label: 'L', tooltip: 'Light armor proficiency' },
  { key: 'medium', label: 'M', tooltip: 'Medium armor proficiency' },
  { key: 'heavy', label: 'H', tooltip: 'Heavy armor proficiency' },
  { key: 'shield', label: 'Sh', tooltip: 'Shield proficiency' },
  { key: 'simple', label: 'Sim', tooltip: 'Simple weapons proficiency' },
  { key: 'martial', label: 'Mar', tooltip: 'Martial weapons proficiency' },
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
  background: var(--sot-parchment-light);
  border-color: var(--sot-border);
}

.hero-header {
  border-bottom: 1px solid var(--sot-border);
}

.grid-row--vitals .grid-cell {
  text-align: center;
}

.grid-row--vitals .cell-label {
  font-size: 0.8125rem;
}

.grid-row--vitals .cell-value {
  font-size: 1.375rem;
  font-weight: 700;
}

.combat-grid {
  font-size: 0.8125rem;
  line-height: 1.35;
}

.grid-row {
  display: grid;
  gap: 0.25rem 0.5rem;
}

.grid-row--1 {
  grid-template-columns: 1fr;
}

.grid-row--3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-row--4 {
  grid-template-columns: repeat(4, 1fr);
}

.grid-row--2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-row--mods .grid-cell {
  text-align: center;
}

.grid-row--mods .cell-label {
  font-size: 0.75rem;
}

.grid-row--mods .cell-value {
  font-size: 0.9375rem;
  font-weight: 700;
}

.grid-row--saves .grid-cell {
  text-align: center;
}

.grid-row--saves .cell-label {
  font-size: 0.75rem;
}

.grid-row--saves .cell-value {
  font-size: 0.9375rem;
  font-weight: 700;
}

.grid-row--spells .grid-cell {
  text-align: center;
}

.grid-row + .grid-row {
  margin-top: 0.25rem;
}

.grid-cell {
  min-width: 0;
}

.cell-label {
  font-size: 0.6875rem;
  color: var(--sot-muted);
}

.cell-value {
  font-weight: 600;
  color: var(--sot-ink);
}

.zone-rule {
  height: 1px;
  margin: 0.5rem 0;
  background: var(--sot-border);
}

.hero-footer {
  font-size: 0.6875rem;
  line-height: 1.4;
}

.prof-checks {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem 0.5rem;
}

.prof-item {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  color: var(--sot-ink);
  cursor: default;
}

.footer-meta {
  color: var(--sot-muted);
}

.footer-meta + .footer-meta {
  margin-top: 0.15rem;
}
</style>
