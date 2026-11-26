"""Kindled Magic (Strength of Thousands Book 1): every GM card, in print order. Rendered by cards/generate_gm_cards.py."""
from book1_campaign import CARDS as CAMPAIGN
from book1_combat import CARDS as COMBAT
from book1_npcs import CARDS as NPCS

STEM = "GM Book 1"
CARDS = COMBAT + NPCS + CAMPAIGN
