// Discovery pilot endpoints (API_CONTRACT.md), mounted at /api/v1 behind
// decodeUserToken in src/index.ts. Read-only against the catalog; no admin
// or API-key surface. Errors produced here use the contract's
// { error: { code, message } } shape; auth failures come from the Phase 0
// middleware before these handlers run.
import { Router, Request, Response } from 'express';
import { getPrisma } from '../Discovery/db';
import { sendError, notFound } from '../Discovery/errors';
import { parseFilters, parsePagination, MAX_INT4 } from '../Discovery/validate';
import { searchBeers, SearchRow } from '../Discovery/searchService';
import { resolveImage, resolveImages } from '../Discovery/images';
import { beverageSummary, emptyToNull, unknownNumber } from '../Discovery/serialize';

const router = Router();

// S1 seam check and readiness: proves the router is mounted behind the auth
// middleware and reports whether the database answers a trivial query.
router.get('/health', async (req: Request, res: Response) => {
  try {
    await getPrisma().$connect();
    return res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    return sendError(res, err);
  }
});

router.get('/discovery/search', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const filters = await parseFilters(prisma, req.query as Record<string, unknown>);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const { rows, total } = await searchBeers(prisma, q, filters, pagination);
    const images = await resolveImages(
      prisma,
      rows.map(r => ({ id: r.id, cat_id: r.cat_id })),
    );
    const results = rows.map((row: SearchRow) =>
      beverageSummary(
        {
          id: row.id,
          name: row.name,
          abv: row.abv,
          brewery:
            row.brewery_id !== null && row.brewery_name !== null
              ? { id: row.brewery_id, name: row.brewery_name }
              : null,
          style:
            row.style_id !== null && row.style_name !== null
              ? { id: row.style_id, style_name: row.style_name }
              : null,
          category:
            row.cat_id !== null && row.category_name !== null
              ? { id: row.cat_id, cat_name: row.category_name }
              : null,
        },
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        images.get(row.id)!,
      ),
    );
    return res.json({
      results,
      pagination: {
        page: pagination.page,
        page_size: pagination.pageSize,
        total_results: total,
        total_pages: Math.ceil(total / pagination.pageSize),
      },
    });
  } catch (err) {
    return sendError(res, err);
  }
});

router.get('/discovery/browse', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const [breweryCounts, styleCounts, categories, categoryCounts, newest] = await Promise.all([
      prisma.beers.groupBy({
        by: ['brewery_id'],
        where: { brewery_id: { not: null }, archived_at: null },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.beers.groupBy({
        by: ['style_id'],
        where: { style_id: { not: null }, archived_at: null },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.categories.findMany({ where: { archived_at: null }, orderBy: { cat_name: 'asc' } }),
      prisma.beers.groupBy({ by: ['cat_id'], where: { archived_at: null }, _count: { id: true } }),
      prisma.beers.findMany({
        where: { archived_at: null },
        orderBy: [{ last_mod: 'desc' }, { id: 'desc' }],
        take: 10,
        include: { brewery: true, style: true, category: true },
      }),
    ]);
    const breweryIds = breweryCounts
      .map(c => c.brewery_id)
      .filter((id): id is number => id !== null);
    const styleIds = styleCounts.map(c => c.style_id).filter((id): id is number => id !== null);
    const [breweryRows, styleRows] = await Promise.all([
      prisma.breweries.findMany({ where: { id: { in: breweryIds }, archived_at: null } }),
      prisma.styles.findMany({ where: { id: { in: styleIds }, archived_at: null } }),
    ]);
    const breweryNames = new Map(breweryRows.map(b => [b.id, b.name]));
    const styleNames = new Map(styleRows.map(s => [s.id, s.style_name]));
    const categoryCountMap = new Map(
      categoryCounts.map(c => [c.cat_id, c._count.id] as const),
    );
    const newestImages = await resolveImages(
      prisma,
      newest.map(b => ({ id: b.id, cat_id: b.cat_id })),
    );
    return res.json({
      shelves: [
        {
          id: 'popular_breweries',
          title: 'Popular breweries',
          kind: 'brewery',
          items: breweryCounts.map(c => ({
            id: c.brewery_id,
            name: breweryNames.get(c.brewery_id as number) ?? '',
            beer_count: c._count.id,
          })),
        },
        {
          id: 'styles_to_explore',
          title: 'Styles to explore',
          kind: 'style',
          items: styleCounts.map(c => ({
            id: c.style_id,
            name: styleNames.get(c.style_id as number) ?? '',
            beer_count: c._count.id,
          })),
        },
        {
          id: 'by_category',
          title: 'Browse by category',
          kind: 'category',
          items: categories.map(c => ({
            id: c.id,
            name: c.cat_name,
            beer_count: categoryCountMap.get(c.id) ?? 0,
          })),
        },
        {
          id: 'newest_additions',
          title: 'Newest additions',
          kind: 'beverage',
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          items: newest.map(b => beverageSummary(b, newestImages.get(b.id)!)),
        },
      ],
    });
  } catch (err) {
    return sendError(res, err);
  }
});

router.get('/beverages/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const id = Number(req.params.id);
    // Contract decision 5: a non-integer id is a missing resource (404),
    // not a client error (400). The same applies to an integer above the
    // int4 range of the schema's id columns: no such beverage can exist,
    // and passing it to Prisma would throw and surface as a 500 (QA F1).
    if (!Number.isInteger(id) || id > MAX_INT4) throw notFound('Beverage not found.');
    const beer = await prisma.beers.findUnique({
      where: { id },
      include: { brewery: true, style: true, category: true },
    });
    if (!beer) throw notFound('Beverage not found.');
    const image = await resolveImage(prisma, beer);
    return res.json({
      id: beer.id,
      name: beer.name,
      brewery: beer.brewery
        ? {
            id: beer.brewery.id,
            name: beer.brewery.name,
            city: emptyToNull(beer.brewery.city),
            state: emptyToNull(beer.brewery.state),
            country: emptyToNull(beer.brewery.country),
            website: emptyToNull(beer.brewery.website),
          }
        : null,
      style: beer.style ? { id: beer.style.id, name: beer.style.style_name } : null,
      category: beer.category ? { id: beer.category.id, name: beer.category.cat_name } : null,
      abv: unknownNumber(beer.abv),
      ibu: unknownNumber(beer.ibu),
      srm: unknownNumber(beer.srm),
      description: emptyToNull(beer.descript),
      discontinued: beer.discontinued,
      archived: Boolean(beer.archived_at),
      image_url: image.image_url,
      image_kind: image.image_kind,
      image_provenance: image.image_provenance,
    });
  } catch (err) {
    return sendError(res, err);
  }
});

export default router;
