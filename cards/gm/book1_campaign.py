"""Kindled Magic (Book 1) GM cards, Campaign tab: the five branches, academic downtime, ranks, campus locations, lore.

Rules text is condensed from "Life in the Academy" (Kindled Magic pp. 61-65). Which heroes are in which branch comes
from heroes/*.json (study.primaryBranch / secondaryBranch). The Ten Magic Warriors' epithets follow
reference/sot-magaambya-history.html. Some campus locations are only map labels in Book 1; their cards say so and
leave room for notes.
"""
STEPS = "Crit success +2 levels · success +1 · failure +0 · crit failure: skip the next chance to Study"


def branch(slug, title, virtue, animal, skills, lore, back, cite="Kindled Magic pp. 61–65"):
    return dict(tab="campaign", kind="branch", slug=slug, title=title, subtitle=f"Branch · {virtue}",
                facts=[("Study", skills), ("Lore", lore)], footer=animal, back=back, cite=cite)


def place(slug, title, subtitle, facts, footer, back, cite):
    return dict(tab="campaign", kind="location", slug=slug, title=title, subtitle=subtitle, facts=facts,
                footer=footer, back=back, cite=cite)


def lore(slug, title, subtitle, facts, footer, back, cite):
    return dict(tab="campaign", kind="lore", slug=slug, title=title, subtitle=subtitle, facts=facts,
                footer=footer, back=back, cite=cite)


