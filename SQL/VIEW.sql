CREATE OR REPLACE VIEW ComplaintsView AS
SELECT 
    c.complaint_id,
    c.student_id,
    s.name AS student_name,
    c.title,
    c.description,
    c.status,
    c.time
FROM complaint c
JOIN Student_Info s ON c.student_id = s.student_id;

SELECT * FROM defaultdb.ComplaintsView;

CREATE VIEW lost_items_summary AS
SELECT i.item_type, COUNT(*) AS total_lost
FROM lost_item li
JOIN item i ON li.Item_ID = i.Item_ID
GROUP BY i.item_type
ORDER BY total_lost DESC;

SELECT * FROM defaultdb.lost_items_summary;