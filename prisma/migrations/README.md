# Migration lineage

On 2026-10-27 the database provider switched from MySQL to PostgreSQL
(decision 002 in the beer-passport-project hub). This folder was reset to
a single baseline migration, 20261027000001_init, generated from the
ported schema with Prisma 6.19.3, plus one hand-added CHECK constraint
(friends canonical ordering, audit F-1) that Prisma cannot model.

The 15 MySQL migrations that previously lived here (20230510040312_
through 20240320220324_unique_constraints) were removed in the same
change. They are preserved in git history (master at 9b19504c and
earlier) and are never applied to PostgreSQL. The PostgreSQL database is
created greenfield from the baseline; historical MySQL data arrives as a
data import recovered from EFS, not through migrations.

Integration flow: step branches for the relaunch merge into release/2.0,
never directly into master.
