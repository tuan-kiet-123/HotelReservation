CREATE TABLE IF NOT EXISTS IdSequence (
    SequenceName VARCHAR(30) NOT NULL PRIMARY KEY,
    LastNumber BIGINT NOT NULL DEFAULT 0
);

INSERT INTO
    IdSequence (SequenceName, LastNumber)
VALUES (
        'Reservation',
        (
            SELECT COALESCE(
                    MAX(
                        CAST(
                            SUBSTRING(ReservationId, 4) AS UNSIGNED
                        )
                    ), 0
                )
            FROM Reservation
            WHERE
                ReservationId REGEXP '^RSV[0-9]{7}$'
        )
    )
ON DUPLICATE KEY UPDATE
    LastNumber = GREATEST(
        LastNumber,
        (
            SELECT COALESCE(
                    MAX(
                        CAST(
                            SUBSTRING(ReservationId, 4) AS UNSIGNED
                        )
                    ), 0
                )
            FROM Reservation
            WHERE
                ReservationId REGEXP '^RSV[0-9]{7}$'
        )
    );

INSERT INTO
    IdSequence (SequenceName, LastNumber)
VALUES (
        'Payment',
        (
            SELECT COALESCE(
                    MAX(
                        CAST(
                            SUBSTRING(PaymentId, 4) AS UNSIGNED
                        )
                    ), 0
                )
            FROM Payment
            WHERE
                PaymentId REGEXP '^PMT[0-9]{7}$'
        )
    )
ON DUPLICATE KEY UPDATE
    LastNumber = GREATEST(
        LastNumber,
        (
            SELECT COALESCE(
                    MAX(
                        CAST(
                            SUBSTRING(PaymentId, 4) AS UNSIGNED
                        )
                    ), 0
                )
            FROM Payment
            WHERE
                PaymentId REGEXP '^PMT[0-9]{7}$'
        )
    );