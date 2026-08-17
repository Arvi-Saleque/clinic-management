-- Small Basic-tier extensions that let one tooth entry hold the clinical
-- finding and the next treatment action without introducing a separate
-- advanced treatment-planning subsystem.

alter table odontogram_entries
  add column condition_code text,
  add column recommended_treatment text,
  add column treatment_priority text check (treatment_priority in ('routine', 'priority', 'urgent')),
  add column planned_date date,
  add column estimated_fee numeric(10, 2) check (estimated_fee is null or estimated_fee >= 0);

