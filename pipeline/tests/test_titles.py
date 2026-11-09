import pytest

from da_capo_pipeline.titles import translate_title


@pytest.mark.parametrize(
    ("title", "expected"),
    [
        ("Cello Concerto in B minor, op. 104", "Concerto pour violoncelle en si mineur, op. 104"),
        (
            "Piano Quintet in E flat major, op. 44",
            "Quintette avec piano en mi bémol majeur, op. 44",
        ),
        (
            "String Quartet no. 14 in C sharp minor, op. 131",
            "Quatuor à cordes n° 14 en do dièse mineur, op. 131",
        ),
        (
            'Symphony no. 4 in E flat major, WAB 104, "Romantic"',
            "Symphonie n° 4 en mi bémol majeur, WAB 104, « Romantic »",
        ),
        (
            'Piano Sonata no. 11 in A major, K.331, "Alla turca"',
            "Sonate pour piano n° 11 en la majeur, K.331, « Alla turca »",
        ),
        (
            "Cello Sonata no. 4 in C major, op. 102, no. 1",
            "Sonate pour violoncelle n° 4 en do majeur, op. 102, n° 1",
        ),
        ("Prelude in C-sharp minor, op. 3, no. 2", "Prélude en do dièse mineur, op. 3, n° 2"),
        ("Mass in B minor, BWV 232", "Messe en si mineur, BWV 232"),
        ("Fantasy in C major, op. 17", "Fantaisie en do majeur, op. 17"),
        ("Sonata for violin and piano in A major", "Sonate pour violon et piano en la majeur"),
        (
            "Cello Suite no. 1 in G major, BWV 1007",
            "Suite pour violoncelle seul n° 1 en sol majeur, BWV 1007",
        ),
    ],
)
def test_translates_common_forms(title: str, expected: str) -> None:
    assert translate_title(title) == expected


@pytest.mark.parametrize(
    "title",
    [
        "The Rite of Spring",
        "Carnaval, op. 9",
        "Concerto in G minor for Organ, Strings, and Timpani, FP93",
        "Variations on a Theme by Haydn, op. 56a",
        "Massenet Homage",
        "Suite bergamasque",
    ],
)
def test_leaves_unknown_or_mixed_titles_untranslated(title: str) -> None:
    assert translate_title(title) is None
