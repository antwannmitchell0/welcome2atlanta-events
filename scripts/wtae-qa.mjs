import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const stamp = Date.now();
const publicEmail = `guest-${stamp}@example.com`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(20000);

const log = [];
page.on("pageerror", (err) => log.push(`pageerror ${err.message}`));

async function shot(name) {
  await page.screenshot({ path: `/workspace/screenshots/${name}.png`, fullPage: true });
}

async function textHas(needle) {
  return (await page.locator("body").innerText()).includes(needle);
}

const result = {};

try {
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  result.homeHero = await textHas("ATLANTA");
  result.homeHappening = await textHas("IS HAPPENING");
  result.homeLive = await textHas("LIVE");
  result.homeMoments = await textHas("WTAE MOMENTS");
  await shot("home-final");

  await page.goto(`${base}/photos`, { waitUntil: "networkidle" });
  result.photosHeader = await textHas("Find Photos");
  result.photosBrand = await textHas("WTAE");

  await page.goto(`${base}/photos/phone`, { waitUntil: "networkidle" });
  await page.locator("#phone-lookup").fill("(404) 555-0199");
  await page.getByRole("button", { name: /Find my photos/i }).click();
  result.phoneHonest = await textHas("No check-in found");
  result.phoneFake = await textHas("24 photos");

  await page.goto(`${base}/photos/face`, { waitUntil: "networkidle" });
  result.facePrivacy = await textHas("Privacy disclaimer");

  await page.goto(`${base}/portal`, { waitUntil: "networkidle" });
  result.portalRedirects = page.url().includes("/login");

  await page.goto(`${base}/events`, { waitUntil: "networkidle" });
  await page.locator('input[name="requester_name"]').fill("Test Host");
  await page.locator('input[name="email"]').fill(`host-${stamp}@example.com`);
  await page.locator('input[name="event_name"]').fill("Midtown Test Night");
  await page.locator('form button[type="submit"]').click();
  await page.waitForTimeout(2500);
  result.eventSuccess = await textHas("WE GOT IT");

  await page.goto(`${base}/creators`, { waitUntil: "networkidle" });
  await page.locator('input[name="full_name"]').fill("Test Shooter");
  await page.locator('input[name="email"]').fill(`shooter-${stamp}@example.com`);
  await page.locator('input[name="instagram"]').fill("@testshooter");
  await page.locator('form button[type="submit"]').click();
  await page.waitForTimeout(2500);
  result.photographerSuccess = await textHas("YOU’RE IN THE PILE");
  await shot("creators-submit");

  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  result.loginGoogle = await textHas("Continue with Google");
  await page.getByRole("button", { name: /Need an account/i }).click();
  await page.locator('input[name="name"]').fill("Public Guest");
  await page.locator('input[name="email"]').fill(publicEmail);
  await page.locator('input[name="password"]').fill("atlanta404");
  await page.getByRole("button", { name: /Create account/i }).click();
  await page.waitForTimeout(4000);
  result.portalUrl = page.url();
  result.portalLoaded = page.url().includes("/portal");
  result.publicUserForbidden = await textHas("founders only") || await textHas("Founders only");
  result.publicUserGotOverview = await textHas("OVERVIEW");
  result.publicUserClaim = await textHas("FOUNDER CLAIM");
  await shot("portal-unauthorized");
} catch (err) {
  result.error = String(err);
  result.errorUrl = page.url();
  await shot("qa-error");
}

console.log(JSON.stringify({ result, log }, null, 2));
await browser.close();
