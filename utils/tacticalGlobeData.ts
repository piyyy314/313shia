// Tactical GeoJSON and Signal Interception Hotspots for D3 Tactical Globe

export interface InterceptionHotspot {
  id: string;
  name: string;
  designation: string;
  lat: number;
  lng: number;
  signalType: string;
  frequency: number; // GHz
  bandwidth: number; // MHz
  snr: number; // dB
  threatLevel: 'NOMINAL' | 'GUARDED' | 'ELEVATED' | 'SEVERE';
  status: 'ACTIVE_INTERCEPT' | 'DECRYPTING' | 'TRACKED' | 'JAMMED';
  encryption: string;
  origin: string;
  pulseRate: number; // Hz
  description: string;
  payloadFragment?: string;
}

export interface FrequencyBandInfo {
  band: string;
  nominalRange: string;
  formattedFreq: string;
  channelClass: string;
  color: string;
}

export function getFrequencyBandDetails(freq: number): FrequencyBandInfo {
  if (freq > 100) {
    return {
      band: 'VHF Maritime Band',
      nominalRange: '30 – 300 MHz',
      formattedFreq: `${freq.toFixed(3)} MHz`,
      channelClass: 'VHF Tactical / Marine AIS',
      color: 'text-sky-400'
    };
  }
  if (freq < 0.3) {
    return {
      band: 'VHF / Low UHF Band',
      nominalRange: '< 300 MHz',
      formattedFreq: `${(freq * 1000).toFixed(1)} MHz (${freq.toFixed(3)} GHz)`,
      channelClass: 'Tactical Line-of-Sight Ground Relay',
      color: 'text-indigo-400'
    };
  }
  if (freq < 1.0) {
    return {
      band: 'UHF Tactical Band',
      nominalRange: '300 MHz – 1.0 GHz',
      formattedFreq: `${(freq * 1000).toFixed(1)} MHz (${freq.toFixed(3)} GHz)`,
      channelClass: 'Tactical Data Link / Early Warning',
      color: 'text-blue-400'
    };
  }
  if (freq < 2.0) {
    return {
      band: 'L-Band',
      nominalRange: '1.0 – 2.0 GHz',
      formattedFreq: `${freq.toFixed(3)} GHz`,
      channelClass: 'Mobile SATCOM / Fleet Tracking',
      color: 'text-cyan-400'
    };
  }
  if (freq < 4.0) {
    return {
      band: 'S-Band',
      nominalRange: '2.0 – 4.0 GHz',
      formattedFreq: `${freq.toFixed(3)} GHz`,
      channelClass: 'Space TT&C / Booster Telemetry',
      color: 'text-teal-400'
    };
  }
  if (freq < 8.0) {
    return {
      band: 'C-Band',
      nominalRange: '4.0 – 8.0 GHz',
      formattedFreq: `${freq.toFixed(3)} GHz`,
      channelClass: 'Commercial Fixed SATCOM',
      color: 'text-emerald-400'
    };
  }
  if (freq < 12.0) {
    return {
      band: 'X-Band',
      nominalRange: '8.0 – 12.0 GHz',
      formattedFreq: `${freq.toFixed(3)} GHz`,
      channelClass: 'Military Strategic SATCOM / SAR Radar',
      color: 'text-amber-400'
    };
  }
  if (freq < 18.0) {
    return {
      band: 'Ku-Band',
      nominalRange: '12.0 – 18.0 GHz',
      formattedFreq: `${freq.toFixed(3)} GHz`,
      channelClass: 'Direct Broadcast / High-Speed Uplink',
      color: 'text-yellow-400'
    };
  }
  if (freq < 27.0) {
    return {
      band: 'K-Band',
      nominalRange: '18.0 – 27.0 GHz',
      formattedFreq: `${freq.toFixed(3)} GHz`,
      channelClass: 'High-Throughput Fixed Microwave',
      color: 'text-orange-400'
    };
  }
  if (freq < 40.0) {
    return {
      band: 'Ka-Band / Mil-Ka',
      nominalRange: '27.0 – 40.0 GHz',
      formattedFreq: `${freq.toFixed(3)} GHz`,
      channelClass: 'High-Capacity Military SATCOM Feeder',
      color: 'text-rose-400'
    };
  }
  return {
    band: 'Q/V/W-Band (EHF)',
    nominalRange: '40.0 – 110 GHz',
    formattedFreq: `${freq.toFixed(3)} GHz`,
    channelClass: 'Extra-High Frequency / Quantum Link',
    color: 'text-purple-400'
  };
}

