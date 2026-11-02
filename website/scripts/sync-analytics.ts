import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const propertyId = process.env.GA4_PROPERTY_ID || "559450385";
const keyPath = resolve(__dirname, "../../kitaristudios-firebase-adminsdk-privatekey.json");

const key = JSON.parse(readFileSync(keyPath, "utf8")) as {
  project_id: string;
  client_email: string;
  private_key: string;
};

const analyticsClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: key.client_email,
    private_key: key.private_key,
  },
  projectId: key.project_id,
});

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: key.project_id,
      clientEmail: key.client_email,
      privateKey: key.private_key,
    }),
    projectId: key.project_id,
  });

const db = getFirestore(app);

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return "0s";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

async function run() {
  console.log(`Connecting to GA4 Property ID: ${propertyId}...`);

  // 1. Overall stats (Last 28 days)
  const [overview] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    metrics: [
      { name: "activeUsers" },
      { name: "screenPageViews" },
      { name: "userEngagementDuration" },
    ],
  });

  const row = overview.rows?.[0];
  const activeVisitors = Number(row?.metricValues?.[0]?.value ?? 0);
  const pageViews = Number(row?.metricValues?.[1]?.value ?? 0);
  const totalEngagement = Number(row?.metricValues?.[2]?.value ?? 0);
  const avgEngagementSec = activeVisitors > 0 ? totalEngagement / activeVisitors : 0;

  console.log(`Active visitors: ${activeVisitors}`);
  console.log(`Page views: ${pageViews}`);
  console.log(`Avg engagement: ${formatDuration(avgEngagementSec)}`);

  // 2. Top pages breakdown
  const [pagesReport] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [
      { name: "activeUsers" },
      { name: "screenPageViews" },
      { name: "userEngagementDuration" },
    ],
    orderBys: [
      {
        metric: { metricName: "screenPageViews" },
        desc: true,
      },
    ],
    limit: 20,
  });

  const pages = (pagesReport.rows ?? []).map((pRow) => {
    const path = pRow.dimensionValues?.[0]?.value ?? "/";
    const visitors = Number(pRow.metricValues?.[0]?.value ?? 0);
    const views = Number(pRow.metricValues?.[1]?.value ?? 0);
    const engSec = Number(pRow.metricValues?.[2]?.value ?? 0);
    const avgSec = visitors > 0 ? engSec / visitors : 0;
    return {
      path,
      visitors,
      pageViews: views,
      avgEngagement: formatDuration(avgSec),
    };
  });

  console.log(`Found ${pages.length} page paths.`);

  // 3. Country breakdown (optional bonus info)
  const [countryReport] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "country" }],
    metrics: [{ name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit: 10,
  });

  const countries = (countryReport.rows ?? []).map((cRow) => ({
    country: cRow.dimensionValues?.[0]?.value ?? "Unknown",
    users: Number(cRow.metricValues?.[0]?.value ?? 0),
  }));

  const payload = {
    connected: true,
    propertyId,
    activeVisitors,
    pageViews,
    avgEngagement: formatDuration(avgEngagementSec),
    pages,
    countries,
    updatedAt: new Date().toISOString(),
  };

  console.log("Saving to Firestore siteSettings/analytics...");
  await db.collection("siteSettings").doc("analytics").set(payload, { merge: true });
  console.log("Successfully synced analytics data to Firestore!");
}

run().catch((err) => {
  console.error("Error syncing GA4 analytics:", err);
  process.exit(1);
});
