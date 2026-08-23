-- Migration 0042: Comprehensive UK Dental Services Catalog
-- Seeds and updates all 34 authoritative UK dental clinical services with categories, durations, and GBP fees.

-- 1. Ensure all 12 clinical service categories exist
insert into public.service_categories (organization_id, name, description) values
  ('11111111-1111-1111-1111-111111111111', 'General Dentistry', 'Routine oral health examinations, check-ups, emergency care, and paediatric dental visits.'),
  ('11111111-1111-1111-1111-111111111111', 'Dental Hygiene', 'Scale and polish, stain removal, periodontal prevention, and oral hygiene therapy.'),
  ('11111111-1111-1111-1111-111111111111', 'Periodontics', 'Specialist periodontal consultation, deep pocket root debridement, and gum therapy.'),
  ('11111111-1111-1111-1111-111111111111', 'Restorative Dentistry', 'Composite white fillings, ceramic crowns, inlays, onlays, and fixed dental bridges.'),
  ('11111111-1111-1111-1111-111111111111', 'Endodontics', 'Precision root canal therapy across anterior, premolar, and molar teeth.'),
  ('11111111-1111-1111-1111-111111111111', 'Oral Surgery', 'Simple extractions, surgical tooth removal, and complex wisdom tooth surgery.'),
  ('11111111-1111-1111-1111-111111111111', 'Cosmetic Dentistry', 'Composite bonding, porcelain veneers, home and in-surgery teeth whitening.'),
  ('11111111-1111-1111-1111-111111111111', 'Orthodontics', 'Clear aligner consultations, orthodontic assessments, and replacement retainers.'),
  ('11111111-1111-1111-1111-111111111111', 'Dental Implants', 'Implant surgical planning, titanium fixture placement, and custom implant crowns.'),
  ('11111111-1111-1111-1111-111111111111', 'Prosthodontics', 'Removable acrylic and cobalt-chrome dentures and full arch rehabilitation.'),
  ('11111111-1111-1111-1111-111111111111', 'Diagnostics', 'Intraoral small periapical X-rays, panoramic OPG radiographs, and 3D CBCT scans.'),
  ('11111111-1111-1111-1111-111111111111', 'Preventive Dentistry', 'Custom night guards, occlusal splints, and bite protection appliances.')
on conflict (organization_id, name) do update set
  description = excluded.description,
  updated_at = now();

