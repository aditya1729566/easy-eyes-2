import {test,expect} from '@playwright/test';
test('editorial storefront and model gallery',async({page})=>{await page.goto('/');await expect(page.getByRole('heading',{name:/look closer/i})).toBeVisible();await page.getByRole('link',{name:/explore the looks/i}).click();await expect(page).toHaveURL(/#the-looks$/);await expect(page.getByRole('heading',{name:/a frame changes everything/i})).toBeVisible();await expect(page.locator('.model-gallery-card')).toHaveCount(9);await expect(page.locator('.model-gallery-card.is-active')).toContainText('₹25,000')});
test('mobile menu remains operable',async({page})=>{await page.setViewportSize({width:375,height:812});await page.goto('/');await page.getByRole('button',{name:'Open menu'}).click();await expect(page.getByRole('navigation',{name:'Mobile navigation'})).toBeVisible();await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Collections'}).click();await expect(page).toHaveURL(/\/collections/)});
test('hero films play in order and can be selected manually',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.hero-film')).toHaveCount(4);
  await expect(page.locator('.hero-media img')).toHaveCount(0);
  await expect(page.locator('.hero-media').locator('div')).toHaveCount(0);
  await page.waitForFunction(()=>{
    const header=getComputedStyle(document.querySelector('.site-header')!);
    const media=document.querySelector('.hero-media')!.getBoundingClientRect();
    return header.position==='absolute' && header.color==='rgb(0, 0, 0)' && header.backgroundColor==='rgba(0, 0, 0, 0)' && Math.abs(media.bottom-innerHeight*.8)<2;
  });
  const layout=await page.evaluate(()=>{
    const header=document.querySelector('.site-header')!.getBoundingClientRect();
    const media=document.querySelector('.hero-media')!.getBoundingClientRect();
    const controls=document.querySelector('.hero-film-controls')!.getBoundingClientRect();
    return {headerBottom:header.bottom,mediaTop:media.top,mediaBottom:media.bottom,controlsTop:controls.top,viewportHeight:innerHeight};
  });
  expect(layout.mediaTop).toBe(0);
  expect(layout.headerBottom).toBeLessThan(layout.mediaBottom);
  expect(layout.mediaBottom).toBeLessThanOrEqual(layout.viewportHeight*.8+2);
  expect(layout.controlsTop).toBeGreaterThanOrEqual(layout.mediaBottom-1);
  await expect(page.locator('.hero-film.is-active')).toHaveAttribute('src','/assets/campaign/film-01.mp4');
  await expect(page.locator('.hero-film').first()).toHaveJSProperty('paused',false);
  await page.evaluate(()=>{
    const media=document.querySelector('.hero-media')!;
    new MutationObserver(()=>{
      const outgoing=media.querySelector<HTMLVideoElement>('.hero-film.is-outgoing');
      const active=media.querySelector<HTMLVideoElement>('.hero-film.is-active');
      if(outgoing?.getAttribute('src')==='/assets/campaign/film-01.mp4' && active?.getAttribute('src')==='/assets/campaign/film-02.mp4' && getComputedStyle(outgoing).opacity==='1') document.documentElement.dataset.coveredHandoff='yes';
    }).observe(media,{subtree:true,attributes:true,attributeFilter:['class']});
  });
  await page.locator('.hero-film').first().evaluate(video=>video.dispatchEvent(new Event('ended')));
  await expect(page.locator('.hero-film.is-active')).toHaveAttribute('src','/assets/campaign/film-02.mp4');
  await expect(page.locator('html')).toHaveAttribute('data-covered-handoff','yes');
  await page.getByRole('button',{name:'Play film 4'}).click();
  await expect(page.locator('.hero-film.is-active')).toHaveAttribute('src','/assets/campaign/film-04.mp4');
  await page.getByRole('button',{name:'Pause films'}).click();
  await expect(page.locator('.hero-film').nth(3)).toHaveJSProperty('paused',true);
  await page.getByRole('button',{name:'Play films'}).click();
  await expect(page.locator('.hero-film').nth(3)).toHaveJSProperty('paused',false);
});
test('gallery advances through models in perspective',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>!!document.querySelector('.model-gallery-card')?.getAttribute('style'));
  await page.evaluate(()=>{const section=document.querySelector<HTMLElement>('.model-gallery')!;window.scrollTo({top:section.offsetTop+(section.offsetHeight-innerHeight)/2,behavior:'instant'})});
  await expect(page.locator('.model-gallery-footer [role="status"]')).toContainText('Look 05 of 09');
  await expect(page.locator('.model-gallery-card.is-active')).toContainText('₹25,000');
});
