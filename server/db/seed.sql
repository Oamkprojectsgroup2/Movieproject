-- CineCircle test data. Run schema.sql FIRST, then this file.
-- FOR LOCAL DEVELOPMENT/TEST DATABASES ONLY. Never run against a production database.
-- Generated with generate_seed.py. Passwords are hashed with bcrypt (cost 10).
-- Login credentials: TEST_USERS.md

BEGIN;

-- ===== USERS =====
INSERT INTO users (user_id, user_name, email, password, shared_token) OVERRIDING SYSTEM VALUE VALUES
  (1, 'aino_v', 'aino.virtanen@example.com', '$2b$10$Gp3dPhudaafadq6VgfW6JeRPEvjbI3XvWq6N9Kw3iWHkZg3X41vJS', 'f38b2ffc-80a4-4f5a-91c9-bc701e7ea419'),
  (2, 'mikkok', 'mikko.korhonen@example.com', '$2b$10$.EqjK8VBSPb0mJenim7o4uDSod0j7bfYu9oKWYSl9J4lTOIEGb7Z6', NULL),
  (3, 'laura_leffat', 'laura.nieminen@example.com', '$2b$10$K4pT2bVZr0vAh052U6hDCO1/caHozJ.RsakN.Q0ChhvAt9xbvTpZa', 'f3f49249-dc28-4f90-a5ae-c7978306d03b'),
  (4, 'jussim', 'jussi.makinen@example.com', '$2b$10$80LPBJPWh4o2x9sz//8vRuG/JKTHK.1KhTf8SW5d0Q/eeckKQNGhK', NULL),
  (5, 'emma_h', 'emma.hamalainen@example.com', '$2b$10$b3vkQGynITIEYZWHdlwglOzv.jJvJjNODk63mzlq7rnsrkBwMeZAK', 'e5121482-3929-4d22-a255-accb1a466884'),
  (6, 'villelaine', 'ville.laine@example.com', '$2b$10$A6rmx9.CCegGbQcK4swd.eXn1TXJw9KxjLn78sq3JfZyRo6wKJyc.', NULL),
  (7, 'sanna_h', 'sanna.heikkinen@example.com', '$2b$10$ic9fgc2zZKPy/QWJgpvu1.Ql9cHiRIxG06Vnd3/ivHAJaoDIDs.WO', '6bad6be2-8e7a-46e9-9f19-950499dd251d'),
  (8, 'antti_k', 'antti.koskinen@example.com', '$2b$10$uFPVyctZwFYB00T/1Evjk.R6/ycDouIWXUoQk06Kj3u05X4A3mzU6', NULL),
  (9, 'tiinaj', 'tiina.jarvinen@example.com', '$2b$10$f/ChkmqvUtFOXjKHhTPgFulkuvXn5wEbwl7eIObbYYUl7yb/WaCU2', 'd7a7a3cc-8c3d-4f16-9293-de8fc88b2875'),
  (10, 'petri_l', 'petri.lehtonen@example.com', '$2b$10$EWbe4RKzH9Z65oGFVkxX5u47dhm7NsWu7cKVxS5pfXAN2KGFygiv2', NULL),
  (11, 'noora', 'noora.lehtinen@example.com', '$2b$10$Hj4txWRb8L6iSucmSmPA5eg0lJ.pQXZoigFOVS8rl17GVdEmEP53K', '7dabe929-c4a3-44bf-86cd-75e9bb049a79'),
  (12, 'kalle_s', 'kalle.saarinen@example.com', '$2b$10$a82C.iWkiKTQjA8pqeCv.OM4DlJacTghiMtVXX.JSSK3VBJsESkw.', NULL),
  (13, 'riikka_s', 'riikka.salminen@example.com', '$2b$10$4A3ttUWRUCGhcQZBoizZQO7BKwNt.3xxLrjLnhLYFqT.N5AFY/Xqm', '70eb9a0a-9626-4ae6-85e8-18fac0433cbd'),
  (14, 'teemuh', 'teemu.heinonen@example.com', '$2b$10$rZyNbLI5IaFsBjtkw0a0cefaxEy86O9NwY2m52mD9qe4aZzUGP8fq', NULL),
  (15, 'elina_n', 'elina.niemi@example.com', '$2b$10$sxHp1Utzax1Gt.8dHeamJ.PAZDjsyqPNhbk15.19rEFkmvvGQ1rrq', '14aa4e71-9d3c-4dec-80a6-1f933d6c51e3'),
  (16, 'jäärä_jari', 'jari.heikkila@example.com', '$2b$10$JdobekgTexgOx.uBRl6TkOBXWrK2OKh4VAz8bIhNdx3puQQZEZe.u', NULL),
  (17, 'oona_movie_fanatic_2026xy', 'oona.kinnunen@example.com', '$2b$10$mOlkX80azqcbQGFrj62fLOBEOlGrYSwVDqgBq/8oqPQZAj9wo/gqW', '1919e93a-d117-45ad-8988-93101c593af5'),
  (18, 'empty_tester', 'empty.tester@example.com', '$2b$10$oGHVsHDaNXD/8lbUTKDT.OcHSePlVRpGn5Jc9ywaZ7D0LDplVijb.', NULL),
  (19, 'delete_tester', 'delete.tester@example.com', '$2b$10$dDEPxCamPpCfu07Fg.PFbeh8Q6OGm1V6pUo5kU.rMUdQKZGpsJtBq', 'e4163207-d094-4996-82f0-ee99731c9452'),
  (20, 'owner_delete_test', 'owner.deletetest@example.com', '$2b$10$oS08dneHhQB.yjxOIy/SZ.Ff3DGC6isA031oXb3lMaNqvgCiE1Mnu', '5071950e-adec-4f11-bd83-6e77af67d461');