-- 2. Insert or update all 34 UK Clinical Services
insert into public.services (
  organization_id,
  branch_id,
  name,
  slug,
  description,
  duration_minutes,
  price,
  category_id,
  is_active,
  show_on_website
) values
  -- General Dentistry
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'New Patient Dental Examination', 'new-patient-dental-examination',
   'Comprehensive oral health assessment, soft tissue screening, intraoral photos, routine X-rays, and personalised treatment plan.',
   45, 70, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'General Dentistry'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Routine Dental Examination', 'routine-dental-examination',
   'Periodic recall examination, dental health check-up, oral cancer screening, and preventative review.',
   20, 60, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'General Dentistry'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Emergency Dental Appointment', 'emergency-dental-appointment',
   'Urgent dental triage, pain relief, temporary restoration, or emergency infection management.',
   30, 85, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'General Dentistry'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Child Dental Examination', 'child-dental-examination',
   'Gentle paediatric examination, dental growth review, dietary advice, and preventative fluoride coaching.',
   20, 35, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'General Dentistry'), true, true),

  -- Dental Hygiene
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Routine Dental Hygiene / Scale & Polish', 'routine-dental-hygiene',
   'Professional ultrasonic scaling, plaque and tartar removal, dental flossing, and gentle polishing.',
   30, 85, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Dental Hygiene'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Extended Dental Hygiene', 'extended-dental-hygiene',
   'In-depth hygiene therapy for heavy staining, advanced calculus buildup, or initial periodontal maintenance.',
   45, 125, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Dental Hygiene'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Airflow Stain Removal & Hygiene', 'airflow-stain-removal-hygiene',
   'Advanced air-powder polishing system to gently eliminate stubborn tea, coffee, wine, and tobacco stains.',
   30, 105, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Dental Hygiene'), true, true),

  -- Periodontics
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Periodontal Consultation', 'periodontal-consultation',
   'Specialist 6-point periodontal pocket charting, bone loss assessment, and targeted gum therapy plan.',
   45, 150, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Periodontics'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Deep Cleaning / Periodontal Treatment', 'deep-cleaning-periodontal-treatment',
   'Subgingival root surface debridement and ultrasonic disinfection under local anaesthesia per quadrant.',
   60, 175, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Periodontics'), true, true),

  -- Restorative Dentistry
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Composite White Filling', 'composite-white-filling',
   'Aesthetic, tooth-matched composite resin restoration for decayed, cracked, or fractured teeth.',
   45, 175, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Restorative Dentistry'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Ceramic / Porcelain Crown', 'ceramic-porcelain-crown',
   'Full-coverage custom ceramic crown designed for maximum structural reinforcement and natural aesthetics.',
   75, 850, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Restorative Dentistry'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Dental Bridge', 'dental-bridge',
   'Fixed porcelain bridge to seamlessly replace one or more missing teeth with natural look and bite strength.',
   90, 900, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Restorative Dentistry'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Ceramic Inlay / Onlay', 'ceramic-inlay-onlay',
   'Custom laboratory-milled ceramic restoration preserving tooth structure for large posterior cavities.',
   60, 750, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Restorative Dentistry'), true, true),

  -- Endodontics
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Root Canal – Front Tooth', 'root-canal-front-tooth',
   'Rotary endodontic therapy for anterior incisor or canine tooth with digital apex locator and thermal obturation.',
   75, 500, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Endodontics'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Root Canal – Premolar', 'root-canal-premolar',
   'Endodontic root treatment for multi-canal premolar tooth ensuring complete disinfection and sealing.',
   90, 575, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Endodontics'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Root Canal – Molar', 'root-canal-molar',
   'Complex molar root canal therapy utilizing microscopic visualization, rotary shaping, and warm gutta-percha seal.',
   120, 700, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Endodontics'), true, true),

  -- Oral Surgery
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Simple Tooth Extraction', 'simple-tooth-extraction',
   'Gentle tooth removal under local anaesthesia with atraumatic extraction technique and socket care.',
   30, 195, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Oral Surgery'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Surgical Tooth Extraction', 'surgical-tooth-extraction',
   'Surgical extraction for broken-down roots, sectioned roots, or ankylosed teeth with suturing.',
   60, 350, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Oral Surgery'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Wisdom Tooth Extraction', 'wisdom-tooth-extraction',
   'Specialist extraction of impacted or partially erupted third molars with pre-surgical nerve assessment.',
   60, 475, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Oral Surgery'), true, true),

  -- Cosmetic Dentistry
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Composite Bonding – Per Tooth', 'composite-bonding',
   'Artistic layering of premium composite resin to fix chips, close gaps, and refine tooth contour and shade.',
   60, 250, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Cosmetic Dentistry'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Porcelain Veneer – Per Tooth', 'porcelain-veneer',
   'Ultra-thin bespoke handcrafted porcelain veneer for supreme natural smile aesthetics and longevity.',
   90, 850, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Cosmetic Dentistry'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Home Teeth Whitening', 'home-teeth-whitening',
   'Customised precision whitening trays and professional-grade boutique whitening gel for safe home application.',
   30, 375, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Cosmetic Dentistry'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'In-Surgery Teeth Whitening', 'in-surgery-teeth-whitening',
   'Instant chairside laser/light-accelerated professional teeth whitening achieving multiple shade brightness.',
   60, 525, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Cosmetic Dentistry'), true, true),

  -- Orthodontics
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Orthodontic / Clear Aligner Consultation', 'orthodontic-clear-aligner-consultation',
   '3D digital smile simulation, bite alignment assessment, clear aligners (Invisalign) & brace planning.',
   45, 100, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Orthodontics'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Replacement Retainer – Per Arch', 'replacement-retainer',
   'Custom Essix or Vivera retention appliance fabricated to prevent post-orthodontic tooth relapse.',
   30, 175, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Orthodontics'), true, true),

  -- Dental Implants
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Dental Implant Consultation', 'dental-implant-consultation',
   'Implant planning, jawbone density review, clinical smile analysis, and surgical treatment simulation.',
   45, 120, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Dental Implants'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Single Dental Implant Placement', 'single-dental-implant-placement',
   'Surgical titanium implant fixture placement under local anaesthesia with digital surgical guide.',
   90, 1850, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Dental Implants'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Implant Crown / Final Restoration', 'implant-crown-final-restoration',
   'Custom abutment and screw-retained ceramic crown designed for permanent implant restoration.',
   45, 850, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Dental Implants'), true, true),

  -- Prosthodontics
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Denture Consultation', 'denture-consultation',
   'Comprehensive assessment for full or partial dentures, stability review, and shade consultation.',
   30, 75, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Prosthodontics'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Full Acrylic Denture – Per Arch', 'full-acrylic-denture',
   'High-impact custom prosthetic acrylic complete denture engineered for comfort and chewing function.',
   60, 1000, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Prosthodontics'), true, true),

  -- Diagnostics
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Small Dental X-Ray', 'small-dental-x-ray',
   'High-definition digital periapical or bitewing X-ray radiograph for localized diagnostic view.',
   15, 15, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Diagnostics'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Panoramic X-Ray / OPG', 'panoramic-x-ray-opg',
   'Full-mouth digital orthopantomogram providing complete visualization of teeth, jaws, and joints.',
   15, 80, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Diagnostics'), true, true),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'CBCT 3D Scan', 'cbct-3d-scan',
   'Cone Beam Computed Tomography 3D scan for precision implant, endodontic, and bone volumetric diagnosis.',
   30, 130, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Diagnostics'), true, true),

  -- Preventive Dentistry
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Night Guard / Bite Guard', 'night-guard-bite-guard',
   'Custom dual-laminate occlusal splint designed to protect teeth from bruxism and relieve TMJ strain.',
   30, 175, (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Preventive Dentistry'), true, true)
on conflict (organization_id, slug) do update set
  name = excluded.name,
  description = excluded.description,
  duration_minutes = excluded.duration_minutes,
  price = excluded.price,
  category_id = excluded.category_id,
  is_active = excluded.is_active,
  show_on_website = excluded.show_on_website,
  updated_at = now();

-- 3. Also update legacy service rows to match modern UK naming & pricing if they exist
update public.services set
  name = 'New Patient Dental Examination',
  duration_minutes = 45,
  price = 70,
  category_id = (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'General Dentistry')
where slug in ('general-checkup', 'new-patient-examination')
  and organization_id = '11111111-1111-1111-1111-111111111111';

update public.services set
  name = 'Routine Dental Hygiene / Scale & Polish',
  duration_minutes = 30,
  price = 85,
  category_id = (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Dental Hygiene')
where slug in ('teeth-cleaning', 'dental-hygiene')
  and organization_id = '11111111-1111-1111-1111-111111111111';

update public.services set
  name = 'Porcelain Veneer – Per Tooth',
  duration_minutes = 90,
  price = 850,
  category_id = (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Cosmetic Dentistry')
where slug in ('cosmetic-veneers', 'porcelain-veneer')
  and organization_id = '11111111-1111-1111-1111-111111111111';

update public.services set
  name = 'Root Canal – Front Tooth',
  duration_minutes = 75,
  price = 500,
  category_id = (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Endodontics')
where slug in ('root-canal', 'root-canal-treatment')
  and organization_id = '11111111-1111-1111-1111-111111111111';

update public.services set
  name = 'Orthodontic / Clear Aligner Consultation',
  duration_minutes = 45,
  price = 100,
  category_id = (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Orthodontics')
where slug = 'orthodontics'
  and organization_id = '11111111-1111-1111-1111-111111111111';

update public.services set
  name = 'Child Dental Examination',
  duration_minutes = 20,
  price = 35,
  category_id = (select id from public.service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'General Dentistry')
where slug = 'pediatric-dentistry'
  and organization_id = '11111111-1111-1111-1111-111111111111';
