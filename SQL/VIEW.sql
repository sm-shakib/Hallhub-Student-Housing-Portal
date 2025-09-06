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