-- ===== REVIEWS =====
INSERT INTO reviews (movies_tmdb_id, user_id, created_at, star, review) VALUES
  (129, 1, '2026-05-06 02:42:00', 5, NULL),  -- Spirited Away
  (27205, 1, '2026-09-13 13:37:00', 4, 'Watched it twice in one week.'),  -- Inception
  (78, 1, '2026-02-03 17:25:00', 3, 'Solid but forgettable.'),  -- Blade Runner
  (115, 1, '2026-05-13 16:04:00', 4, NULL),  -- The Big Lebowski
  (603, 1, '2026-02-15 22:24:00', 4, 'Watched it twice in one week.'),  -- The Matrix
  (1891, 2, '2026-02-25 23:33:00', 4, 'Almost perfect, the middle drags a little.'),  -- The Empire Strikes Back
  (475557, 2, '2026-09-12 07:19:00', 3, 'Decent watch, nothing special.'),  -- Joker
  (16869, 2, '2026-01-25 20:37:00', 5, '10/10 would recommend to everyone.'),  -- Inglourious Basterds
  (680, 2, '2026-05-23 19:11:00', 5, 'Still gives me chills after many rewatches.'),  -- Pulp Fiction
  (11, 2, '2026-04-04 10:07:00', 5, '10/10 would recommend to everyone.'),  -- Star Wars
  (12, 2, '2026-05-30 13:15:00', 3, 'Decent watch, nothing special.'),  -- Finding Nemo
  (157336, 2, '2026-01-27 06:33:00', 5, 'Still gives me chills after many rewatches.'),  -- Interstellar
  (155, 2, '2026-04-07 03:03:00', 5, 'An absolute masterpiece.'),  -- The Dark Knight
  (862, 2, '2026-03-12 22:51:00', 4, NULL),  -- Toy Story
  (489, 3, '2026-04-02 17:24:00', 4, 'Watched it twice in one week.'),  -- Good Will Hunting
  (694, 3, '2026-03-27 12:52:00', 5, 'Still gives me chills after many rewatches.'),  -- The Shining
  (862, 3, '2026-04-19 13:28:00', 4, 'Great cast and a strong script.'),  -- Toy Story
  (769, 3, '2026-01-24 07:10:00', 3, 'Good acting, a bit too long.'),  -- GoodFellas
  (157336, 4, '2026-08-11 17:27:00', 4, 'Great cast and a strong script.'),  -- Interstellar
  (372058, 4, '2026-04-20 04:17:00', 3, 'Solid but forgettable.'),  -- Your Name.
  (550, 4, '2026-07-31 15:02:00', 5, 'An absolute masterpiece.'),  -- Fight Club
  (807, 4, '2026-05-27 15:48:00', 3, 'Decent watch, nothing special.'),  -- Se7en
  (769, 5, '2026-07-14 21:29:00', 4, 'Great cast and a strong script.'),  -- GoodFellas
  (438631, 5, '2026-05-24 06:40:00', 5, 'Every scene is perfect. Watch it in a cinema if you can.'),  -- Dune
  (240, 5, '2026-02-24 08:06:00', 4, 'Watched it twice in one week.'),  -- The Godfather Part II
  (122, 5, '2026-08-27 21:19:00', 3, NULL),  -- The Lord of the Rings: The Return of the King
  (155, 5, '2026-09-14 00:06:00', 3, 'Good acting, a bit too long.'),  -- The Dark Knight
  (1891, 6, '2026-08-23 14:57:00', 3, 'Good acting, a bit too long.'),  -- The Empire Strikes Back
  (680, 6, '2026-04-07 15:54:00', 5, 'One of my all-time favourites!'),  -- Pulp Fiction
  (11, 6, '2026-07-08 01:50:00', 4, 'Really enjoyed this one!'),  -- Star Wars
  (155, 6, '2026-06-07 03:34:00', 3, NULL),  -- The Dark Knight
  (240, 6, '2026-07-22 11:41:00', 5, NULL),  -- The Godfather Part II
  (603, 6, '2026-07-01 21:22:00', 2, 'The ending ruined it for me.'),  -- The Matrix
  (475557, 7, '2026-03-07 22:40:00', 5, 'Every scene is perfect. Watch it in a cinema if you can.'),  -- Joker
  (550, 7, '2026-06-25 05:25:00', 4, NULL),  -- Fight Club
  (424, 7, '2026-04-15 08:53:00', 2, 'Great visuals, weak story.'),  -- Schindler's List
  (329, 7, '2026-09-12 22:23:00', 1, 'Overhyped. Nothing worked for me.'),  -- Jurassic Park
  (1422, 7, '2026-07-20 22:18:00', 2, 'Not my kind of movie.'),  -- The Departed
  (244786, 7, '2026-04-03 13:01:00', 3, 'Decent watch, nothing special.'),  -- Whiplash
  (278, 7, '2026-03-03 07:46:00', 4, 'Watched it twice in one week.'),  -- The Shawshank Redemption
  (157336, 7, '2026-06-06 03:40:00', 1, 'Two hours I will never get back.'),  -- Interstellar
  (603, 7, '2026-02-18 06:25:00', 2, 'Some good moments, but mostly boring.'),  -- The Matrix
  (348, 7, '2026-06-24 15:27:00', 1, 'Overhyped. Nothing worked for me.'),  -- Alien
  (129, 8, '2026-08-03 06:20:00', 4, 'Watched it twice in one week.'),  -- Spirited Away
  (489, 8, '2026-06-21 19:16:00', 4, 'Really enjoyed this one!'),  -- Good Will Hunting
  (872585, 8, '2026-08-07 09:41:00', 4, NULL),  -- Oppenheimer
  (11, 8, '2026-03-21 12:54:00', 4, 'Great cast and a strong script.'),  -- Star Wars
  (155, 8, '2026-07-26 13:23:00', 5, NULL),  -- The Dark Knight
  (603, 8, '2026-06-11 23:26:00', 3, NULL),  -- The Matrix
  (1124, 9, '2026-03-19 19:59:00', 4, 'Great cast and a strong script.'),  -- The Prestige
  (550, 9, '2026-09-13 08:28:00', 3, 'Good acting, a bit too long.'),  -- Fight Club
  (155, 9, '2026-02-17 00:56:00', 4, 'Really enjoyed this one!'),  -- The Dark Knight
  (13, 9, '2026-04-19 16:45:00', 3, 'Good acting, a bit too long.'),  -- Forrest Gump
  (1422, 9, '2026-08-23 12:56:00', 2, 'Not my kind of movie.'),  -- The Departed
  (694, 9, '2026-06-22 20:02:00', 4, 'Really enjoyed this one!'),  -- The Shining
  (19995, 9, '2026-02-20 00:17:00', 4, 'Great cast and a strong script.'),  -- Avatar
  (122, 9, '2026-08-30 09:11:00', 5, 'Every scene is perfect. Watch it in a cinema if you can.'),  -- The Lord of the Rings: The Return of the King
  (603, 9, '2026-07-14 14:46:00', 5, 'Every scene is perfect. Watch it in a cinema if you can.'),  -- The Matrix
  (438631, 10, '2026-03-13 17:18:00', 4, 'Almost perfect, the middle drags a little.'),  -- Dune
  (872585, 10, '2026-02-19 08:40:00', 5, 'Every scene is perfect. Watch it in a cinema if you can.'),  -- Oppenheimer
  (155, 10, '2026-08-13 18:20:00', 3, 'Fun once, probably won''t rewatch.'),  -- The Dark Knight
  (694, 10, '2026-04-30 08:43:00', 3, 'Good acting, a bit too long.'),  -- The Shining
  (157336, 10, '2026-06-10 11:25:00', 3, 'Solid but forgettable.'),  -- Interstellar
  (372058, 10, '2026-08-26 14:11:00', 5, 'Every scene is perfect. Watch it in a cinema if you can.'),  -- Your Name.
  (603, 10, '2026-05-11 05:33:00', 5, '10/10 would recommend to everyone.'),  -- The Matrix
  (129, 11, '2026-03-11 04:20:00', 5, 'An absolute masterpiece.'),  -- Spirited Away
  (98, 11, '2026-06-29 11:11:00', 2, 'The ending ruined it for me.'),  -- Gladiator
  (27205, 11, '2026-04-13 15:37:00', 3, 'Fun once, probably won''t rewatch.'),  -- Inception
  (157336, 11, '2026-08-27 07:39:00', 2, 'Some good moments, but mostly boring.'),  -- Interstellar
  (603, 11, '2026-04-17 14:50:00', 5, 'One of my all-time favourites!'),  -- The Matrix
  (115, 12, '2026-09-10 15:29:00', 3, 'Fun once, probably won''t rewatch.'),  -- The Big Lebowski
  (496243, 12, '2026-07-17 21:48:00', 2, 'The ending ruined it for me.'),  -- Parasite
  (313369, 12, '2026-07-05 05:23:00', 3, 'Solid but forgettable.'),  -- La La Land
  (603, 12, '2026-03-18 12:19:00', 2, 'Some good moments, but mostly boring.'),  -- The Matrix
  (19995, 12, '2026-05-19 16:55:00', 4, 'Watched it twice in one week.'),  -- Avatar
  (27205, 13, '2026-04-29 14:07:00', 5, 'One of my all-time favourites!'),  -- Inception
  (16869, 13, '2026-05-06 16:14:00', 5, 'Still gives me chills after many rewatches.'),  -- Inglourious Basterds
  (550, 13, '2026-03-18 07:52:00', 4, 'Great cast and a strong script.'),  -- Fight Club
  (680, 13, '2026-09-04 14:05:00', 5, '10/10 would recommend to everyone.'),  -- Pulp Fiction
  (438631, 13, '2026-08-16 03:26:00', 1, 'Honestly one of the worst films I''ve seen.'),  -- Dune
  (693134, 13, '2026-08-03 13:57:00', 5, 'One of my all-time favourites!'),  -- Dune: Part Two
  (278, 13, '2026-04-08 16:29:00', 5, 'Still gives me chills after many rewatches.'),  -- The Shawshank Redemption
  (155, 13, '2026-07-25 19:37:00', 5, 'Every scene is perfect. Watch it in a cinema if you can.'),  -- The Dark Knight
  (27205, 14, '2026-03-24 05:41:00', 4, 'Watched it twice in one week.'),  -- Inception
  (872585, 14, '2026-08-28 05:13:00', 4, 'Almost perfect, the middle drags a little.'),  -- Oppenheimer
  (13, 14, '2026-03-21 14:21:00', 3, 'Fun once, probably won''t rewatch.'),  -- Forrest Gump
  (238, 14, '2026-07-29 15:33:00', 5, NULL),  -- The Godfather
  (1422, 14, '2026-09-12 18:51:00', 3, 'Solid but forgettable.'),  -- The Departed
  (244786, 14, '2026-07-08 12:37:00', 4, 'Watched it twice in one week.'),  -- Whiplash
  (115, 14, '2026-02-05 03:07:00', 4, 'Almost perfect, the middle drags a little.'),  -- The Big Lebowski
  (694, 14, '2026-03-01 07:25:00', 3, 'Decent watch, nothing special.'),  -- The Shining
  (155, 14, '2026-04-17 15:23:00', 3, 'Solid but forgettable.'),  -- The Dark Knight
  (354912, 15, '2026-02-27 15:09:00', 4, NULL),  -- Coco
  (1124, 15, '2026-05-05 11:51:00', 4, 'Almost perfect, the middle drags a little.'),  -- The Prestige
  (550, 15, '2026-06-12 09:50:00', 5, 'An absolute masterpiece.'),  -- Fight Club
  (680, 15, '2026-03-13 09:12:00', 4, 'Really enjoyed this one!'),  -- Pulp Fiction
  (11, 15, '2026-02-13 01:15:00', 4, NULL),  -- Star Wars
  (244786, 15, '2026-06-29 13:03:00', 2, 'Great visuals, weak story.'),  -- Whiplash
  (157336, 15, '2026-05-12 01:34:00', 4, 'Great cast and a strong script.'),  -- Interstellar
  (603, 15, '2026-05-31 05:11:00', 1, 'Honestly one of the worst films I''ve seen.'),  -- The Matrix
  (120, 15, '2026-05-19 19:59:00', 2, 'Not my kind of movie.'),  -- The Lord of the Rings: The Fellowship of the Ring
  (438631, 16, '2026-05-02 06:31:00', 4, 'Really enjoyed this one!'),  -- Dune
  (105, 16, '2026-08-23 22:35:00', 4, NULL),  -- Back to the Future
  (155, 16, '2026-07-15 06:27:00', 5, 'An absolute masterpiece.'),  -- The Dark Knight
  (120, 16, '2026-08-09 10:47:00', 3, 'Fun once, probably won''t rewatch.'),  -- The Lord of the Rings: The Fellowship of the Ring
  (857, 16, '2026-08-21 21:25:00', 5, '10/10 would recommend to everyone.'),  -- Saving Private Ryan
  (603, 16, '2026-02-16 19:20:00', 4, 'Almost perfect, the middle drags a little.'),  -- The Matrix
  (578, 17, '2026-05-17 10:26:00', 4, 'Great cast and a strong script.'),  -- Jaws
  (550, 17, '2026-08-29 04:58:00', 3, 'Solid but forgettable.'),  -- Fight Club
  (680, 17, '2026-05-30 14:21:00', 1, 'Could not finish it. Way too slow.'),  -- Pulp Fiction
  (424, 17, '2026-05-14 01:35:00', 3, 'Good acting, a bit too long.'),  -- Schindler's List
  (12, 17, '2026-05-24 09:59:00', 3, 'Good acting, a bit too long.'),  -- Finding Nemo
  (299534, 17, '2026-01-22 17:05:00', 3, 'Good acting, a bit too long.'),  -- Avengers: Endgame
  (496243, 17, '2026-02-09 13:51:00', 4, 'Almost perfect, the middle drags a little.'),  -- Parasite
  (354912, 19, '2026-07-03 12:26:00', 4, 'Great cast and a strong script.'),  -- Coco
  (475557, 19, '2026-01-27 12:49:00', 1, NULL),  -- Joker
  (550, 19, '2026-04-02 20:12:00', 5, 'One of my all-time favourites!'),  -- Fight Club
  (807, 19, '2026-01-24 14:30:00', 5, '10/10 would recommend to everyone.'),  -- Se7en
  (680, 19, '2026-08-13 22:44:00', 2, 'The ending ruined it for me.'),  -- Pulp Fiction
  (278, 19, '2026-06-14 15:20:00', 1, 'Honestly one of the worst films I''ve seen.'),  -- The Shawshank Redemption
  (27205, 20, '2026-07-27 13:42:00', 4, NULL),  -- Inception
  (550, 20, '2026-07-24 13:18:00', 5, 'Still gives me chills after many rewatches.'),  -- Fight Club
  (872585, 20, '2026-06-14 07:22:00', 3, 'Good acting, a bit too long.'),  -- Oppenheimer
  (155, 20, '2026-04-15 18:41:00', 3, 'Good acting, a bit too long.'),  -- The Dark Knight
  (78, 20, '2026-03-27 03:38:00', 5, 'Still gives me chills after many rewatches.'),  -- Blade Runner
  (240, 20, '2026-05-13 02:58:00', 5, 'One of my all-time favourites!'),  -- The Godfather Part II
  (278, 20, '2026-08-07 22:18:00', 5, 'Every scene is perfect. Watch it in a cinema if you can.'),  -- The Shawshank Redemption
  (857, 20, '2026-04-10 20:17:00', 4, 'Almost perfect, the middle drags a little.'),  -- Saving Private Ryan
  (603, 20, '2026-02-27 16:28:00', 2, 'Some good moments, but mostly boring.'),  -- The Matrix
  (348, 20, '2026-07-24 13:20:00', 3, 'Solid but forgettable.');  -- Alien

