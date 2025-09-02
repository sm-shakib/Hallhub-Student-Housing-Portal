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

CREATE TABLE events (
  Event_ID bigint NOT NULL AUTO_INCREMENT,
  Type varchar(25) NOT NULL,
  Date datetime NOT NULL,
  Description varchar(500) NOT NULL,
  Student_ID bigint NOT NULL,
  PRIMARY KEY (Event_ID),
  KEY eve_stdid_fk (Student_ID),
  CONSTRAINT eve_stdid_fk FOREIGN KEY (Student_ID) REFERENCES resident (Student_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE complaint (
  Student_ID bigint NOT NULL,
  Complaint_ID bigint NOT NULL AUTO_INCREMENT,
  Description varchar(500) NOT NULL,
  Time datetime NOT NULL,
  Status tinyint NOT NULL,
  PRIMARY KEY (Complaint_ID),
  KEY com_stdid_fk (Student_ID),
  CONSTRAINT com_stdid_fk FOREIGN KEY (Student_ID) REFERENCES resident (Student_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE complaint_resolution (
  Resolution_ID bigint NOT NULL AUTO_INCREMENT,
  Complaint_ID bigint NOT NULL,
  Receive_Time datetime NOT NULL,
  PRIMARY KEY (Resolution_ID),
  KEY cre_comid_fk (Complaint_ID),
  CONSTRAINT cre_comid_fk FOREIGN KEY (Complaint_ID) REFERENCES complaint (Complaint_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE visitor_entry (
  Student_ID bigint NOT NULL,
  Visitor_ID bigint NOT NULL AUTO_INCREMENT,
  Name varchar(40) NOT NULL,
  Phone_No varchar(25) NOT NULL,
  Relation varchar(25) NOT NULL,
  PRIMARY KEY (Visitor_ID),
  KEY vis_stdid_fk (Student_ID),
  CONSTRAINT vis_stdid_fk FOREIGN KEY (Student_ID) REFERENCES resident (Student_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE room_allocation (
  Allocation_ID bigint NOT NULL AUTO_INCREMENT,
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

CREATE TABLE lost_item (
  Student_ID bigint NOT NULL,
  Item_ID bigint NOT NULL,
  Lost_ID bigint NOT NULL AUTO_INCREMENT,
  Description varchar(500) NOT NULL,
  Lost_Time datetime NOT NULL,
  PRIMARY KEY (Lost_ID),
  KEY los_stdid_fk (Student_ID),
  KEY los_itmid_fk (Item_ID),
  CONSTRAINT los_itmid_fk FOREIGN KEY (Item_ID) REFERENCES item (Item_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT los_stdid_fk FOREIGN KEY (Student_ID) REFERENCES resident (Student_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE found_item (
  Found_ID bigint NOT NULL,
  Lost_ID bigint NOT NULL,
  Found_Time datetime NOT NULL,
  PRIMARY KEY (Found_ID),
  KEY fou_losid_fk (Lost_ID),
  CONSTRAINT fou_losid_fk FOREIGN KEY (Lost_ID) REFERENCES lost_item (Lost_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

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
  Item_ID bigint NOT NULL AUTO_INCREMENT,
  Item_Type varchar(25) NOT NULL,
  PRIMARY KEY (Item_ID)
);