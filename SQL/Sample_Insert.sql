INSERT INTO hall (Hall_No, Place) VALUES
(1, 'Osmany Male'),
(2, 'Osmany Female'), 
(3, 'Military');

INSERT INTO item (Item_Type) VALUES
('Mobile Phone'),
('Laptop'),
('Wallet'),
('Watch'),
('Books');

INSERT INTO room (Room_No, Hall_No) VALUES
(101, 1),
(201, 1),
(301, 2),
(401, 3),
(501, 1);

INSERT INTO student_info (Student_ID, Name, Password, Serial_No, Department, Level, Address, Phone_No, Relative_Name, Relative_Address, Relative_Relation, Relative_Phone_No) VALUES
(202314016, 'Adib', 'adib123', 1001, 'Computer Science', 3, '123 Main St, Dhaka', '01711111111', 'Adib Father', '123 Main St, Dhaka', 'Father', '01711111112'),
(202314029, 'Shakib', 'shakib123', 1002, 'Electrical Engineering', 3, '456 Oak Ave, Chittagong', '01722222222', 'Shakib Mother', '456 Oak Ave, Chittagong', 'Mother', '01722222223'),
(202314030, 'Akhi', 'akhi123', 1003, 'Aeronautical Engineering', 3, '789 Pine Rd, Sylhet', '01733333333', 'Akhi Sister', '789 Pine Rd, Sylhet', 'Sister', '01733333334'),
(202314053, 'Wasif', 'wasif123', 1004, 'Mechanical Engineering', 3, '321 Elm St, Rajshahi', '01744444444', 'Wasif Brother', '321 Elm St, Rajshahi', 'Brother', '01744444445'),
(202314401, 'Jakaria', 'jakaria123', 1005, 'Civil Engineering', 4, '654 Maple Dr, Khulna', '01755555555', 'Jakaria Uncle', '654 Maple Dr, Khulna', 'Uncle', '01755555556');

INSERT INTO resident (Student_ID, Resident_ID, Date) VALUES
(202314016, 3001, '2025-01-15 10:00:00'),
(202314029, 3002, '2025-01-16 11:30:00'),
(202314030, 3003, '2025-01-17 09:15:00'),
(202314053, 3004, '2025-01-18 14:20:00'),
(202314401, 3005, '2025-01-19 16:45:00');

INSERT INTO events (Type, Date, Description, Student_ID) VALUES
('Academic', '2025-02-01 09:00:00', 'Semester Registration', 202314016),
('Social', '2025-02-02 18:00:00', 'Cultural Night', 202314029),
('Sports', '2025-02-03 16:00:00', 'Football Match', 202314030),
('Academic', '2025-02-04 10:00:00', 'Workshop Attendance', 202314053),
('Social', '2025-02-05 19:30:00', 'Farewell Party', 202314401);

INSERT INTO complaint (Student_ID, Description, Time, Status) VALUES
(202314016, 'AC not working', '2025-02-10 08:30:00', 0),
(202314029, 'Water supply issue', '2025-02-11 07:45:00', 1),
(202314030, 'Noise complaint', '2025-02-12 22:15:00', 0),
(202314053, 'Internet connectivity problem', '2025-02-13 15:20:00', 1),
(202314401, 'Broken furniture in room', '2025-02-14 12:10:00', 0);

INSERT INTO complaint_resolution (Complaint_ID, Receive_Time) VALUES
(2, '2025-02-11 09:00:00'),
(4, '2025-02-13 16:30:00'),
(1, '2025-02-15 10:15:00'),
(5, '2025-02-16 11:45:00'),
(3, '2025-02-17 14:20:00');

INSERT INTO visitor_entry (Student_ID, Name, Phone_No, Relation) VALUES
(202314016, 'Adib Cousin', '01766666666', 'Cousin'),
(202314029, 'Shakib Friend', '01777777777', 'Friend'),
(202314030, 'Akhi Aunt', '01788888888', 'Aunt'),
(202314053, 'Wasif Colleague', '01799999999', 'Colleague'),
(202314401, 'Jakaria Neighbor', '01700000000', 'Neighbor');

INSERT INTO room_allocation (Student_ID, Room_No, Hall_No, Alloc_Start_Time) VALUES
(202314016, 101, 1, '2025-08-15 11:20:00'),
(202314029, 201, 1, '2025-08-01 17:15:20'),
(202314030, 301, 2, '2025-01-02 00:12:55'),
(202314053, 501, 1, '2025-02-29 21:10:20'),
(202314401, 401, 3, '2025-30-07 20:19:00');

INSERT INTO lost_item (Student_ID, Item_ID, Description, Lost_Time) VALUES
(202314016, 1, 'Samsung Galaxy S21', '2025-02-20 14:30:00'),
(202314029, 2, 'MacBook Pro 13 inch', '2025-02-21 10:15:00'),
(202314030, 3, 'Black leather wallet', '2025-02-22 16:45:00'),
(202314053, 4, 'Casio digital watch', '2025-02-23 12:20:00'),
(202314401, 5, 'Engineering textbooks', '2025-02-24 09:10:00');

INSERT INTO found_item (Found_ID, Lost_ID, Found_Time) VALUES
(1001, 1, '2025-02-25 11:00:00'),
(1002, 3, '2025-02-26 15:30:00'),
(1003, 5, '2025-02-27 08:45:00'),
(1004, 2, '2025-02-28 13:20:00'),
(1005, 4, '2025-03-01 17:10:00');

UPDATE room_allocation
SET Allocation_Time = '2025-08-15 11:20:00'
WHERE Allocation_ID = 1;

UPDATE room_allocation
SET Allocation_Time = '2025-08-01 17:15:20'
WHERE Allocation_ID = 2;

UPDATE room_allocation
SET Allocation_Time = '2025-01-02 00:12:55'
WHERE Allocation_ID = 3;

UPDATE room_allocation
SET Alloc_End_Time = '2025-12-31 00:00:00'
WHERE Allocation_ID = 2;

UPDATE room_allocation
SET Alloc_End_Time = '2025-08-21 15:15:55'
WHERE Allocation_ID = 3;