-- ===== FAVORITE_MOVIES =====
INSERT INTO favorite_movies (user_id, movies_tmdb_id) VALUES
  (1, 105),
  (1, 77),
  (1, 1422),
  (1, 244786),
  (1, 157336),
  (1, 857),
  (1, 120),
  (2, 680),
  (2, 346698),
  (2, 11),
  (2, 299534),
  (2, 157336),
  (2, 372058),
  (2, 155),
  (3, 27205),
  (3, 550),
  (3, 680),
  (3, 155),
  (3, 77),
  (3, 76341),
  (3, 120),
  (3, 857),
  (3, 372058),
  (3, 603),
  (4, 1124),
  (4, 475557),
  (4, 680),
  (4, 329),
  (4, 489),
  (4, 157336),
  (4, 120),
  (5, 1124),
  (5, 155),
  (5, 274),
  (5, 603),
  (5, 862),
  (6, 16869),
  (6, 475557),
  (6, 12),
  (6, 155),
  (6, 299534),
  (6, 274),
  (6, 496243),
  (6, 157336),
  (6, 603),
  (7, 578),
  (7, 550),
  (7, 438631),
  (7, 680),
  (7, 346698),
  (7, 78),
  (7, 278),
  (7, 157336),
  (7, 155),
  (7, 862),
  (8, 769),
  (8, 27205),
  (8, 680),
  (8, 11),
  (8, 1422),
  (8, 78),
  (8, 244786),
  (8, 603),
  (9, 693134),
  (9, 157336),
  (9, 313369),
  (9, 603),
  (9, 348),
  (10, 578),
  (10, 27205),
  (10, 550),
  (10, 240),
  (10, 496243),
  (10, 155),
  (11, 1891),
  (11, 27205),
  (11, 807),
  (11, 680),
  (11, 329),
  (11, 155),
  (11, 78),
  (11, 240),
  (11, 603),
  (12, 354912),
  (12, 27205),
  (12, 438631),
  (12, 680),
  (12, 155),
  (12, 238),
  (12, 115),
  (12, 157336),
  (12, 603),
  (12, 120),
  (13, 27205),
  (13, 550),
  (13, 807),
  (13, 680),
  (13, 346698),
  (13, 157336),
  (13, 313369),
  (13, 603),
  (14, 769),
  (14, 603),
  (14, 12),
  (14, 238),
  (15, 354912),
  (15, 27205),
  (15, 550),
  (15, 680),
  (15, 278),
  (15, 157336),
  (15, 120),
  (16, 489),
  (16, 1422),
  (16, 496243),
  (16, 313369),
  (17, 769),
  (17, 578),
  (17, 680),
  (17, 11),
  (17, 77),
  (17, 244786),
  (17, 603),
  (17, 155),
  (17, 862),
  (19, 157336),
  (19, 603),
  (19, 155),
  (19, 680),
  (20, 354912),
  (20, 475557),
  (20, 872585),
  (20, 77),
  (20, 299534),
  (20, 115),
  (20, 157336),
  (20, 603);

