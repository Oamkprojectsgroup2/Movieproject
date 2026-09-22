# CineCircle – Test Users and Test Data

> ⚠️ For development and testing only. These credentials are public – never load this data into a production database.

## Setup

```bash
psql -U postgres -d <database> -f schema.sql
psql -U postgres -d <database> -f seed.sql
```

Passwords are stored as bcrypt hashes (cost 10), so `bcrypt.compare()` works with them directly. All passwords meet the requirement: at least 8 characters, one uppercase letter and one digit. Pattern: `<FirstName>Test<no>` (ä/ö replaced with a/o).

## Users

| ID | Username | Email (login) | Password | Reviews | Favs | Share token | Note |
|---|---|---|---|---|---|---|---|
| 1 | `aino_v` | aino.virtanen@example.com | `AinoTest01` | 5 | 7 | `f38b2ffc-80a4-4f5a-91c9-bc701e7ea419` | Owner of group 1 |
| 2 | `mikkok` | mikko.korhonen@example.com | `MikkoTest02` | 9 | 7 | – |  |
| 3 | `laura_leffat` | laura.nieminen@example.com | `LauraTest03` | 4 | 10 | `f3f49249-dc28-4f90-a5ae-c7978306d03b` | Owner of group 2 |
| 4 | `jussim` | jussi.makinen@example.com | `JussiTest04` | 4 | 7 | – |  |
| 5 | `emma_h` | emma.hamalainen@example.com | `EmmaTest05` | 5 | 5 | `e5121482-3929-4d22-a255-accb1a466884` | Owner of group 3 |
| 6 | `villelaine` | ville.laine@example.com | `VilleTest06` | 6 | 9 | – |  |
| 7 | `sanna_h` | sanna.heikkinen@example.com | `SannaTest07` | 10 | 10 | `6bad6be2-8e7a-46e9-9f19-950499dd251d` |  |
| 8 | `antti_k` | antti.koskinen@example.com | `AnttiTest08` | 6 | 8 | – | Owner of group 4 |
| 9 | `tiinaj` | tiina.jarvinen@example.com | `TiinaTest09` | 9 | 5 | `d7a7a3cc-8c3d-4f16-9293-de8fc88b2875` |  |
| 10 | `petri_l` | petri.lehtonen@example.com | `PetriTest10` | 7 | 6 | – |  |
| 11 | `noora` | noora.lehtinen@example.com | `NooraTest11` | 5 | 9 | `7dabe929-c4a3-44bf-86cd-75e9bb049a79` |  |
| 12 | `kalle_s` | kalle.saarinen@example.com | `KalleTest12` | 5 | 10 | – |  |
| 13 | `riikka_s` | riikka.salminen@example.com | `RiikkaTest13` | 8 | 8 | `70eb9a0a-9626-4ae6-85e8-18fac0433cbd` |  |
| 14 | `teemuh` | teemu.heinonen@example.com | `TeemuTest14` | 9 | 4 | – |  |
| 15 | `elina_n` | elina.niemi@example.com | `ElinaTest15` | 9 | 7 | `14aa4e71-9d3c-4dec-80a6-1f933d6c51e3` |  |
| 16 | `jäärä_jari` | jari.heikkila@example.com | `JariTest16` | 6 | 4 | – | Username contains Finnish letters ä/ö (encoding test) |
| 17 | `oona_movie_fanatic_2026xy` | oona.kinnunen@example.com | `OonaTest17` | 7 | 9 | `1919e93a-d117-45ad-8988-93101c593af5` | Username exactly 25 characters (max length) |
| 18 | `empty_tester` | empty.tester@example.com | `EmptyTest18` | 0 | 0 | – | NO reviews, favorites or groups (empty states) |
| 19 | `delete_tester` | delete.tester@example.com | `DeleteTest19` | 6 | 4 | `e4163207-d094-4996-82f0-ee99731c9452` | Account DELETION test: has reviews, favorites and memberships, owns no group |
| 20 | `owner_delete_test` | owner.deletetest@example.com | `OwnerTest20` | 10 | 8 | `5071950e-adec-4f11-bd83-6e77af67d461` | Owner of group 5 -> account deletion fails due to ON DELETE RESTRICT |

## Groups

