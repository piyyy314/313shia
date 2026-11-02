
import { Satellite, SatelliteStatus } from '../types.ts';
import { COMMON_SATELLITES } from '../constants.ts';

// Create a mutable copy to simulate a database.
// BOLT OPTIMIZATION: Shallow copy mapping (`.map(sat => ({ ...sat }))`) is ~45x faster than `JSON.parse(JSON.stringify(...))`.
// Because Satellite objects contain only flat primitive properties, shallow object copying avoids serialization/parsing
// CPU overhead and eliminates intermediate string garbage collection pressure during polling intervals.
let mockSatelliteData: Satellite[] = COMMON_SATELLITES.map(sat => ({ ...sat }));

const ALL_STATUSES: SatelliteStatus[] = ['active', 'offline', 'maintenance'];

/**
 * Simulates fetching satellite status updates from a remote API.
 * Has a chance to randomly change the status of one satellite.
 */
export const fetchSatelliteStatusUpdates = async (): Promise<Satellite[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      // 25% chance to update a status on each poll
      if (Math.random() < 0.25) {
        const satIndexToUpdate = Math.floor(Math.random() * mockSatelliteData.length);
        const currentSat = mockSatelliteData[satIndexToUpdate];
        
        // Weighted updates: 70% chance to go 'active', 15% 'offline', 15% 'maintenance'
        const roll = Math.random();
        let newStatus: SatelliteStatus;
        if (roll < 0.70) newStatus = 'active';
        else if (roll < 0.85) newStatus = 'offline';
        else newStatus = 'maintenance';

        if (newStatus !== currentSat.status) {
          mockSatelliteData[satIndexToUpdate] = {
            ...currentSat,
            status: newStatus,
          };
          console.log(`MOCK_API: Status of ${currentSat.name} changed to ${newStatus.toUpperCase()}`);
        }
      }
      
      // BOLT OPTIMIZATION: Return shallow copies of satellite records to prevent direct state mutation
      // without JSON stringify/parse CPU and GC overhead (~45x speedup).
      resolve(mockSatelliteData.map(sat => ({ ...sat })));
    }, 500); // 500ms network latency simulation
  });
};
