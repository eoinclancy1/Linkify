-- Reclassify employees with advisor/consultant/fractional titles to Content Engineering
UPDATE "Employee"
SET department = 'CONTENT_ENGINEERING'
WHERE LOWER("jobTitle") ~ '\y(advisor|consultant|fractional)\y'
   OR LOWER(COALESCE("headline", '')) ~ '\y(advisor|consultant|fractional)\y';
