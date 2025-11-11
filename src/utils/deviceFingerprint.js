/**
 * Device Fingerprinting Utility
 * Detect and create unique fingerprints for user devices
 */

import crypto from 'crypto';
import logger from './logger';

/**
 * Parse User Agent String
 * @param {string} userAgent - User agent string from request
 * @returns {object} - Parsed device information
 */
export function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      type: 'unknown',
      browser: 'unknown',
      browserVersion: 'unknown',
      os: 'unknown',
      osVersion: 'unknown',
      platform: 'unknown',
    };
  }

  const device = {
    type: 'desktop',
    browser: 'unknown',
    browserVersion: 'unknown',
    os: 'unknown',
    osVersion: 'unknown',
    platform: 'unknown',
    userAgent,
  };

  // Detect device type
  if (/mobile/i.test(userAgent)) {
    device.type = 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    device.type = 'tablet';
  }

  // Detect browser
  if (/edg/i.test(userAgent)) {
    device.browser = 'Edge';
    const match = userAgent.match(/edg\/(\d+\.\d+)/i);
    device.browserVersion = match ? match[1] : 'unknown';
  } else if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
    device.browser = 'Chrome';
    const match = userAgent.match(/chrome\/(\d+\.\d+)/i);
    device.browserVersion = match ? match[1] : 'unknown';
  } else if (/firefox/i.test(userAgent)) {
    device.browser = 'Firefox';
    const match = userAgent.match(/firefox\/(\d+\.\d+)/i);
    device.browserVersion = match ? match[1] : 'unknown';
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    device.browser = 'Safari';
    const match = userAgent.match(/version\/(\d+\.\d+)/i);
    device.browserVersion = match ? match[1] : 'unknown';
  } else if (/opera|opr/i.test(userAgent)) {
    device.browser = 'Opera';
    const match = userAgent.match(/(?:opera|opr)\/(\d+\.\d+)/i);
    device.browserVersion = match ? match[1] : 'unknown';
  }

  // Detect OS
  if (/windows/i.test(userAgent)) {
    device.os = 'Windows';
    if (/windows nt 10/i.test(userAgent)) {
      device.osVersion = '10/11';
    } else if (/windows nt 6.3/i.test(userAgent)) {
      device.osVersion = '8.1';
    } else if (/windows nt 6.2/i.test(userAgent)) {
      device.osVersion = '8';
    } else if (/windows nt 6.1/i.test(userAgent)) {
      device.osVersion = '7';
    }
  } else if (/macintosh|mac os x/i.test(userAgent)) {
    device.os = 'macOS';
    const match = userAgent.match(/mac os x (\d+[._]\d+)/i);
    if (match) {
      device.osVersion = match[1].replace('_', '.');
    }
  } else if (/linux/i.test(userAgent)) {
    device.os = 'Linux';
  } else if (/android/i.test(userAgent)) {
    device.os = 'Android';
    const match = userAgent.match(/android (\d+\.\d+)/i);
    device.osVersion = match ? match[1] : 'unknown';
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    device.os = 'iOS';
    const match = userAgent.match(/os (\d+[._]\d+)/i);
    if (match) {
      device.osVersion = match[1].replace('_', '.');
    }
  }

  // Detect platform
  if (/win/i.test(userAgent)) {
    device.platform = 'Win32';
  } else if (/mac/i.test(userAgent)) {
    device.platform = 'MacIntel';
  } else if (/linux/i.test(userAgent)) {
    device.platform = 'Linux';
  }

  return device;
}

/**
 * Get IP Address from Request
 * @param {object} request - Next.js request object
 * @returns {string} - IP address
 */
export function getIPAddress(request) {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to connection remote address (not always available in Edge runtime)
  return '0.0.0.0'; // Default if unavailable
}

/**
 * Generate Device Fingerprint
 * Creates a unique hash based on device characteristics
 * @param {object} deviceInfo - Device information
 * @param {string} ipAddress - IP address
 * @returns {string} - Unique device fingerprint
 */
export function generateFingerprint(deviceInfo, ipAddress) {
  const fingerprintString = [
    deviceInfo.browser,
    deviceInfo.browserVersion,
    deviceInfo.os,
    deviceInfo.osVersion,
    deviceInfo.platform,
    ipAddress.split('.').slice(0, 3).join('.'), // First 3 octets of IP (allow DHCP changes)
  ].join('|');

  // Create SHA-256 hash
  const hash = crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex');

  logger.debug('Device fingerprint generated', {
    fingerprint: hash.substring(0, 16),
    browser: deviceInfo.browser,
    os: deviceInfo.os,
  });

  return hash;
}

/**
 * Get Complete Device Information
 * @param {object} request - Next.js request object
 * @returns {object} - Complete device info with fingerprint
 */
export function getDeviceInfo(request) {
  const userAgent = request.headers.get('user-agent') || '';
  const ipAddress = getIPAddress(request);

  const deviceInfo = parseUserAgent(userAgent);
  const fingerprint = generateFingerprint(deviceInfo, ipAddress);

  return {
    ...deviceInfo,
    ipAddress,
    fingerprint,
  };
}

/**
 * Compare Device Fingerprints
 * @param {string} fingerprint1 - First fingerprint
 * @param {string} fingerprint2 - Second fingerprint
 * @returns {boolean} - True if fingerprints match
 */
export function compareFingerprints(fingerprint1, fingerprint2) {
  return fingerprint1 === fingerprint2;
}

/**
 * Check if Device is Mobile
 * @param {string} userAgent - User agent string
 * @returns {boolean} - True if mobile device
 */
export function isMobileDevice(userAgent) {
  if (!userAgent) return false;
  return /mobile|android|iphone|ipad|ipod/i.test(userAgent);
}

/**
 * Check if Device is Tablet
 * @param {string} userAgent - User agent string
 * @returns {boolean} - True if tablet device
 */
export function isTabletDevice(userAgent) {
  if (!userAgent) return false;
  return /tablet|ipad/i.test(userAgent) && !/mobile/i.test(userAgent);
}

/**
 * Get Simplified Device Name
 * @param {object} deviceInfo - Device information
 * @returns {string} - Human-readable device name
 */
export function getDeviceName(deviceInfo) {
  const parts = [];

  if (deviceInfo.browser !== 'unknown') {
    parts.push(deviceInfo.browser);
  }

  if (deviceInfo.os !== 'unknown') {
    parts.push(`on ${deviceInfo.os}`);
  }

  if (deviceInfo.type !== 'desktop') {
    parts.push(`(${deviceInfo.type})`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Unknown Device';
}

/**
 * Example usage:
 *
 * import { getDeviceInfo } from '@/utils/deviceFingerprint';
 *
 * export async function POST(request) {
 *   const deviceInfo = getDeviceInfo(request);
 *
 *   console.log('Device:', deviceInfo.browser, deviceInfo.os);
 *   console.log('IP:', deviceInfo.ipAddress);
 *   console.log('Fingerprint:', deviceInfo.fingerprint);
 * }
 */