-- ===== GROUPS =====
INSERT INTO groups (group_id, group_name, owner_id) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Nolan Fans', 1),
  (2, 'Friday Horror Night', 3),
  (3, 'Studio Ghibli & Animation', 5),
  (4, 'Sci-Fi Classics', 8),
  (5, 'Oulu Movie Club', 20);

-- ===== MEMBERS (the owner is also a member with status 'accepted') =====
INSERT INTO members (user_id, group_id, status) VALUES
  (1, 1, 'accepted'),
  (2, 1, 'accepted'),
  (6, 1, 'accepted'),
  (10, 1, 'accepted'),
  (14, 1, 'accepted'),
  (19, 1, 'accepted'),
  (7, 1, 'pending'),
  (11, 1, 'pending'),
  (13, 1, 'rejected'),
  (3, 2, 'accepted'),
  (4, 2, 'accepted'),
  (9, 2, 'accepted'),
  (16, 2, 'accepted'),
  (19, 2, 'pending'),
  (15, 2, 'pending'),
  (5, 3, 'accepted'),
  (11, 3, 'accepted'),
  (13, 3, 'accepted'),
  (17, 3, 'accepted'),
  (2, 3, 'rejected'),
  (8, 3, 'pending'),
  (8, 4, 'accepted'),
  (2, 4, 'accepted'),
  (12, 4, 'accepted'),
  (14, 4, 'accepted'),
  (19, 4, 'accepted'),
  (6, 4, 'accepted'),
  (4, 4, 'pending'),
  (10, 4, 'rejected'),
  (20, 5, 'accepted'),
  (12, 5, 'accepted'),
  (1, 5, 'accepted'),
  (7, 5, 'accepted'),
  (9, 5, 'pending'),
  (3, 5, 'pending');

-- ===== GROUP_FAVORITES (user_id NULL = the adder has deleted their account) =====
INSERT INTO group_favorites (group_id, movies_tmdb_id, user_id) VALUES
  (1, 27205, 10),
  (1, 157336, 14),
  (1, 155, 2),
  (1, 1124, 1),
  (1, 77, 10),
  (1, 872585, NULL),
  (2, 694, 16),
  (2, 348, 16),
  (2, 274, 9),
  (2, 807, 4),
  (2, 578, 16),
  (3, 129, 13),
  (3, 372058, 5),
  (3, 862, 5),
  (3, 354912, 11),
  (3, 12, 11),
  (4, 78, 2),
  (4, 603, 14),
  (4, 11, 19),
  (4, 1891, 14),
  (4, 438631, 14),
  (4, 693134, 2),
  (5, 550, 7),
  (5, 680, 12),
  (5, 496243, 1);

-- Sync identity sequences so new INSERTs do not collide with the fixed IDs
SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT MAX(user_id) FROM users));
SELECT setval(pg_get_serial_sequence('groups', 'group_id'), (SELECT MAX(group_id) FROM groups));

COMMIT;
