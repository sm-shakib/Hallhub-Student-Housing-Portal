DELIMITER $$

CREATE TRIGGER after_resident_insert
AFTER INSERT ON Resident
FOR EACH ROW
BEGIN
    UPDATE Student_Info
    SET resident_status = 1
    WHERE student_id = NEW.student_id;

    INSERT INTO room_allocation (Student_ID, Room_No, Hall_No, Alloc_Start_Time)
    VALUES (NEW.student_id, @room_no, @hall_no, NOW());
END$$

DELIMITER ;