CARDS = [
    # ---------- the five branches ----------
    branch("cascade-bearers", "Cascade Bearers", "Imagination", "The hyena · Carmine Jaws",
           "Arcana, Occultism, Religion", "Academia Lore",
           [("Creed", "advance magical theory, and make new magic safe for everyone (“we don’t talk about the exploding nose incident”)"),
            ("Heroes", "Lithrei (primary); Cy’An, Solanum, Yggostrus (secondary)"),
            ("Teachers", "Takulu Ot, Lesedi"),
            ("Students", "Chizire, Mariama"),
            ("Feats", "branch level 7: Cascade Bearer’s Flexibility; 12: Cascade Bearer’s Spellcasting; 8: Canny Acumen (general)"),
            ("Paragon (20)", "once a day, cast any common 7th-level spell without a slot")]),

    branch("emerald-boughs", "Emerald Boughs", "Camaraderie", "The spider · Verdant Spider",
           "Deception, Diplomacy, Society", "a settlement (e.g. Nantambu)",
           [("Creed", "study the world as it is: communities, people, the present day. Not spies, whatever people say."),
            ("Heroes", "Lithrei, Taraan (secondary)"),
            ("Teachers", "Zuma"),
            ("Students", "Ignaci, Tzeniwe"),
            ("Feats", "branch level 7: Emerald Boughs Accustomation; 12: Emerald Boughs Hideaway; 8: Adopted Ancestry (general)"),
            ("Paragon (20)", "the hideaway expands into a magnificent mansion")]),

    branch("rain-scribes", "Rain-Scribes", "Adaptability", "The snake · Golden Snake",
           "Medicine, Nature, Survival", "a terrain (e.g. Forest)",
           [("Creed", "explore the world and guide travelers through uncertain country; admit the error, learn from it"),
            ("Heroes", "Cy’An, Yggostrus (primary)"),
            ("Teachers", "Koride Ulawa, Izem Mezitani"),
            ("Students", "Anchor Root, Haibram"),
            ("Feats", "branch level 7: Rain-Scribe Sustenance; 12: Rain-Scribe Mobility; 8: Fleet (general)"),
            ("Paragon (20)", "survive extreme heat and cold; full Speed through any difficult terrain")]),

    branch("tempest-sun-mages", "Tempest-Sun Mages", "Valor", "The leopard · Azure Leopard",
           "Intimidation, Performance", "Warfare Lore",
           [("Creed", "defend Nantambu and its people from outside threats, and have the nerve to consider opposing views. The duty keeps them near home."),
            ("Heroes", "Solanum (primary)"),
            ("Teachers", "Mafika Ayuwari, Tahenkot; High Sun-Mage Oyamba"),
            ("Students", "Esi (Haibram wishes)"),
            ("Feats", "branch level 7: Tempest-Sun Redirection; 12: Tempest-Sun Shielding; 8: Toughness (general)"),
            ("Paragon (20)", "Tempest-Sun Shielding covers you and every ally within 30 ft")]),

    branch("uzunjati", "Uzunjati", "Knowledge", "The elephant · Conjured Chronicle",
           "Crafting, Lore", "any Lore",
           [("Creed", "knowledge lives in stories handed down and in what you learn each day. Tell stories, and learn to listen."),
            ("Heroes", "Taraan (primary)"),
            ("Teachers", "Janatimo, Ahassunu, Nhyira"),
            ("Students", "Noxolo, Okoro"),
            ("Feats", "branch level 7: Uzunjati Storytelling; 12: Uzunjati Recollection; 8: Incredible Initiative (general)"),
            ("Paragon (20)", "Uzunjati Recollection recalls three times at +2")]),

    # ---------- academic downtime ----------
    dict(tab="campaign", kind="downtime", slug="study", title="Study", subtitle="Downtime · a semester",
         facts=[("Who", "initiates, attendants, conversants"), ("Check", "a branch skill vs. the DC for that branch’s level")],
         footer="Downtime",
         back=[("Do", "pick your primary or secondary branch and roll one of its skills"),
               ("Results", STEPS),
               ("DC by branch level", "0: 14 · 1: 15 · 2: 16 · 3: 18 · 4: 19 · 5: 20 · 6: 22 · 7: 23 · 8: 24"),
               ("Limits", "primary ≤ character level; secondary ≤ half (round down). Overflow: star it, and fill it in at the next level-up."),
               ("Pace", "first Study opens Ch 2; at least one more in Ch 2. Each takes a few months.")],
         cite="Kindled Magic pp. 62–63"),

    dict(tab="campaign", kind="downtime", slug="cram", title="Cram", subtitle="Downtime · a semester",
         facts=[("Needs", "a branch 2+ levels below its limit"), ("Cost", "DC 8 flat check each day or fatigued")],
         footer="Downtime",
         back=[("Do", "Study twice, each time in a branch that meets the requirement"),
               ("Price", "until you next Study, start each adventuring day with a DC 8 flat check; on a failure you’re fatigued that day"),
               ("Classmates", "Haibram: three Studies (Rain-Scribe). Chizire / Okoro: no fatigue (Cascade / Uzunjati). Ignaci: crit fail counts as fail (Emerald Boughs). Tzeniwe’s bonus doesn’t apply.")],
         cite="Kindled Magic p. 63"),

    dict(tab="campaign", kind="downtime", slug="practical-research", title="Practical Research", subtitle="Downtime · in the field",
         facts=[("Who", "conversants and lore-speakers"), ("Check", "whatever fits; the GM names it")],
         footer="Downtime",
         back=[("Do", "research something interesting found in the field"),
               ("Results", "usually everything Study gives, and sometimes unique benefits such as new character options"),
               ("When", "later books flag chances. Players who pitch a good location-based idea can earn an extra one."),
               ("Book 1", "nobody qualifies yet: the heroes are initiates, then attendants")],
         cite="Kindled Magic pp. 62–63"),

    dict(tab="campaign", kind="downtime", slug="branch-benefits", title="Branch Benefits", subtitle="By branch level",
         facts=[("1–3", "Additional Lore · Steeped in History +1 · Dedicated Attendant"),
                ("4–5", "Skill Feat (T) · Branch Influence +1")],
         footer="Every branch, every level",
         back=[("1", "Additional Lore in the branch’s Lore"),
               ("2", "Steeped in History: +1 Recall Knowledge on the Magaambya and the branch (+2 at 11)"),
               ("3", "Dedicated Attendant: Magaambyan Attendant Dedication free, once the Perquisite is done"),
               ("4", "skill feat for a branch skill (T); more at 9 (E), 15 (M), 19 (L)"),
               ("5", "Branch Influence: +1 to social checks with branch members (+2 at 13, +3 at 17)"),
               ("6+", "6 skill increase · 7 branch feat · 8 general feat · 10, 14 increase (M) · 12 branch feat · 16 Make Your Own Luck · 18 increase (L) · 20 Magical Paragon")],
         cite="Kindled Magic pp. 63–65"),

    # ---------- campus ----------
    place("spire-dormitory", "Spire Dormitory", "Campus · the heroes’ home",
          [("Who", "the cohort: Esi, Chizire, Ignaci, Anchor Root and the rest"), ("Map", "A1–A18, Kindled Magic p. 12")],
          "Four 50-ft stone spires",
          [("A1 Soaring Spire", "within 15 ft you can High Jump 60 ft with no check and land safely. Haibram launches his glider here."),
           ("A15 East Bath", "two spellskeins in the old laundry; +1 handwraps of mighty blows in the heap"),
           ("A16", "Ignaci’s All-Seeing Solutions mask: 1 sp an answer, insulting nine times in ten"),
           ("A17", "secret door (DC 16) to a hatch into old tunnels under campus"),
           ("A3", "Chizire’s fake-fever red mold (DC 20)")],
          "Kindled Magic pp. 12–15"),

    place("dining-hall", "Dining Hall", "Campus · Lumusi’s domain",
          [("Hours", "sunrise to 2 hours after sunset"), ("Meals", "two a day, free")],
          "Kitchen-warmed, mosaic walls",
          [("Is", "warm and busy; the rainy-season meeting place for students and teachers"),
           ("Lumusi", "greets new students; gives the fruit bead"),
           ("Earn Income", "level 1 tasks: fruit (Survival), gardens (Nature), kitchenware (Crafting)"),
           ("Ch 2 Kitchen", "closed for mites. Centipede swarm (Low 2); Abena is in the cauldron.")],
          "Kindled Magic pp. 16, 32"),

    place("powderpile", "Powderpile", "Campus · student supply store",
          [("Who", "Xhokan, kobold inventory manager"), ("Hours", "2 h before lunch until sunset")],
          "Named for its magical powders",
          [("Stipend", "40 gp and supplies on arrival; 4 gp each month after"),
           ("Stock", "gear; alchemical, held and worn items up to 3rd; oils, potions, scrolls, wands up to 5th; staves up to 6th"),
           ("Also", "pays finder’s fees for items the school wants. Silver bells 5 sp, or lent free for assignments."),
           ("Later", "riskier stock as the heroes prove themselves")],
          "Kindled Magic p. 16"),

    place("heron-archives", "Heron Archives", "Campus · one of the first ten",
          [("Who", "Koride; Takulu (top floor)"), ("Named for", "Black Heron, Wings of Knowledge")],
          "Black Heron of the Ten",
          [("Is", "one of the ten original buildings from Jatembe’s day"),
           ("Koride’s office", "heavy curtains, low oil lamps, cases of insects and reptiles, a surly vulture in a hanging cage"),
           ("Takulu’s office", "books everywhere; a lens and a campus map on the desk"),
           ("Sneaking in", "DC 15 Stealth, or DC 15 Deception to pass as a regular (Cricket Theft)")],
          "Kindled Magic pp. 30, 33, 42"),

    place("leshy-gardens", "Leshy Gardens", "Campus · overgrown green",
          [("Who", "the leshys; Thema, chief groundskeeper"), ("When", "Bug Problems; Starday Tournament")],
          "Leaf, gourd and flytrap leshys",
          [("Is", "a tangle of trees and vines kept to its patch by Thema, since the leshys make mischief. Students come for a plant’s view of hard assignments."),
           ("Shade-in-Autumn", "friendly gourd leshy. Bark beetles are chewing their construct plates."),
           ("Runes", "DC 16 Perception spots patterns in the bark; DC 16 Arcana or Nature: summoning runes (30 XP). The Egg’s doing."),
           ("Tournament", "the leshys build and pilot the constructs, and gossip (DC 16 Diplomacy)")],
          "Kindled Magic pp. 31, 38–39"),

    place("speakers-stage", "Speaker’s Stage", "Campus · island stage on the canal",
          [("Who", "Nhyira’s productions; the crowd across the canal"), ("When", "Bug Problems; Anadi Arrival")],
          "Ring of glowing stone basins",
          [("Is", "artificial island off the campus’s west end. For school announcements to Nantambu; performances are always free."),
           ("Bug Problems", "agitated water striders (DC 16 Nature, Survival or Thievery to catch one)"),
           ("Show", "DC 16 Performance pleases the crowd; magistrate-mayor Asanda floats over a chest feather token. Note whether they meet him."),
           ("Ch 3", "the anadi newcomers wait nearby when the griffons strike")],
          "Kindled Magic pp. 31, 57"),

    place("tree-stump-library", "Tree-Stump Library", "Campus · abandoned",
          [("Who", "scrits, silverfish, scared spellskeins"), ("When", "Takulu’s Reading List")],
          "A dorm carved from a giant stump",
          [("Is", "lightning-scarred stump; a dorm half-converted to a library, then abandoned. Nobody remembers why."),
           ("Clues", "vines pulled apart, not cut; ink stains; silver bells torn down (10 gp)"),
           ("Books", "4 of Takulu’s 5 are recoverable: B2 (chest), B4 (vol. 4, DC 16), B6 (two). The scroll became a wasp nest (B7). 30 XP each."),
           ("Also", "Bloodsalt map folio in B6. Note who takes it (Book 3).")],
          "Kindled Magic pp. 33–37"),

    place("tireless-hall", "Tireless Hall", "Campus · ceremonies",
          [("Named for", "Golden Snake, the Tireless Guide"), ("When", "First Masking (Severe 2)")],
          "Golden Snake of the Ten",
          [("Is", "home of long rituals. Rumor says nobody tires inside, so dull lecturers book it."),
           ("Auditorium", "wood-paneled, seats 100+; benches climb north, balcony above; the south end is below ground"),
           ("First Masking", "DC 20 Perception hears grinding in the walls. Insects burst in as the masks go on."),
           ("Ch 3", "the faculty search the tunnels here, where Stone Ghost laid false trails")],
          "Kindled Magic pp. 44–47"),

    place("archhorn-library", "Archhorn Library", "Campus · Chapter 3",
          [("Designed by", "White Bull, the Horn-Forger"), ("When", "the Infested Caverns")],
          "White Bull of the Ten",
          [("Is", "horn-shaped library under a mirrored dome. Its disused rooms below hide Stone Ghost’s lair."),
           ("C1", "an old dance studio; the first team’s maps and a scroll of dispel magic. A good spot for fey abeyance."),
           ("Assignment", "Koride’s favorites quit, so she sent the heroes: map it, handle threats, report"),
           ("Next door", "Warden House: Ignaci, Okoro and Tzeniwe got cut off mapping under it (C8)")],
          "Kindled Magic pp. 46–49"),

    place("welcome-walk", "Welcome Walk", "Campus · open promenade",
          [("When", "Anadi Arrival (Extreme 3)"), ("Map", "Kindled Magic p. 56")],
          "Where newcomers arrive",
          [("Book 1", "the battle map for the Anadi Arrival: three griffons cross the canal for the anadi newcomers"),
           ("Session 1", "the cohort’s arrival: Teacher Ot’s interview and aptitude tests in the garden gazebo")],
          "Kindled Magic pp. 56–58 · Session 1"),

    # ---------- lore ----------
    lore("jatembe-and-the-ten", "Jatembe & the Ten", "Lore · the founders",
         [("Old-Mage", "Jatembe rekindled magic after Earthfall"), ("The Ten", "his Magic Warriors, in golden animal masks")],
         "Magic’s price: bettering the world",
         [("Jatembe", "folk hero and myth; banished the King of Biting Ants in −3505 AR; founded Nantambu and the Magaambya, then faded from sight"),
          ("The Ten", "Azure Leopard (Tempest-Sun founder) · Black Heron (Heron Archives; left Jatembe) · Carmine Jaws, the hyena · Elephant (chronicler; Uzunjati founder) · Golden Snake (Tireless Hall) · Ibex · Shifting Frog · Verdant Spider · Whistling Kite · White Bull (Archhorn)"),
          ("Mosaics", "the Ten overlook the terraced gardens; the first ten buildings bear their names")],
         "Kindled Magic pp. 3, 9, 61 · campus history notes"),

    lore("founding-of-the-magaambya", "The Magaambya", "Lore · the oldest magic school",
         [("Founded", "−3502 AR by Old-Mage Jatembe"), ("Teaches", "arcane and primal magic, in service")],
         "Island campus at the heart of Nantambu",
         [("Mission", "spread knowledge and hope, as Jatembe and the Ten did, in service to all of Golarion"),
          ("Ethic", "students are held to account; the school expelled Uduak Basni for killing gremlins on his Perquisite"),
          ("Stipend", "no tuition; students are paid a stipend instead"),
          ("Timeline", "−4294 Earthfall · −3505 King of Biting Ants banished · −3504 the Ten chosen · 4719 Koride finds the Egg · 4721 now")],
         "Kindled Magic pp. 3, 5, 73"),

    lore("nantambu", "Nantambu", "Lore · the Song-Wind City",
         [("Is", "canal city-state on the Mwangi Jungle’s west edge"), ("Rule", "eleven magistrate-mayors")],
         "Built around the Magaambya",
         [("Weather", "rains like this over half the year"),
          ("Language", "“Common” here means Mwangi"),
          ("Landmarks", "ten magically warded pillars (Chizire’s prank target); a shrine to Mazludeh with egg-eating snakes"),
          ("Kafesi Market", "wandering bazaar the Magaambya boycotts for selling curses and dangerous magic"),
          ("Asanda", "a magistrate-mayor who may meet the heroes at the Speaker’s Stage")],
         "Kindled Magic pp. 5, 17, 25, 31"),

    lore("spirit-masks", "Spirit Masks", "Lore · the First Masking",
         [("Who", "every new attendant"), ("Where", "Tireless Hall")],
         "A fragment of the wearer’s spirit face",
         [("Ceremony", "a plain wooden mask, shaped with cloth, beads, feathers and metal while teachers guide; no check. Meditate (it may change shape), then the cohort dons them together; beads go in the urn."),
          ("Shapes", "usually animals; celestial objects and supernatural beasts happen. Students are known by their mask after."),
          ("Magic", "enchantments from the mask of mercy and rhinoceros mask move to a hero’s own mask: 1 day of downtime with Takulu")],
         "Kindled Magic pp. 3, 43–44, 55, 73"),

    lore("the-anadi", "The Anadi", "Lore · spider-folk",
         [("Forms", "human, hybrid, spider"), ("On campus", "Tzeniwe and her twins; then Goss, Savana, Mazta")],
         "Peaceful shapeshifters, often feared",
         [("Is", "shapeshifting spider-folk who live peacefully and close-knit; they spin silk for cloth"),
          ("Fear", "many in the Mwangi wrongly think they’re humans who turn into monsters by night. The Magaambya is kinder, but reactions vary."),
          ("Custom", "travel in human form. Arriving in hybrid form marks a newcomer (DC 15 Society)."),
          ("Ch 3", "drawn by a psychic call they can’t explain: the Vesicant Egg")],
         "Kindled Magic pp. 57–58, 71, 78"),
]
