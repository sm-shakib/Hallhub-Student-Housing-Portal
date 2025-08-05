ALTER TABLE Resident
ADD CONSTRAINT res_stdid_fk FOREIGN KEY (Student_ID) REFERENCES Student_Info(Student_ID);

ALTER TABLE Complaint
ADD CONSTRAINT com_stdid_fk FOREIGN KEY (Student_ID) REFERENCES Resident(Student_ID);

ALTER TABLE Complaint_Resolution
ADD CONSTRAINT res_comid_fk FOREIGN KEY (Complaint_ID) REFERENCES Complaint(Complaint_ID);

ALTER TABLE Events
ADD CONSTRAINT eve_stdid_fk FOREIGN KEY (Student_ID) REFERENCES Resident(Student_ID);

ALTER TABLE Visitor_Entry
ADD CONSTRAINT vis_stdid_fk FOREIGN KEY (Student_ID) REFERENCES Resident(Student_ID);

ALTER TABLE Lost_Item
ADD CONSTRAINT los_stdid_fk FOREIGN KEY (Student_ID) REFERENCES Resident(Student_ID);

ALTER TABLE Room_Allocation
ADD CONSTRAINT ral_stdid_fk FOREIGN KEY (Student_ID) REFERENCES Resident(Student_ID);

ALTER TABLE Room_Allocation
ADD CONSTRAINT ral_romno_fk FOREIGN KEY (Room_No) REFERENCES Room(Room_No);

ALTER TABLE Room_Allocation
ADD CONSTRAINT ral_halno_fk FOREIGN KEY (Hall_No) REFERENCES Hall(Hall_No);

ALTER TABLE Lost_Item
ADD CONSTRAINT los_itmid_fk FOREIGN KEY (Item_ID) REFERENCES Item(Item_ID);

ALTER TABLE Found_Item
ADD CONSTRAINT fou_losid_fk FOREIGN KEY (Lost_ID) REFERENCES Lost_Item(Lost_ID);

ALTER TABLE Room
ADD CONSTRAINT roo_halno_fk FOREIGN KEY (Hall_No) REFERENCES Hall(Hall_No);