export const SIGNAL_INTERCEPTION_HOTSPOTS: InterceptionHotspot[] = [
  {
    id: 'HOTSPOT-01',
    name: 'North Atlantic Deep-Sea Tap',
    designation: 'SIGINT-NATL-01',
    lat: 54.21,
    lng: -28.14,
    signalType: 'Submarine Sub-Carrier Exfiltration',
    frequency: 14.285,
    bandwidth: 36,
    snr: 19.4,
    threatLevel: 'SEVERE',
    status: 'ACTIVE_INTERCEPT',
    encryption: 'Kyber-1024 / ML-DSA Hybrid',
    origin: 'Transatlantic Undersea Optical Cable Splice',
    pulseRate: 120,
    description: 'Intercepted unauthorized laser carrier tapping TAT-14 trunk. High-rate encrypted burst telemetry detected.',
    payloadFragment: '0x4B796265722D313032343A3A4550525F5441505F414354495645'
  },
  {
    id: 'HOTSPOT-02',
    name: 'Diego Garcia Space Tracking Facility',
    designation: 'SIGINT-IND-07',
    lat: -7.31,
    lng: 72.42,
    signalType: 'Mil-Ka Band Uplink Intercept',
    frequency: 30.45,
    bandwidth: 72,
    snr: 22.1,
    threatLevel: 'ELEVATED',
    status: 'DECRYPTING',
    encryption: 'Dilithium-5 / SHA3-512',
    origin: 'Military Geostationary Relay Beacon',
    pulseRate: 85,
    description: 'Anomalous uncatalogued side-lobe emission intercepted on 30.45 GHz carrier with FHSS hop sequence.',
    payloadFragment: '0x44494C49544849554D5F43414E4152595F5645524946494544'
  },
  {
    id: 'HOTSPOT-03',
    name: 'Svalbard Polar Orbit Downlink',
    designation: 'SIGINT-ARC-12',
    lat: 78.22,
    lng: 15.65,
    signalType: 'LEO Quantum Telemetry Eavesdrop',
    frequency: 11.75,
    bandwidth: 54,
    snr: 16.8,
    threatLevel: 'GUARDED',
    status: 'TRACKED',
    encryption: 'BB84 Quantum Key Encrypted',
    origin: 'Sun-Synchronous Earth Observation Sat',
    pulseRate: 240,
    description: 'Polar ground station pass capturing raw downlinked SAR synthetic aperture imagery with QKD session keys.',
    payloadFragment: '0x514B445F4550525F53544154455F504F4C41525F4C494E4B'
  },
  {
    id: 'HOTSPOT-04',
    name: 'Mariana Trench Relay Node',
    designation: 'SIGINT-PAC-04',
    lat: 11.35,
    lng: 142.20,
    signalType: 'Autonomous UUV Acoustic-RF Gateway',
    frequency: 8.42,
    bandwidth: 18,
    snr: 14.2,
    threatLevel: 'SEVERE',
    status: 'ACTIVE_INTERCEPT',
    encryption: 'AES-256-GCM / Ephemeral ECC',
    origin: 'Sub-surface Unmanned Recon Glider',
    pulseRate: 45,
    description: 'Surface buoy transmitting acoustic sonobuoy telemetry up to commercial L-band constellation.',
    payloadFragment: '0x5555565F5245434F4E5F5441524745545F4143515549524544'
  },
  {
    id: 'HOTSPOT-05',
    name: 'Menwith Hill Earth Station Intercept',
    designation: 'SIGINT-EUR-02',
    lat: 53.99,
    lng: -1.68,
    signalType: 'PQC Dilithium Key Exchange Leak',
    frequency: 18.25,
    bandwidth: 120,
    snr: 24.5,
    threatLevel: 'ELEVATED',
    status: 'DECRYPTING',
    encryption: 'ML-DSA-65 / Post-Quantum Lattice',
    origin: 'High-Capacity Microwave Trunk Array',
    pulseRate: 300,
    description: 'Lattice parameter negotiation intercepted during cold-boot synchronization phase.',
    payloadFragment: '0x4D4C2D4453412D36353A3A53455353494F4E5F524F54415445'
  },
  {
    id: 'HOTSPOT-06',
    name: 'Pine Gap SIGINT Collector',
    designation: 'SIGINT-AUS-09',
    lat: -23.79,
    lng: 133.74,
    signalType: 'Deep-Space Telemetry Siphon',
    frequency: 2.29,
    bandwidth: 12,
    snr: 11.4,
    threatLevel: 'GUARDED',
    status: 'JAMMED',
    encryption: 'Custom Military FPGA Cipher',
    origin: 'Classified Geosynchronous SIGINT Craft',
    pulseRate: 60,
    description: 'Tactical spread-spectrum jamming deployed against collector beam. Carrier lock broken.',
    payloadFragment: '0x45575F4A414D4D494E475F4E554C4C5F5354454552494E47'
  },
  {
    id: 'HOTSPOT-07',
    name: 'Gibraltar Strait Chokepoint Tap',
    designation: 'SIGINT-MED-03',
    lat: 36.14,
    lng: -5.35,
    signalType: 'Dark-Vessel AIS / VHF Relay',
    frequency: 162.025,
    bandwidth: 0.025,
    snr: 18.2,
    threatLevel: 'ELEVATED',
    status: 'ACTIVE_INTERCEPT',
    encryption: 'Proprietary Maritime Scrambler',
    origin: 'Spoofed Tanker Transponder Hub',
    pulseRate: 30,
    description: 'Spoofed automatic identification signals hiding sanctioned fleet movements in western Mediterranean.',
    payloadFragment: '0x4441524B5F56455353454C5F4D4D53495F53504F4F464544'
  },
  {
    id: 'HOTSPOT-08',
    name: 'Okinawa Naval Air Station Outskirts',
    designation: 'SIGINT-EAS-05',
    lat: 26.35,
    lng: 127.80,
    signalType: 'Tactical Data Link-16 Interception',
    frequency: 0.969,
    bandwidth: 255,
    snr: 21.0,
    threatLevel: 'SEVERE',
    status: 'ACTIVE_INTERCEPT',
    encryption: 'Link-16 Crypto Variable M',
    origin: 'Carrier Strike Group Airborne Relay',
    pulseRate: 180,
    description: 'Real-time situational awareness broadcast frames demodulated; track correlation in progress.',
    payloadFragment: '0x4C494E4B31365F545241434B5F564543544F525F343932'
  },
  {
    id: 'HOTSPOT-09',
    name: 'Hawaii Pacific Command Gateway',
    designation: 'SIGINT-PAC-11',
    lat: 21.35,
    lng: -157.92,
    signalType: 'Quantum Entangled Eavesdrop',
    frequency: 12.50,
    bandwidth: 40,
    snr: 20.3,
    threatLevel: 'GUARDED',
    status: 'DECRYPTING',
    encryption: 'Bell-State QKD Protocol',
    origin: 'Trans-Pacific SATCOM Hub',
    pulseRate: 95,
    description: 'Quantum state tomography indicates potential beam-splitting attack on free-space downlink.',
    payloadFragment: '0x42454C4C5F53544154455F5048495F504C55535F53574150'
  },
  {
    id: 'HOTSPOT-10',
    name: 'Ascension Island SATCOM Terminal',
    designation: 'SIGINT-SATL-06',
    lat: -7.93,
    lng: -14.36,
    signalType: 'COMSAT Wideband Feeder Link',
    frequency: 28.50,
    bandwidth: 500,
    snr: 23.8,
    threatLevel: 'NOMINAL',
    status: 'TRACKED',
    encryption: 'Commercial High-Throughput Stream',
    origin: 'Mid-Atlantic Gateway Station',
    pulseRate: 50,
    description: 'Routine monitoring of trans-oceanic satellite data feeder. Integrity verified nominal.',
    payloadFragment: '0x4854535F4645454445525F4C494E4B5F4E4F4D494E414C'
  },
  {
    id: 'HOTSPOT-11',
    name: 'Cape Canaveral Launch Range',
    designation: 'SIGINT-USA-08',
    lat: 28.39,
    lng: -80.60,
    signalType: 'S-Band Booster Telemetry Sniff',
    frequency: 2.25,
    bandwidth: 8,
    snr: 25.0,
    threatLevel: 'NOMINAL',
    status: 'TRACKED',
    encryption: 'Telemetry Standard IRIG-106',
    origin: 'Commercial Heavy Launch Vehicle',
    pulseRate: 100,
    description: 'Flight computer inertial telemetry and stage separation ordnance triggers captured in real-time.',
    payloadFragment: '0x495249475F5354414745325F49474E4954494F4E5F4F4B'
  },
  {
    id: 'HOTSPOT-12',
    name: 'Thule Arctic Phased Array Station',
    designation: 'SIGINT-GRN-01',
    lat: 76.53,
    lng: -68.70,
    signalType: 'UHF Ballistic Early Warning Intercept',
    frequency: 0.435,
    bandwidth: 15,
    snr: 17.5,
    threatLevel: 'SEVERE',
    status: 'ACTIVE_INTERCEPT',
    encryption: 'Classified NORAD Data Protocol',
    origin: 'Solid State Phased Array Radar',
    pulseRate: 500,
    description: 'Monopulse radar tracking telemetry intercepted. Target trajectory azimuth 014° elevation 38°.',
    payloadFragment: '0x5048415345445F41525241595F545241434B5F414C455254'
  }
];

