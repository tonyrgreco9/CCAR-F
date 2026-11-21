import { render } from '@rt/index';
import { App } from './ui/app';
import { store } from './ui/ctx';
import './styles.css';

// Submit an exam whose deadline passed while the app was closed (exactly once), before first paint.
const expired = store.tick();
if (expired && !location.hash.startsWith('#/results')) location.hash = `/results/${expired.id}?expired=1`;
render(() => <App />, document.getElementById('root')!);
// Background timer for expiry on any page (the exam runner also ticks).
setInterval(() => { const done = store.tick(); if (done) location.hash = `/results/${done.id}?expired=1`; }, 1000);
