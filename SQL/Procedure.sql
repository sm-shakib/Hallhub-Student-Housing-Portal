DELIMITER $$

CREATE PROCEDURE GetLostItems()
BEGIN
    SELECT 
        li.Lost_ID,
        li.Student_ID,
        li.Item_ID,
        li.Description,
        li.Lost_Time,
        i.item_type
    FROM lost_item li
    LEFT JOIN item i ON li.Item_ID = i.Item_ID
    WHERE li.Lost_ID NOT IN (SELECT Lost_ID FROM found_item)
    ORDER BY li.Lost_Time ASC;
END$$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE GetFoundItems()
BEGIN
    SELECT 
        fi.Found_ID,
        fi.Lost_ID,
        li.Student_ID,
        fi.Found_Time,
        li.Description,
        i.item_type
    FROM found_item fi
    INNER JOIN lost_item li ON fi.Lost_ID = li.Lost_ID
    LEFT JOIN item i ON li.Item_ID = i.Item_ID
    ORDER BY fi.Found_Time ASC;
END$$

DELIMITER ;
