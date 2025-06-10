INSERT INTO "DashboardSection"("userId", "type", "order", "createdAt", "updatedAt")
SELECT id, 'STATS'::"DashboardSectionType",        0, NOW(), NOW() FROM "User"
UNION ALL
SELECT id, 'RECENT_LINKS'::"DashboardSectionType", 1, NOW(), NOW() FROM "User"
UNION ALL
SELECT id, 'PINNED_LINKS'::"DashboardSectionType", 2, NOW(), NOW() FROM "User";
