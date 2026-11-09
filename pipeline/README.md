# da-capo-pipeline

Construit `data/reference.json` : compositeurs et œuvres depuis Open Opus, lieux, liens maître/élève et influences depuis Wikidata, biographies depuis Wikipédia, titres traduits en français pour les formes courantes.

```sh
uv sync
uv run da-capo-import --contact "ton.email@exemple.com"
```

Options utiles : `--scope essential` pour un import rapide limité aux compositeurs essentiels, `--skip-wikidata` pour ne garder que le catalogue Open Opus.
