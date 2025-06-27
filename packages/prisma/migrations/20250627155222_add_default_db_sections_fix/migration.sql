INSERT INTO "DashboardSection"
  ("userId", "collectionId", "type", "order", "createdAt", "updatedAt")
SELECT
  u.id                                       AS "userId",
  NULL                                       AS "collectionId",
  t.typ::"DashboardSectionType"              AS "type",
  t.ord                                      AS "order",
  now()                                      AS "createdAt",
  now()                                      AS "updatedAt"
FROM
  "User" u
  CROSS JOIN (
    VALUES
      ('STATS'::"DashboardSectionType",        0),
      ('RECENT_LINKS'::"DashboardSectionType", 1),
      ('PINNED_LINKS'::"DashboardSectionType", 2)
  ) AS t(typ, ord)
WHERE
  NOT EXISTS (
    SELECT 1
    FROM "DashboardSection" ds
    WHERE ds."userId" = u.id
  );