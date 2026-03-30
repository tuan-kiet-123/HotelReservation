DELIMITER $$
CREATE FUNCTION `fn_CheckRoomAvailability`(p_RoomId VARCHAR(255),
	p_CheckIn DATETIME,
	p_CheckOut DATETIME
) RETURNS tinyint(1)
	DETERMINISTIC
BEGIN
	DECLARE v_IsBusy INT;
	SELECT COUNT(*) INTO v_IsBusy
	FROM Reservation
	WHERE RoomId = p_RoomId
	  AND Status IN ('Confirmed', 'CheckedIn')
	  AND p_CheckIn < CheckOutDate 
	  AND p_CheckOut > CheckInDate;

	IF v_IsBusy > 0 THEN
		RETURN FALSE;
	ELSE
		RETURN TRUE;
	END IF;
END$$
DELIMITER ;
