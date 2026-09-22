ALTER TABLE "AvailabilityException"
ADD CONSTRAINT "AvailabilityException_time_window_check"
CHECK (
  ("startMinute" IS NULL AND "endMinute" IS NULL)
  OR
  (
    "startMinute" IS NOT NULL
    AND "endMinute" IS NOT NULL
    AND "startMinute" >= 0
    AND "endMinute" <= 1440
    AND "startMinute" < "endMinute"
  )
);
