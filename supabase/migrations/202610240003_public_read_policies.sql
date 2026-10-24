-- Public policies never need to execute the privileged admin predicate.
drop policy categories_read on public.categories;
create policy categories_read on public.categories for select to anon, authenticated using(active);
drop policy collections_read on public.collections;
create policy collections_read on public.collections for select to anon, authenticated using(published);
drop policy products_read on public.products;
create policy products_read on public.products for select to anon, authenticated using(status='published');
drop policy variants_read on public.product_variants;
create policy variants_read on public.product_variants for select to anon, authenticated using(active and exists(select 1 from public.products p where p.id=product_id and p.status='published'));
drop policy images_read on public.product_images;
create policy images_read on public.product_images for select to anon, authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status='published'));
drop policy collection_products_read on public.collection_products;
create policy collection_products_read on public.collection_products for select to anon, authenticated using(exists(select 1 from public.collections c where c.id=collection_id and c.published) and exists(select 1 from public.products p where p.id=product_id and p.status='published'));
drop policy campaigns_read on public.campaigns;
create policy campaigns_read on public.campaigns for select to anon, authenticated using(published);
drop policy reviews_read on public.reviews;
create policy reviews_read on public.reviews for select to anon, authenticated using(status='approved' or user_id=auth.uid());
create policy reviews_admin_read on public.reviews for select to authenticated using(public.is_admin());
drop policy media_approved_read on storage.objects;
create policy media_approved_read on storage.objects for select to anon, authenticated using(
  (bucket_id='catalog' and exists(select 1 from public.product_images i join public.products p on p.id=i.product_id where i.storage_path=storage.objects.name and p.status='published')) or
  (bucket_id='campaigns' and exists(select 1 from public.campaigns c where c.published and storage.objects.name in (c.video_path,c.poster_path,c.image_path)))
);
create policy media_admin_read on storage.objects for select to authenticated using(bucket_id in ('catalog','campaigns') and public.is_admin());
revoke execute on function public.is_admin() from anon;
