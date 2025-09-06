--mysqldump -u WasifDarain -p --verbose Hall_Mgmt > dump.sql

SELECT user, host FROM mysql.user;

SELECT * FROM student_info;
SELECT * FROM resident;
SELECT * FROM events;
SELECT * FROM complaint;
SELECT * FROM complaint_resolution;
SELECT * FROM visitor_entry;
SELECT * FROM room_allocation;
SELECT * FROM lost_item;
SELECT * FROM found_item;
SELECT * FROM room;
SELECT * FROM hall;
SELECT * FROM item;

ALTER TABLE room_allocation
MODIFY COLUMN Allocation_Time DATETIME NOT NULL;

ALTER TABLE room_allocation
CHANGE Allocation_Time Alloc_Start_Time DATETIME NOT NULL;

ALTER TABLE room_allocation
ADD Alloc_End_Time DATETIME;

ALTER TABLE room_allocation
ADD CONSTRAINT ral_alctm_ck
CHECK (
    Alloc_End_Time IS NULL OR Alloc_Start_Time < Alloc_End_Time
);

SELECT 
    tc.CONSTRAINT_NAME,
    tc.CONSTRAINT_TYPE,
    tc.TABLE_NAME
FROM information_schema.TABLE_CONSTRAINTS tc
WHERE tc.CONSTRAINT_SCHEMA = DATABASE()
  AND tc.CONSTRAINT_NAME LIKE '%_%_%';