#!/usr/bin/env python3
"""
Pull the question set from the deployed practice site and save it locally.

The site at https://tisa3630.netlify.app/ is a Vite/React build that embeds its
questions as a JSON.parse(`[...]`) literal inside the main JS bundle. This script
finds that bundle, extracts the array, tidies it up, merges in any extra questions
from data/questions_extra.json (revised test-bank items), and writes data/questions.json.

Usage:
    python scripts/fetch_site_questions.py [--url URL] [--out data/questions.json]
"""

import argparse
import json
import re
import subprocess
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urljoin

DEFAULT_URL = "https://tisa3630.netlify.app/"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DEFAULT_OUT = DATA_DIR / "questions.json"
EXTRA_FILE = DATA_DIR / "questions_extra.json"


def fetch(url):
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return response.read().decode("utf-8")
    except urllib.error.URLError:
        # python.org builds on macOS often lack CA certs; curl uses the system store
        return subprocess.run(["curl", "-fsSL", url], check=True, capture_output=True, text=True).stdout


def find_bundle_urls(site_url, html):
    srcs = re.findall(r'<script[^>]+src="([^"]+\.js)"', html)
    return [urljoin(site_url, src) for src in srcs]


def extract_questions(js):
    for literal in re.findall(r"JSON\.parse\(`(.*?)`\)", js, re.S):
        # Undo JS template-literal escaping (\\ \` \$) to get the original JSON text
        literal = re.sub(r"\\([\\`$])", r"\1", literal)
        try:
            data = json.loads(literal)
        except json.JSONDecodeError:
            continue
        if isinstance(data, list) and data and "correct_answers" in data[0]:
            return data
    return None


def clean(question):
    # Category ids use underscores ("Computer_Hardware"); store a readable name
    question["category"] = question["category"].replace("_", " ")
    # Drop leftover citation markers like "[2, 3, 4]" from explanations
    question["explanation"] = re.sub(r"\s*\[\d+(?:,\s*\d+)*\]", "", question.get("explanation", "")).strip()
    return question


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    html = fetch(args.url)
    questions = None
    for bundle_url in find_bundle_urls(args.url, html):
        questions = extract_questions(fetch(bundle_url))
        if questions:
            print(f"Found {len(questions)} questions in {bundle_url}")
            break
    if not questions:
        raise SystemExit("No embedded question set found on the site.")

    questions = [clean(q) for q in questions]
    if EXTRA_FILE.exists():
        extra = json.loads(EXTRA_FILE.read_text())["questions"]
        taken = {q["id"] for q in questions}
        clashes = [q["id"] for q in extra if q["id"] in taken]
        if clashes:
            raise SystemExit(f"{EXTRA_FILE.name} reuses ids already on the site: {clashes}")
        questions += [clean(q) for q in extra]
        print(f"Merged {len(extra)} extra questions from {EXTRA_FILE.name}")
    categories = list(dict.fromkeys(q["category"] for q in questions))
    output = {
        "metadata": {"source": args.url, "total_questions": len(questions), "categories": categories},
        "questions": questions,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {args.out} ({len(categories)} categories)")


if __name__ == "__main__":
    main()
