-- Sequence tables for each ID column


CREATE TABLE events_seq (seq_val BIGINT NOT NULL);
INSERT INTO events_seq VALUES (0);

CREATE TABLE resident_seq (seq_val BIGINT NOT NULL);
INSERT INTO resident_seq VALUES (0);

CREATE TABLE complaint_seq (seq_val BIGINT NOT NULL);
INSERT INTO complaint_seq VALUES (0);

CREATE TABLE complaint_res_seq (seq_val BIGINT NOT NULL);
INSERT INTO complaint_res_seq VALUES (0);

CREATE TABLE visitor_seq (seq_val BIGINT NOT NULL);
INSERT INTO visitor_seq VALUES (0);

CREATE TABLE allocation_seq (seq_val BIGINT NOT NULL);
INSERT INTO allocation_seq VALUES (0);

CREATE TABLE lost_seq (seq_val BIGINT NOT NULL);
INSERT INTO lost_seq VALUES (0);

CREATE TABLE found_seq (seq_val BIGINT NOT NULL);
INSERT INTO found_seq VALUES (0);

CREATE TABLE item_seq (seq_val BIGINT NOT NULL);
INSERT INTO item_seq VALUES (0);


CREATE TABLE student_info (
  Student_ID bigint NOT NULL,
  Name varchar(40) NOT NULL,
  Password varchar(40) NOT NULL,
  Serial_No bigint NOT NULL,
  Department varchar(40) NOT NULL,
  Level tinyint NOT NULL,
  Address varchar(128) NOT NULL,
  Phone_No varchar(25) NOT NULL,
  Relative_Name varchar(40) NOT NULL,
  Relative_Address varchar(128) NOT NULL,
  Relative_Relation varchar(25) NOT NULL,
  Relative_Phone_No varchar(25) NOT NULL,
  PRIMARY KEY (Student_ID)
);

