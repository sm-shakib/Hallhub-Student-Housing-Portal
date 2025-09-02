UPDATE student_info SET Phone_No = '01711111199' WHERE Student_ID = 202314016;
UPDATE resident SET Date = '2025-01-20 12:00:00' WHERE Student_ID = 202314016;
UPDATE events SET Description = 'Updated: Semester Registration Complete' WHERE Event_ID = 1;
UPDATE complaint SET Status = 1 WHERE Complaint_ID = 1;
UPDATE complaint_resolution SET Receive_Time = '2025-02-15 11:00:00' WHERE Resolution_ID = 3;
UPDATE visitor_entry SET Name = 'Adib Best Friend' WHERE Visitor_ID = 1;
UPDATE room_allocation SET Room_No = 102 WHERE Allocation_ID = 1; --Doesn't update
UPDATE lost_item SET Description = 'Samsung Galaxy S21 - Black Color' WHERE Lost_ID = 1;
UPDATE found_item SET Found_Time = '2025-02-25 12:30:00' WHERE Found_ID = 1001;
UPDATE room SET Hall_No = 2 WHERE Room_No = 101;
UPDATE hall SET Place = 'Osmany Male Updated' WHERE Hall_No = 1;
UPDATE item SET Item_Type = 'Smartphone' WHERE Item_ID = 1;