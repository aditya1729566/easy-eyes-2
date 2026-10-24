import {test,expect} from '@playwright/test';
test('editorial storefront and model gallery',async({page})=>{await page.goto('/');await expect(page.getByRole('heading',{name:/look closer/i})).toBeVisible();await page.getByRole('link',{name:/explore the looks/i}).click();await expect(page).toHaveURL(/#the-looks$/);await expect(page.getByRole('heading',{name:/a frame changes everything/i})).toBeVisible();await expect(page.locator('.model-gallery-card')).toHaveCount(9);await expect(page.locator('.model-gallery-card.is-active')).toContainText('₹25,000')});
test('mobile menu remains operable',async({page})=>{await page.setViewportSize({width:375,height:812});await page.goto('/');await page.getByRole('button',{name:'Open menu'}).click();await expect(page.getByRole('navigation',{name:'Mobile navigation'})).toBeVisible();await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Collections'}).click();await expect(page).toHaveURL(/\/collections/)});
test('gallery advances through looks and films play in sequence',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>!!document.querySelector('.model-gallery-card')?.getAttribute('style'));
  await page.evaluate(()=>{const section=document.querySelector<HTMLElement>('.model-gallery')!;window.scrollTo({top:section.offsetTop+(section.offsetHeight-innerHeight)/2,behavior:'instant'})});
  await expect(page.locator('.model-gallery-footer [role="status"]')).toContainText('Look 05 of 09');
  await page.locator('.film-feature').scrollIntoViewIfNeeded();
  await expect(page.locator('.film-feature video.is-active')).toHaveAttribute('src','/assets/campaign/film-01.mp4');
  await expect(page.locator('.film-feature video').first()).toHaveJSProperty('paused',false);
  await page.locator('.film-feature video').nth(0).evaluate(video=>video.dispatchEvent(new Event('ended')));
  await expect(page.locator('.film-feature video.is-active')).toHaveAttribute('src','/assets/campaign/film-02.mp4');
  await page.locator('.film-feature video').nth(1).evaluate(video=>video.dispatchEvent(new Event('ended')));
  await expect(page.locator('.film-feature video.is-active')).toHaveAttribute('src','/assets/campaign/film-03.mp4');
});
