import assert from 'node:assert/strict';
import test from 'node:test';
import { checkoutOrderChannel } from './checkoutOrderChannel.mjs';

test('WhatsApp links carry the restaurant delivery channel into every checkout request', () => {
  for (const source of ['whatsapp', 'WhatsApp', ' WHATSAPP ']) {
    assert.deepEqual(checkoutOrderChannel(source), {
      order_from: 'whatsapp_link', utm_source: 'whatsapp',
    });
  }
});

test('ordinary app/web and other campaign sources stay on platform delivery', () => {
  for (const source of [undefined, null, '', ' ']) {
    assert.deepEqual(checkoutOrderChannel(source), { order_from: 'app_web' });
  }
  assert.deepEqual(checkoutOrderChannel('google'), { order_from: 'app_web', utm_source: 'google' });
});

test('changing the delivery channel changes the serialized preview cache key', () => {
  const cart = { restaurant_id: 19, items: [{ item_id: 754, quantity: 3 }] };
  assert.notEqual(
    JSON.stringify({ ...cart, ...checkoutOrderChannel('whatsapp') }),
    JSON.stringify({ ...cart, ...checkoutOrderChannel() }),
  );
});

test('saved cart source takes priority over expired or replaced campaign tags', () => {
  assert.deepEqual(checkoutOrderChannel(undefined, 'whatsapp_link'), { order_from: 'whatsapp_link', utm_source: 'whatsapp' });
  assert.deepEqual(checkoutOrderChannel('whatsapp', 'app_web'), { order_from: 'app_web' });
  assert.deepEqual(checkoutOrderChannel('google', 'whatsapp_link'), { order_from: 'whatsapp_link', utm_source: 'whatsapp' });
});
