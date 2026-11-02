"use client";

import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import {
  collectionLabels,
  managedCollections,
  type ManagedCollection,
  type ManagedRecord,
} from "@/lib/firebase/admin-data";
import { Icon, StatusPill, type IconName } from "./admin-ui";

export type DashboardData = {
  months: string[];
  enquiries: number[];
  followUps: number[];
  uncontacted: Array<{
    id: string;
    name: string;
    city: string;
    country: string;
    locationId: string;
    contacted: boolean;
    channel: "Email" | "WhatsApp" | "Manual";
  }>;
  uncontactedTotal: number;
  recentLeads: ManagedRecord[];
};

export const emptyDashboard: DashboardData = {
  months: [],
  enquiries: [],
  followUps: [],
  uncontacted: [],
  uncontactedTotal: 0,
  recentLeads: [],
};

export type DashboardTarget = {
  section: "leads" | ManagedCollection | "prospects" | "newsletter" | "analytics";
  leadFilter?: "all" | "New" | "Contacted" | "Won";
  contentFilter?: "all" | "published" | "draft";
  lead?: ManagedRecord;
  prospectId?: string;
};

type Props = {
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  counts: Record<ManagedCollection, { total: number; published: number }>;
  stats: { leads: number; newLeads: number; subscribers: number };
  pipeline: { New: number; Contacted: number; Won: number };
  data: DashboardData;
  taskFilter: "all" | "action";
  onTaskFilter: (filter: "all" | "action") => void;
  tasksOpen: boolean;
  onToggleTasks: () => void;
  chartIndex: number | null;
  onChartIndex: (index: number) => void;
  onNavigate: (target: DashboardTarget) => void;
};

const collectionColors: Record<ManagedCollection, string> = {
  projects: "#7a1fd1",
  services: "#ff4d5a",
  catalogue: "#1eb0ff",
  testimonials: "#1db35b",
  faqs: "#f6b73c",
};

const leadColors = { New: "#ff8a1f", Contacted: "#1e8cf0", Won: "#1db35b" };
const avatarColors = ["#f9c5e6", "#bfe6d4", "#ffd9b0"];

