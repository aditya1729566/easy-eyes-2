import {describe,it,expect} from 'vitest';
import {addressInput,productInput} from '../../src/lib/validation';
import {money} from '../../src/config/site';
describe('store domain validation',()=>{
 it('formats integer paise in INR',()=>{expect(money(1299500)).toContain('12,995')});
 it('accepts a complete Indian delivery address',()=>{expect(addressInput.parse({name:'Example Customer',phone:'9999999999',line_1:'12 Example Road',city:'Bengaluru',state:'Karnataka',postal_code:'560001',country:'IN'}).country).toBe('IN')});
 it('rejects invalid PIN codes and non-Indian destinations',()=>{const base={name:'Example Customer',phone:'9999999999',line_1:'12 Example Road',city:'Bengaluru',state:'Karnataka'};expect(addressInput.safeParse({...base,postal_code:'12345',country:'IN'}).success).toBe(false);expect(addressInput.safeParse({...base,postal_code:'560001',country:'US'}).success).toBe(false)});
 it('rejects negative merchandise prices',()=>{expect(productInput.safeParse({slug:'frame-one',name:'Frame One',description:'',base_price_minor:-1}).success).toBe(false)});
});
