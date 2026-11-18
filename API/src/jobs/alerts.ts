import dotenv from "dotenv";

dotenv.config();

type AlertApplication = {
  name: string;
  url: string;
  teamslink: string;
  email: string;
};

type IncidentAlert = {
  downAt: Date;
  responseTime: number | null;
  statusCode: number | null;
};

export const sendTeamAlert = async (
  application: AlertApplication,
  incident: IncidentAlert,
) => {
  if (!application.teamslink) {
    console.warn(`No Teams workflow URL configured for ${application.name}`);
    return;
  }

  const response = await fetch(application.teamslink, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        message: `🔴 Service DOWN: ${application.name}\nURL: ${application.url}\nSince: ${incident.downAt.toISOString()}\nStatus code: ${incident.statusCode ?? "unavailable"}`,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Teams alert failed with HTTP ${response.status}`);
  }
};
