import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

loadEnvConfig(process.cwd());
const enabled=process.env.EASY_EYES_LIVE_E2E==='1' && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY));
test.skip(!enabled,'Requires EASY_EYES_LIVE_E2E=1 and a server-only Supabase key');

test('customer can sign in, save a frame, submit an unpaid order and see it in history',async({page})=>{
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const suffix=randomUUID().slice(0,8);
  const email=`easy-eyes-qa-${suffix}@example.invalid`;
  const password=`Aa7!${randomBytes(18).toString('base64url')}`;
  const slug=`qa-customer-${suffix}`;
  const sku=`QA-${suffix.toUpperCase()}`;
  let userId:string|undefined;
  let productId:string|undefined;
  let variantId:string|undefined;
  try{
    const created=await db.auth.admin.createUser({email,password,email_confirm:true});
    if(created.error||!created.data.user)throw created.error||new Error('QA user was not created');
    userId=created.data.user.id;
    const product=await db.from('products').insert({slug,name:'QA Customer Frame',description:'Temporary customer journey fixture.',base_price_minor:50000,status:'published'}).select('id').single();
    if(product.error||!product.data)throw product.error||new Error('QA product was not created');
    productId=product.data.id;
    const variant=await db.from('product_variants').insert({product_id:productId,sku,frame_color:'Black',lens_color:'Smoke',price_minor:50000,stock_quantity:2}).select('id').single();
    if(variant.error||!variant.data)throw variant.error||new Error('QA variant was not created');
    variantId=variant.data.id;

    await page.goto('/login');
    await page.getByRole('textbox',{name:'Email'}).fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button',{name:'Sign in'}).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByText(`Signed in as ${email}.`)).toBeVisible();

    await page.goto(`/products/${slug}`);
    await expect(page.getByRole('heading',{name:'QA Customer Frame'})).toBeVisible();
    await page.getByRole('button',{name:'Save this frame'}).click();
    await expect(page.getByRole('status').getByText('Saved to your wishlist.')).toBeVisible();
    await page.getByRole('button',{name:'Add to bag'}).click();
    await expect(page.getByRole('status').getByText('Added to bag.')).toBeVisible();

    await page.goto('/cart');
    await expect(page.getByText('QA Customer Frame')).toBeVisible();
    await page.getByRole('link',{name:/Continue to order/}).click();
    await expect(page).toHaveURL(/\/checkout$/);
    const values:Record<string,string>={'Full name':'QA Customer','Phone':'9999999999','Address line 1':'12 Test Road','City':'Mumbai','State':'Maharashtra','PIN code':'400001'};
    for(const [label,value] of Object.entries(values))await page.getByLabel(label).fill(value);
    await page.getByRole('button',{name:'Place unpaid order request'}).click();
    await expect(page).toHaveURL(/\/order-confirmation\/[0-9a-f-]+$/);
    await expect(page.getByText('Payment has not been collected.')).toBeVisible();
    await page.getByRole('link',{name:/View your orders/}).click();
    await expect(page.getByText(/requested/i).first()).toBeVisible();
  }finally{
    if(userId){
      const {data:orders}=await db.from('orders').select('id').eq('user_id',userId);
      for(const order of orders||[]){
        await db.from('inventory_movements').delete().eq('order_id',order.id);
        await db.from('order_status_events').delete().eq('order_id',order.id);
        await db.from('order_items').delete().eq('order_id',order.id);
        await db.from('orders').delete().eq('id',order.id);
      }
      const {data:carts}=await db.from('carts').select('id').eq('user_id',userId);
      for(const cart of carts||[])await db.from('cart_items').delete().eq('cart_id',cart.id);
      await db.from('carts').delete().eq('user_id',userId);
      await db.from('wishlists').delete().eq('user_id',userId);
      await db.from('addresses').delete().eq('user_id',userId);
      await db.auth.admin.deleteUser(userId);
    }
    if(variantId)await db.from('product_variants').delete().eq('id',variantId);
    if(productId)await db.from('products').delete().eq('id',productId);
  }
});

test('admin can create a draft frame, add stock, and attach an uploaded image',async({page})=>{
  test.skip(!process.env.EASY_EYES_ADMIN_QA_FILE,'Requires a temporary admin account prepared by the QA operator');
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const suffix=randomUUID().slice(0,8);
  const {email,password,userId}=JSON.parse(readFileSync(process.env.EASY_EYES_ADMIN_QA_FILE!,'utf8')) as {email:string;password:string;userId:string};
  const slug=`qa-admin-${suffix}`;
  const sku=`QA-ADMIN-${suffix.toUpperCase()}`;
  let productId:string|undefined;
  let mediaPath:string|undefined;
  try{
    await page.goto('/login');
    await page.getByRole('textbox',{name:'Email'}).fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button',{name:'Sign in'}).click();
    await expect(page).toHaveURL(/\/account$/);
    await page.goto('/admin/products/new');
    await expect(page.getByRole('heading',{name:'New product'})).toBeVisible();
    await page.getByLabel('URL slug').fill(slug);
    await page.getByLabel('Name',{exact:true}).fill('QA Admin Frame');
    await page.getByLabel('Base price in INR').fill('725');
    await page.getByLabel('Description').fill('Temporary draft for admin workflow verification.');
    await page.getByRole('button',{name:'Save product'}).click();
    await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]+\/edit$/);
    const product=await db.from('products').select('id').eq('slug',slug).single();
    if(product.error||!product.data)throw product.error||new Error('QA admin product was not created');
    productId=product.data.id;
    await page.getByLabel('SKU').fill(sku);
    await page.getByLabel('Frame colour').fill('Ink');
    await page.getByLabel('Lens colour').fill('Clear');
    await page.getByLabel('Price in INR',{exact:true}).fill('725');
    await page.getByLabel('Stock quantity').fill('3');
    await page.getByRole('button',{name:'Add variant'}).click();
    await expect(page.getByText('Variant added.')).toBeVisible();

    await page.goto('/admin/media');
    await page.getByLabel('Image or campaign video').setInputFiles({name:'qa-pixel.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+tmO8AAAAASUVORK5CYII=','base64')});
    await page.getByRole('button',{name:'Upload media'}).click();
    const status=page.getByRole('status');
    await expect(status).toContainText('Uploaded: ');
    mediaPath=(await status.innerText()).replace('Uploaded: ','').trim();
    await page.goto(`/admin/products/${productId}/edit`);
    await page.getByLabel('Catalog media path').fill(mediaPath);
    await page.getByLabel('Image description').fill('Temporary one pixel QA image');
    await page.getByRole('button',{name:'Attach image'}).click();
    await expect(page.getByText('Image attached.')).toBeVisible();
    const image=await db.from('product_images').select('id').eq('product_id',productId).eq('storage_path',mediaPath).single();
    if(image.error||!image.data)throw image.error||new Error('QA media was not attached');
  }finally{
    if(productId){
      await db.from('product_images').delete().eq('product_id',productId);
      await db.from('product_variants').delete().eq('product_id',productId);
      await db.from('products').delete().eq('id',productId);
    }
    if(mediaPath)await db.storage.from('catalog').remove([mediaPath]);
    if(userId)await db.auth.admin.deleteUser(userId);
  }
});
