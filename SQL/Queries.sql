-- Active: 1757043308843@@mysql-71ed2b0-hallhub-1.g.aivencloud.com@28592@defaultdb
select * from student_info;

select * from room;

SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    TABLE_NAME = 'Hall'
    AND TABLE_SCHEMA = 'hall_mgmt';
