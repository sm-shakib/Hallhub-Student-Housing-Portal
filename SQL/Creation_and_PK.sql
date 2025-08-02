CREATE TABLE Student_Info (
    Student_ID BIGINT ,
    Name VARCHAR(40)  NOT NULL ,
    Password VARCHAR(40)  NOT NULL ,
    Serial_No BIGINT  NOT NULL ,
    Department VARCHAR(40)  NOT NULL ,
    Level TINYINT  NOT NULL ,
    Address VARCHAR(128)  NOT NULL ,
    Phone_No VARCHAR(25)  NOT NULL ,
    Relative_Name VARCHAR(40)  NOT NULL ,
    Relative_Address VARCHAR(128)  NOT NULL ,
    Relative_Relation VARCHAR(25)  NOT NULL ,
    Relative_Phone_No VARCHAR(25)  NOT NULL ,
    PRIMARY KEY (
        Student_ID
    )
);

CREATE TABLE Resident (
    Student_ID BIGINT ,
    Resident_ID BIGINT  NOT NULL ,
    Date DATETIME  NOT NULL ,
    PRIMARY KEY (
        Student_ID
    )
);

CREATE TABLE Events (
    Event_ID BIGINT ,
    Type VARCHAR(25)  NOT NULL ,
    Date DATETIME  NOT NULL ,
    Description VARCHAR(500)  NOT NULL ,
    Student_ID BIGINT  NOT NULL ,
    PRIMARY KEY (
        Event_ID
    )
);

CREATE TABLE Complaint (
    Student_ID BIGINT  NOT NULL ,
    Complaint_ID BIGINT ,
    Description VARCHAR(500)  NOT NULL ,
    Time DATETIME  NOT NULL ,
    Status TINYINT  NOT NULL ,
    PRIMARY KEY (
        Complaint_ID
    )
);

CREATE TABLE Complaint_Resolution (
    Resolution_ID BIGINT ,
    Complaint_ID BIGINT  NOT NULL ,
    Receive_Time DATETIME  NOT NULL ,
    PRIMARY KEY (
        Resolution_ID
    )
);

CREATE TABLE Visitor_Entry (
    Student_ID BIGINT  NOT NULL ,
    Visitor_ID BIGINT ,
    Name VARCHAR(40)  NOT NULL ,
    Phone_No VARCHAR(25)  NOT NULL ,
    Relation VARCHAR(25)  NOT NULL ,
    PRIMARY KEY (
        Visitor_ID
    )
);

CREATE TABLE Room_Allocation (
    Allocation_ID BIGINT ,
    Student_ID BIGINT  NOT NULL ,
    Room_No SMALLINT  NOT NULL ,
    Hall_No TINYINT  NOT NULL ,
    PRIMARY KEY (
        Allocation_ID
    )
);

CREATE TABLE Lost_Item (
    Student_ID BIGINT  NOT NULL ,
    Item_ID BIGINT  NOT NULL ,
    Lost_ID BIGINT ,
    Description VARCHAR(500)  NOT NULL ,
    Lost_Time DATETIME  NOT NULL ,
    PRIMARY KEY (
        Lost_ID
    )
);

CREATE TABLE Found_Item (
    Found_ID BIGINT ,
    Lost_ID BIGINT  NOT NULL ,
    Found_Time DATETIME  NOT NULL ,
    PRIMARY KEY (
        Found_ID
    )
);

CREATE TABLE Room (
    Room_No SMALLINT ,
    Hall_No TINYINT  NOT NULL ,
    PRIMARY KEY (
        Room_No
    )
);

CREATE TABLE Hall (
    Hall_No TINYINT ,
    Place VARCHAR(25)  NOT NULL ,
    PRIMARY KEY (
        Hall_No
    )
);

CREATE TABLE Item (
    Item_ID BIGINT ,
    Item_Type VARCHAR(25)  NOT NULL ,
    PRIMARY KEY (
        Item_ID
    )
);