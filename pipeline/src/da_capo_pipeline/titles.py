import re

FORMS: tuple[tuple[str, str], ...] = (
    ("Prelude and Fugue", "Prélude et fugue"),
    ("Toccata and Fugue", "Toccata et fugue"),
    ("Piano Concerto", "Concerto pour piano"),
    ("Violin Concerto", "Concerto pour violon"),
    ("Cello Concerto", "Concerto pour violoncelle"),
    ("Viola Concerto", "Concerto pour alto"),
    ("Flute Concerto", "Concerto pour flûte"),
    ("Oboe Concerto", "Concerto pour hautbois"),
    ("Clarinet Concerto", "Concerto pour clarinette"),
    ("Bassoon Concerto", "Concerto pour basson"),
    ("Horn Concerto", "Concerto pour cor"),
    ("Trumpet Concerto", "Concerto pour trompette"),
    ("Organ Concerto", "Concerto pour orgue"),
    ("Harpsichord Concerto", "Concerto pour clavecin"),
    ("Double Concerto", "Double concerto"),
    ("Triple Concerto", "Triple concerto"),
    ("Concerto", "Concerto"),
    ("Piano Sonata", "Sonate pour piano"),
    ("Violin Sonata", "Sonate pour violon"),
    ("Cello Sonata", "Sonate pour violoncelle"),
    ("Viola Sonata", "Sonate pour alto"),
    ("Flute Sonata", "Sonate pour flûte"),
    ("Clarinet Sonata", "Sonate pour clarinette"),
    ("Keyboard Sonata", "Sonate pour clavier"),
    ("Organ Sonata", "Sonate pour orgue"),
    ("Trio Sonata", "Sonate en trio"),
    ("Sonata", "Sonate"),
    ("Cello Suite", "Suite pour violoncelle seul"),
    ("Orchestral Suite", "Suite pour orchestre"),
    ("English Suite", "Suite anglaise"),
    ("French Suite", "Suite française"),
    ("Suite", "Suite"),
    ("Partita", "Partita"),
    ("Sinfonia concertante", "Symphonie concertante"),
    ("Symphonic Poem", "Poème symphonique"),
    ("Symphony", "Symphonie"),
    ("String Quartet", "Quatuor à cordes"),
    ("String Quintet", "Quintette à cordes"),
    ("String Sextet", "Sextuor à cordes"),
    ("String Trio", "Trio à cordes"),
    ("Piano Trio", "Trio avec piano"),
    ("Piano Quartet", "Quatuor avec piano"),
    ("Piano Quintet", "Quintette avec piano"),
    ("Clarinet Quintet", "Quintette avec clarinette"),
    ("Wind Quintet", "Quintette à vent"),
    ("Octet", "Octuor"),
    ("Septet", "Septuor"),
    ("Sextet", "Sextuor"),
    ("Quintet", "Quintette"),
    ("Quartet", "Quatuor"),
    ("Trio", "Trio"),
    ("Mass", "Messe"),
    ("Requiem", "Requiem"),
    ("Cantata", "Cantate"),
    ("Overture", "Ouverture"),
    ("Preludes", "Préludes"),
    ("Prelude", "Prélude"),
    ("Etudes", "Études"),
    ("Études", "Études"),
    ("Etude", "Étude"),
    ("Étude", "Étude"),
    ("Nocturnes", "Nocturnes"),
    ("Nocturne", "Nocturne"),
    ("Ballade", "Ballade"),
    ("Scherzo", "Scherzo"),
    ("Mazurka", "Mazurka"),
    ("Polonaise", "Polonaise"),
    ("Impromptu", "Impromptu"),
    ("Waltzes", "Valses"),
    ("Waltz", "Valse"),
    ("Hungarian Rhapsody", "Rhapsodie hongroise"),
    ("Hungarian Dances", "Danses hongroises"),
    ("Slavonic Dances", "Danses slaves"),
    ("Rhapsody", "Rhapsodie"),
    ("Serenade", "Sérénade"),
    ("Fantasia", "Fantaisie"),
    ("Fantasy", "Fantaisie"),
    ("Variations", "Variations"),
    ("Fugue", "Fugue"),
    ("Divertimento", "Divertimento"),
    ("Romance", "Romance"),
)

NOTES = {"C": "do", "D": "ré", "E": "mi", "F": "fa", "G": "sol", "A": "la", "B": "si"}
ACCIDENTALS = {"flat": " bémol", "sharp": " dièse"}
MODES = {"major": "majeur", "minor": "mineur"}

SCORING: tuple[tuple[str, str], ...] = (
    ("for piano four hands", "pour piano à quatre mains"),
    ("for two pianos", "pour deux pianos"),
    ("for violin and piano", "pour violon et piano"),
    ("for cello and piano", "pour violoncelle et piano"),
    ("for viola and piano", "pour alto et piano"),
    ("for flute and piano", "pour flûte et piano"),
    ("for clarinet and piano", "pour clarinette et piano"),
    ("for violin and orchestra", "pour violon et orchestre"),
    ("for cello and orchestra", "pour violoncelle et orchestre"),
    ("for piano and orchestra", "pour piano et orchestre"),
    ("for solo violin", "pour violon seul"),
    ("for solo cello", "pour violoncelle seul"),
    ("for string orchestra", "pour orchestre à cordes"),
    ("for strings", "pour cordes"),
    ("for orchestra", "pour orchestre"),
    ("for piano", "pour piano"),
    ("for organ", "pour orgue"),
    ("for harpsichord", "pour clavecin"),
)

KEY_PATTERN = re.compile(r"\bin ([A-G])(?:[- ](flat|sharp))? (major|minor)\b")
NUMBER_PATTERN = re.compile(r"\bnos?\.\s*", re.IGNORECASE)
QUOTE_PATTERN = re.compile(r'"([^"]+)"')
ENGLISH_RESIDUE = re.compile(r"\b(for|and|in|with|the|of|on|by|from|to|after)\b", re.IGNORECASE)


def _translate_key(match: re.Match[str]) -> str:
    note, accidental, mode = match.group(1), match.group(2), match.group(3)
    return f"en {NOTES[note]}{ACCIDENTALS.get(accidental or '', '')} {MODES[mode]}"


def _translate_number(match: re.Match[str]) -> str:
    return "n°s " if match.group(0).lower().startswith("nos") else "n° "


def _without_quotes(text: str) -> str:
    return re.sub(r"«[^»]*»", "", text)


def translate_title(title: str) -> str | None:
    form = next(
        (
            (english, french)
            for english, french in FORMS
            if title == english or re.match(rf"{re.escape(english)}\b", title)
        ),
        None,
    )
    if form is None:
        return None
    english, french = form
    translated = french + title[len(english) :]
    for source, target in SCORING:
        translated = re.sub(rf"\b{re.escape(source)}\b", target, translated, flags=re.IGNORECASE)
    translated = KEY_PATTERN.sub(_translate_key, translated)
    translated = NUMBER_PATTERN.sub(_translate_number, translated)
    translated = QUOTE_PATTERN.sub(r"« \1 »", translated)
    if ENGLISH_RESIDUE.search(_without_quotes(translated)):
        return None
    return translated if translated != title else None
