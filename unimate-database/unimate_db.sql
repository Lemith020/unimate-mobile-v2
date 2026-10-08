CREATE TABLE favorite_boardings (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  boarding_id uuid NOT NULL REFERENCES boardings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, boarding_id)
);

CREATE TABLE favorite_places (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, place_id)
);

CREATE TABLE favorite_items (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  boarding_id uuid REFERENCES boardings(id) ON DELETE CASCADE,
  place_id uuid REFERENCES places(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(boarding_id, place_id) = 1)
);
CREATE UNIQUE INDEX reviews_user_boarding_idx ON reviews (user_id, boarding_id) WHERE boarding_id IS NOT NULL;
CREATE UNIQUE INDEX reviews_user_place_idx ON reviews (user_id, place_id) WHERE place_id IS NOT NULL;

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boarding_id uuid REFERENCES boardings(id) ON DELETE SET NULL,
  market_item_id uuid REFERENCES marketplace_items(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(boarding_id, market_item_id) <= 1)
);

CREATE TABLE conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title varchar(200) NOT NULL,
  body text,
  data jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform varchar(20),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(150) NOT NULL,
  subtitle varchar(250),
  image_url text NOT NULL,
  button_text varchar(50),
  action_type varchar(20) NOT NULL DEFAULT 'none' CHECK (action_type IN ('none','category','boarding','place','item','url')),
  action_target text,
  start_date date,
  end_date date,
  sort_order smallint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE emergency_contacts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar(150) NOT NULL,
  phone varchar(20) NOT NULL,
  description text,
  city varchar(100),
  sort_order smallint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type varchar(30) NOT NULL CHECK (target_type IN ('boarding','place','item','user','message')),
  target_id uuid NOT NULL,
  reason varchar(100) NOT NULL,
  details text,
  status report_status NOT NULL DEFAULT 'open',
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE VIEW boarding_rating_summary AS
SELECT boarding_id, ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count
FROM reviews WHERE boarding_id IS NOT NULL GROUP BY boarding_id;

CREATE VIEW place_rating_summary AS
SELECT place_id, ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count
FROM reviews WHERE place_id IS NOT NULL GROUP BY place_id;

CREATE INDEX idx_faculties_university ON faculties(university_id);
CREATE INDEX idx_student_profiles_university ON student_profiles(university_id);
CREATE INDEX idx_boardings_owner ON boardings(owner_id);
CREATE INDEX idx_boardings_status_featured ON boardings(status, is_featured);
CREATE INDEX idx_boardings_rent ON boardings(monthly_rent);
CREATE INDEX idx_boardings_location ON boardings(latitude, longitude);
CREATE INDEX idx_boarding_images_boarding ON boarding_images(boarding_id);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_boarding_status ON applications(boarding_id, status);
CREATE INDEX idx_places_category ON places(category_id);
CREATE INDEX idx_places_owner ON places(owner_id);
CREATE INDEX idx_places_status ON places(status);
CREATE INDEX idx_places_location ON places(latitude, longitude);
CREATE INDEX idx_place_images_place ON place_images(place_id);
CREATE INDEX idx_menu_categories_place ON menu_categories(place_id);
CREATE INDEX idx_menu_items_place ON menu_items(place_id);
CREATE INDEX idx_orders_student ON orders(student_id, created_at DESC);
CREATE INDEX idx_orders_place_status ON orders(place_id, status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_medicines_name ON medicines(lower(name));
CREATE INDEX idx_place_medicines_medicine ON place_medicines(medicine_id);
CREATE INDEX idx_transport_routes_status ON transport_routes(status);
CREATE INDEX idx_transport_schedules_route ON transport_schedules(route_id);
CREATE INDEX idx_market_items_status_created ON marketplace_items(status, created_at DESC);
CREATE INDEX idx_market_items_seller ON marketplace_items(seller_id);
CREATE INDEX idx_market_images_item ON marketplace_item_images(item_id);
CREATE INDEX idx_reviews_boarding ON reviews(boarding_id);
CREATE INDEX idx_reviews_place ON reviews(place_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_banners_active ON banners(is_active, sort_order);
CREATE INDEX idx_reports_status ON reports(status);

CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['users','student_profiles','provider_profiles','boardings','applications','places','menu_items','orders','marketplace_items','transport_routes'])
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;

INSERT INTO universities (name, city, email_domain) VALUES ('Sample University', 'Colombo', 'sample.ac.lk');

INSERT INTO faculties (university_id, name)
SELECT u.id, f FROM universities u, unnest(ARRAY['Engineering','Science','Management','Arts','Medicine','Technology']) AS f
WHERE u.name = 'Sample University';

INSERT INTO facilities (name) VALUES ('WiFi'),('Water'),('Electricity'),('Meals'),('Attached bathroom'),('Furniture'),('Fan'),('Kitchen'),('Laundry'),('Parking'),('Security');

INSERT INTO place_categories (code, name, group_name) VALUES
('food_shop','Food shop','food'),
('canteen','Canteen','food'),
('mess','Mess','food'),
('pharmacy','Pharmacy','pharmacy'),
('dispensary','Dispensary','pharmacy'),
('hospital','Hospital','health'),
('medical_center','Medical center','health'),
('print_shop','Print shop','service'),
('laundry','Laundry','service'),
('stationery','Stationery','service'),
('other_service','Other service','service');

INSERT INTO marketplace_categories (name) VALUES ('Furniture'),('Electronics'),('Books'),('Kitchen items'),('Clothes'),('Other');

INSERT INTO emergency_contacts (name, phone, description, sort_order) VALUES
('Ambulance (Suwa Seriya)','1990','Free ambulance service',1),
('Police','119','Police emergency',2),
('Fire and Rescue','110','Fire emergency',3);