CREATE TABLE resident (
  Student_ID bigint NOT NULL,
  Resident_ID bigint NOT NULL,
  Date datetime NOT NULL,
  PRIMARY KEY (Student_ID),
  CONSTRAINT res_stdid_fk FOREIGN KEY (Student_ID) REFERENCES student_info (Student_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
--sequence and trigger for resident_id
DELIMITER $$
CREATE TRIGGER trg_resident_id
BEFORE INSERT ON resident
FOR EACH ROW
BEGIN
  UPDATE resident_seq SET seq_val = seq_val + 1;
  SET NEW.Resident_ID = (SELECT seq_val FROM resident_seq);
END$$
DELIMITER ;

CREATE TABLE events (
  Event_ID bigint NOT NULL ,
  Type varchar(25) NOT NULL,
  Date datetime NOT NULL,
  Description varchar(500) NOT NULL,
  Student_ID bigint NOT NULL,
  PRIMARY KEY (Event_ID),
  KEY eve_stdid_fk (Student_ID),
  CONSTRAINT eve_stdid_fk FOREIGN KEY (Student_ID) REFERENCES resident (Student_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
--sequence and trigger for event_id
DELIMITER $$
CREATE TRIGGER trg_events_id
BEFORE INSERT ON events
FOR EACH ROW
BEGIN
  UPDATE events_seq SET seq_val = seq_val + 1;
  SET NEW.Event_ID = (SELECT seq_val FROM events_seq);
END$$
DELIMITER ;

CREATE TABLE complaint (
  Student_ID bigint NOT NULL,
  Complaint_ID bigint NOT NULL ,
  Description varchar(500) NOT NULL,
  Time datetime NOT NULL,
  Status tinyint NOT NULL,
  PRIMARY KEY (Complaint_ID),
  KEY com_stdid_fk (Student_ID),
  CONSTRAINT com_stdid_fk FOREIGN KEY (Student_ID) REFERENCES resident (Student_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
--sequence and trigger for complaint_id
DELIMITER $$
CREATE TRIGGER trg_complaint_id
BEFORE INSERT ON complaint
FOR EACH ROW
BEGIN
  UPDATE complaint_seq SET seq_val = seq_val + 1;
  SET NEW.Complaint_ID = (SELECT seq_val FROM complaint_seq);
END$$
DELIMITER ;

CREATE TABLE complaint_resolution (
  Resolution_ID bigint NOT NULL ,
  Complaint_ID bigint NOT NULL,
  Receive_Time datetime NOT NULL,
  PRIMARY KEY (Resolution_ID),
  KEY cre_comid_fk (Complaint_ID),
  CONSTRAINT cre_comid_fk FOREIGN KEY (Complaint_ID) REFERENCES complaint (Complaint_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
--sequence and trigger for resolution_id
DELIMITER $$
CREATE TRIGGER trg_complaint_res_id
BEFORE INSERT ON complaint_resolution
FOR EACH ROW
BEGIN
  UPDATE complaint_res_seq SET seq_val = seq_val + 1;
  SET NEW.Resolution_ID = (SELECT seq_val FROM complaint_res_seq);
END$$
DELIMITER ;

CREATE TABLE visitor_entry (
  Student_ID bigint NOT NULL,
  Visitor_ID bigint NOT NULL ,
  Name varchar(40) NOT NULL,
  Phone_No varchar(25) NOT NULL,
  Relation varchar(25) NOT NULL,
  PRIMARY KEY (Visitor_ID),
  KEY vis_stdid_fk (Student_ID),
  CONSTRAINT vis_stdid_fk FOREIGN KEY (Student_ID) REFERENCES resident (Student_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
--sequennce and trigger for visitor_id
DELIMITER $$
CREATE TRIGGER trg_visitor_id
BEFORE INSERT ON visitor_entry
FOR EACH ROW
BEGIN
  UPDATE visitor_seq SET seq_val = seq_val + 1;
  SET NEW.Visitor_ID = (SELECT seq_val FROM visitor_seq);
END$$
DELIMITER ;

CREATE TABLE room_allocation (
  Allocation_ID bigint NOT NULL ,
  Student_ID bigint NOT NULL,
  Room_No smallint NOT NULL,
  Hall_No tinyint NOT NULL,
  Alloc_Start_Time datetime NOT NULL,
  Alloc_End_Time datetime,
  PRIMARY KEY (Allocation_ID),
  KEY ral_stdid_fk (Student_ID),
  KEY ral_romno_fk (Room_No),
  KEY ral_halno_fk (Hall_No),
  CONSTRAINT ral_halno_fk FOREIGN KEY (Hall_No) REFERENCES hall (Hall_No) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ral_romno_fk FOREIGN KEY (Room_No) REFERENCES room (Room_No) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ral_stdid_fk FOREIGN KEY (Student_ID) REFERENCES resident (Student_ID) ON DELETE CASCADE ON UPDATE CASCADE
  CONSTRAINT ral_alctm_ck CHECK (Alloc_End_Time IS NOT NULL OR Alloc_Start_Time < Alloc_End_Time)
);
--sequence and trigger for allocation_id
DELIMITER $$
CREATE TRIGGER trg_allocation_id
BEFORE INSERT ON room_allocation
FOR EACH ROW
BEGIN
  UPDATE allocation_seq SET seq_val = seq_val + 1;
  SET NEW.Allocation_ID = (SELECT seq_val FROM allocation_seq);
END$$
DELIMITER ;

CREATE TABLE lost_item (
  Student_ID bigint NOT NULL,
  Item_ID bigint NOT NULL,
  Lost_ID bigint NOT NULL,
  Description varchar(500) NOT NULL,
  Lost_Time datetime NOT NULL,
  PRIMARY KEY (Lost_ID),
  KEY los_stdid_fk (Student_ID),
  KEY los_itmid_fk (Item_ID),
  CONSTRAINT los_itmid_fk FOREIGN KEY (Item_ID) REFERENCES item (Item_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT los_stdid_fk FOREIGN KEY (Student_ID) REFERENCES resident (Student_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
--sequence and trigger for lost_id
DELIMITER $$
CREATE TRIGGER trg_lost_id
BEFORE INSERT ON lost_item
FOR EACH ROW
BEGIN
  UPDATE lost_seq SET seq_val = seq_val + 1;
  SET NEW.Lost_ID = (SELECT seq_val FROM lost_seq);
END$$
DELIMITER ;

CREATE TABLE found_item (
  Found_ID bigint NOT NULL,
  Lost_ID bigint NOT NULL,
  Found_Time datetime NOT NULL,
  PRIMARY KEY (Found_ID),
  KEY fou_losid_fk (Lost_ID),
  CONSTRAINT fou_losid_fk FOREIGN KEY (Lost_ID) REFERENCES lost_item (Lost_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
--sequence and trigger for found_id
DELIMITER $$
CREATE TRIGGER trg_found_id
BEFORE INSERT ON found_item
FOR EACH ROW
BEGIN
  UPDATE found_seq SET seq_val = seq_val + 1;
  SET NEW.Found_ID = (SELECT seq_val FROM found_seq);
END$$
DELIMITER ;

CREATE TABLE room (
  Room_No smallint NOT NULL,
  Hall_No tinyint NOT NULL,
  PRIMARY KEY (Room_No),
  KEY roo_halno_fk (Hall_No),
  CONSTRAINT roo_halno_fk FOREIGN KEY (Hall_No) REFERENCES hall (Hall_No) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE hall (
  Hall_No tinyint NOT NULL,
  Place varchar(25) NOT NULL,
  PRIMARY KEY (Hall_No)
);

CREATE TABLE item (
  Item_ID bigint NOT NULL ,
  Item_Type varchar(25) NOT NULL,
  PRIMARY KEY (Item_ID)
);
--sequence and trigger for item_id
DELIMITER $$
CREATE TRIGGER trg_item_id
BEFORE INSERT ON item
FOR EACH ROW
BEGIN
  UPDATE item_seq SET seq_val = seq_val + 1;
  SET NEW.Item_ID = (SELECT seq_val FROM item_seq);
END$$
DELIMITER ;