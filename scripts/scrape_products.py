#!/usr/bin/env python3
"""
Collect real men's tops, trousers and shoes from Indian brands and write them
in the app's Product shape (src/domain/types.ts), with auto-generated tags.

Why Shopify stores: they publish a public catalogue at /products.json (title,
type, tags, sizes, availability, INR price, CDN images), so there's no HTML
scraping, no headless browser, and no bot walls (unlike H&M/Zara, which 403).

Stdlib only. Two stages, so tagging rules can be tweaked without refetching:
  1. fetch  -> scripts/.cache/<domain>.json   (skipped if cached; --refresh to redo)
  2. build  -> classify slot, auto-tag, pick a balanced set, write products.json

Usage:
  python3 scripts/scrape_products.py                 # default: 40 per slot
  python3 scripts/scrape_products.py --per-slot 8 --refresh
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = Path(__file__).resolve().parent / ".cache"
OUT = ROOT / "src" / "server" / "data" / "products.json"

# domain -> (brand name, slots we take from it, pages of 250 to read)
SOURCES = {
    "snitch.co.in": ("Snitch", {"top", "trousers"}, 3),
    "powerlook.in": ("Powerlook", {"top", "trousers"}, 2),
    "thehouseofrare.com": ("Rare Rabbit", {"top", "trousers", "shoes"}, 2),
    "bonkerscorner.com": ("Bonkers Corner", {"top", "trousers"}, 2),
    "wearcomet.com": ("Comet", {"shoes"}, 1),
    "neemans.com": ("Neeman's", {"shoes"}, 2),
    "baccabucci.com": ("Bacca Bucci", {"shoes"}, 2),
}

PRICE_RANGE = {"top": (500, 4000), "trousers": (700, 4500), "shoes": (900, 8000)}
OCCASIONS = ["date-night", "office", "wedding", "casual"]

# --- slot classification ------------------------------------------------------
SLOT_WORDS = {
    "top": r"\b(shirt|t-shirt|tee|polo|kurta|overshirt|henley)\b",
    "trousers": r"\b(trouser|trousers|chino|chinos|pant|pants|jeans|jogger|joggers|cargo|bottom)\b",
    "shoes": r"\b(sneaker|sneakers|shoe|shoes|loafer|loafers|derby|oxford|oxfords|brogue|slip on|slip-on|boot|boots|mule|mules|lows)\b",
}
EXCLUDE = r"\b(women|woman|womens|ladies|girl|kids|dress|skirt|shorts|boxer|sock|socks|belt|wallet|chain|sandal|sandals|flip flop|slide|slides|clog|clogs|hiking|trekking|snow|co-ord|coord|jacket|sweater|sweatshirt|hoodie|vest)\b"


def classify_slot(p: dict, allowed: set[str]) -> str | None:
    text = f"{p['title']} {p.get('product_type', '')}".lower()
    if re.search(EXCLUDE, text) or re.search(EXCLUDE, " ".join(p.get("tags", [])).lower().replace("unisex", "")):
        return None
    # Shoes first: "Oxford" is both a shirt fabric and a shoe; shoe stores only allow shoes anyway.
    for slot in ("shoes", "trousers", "top"):
        if slot in allowed and re.search(SLOT_WORDS[slot], text):
            return slot
    return None


# --- colour -------------------------------------------------------------------
# name -> (hex for UI swatch, family used by pairing rules)
COLOURS = {
    "off white": ("#f1eee6", "neutral"), "white": ("#f5f5f2", "neutral"), "ivory": ("#ece3cf", "neutral"),
    "cream": ("#efe6d2", "neutral"), "ecru": ("#e6dcc6", "neutral"), "beige": ("#d9c8a9", "neutral"),
    "stone": ("#c9bba3", "neutral"), "black": ("#1b1b1b", "neutral"), "charcoal": ("#3a3b3d", "neutral"),
    "grey": ("#8f9092", "neutral"), "gray": ("#8f9092", "neutral"), "silver": ("#b9bcc0", "neutral"),
    "navy": ("#1f2a44", "cool"), "blue": ("#3b5b8c", "cool"), "sky": ("#9cc3e0", "cool"),
    "indigo": ("#33406b", "cool"), "teal": ("#2f6f6f", "cool"), "green": ("#3f6b4a", "cool"),
    "sage": ("#9aab8f", "cool"), "mint": ("#b6dcc6", "cool"), "denim": ("#4a6a8f", "cool"),
    "brown": ("#6b4a34", "earth"), "tan": ("#a87a4f", "earth"), "khaki": ("#b5a47a", "earth"),
    "olive": ("#5b5a3a", "earth"), "camel": ("#b88a57", "earth"), "coffee": ("#4b3426", "earth"),
    "rust": ("#a2502c", "earth"), "mustard": ("#c9a13b", "earth"), "maroon": ("#6b1f2a", "earth"),
    "wine": ("#5e1f2d", "earth"), "burgundy": ("#5e1f2d", "earth"), "taupe": ("#8b7d6b", "earth"),
    "red": ("#b8322b", "bold"), "pink": ("#e3a3b5", "bold"), "yellow": ("#e6c84a", "bold"),
    "orange": ("#e07a2e", "bold"), "purple": ("#6a4c93", "bold"), "lavender": ("#b7a6d6", "bold"),
    "lilac": ("#b7a6d6", "bold"), "neon": ("#b6e33a", "bold"), "multi": ("#999999", "bold"),
}
# longest names first so "off white" wins over "white"
COLOUR_NAMES = sorted(COLOURS, key=len, reverse=True)


def detect_colour(p: dict) -> str | None:
    option_colour = next(
        (o["values"][0] for o in p.get("options", []) if o["name"].lower() in ("color", "colour") and o["values"]),
        "",
    )
    for text in (option_colour, p["title"], " ".join(p.get("tags", []))):
        t = text.lower()
        for name in COLOUR_NAMES:
            if re.search(rf"\b{name}\b", t):
                return "grey" if name == "gray" else name
    return None


# --- formality, style, occasions ---------------------------------------------
# Each rule: (regex, formality, style). First match wins, so order matters:
# casual signals ("sneaker", "t-shirt", "oversized") must beat formal words they
# appear alongside ("Derby Sneakers", "Polo T-Shirt").
STYLE_RULES = [
    (r"kurta|bandhgala|nehru", 5, "ethnic"),
    (r"track|jogger|running|training|gym", 1, "sport"),
    (r"graphic|oversized|cargo|baggy|parachute|distressed|ripped|applique", 2, "street"),
    (r"sneaker|\blows\b", 2, "street"),
    (r"formal|derby|oxfords|brogue|monk|tailored|suit|satin|lace-up", 4, "classic"),
    (r"loafer|pleat|trouser", 4, "classic"),
    (r"\bpolo\b", 3, "smart-casual"),
    (r"t-shirt|\btee\b", 2, "street"),
    (r"oxford|linen|chino|cuban|resort|shirt", 3, "smart-casual"),
    (r"slip on|slip-on|mule|knit", 2, "smart-casual"),
    (r"jean|denim", 2, "street"),
]


def detect_style(p: dict) -> tuple[int, str]:
    # Title and type are reliable; store tags are noisy, so they're only a fallback.
    primary = f"{p['title']} {p.get('product_type', '')}".lower()
    fallback = " ".join(p.get("tags", [])).lower()
    for text in (primary, fallback):
        for pattern, formality, style in STYLE_RULES:
            if re.search(pattern, text):
                # Bold prints read less formal than their silhouette suggests.
                if re.search(r"\b(print|printed|floral|abstract|tropical)\b", primary) and formality > 2:
                    formality -= 1
                return formality, style
    return 2, "smart-casual"


def occasions_for(formality: int, style: str, family: str) -> list[str]:
    occ = []
    if 2 <= formality <= 4 and style != "sport":
        occ.append("date-night")
    if formality >= 3 and style in ("classic", "smart-casual") and family != "bold":
        occ.append("office")
    if formality >= 4 or style == "ethnic":
        occ.append("wedding")
    if formality <= 3:
        occ.append("casual")
    return occ


# --- sizes & stock -------------------------------------------------------------
APPAREL_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "28", "30", "32", "34", "36", "38", "40"]


def size_value(v: dict, p: dict) -> str | None:
    names = [o["name"].lower() for o in p.get("options", [])]
    if "size" not in names:
        return None
    raw = str(v.get(f"option{names.index('size') + 1}") or "").strip()
    return raw or None


def normalise_shoe_size(raw: str) -> str:
    m = re.search(r"(?:uk\s*)?(\d{1,2})(?:\b|$)", raw.lower())
    return f"UK {int(m.group(1))}" if m else raw  # "UK- 06" -> "UK 6"


def seed_stock(variant_id: str, available: bool) -> int:
    # Shopify only exposes in/out of stock. Derive a stable 1–6 so Reset is reproducible.
    if not available:
        return 0
    return int(hashlib.md5(variant_id.encode()).hexdigest(), 16) % 6 + 1


# --- fetch -----------------------------------------------------------------------
def fetch(domain: str, pages: int, refresh: bool) -> list[dict]:
    cache_file = CACHE / f"{domain}.json"
    if cache_file.exists() and not refresh:
        return json.loads(cache_file.read_text())
    products: list[dict] = []
    for page in range(1, pages + 1):
        url = f"https://{domain}/products.json?limit=250&page={page}"
        req = urllib.request.Request(url, headers={"User-Agent": "drip-takehome-catalog/1.0"})
        with urllib.request.urlopen(req, timeout=30) as res:
            batch = json.load(res)["products"]
        products += batch
        print(f"  {domain} page {page}: {len(batch)}")
        if len(batch) < 250:
            break
        time.sleep(1.0)  # be polite
    CACHE.mkdir(exist_ok=True)
    cache_file.write_text(json.dumps(products))
    return products


# --- build -----------------------------------------------------------------------
def clean_name(title: str, brand: str) -> str:
    """'Bacca Bucci Leather Office Lace-ups Formal Shoes | UK- 06 to 14' -> 'Leather Office Lace-ups Formal Shoes'."""
    name = title.split("|")[0]
    name = re.sub(rf"^\s*{re.escape(brand)}\s*", "", name, flags=re.I)
    name = re.sub(r"\b(men's|mens|for men|men)\b\s*:?", "", name, flags=re.I)
    name = re.sub(r"\s*:\s*", ", ", name)  # Neeman's "Flexy Brogues : Tan" -> "Flexy Brogues, Tan"
    return re.sub(r"\s+", " ", name).strip(" ,-")


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def to_product(p: dict, domain: str, brand: str, slot: str) -> dict | None:
    if not p.get("images"):
        return None
    colour = detect_colour(p)
    if not colour:
        return None
    hex_, family = COLOURS[colour]
    formality, style = detect_style(p)
    occasions = occasions_for(formality, style, family)

    seen, variants = set(), []
    for v in p["variants"]:
        size = size_value(v, p)
        if not size:
            continue
        size = normalise_shoe_size(size) if slot == "shoes" else size.upper()
        if size in seen:
            continue
        seen.add(size)
        variants.append({"variantId": str(v["id"]), "size": size, "stock": seed_stock(str(v["id"]), v.get("available", False))})
    if slot != "shoes":
        variants.sort(key=lambda x: APPAREL_ORDER.index(x["size"]) if x["size"] in APPAREL_ORDER else 99)
    else:
        variants.sort(key=lambda x: int(re.sub(r"\D", "", x["size"]) or 99))
    variants = variants[:6]
    if sum(v["stock"] > 0 for v in variants) < 2:
        return None

    price = round(float(p["variants"][0]["price"]))
    lo, hi = PRICE_RANGE[slot]
    if not lo <= price <= hi:
        return None

    return {
        "id": f"{slugify(brand)}-{p['handle']}"[:72],
        "slot": slot,
        "brand": brand,
        "name": clean_name(p["title"], brand),
        "price": price,
        "image": p["images"][0]["src"].split("?")[0],
        "sourceUrl": f"https://{domain}/products/{p['handle']}",
        "tags": {
            "occasions": occasions,
            "colour": colour,
            "colourHex": hex_,
            "colourFamily": family,
            "formality": formality,
            "style": style,
        },
        "variants": variants,
    }


def pick_balanced(pool: list[dict], per_slot: int) -> list[dict]:
    """Cover every occasion, vary colour and brand, prefer mid-range prices."""
    chosen: list[dict] = []
    per_occasion = max(2, per_slot // len(OCCASIONS))
    # Scarcest occasion first (usually wedding/office), so common casual pieces
    # can't use up brand quotas before formal and ethnic pieces get a slot.
    by_scarcity = sorted(OCCASIONS, key=lambda o: sum(o in p["tags"]["occasions"] for p in pool))
    for occ in by_scarcity:
        candidates = sorted((p for p in pool if occ in p["tags"]["occasions"]), key=lambda p: p["price"])
        if not candidates:
            continue
        mid = len(candidates) // 2
        ordered = sorted(candidates, key=lambda p: abs(candidates.index(p) - mid))  # middle out
        taken = 0
        for p in ordered:
            if taken >= per_occasion or len(chosen) >= per_slot:
                break
            if fits(p, chosen, per_slot):
                chosen.append(p)
                taken += 1
    # Top up with the rest of the pool under the same diversity rules.
    for p in sorted(pool, key=lambda p: p["price"]):
        if len(chosen) >= per_slot:
            break
        if fits(p, chosen, per_slot):
            chosen.append(p)
    return chosen


def fits(p: dict, chosen: list[dict], per_slot: int) -> bool:
    if p in chosen:
        return False
    if any(c["tags"]["colour"] == p["tags"]["colour"] and c["brand"] == p["brand"] for c in chosen):
        return False
    # Two colourways of one style are useful for swaps; more is just noise.
    if sum(c["name"] == p["name"] for c in chosen) >= 2:
        return False
    # No single brand should dominate a category.
    return sum(c["brand"] == p["brand"] for c in chosen) < max(3, round(per_slot * 0.35))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-slot", type=int, default=40)
    ap.add_argument("--refresh", action="store_true", help="refetch instead of using scripts/.cache")
    ap.add_argument("--out", type=Path, default=OUT)
    args = ap.parse_args()

    pools: dict[str, list[dict]] = {"top": [], "trousers": [], "shoes": []}
    for domain, (brand, slots, pages) in SOURCES.items():
        try:
            raw = fetch(domain, pages, args.refresh)
        except Exception as e:  # one store failing shouldn't stop the run
            print(f"  ! {domain}: {e}")
            continue
        for p in raw:
            slot = classify_slot(p, slots)
            if slot and (prod := to_product(p, domain, brand, slot)):
                pools[slot].append(prod)

    products = []
    for slot, pool in pools.items():
        picked = pick_balanced(pool, args.per_slot)
        products += picked
        print(f"{slot:9} pool={len(pool):4}  picked={len(picked)}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(products, indent=2, ensure_ascii=False) + "\n")
    print(f"\nWrote {len(products)} products -> {args.out.relative_to(ROOT)}")
    for occ in OCCASIONS:
        counts = {s: sum(occ in p["tags"]["occasions"] for p in products if p["slot"] == s) for s in pools}
        cheapest = sum(
            min((p["price"] for p in products if p["slot"] == s and occ in p["tags"]["occasions"]), default=0)
            for s in pools
        )
        print(f"  {occ:10} {counts}  cheapest look ≈ ₹{cheapest:,}")


if __name__ == "__main__":
    main()
