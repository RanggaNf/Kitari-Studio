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
      { name: "sessions" },
      { name: "userEngagementDuration" },
    ],
  });

  const row = overview.rows?.[0];
  const activeVisitors = Number(row?.metricValues?.[0]?.value ?? 0);
  const pageViews = Number(row?.metricValues?.[1]?.value ?? 0);
  const sessions = Number(row?.metricValues?.[2]?.value ?? 0);
  const totalEngagement = Number(row?.metricValues?.[3]?.value ?? 0);
  const avgEngagementSec = activeVisitors > 0 ? totalEngagement / activeVisitors : 0;

  console.log(`Active visitors (28d): ${activeVisitors}`);
  console.log(`Page views (28d): ${pageViews}`);
  console.log(`Sessions (28d): ${sessions}`);
  console.log(`Avg engagement: ${formatDuration(avgEngagementSec)}`);

  // 2. Daily trend (last 28 days)
  const [trendReport] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  const dailyTrend = (trendReport.rows ?? []).map((tRow) => ({
    date: tRow.dimensionValues?.[0]?.value ?? "",
    users: Number(tRow.metricValues?.[0]?.value ?? 0),
    views: Number(tRow.metricValues?.[1]?.value ?? 0),
  }));

  // 3. Top pages breakdown (with pageTitle)
  const [pagesReport] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
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
    const title = pRow.dimensionValues?.[1]?.value ?? path;
    const visitors = Number(pRow.metricValues?.[0]?.value ?? 0);
    const views = Number(pRow.metricValues?.[1]?.value ?? 0);
    const engSec = Number(pRow.metricValues?.[2]?.value ?? 0);
    const avgSec = visitors > 0 ? engSec / visitors : 0;
    return {
      path,
      title,
      visitors,
      pageViews: views,
      avgEngagement: formatDuration(avgSec),
    };
  });

  // 4. Country breakdown (with country and countryId)
  const [countryReport] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "country" }, { name: "countryId" }],
    metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit: 25,
  });

  const countries = (countryReport.rows ?? []).map((cRow) => ({
    country: cRow.dimensionValues?.[0]?.value ?? "Unknown",
    countryId: (cRow.dimensionValues?.[1]?.value ?? "").toUpperCase(),
    users: Number(cRow.metricValues?.[0]?.value ?? 0),
    views: Number(cRow.metricValues?.[1]?.value ?? 0),
  }));

  console.log("Top countries:", countries.slice(0, 5));

  // 5. Acquisition Channels (Traffic Sources)
  const [channelReport] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }, { name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  });

  const channels = (channelReport.rows ?? []).map((chRow) => ({
    channel: chRow.dimensionValues?.[0]?.value ?? "Direct",
    sessions: Number(chRow.metricValues?.[0]?.value ?? 0),
    users: Number(chRow.metricValues?.[1]?.value ?? 0),
  }));

  console.log("Traffic channels:", channels);

  // 6. Device Categories (Desktop, Mobile, Tablet)
  const [deviceReport] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "deviceCategory" }],
    metrics: [{ name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
  });

  const devices = (deviceReport.rows ?? []).map((dRow) => ({
    category: dRow.dimensionValues?.[0]?.value ?? "desktop",
    users: Number(dRow.metricValues?.[0]?.value ?? 0),
  }));

  console.log("Devices:", devices);

  const payload = {
    connected: true,
    propertyId,
    activeVisitors,
    pageViews,
    sessions,
    avgEngagement: formatDuration(avgEngagementSec),
    dailyTrend,
    pages,
    countries,
    channels,
    devices,
    updatedAt: new Date().toISOString(),
  };

  console.log("Saving expanded GA4 analytics to Firestore siteSettings/analytics...");
  await db.collection("siteSettings").doc("analytics").set(payload, { merge: true });
  console.log("Successfully synced comprehensive GA4 data to Firestore!");
}

run().catch((err) => {
  console.error("Error syncing expanded GA4 analytics:", err);
  process.exit(1);
});
