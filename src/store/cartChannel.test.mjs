import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const saved = new Map();
globalThis.localStorage = {
  getItem: key => saved.get(key) ?? null,
  setItem: (key, value) => saved.set(key, value),
  removeItem: key => saved.delete(key),
};
const source = readFileSync(new URL('./cartStore.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  .replace(/from (['"])(zustand(?:\/middleware)?)\1/g, (_match, _quote, specifier) => `from '${import.meta.resolve(specifier)}'`);
const { useCartStore } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const meal = { item_id: 1, restaurant_id: 19, name: 'Meal', quantity: 1, base_price: 50, addons: [] };

test('same-restaurant menu switching preserves the original cart until confirmed clear', () => {
  const cart = useCartStore.getState();
  cart.clearCart();
  cart.setRestaurant(19, 'Kitchen', 'kitchen', 'whatsapp_link');
  cart.addItem({ ...meal, order_from: 'whatsapp_link' });
  assert.equal(cart.isDifferentRestaurant(19, 'app_web'), true);
  assert.throws(() => cart.setRestaurant(19, 'Kitchen', 'kitchen', 'app_web'), /confirm clearing/);
  assert.equal(useCartStore.getState().orderFrom, 'whatsapp_link');
  assert.equal(useCartStore.getState().items.length, 1);
  cart.clearCart();
  cart.setRestaurant(19, 'Kitchen', 'kitchen', 'app_web');
  cart.addItem({ ...meal, item_id: 2, order_from: 'app_web' });
  assert.equal(useCartStore.getState().orderFrom, 'app_web');
  assert.equal(useCartStore.getState().items[0].item_id, 2);
});

test('a reloaded WhatsApp cart retains its channel independently of campaign expiry', async () => {
  const cart = useCartStore.getState();
  cart.clearCart();
  cart.setRestaurant(19, 'Kitchen', 'kitchen', 'whatsapp_link');
  cart.addItem({ ...meal, order_from: 'whatsapp_link' });
  const persisted = saved.get('mangaale-cart');
  cart.clearCart();
  saved.set('mangaale-cart', persisted);
  await useCartStore.persist.rehydrate();
  assert.equal(useCartStore.getState().orderFrom, 'whatsapp_link');
  assert.equal(useCartStore.getState().items.length, 1);
  assert.equal(useCartStore.getState().validatedTotals, null);
});