// High-fidelity GeoJSON feature collection of world continents for tactical D3 rendering
// Guaranteed offline, zero network requests, perfectly suited for d3.geoOrthographic
export const WORLD_CONTINENTS_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    // North America
    {
      type: "Feature",
      properties: { name: "North America" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-168, 65], [-160, 71], [-140, 70], [-125, 69], [-105, 69], [-85, 70],
            [-75, 62], [-65, 58], [-55, 52], [-60, 44], [-70, 42], [-75, 36],
            [-80, 25], [-82, 23], [-90, 21], [-97, 26], [-97, 20], [-90, 16],
            [-85, 12], [-83, 8], [-77, 8], [-80, 15], [-92, 16], [-105, 20],
            [-106, 24], [-110, 28], [-117, 32], [-124, 38], [-124, 48], [-130, 54],
            [-138, 58], [-150, 60], [-160, 58], [-168, 65]
          ]
        ]
      }
    },
    // South America
    {
      type: "Feature",
      properties: { name: "South America" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-77, 8], [-72, 11], [-60, 8], [-50, 0], [-35, -5], [-35, -10],
            [-38, -15], [-42, -22], [-50, -30], [-55, -38], [-65, -52], [-70, -55],
            [-75, -50], [-74, -40], [-72, -30], [-70, -18], [-80, -5], [-77, 8]
          ]
        ]
      }
    },
    // Eurasia (Europe + Asia)
    {
      type: "Feature",
      properties: { name: "Eurasia" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-9, 36], [-9, 43], [2, 51], [8, 55], [12, 58], [25, 71],
            [40, 68], [60, 73], [80, 73], [100, 76], [120, 73], [140, 72],
            [170, 66], [180, 65], [170, 60], [160, 53], [145, 45], [130, 42],
            [122, 38], [120, 32], [118, 22], [108, 16], [100, 14], [103, 2],
            [98, 8], [90, 22], [80, 16], [76, 8], [72, 20], [60, 25],
            [55, 27], [50, 30], [36, 32], [32, 35], [26, 40], [20, 37],
            [12, 44], [0, 40], [-6, 36], [-9, 36]
          ]
        ]
      }
    },
    // Africa
    {
      type: "Feature",
      properties: { name: "Africa" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-6, 36], [10, 37], [25, 32], [32, 31], [35, 27], [43, 12],
            [51, 12], [45, 2], [40, -10], [35, -20], [32, -28], [28, -33],
            [18, -34], [12, -22], [10, -5], [5, 4], [0, 6], [-12, 6],
            [-17, 15], [-17, 21], [-12, 28], [-6, 36]
          ]
        ]
      }
    },
    // Australia
    {
      type: "Feature",
      properties: { name: "Australia" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [114, -22], [124, -15], [136, -12], [142, -10], [146, -16], [153, -28],
            [150, -37], [140, -38], [130, -32], [115, -34], [114, -22]
          ]
        ]
      }
    },
    // Antarctica
    {
      type: "Feature",
      properties: { name: "Antarctica" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-180, -78], [-140, -75], [-100, -72], [-60, -65], [-20, -70],
            [20, -70], [60, -67], [100, -66], [140, -67], [180, -78],
            [180, -89], [-180, -89], [-180, -78]
          ]
        ]
      }
    },
    // Greenland
    {
      type: "Feature",
      properties: { name: "Greenland" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-44, 60], [-35, 65], [-25, 70], [-20, 77], [-30, 83], [-50, 82],
            [-58, 77], [-52, 70], [-44, 60]
          ]
        ]
      }
    },
    // British Isles
    {
      type: "Feature",
      properties: { name: "British Isles" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-5, 50], [1, 51], [1, 53], [-1, 55], [-2, 58], [-5, 58],
            [-6, 54], [-5, 50]
          ]
        ]
      }
    },
    // Japan
    {
      type: "Feature",
      properties: { name: "Japan" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [130, 31], [135, 34], [140, 36], [142, 43], [140, 45], [138, 38],
            [133, 33], [130, 31]
          ]
        ]
      }
    }
  ]
};
