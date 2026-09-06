var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
var getAiInstance = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};
var terminalSensorTool = {
  name: "read_terminal_sensors",
  description: "Reads live sensor telemetry from the local VSAT terminal hardware. Returns SNR, power levels, temperature, and packet stats.",
  parameters: {
    type: import_genai.Type.OBJECT,
    properties: {
      status: { type: import_genai.Type.STRING, description: "Current hardware status" }
    }
  }
};
app.post("/api/gemini/action", async (req, res) => {
  try {
    const ai = getAiInstance();
    const { action, payload } = req.body;
    if (action === "getTroubleshootingAdvice") {
      const { issue, context, telemetry, options } = payload;
      const modelId = options.thinking ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";
      const systemInstruction = `
              You are the 'SatExpert Tactical Intelligence Agent' (STIA).
              MISSION: Provide high-level technical SatCom intelligence and cyber defense maneuvers.

              ENVIRONMENT:
              - LAT: ${context?.lat ?? "N/A"}, LNG: ${context?.lng ?? "N/A"}
              - TARGET_ASSET: ${context?.satName ?? "N/A"}
              - DEFCON: ${context?.defcon ?? 5}
              - EW_JAMMING: ${context?.isJamming ? "YES" : "NO"}
              - STEALTH_PROTOCOL: ${context?.isStealthMode ? "ACTIVE" : "INACTIVE"}

              INSTRUCTIONS:
              - If thinking mode is active, provide deep technical reasoning for VSAT infrastructure.
              - If search/maps are enabled, ground your response in the latest satellite launches and security CVEs.
              - NEVER pass raw coordinates (latitude, longitude) as a text 'query' to search or maps tools. Use descriptive location names instead.
              - Rely on the automatically provided ENVIRONMENT context (LAT/LNG) for location-aware grounding.
              - ALWAYS return helpful metadata if grounding chunks are present.

              TONE: Clinical, authoritative, military-grade. Use tactical jargon (e.g., 'EIRP saturation', 'FEC degradation').
            `;
      const tools = [];
      if (options.useSearch) tools.push({ googleSearch: {} });
      tools.push({ functionDeclarations: [terminalSensorTool] });
      const parts = [{ text: "STIA_COMMAND: " + issue }];
      if (options.mediaData) {
        options.mediaData.forEach((m) => {
          parts.push({ inlineData: m });
        });
      }
      const contents = [{ role: "user", parts }];
      const config = {
        systemInstruction,
        tools: tools.length > 0 ? tools : void 0
      };
      if (options.thinking) {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }
      if (options.useMaps && context?.lat) {
        config.toolConfig = {
          includeServerSideToolInvocations: true,
          retrievalConfig: {
            latLng: { latitude: context.lat, longitude: context.lng }
          }
        };
      } else if (options.useSearch) {
        config.toolConfig = {
          includeServerSideToolInvocations: true
        };
      }
      let response;
      try {
        response = await ai.models.generateContent({ model: modelId, contents, config });
      } catch (toolError) {
        if (toolError.message?.includes("PERMISSION_DENIED") && (options.useSearch || options.useMaps)) {
          const fallbackConfig = { ...config, tools: void 0, toolConfig: void 0 };
          response = await ai.models.generateContent({ model: modelId, contents, config: fallbackConfig });
        } else {
          throw toolError;
        }
      }
      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (call.name === "read_terminal_sensors") {
          contents.push(response.candidates[0].content);
          contents.push({
            role: "tool",
            parts: [{
              functionResponse: {
                name: "read_terminal_sensors",
                response: { result: telemetry }
              }
            }]
          });
          response = await ai.models.generateContent({ model: modelId, contents, config });
        }
      }
      return res.json({ text: response.text || "", grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] });
    } else if (action === "generateTacticalImage") {
      const { prompt, aspectRatio, size } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts: [{ text: `High-fidelity tactical satellite visualization: ${prompt}. Professional technical military style.` }] },
        config: { imageConfig: { aspectRatio, imageSize: size } }
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return res.json({ result: `data:image/png;base64,${part.inlineData.data}` });
      }
      return res.json({ result: null });
    } else if (action === "editTacticalImage") {
      const { base64Image, prompt } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            { inlineData: { data: base64Image.split(",")[1], mimeType: "image/png" } },
            { text: `Apply tactical overlay: ${prompt}. Maintain technical accuracy.` }
          ]
        }
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return res.json({ result: `data:image/png;base64,${part.inlineData.data}` });
      }
      return res.json({ result: null });
    } else if (action === "generateTacticalVideo") {
      const { prompt, orientation, startImage } = payload;
      let operation = await ai.models.generateVideos({
        model: "veo-3.1-lite-generate-preview",
        prompt: `Cinematic tactical satellite mission sequence: ${prompt}`,
        image: startImage ? { imageBytes: startImage.split(",")[1], mimeType: "image/png" } : void 0,
        config: { numberOfVideos: 1, resolution: "1080p", aspectRatio: orientation }
      });
      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        operation = await ai.operations.getVideosOperation({ operation });
      }
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      return res.json({ result: downloadLink });
    } else if (action === "transcribeAudio") {
      const { base64Audio } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: base64Audio, mimeType: "audio/pcm;rate=16000" } },
            { text: "Transcribe the tactical comms precisely." }
          ]
        }
      });
      return res.json({ result: response.text });
    } else if (action === "getWarGamesTurn") {
      const { history, objective } = payload;
      const systemInstruction = `
              You are a 'War Games Cyber-Orchestrator'. Simulate turns in a conflict for a SatCom link.
              - RED: Targeted Strike Team.
              - BLUE: Network Hardening Team.
              Respond strictly in the JSON schema requested.
            `;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: `SIM_HISTORY: ${JSON.stringify(history)}. OBJECTIVE: ${objective}` }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              redTeamAction: { type: import_genai.Type.OBJECT, properties: { action: { type: import_genai.Type.STRING }, rationale: { type: import_genai.Type.STRING } }, required: ["action", "rationale"] },
              blueTeamAction: { type: import_genai.Type.OBJECT, properties: { action: { type: import_genai.Type.STRING }, rationale: { type: import_genai.Type.STRING } }, required: ["action", "rationale"] },
              systemStateChange: { type: import_genai.Type.OBJECT, properties: { narrative: { type: import_genai.Type.STRING }, link_integrity_delta: { type: import_genai.Type.NUMBER }, threat_level: { type: import_genai.Type.STRING } }, required: ["narrative", "link_integrity_delta", "threat_level"] },
              isObjectiveMet: { type: import_genai.Type.BOOLEAN }
            },
            required: ["redTeamAction", "blueTeamAction", "systemStateChange", "isObjectiveMet"]
          }
        }
      });
      return res.json({ result: JSON.parse(response.text?.trim() || "{}") });
    } else if (action === "generateWarGamesReport") {
      const { history, objective } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ role: "user", parts: [{ text: `Final Combat Log: ${JSON.stringify(history)}` }] }],
        config: { systemInstruction: "Generate a professional Post-Action Report (AAR) for this SatCom cyber engagement simulation." }
      });
      return res.json({ result: response.text });
    } else if (action === "generateSatelliteSitrep") {
      const { satellite, defcon } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: `Generate a 3-sentence tactical SITREP for satellite ${satellite.name} (${satellite.operator}). Telemetry: Apogee=${satellite.apogee}km, Velocity=${satellite.velocity}km/s, Status=${satellite.status}. DEFCON=${defcon}.` }] }],
        config: { systemInstruction: "You are a Senior Intelligence Officer. Provide a concise, clinical, military-grade mission report. Focus on operational readiness and orbital stability." }
      });
      return res.json({ result: response.text });
    } else if (action === "generateWeatherImpactAssessment") {
      const { weather, loc, satName } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: `Analyze impact of ${weather} weather at LAT:${loc.lat}, LNG:${loc.lng} for communication with ${satName}. Provide specific Ka/Ku band rain fade estimates and mission readiness status.` }] }],
        config: { systemInstruction: "You are a SatCom Meteorology Specialist. Provide a tactical atmospheric impact report. Use dB loss figures and specific signal degradation terminology." }
      });
      return res.json({ result: response.text });
    } else if (action === "analyzeInterceptedSignal") {
      const { params } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: "Analyze Intercept: " + JSON.stringify(params) }] }],
        config: {
          systemInstruction: "You are a SIGINT analyst. Provide a tactical assessment of the radio signal provided.",
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              probableOrigin: { type: import_genai.Type.STRING },
              suspectedPurpose: { type: import_genai.Type.STRING },
              threatLevel: { type: import_genai.Type.STRING },
              encryptionType: { type: import_genai.Type.STRING },
              suggestedKeyFragment: { type: import_genai.Type.STRING }
            },
            required: ["probableOrigin", "suspectedPurpose", "threatLevel", "encryptionType", "suggestedKeyFragment"]
          }
        }
      });
      return res.json({ result: JSON.parse(response.text?.trim() || "{}") });
    } else if (action === "generateDecryptedMessage") {
      const { analysis } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: "Decrypt payload based on analysis: " + JSON.stringify(analysis) }] }],
        config: { systemInstruction: "Generate a tactical decrypted text message based on the SIGINT analysis. Military tone." }
      });
      return res.json({ result: response.text });
    } else if (action === "analyzeIPRecon") {
      const { ip } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: `Perform STIA_IP_INTEL lookup for IP: ${ip}` }] }],
        config: {
          systemInstruction: "You are a Cyber-Intelligence Strategist. Analyze the provided IP address and provide clinical tactical intelligence. Include suspected geolocation (City, Country, Lat, Lng), ISP, and threat profile (e.g., 'VPN Exit Node', 'State-Actor Proxy').",
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              city: { type: import_genai.Type.STRING },
              country: { type: import_genai.Type.STRING },
              lat: { type: import_genai.Type.NUMBER },
              lng: { type: import_genai.Type.NUMBER },
              isp: { type: import_genai.Type.STRING },
              threatProfile: { type: import_genai.Type.STRING },
              riskScore: { type: import_genai.Type.NUMBER },
              recommendedAction: { type: import_genai.Type.STRING }
            },
            required: ["city", "country", "lat", "lng", "isp", "threatProfile", "riskScore", "recommendedAction"]
          }
        }
      });
      return res.json({ result: JSON.parse(response.text?.trim() || "{}") });
    } else if (action === "analyzePortScan") {
      const { target, ports } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: `Analyze STIA_PORT_SCAN for TARGET: ${target}. PORTS: ${JSON.stringify(ports)}` }] }],
        config: {
          systemInstruction: "You are a Senior Penetration Tester. Analyze the provided port scan results. Identify vulnerable services, suspect versions, and potential exploit vectors. Provide a risk assessment and recommended tactical hardening steps. TONE: High-level technical, clinical.",
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              summary: { type: import_genai.Type.STRING },
              riskLevel: { type: import_genai.Type.STRING },
              vulnerabilities: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
              suspectedOS: { type: import_genai.Type.STRING },
              tacticalAdvice: { type: import_genai.Type.STRING }
            },
            required: ["summary", "riskLevel", "vulnerabilities", "suspectedOS", "tacticalAdvice"]
          }
        }
      });
      return res.json({ result: JSON.parse(response.text?.trim() || "{}") });
    } else if (action === "analyzeSpoofingURL") {
      const { url, content } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: `Analyze suspicious URL for spoofing/phishing indicators. URL: ${url}. CONTENT_SNIPPET: ${content || "No content provided"}` }] }],
        config: {
          systemInstruction: "You are a Digital Forensics Analyst. Analyze the provided URL and content for spoofing, phishing, and domain hijacking indicators. Identify fraudulent patterns, impersonated brands, and potential malicious infrastructure. Provide a threat score (0-100) and actionable counter-intelligence. TONE: Tactical, forensic, clinical.",
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              impersonatedBrand: { type: import_genai.Type.STRING },
              threatScore: { type: import_genai.Type.NUMBER },
              redFlags: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
              forensicSummary: { type: import_genai.Type.STRING },
              originEstimation: { type: import_genai.Type.STRING },
              mitigationSteps: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } }
            },
            required: ["impersonatedBrand", "threatScore", "redFlags", "forensicSummary", "originEstimation", "mitigationSteps"]
          }
        }
      });
      return res.json({ result: JSON.parse(response.text?.trim() || "{}") });
    } else if (action === "chatWithAIAssistant") {
      const { prompt } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are Sentinel, an advanced tactical AI assistant integrated into the TSI_TACTICAL_BRIDGE cybersecurity platform. Provide concise, highly technical, and militaristic-sounding responses. Focus on cybersecurity, orbital mechanics, signal warfare, and mission logistics."
        }
      });
      return res.json({ result: response.text });
    } else if (action === "processLiveCommsAudio") {
      const { base64Audio } = payload;
      const response1 = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: base64Audio, mimeType: "audio/pcm;rate=16000" } },
            { text: "Transcribe precisely. If no speech is detected, return exactly 'NO_SPEECH_DETECTED'." }
          ]
        }
      });
      const transcription = response1.text?.trim() || "";
      if (transcription === "NO_SPEECH_DETECTED" || transcription === "") {
        return res.json({ result: { transcription: "", audioBase64: "", textReply: "" } });
      }
      const response2 = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Operator says: "${transcription}". Provide a brief, tactical voice response as STIA agent.`,
        config: {
          systemInstruction: "You are STIA. Respond in 1-2 sentences. Tone: Tactical, clinical.",
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } }
        }
      });
      let audioBase64 = "";
      let textReply = "";
      if (response2.candidates && response2.candidates[0].content) {
        for (const part of response2.candidates[0].content.parts) {
          if (part.inlineData) {
            audioBase64 = part.inlineData.data;
          }
          if (part.text) {
            textReply += part.text;
          }
        }
      }
      return res.json({
        result: {
          transcription,
          audioBase64,
          textReply
        }
      });
    } else {
      return res.status(400).json({ error: "Unknown action" });
    }
  } catch (error) {
    console.error("STIA_SERVER_ERROR", error);
    if (error.message?.includes("Requested entity was not found")) {
      return res.status(403).json({ error: "KEY_AUTH_FAILURE", message: "Advanced API Key required for this operation." });
    }
    res.status(500).json({ error: "GENERAL_API_ERROR", message: error.message || "UNKNOWN_ERROR" });
  }
});
async function startServer() {
  console.log(`Starting server in ${process.env.NODE_ENV || "development"} mode...`);
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    const fs = await import("fs");
    app.get("*all", async (req, res, next) => {
      if (req.url.startsWith("/api")) return next();
      const ext = import_path.default.extname(req.url);
      if (ext && ext !== ".html") return next();
      try {
        const indexPath = import_path.default.join(process.cwd(), "index.html");
        let html = fs.readFileSync(indexPath, "utf-8");
        html = await vite.transformIndexHtml(req.url, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
