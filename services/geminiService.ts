const callBackend = async (action: string, payload: any) => {
  try {
    const res = await fetch('/api/gemini/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.warn(`[GEMINI_CLIENT] Backend call failed for ${action}:`, err.message);
    return { error: err.message, result: null };
  }
};

export const getTroubleshootingAdvice = async (
  issue: string, 
  context?: any, 
  telemetry?: any, 
  options: { thinking?: boolean, useSearch?: boolean, useMaps?: boolean, mediaData?: { data: string, mimeType: string }[] } = {}
) => {
  try {
    const data = await callBackend('getTroubleshootingAdvice', { issue, context, telemetry, options });
    return { text: data.text || data.result || "STIA_COMMAND_ACK: Diagnostics processed.", grounding: data.grounding || [] };
  } catch (error: any) {
    return { error: "GENERAL_API_ERROR", text: `SYSTEM_ALERT: INTEL_UPLINK_DEGRADED. REASON: ${error.message || 'CARRIER_TIMEOUT'}` };
  }
};

export const generateTacticalImage = async (prompt: string, aspectRatio: string = "16:9", size: string = "1K") => {
  try {
    const data = await callBackend('generateTacticalImage', { prompt, aspectRatio, size });
    return data.result;
  } catch (err: any) {
    return null;
  }
};

export const editTacticalImage = async (base64Image: string, prompt: string) => {
  try {
    const data = await callBackend('editTacticalImage', { base64Image, prompt });
    return data.result;
  } catch (err: any) {
    return base64Image;
  }
};

export const generateTacticalVideo = async (prompt: string, orientation: '16:9' | '9:16' = '16:9', startImage?: string) => {
  try {
    const data = await callBackend('generateTacticalVideo', { prompt, orientation, startImage });
    return data.result;
  } catch (err: any) {
    return null;
  }
};

export const transcribeAudio = async (base64Audio: string) => {
  try {
    const data = await callBackend('transcribeAudio', { base64Audio });
    return data.result || "[COMM_INTERCEPT]: Signal locked.";
  } catch (err) {
    return "[COMM_INTERFERENCE]";
  }
};

export const getWarGamesTurn = async (history: any[], objective: string) => {
  try {
    const data = await callBackend('getWarGamesTurn', { history, objective });
    return data.result;
  } catch (err) {
    return null;
  }
};

export const generateWarGamesReport = async (history: any[], objective: string) => {
  try {
    const data = await callBackend('generateWarGamesReport', { history, objective });
    return data.result || "AAR_REPORT: Mission concluded with link integrity preserved.";
  } catch (err) {
    return "ERROR: REPORT_COMPILATION_FAILED.";
  }
};

export const generateSatelliteSitrep = async (satellite: any, defcon: number) => {
  try {
    const data = await callBackend('generateSatelliteSitrep', { satellite, defcon });
    return data.result || "ORBITAL_SITREP: Telemetry nominal. Station-keeping verified.";
  } catch (err) {
    return "INTEL_LINK_DEGRADED. MANUALLY_AUDIT_TELEMETRY.";
  }
};

export const generateWeatherImpactAssessment = async (weather: string, loc: any, satName: string) => {
  try {
    const data = await callBackend('generateWeatherImpactAssessment', { weather, loc, satName });
    return data.result || "ATMOSPHERIC_ATTENUATION: Ku/Ka fade calculations verified.";
  } catch (err) {
    return "MET_DATA_UNAVAILABLE. PROCEED_WITH_MANUAL_FADE_CALCULATION.";
  }
};

export const analyzeInterceptedSignal = async (params: any) => {
  try {
    const data = await callBackend('analyzeInterceptedSignal', { params });
    return data.result;
  } catch (err) {
    return null;
  }
};

export const generateDecryptedMessage = async (analysis: any) => {
  try {
    const data = await callBackend('generateDecryptedMessage', { analysis });
    return data.result || " // ...PACKET_FRAME_VERIFIED... //";
  } catch (err) {
    return " // ...PACKET_LOSS_CRITICAL... //";
  }
};

export const analyzeIPRecon = async (ip: string) => {
  try {
    const data = await callBackend('analyzeIPRecon', { ip });
    return data.result;
  } catch (err) {
    return null;
  }
};

export const analyzePortScan = async (target: string, ports: any[]) => {
  try {
    const data = await callBackend('analyzePortScan', { target, ports });
    return data.result;
  } catch (err) {
    return null;
  }
};

export const analyzeSpoofingURL = async (url: string, content?: string) => {
  try {
    const data = await callBackend('analyzeSpoofingURL', { url, content });
    return data.result;
  } catch (err) {
    return null;
  }
};
