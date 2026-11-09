# Da capo

Carnet d’écoute de musique classique : une frise des compositeurs posés sur une portée, leurs vies, leurs liens, leurs œuvres phares, et pour chaque écoute une note sur 10, un texte, les interprètes et des moments horodatés.

```
app/        Application web (SvelteKit 3, Svelte 5, TypeScript strict, Drizzle, Postgres)
pipeline/   Import des données de référence en Python (Open Opus, Wikidata, Wikipédia)
data/       reference.json, produit par le pipeline et lu par l’app (non versionné)
```

## Démarrer en local

Il faut Node 22.17 ou plus récent et [uv](https://docs.astral.sh/uv/). Les deux s’installent sans droits administrateur : Node avec [fnm](https://github.com/Schniz/fnm) (`fnm install 22`), uv avec son script d’installation. Sinon, ouvre le dépôt dans GitHub Codespaces, la configuration `.devcontainer` installe tout.

**1. Construire les données de référence** (quelques minutes) :

```sh
cd pipeline
uv sync
uv run da-capo-import --contact "ton.email@exemple.com"
```

Le contact est exigé par la politique d’usage des API Wikimedia. Pour un premier essai rapide : `--scope essential` (les seuls compositeurs essentiels d’Open Opus).

**2. Lancer l’app** :

```sh
cd app
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

En local, sans `DATABASE_URL`, l’app utilise PGlite : un vrai Postgres embarqué, stocké dans `app/.data/`. Rien d’autre à installer. Sans `APP_PASSWORD`, la connexion est désactivée en développement.

Après une mise à jour du code, relance `npm run db:migrate` : les migrations s’appliquent sans toucher aux données existantes, en local comme sur Supabase.

Pour rafraîchir le catalogue plus tard, relance le pipeline puis `npm run db:seed` : l’import met à jour compositeurs et œuvres sans toucher à tes écoutes, tes versions, tes mouvements ni aux compositeurs que tu suis.

## Mettre en ligne

1. **Base de données** : crée un projet [Supabase](https://supabase.com). Dans *Connect*, récupère deux URL : celle du *session pooler* (port 5432) pour les commandes depuis ta machine, celle du *transaction pooler* (port 6543) pour Vercel.
2. **Schéma et données**, depuis `app/` avec l’URL du session pooler :
   ```sh
   DATABASE_URL="postgresql://..." npm run db:migrate
   DATABASE_URL="postgresql://..." npm run db:seed
   ```
3. **Hébergement** : importe le dépôt sur [Vercel](https://vercel.com), choisis `app` comme *Root Directory*, puis ajoute les variables :
   - `DATABASE_URL` : l’URL du transaction pooler ;
   - `APP_PASSWORD` : ton mot de passe (12 caractères minimum) ;
   - `SESSION_SECRET` : une chaîne aléatoire, par exemple la sortie de `openssl rand -base64 48`.

   Changer `SESSION_SECRET` déconnecte toutes les sessions.
4. **Sur l’iPhone** : ouvre l’app dans Safari, *Partager*, puis *Sur l’écran d’accueil*. Elle s’ouvre ensuite en plein écran comme une app.

## Utilisation

- **Suivre un compositeur** l’ajoute à la frise. Au premier import, les compositeurs populaires d’Open Opus sont suivis ; ceux que tu écoutes y apparaissent d’office.
- **Mouvements** : Open Opus ne les fournit pas. Renseigne-les une fois sur la page de l’œuvre pour pouvoir noter chaque mouvement.
- **Moments** : un par ligne, au format `II 7:10 Dialogue avec les bois`. Le mouvement (en chiffres romains ou arabes) et le minutage sont facultatifs : `3:42 Le cor` ou `III. Finale trop lourd` fonctionnent aussi.
- **Version de référence** : une par œuvre. C’est sa note qui représente l’œuvre sur la page du compositeur ; sans référence, c’est la version écoutée le plus récemment.
- **Concerts** : crée le concert (date, salle, interprètes), puis ajoute les œuvres du programme, éventuellement à l’avance pour une saison entière. Chaque œuvre devient une version « en concert » de l’œuvre : elle apparaît dans son comparateur, compte pour la frise et les statistiques. Après la soirée, le bouton *Noter* ouvre la saisie habituelle, datée du jour du concert, puis te ramène au programme.
- **Statistiques** : tes douze derniers mois d’écoute jour par jour, la répartition par période et par genre, la distribution de tes notes, tes compositeurs et interprètes les plus présents. Les interprètes sont comptés en découpant le champ libre aux virgules : « Rostropovitch, Berliner Philharmoniker, Karajan » compte pour trois.

## Qualité

```sh
cd app && npm run lint && npm run check && npm test
cd pipeline && uv run ruff check . && uv run mypy src tests && uv run pytest
```

Les tests de l’app tournent sur un Postgres PGlite en mémoire avec les vraies migrations. Un test de contrat vérifie que le fichier produit par le pipeline Python est accepté par le schéma de l’app. La CI GitHub Actions lance tout à chaque push.

## Sources et licences des données

Catalogue : [Open Opus](https://openopus.org) (domaine public). Lieux et liens entre compositeurs : [Wikidata](https://www.wikidata.org) (CC0). Biographies : résumés de [Wikipédia](https://fr.wikipedia.org) (CC BY-SA), affichés avec un lien vers l’article. C’est pour cela que `data/reference.json` n’est pas versionné.