function asText(value: unknown) {
  return value == null ? "" : String(value);
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export function OverviewDashboard({
  loading,
  failed,
  onRetry,
  counts,
  stats,
  pipeline,
  data,
  taskFilter,
  onTaskFilter,
  tasksOpen,
  onToggleTasks,
  chartIndex,
  onChartIndex,
  onNavigate,
}: Props) {
  const draftTotal = managedCollections.reduce(
    (sum, key) => sum + counts[key].total - counts[key].published,
    0,
  );
  const draftBreakdown = managedCollections
    .filter((key) => counts[key].total > counts[key].published)
    .map((key) => ({
      collection: key,
      count: counts[key].total - counts[key].published,
    }));
  const tasks: Array<{
    key: string;
    icon: IconName;
    count: number;
    label: string;
    hint: string;
    color: string;
    target: DashboardTarget;
  }> = [
    {
      key: "leads",
      icon: "leads",
      count: stats.newLeads,
      label: "enquiry baru",
      hint: "Balas calon klien dan perbarui statusnya.",
      color: "#ff8a3d",
      target: { section: "leads", leadFilter: "New" },
    },
    {
      key: "drafts",
      icon: "work",
      count: draftTotal,
      label: "draft menunggu publish",
      hint: draftBreakdown.length
        ? `Tinjau draft di ${draftBreakdown.map(({ collection }) => collectionLabels[collection]).join(", ")}.`
        : "Tidak ada draft yang menunggu ditinjau.",
      color: "#2a8bf2",
      target: { section: "projects", contentFilter: "draft" },
    },
    {
      key: "prospects",
      icon: "prospects",
      count: data.uncontactedTotal,
      label: "prospek belum dihubungi",
      hint: "Mulai follow-up dari daftar kota.",
      color: "#e0489b",
      target: { section: "prospects" },
    },
  ];
  const visibleTasks =
    taskFilter === "all" ? tasks : tasks.filter((task) => task.count > 0);
  const actionableCount = tasks.reduce((total, task) => total + task.count, 0);

  const leadParts = (["New", "Contacted", "Won"] as const).map((status) => ({
    label: status,
    value: pipeline[status],
    color: leadColors[status],
  }));

  return (
    <section className="admin-dg">
      <section className="admin-panel admin-dg-t" aria-labelledby="dash-tasks">
        <div className="admin-panel-heading">
          <h2 id="dash-tasks">Perlu tindakan</h2>
          <span className="admin-task-total">{actionableCount} item</span>
        </div>
        <div className="admin-task-pills">
          {(
            [
              ["all", "Semua"],
              ["action", "Perlu aksi"],
            ] as const
          ).map(([value, label]) => (
            <button
              aria-pressed={taskFilter === value}
              className={`admin-pill ${taskFilter === value ? "on" : ""}`}
              key={value}
              onClick={() => onTaskFilter(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <button
          aria-expanded={tasksOpen}
          className="admin-task-summary"
          onClick={onToggleTasks}
          type="button"
        >
          <i>{actionableCount}</i>
          Item perlu ditindaklanjuti
          <span style={{ transform: `rotate(${tasksOpen ? 180 : 0}deg)` }}>
            <Icon name="chev" size={20} />
          </span>
        </button>
        {failed ? (
          <div className="admin-dashboard-state" role="alert">
            <p>Ringkasan belum dapat dimuat. Periksa koneksi lalu coba lagi.</p>
            <button className="admin-button" onClick={onRetry} type="button">
              Coba lagi
            </button>
          </div>
        ) : loading ? (
          <p className="admin-muted" role="status">
            Memuat ringkasan dashboard…
          </p>
        ) : (
          tasksOpen &&
          (visibleTasks.length ? (
            visibleTasks.map((task) => (
              <button
                className="admin-task"
                key={task.key}
                onClick={() => onNavigate(task.target)}
                style={{ "--c": task.color } as CSSProperties}
                type="button"
              >
                <Icon name={task.icon} size={34} />
                <b>
                  {task.count} {task.label}
                </b>
                <span>{task.hint}</span>
                <span className="admin-task-check" aria-hidden="true">
                  <Icon name="check" size={30} />
                </span>
              </button>
            ))
          ) : (
            <p className="admin-muted">Tidak ada yang mendesak. Semua beres.</p>
          ))
        )}
      </section>

      <section className="admin-panel admin-dg-d" aria-labelledby="dash-leads">
        <div className="admin-panel-heading">
          <h2 id="dash-leads">Ringkasan enquiry</h2>
          <button
            aria-label="Buka Leads"
            className="admin-round-button"
            onClick={() => onNavigate({ section: "leads" })}
            type="button"
          >
            <Icon name="arrow" size={20} />
          </button>
        </div>
        <Donut parts={leadParts} total={stats.leads} />
        <div className="admin-legend">
          {leadParts.map((part) => (
            <span key={part.label}>
              <i style={{ background: part.color }} />
              {part.label}: {part.value}
            </span>
          ))}
        </div>
      </section>

      <section className="admin-panel admin-dg-c" aria-labelledby="dash-trend">
        <div className="admin-panel-heading">
          <h2 id="dash-trend">Enquiry dan follow-up · 6 bulan</h2>
          <button
            aria-label="Buka Analytics"
            className="admin-round-button"
            onClick={() => onNavigate({ section: "analytics" })}
            type="button"
          >
            <Icon name="arrow" size={20} />
          </button>
        </div>
        {failed ? (
          <p className="admin-muted">
            Data tren tidak tersedia. Coba muat ulang dashboard.
          </p>
        ) : loading ? (
          <p className="admin-muted" role="status">
            Memuat grafik…
          </p>
        ) : data.months.length === 6 ? (
          <TrendChart
            followUps={data.followUps}
            enquiries={data.enquiries}
            index={chartIndex ?? 5}
            months={data.months}
            onIndex={onChartIndex}
          />
        ) : (
          <p className="admin-muted">Belum ada data untuk enam bulan terakhir.</p>
        )}
      </section>

      <section className="admin-panel admin-dg-b" aria-labelledby="dash-content">
        <div className="admin-panel-heading">
          <h2 id="dash-content">Ringkasan konten</h2>
          <button
            aria-label="Buka Our Work"
            className="admin-round-button"
            onClick={() => onNavigate({ section: "projects" })}
            type="button"
          >
            <Icon name="filter" size={20} />
          </button>
        </div>
        {managedCollections.map((key) => {
          const { total, published } = counts[key];
          return (
            <div key={key}>
              <div className="admin-bar-label">
                <span>{collectionLabels[key]}</span>
                <span>
                  {total} item · {published} tayang · {total - published} draft
                </span>
              </div>
              <div
                aria-label={`${collectionLabels[key]}: ${total} item, ${published} tayang, ${total - published} draft`}
                className="admin-bar-track"
                role="img"
              >
                <i
                  style={{
                    width: `${(published / Math.max(1, total)) * 100}%`,
                    backgroundColor: collectionColors[key],
                  }}
                />
              </div>
            </div>
          );
        })}
      </section>

      <section className="admin-panel admin-dg-r" aria-labelledby="dash-followup">
        <div className="admin-dg-r-col">
          <div className="admin-panel-heading">
            <h2 id="dash-followup">Follow-up</h2>
            <button
              aria-label="Buka Prospects"
              className="admin-round-button"
              onClick={() => onNavigate({ section: "prospects" })}
              type="button"
            >
              <Icon name="cal" size={18} />
            </button>
          </div>
          {data.uncontacted.length ? (
            data.uncontacted.map((item) => (
              <button
                className="admin-followup"
                key={item.id}
                onClick={() => onNavigate({ section: "prospects", prospectId: item.id })}
                type="button"
              >
                <small>Follow-up</small>
                <b>{item.name}</b>
                <b>{item.city}</b>
                <em>
                  <Icon
                    name={
                      item.channel === "Email"
                        ? "leads"
                        : item.channel === "WhatsApp"
                          ? "testimonials"
                          : "prospects"
                    }
                    size={16}
                  />
                  {item.channel}
                </em>
                <span className="admin-followup-arrow" aria-hidden="true">
                  <Icon name="arrow" size={16} />
                </span>
              </button>
            ))
          ) : (
            <p className="admin-muted">Semua prospek sudah dihubungi.</p>
          )}
          <button
            className="admin-link-button"
            onClick={() => onNavigate({ section: "prospects" })}
            type="button"
          >
            Lihat semua prospek ›
          </button>
        </div>

        <div className="admin-dg-r-col">
          <div className="admin-panel-heading">
            <h2>Enquiry terbaru</h2>
            <button
              aria-label="Buka Leads"
              className="admin-round-button"
              onClick={() => onNavigate({ section: "leads" })}
              type="button"
            >
              <Icon name="filter" size={18} />
            </button>
          </div>
          {data.recentLeads.length ? (
            data.recentLeads.map((lead, index) => (
              <article className="admin-enquiry" key={lead.id}>
                <span
                  className="admin-avatar"
                  style={{ background: avatarColors[index % avatarColors.length] }}
                >
                  {initials(asText(lead.name))}
                </span>
                <div>
                  <b>{asText(lead.name)}</b> <StatusPill status={asText(lead.status)} />
                  <p>{asText(lead.message)}</p>
                  <button
                    className="admin-enquiry-check"
                    onClick={() => onNavigate({ section: "leads", lead })}
                    type="button"
                  >
                    Buka enquiry ›
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="admin-muted">Belum ada enquiry.</p>
          )}
        </div>
      </section>
    </section>
  );
}

function Donut({
  parts,
  total,
}: {
  parts: Array<{ label: string; value: number; color: string }>;
  total: number;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const circles = parts.map((part, index) => {
    const length = total ? (part.value / total) * circumference : 0;
    const offset = parts
      .slice(0, index)
      .reduce(
        (sum, previous) => sum + (total ? (previous.value / total) * circumference : 0),
        0,
      );
    return { part, length, offset };
  });
  return (
    <svg
      aria-label={`Total ${total} enquiry: ${parts.map((part) => `${part.label} ${part.value}`).join(", ")}`}
      className="admin-donut"
      role="img"
      viewBox="0 0 140 140"
    >
      <circle
        cx="70"
        cy="70"
        fill="none"
        r={radius}
        stroke="var(--tr)"
        strokeWidth="20"
      />
      {circles.map(({ part, length, offset }) => (
        <circle
          cx="70"
          cy="70"
          fill="none"
          key={part.label}
          r={radius}
          stroke={part.color}
          strokeDasharray={`${length} ${circumference - length}`}
          strokeDashoffset={-offset}
          strokeWidth="20"
          transform="rotate(-90 70 70)"
        />
      ))}
    </svg>
  );
}

const CHART_W = 440;
const CHART_H = 230;
const CHART_PAD = 24;
const CHART_BASE = CHART_H - 36;

function TrendChart({
  months,
  enquiries,
  followUps,
  index,
  onIndex,
}: {
  months: string[];
  enquiries: number[];
  followUps: number[];
  index: number;
  onIndex: (index: number) => void;
}) {
  const max = Math.max(1, ...enquiries, ...followUps) * 1.15;
  const x = (position: number) =>
    CHART_PAD + (position * (CHART_W - CHART_PAD * 2)) / (months.length - 1);
  const y = (value: number) => CHART_BASE - (value / max) * (CHART_H - 70);
  const curve = (values: number[]) =>
    values
      .map((value, position) =>
        position
          ? `C${(x(position - 1) + x(position)) / 2} ${y(values[position - 1])} ${(x(position - 1) + x(position)) / 2} ${y(value)} ${x(position)} ${y(value)}`
          : `M${x(0)} ${y(value)}`,
      )
      .join("");
  const series = [
    { id: "enquiry", values: enquiries, color: "#1e8cf0", label: "Enquiry" },
    { id: "followup", values: followUps, color: "#ff8a1f", label: "Follow-up" },
  ];
  const last = months.length - 1;
  const clampIndex = (value: number) => Math.max(0, Math.min(last, value));
  const cursorX = x(index);
  const tipLeft = Math.min(78, Math.max(22, (cursorX / CHART_W) * 100));

  function pick(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = ((event.clientX - rect.left) / rect.width) * CHART_W;
    onIndex(
      clampIndex(Math.round((position - CHART_PAD) / ((CHART_W - CHART_PAD * 2) / last))),
    );
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onIndex(clampIndex(index - 1));
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onIndex(clampIndex(index + 1));
    }
  }

  return (
    <div
      aria-label={`Enquiry dan follow-up ${months[0]} sampai ${months[last]}. Gunakan panah kiri dan kanan untuk melihat angka tiap bulan.`}
      className="admin-trend"
      onKeyDown={onKeyDown}
      onPointerDown={pick}
      onPointerMove={pick}
      role="group"
      tabIndex={0}
    >
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        <defs>
          {series.map((item) => (
            <linearGradient
              id={`admin-trend-${item.id}`}
              key={item.id}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="0" stopColor={item.color} stopOpacity=".25" />
              <stop offset="1" stopColor={item.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {series.map((item) => (
          <g key={item.id}>
            <path
              d={`${curve(item.values)}L${x(last)} ${CHART_BASE}L${x(0)} ${CHART_BASE}Z`}
              fill={`url(#admin-trend-${item.id})`}
            />
            <path
              d={curve(item.values)}
              fill="none"
              stroke={item.color}
              strokeWidth="2"
            />
          </g>
        ))}
        <line
          stroke="currentColor"
          strokeDasharray="3 3"
          strokeOpacity=".4"
          x1={cursorX}
          x2={cursorX}
          y1="60"
          y2={CHART_BASE}
        />
        {series.map((item) => (
          <circle
            cx={cursorX}
            cy={y(item.values[index])}
            fill="var(--sol)"
            key={item.id}
            r="5"
            stroke={item.color}
            strokeWidth="2"
          />
        ))}
        {months.map((month, position) => (
          <text
            fill="currentColor"
            fontSize="12"
            key={`${month}-${position}`}
            opacity=".55"
            textAnchor="middle"
            x={x(position)}
            y={CHART_H - 10}
          >
            {month}
          </text>
        ))}
      </svg>
      <div className="admin-trend-tip" style={{ left: `${tipLeft}%` }} aria-live="polite">
        {series.map((item) => (
          <span key={item.id}>
            <i style={{ background: item.color }} />
            {item.label}: {item.values[index]}
          </span>
        ))}
      </div>
    </div>
  );
}
