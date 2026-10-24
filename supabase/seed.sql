-- OPTIONAL DEMONSTRATION DATA. These draft records are not real Easy Eyes merchandise.
-- Replace names, descriptions, prices, stock and imagery with approved product data before publishing.
insert into public.categories(slug,name,description,display_order)
values('sunglasses','Sunglasses','Eyewear for bright days.',1)
on conflict(slug) do nothing;

insert into public.collections(slug,name,description,published,display_order)
values('form-studies','Form Studies','Draft collection for merchandising setup.',false,1)
on conflict(slug) do nothing;

insert into public.products(slug,name,description,category_id,base_price_minor,material,frame_shape,fit,specifications,status,featured_order)
select v.slug,v.name,v.description,c.id,v.price,v.material,v.shape,v.fit,v.specs::jsonb,'draft'::public.product_status,v.rank
from (values
  ('demo-aster-01','DEMO — Aster 01','A slim rectangular study with measured edges and an understated profile.',890000,'Acetate','Rectangle','Medium','{"frame_width_mm":142,"lens_width_mm":51,"bridge_mm":19,"temple_mm":145}',1),
  ('demo-sora-02','DEMO — Sora 02','A softly rounded metal frame with a quiet, open silhouette.',1050000,'Stainless steel','Oval','Medium','{"frame_width_mm":138,"lens_width_mm":49,"bridge_mm":20,"temple_mm":145}',2),
  ('demo-vale-03','DEMO — Vale 03','A fuller curved frame composed around one continuous line.',975000,'Acetate','Wrap','Wide','{"frame_width_mm":148,"lens_width_mm":56,"bridge_mm":18,"temple_mm":140}',3)
) as v(slug,name,description,price,material,shape,fit,specs,rank)
cross join public.categories c where c.slug='sunglasses'
on conflict(slug) do nothing;

insert into public.product_variants(product_id,sku,frame_color,lens_color,price_minor,stock_quantity)
select p.id,v.sku,v.frame,v.lens,v.price,v.stock
from (values
  ('demo-aster-01','DEMO-ASTER-01-BLK','Black','Smoke',890000,4),
  ('demo-aster-01','DEMO-ASTER-01-HNY','Honey','Brown',890000,3),
  ('demo-sora-02','DEMO-SORA-02-SLV','Silver','Green',1050000,5),
  ('demo-vale-03','DEMO-VALE-03-OLV','Olive','Brown',975000,2)
) as v(slug,sku,frame,lens,price,stock)
join public.products p on p.slug=v.slug
on conflict(sku) do nothing;

insert into public.collection_products(collection_id,product_id,display_order)
select c.id,p.id,v.rank
from (values ('demo-aster-01',1),('demo-sora-02',2),('demo-vale-03',3)) as v(slug,rank)
join public.products p on p.slug=v.slug
cross join public.collections c where c.slug='form-studies'
on conflict(collection_id,product_id) do nothing;