| ID | Name | Owner | Accepted members | Pending | Rejected |
|---|---|---|---|---|---|
| 1 | Nolan Fans | aino_v | aino_v, mikkok, villelaine, petri_l, teemuh, delete_tester | sanna_h, noora | riikka_s |
| 2 | Friday Horror Night | laura_leffat | laura_leffat, jussim, tiinaj, jäärä_jari | delete_tester, elina_n | – |
| 3 | Studio Ghibli & Animation | emma_h | emma_h, noora, riikka_s, oona_movie_fanatic_2026xy | antti_k | mikkok |
| 4 | Sci-Fi Classics | antti_k | antti_k, mikkok, kalle_s, teemuh, delete_tester, villelaine | jussim | petri_l |
| 5 | Oulu Movie Club | owner_delete_test | owner_delete_test, kalle_s, aino_v, sanna_h | tiinaj, laura_leffat | – |

Group favorites: each group has 3–6 movies. In group 1, one favorite has `user_id` NULL (simulates the adder having deleted their account – `ON DELETE SET NULL`).

## Ready-made Test Scenarios

| Scenario | Data |
|---|---|
| Login OK | `aino.virtanen@example.com` / `AinoTest01` → 200 + JWT |
| Wrong password | `aino.virtanen@example.com` / `AinoTest99` → 401 |
| Unknown user | `nobody@example.com` / `Something123` → 401 (same error message as wrong password) |
| Register, email already taken | `mikko.korhonen@example.com` → 409 / 400 |
| Register, username already taken | `mikkok` → 409 / 400 |
| Register, weak passwords | `short1A` (7 chars), `noupper123` (no uppercase), `NoDigitsHere` (no digit) → 400 |
| Delete account OK | `delete_tester` (ID 19) – reviews, favorites and memberships are removed by CASCADE; verify the rows are gone |
| Delete account, owns a group | `owner_delete_test` (ID 20) owns group 5 → `ON DELETE RESTRICT` blocks deletion. The app must handle this (delete groups first / return a clear error) |
| Empty states | `empty_tester` (ID 18): no reviews, favorites or groups |
| Browse reviews | Popular movies have several reviews, e.g. Fight Club (550), Inception (27205), The Dark Knight (155) |
| Review without text | Some reviews have `review` NULL – stars only |
| Duplicate review | Same user + same movie again → UNIQUE violation, API should return 409 |
| Shared favorites list | Users with a share token have a working share link; for others the token is NULL |
| Group page access | Non-members and pending members cannot see group content (e.g. `sanna_h` is pending in group 1) |
| Handling join requests | Group 1 owner `aino_v` can accept/reject the requests from `sanna_h` and `noora` |
| Remove member / leave group | `aino_v` removes a member from group 1, or `mikkok` leaves on their own |
| Encoding | `jäärä_jari` – Finnish letters in username |
| Max length | `oona_movie_fanatic_2026xy` = 25 characters; 26 characters should be rejected |

## TMDB Movies Used

| TMDB ID | Movie |
|---|---|
| 11 | Star Wars |
| 12 | Finding Nemo |
| 13 | Forrest Gump |
| 77 | Memento |
| 78 | Blade Runner |
| 98 | Gladiator |
| 105 | Back to the Future |
| 115 | The Big Lebowski |
| 120 | The Lord of the Rings: The Fellowship of the Ring |
| 122 | The Lord of the Rings: The Return of the King |
| 129 | Spirited Away |
| 155 | The Dark Knight |
| 238 | The Godfather |
| 240 | The Godfather Part II |
| 274 | The Silence of the Lambs |
| 278 | The Shawshank Redemption |
| 329 | Jurassic Park |
| 348 | Alien |
| 424 | Schindler's List |
| 489 | Good Will Hunting |
| 550 | Fight Club |
| 578 | Jaws |
| 603 | The Matrix |
| 680 | Pulp Fiction |
| 694 | The Shining |
| 769 | GoodFellas |
| 807 | Se7en |
| 857 | Saving Private Ryan |
| 862 | Toy Story |
| 1124 | The Prestige |
| 1422 | The Departed |
| 1891 | The Empire Strikes Back |
| 16869 | Inglourious Basterds |
| 19995 | Avatar |
| 27205 | Inception |
| 76341 | Mad Max: Fury Road |
| 157336 | Interstellar |
| 244786 | Whiplash |
| 299534 | Avengers: Endgame |
| 313369 | La La Land |
| 346698 | Barbie |
| 354912 | Coco |
| 372058 | Your Name. |
| 438631 | Dune |
| 475557 | Joker |
| 496243 | Parasite |
| 693134 | Dune: Part Two |
| 872585 | Oppenheimer |
